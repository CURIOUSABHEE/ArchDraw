'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface NodeTooltipProps {
  label: string;
  description?: string;
  category?: string;
  color?: string;
  isDragging?: boolean;
  children: React.ReactNode;
}

export function NodeTooltip({
  label,
  description,
  category,
  color = '#6366f1',
  isDragging = false,
  children,
}: NodeTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, above: true });
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const show = useCallback(() => {
    if (isDragging || !description) return;
    timerRef.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const above = rect.top > 120;
      setPos({
        x: rect.left + rect.width / 2,
        y: above ? rect.top - 8 : rect.bottom + 8,
        above,
      });
      setVisible(true);
    }, 400);
  }, [isDragging, description]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  // Hide immediately when dragging starts
  useEffect(() => {
    if (isDragging) hide();
  }, [isDragging, hide]);

  const tooltip = visible && mounted && description ? createPortal(
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: pos.above
          ? 'translate(-50%, -100%)'
          : 'translate(-50%, 0)',
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'nodeTooltipIn 0.15s ease forwards',
      }}
    >
      <div
        style={{
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '8px 12px',
          maxWidth: 220,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-white">{label}</span>
          {category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: `${color}18`,
                color,
                border: `1px solid ${color}30`,
              }}
            >
              {category}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
        {/* Arrow */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            ...(pos.above
              ? { bottom: -5, borderTop: '5px solid rgba(255,255,255,0.1)', borderLeft: '5px solid transparent', borderRight: '5px solid transparent' }
              : { top: -5, borderBottom: '5px solid rgba(255,255,255,0.1)', borderLeft: '5px solid transparent', borderRight: '5px solid transparent' }),
            width: 0,
            height: 0,
          }}
        />
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <style>{`
        @keyframes nodeTooltipIn {
          from { opacity: 0; transform: translate(-50%, calc(${pos.above ? '-100%' : '0%'} + ${pos.above ? '4px' : '-4px'})); }
          to   { opacity: 1; transform: translate(-50%, ${pos.above ? '-100%' : '0%'}); }
        }
      `}</style>
      <div ref={containerRef} onMouseEnter={show} onMouseLeave={hide} style={{ display: 'contents' }}>
        {children}
      </div>
      {tooltip}
    </>
  );
}
