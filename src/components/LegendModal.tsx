import React from 'react';
import type { Milestone } from '../types';
import { getMilestonePalette, STATUS_COLORS, STATUS_OPTS } from '../data';
import { CheckIcon, ClockIcon } from './icons';

interface Props {
  milestones: Milestone[];
  onClose:    () => void;
}

export function LegendModal({ milestones, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--cf-bg-overlay)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 480, maxHeight: '88vh',
          background: 'var(--cf-bg-surface)',
          border: '1px solid var(--cf-border-secondary)',
          borderRadius: 'var(--cf-radius-xl)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--cf-bg-chrome)',
          borderBottom: '1px solid var(--cf-border-secondary)',
          display: 'flex', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#147B8D', flex: 1 }}>
            Milestone Legend
          </span>
          <button
            onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: 'var(--cf-radius-md)',
              background: 'var(--cf-bg-surface)', border: '1px solid var(--cf-border-secondary)',
              cursor: 'pointer', fontSize: 16, color: 'var(--cf-text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

          {/* ── Milestones ── */}
          <SectionLabel>Milestones</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
            {milestones.map(ms => {
              const pal = getMilestonePalette(ms.color);
              return (
                <div
                  key={ms.id}
                  style={{
                    display: 'flex', alignItems: 'stretch',
                    borderRadius: 'var(--cf-radius-lg)',
                    border: `1px solid ${pal.dot}55`,
                    background: 'var(--cf-bg-surface)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Left colour bar — mirrors the account card in the grid */}
                  <div style={{ width: 10, flexShrink: 0, background: pal.dot }} />
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: 500,
                    color: 'var(--cf-text-primary)',
                    padding: '8px 12px',
                  }}>
                    {ms.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Status Key ── */}
          <SectionLabel>Status Key</SectionLabel>
          <div style={{ display: 'flex', gap: 24 }}>

            {/* Health */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 10, color: 'var(--cf-text-quaternary)', marginBottom: 7,
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Health
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STATUS_OPTS.map(s => {
                  const hex = STATUS_COLORS[s.value];
                  const r = parseInt(hex.slice(1,3), 16);
                  const g = parseInt(hex.slice(3,5), 16);
                  const b = parseInt(hex.slice(5,7), 16);
                  const bgAlpha = s.value === 'critical' ? 0.40
                                : s.value === 'needs-attention' ? 0.20
                                : s.value === 'minor-issue' ? 0.10
                                : 0.15;
                  const borderAlpha = s.value === 'critical' || s.value === 'needs-attention' ? 0.80 : 0.65;
                  return (
                    <div key={s.value} style={{
                      display: 'flex', alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: 'var(--cf-radius-lg)',
                      background: `rgba(${r},${g},${b},${bgAlpha})`,
                      border: `1px solid rgba(${r},${g},${b},${borderAlpha})`,
                      gap: 8,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: hex,
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--cf-text-primary)' }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ width: 1, background: 'var(--cf-border-secondary)', alignSelf: 'stretch' }} />

            {/* Confirmation */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 10, color: 'var(--cf-text-quaternary)', marginBottom: 7,
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Confirmation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <CheckIcon size={11} color={STATUS_COLORS['on-track']} />
                  <span style={{ fontSize: 12, color: 'var(--cf-text-secondary)' }}>
                    Confirmed go-live
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <ClockIcon size={11} color="var(--cf-text-quaternary)" />
                  <span style={{ fontSize: 12, color: 'var(--cf-text-secondary)' }}>
                    Tentative
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── SectionLabel ── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: 'var(--cf-text-tertiary)',
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}
