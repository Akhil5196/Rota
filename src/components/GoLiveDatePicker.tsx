import React, { useState } from 'react';
import type { Account } from '../types';

/* ─── Availability mock ──────────────────────────────────────────────────────
   In production this data comes from the rule engine / scheduling API.       */
type Avail = 'available' | 'requestable' | 'blocked' | 'weekend' | 'past';

function getAvailability(iso: string): Avail {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (d.getTime() < today.getTime()) return 'past';
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return 'weekend';
  // Deterministic pattern spread across any month so every calendar view
  // shows a realistic mix of available, requestable and blocked dates.
  const hash = (d.getDate() * 17 + d.getMonth() * 11 + d.getFullYear() * 3) % 17;
  if (hash === 0 || hash === 8)  return 'blocked';
  if (hash <= 6)                 return 'available';   // ~6/17 ≈ 35 % available
  return 'requestable';                                 // remainder requestable
}

const AVAIL_DOT: Record<string, string> = {
  available:   '#111827',
  requestable: '#F59E0B',
  blocked:     '#9CA3AF',
};

const DOW_LABELS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDisplay(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

function fmtLong(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

interface Props {
  accountName:        string;
  initialMonthISO:    string;
  accounts:           Account[];
  colLabel:           string | null;
  fromColName:        string | null;
  toColName:          string | null;
  additionalChanges:  string[];
  hideWarningBanner?: boolean;
  onConfirm:          (date: string) => void;
  onCancel:           () => void;
}

export function GoLiveDatePicker({ accountName, initialMonthISO, accounts, colLabel, fromColName, toColName, additionalChanges, hideWarningBanner, onConfirm, onCancel }: Props) {
  const seed = new Date(initialMonthISO + 'T00:00:00');
  const [viewYear,  setViewYear]  = useState(seed.getFullYear());
  const [viewMonth, setViewMonth] = useState(seed.getMonth());
  const [selected,  setSelected]  = useState('');

  /* Calendar grid */
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayISO = toISO(new Date());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(day: number) {
    const iso   = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const avail = getAvailability(iso);
    if (avail === 'blocked' || avail === 'weekend' || avail === 'past') return;
    setSelected(iso);
  }

  /* Accounts already scheduled on the selected date */
  const scheduled = selected
    ? accounts.filter(a => a.plannedDay === selected)
    : [];

  const selectedAvail = selected ? getAvailability(selected) : null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(17,24,39,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520,
          background: 'var(--cf-bg-surface)',
          borderRadius: 'var(--cf-radius-xl)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          border: '1px solid var(--cf-border-secondary)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '95vh',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          background: '#147B8D', padding: '12px 16px',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#fff' }}>Select Date</span>
          <button onClick={onCancel} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.75)', fontSize: 20, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>

        {/* ── Warning banner ── */}
        {!hideWarningBanner && <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 18px',
          background: '#FFF7ED',
          borderBottom: '1px solid #FDE68A',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>
              Go-live dates are managed by the scheduling rules.
              The date for <strong>{accountName}</strong> cannot be scheduled for the selected date.
              Please select an available date from the calendar below.
            </p>
            {colLabel && fromColName && toColName && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px',
                background: '#FFFFFF', borderRadius: 6,
                border: '1px solid #FCD34D',
              }}>
                <span style={{ fontSize: 11, color: '#92400E' }}>
                  <strong>{colLabel}</strong> will also change:
                </span>
                <span style={{
                  fontSize: 11, background: '#FEF3C7',
                  border: '1px solid #FCD34D', borderRadius: 4,
                  padding: '1px 7px', color: '#78350F', fontWeight: 600,
                }}>{fromColName}</span>
                <span style={{ fontSize: 11, color: '#92400E' }}>→</span>
                <span style={{
                  fontSize: 11, background: '#D1FAE5',
                  border: '1px solid #6EE7B7', borderRadius: 4,
                  padding: '1px 7px', color: '#065F46', fontWeight: 600,
                }}>{toColName}</span>
              </div>
            )}
            {additionalChanges.length > 0 && (
              <div style={{
                padding: '7px 10px',
                background: '#FFFFFF', borderRadius: 6,
                border: '1px solid #FCD34D',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>
                  Other changes that will also be applied:
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {additionalChanges.map((c, i) => (
                    <li key={i} style={{ fontSize: 11, color: '#78350F' }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>}

        {/* ── Legend ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          padding: '8px 18px',
          borderBottom: '1px solid var(--cf-border-secondary)',
          background: 'var(--cf-bg-chrome)', flexShrink: 0,
        }}>
          {(['available', 'requestable', 'blocked'] as const).map(avail => (
            <span key={avail} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                background: AVAIL_DOT[avail],
                border: avail === 'blocked' ? '1px solid #9CA3AF' : 'none',
              }} />
              <span style={{ fontSize: 11, color: 'var(--cf-text-secondary)', textTransform: 'capitalize' }}>
                {avail}
              </span>
            </span>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* Date display row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 18px 6px',
          }}>
            <span style={{ fontSize: 12, color: 'var(--cf-text-secondary)', flex: 1 }}>
              Please choose the committed date for the Live deliverable :
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              border: '1px solid var(--cf-border-secondary)',
              borderRadius: 'var(--cf-radius-md)',
              padding: '3px 8px', background: '#fff', minWidth: 110,
            }}>
              <span style={{ fontSize: 12, color: selected ? 'var(--cf-text-primary)' : '#9CA3AF', flex: 1 }}>
                {selected ? fmtDisplay(selected) : 'MM/DD/YYYY'}
              </span>
              {selected && (
                <button onClick={() => setSelected('')} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#EF4444', fontSize: 14, lineHeight: 1, padding: 0,
                }}>×</button>
              )}
              <span style={{ color: '#6B7280', fontSize: 13 }}>📅</span>
            </div>
          </div>

          {/* Calendar */}
          <div style={{
            margin: '4px 18px 10px',
            border: '1px solid var(--cf-border-secondary)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {/* Month navigation */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '10px 12px',
              background: 'var(--cf-bg-chrome)',
              borderBottom: '1px solid var(--cf-border-secondary)',
            }}>
              <button onClick={prevMonth} style={navBtnStyle}>‹</button>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--cf-text-primary)' }}>
                {MONTH_NAMES[viewMonth]}  {viewYear}
              </span>
              <button onClick={nextMonth} style={navBtnStyle}>›</button>
            </div>

            {/* DOW header */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#F8FAFC',
              borderBottom: '1px solid var(--cf-border-secondary)',
            }}>
              {DOW_LABELS.map(d => (
                <div key={d} style={{
                  textAlign: 'center', fontSize: 10, fontWeight: 700,
                  color: 'var(--cf-text-quaternary)',
                  padding: '6px 0',
                  borderRight: '1px solid var(--cf-border-secondary)',
                }}>{d}</div>
              ))}
            </div>

            {/* Date cells — grid with cell borders */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#fff',
            }}>
              {cells.map((day, idx) => {
                if (!day) return (
                  <div key={idx} style={{
                    borderRight: (idx + 1) % 7 !== 0 ? '1px solid var(--cf-border-secondary)' : 'none',
                    borderBottom: '1px solid var(--cf-border-secondary)',
                    minHeight: 38,
                  }} />
                );
                const iso    = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const avail  = getAvailability(iso);
                const isToday    = iso === todayISO;
                const isSelected = iso === selected;
                const isClickable = avail === 'available' || avail === 'requestable';
                const txtColor = isSelected ? '#fff'
                               : avail === 'available'   ? '#111827'
                               : avail === 'requestable' ? '#F59E0B'
                               : '#D1D5DB';
                const isLastCol = (idx + 1) % 7 === 0;
                return (
                  <div key={idx} onClick={() => handleDayClick(day)} style={{
                    textAlign: 'center', padding: '4px 2px',
                    cursor: isClickable ? 'pointer' : 'default',
                    background: isSelected ? '#147B8D' : 'transparent',
                    borderRight: !isLastCol ? '1px solid var(--cf-border-secondary)' : 'none',
                    borderBottom: '1px solid var(--cf-border-secondary)',
                    transition: 'background 0.1s',
                    minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => {
                    if (isClickable && !isSelected)
                      (e.currentTarget as HTMLElement).style.background = 'rgba(20,123,141,0.10)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: '50%',
                      fontSize: 12, fontWeight: avail === 'available' ? 700 : 400,
                      color: txtColor,
                      border: isToday && !isSelected ? '1px solid #9CA3AF' : 'none',
                      opacity: avail === 'weekend' || avail === 'past' ? 0.3 : 1,
                    }}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Post-selection: Note + Schedule ── */}
          {selected && (
            <div style={{ padding: '4px 18px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Note */}
              <p style={{
                margin: 0, fontSize: 12,
                color: 'var(--cf-text-secondary)', lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--cf-text-primary)' }}>Note : </strong>
                {selectedAvail === 'available'
                  ? 'The selected date is available under the scheduling rules. The deliverable will be confirmed for this date.'
                  : 'The requested date is not available under the scheduling rules. Please hold off on committing to the client until the conversion team confirms.'}
              </p>

              {/* Schedule box */}
              <div style={{
                borderLeft: '4px solid #3B82F6',
                background: '#EFF6FF',
                borderRadius: '0 6px 6px 0',
                padding: '10px 12px',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 6,
                }}>
                  Schedule for this date currently includes:
                </div>
                {scheduled.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                    No other conversions scheduled on {fmtLong(selected)}.
                  </p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {scheduled.map(a => (
                      <li key={a.id} style={{ fontSize: 12, color: '#374151' }}>
                        {[a.name, a.conversion, a.pms].filter(Boolean).join(' | ')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '10px 18px 14px',
          borderTop: '1px solid var(--cf-border-secondary)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          flexShrink: 0,
        }}>
          <button onClick={onCancel} style={{
            height: 32, padding: '0 20px', fontSize: 13, fontWeight: 500,
            border: '1px solid var(--cf-border-primary)',
            borderRadius: 'var(--cf-radius-md)',
            background: 'var(--cf-bg-surface)', color: 'var(--cf-text-secondary)',
            cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            style={{
              height: 32, padding: '0 20px', fontSize: 13, fontWeight: 600,
              border: `1px solid ${selected ? '#147B8D' : '#D1D5DB'}`,
              borderRadius: 'var(--cf-radius-md)',
              background: selected ? '#147B8D' : '#F3F4F6',
              color: selected ? '#FFFFFF' : '#9CA3AF',
              cursor: selected ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >Proceed</button>
        </div>
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 6,
  background: 'var(--cf-bg-chrome)', border: '1px solid var(--cf-border-secondary)',
  cursor: 'pointer', fontSize: 16, color: 'var(--cf-text-secondary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
