'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Panel } from 'reactflow';
import { useReactFlow } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import { LAYOUT_PRESETS, LayoutPreset } from '@/lib/canvas/layoutPresets';
import { applyLayoutPreset } from '@/lib/canvas/applyLayout';

export function AutoLayoutButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const setNodes = useDiagramStore((s) => s.setNodes);
  const activeLayoutPresetId = useDiagramStore((s) => s.activeLayoutPresetId);
  const setActiveLayoutPresetId = useDiagramStore((s) => s.setActiveLayoutPresetId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = useCallback(async (preset: LayoutPreset) => {
    if (isLoading) return;

    setIsLoading(true);
    setActiveLayoutPresetId(preset.id);
    setIsOpen(false);

    try {
      const currentNodes = nodes;
      const currentEdges = edges;
      const newNodes = await applyLayoutPreset(currentNodes, currentEdges, preset);
      setNodes(newNodes);

      setTimeout(() => {
        fitView({ 
          padding: 0.15, 
          duration: 400,
        });
      }, 50);

    } catch (error) {
      console.error('[AutoLayout] Failed to apply layout:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, nodes, edges, setNodes, fitView, setActiveLayoutPresetId]);

  const activePreset = LAYOUT_PRESETS.find(p => p.id === activeLayoutPresetId);

  return (
    <Panel position="top-left">
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '8px',
            border: '1px solid var(--color-border-secondary)',
            background: isOpen
              ? 'var(--color-background-secondary)'
              : 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? (
            <span style={{
              width: '14px',
              height: '14px',
              border: '2px solid var(--color-border-secondary)',
              borderTopColor: 'var(--color-text-primary)',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }}/>
          ) : (
            <span style={{ fontSize: '14px' }}>{activePreset?.icon ?? '→'}</span>
          )}
          Auto Layout
          <span style={{
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
            display: 'inline-block',
          }}>▼</span>
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            background: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-tertiary)',
            borderRadius: '10px',
            padding: '6px',
            minWidth: '220px',
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              padding: '4px 8px 8px',
            }}>
              Choose Layout
            </div>

            {LAYOUT_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeLayoutPresetId === preset.id
                    ? 'var(--color-background-secondary)'
                    : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (activeLayoutPresetId !== preset.id) {
                    (e.currentTarget as HTMLElement).style.background =
                      'var(--color-background-secondary)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeLayoutPresetId !== preset.id) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: activeLayoutPresetId === preset.id
                    ? 'var(--color-background-info)'
                    : 'var(--color-background-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0,
                }}>
                  {preset.icon}
                </span>

                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: activeLayoutPresetId === preset.id ? 500 : 400,
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.3,
                  }}>
                    {preset.label}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.3,
                  }}>
                    {preset.description}
                  </div>
                </div>

                {activeLayoutPresetId === preset.id && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    color: 'var(--color-text-info)',
                  }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </Panel>
  );
}
