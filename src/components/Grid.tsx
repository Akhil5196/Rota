import React, { useRef } from 'react';
import type { Account, Filters, Milestone, PMO, Week, ViewMode } from '../types';
import { getMilestonePalette, STATUS_COLORS, STATUS_OPTS, relTime } from '../data';
import { CheckIcon, ClockIcon } from './icons';

interface Props {
  weeks: Week[];            // may be re-ordered week rows OR synthetic day rows in day mode
  rowMode: 'week' | 'day'; // drives cell filtering and header label
  columns: PMO[];           // PMO[] or ImplementationLead[] — same shape
  milestones: Milestone[];
  visible: Account[];
  filters: Filters;
  viewMode: ViewMode;
  selectedId: string | null;
  maxPerCell: number;
  dragRef: React.MutableRefObject<{ accountId: string; fromWeekId: string; fromColumnId: string; viewMode: ViewMode } | null>;
  onSelect: (id: string) => void;
  onDrop: (rowId: string, columnId: string) => void;
}

const OVERALLOC_TOOLTIP =
  'One or more days in this week exceed the recommended confirmed go-live allocation. ' +
  'The first working day of the week supports up to 4 confirmed go-lives, while other working days support 1. ' +
  'Denovo/Squat accounts are excluded. ' +
  'Switch to Day view to identify the impacted days.';

/** Returns true if any working day in the week has more go-lives than allowed. */
function isWeekOverAllocated(week: Week, accounts: Account[]): boolean {
  const weekAccounts = accounts.filter(a => a.weekId === week.id && a.plannedDay);
  if (weekAccounts.length === 0) return false;

  const mondayMs = new Date(week.startDate + 'T00:00:00').getTime();
  const dayCounts: Record<string, number> = {};
  for (const a of weekAccounts) {
    if (a.plannedDay) dayCounts[a.plannedDay] = (dayCounts[a.plannedDay] ?? 0) + 1;
  }

  for (const [day, count] of Object.entries(dayCounts)) {
    const date = new Date(day + 'T00:00:00');
    const dow = date.getDay(); // 0=Sun … 6=Sat
    if (dow === 0 || dow === 6) continue; // skip weekends
    const isFirstWorkingDay = date.getTime() === mondayMs;
    const limit = (dow === 1 || isFirstWorkingDay) ? 4 : 1;
    if (count > limit) return true;
  }
  return false;
}

