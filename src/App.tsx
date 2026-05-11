import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Account, AccountDraft, AuditEntry, Filters, NoteEntry, ViewMode, Week } from './types';
import type { Milestone } from './types';
import {
  SEED_PMOS, SEED_IMPL_LEADS, SEED_WEEKS, SEED_MILESTONES, SEED_ACCOUNTS,
  STATUS_OPTS, uid,
} from './data';
import { TopBar }      from './components/TopBar';
import { Sidebar }     from './components/Sidebar';
import { Header }      from './components/Header';
import { FilterBar }   from './components/FilterBar';
import { Grid }        from './components/Grid';
import { SidePanel }   from './components/SidePanel';
import { LegendModal }       from './components/LegendModal';
import { GoLiveDatePicker }  from './components/GoLiveDatePicker';

const MAX_PER_CELL   = 3;
const COL_PAGE_SIZE  = 4;

/** Returns the index of the week that contains today, or 0 if today is before all weeks. */
function currentWeekIndex(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Walk backwards from the end — the last week whose startDate ≤ today is the current week.
  for (let i = SEED_WEEKS.length - 1; i >= 0; i--) {
    const start = new Date(SEED_WEEKS[i].startDate + 'T00:00:00');
    if (start <= today) return i;
  }
  return 0; // today is before all weeks — show from the first week
}

type PanelState = { type: 'edit'; id: string } | null;

