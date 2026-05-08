import React, { useState, useEffect, useMemo } from 'react';
import type { Account, AccountDraft, FiredRule, ImplementationLead, Milestone, NoteEntry, PMO, Week } from '../types';
import { STATUS_OPTS, STATUS_COLORS, getMilestonePalette, relTime } from '../data';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];


interface Props {
  account:             Account;
  pmos:                PMO[];
  implLeads:           ImplementationLead[];
  weeks:               Week[];
  milestones:          Milestone[];
  onSave:              (draft: AccountDraft) => void;
  onClose:             () => void;
  onRequestNewDate:    () => void;
}

function initDraft(account: Account): AccountDraft {
  return {
    pmoId:                account.pmoId,
    implementationLeadId: account.implementationLeadId,
    weekId:               account.weekId,
    plannedDay:           account.plannedDay,
    confirmed:            account.confirmed,
    notes:                '',
  };
}

export function SidePanel({ account, pmos, implLeads, weeks, milestones, onSave, onClose, onRequestNewDate }: Props) {
  const origin = initDraft(account);
  const [draft, setDraft] = useState<AccountDraft>(origin);
  const [scheduleWarn, setScheduleWarn] = useState(false);

  useEffect(() => {
    setDraft(initDraft(account));
  }, [account.id]);

  const set = (patch: Partial<AccountDraft>) => setDraft(d => ({ ...d, ...patch }));

  const isDirty = (Object.keys(draft) as (keyof AccountDraft)[])
    .filter(k => k !== 'notes')
    .some(k => (draft[k] as unknown) !== (origin[k] as unknown))
    || draft.notes.trim() !== '';

  /* Read-only display values for week & day */
  const currentWeekLabel = useMemo(
    () => weeks.find(w => w.id === account.weekId)?.label ?? '—',
    [account.weekId, weeks],
  );
  const currentDayLabel = useMemo(() => {
    if (!account.plannedDay) return '—';
    const d = new Date(account.plannedDay + 'T00:00:00');
    return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${DAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1]}`;
  }, [account.plannedDay]);

  const ms     = milestones.find(m => m.id === account.milestoneId);
  const msPal  = getMilestonePalette(ms?.color ?? 'blue');
  const stColor = STATUS_COLORS[account.status] ?? STATUS_COLORS['on-track'];
  const stLabel = STATUS_OPTS.find(s => s.value === account.status)?.label ?? '—';

  const r = parseInt(stColor.slice(1,3), 16);
  const g = parseInt(stColor.slice(3,5), 16);
  const b = parseInt(stColor.slice(5,7), 16);
  const bgAlpha = account.status === 'critical' ? 0.40
                : account.status === 'needs-attention' ? 0.20
                : account.status === 'minor-issue' ? 0.10
                : 0.15;
  const savedNotes: NoteEntry[] = account.notes ?? [];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(17,24,39,0.15)' }} />

      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 950,
        background: '#FFFFFF',
        borderLeft: '1px solid #E5E7EB',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.09)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 41,
      }}>

        {/* ── Header: Account info block ── */}
        <div style={{
          padding: '12px 18px 12px',
          borderBottom: '1px solid #E5E7EB',
          flexShrink: 0,
          background: '#FAFAFA',
        }}>
          {/* Title row: account identity + chips + close button */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Account Name | Conversion | PMS */}
              <div style={{
                fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: '20px',
                display: 'flex', alignItems: 'center', flexWrap: 'wrap',
              }}>
                <span>{account.name}</span>
                {account.conversion && (<><Pipe /><span>{account.conversion}</span></>)}
                {account.pms && (<><Pipe /><span>{account.pms}</span></>)}
              </div>

              {/* Locations — subdued line with optional NHS badges */}
              {account.locations && account.locations.length > 0 && (
                <div style={{
                  fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: '20px',
                  display: 'flex', flexWrap: 'wrap', gap: '2px 0',
                }}>
                  {account.locations.map((loc, i) => {
                    const isNHS = loc.endsWith(' [NHS]');
                    const name  = isNHS ? loc.slice(0, -6) : loc;
                    return (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {i > 0 && <span style={{ marginRight: 4 }}>,</span>}
                        {name}
                        {isNHS && <NhsBadge />}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right cluster: chips + unsaved indicator + close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

              {/* Health status chip */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 9px', borderRadius: 20,
                background: `rgba(${r},${g},${b},${bgAlpha})`,
                border: `1px solid rgba(${r},${g},${b},0.45)`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: stColor, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{stLabel}</span>
              </div>

              {/* Milestone chip — left bar style */}
              {ms && (
                <div style={{
                  display: 'flex', alignItems: 'stretch',
                  borderRadius: 6, border: `1px solid ${msPal.dot}55`,
                  background: '#F9FAFB', overflow: 'hidden',
                  maxWidth: 220,
                }}>
                  <div style={{ width: 4, flexShrink: 0, background: msPal.dot }} />
                  <span style={{
                    fontSize: 11, fontWeight: 500, color: '#374151', padding: '3px 8px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {ms.name}
                  </span>
                </div>
              )}

              {/* Close button */}
              <button onClick={onClose} title="Close"
                style={{
                  width: 26, height: 26, borderRadius: 6, background: '#F9FAFB', flexShrink: 0,
                  border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 16, color: '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
            </div>
          </div>
        </div>

        {/* ── Info banner: Project Planner notice ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 14px',
          background: '#EFF6FF',
          borderBottom: '1px solid #BFDBFE',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, flexShrink: 0 }}>ℹ️</span>
          <p style={{ margin: 0, fontSize: 11.5, color: '#1E40AF', lineHeight: 1.55, flex: 1 }}>
            Milestone &amp; Health are auto-updated based on the progress recorded in the Project Planner. Complete the relevant step there to reflect changes here.
          </p>
          <a
            href="https://projectplanner.example.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11.5, fontWeight: 600, color: '#1D4ED8',
              background: '#DBEAFE', border: '1px solid #93C5FD',
              borderRadius: 5, padding: '4px 10px',
              textDecoration: 'none', whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            Project Planner
            <span style={{ fontSize: 11 }}>↗</span>
          </a>
        </div>

        {/* ── Two-column body ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left: editable fields ── */}
          <div style={{
            width: 500, flexShrink: 0, minHeight: 0,
            borderRight: '1px solid #E5E7EB',
            overflowY: 'auto',
            padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <Field label="PMO">
              <select value={draft.pmoId} onChange={e => set({ pmoId: e.target.value })} style={selectStyle}>
                {pmos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>

            <Field label="Implementation Lead">
              <select value={draft.implementationLeadId} onChange={e => set({ implementationLeadId: e.target.value })} style={selectStyle}>
                {implLeads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>

            {/* Planned Week · Planned Day · Request button — single row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <Field label="Planned Week" style={{ flex: 3 }}>
                <div style={{
                  ...selectStyle,
                  display: 'flex', alignItems: 'center',
                  background: '#F3F4F6', color: '#6B7280',
                  cursor: 'default', userSelect: 'none',
                }}>
                  {currentWeekLabel}
                </div>
              </Field>
              <Field label="Planned Day" style={{ flex: 2 }}>
                <div style={{
                  ...selectStyle,
                  display: 'flex', alignItems: 'center',
                  background: '#F3F4F6', color: '#6B7280',
                  cursor: 'default', userSelect: 'none',
                }}>
                  {currentDayLabel}
                </div>
              </Field>
              <button
                onClick={onRequestNewDate}
                style={{
                  flexShrink: 0,
                  height: 32, padding: '0 11px',
                  background: '#fff',
                  border: '1px solid #147B8D',
                  borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                  color: '#147B8D', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F0FAFA')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <span style={{ fontSize: 13 }}>📅</span>
                Request New Go-Live Date
              </button>
            </div>

            {/* Confirmed toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', background: '#F9FAFB',
              border: '1px solid #E5E7EB', borderRadius: 8,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Confirmed Go-Live</div>
              </div>
              <Toggle checked={draft.confirmed} onChange={v => {
                if (v) { setScheduleWarn(true); }
                else { set({ confirmed: false }); }
              }} />
            </div>

            {/* ── Health Status ── */}
            <HealthRulesPanel rules={account.firedRules ?? []} />
          </div>

          {/* ── Right: Comments (top) + Activity (bottom) ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FAFAFA' }}>

            {/* ── Comments — always top half ── */}
            <div style={{
              flex: 1, minHeight: 0,
              padding: '14px 14px 12px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <SectionHeading>Comments</SectionHeading>

              <textarea
                value={draft.notes}
                onChange={e => set({ notes: e.target.value })}
                placeholder={savedNotes.length > 0 ? 'Add another comment…' : 'Add a comment…'}
                rows={2}
                style={{
                  width: '100%', padding: '7px 10px',
                  border: '1px solid #D1D5DB', borderRadius: 6,
                  fontSize: 12, color: '#111827', background: '#FFFFFF',
                  outline: 'none', resize: 'none', flexShrink: 0,
                  fontFamily: 'inherit', lineHeight: '1.5',
                  boxSizing: 'border-box',
                }}
              />

              {savedNotes.length > 0 ? (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF' }}>
                  {savedNotes.map((note, idx) => (
                    <div key={note.id} style={{ padding: '8px 12px', borderBottom: idx < savedNotes.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ fontSize: 12, color: '#374151', lineHeight: '18px', wordBreak: 'break-word' }}>{note.text}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{note.user} · {relTime(note.ts)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>No comments yet.</div>
              )}
            </div>

            {/* ── Activity — bottom half ── */}
            {(() => {
              const activityEntries = account.audit.filter(e => !e.action.toLowerCase().includes('created'));
              return (
                <div style={{
                  flex: 1, minHeight: 0,
                  padding: '14px 14px 12px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <SectionHeading>Activity</SectionHeading>
                  {activityEntries.length > 0 ? (
                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8, background: '#FFFFFF' }}>
                      {activityEntries.map((e, idx) => (
                        <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px', borderBottom: idx < activityEntries.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D1D5DB', marginTop: 6, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: '17px' }}>{e.action}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{e.user} · {relTime(e.ts)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>No activity logged yet.</div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          flexShrink: 0, background: '#FFFFFF',
        }}>
          <button onClick={onClose}
            style={{
              height: 32, padding: '0 16px',
              background: 'transparent', border: '1px solid #D1D5DB',
              borderRadius: 6, fontSize: 13, fontWeight: 500, color: '#6B7280',
              cursor: 'pointer', transition: 'border-color 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#9CA3AF')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#D1D5DB')}>
            Cancel
          </button>
          <button onClick={() => onSave(draft)} disabled={!isDirty}
            style={{
              height: 32, padding: '0 20px',
              background: isDirty ? '#147B8D' : '#F3F4F6',
              border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 600,
              color: isDirty ? '#fff' : '#9CA3AF',
              cursor: isDirty ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, color 0.15s', whiteSpace: 'nowrap',
            }}>
            {isDirty ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>

      {/* ── Schedule Deliverables warning modal ── */}
      {scheduleWarn && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(17,24,39,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            width: 680, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              background: '#147B8D', padding: '8px 18px',
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Schedule Deliverables</span>
            </div>
            {/* Body */}
            <div style={{ padding: '20px 20px 16px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1 }}>
                Exceeded the Maximum schedule limit for the selected date to confirm deliverable.
                Choose a different date to proceed to schedule.
              </p>
            </div>
            {/* Footer */}
            <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setScheduleWarn(false)}
                style={{
                  height: 32, padding: '0 22px',
                  background: '#fff', border: '1px solid #147B8D',
                  borderRadius: 6, fontSize: 13, fontWeight: 450,
                  color: '#147B8D', cursor: 'pointer',
                }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Health Status Panel ── */
const SEVERITY_ORDER: Record<string, number> = {
  'critical': 4, 'needs-attention': 3, 'minor-issue': 2, 'on-track': 1,
};

function HealthRulesPanel({ rules }: { rules: FiredRule[] }) {
  const onTrackColor = STATUS_COLORS['on-track'];
  const otr = parseInt(onTrackColor.slice(1,3), 16);
  const otg = parseInt(onTrackColor.slice(3,5), 16);
  const otb = parseInt(onTrackColor.slice(5,7), 16);

  if (rules.length === 0) {
    return (
      <div>
        <SectionHeading>Health Rules</SectionHeading>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          border: `1px solid rgba(${otr},${otg},${otb},0.40)`,
          background: `rgba(${otr},${otg},${otb},0.10)`,
          overflow: 'hidden',
        }}>
          <div style={{ width: 5, alignSelf: 'stretch', flexShrink: 0, background: onTrackColor, borderRadius: 2, marginLeft: -12, marginTop: -10, marginBottom: -10 }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: onTrackColor, flexShrink: 0, marginLeft: 6 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: onTrackColor }}>Everything is on track</span>
        </div>
      </div>
    );
  }

  // Sort: highest severity first
  const sorted = [...rules].sort((a, b) =>
    (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0)
  );
  return (
    <div>
      <SectionHeading>Health Rules</SectionHeading>

      {/* Rule cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(rule => {
          const col = STATUS_COLORS[rule.severity];
          const rr = parseInt(col.slice(1,3), 16);
          const rg = parseInt(col.slice(3,5), 16);
          const rb = parseInt(col.slice(5,7), 16);
          const bgAlpha = rule.severity === 'critical' ? 0.08 : 0.06;
          return (
            <div key={rule.id} style={{
              display: 'flex', alignItems: 'stretch',
              borderRadius: 8,
              border: `1px solid rgba(${rr},${rg},${rb},0.45)`,
              background: `rgba(${rr},${rg},${rb},${bgAlpha})`,
              overflow: 'hidden',
            }}>
              {/* Severity bar */}
              <div style={{ width: 5, flexShrink: 0, background: col }} />

              {/* Content */}
              <div style={{ flex: 1, padding: '8px 10px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', lineHeight: '15px' }}>
                    {rule.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: col, flexShrink: 0,
                    background: `rgba(${rr},${rg},${rb},0.12)`,
                    padding: '1px 7px', borderRadius: 20,
                    border: `1px solid rgba(${rr},${rg},${rb},0.30)`,
                  }}>
                    {STATUS_OPTS.find(s => s.value === rule.severity)?.label}
                  </span>
                </div>
                <p style={{
                  margin: 0, fontSize: 11, color: '#6B7280',
                  lineHeight: '16px', wordBreak: 'break-word',
                }}>
                  {rule.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Pipe separator between header identity parts ── */
function Pipe() {
  return (
    <span style={{ margin: '0 8px', color: '#D1D5DB', fontWeight: 300, fontSize: 14 }}>|</span>
  );
}

/* ── NHS location badge ── */
function NhsBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: '#005EB8', color: '#FFFFFF',
      fontSize: 9, fontWeight: 800, lineHeight: '12px',
      padding: '1px 4px', borderRadius: 2,
      letterSpacing: '0.04em', flexShrink: 0,
    }}>
      NHS
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#6B7280',
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: checked ? '#4DC8B4' : '#D1D5DB',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
      <div style={{
        position: 'absolute', top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', height: 34, padding: '0 10px',
  border: '1px solid #D1D5DB', borderRadius: 6,
  fontSize: 13, color: '#111827', background: '#FFFFFF',
  outline: 'none', cursor: 'pointer', appearance: 'auto',
};
