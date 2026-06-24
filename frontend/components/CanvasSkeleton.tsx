import React from 'react';

const PLACEHOLDER_BOXES = [
  { x: 20, y: 120, w: 140, h: 60 },
  { x: 230, y: 40, w: 140, h: 60 },
  { x: 230, y: 200, w: 140, h: 60 },
  { x: 440, y: 120, w: 140, h: 60 },
];

const PLACEHOLDER_EDGES = [
  { x1: 160, y1: 150, x2: 230, y2: 70 },
  { x1: 160, y1: 150, x2: 230, y2: 230 },
  { x1: 370, y1: 70, x2: 440, y2: 150 },
  { x1: 370, y1: 230, x2: 440, y2: 150 },
];

export function CanvasSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-[hsl(var(--canvas-bg))]/30 backdrop-blur-[1px]">
      <div className="w-[600px] h-[300px] max-w-full max-h-full flex items-center justify-center p-4">
        <svg width="100%" height="100%" viewBox="0 0 600 300" className="w-full h-full">
          {PLACEHOLDER_EDGES.map((e, i) => (
            <line
              key={`e-${i}`}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              className="stroke-slate-300 dark:stroke-slate-700"
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity={0.5}
            />
          ))}
          {PLACEHOLDER_BOXES.map((b, i) => (
            <rect
              key={`b-${i}`}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={10}
              className="fill-slate-200 dark:fill-slate-800 skeleton-shimmer"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