export default function App() {
  const [activeNav, setActiveNav] = useState('rota');

  const [milestones, setMilestones] = useState<Milestone[]>(SEED_MILESTONES);
  const [accounts, setAccounts]     = useState<Account[]>(SEED_ACCOUNTS);

  const [panel, setPanel]         = useState<PanelState>(null);
  const [colPage, setColPage]     = useState(0);
  const [viewMode, setViewMode]   = useState<ViewMode>('pmo');
  const [legendOpen, setLegendOpen] = useState(false);
  const [filters, setFilters]     = useState<Filters>({
    search: '', statuses: [], pmoIds: [], implLeadIds: [], milestoneIds: [],
    fromWeek: SEED_WEEKS[currentWeekIndex()].id,       // resolved to defaultFromWeek after mount
    toWeek:   SEED_WEEKS[Math.min(currentWeekIndex() + 11, SEED_WEEKS.length - 1)].id,  // defaultToWeek
    dayDate:  '',    // only used in day mode
    dayMode:  'week',
    region:   'UK',
  });

  const dragRef = useRef<{
    accountId: string;
    fromWeekId: string;
    fromColumnId: string;
    viewMode: ViewMode;
  } | null>(null);

  const [toast, setToast]       = useState<string | null>(null);
  const [undoSnap, setUndoSnap] = useState<Account[] | null>(null);
  const toastTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Pending drag-drop waiting for confirmation */
  type DropConfirm = {
    accountId:   string;
    accountName: string;
    action:      string;
    toastMsg:    string;
    isDayDrop:   boolean;
    toRowId:     string;
    toColumnId:  string;
    colField:    string;
  };
  const [dropConfirm, setDropConfirm] = useState<DropConfirm | null>(null);

  /* Pending week-change drop — shows the date-picker calendar */
  type GoLivePicker = {
    accountId:        string;
    accountName:      string;
    toWeekId:         string;
    toColumnId:       string;
    colField:         string;
    initialMonthISO:  string;
    /* column change — both null when only week changes */
    colLabel:         string | null;
    fromColName:      string | null;
    toColName:        string | null;
    /* extra human-readable changes (from panel save) */
    additionalChanges: string[];
    /* full draft to apply on confirm (panel-save path only) */
    pendingDraft:     AccountDraft | null;
    /* suppress the "cannot be changed" warning for the Request flow */
    hideWarningBanner?: boolean;
  };
  const [goLivePicker, setGoLivePicker] = useState<GoLivePicker | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => { setToast(null); setUndoSnap(null); }, 6000);
  }

  const weeks     = SEED_WEEKS;
  const pmos      = SEED_PMOS;
  const implLeads = SEED_IMPL_LEADS;

  const curIdx          = currentWeekIndex();
  const defaultFromWeek = SEED_WEEKS[curIdx].id;
  const defaultToWeek   = SEED_WEEKS[Math.min(curIdx + 11, SEED_WEEKS.length - 1)].id;

  /* ── Column pagination (switches between PMO / Impl Lead based on viewMode) ── */
  const filteredPmos = filters.pmoIds.length > 0
    ? pmos.filter(p => filters.pmoIds.includes(p.id)) : pmos;
  const filteredImplLeads = filters.implLeadIds.length > 0
    ? implLeads.filter(l => filters.implLeadIds.includes(l.id)) : implLeads;

  const activeColumns    = viewMode === 'pmo' ? filteredPmos : filteredImplLeads;
  const totalColPages    = Math.max(1, Math.ceil(activeColumns.length / COL_PAGE_SIZE));
  const safeColPage      = Math.min(colPage, totalColPages - 1);
  const visibleColumns   = activeColumns.slice(safeColPage * COL_PAGE_SIZE, (safeColPage + 1) * COL_PAGE_SIZE);
  const colFrom          = safeColPage * COL_PAGE_SIZE + 1;
  const colTo            = Math.min((safeColPage + 1) * COL_PAGE_SIZE, activeColumns.length);

  /* Reset page on filter or view mode change */
  useEffect(() => { setColPage(0); }, [filters.pmoIds.join(','), filters.implLeadIds.join(','), viewMode]); // eslint-disable-line

  /* ── Grid rows: which rows appear and in what order ── */
  const gridRows: Week[] = (() => {
    const fromIdx    = Math.max(0, weeks.findIndex(w => w.id === filters.fromWeek));
    const rawTo      = weeks.findIndex(w => w.id === filters.toWeek);
    const toIdx      = Math.max(fromIdx, rawTo < 0 ? weeks.length - 1 : rawTo);
    const rangeWeeks = weeks.slice(fromIdx, toIdx + 1);

    if (filters.dayMode === 'day') {
      /* Day view — expand each week in the selected range into 7 individual day rows */
      const DOW  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const MNTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return rangeWeeks.flatMap(w =>
        Array.from({ length: 7 }, (_, i) => {
          const [wy, wm, wd] = w.startDate.split('-').map(Number);
          const d = new Date(wy, wm - 1, wd + i);
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return { id: iso, label: `${d.getDate()} ${MNTH[d.getMonth()]}, ${DOW[d.getDay()]}`, startDate: iso };
        })
      );
    }

    /* Week view — current week first, upcoming only */
    const t   = new Date();
    const dow = t.getDay();
    t.setDate(t.getDate() + (dow === 0 ? -6 : 1 - dow));
    const todayMonday = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const upcoming = rangeWeeks.filter(w => w.startDate >= todayMonday);
    return upcoming.length > 0 ? upcoming : rangeWeeks;
  })();

  const rowMode = filters.dayMode; // 'week' | 'day' — passed to Grid

  /* ── Visible accounts ── */
  const visible = (() => {
    /* Build week-range set once */
    const fromIdx    = Math.max(0, weeks.findIndex(w => w.id === filters.fromWeek));
    const rawTo      = weeks.findIndex(w => w.id === filters.toWeek);
    const toIdx      = Math.max(fromIdx, rawTo < 0 ? weeks.length - 1 : rawTo);
    const rangeIds   = new Set(weeks.slice(fromIdx, toIdx + 1).map(w => w.id));

    return accounts.filter(a => {
      if (filters.search && !a.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.statuses.length     && !filters.statuses.includes(a.status))            return false;
      if (filters.milestoneIds.length && !filters.milestoneIds.includes(a.milestoneId))   return false;
      if (viewMode === 'pmo'       && filters.pmoIds.length      && !filters.pmoIds.includes(a.pmoId))                     return false;
      if (viewMode === 'impl-lead' && filters.implLeadIds.length && !filters.implLeadIds.includes(a.implementationLeadId)) return false;
      /* Both modes: restrict to the selected week range */
      if (!rangeIds.has(a.weekId)) return false;
      return true;
    });
  })();

  const selectedId = panel?.type === 'edit' ? panel.id : null;

  /* ── Drag & drop ── */
  const handleDrop = useCallback((toRowId: string, toColumnId: string) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;

    const mode        = drag.viewMode;
    const colList     = mode === 'pmo' ? pmos : implLeads;
    const colLabel    = mode === 'pmo' ? 'PMO' : 'Impl. Lead';
    const fromColName = colList.find(c => c.id === drag.fromColumnId)?.name ?? drag.fromColumnId;
    const toColName   = colList.find(c => c.id === toColumnId)?.name ?? toColumnId;
    const colField    = mode === 'pmo' ? 'pmoId' : 'implementationLeadId';
    const isDayDrop   = /^\d{4}-\d{2}-\d{2}$/.test(toRowId);
    const accountName = accounts.find(a => a.id === drag.accountId)?.name ?? 'Account';

    if (isDayDrop) {
      /* Day-mode drop — only column (PMO/IL) can change; use simple confirm */
      if (drag.fromColumnId === toColumnId) return;
      const action = `${colLabel} changed from ${fromColName} to ${toColName}`;
      setDropConfirm({
        accountId: drag.accountId, accountName,
        action, toastMsg: `${colLabel} changed to ${toColName}`,
        isDayDrop: true, toRowId, toColumnId, colField,
      });
    } else {
      if (drag.fromWeekId === toRowId && drag.fromColumnId === toColumnId) return;

      if (drag.fromWeekId !== toRowId) {
        /* Week is changing — open the date picker calendar */
        const targetWeek = weeks.find(w => w.id === toRowId);
        const colChanged = drag.fromColumnId !== toColumnId;
        setGoLivePicker({
          accountId: drag.accountId, accountName,
          toWeekId: toRowId, toColumnId, colField,
          initialMonthISO: targetWeek?.startDate ?? new Date().toISOString().slice(0, 10),
          colLabel:    colChanged ? colLabel    : null,
          fromColName: colChanged ? fromColName : null,
          toColName:   colChanged ? toColName   : null,
          additionalChanges: [],
          pendingDraft: null,
        });
      } else {
        /* Same week, only column changing — simple confirm */
        const action = `${colLabel} changed from ${fromColName} to ${toColName}`;
        const toWeekLabel = weeks.find(w => w.id === toRowId)?.label ?? toRowId;
        setDropConfirm({
          accountId: drag.accountId, accountName,
          action, toastMsg: `Moved to ${toWeekLabel} · ${toColName}`,
          isDayDrop: false, toRowId, toColumnId, colField,
        });
      }
    }
  }, [pmos, implLeads, weeks, accounts]);

  /* ── Confirm pending drop ── */
  function confirmDrop() {
    if (!dropConfirm) return;
    const { accountId, action, toastMsg, isDayDrop, toRowId, toColumnId, colField } = dropConfirm;
    setDropConfirm(null);
    setAccounts(prev => {
      setUndoSnap(prev);
      const entry: AuditEntry = { id: uid(), user: 'PMO Lead', action, ts: Date.now() };
      return prev.map(a =>
        a.id === accountId
          ? isDayDrop
            ? { ...a, [colField]: toColumnId, audit: [entry, ...a.audit] }
            : { ...a, weekId: toRowId, [colField]: toColumnId, audit: [entry, ...a.audit] }
          : a
      );
    });
    showToast(toastMsg);
  }

  /* ── Confirm date-picker selection ── */
  function confirmGoLiveDate(selectedISO: string) {
    if (!goLivePicker) return;
    const { accountId, toWeekId, toColumnId, colField, colLabel, fromColName, toColName,
            additionalChanges, pendingDraft } = goLivePicker;
    const toWeekLabel = weeks.find(w => w.id === toWeekId)?.label ?? toWeekId;
    setGoLivePicker(null);

    if (pendingDraft) {
      /* ── Panel-save path: apply the full draft with the selected date ── */
      const current = accounts.find(a => a.id === accountId);
      if (!current) return;
      const newNoteText = pendingDraft.notes.trim();
      const updatedNotes: NoteEntry[] = newNoteText
        ? [{ id: uid(), user: 'PMO Lead', text: newNoteText, ts: Date.now() }, ...current.notes]
        : current.notes;
      const auditParts = [...additionalChanges,
        `Week changed to ${toWeekLabel}`, `Planned day set to ${selectedISO}`];
      const entry: AuditEntry = { id: uid(), user: 'PMO Lead', action: auditParts.join(' · '), ts: Date.now() };
      setAccounts(prev => {
        setUndoSnap(prev);
        return prev.map(a =>
          a.id === accountId
            ? { ...a,
                pmoId:                pendingDraft.pmoId,
                implementationLeadId: pendingDraft.implementationLeadId,
                weekId:               toWeekId,
                plannedDay:           selectedISO,
                confirmed:            pendingDraft.confirmed,
                notes:                updatedNotes,
                audit:                [entry, ...a.audit],
              }
            : a
        );
      });
      setPanel(null);
      showToast('Changes saved');
    } else {
      /* ── Drag-drop path ── */
      const parts = [`Week changed to ${toWeekLabel}`, `Planned day set to ${selectedISO}`];
      if (colLabel && fromColName && toColName)
        parts.push(`${colLabel} changed from ${fromColName} to ${toColName}`);
      const entry: AuditEntry = { id: uid(), user: 'PMO Lead', action: parts.join(' · '), ts: Date.now() };
      setAccounts(prev => {
        setUndoSnap(prev);
        return prev.map(a =>
          a.id === accountId
            ? { ...a, weekId: toWeekId, [colField]: toColumnId, plannedDay: selectedISO, audit: [entry, ...a.audit] }
            : a
        );
      });
      showToast(`Moved to ${toWeekLabel} · ${selectedISO}`);
    }
  }

  /* ── Panel save ── */
  function handlePanelSave(draft: AccountDraft) {
    const accountId = panel?.type === 'edit' ? panel.id : null;
    if (!accountId) return;
    const current = accounts.find(a => a.id === accountId);
    if (!current) return;

    /* If the week changed, route through the date picker */
    if (draft.weekId !== current.weekId) {
      const targetWeek = weeks.find(w => w.id === draft.weekId);
      const otherChanges: string[] = [];
      if (draft.pmoId !== current.pmoId)
        otherChanges.push(`PMO → ${pmos.find(p => p.id === draft.pmoId)?.name ?? draft.pmoId}`);
      if (draft.implementationLeadId !== current.implementationLeadId)
        otherChanges.push(`Impl. Lead → ${implLeads.find(l => l.id === draft.implementationLeadId)?.name ?? draft.implementationLeadId}`);
      if (draft.confirmed !== current.confirmed)
        otherChanges.push(draft.confirmed ? 'Confirmed Go-Live → Yes' : 'Confirmed Go-Live → No');
      if (draft.notes.trim())
        otherChanges.push('New comment added');
      setGoLivePicker({
        accountId, accountName: current.name,
        toWeekId: draft.weekId,
        toColumnId: draft.pmoId,   // not used on panel-save path
        colField: 'pmoId',         // not used on panel-save path
        initialMonthISO: targetWeek?.startDate ?? new Date().toISOString().slice(0, 10),
        colLabel: null, fromColName: null, toColName: null,
        additionalChanges: otherChanges,
        pendingDraft: draft,
      });
      return;
    }

    /* No week change — save immediately */
    const changes: string[] = [];
    if (draft.pmoId                !== current.pmoId)                changes.push(`PMO changed to ${pmos.find(p => p.id === draft.pmoId)?.name ?? draft.pmoId}`);
    if (draft.implementationLeadId !== current.implementationLeadId) changes.push(`Impl. Lead changed to ${implLeads.find(l => l.id === draft.implementationLeadId)?.name ?? draft.implementationLeadId}`);
    if (draft.plannedDay           !== current.plannedDay)           changes.push(`Planned Day changed to ${draft.plannedDay || 'unset'}`);
    if (draft.confirmed            !== current.confirmed)            changes.push(draft.confirmed ? 'Marked as Confirmed' : 'Marked as Tentative');

    const newNoteText = draft.notes.trim();
    const updatedNotes: NoteEntry[] = newNoteText
      ? [{ id: uid(), user: 'PMO Lead', text: newNoteText, ts: Date.now() }, ...current.notes]
      : current.notes;

    const auditMsg = changes.join(' · ') || (newNoteText ? 'Comment added' : 'No changes');
    const entry: AuditEntry = { id: uid(), user: 'PMO Lead', action: auditMsg, ts: Date.now() };

    setAccounts(prev => prev.map(a =>
      a.id === accountId
        ? { ...a,
            pmoId:                draft.pmoId,
            implementationLeadId: draft.implementationLeadId,
            weekId:               draft.weekId,
            plannedDay:           draft.plannedDay,
            confirmed:            draft.confirmed,
            notes:                updatedNotes,
            audit:                [entry, ...a.audit],
          }
        : a
    ));
    setPanel(null);
    showToast('Changes saved');
  }

  /* ── Request new go-live date from the panel ── */
  function handleRequestNewDate() {
    const accountId = panel?.type === 'edit' ? panel.id : null;
    if (!accountId) return;
    const current = accounts.find(a => a.id === accountId);
    if (!current) return;
    const currentWeek = weeks.find(w => w.id === current.weekId);
    setGoLivePicker({
      accountId, accountName: current.name,
      toWeekId: current.weekId,
      toColumnId: current.pmoId,
      colField: 'pmoId',
      initialMonthISO: currentWeek?.startDate ?? new Date().toISOString().slice(0, 10),
      colLabel: null, fromColName: null, toColName: null,
      additionalChanges: [],
      pendingDraft: null,
      hideWarningBanner: true,
    });
  }

  /* ── Stats ── */
  const statusCounts = {
    'on-track':        visible.filter(a => a.status === 'on-track').length,
    'minor-issue':     visible.filter(a => a.status === 'minor-issue').length,
    'needs-attention': visible.filter(a => a.status === 'needs-attention').length,
    'critical':        visible.filter(a => a.status === 'critical').length,
  } as Record<import('./types').Status, number>;

  const panelAccount = panel?.type === 'edit' ? accounts.find(a => a.id === panel.id) ?? null : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#F3F4F6' }}>

      <TopBar />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar activeId={activeNav} onNavigate={setActiveNav} />

        {activeNav === 'rota' ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>

            <Header
              statusCounts={statusCounts}
              onOpenLegend={() => setLegendOpen(true)}
              colFrom={colFrom} colTo={colTo} colTotal={activeColumns.length}
              colLabel={viewMode === 'pmo' ? 'PMO' : 'Impl. Lead'}
              canPrev={safeColPage > 0}
              canNext={safeColPage < totalColPages - 1}
              onPrev={() => setColPage(p => Math.max(0, p - 1))}
              onNext={() => setColPage(p => Math.min(totalColPages - 1, p + 1))}
            />

            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              weeks={weeks}
              pmos={pmos}
              implLeads={implLeads}
              milestones={milestones}
              viewMode={viewMode}
              onViewModeChange={mode => { setViewMode(mode); setColPage(0); }}
              defaultFromWeek={defaultFromWeek}
              defaultToWeek={defaultToWeek}
            />

            <Grid
              weeks={gridRows}
              rowMode={rowMode}
              columns={visibleColumns}
              milestones={milestones}
              visible={visible}
              filters={filters}
              viewMode={viewMode}
              selectedId={selectedId}
              maxPerCell={MAX_PER_CELL}
              dragRef={dragRef}
              onSelect={id => setPanel({ type: 'edit', id })}
              onDrop={handleDrop}
            />

            {panel && panelAccount && (
              <SidePanel
                account={panelAccount}
                pmos={pmos}
                implLeads={implLeads}
                weeks={weeks}
                milestones={milestones}
                onSave={handlePanelSave}
                onClose={() => setPanel(null)}
                onRequestNewDate={handleRequestNewDate}
              />
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 32, opacity: 0.15 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#147B8D" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, color: '#9CA3AF' }}>
              {activeNav.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
            <span style={{ fontSize: 12, color: '#D1D5DB' }}>Select Rota to open the planning board</span>
          </div>
        )}
      </div>

      {/* Drag-drop confirmation modal */}
      {dropConfirm && (() => {
        /* Parse "X changed from A to B" out of the action string for chip display */
        const parts = dropConfirm.action.split(' changed from ');
        const label    = parts[0] ?? '';
        const fromTo   = parts[1]?.split(' to ') ?? [];
        const fromName = fromTo[0] ?? '';
        const toName   = fromTo[1] ?? '';

        return (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 500,
              background: 'rgba(17,24,39,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setDropConfirm(null)}
          >
            <div
              style={{
                width: 480, maxWidth: '92vw',
                background: 'var(--cf-bg-surface)',
                border: '1px solid var(--cf-border-secondary)',
                borderRadius: 'var(--cf-radius-xl)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Teal header ── */}
              <div style={{
                padding: '12px 16px', background: '#147B8D',
                display: 'flex', alignItems: 'center',
              }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  Confirm Move
                </span>
                <button onClick={() => setDropConfirm(null)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.75)', fontSize: 20, lineHeight: 1, padding: 0,
                }}>×</button>
              </div>

              {/* ── Warning banner ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 10px',
                background: '#FFF7ED',
                borderBottom: '1px solid #FDE68A',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>
                  You are about to reassign{' '}
                  <strong>{dropConfirm.accountName}</strong>.
                </p>
              </div>

              {/* ── Change summary ── */}
              <div style={{ padding: '16px 18px' }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  color: 'var(--cf-text-quaternary)', textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  Change summary
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px',
                  background: 'var(--cf-bg-chrome)',
                  border: '1px solid var(--cf-border-secondary)',
                  borderRadius: 8,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cf-text-secondary)', flexShrink: 0 }}>
                    {label}:
                  </span>
                  <span style={{
                    fontSize: 12, background: '#FEF3C7',
                    border: '1px solid #FCD34D', borderRadius: 4,
                    padding: '2px 9px', color: '#78350F', fontWeight: 600,
                  }}>{fromName}</span>
                  <span style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 300 }}>→</span>
                  <span style={{
                    fontSize: 12, background: '#D1FAE5',
                    border: '1px solid #6EE7B7', borderRadius: 4,
                    padding: '2px 9px', color: '#065F46', fontWeight: 600,
                  }}>{toName}</span>
                </div>
              </div>

              {/* ── Footer ── */}
              <div style={{
                padding: '10px 18px 14px',
                borderTop: '1px solid var(--cf-border-secondary)',
                display: 'flex', justifyContent: 'flex-end', gap: 8,
              }}>
                <button onClick={() => setDropConfirm(null)} style={{
                  height: 32, padding: '0 20px', fontSize: 13, fontWeight: 500,
                  border: '1px solid var(--cf-border-primary)',
                  borderRadius: 'var(--cf-radius-md)',
                  background: 'var(--cf-bg-surface)', color: 'var(--cf-text-secondary)',
                  cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={confirmDrop} style={{
                  height: 32, padding: '0 20px', fontSize: 13, fontWeight: 600,
                  border: '1px solid #147B8D', borderRadius: 'var(--cf-radius-md)',
                  background: '#147B8D', color: '#FFFFFF',
                  cursor: 'pointer',
                }}>Proceed</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24,
          background: '#2A9F58',
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          zIndex: 400, whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          minWidth: 260,
        }}>
          {/* Checkmark circle */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(0,0,0,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', flex: 1 }}>{toast}</span>
          {undoSnap && (
            <button onClick={() => { setAccounts(undoSnap); setUndoSnap(null); setToast(null); }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 12, textDecoration: 'underline' }}>
              Undo
            </button>
          )}
          <button onClick={() => { setToast(null); setUndoSnap(null); }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 18, lineHeight: 1, marginLeft: 2 }}>
            ×
          </button>
        </div>
      )}

      {legendOpen && (
        <LegendModal milestones={milestones} onClose={() => setLegendOpen(false)} />
      )}

      {goLivePicker && (
        <GoLiveDatePicker
          accountName={goLivePicker.accountName}
          initialMonthISO={goLivePicker.initialMonthISO}
          accounts={accounts}
          colLabel={goLivePicker.colLabel}
          fromColName={goLivePicker.fromColName}
          toColName={goLivePicker.toColName}
          additionalChanges={goLivePicker.additionalChanges}
          hideWarningBanner={goLivePicker.hideWarningBanner}
          onConfirm={confirmGoLiveDate}
          onCancel={() => setGoLivePicker(null)}
        />
      )}
    </div>
  );
}
