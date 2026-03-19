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
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (isDragging || !description) return;
    setPos({ x: e.clientX, y: e.clientY });
    timerRef.current = setTimeout(() => setVisible(true), 400);
  }, [isDragging, description]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      if (timerRef.current) clearTimeout(timerRef.current);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
    }
  }, [isDragging]);

  const flipLeft = pos.x > window.innerWidth - 220;

  const tooltip = visible && mounted && description ? createPortal(
    <div
      style={{
        position: 'fixed',
        left: pos.x + 12,
        top: pos.y - 80,
        transform: flipLeft ? 'translateX(-110%)' : 'translateX(0)',
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
          width: 192,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-white">{label}</span>
          {category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
            >
              {category}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <style>{`
        @keyframes nodeTooltipIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
      {tooltip}
    </>
  );
}
