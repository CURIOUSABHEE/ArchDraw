'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';

interface Props {
  label: string;
  children: ReactNode;
  placement?: 'top' | 'bottom';
}

export function TooltipWrapper({ label, children, placement = 'top' }: Props) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 300);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            [placement === 'top' ? 'bottom' : 'top']: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: '#f1f5f9',
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '4px 8px',
            borderRadius: 5,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
