import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Filters, PMO, ImplementationLead, Week, Status, Milestone, ViewMode } from '../types';
import { STATUS_OPTS, STATUS_COLORS, getMilestonePalette, APP_TODAY_ISO, getAppToday } from '../data';

/* ── Date utilities (timezone-safe) ─────────────────────────────────────── */

function isoFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function todayIso(): string {
  return APP_TODAY_ISO;
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return isoFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Returns the ISO date of the Monday of the week containing `iso`. */
function getMondayIso(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow  = date.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(d + diff);
  return isoFromParts(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Parse ISO date string into { year, month (0-based), day }. */
function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

/**
 * Build a Mon-first calendar grid for the given month.
 * Returns an array of week rows; each row is 7 ISO date strings Mon→Sun.
 */
function buildMonthGrid(year: number, month: number): string[][] {
  const firstDow  = new Date(year, month, 1).getDay(); // 0=Sun
  const offset    = firstDow === 0 ? 6 : firstDow - 1; // cells before 1st
  const startDate = new Date(year, month, 1 - offset);  // Monday of row 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const numRows   = Math.ceil((daysInMonth + offset) / 7);
  const rows: string[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: string[] = [];
    for (let c = 0; c < 7; c++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + r * 7 + c);
      row.push(isoFromParts(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    rows.push(row);
  }
  return rows;
}

/* ── Constants ───────────────────────────────────────────────────────────── */

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/* ── FilterBar ────────────────────────────────────────────────────────────── */

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  weeks: Week[];
  pmos: PMO[];
  implLeads: ImplementationLead[];
  milestones: Milestone[];
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  defaultFromWeek: string;
  defaultToWeek: string;
}

export function FilterBar({
  filters, onFiltersChange,
  weeks, pmos, implLeads, milestones,
  viewMode, onViewModeChange,
  defaultFromWeek, defaultToWeek,
}: Props) {
  const set = (partial: Partial<Filters>) => onFiltersChange({ ...filters, ...partial });

  const isFullRange =
    filters.fromWeek === defaultFromWeek &&
    filters.toWeek   === defaultToWeek;

  const hasActive =
    !!filters.search ||
    filters.statuses.length > 0 ||
    filters.pmoIds.length > 0 ||
    filters.implLeadIds.length > 0 ||
    filters.milestoneIds.length > 0 ||
    filters.dayMode === 'day' ||
    !isFullRange;

  function toggleStatus(v: Status) {
    set({ statuses: filters.statuses.includes(v)
      ? filters.statuses.filter(s => s !== v)
      : [...filters.statuses, v] });
  }

  const columnOptions     = viewMode === 'pmo'
    ? pmos.map(p => ({ id: p.id, label: p.name }))
    : implLeads.map(l => ({ id: l.id, label: l.name }));
  const columnSelected    = viewMode === 'pmo' ? filters.pmoIds : filters.implLeadIds;
  const columnPlaceholder = viewMode === 'pmo' ? 'All PMOs' : 'All Impl. Leads';

  function toggleColumn(id: string) {
    if (viewMode === 'pmo') {
      set({ pmoIds: filters.pmoIds.includes(id)
        ? filters.pmoIds.filter(p => p !== id)
        : [...filters.pmoIds, id] });
    } else {
      set({ implLeadIds: filters.implLeadIds.includes(id)
        ? filters.implLeadIds.filter(l => l !== id)
        : [...filters.implLeadIds, id] });
    }
  }

  const statusOptions = STATUS_OPTS.map(s => ({
    id: s.value,
    label: s.label,
    prefix: <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.value], flexShrink: 0 }} />,
  }));

  const milestoneOptions = milestones.map(m => {
    const pal = getMilestonePalette(m.color);
    return {
      id: m.id,
      label: m.name,
      prefix: <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: pal.dot, flexShrink: 0 }} />,
    };
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap',
      padding: '8px 20px',
      background: 'var(--cf-bg-surface)',
      borderBottom: '1px solid var(--cf-border-secondary)',
      flexShrink: 0,
    }}>

      {/* Search */}
      <FilterGroup label="Search">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg style={{ position: 'absolute', left: 8, pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="#9CA3AF" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            value={filters.search}
            onChange={e => set({ search: e.target.value })}
            placeholder="Search accounts…"
            style={{ ...inputStyle, paddingLeft: 26, width: 170 }}
          />
        </div>
      </FilterGroup>

      {/* Week / Day filter */}
      <FilterGroup label={filters.dayMode === 'day' ? 'Day' : 'Week'}>
        <DateRangeFilter
          weeks={weeks}
          dayMode={filters.dayMode}
          dayDate={filters.dayDate}
          fromWeek={filters.fromWeek}
          toWeek={filters.toWeek}
          defaultFromWeek={defaultFromWeek}
          defaultToWeek={defaultToWeek}
          onChange={set}
        />
      </FilterGroup>

      {/* Region filter */}
      <FilterGroup label="Region">
        <SingleSelectDropdown
          options={[
            { id: 'UK', label: 'UK' },
            { id: 'US', label: 'US' },
            { id: 'AU', label: 'AU' },
          ]}
          value={filters.region}
          onChange={v => set({ region: v as import('../types').Region })}
        />
      </FilterGroup>

      {/* View toggle + column filter */}
      <FilterGroup label="View by">
        <div style={{ display: 'flex', gap: 4 }}>
          <div style={{
            display: 'flex', border: '1px solid #D1D5DB',
            borderRadius: 6, overflow: 'hidden', background: '#F9FAFB', flexShrink: 0,
          }}>
            {(['impl-lead','pmo'] as ViewMode[]).map(mode => (
              <button key={mode} onClick={() => onViewModeChange(mode)}
                style={{
                  height: 30, padding: '0 12px',
                  background: viewMode === mode ? '#147B8D' : 'transparent',
                  color: viewMode === mode ? '#fff' : '#6B7280',
                  fontSize: 12, fontWeight: 500,
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {mode === 'pmo' ? 'PMO' : 'Impl. Lead'}
              </button>
            ))}
          </div>
          <MultiSelectDropdown
            placeholder={columnPlaceholder}
            options={columnOptions}
            selected={columnSelected}
            onToggle={toggleColumn}
            onClear={() => viewMode === 'pmo' ? set({ pmoIds: [] }) : set({ implLeadIds: [] })}
          />
        </div>
      </FilterGroup>

      {/* Health */}
      <FilterGroup label="Health">
        <MultiSelectDropdown
          placeholder="All statuses"
          options={statusOptions}
          selected={filters.statuses}
          onToggle={v => toggleStatus(v as Status)}
          onClear={() => set({ statuses: [] })}
        />
      </FilterGroup>

      {/* Milestone */}
      <FilterGroup label="Milestone">
        <MultiSelectDropdown
          placeholder="All milestones"
          options={milestoneOptions}
          selected={filters.milestoneIds}
          onToggle={id => set({ milestoneIds: filters.milestoneIds.includes(id) ? filters.milestoneIds.filter(m => m !== id) : [...filters.milestoneIds, id] })}
          onClear={() => set({ milestoneIds: [] })}
        />
      </FilterGroup>

      {/* Clear all */}
      {hasActive && (
        <div style={{ paddingBottom: 1 }}>
          <button
            onClick={() => onFiltersChange({
              search: '', statuses: [], pmoIds: [], implLeadIds: [], milestoneIds: [],
              fromWeek: defaultFromWeek,
              toWeek:   defaultToWeek,
              dayDate:  '',
              dayMode:  'week',
              region:   'UK',
            })}
            style={{
              height: 30, padding: '0 10px', fontSize: 11, fontWeight: 500,
              background: 'none', border: '1px solid #E5E7EB', borderRadius: 6,
              color: '#6B7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/* ── DateRangeFilter ─────────────────────────────────────────────────────── */

interface DateRangeFilterProps {
  weeks:           Week[];
  dayMode:         'day' | 'week';
  dayDate:         string;
  fromWeek:        string;
  toWeek:          string;
  defaultFromWeek: string;
  defaultToWeek:   string;
  onChange: (patch: Partial<Filters>) => void;
}

function DateRangeFilter({ weeks, dayMode, dayDate, fromWeek, toWeek, defaultFromWeek, defaultToWeek, onChange }: DateRangeFilterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  /* Close on outside click */
  useEffect(() => {
    if (!popupOpen) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setPopupOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [popupOpen]);

  const isWeekMode = dayMode === 'week';

  /* ── Format chip label ── */
  function weekLabel(): string {
    const from = weeks.find(w => w.id === fromWeek);
    const to   = weeks.find(w => w.id === toWeek);
    if (!from || !to) return 'All weeks';
    const fs = parseIso(from.startDate);
    const te = parseIso(addDays(to.startDate, 6)); // Sunday of last week
    if (fs.year === te.year) {
      if (fs.month === te.month)
        return `${MONTH_SHORT[fs.month]} ${fs.day}–${te.day}, ${fs.year}`;
      return `${MONTH_SHORT[fs.month]} ${fs.day} – ${MONTH_SHORT[te.month]} ${te.day}, ${fs.year}`;
    }
    return `${MONTH_SHORT[fs.month]} ${fs.day}, ${fs.year} – ${MONTH_SHORT[te.month]} ${te.day}, ${te.year}`;
  }

  function dayLabel(): string {
    const d = dayDate || todayIso();
    const { year, month, day } = parseIso(d);
    const date = new Date(year, month, day);
    const dow  = DOW_SHORT[(date.getDay() + 6) % 7];
    return `${day} ${MONTH_SHORT[month]} ${year}, ${dow}`;
  }

  const label    = weekLabel();
  const isActive = !isWeekMode || fromWeek !== defaultFromWeek || toWeek !== defaultToWeek;

  function handleModeChange(mode: 'day' | 'week') {
    onChange({ dayMode: mode });
    setPopupOpen(false);
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>

      {/* Date chip — click to open picker */}
      <button
        onClick={() => setPopupOpen(o => !o)}
        style={{
          height: 30, padding: '0 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          border: `1px solid ${isActive ? '#4DC8B4' : 'var(--cf-border-primary)'}`,
          borderRadius: 6,
          background: isActive ? 'rgba(77,200,180,0.06)' : 'var(--cf-bg-chrome)',
          color: isActive ? '#2A9A8A' : '#9CA3AF',
          fontSize: 12, fontWeight: isActive ? 500 : 400,
          cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 172,
          transition: 'border-color 0.15s',
        }}
      >
        {/* Calendar icon */}
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        {/* Chevron — hidden when active (clear button takes its place) */}
        {!isActive && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {/* Clear × — shown only when a custom range is active */}
        {isActive && (
          <span
            role="button"
            onClick={e => {
              e.stopPropagation();
              onChange({ fromWeek: defaultFromWeek, toWeek: defaultToWeek, dayMode: 'week' });
              setPopupOpen(false);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16,
              color: '#6B7280',
              fontSize: 16, fontWeight: 700, lineHeight: 1,
              flexShrink: 0, cursor: 'pointer',
            }}
          >
            ×
          </span>
        )}
      </button>

      {/* Day | Week toggle */}
      <div style={{
        display: 'flex', border: '1px solid #D1D5DB',
        borderRadius: 6, overflow: 'hidden', background: '#F9FAFB', flexShrink: 0,
      }}>
        {(['day', 'week'] as const).map(mode => (
          <button key={mode} onClick={() => handleModeChange(mode)}
            style={{
              height: 30, padding: '0 10px',
              background: dayMode === mode ? '#147B8D' : 'transparent',
              color:      dayMode === mode ? '#fff'    : '#6B7280',
              fontSize: 12, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {mode === 'day' ? 'Day' : 'Week'}
          </button>
        ))}
      </div>

      {/* Popup — always show the week range picker regardless of mode */}
      {popupOpen && (
        <WeekRangePicker
          fromId={fromWeek}
          toId={toWeek}
          weeks={weeks}
          onApply={(fId, tId) => {
            onChange({ fromWeek: fId, toWeek: tId });
            setPopupOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ── WeekRangePicker — dual-calendar, week-row selection ─────────────────── */

interface WeekRangePickerProps {
  fromId:   string;
  toId:     string;
  weeks:    Week[];
  onApply:  (fromId: string, toId: string) => void;
}

function WeekRangePicker({ fromId, toId, weeks, onApply }: WeekRangePickerProps) {
  const weekByMonday = useMemo(() => new Map(weeks.map(w => [w.startDate, w.id])), [weeks]);
  const idToMonday   = useMemo(() => new Map(weeks.map(w => [w.id, w.startDate])), [weeks]);

  const initFrom = idToMonday.get(fromId) ?? weeks[0]?.startDate ?? '';
  const initTo   = idToMonday.get(toId)   ?? weeks[weeks.length - 1]?.startDate ?? '';

  const [phase,       setPhase]       = useState<'from' | 'to'>('from');
  const [anchor,      setAnchor]      = useState(initFrom);
  const [hoverWeek,   setHoverWeek]   = useState<string | null>(null);

  /* Calendar view — two months side by side */
  const appToday = getAppToday();
  const [calYear,  setCalYear]  = useState(appToday.getFullYear());
  const [calMonth, setCalMonth] = useState(appToday.getMonth());

  const rightMonth = calMonth === 11 ? 0 : calMonth + 1;
  const rightYear  = calMonth === 11 ? calYear + 1 : calYear;

  function navMonth(delta: -1 | 1) {
    setCalMonth(m => {
      const nm = (m + 12 + delta) % 12;
      if (delta === 1  && m === 11) setCalYear(y => y + 1);
      if (delta === -1 && m === 0)  setCalYear(y => y - 1);
      return nm;
    });
  }

  /* Compute display range (pre-click = current filter; post-click = live preview) */
  const pre = phase === 'from';
  const liveEnd   = hoverWeek ?? anchor;
  const dispFrom  = pre ? initFrom : (anchor <= liveEnd ? anchor  : liveEnd);
  const dispTo    = pre ? initTo   : (anchor <= liveEnd ? liveEnd : anchor);

  function handleWeekClick(monday: string) {
    if (!weekByMonday.has(monday)) return;
    if (phase === 'from') {
      setAnchor(monday);
      setPhase('to');
    } else {
      const a = anchor <= monday ? anchor : monday;
      const b = anchor <= monday ? monday : anchor;
      const fId = weekByMonday.get(a) ?? weeks[0].id;
      const tId = weekByMonday.get(b) ?? weeks[weeks.length - 1].id;
      onApply(fId, tId);
    }
  }

  function renderMonth(year: number, month: number) {
    const grid = buildMonthGrid(year, month);
    const today = todayIso();
    return (
      <div style={{ width: 203 }}>
        {/* Month title */}
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
          {MONTH_FULL[month]} {year}
        </div>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 29px)' }}>
          {['M','T','W','T','F','S','S'].map((h, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 600,
              color: '#9CA3AF', height: 20, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>{h}</div>
          ))}
        </div>
        {/* Week rows */}
        {grid.map((weekRow, ri) => {
          const rowMonday  = weekRow[0];
          const selectable = weekByMonday.has(rowMonday);
          const inRange    = rowMonday >= dispFrom && rowMonday <= dispTo;
          const isStart    = rowMonday === dispFrom && dispFrom !== '';
          const isEnd      = rowMonday === dispTo   && dispTo   !== '';
          const isHovered  = rowMonday === hoverWeek && !pre;

          let rowBg = 'transparent';
          if (pre && inRange) {
            rowBg = 'rgba(77,200,180,0.10)';          // subtle current-selection tint
          } else if (!pre) {
            if (isStart || isEnd) rowBg = 'rgba(20,123,141,0.18)';
            else if (inRange)     rowBg = 'rgba(77,200,180,0.14)';
            else if (isHovered && selectable) rowBg = '#F3F4F6';
          }

          return (
            <div
              key={ri}
              onMouseEnter={() => selectable && setHoverWeek(rowMonday)}
              onMouseLeave={() => setHoverWeek(null)}
              onClick={() => handleWeekClick(rowMonday)}
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 29px)',
                borderRadius: 6, background: rowBg,
                cursor: selectable ? 'pointer' : 'default',
                transition: 'background 0.1s',
                marginBottom: 1,
              }}
            >
              {weekRow.map((iso, ci) => {
                const { month: cm, day } = parseIso(iso);
                const isCurrentMonth = cm === month;
                const isTodayCel     = iso === today;
                return (
                  <div key={ci} style={{
                    height: 28, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                    color: !isCurrentMonth ? '#D1D5DB'
                          : isTodayCel    ? '#147B8D'
                          : '#374151',
                    fontWeight: isTodayCel ? 700 : 400,
                    opacity:    selectable ? 1 : 0.4,
                  }}>
                    {day}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
      background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '14px 16px',
      minWidth: 480,
    }}>
      {/* Navigation header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <button onClick={() => navMonth(-1)} style={calNavBtnStyle}>‹</button>
        <button onClick={() => navMonth(1)}  style={calNavBtnStyle}>›</button>
      </div>

      {/* Two calendars */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {renderMonth(calYear, calMonth)}
        <div style={{ width: 1, background: '#F3F4F6', alignSelf: 'stretch', flexShrink: 0 }} />
        {renderMonth(rightYear, rightMonth)}
      </div>
    </div>
  );
}

/* ── DayCalendarPopup — single-month picker for Day mode ─────────────────── */

function DayCalendarPopup({
  dayDate, onChange,
}: { dayDate: string; onChange: (iso: string) => void }) {
  const initView = dayDate
    ? (() => { const { year, month } = parseIso(dayDate); return { year, month }; })()
    : (() => { const { year, month } = parseIso(APP_TODAY_ISO); return { year, month }; })();

  const [view, setView] = useState(initView);

  function navMonth(delta: -1 | 1) {
    setView(v => {
      let m = v.month + delta;
      let y = v.year;
      if (m < 0)  { m = 11; y -= 1; }
      if (m > 11) { m = 0;  y += 1; }
      return { year: y, month: m };
    });
  }

  const today = todayIso();

  /* Build flat 42-cell grid (Mon-first) */
  function buildGrid() {
    const { year, month } = view;
    const firstDow = new Date(year, month, 1).getDay();
    const offset   = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth     = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells: { iso: string; day: number; current: boolean }[] = [];
    for (let i = offset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      cells.push({ iso: isoFromParts(py, pm, d), day: d, current: false });
    }
    for (let i = 1; i <= daysInMonth; i++)
      cells.push({ iso: isoFromParts(year, month, i), day: i, current: true });
    let nd = 1;
    while (cells.length < 42) {
      const nm = month === 11 ? 0 : month + 1;
      const ny = month === 11 ? year + 1 : year;
      cells.push({ iso: isoFromParts(ny, nm, nd), day: nd, current: false });
      nd++;
    }
    return cells;
  }

  const cells = buildGrid();

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
      background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '14px 12px', width: 254,
    }}>
      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => navMonth(-1)} style={calNavBtnStyle}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
          {MONTH_FULL[view.month]} {view.year}
        </span>
        <button onClick={() => navMonth(1)} style={calNavBtnStyle}>›</button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((h, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9CA3AF', padding: '2px 0' }}>{h}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((cell, idx) => {
          const isSel   = cell.iso === dayDate;
          const isToday = cell.iso === today;
          const bg      = isSel ? '#147B8D' : 'transparent';
          return (
            <button key={idx} onClick={() => onChange(cell.iso)}
              style={{
                height: 30, border: isToday && !isSel ? '1.5px solid #4DC8B4' : 'none',
                borderRadius: 6, background: bg,
                color: isSel ? '#fff' : !cell.current ? '#D1D5DB' : '#374151',
                fontSize: 12, fontWeight: isToday ? 600 : 400,
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = '#F3F4F6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = bg; }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      <div style={{ marginTop: 10, borderTop: '1px solid #F3F4F6', paddingTop: 8, textAlign: 'center' }}>
        <button
          onClick={() => {
            const t = todayIso();
            onChange(t);
            const { year, month } = parseIso(t);
            setView({ year, month });
          }}
          style={{ fontSize: 12, color: '#4DC8B4', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Today
        </button>
      </div>
    </div>
  );
}

/* ── FilterGroup ─────────────────────────────────────────────────────────── */

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
        {label}
      </span>
      {children}
    </div>
  );
}

/* ── SingleSelectDropdown ────────────────────────────────────────────────── */

interface SingleSelectProps {
  options:   { id: string; label: string }[];
  value:     string;
  onChange:  (id: string) => void;
}

function SingleSelectDropdown({ options, value, onChange }: SingleSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = options.find(o => o.id === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          height: 30, padding: '0 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid var(--cf-border-primary)',
          borderRadius: 6,
          background: 'var(--cf-bg-chrome)',
          color: 'var(--cf-text-secondary)',
          fontSize: 12, fontWeight: 400,
          cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 80,
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{selected?.label ?? value}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2 4.5l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
          background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 100,
          padding: '4px 0',
        }}>
          {options.map(opt => {
            const isSelected = opt.id === value;
            return (
              <div key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                style={{
                  padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                  color: isSelected ? '#2A9A8A' : '#374151',
                  background: isSelected ? 'rgba(77,200,180,0.06)' : 'transparent',
                  fontWeight: isSelected ? 500 : 400,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(77,200,180,0.06)' : 'transparent'; }}
              >
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 6l3 3 5-5" stroke="#2A9A8A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {!isSelected && <span style={{ width: 10, flexShrink: 0 }} />}
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── MultiSelectDropdown ─────────────────────────────────────────────────── */

interface DropdownOption { id: string; label: string; prefix?: React.ReactNode; }
interface MultiSelectProps {
  placeholder: string;
  options: DropdownOption[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

function MultiSelectDropdown({ placeholder, options, selected, onToggle, onClear }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const isActive = selected.length > 0;
  const label    = isActive ? `${selected.length} selected` : placeholder;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          height: 30, padding: '0 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          border: `1px solid ${isActive ? '#4DC8B4' : 'var(--cf-border-primary)'}`,
          borderRadius: 6,
          background: isActive ? 'rgba(77,200,180,0.06)' : 'var(--cf-bg-chrome)',
          color: isActive ? '#2A9A8A' : 'var(--cf-text-secondary)',
          fontSize: 12, fontWeight: isActive ? 500 : 400,
          cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 110,
          transition: 'border-color 0.15s',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        {isActive ? (
          <span onClick={e => { e.stopPropagation(); onClear(); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', background: 'rgba(42,154,138,0.15)', color: '#2A9A8A', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
            ×
          </span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 4.5l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
          background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 180, maxHeight: 240,
          overflowY: 'auto', padding: '4px 0',
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '8px 14px', fontSize: 12, color: '#9CA3AF' }}>No options</div>
          ) : options.map(opt => {
            const checked = selected.includes(opt.id);
            return (
              <label key={opt.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', cursor: 'pointer', background: checked ? 'rgba(77,200,180,0.06)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = checked ? 'rgba(77,200,180,0.06)' : 'transparent'; }}
              >
                <input type="checkbox" checked={checked} onChange={() => onToggle(opt.id)}
                  style={{ accentColor: '#4DC8B4', width: 13, height: 13, flexShrink: 0, cursor: 'pointer' }} />
                {opt.prefix}
                <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  height: 30, padding: '0 10px',
  border: '1px solid var(--cf-border-primary)', borderRadius: 6,
  fontSize: 12, color: 'var(--cf-text-primary)', background: 'var(--cf-bg-chrome)', outline: 'none',
};

const calNavBtnStyle: React.CSSProperties = {
  width: 28, height: 28, border: 'none', borderRadius: 6,
  background: 'none', cursor: 'pointer', fontSize: 16, color: '#6B7280',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
