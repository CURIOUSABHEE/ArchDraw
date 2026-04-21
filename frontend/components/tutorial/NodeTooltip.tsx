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
  role?: string;
  whyItMatters?: string;
  realWorldFact?: string;
  tradeoff?: string;
  interviewTip?: string;
  concepts?: string[];
}

export function NodeTooltip({
  label,
  description,
  category,
  color = '#6366f1',
  isDragging = false,
  children,
  role,
  whyItMatters,
  realWorldFact,
  tradeoff,
  interviewTip,
  concepts = [],
}: NodeTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    setPos({ x: e.clientX, y: e.clientY });
    timerRef.current = setTimeout(() => setVisible(true), 200);
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(false);
    }
  }, [isDragging]);

  const tooltipWidth = 320;
  const flipLeft = pos.x > window.innerWidth - tooltipWidth - 20;
  const flipDown = pos.y < 150;

  const hasRichContent = role || whyItMatters || realWorldFact || tradeoff || interviewTip || concepts.length > 0;

  const tooltip = visible && mounted ? createPortal(
    <div
      style={{
        position: 'fixed',
        left: flipLeft ? pos.x - tooltipWidth - 12 : pos.x + 12,
        top: flipDown ? pos.y + 20 : pos.y - 100,
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'nodeTooltipIn 0.15s ease forwards',
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '12px 14px',
          width: tooltipWidth,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-white">{label}</span>
          {category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
            >
              {category}
            </span>
          )}
        </div>
        
        {role && (
          <p className="text-[12px] text-slate-200 leading-relaxed mb-2">{role}</p>
        )}
        
        {whyItMatters && (
          <p className="text-[11px] text-amber-200/80 leading-relaxed mb-2">
            Without this: {whyItMatters}
          </p>
        )}
        
        {realWorldFact && (
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2 border-l-2 border-slate-600 pl-2">
            {realWorldFact}
          </p>
        )}
        
        {tradeoff && (
          <p className="text-[11px] text-blue-300/80 leading-relaxed mb-2">
            Tradeoff: {tradeoff}
          </p>
        )}
        
        {interviewTip && (
          <div className="mt-3 pt-2 border-t border-slate-700">
            <span className="text-[10px] font-semibold text-amber-400 mb-1 block">
              🎯 INTERVIEW
            </span>
            <p className="text-[11px] text-amber-100/90 leading-relaxed">{interviewTip}</p>
          </div>
        )}
        
        {concepts.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-700 flex flex-wrap gap-1.5">
            {concepts.map((concept, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                style={{ 
                  background: 'rgba(99, 102, 241, 0.15)', 
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.25)'
                }}
              >
                {concept}
              </span>
            ))}
          </div>
        )}
        
        {!hasRichContent && description && (
          <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
        )}
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
