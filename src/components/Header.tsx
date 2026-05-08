import React from 'react';
import { STATUS_COLORS, STATUS_OPTS } from '../data';
import type { Status } from '../types';

interface Props {
  statusCounts: Record<Status, number>;
  onOpenLegend: () => void;
  colFrom: number;
  colTo: number;
  colTotal: number;
  colLabel: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function Header({ statusCounts, onOpenLegend, colFrom, colTo, colTotal, colLabel, canPrev, canNext, onPrev, onNext }: Props) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 18px',
      height: 48,
      background: '#FFFFFF',
      borderBottom: '1px solid #E5E7EB',
      flexShrink: 0,
    }}>
      {/* Page title */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1B2D3E', letterSpacing: '-0.01em' }}>
          Rota
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Summary chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {STATUS_OPTS.map(s => {
          const count = statusCounts[s.value] ?? 0;
          if (s.value !== 'on-track' && count === 0) return null;
          return (
            <StatChip key={s.value} color={STATUS_COLORS[s.value]} count={count} label={s.label} />
          );
        })}
      </div>

      <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 4px' }} />

      {/* Column navigator (PMO or Impl. Lead) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <NavArrow direction="prev" disabled={!canPrev} onClick={onPrev} />
        <span style={{
          fontSize: 12, color: '#374151', fontVariantNumeric: 'tabular-nums',
          minWidth: 96, textAlign: 'center',
        }}>
          {colFrom}–{colTo} of {colTotal} {colLabel}{colTotal !== 1 ? 's' : ''}
        </span>
        <NavArrow direction="next" disabled={!canNext} onClick={onNext} />
      </div>

      <div style={{ width: 1, height: 18, background: '#E5E7EB', margin: '0 4px' }} />

      {/* Legend button */}
      <button
        onClick={onOpenLegend}
        style={{
          height: 30, padding: '0 13px',
          background: 'transparent',
          border: '1px solid #D1D5DB',
          borderRadius: 6,
          fontSize: 12, fontWeight: 500,
          color: '#374151',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#4DC8B4';
          e.currentTarget.style.color = '#2A9A8A';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#D1D5DB';
          e.currentTarget.style.color = '#374151';
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="4" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
          <rect x="1" y="10" width="4" height="4" rx="1" fill="currentColor" opacity="0.7"/>
          <path d="M8 6h7M8 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Legend
      </button>
    </div>
  );
}

function NavArrow({ direction, disabled, onClick }: { direction: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 26, height: 26,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: disabled ? 'transparent' : 'transparent',
        border: `1px solid ${disabled ? '#F3F4F6' : '#D1D5DB'}`,
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#D1D5DB' : '#374151',
        transition: 'border-color 0.15s, color 0.15s, background 0.15s',
        padding: 0,
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = '#4DC8B4';
          e.currentTarget.style.color = '#2A9A8A';
          e.currentTarget.style.background = 'rgba(77,200,180,0.06)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = disabled ? '#F3F4F6' : '#D1D5DB';
        e.currentTarget.style.color = disabled ? '#D1D5DB' : '#374151';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {direction === 'prev' ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

function StatChip({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 11, height: 11, borderRadius: '50%',
        background: color, flexShrink: 0,
        alignSelf: 'center',
      }} />
      <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
        <strong style={{ fontWeight: 700, color: '#374151', fontSize: 12 }}>{count}</strong>
        {label}
      </span>
    </div>
  );
}