export function Grid({ weeks, rowMode, columns, milestones, visible, filters, viewMode, selectedId, maxPerCell, dragRef, onSelect, onDrop }: Props) {

  function getMsPalette(msId: string) {
    const ms = milestones.find(m => m.id === msId);
    return getMilestonePalette(ms?.color ?? 'blue');
  }

  // ── Account card ──────────────────────────────────────────────────────────

  function AccountCard({ account }: { account: Account }) {
    const msPal       = getMsPalette(account.milestoneId);
    const statusColor = STATUS_COLORS[account.status];
    const isSelected  = account.id === selectedId;
    const msName      = milestones.find(m => m.id === account.milestoneId)?.name ?? '—';
    const stLabel     = STATUS_OPTS.find(s => s.value === account.status)?.label ?? '—';
    const locs        = account.locations ?? [];
    const hasNHS      = locs.some(l => l.endsWith(' [NHS]'));
    const locNames    = locs.map(l => l.endsWith(' [NHS]') ? l.slice(0, -6) : l).join(', ');

    // Rich multi-line tooltip
    const tooltipLine1 = [account.name, account.conversion, account.pms].filter(Boolean).join(' | ');
    const tooltip = [
      tooltipLine1,
      locNames || null,
      '',
      `Milestone: ${msName}`,
      `Status: ${stLabel}`,
      `Go-Live: ${account.confirmed ? 'Confirmed' : 'Tentative'}`,
      `Last updated: ${relTime(account.audit[0]?.ts ?? Date.now())}`,
    ].filter(v => v !== null).join('\n');

    /* Derive background/border from the status hex colour */
    const r = parseInt(statusColor.slice(1, 3), 16);
    const g = parseInt(statusColor.slice(3, 5), 16);
    const b = parseInt(statusColor.slice(5, 7), 16);
    const bgAlpha     = account.status === 'critical'        ? 0.20
                      : account.status === 'needs-attention' ? 0.20
                      : account.status === 'minor-issue'     ? 0.15
                      : 0.15;
    const borderAlpha = (account.status === 'critical' || account.status === 'needs-attention') ? 0.80 : 0.65;
    const statusBg     = `rgba(${r},${g},${b},${bgAlpha})`;
    const statusBorder = isSelected ? 'var(--cf-accent)' : `rgba(${r},${g},${b},${borderAlpha})`;

    return (
      <div
        draggable
        title={tooltip}
        onDragStart={e => {
          e.stopPropagation();
          const fromColumnId = viewMode === 'pmo' ? account.pmoId : account.implementationLeadId;
          dragRef.current = { accountId: account.id, fromWeekId: account.weekId, fromColumnId, viewMode };
          const el = e.currentTarget as HTMLElement;
          setTimeout(() => { el.style.opacity = '0.35'; }, 0);
        }}
        onDragEnd={e => {
          (e.currentTarget as HTMLElement).style.opacity = '1';
          dragRef.current = null;
        }}
        onClick={e => { e.stopPropagation(); onSelect(account.id); }}
        style={{
          display: 'flex', alignItems: 'stretch', gap: 0,
          background: statusBg,
          border: `1px solid ${statusBorder}`,
          borderRadius: 'var(--cf-radius-sm)',
          marginBottom: 3,
          cursor: 'grab',
          userSelect: 'none',
          overflow: 'hidden',
          transition: 'border-color 0.15s, opacity 0.15s',
        }}
        onMouseEnter={e => {
          if (!isSelected) {
            const hoverAlpha = (account.status === 'critical' || account.status === 'needs-attention') ? 0.95 : 0.85;
            (e.currentTarget as HTMLElement).style.borderColor = `rgba(${r},${g},${b},${hoverAlpha})`;
          }
        }}
        onMouseLeave={e => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = statusBorder;
        }}
      >
        {/* Milestone colour bar */}
        <div style={{ width: 8, flexShrink: 0, background: msPal.dot }} />

        {/* Card content — single uniform line: Name | Conversion [N] | PMS + icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1, padding: '4px 6px', minWidth: 0, overflow: 'hidden' }}>

          {/* Entire text block as one flex row — account name truncates, rest is fixed */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 0,
            flex: 1, minWidth: 0, overflow: 'hidden',
            fontSize: 11, lineHeight: '16px', fontWeight: 500,
            color: 'var(--cf-text-primary)', whiteSpace: 'nowrap',
          }}>
            {/* Account name — hard-capped at 16 chars */}
            <span style={{ flexShrink: 0 }}>
              {account.name.length > 14 ? account.name.slice(0, 16) + '…' : account.name}
            </span>

            {/* | Conversion */}
            {account.conversion && (
              <>
                <span style={{ margin: '0 4px', color: '#111827', fontWeight: 400 }}>|</span>
                <span style={{ flexShrink: 0 }}>{account.conversion}</span>
              </>
            )}

            {/* | PMS */}
            {account.pms && (
              <>
                <span style={{ margin: '0 4px', color: '#111827', fontWeight: 400 }}>|</span>
                <span style={{ flexShrink: 0 }}>{account.pms}</span>
              </>
            )}
          </span>

          {/* Fixed icons — always visible */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 5 }}>
            {hasNHS && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: '#005EB8', color: '#FFFFFF',
                fontSize: 7, fontWeight: 800, lineHeight: '10px',
                padding: '1px 3px', borderRadius: 2, letterSpacing: '0.04em',
              }}>NHS</span>
            )}
            {account.notes.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', color: '#475569' }}>
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <rect x="1.5" y="1" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M3.5 4h5M3.5 6.5h5M3.5 9h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </span>
            )}
            {account.confirmed
              ? <CheckIcon size={13} color="#166534" />
              : <ClockIcon size={13} color="#64748B" />
            }
          </span>
        </div>
      </div>
    );
  }

  // ── Cell ──────────────────────────────────────────────────────────────────

  function Cell({ weekId, columnId }: { weekId: string; columnId: string }) {
    const cellRef      = useRef<HTMLTableCellElement>(null);
    const cellAccounts = visible.filter(a =>
      /* In day mode the row id is an ISO date matched against plannedDay */
      (rowMode === 'day' ? a.plannedDay === weekId : a.weekId === weekId) &&
      (viewMode === 'pmo' ? a.pmoId : a.implementationLeadId) === columnId
    );
    const shown        = cellAccounts.slice(0, maxPerCell);
    const overflow     = cellAccounts.length - maxPerCell;

    return (
      <td
        ref={cellRef}
        onDragOver={e => {
          e.preventDefault();
          if (cellRef.current) cellRef.current.style.background = 'rgba(54,133,191,0.07)';
        }}
        onDragLeave={e => {
          const rt = e.relatedTarget as Node | null;
          if (cellRef.current && (!rt || !cellRef.current.contains(rt))) {
            cellRef.current.style.background = 'transparent';
          }
        }}
        onDrop={e => {
          e.preventDefault();
          if (cellRef.current) cellRef.current.style.background = 'transparent';
          onDrop(weekId, columnId);
        }}
        style={{
          verticalAlign: 'top',
          padding: '6px 8px',
          border: '1px solid var(--cf-border-secondary)',
          background: 'transparent',
          transition: 'background 0.1s',
        }}
      >
        {cellAccounts.length === 0 ? (
          <div style={{ height: 32 }} />
        ) : (
          <>
            {shown.map(a => <AccountCard key={a.id} account={a} />)}
            {overflow > 0 && (
              <button
                onClick={() => onSelect(cellAccounts[maxPerCell].id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--cf-accent)', fontWeight: 500,
                  padding: '2px 4px', width: '100%', textAlign: 'center',
                }}
              >
                +{overflow} more
              </button>
            )}
          </>
        )}
      </td>
    );
  }

  // ── Row hover highlighting ────────────────────────────────────────────────

  function handleRowEnter(e: React.MouseEvent<HTMLTableRowElement>) {
    const tds = e.currentTarget.querySelectorAll<HTMLElement>('td');
    tds.forEach((td, i) => { if (i === 0) td.style.background = '#F0F4F8'; });
  }
  function handleRowLeave(e: React.MouseEvent<HTMLTableRowElement>) {
    const tds = e.currentTarget.querySelectorAll<HTMLElement>('td');
    tds.forEach((td, i) => { if (i === 0) td.style.background = 'var(--cf-bg-surface)'; });
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
        <thead>
          <tr>
            {/* Sticky corner */}
            <th style={{
              position: 'sticky', top: 0, left: 0, zIndex: 30,
              background: 'var(--cf-bg-chrome)',
              borderRight: '1px solid var(--cf-border-primary)',
              borderBottom: '2px solid var(--cf-border-primary)',
              padding: '10px 14px',
              minWidth: 200, width: 200, textAlign: 'left',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cf-text-quaternary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {rowMode === 'day' ? 'Day' : 'Week'} / {viewMode === 'pmo' ? 'PMO' : 'Impl. Lead'}
              </span>
            </th>

            {/* Column headers (PMO or Impl. Lead) */}
            {columns.map(col => {
              const initials = col.name.split(' ').map(n => n[0]).slice(0, 2).join('');
              const count    = visible.filter(a =>
                (viewMode === 'pmo' ? a.pmoId : a.implementationLeadId) === col.id
              ).length;
              const activeFilter = viewMode === 'pmo' ? filters.pmoIds : filters.implLeadIds;
              const dimmed       = activeFilter.length > 0 && !activeFilter.includes(col.id);
              return (
                <th
                  key={col.id}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F0F4F8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--cf-bg-chrome)')}
                  style={{
                    position: 'sticky', top: 0, zIndex: 20,
                    background: 'var(--cf-bg-chrome)',
                    border: '1px solid var(--cf-border-secondary)',
                    borderBottom: '2px solid var(--cf-border-primary)',
                    padding: '8px 12px',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                    opacity: dimmed ? 0.4 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: viewMode === 'pmo' ? 'var(--cf-accent)' : '#7C3AED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{initials}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cf-text-primary)' }}>{col.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--cf-text-quaternary)' }}>{count} conversion{count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {weeks.map(week => {
            const count = rowMode === 'day'
              ? visible.filter(a => a.plannedDay === week.id).length
              : visible.filter(a => a.weekId   === week.id).length;

            const overAllocated = rowMode === 'week' && isWeekOverAllocated(week, visible);

            return (
              <tr
                key={week.id}
                onMouseEnter={handleRowEnter}
                onMouseLeave={handleRowLeave}
              >
                {/* Week sticky label */}
                <td style={{
                  position: 'sticky', left: 0, zIndex: 10,
                  background: 'var(--cf-bg-surface)',
                  borderRight: '1px solid var(--cf-border-primary)',
                  borderBottom: '1px solid var(--cf-border-secondary)',
                  padding: '8px 10px 8px 14px', verticalAlign: 'top',
                  minWidth: 140, width: 140,
                  transition: 'background 0.1s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cf-text-primary)', whiteSpace: 'nowrap' }}>
                        {week.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--cf-text-quaternary)', marginTop: 2 }}>
                        {count} account{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {overAllocated && (
                      <span
                        title={OVERALLOC_TOOLTIP}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                          background: '#CD1C18', color: '#FFFFFF',
                          fontSize: 12, fontWeight: 700, lineHeight: 1,
                          cursor: 'help', userSelect: 'none',
                          boxShadow: '0 1px 4px rgba(205,28,24,0.35)',
                        }}
                      >!</span>
                    )}
                  </div>
                </td>

                {columns.map(col => <Cell key={col.id} weekId={week.id} columnId={col.id} />)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
