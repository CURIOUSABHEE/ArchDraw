'use client';

import { TIER_COLORS, EDGE_STYLES } from '@/lib/tierColors';

export function DiagramLegend() {
  return (
    <div
      className="absolute top-4 left-4 z-50 bg-white rounded-xl shadow-lg border border-gray-100 p-4 pointer-events-auto"
      style={{
        minWidth: 200,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-3">
        Legend
      </div>

      {/* Edge Types */}
      <div className="space-y-2 mb-4">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Connections
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <svg width="40" height="4" className="shrink-0">
              <line x1="0" y1="2" x2="40" y2="2" stroke="#6366F1" strokeWidth="2" />
              <path d="M36 0 L40 2 L36 4 z" fill="#6366F1" />
            </svg>
            <span className="text-[11px] text-gray-600">Sync (REST/gRPC)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="40" height="4" className="shrink-0">
              <line x1="0" y1="2" x2="40" y2="2" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6,3" />
              <path d="M36 0 L40 2 L36 4 z" fill="#F59E0B" />
            </svg>
            <span className="text-[11px] text-gray-600">Async (Queue)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="40" height="4" className="shrink-0">
              <line x1="0" y1="2" x2="40" y2="2" stroke="#10B981" strokeWidth="2" strokeDasharray="2,2" />
              <path d="M36 0 L40 2 L36 4 z" fill="#10B981" />
            </svg>
            <span className="text-[11px] text-gray-600">Stream (WebSocket)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="40" height="4" className="shrink-0">
              <line x1="0" y1="2" x2="40" y2="2" stroke="#EC4899" strokeWidth="2" strokeDasharray="2,3" />
              <path d="M36 0 L40 2 L36 4 z" fill="#EC4899" />
            </svg>
            <span className="text-[11px] text-gray-600">Event (Pub/Sub)</span>
          </div>
        </div>
      </div>

      {/* Tier Colors */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2">
          Node Tiers
        </div>
        <div className="space-y-1.5">
          {Object.entries(TIER_COLORS).map(([tier, info]) => (
            <div key={tier} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: info.color }}
              />
              <span className="text-[11px] text-gray-600">{info.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
