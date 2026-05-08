import React, { useState } from 'react';

export function TopBar() {
  const [search, setSearch] = useState('');

  return (
    <header style={{
      height: 44,
      background: '#1B2D3E',
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      flexShrink: 0,
      zIndex: 100,
      position: 'relative',
    }}>
      {/* Logo area */}
      <div style={{
        width: 65,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '0.08em',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}>
          DERI<span style={{ color: '#4DC8B4' }}>VIZ</span>
        </span>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        padding: '0 16px',
        maxWidth: 360,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flex: 1,
          height: 28,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 4,
          padding: '0 10px',
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              caretColor: '#4DC8B4',
            }}
          />
          {/* Dropdown caret */}
          <div style={{
            width: 1,
            height: 14,
            background: 'rgba(255,255,255,0.15)',
            marginRight: 4,
          }} />
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 3L4 6L7 3" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        paddingRight: 14,
      }}>
        {/* Integrations icon */}
        <IconBtn title="Integrations">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="15" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="10" cy="15" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5h4M7 8l-2 4M13 8l2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </IconBtn>

        {/* Help icon */}
        <IconBtn title="Help">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5s2.5 1.12 2.5 2.5c0 1.5-2.5 2-2.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="15" r="0.8" fill="currentColor"/>
          </svg>
        </IconBtn>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <IconBtn title="Notifications">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 0 0-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 0 0-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8.5 16.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </IconBtn>
          <div style={{
            position: 'absolute', top: 2, right: 2,
            width: 14, height: 14, borderRadius: '50%',
            background: '#E53E3E',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 700, color: '#fff',
            pointerEvents: 'none',
          }}>
            13
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 6px' }} />

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            Babu, Akhil
          </span>
        </div>

        {/* Hamburger */}
        <IconBtn title="Menu">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </IconBtn>
      </div>
    </header>
  );
}

function IconBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      title={title}
      style={{
        width: 30, height: 30,
        background: 'transparent',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.65)',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
      }}
    >
      {children}
    </button>
  );
}
