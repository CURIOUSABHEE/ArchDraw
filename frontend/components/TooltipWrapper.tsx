'use client';

import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  label: string;
  children: ReactNode;
  placement?: 'top' | 'bottom';
}

export function TooltipWrapper({ label, children, placement = 'bottom' }: Props) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: placement === 'bottom' ? rect.bottom + 6 : rect.top - 6,
        });
      }
      setVisible(true);
    }, 300);
  }, [placement]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && typeof document !== 'undefined' && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            left: coords.x,
            ...(placement === 'bottom'
              ? { top: coords.y }
              : { bottom: window.innerHeight - coords.y }),
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
        </div>,
        document.body
      )}
    </div>
  );
}
