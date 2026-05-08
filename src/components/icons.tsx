import React from 'react';

/** Small standing clock for "Tentative" confirmation status */
export function ClockIcon({ size = 11, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="2" />
      <path
        d="M7 4v3.2l2.1 1.4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Checkmark for "Confirmed" */
export function CheckIcon({ size = 11, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M2.5 7.5l3 3L11 4"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
