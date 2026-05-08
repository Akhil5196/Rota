import React from 'react';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: 'practice-list',
    label: 'Practice List',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'deals-hub',
    label: 'Deals Hub',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="5"  cy="19" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="19" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M12 7.5v4M12 11.5l-5 5M12 11.5l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'scheduler',
    label: 'Scheduler',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <rect x="6"  y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
        <rect x="10.5" y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
        <rect x="15" y="12" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
        <rect x="6"  y="16" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
        <rect x="10.5" y="16" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: 'rota',
    label: 'Work Bench',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        {/* Monitor screen */}
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        {/* Stand */}
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        {/* </> code symbol */}
        <path d="M9 10l-2 2 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 10l2 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 8l-2 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 20h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <rect x="5"  y="10" width="3" height="10" rx="1" fill="currentColor" opacity="0.7"/>
        <rect x="10.5" y="6" width="3" height="14" rx="1" fill="currentColor" opacity="0.7"/>
        <rect x="16" y="13" width="3" height="7"  rx="1" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: 'issue-tracker',
    label: 'Issue Tracker',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'bot-status',
    label: 'Bot Status',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M12 4v4M9 4h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="9"  cy="13" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
        <path d="M9 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M2 13h2M20 13h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'planner',
    label: 'Doc Mig',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        <path d="M10 13l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

interface Props {
  activeId: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ activeId, onNavigate }: Props) {
  return (
    <aside style={{
      width: 65,
      background: '#FFFFFF',
      borderRight: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 6,
      paddingBottom: 8,
      gap: 0,
      flexShrink: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {NAV_ITEMS.map(item => {
        const isActive = item.id === activeId;
        return (
          <NavTile
            key={item.id}
            item={item}
            isActive={isActive}
            onClick={() => onNavigate(item.id)}
          />
        );
      })}
    </aside>
  );
}

function NavTile({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={item.label}
      style={{
        width: '100%',
        padding: '8px 4px 7px',
        background: isActive ? 'rgba(77,200,180,0.12)' : 'transparent',
        border: 'none',
        borderLeft: isActive ? '3px solid #4DC8B4' : '3px solid transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        color: isActive ? '#2A9A8A' : '#4B5563',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        borderRadius: 0,
        marginBottom: 0,
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
          e.currentTarget.style.color = '#147B8D';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#4B5563';
        }
      }}
    >
      <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.icon}
      </div>
      <span style={{
        fontSize: 9.5,
        fontWeight: isActive ? 600 : 400,
        lineHeight: '12px',
        textAlign: 'center',
        color: 'inherit',
        maxWidth: 56,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {item.label}
      </span>
    </button>
  );
}
