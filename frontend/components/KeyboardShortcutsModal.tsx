'use client';

import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { category: 'Selection', items: [
    { key: 'Click',          action: 'Select node' },
    { key: '⇧ + Click',     action: 'Add to selection' },
    { key: '⌘ A',            action: 'Select all' },
    { key: 'Esc',            action: 'Deselect all' },
  ]},
  { category: 'Clipboard', items: [
    { key: '⌘ C',            action: 'Copy' },
    { key: '⌘ V',            action: 'Paste' },
    { key: '⌘ X',            action: 'Cut' },
    { key: '⌘ D',            action: 'Duplicate' },
  ]},
  { category: 'Movement', items: [
    { key: 'Arrow keys',     action: 'Move node 1px' },
    { key: '⇧ + Arrows',    action: 'Move node 10px' },
  ]},
  { category: 'Canvas', items: [
    { key: 'Space + Drag',   action: 'Pan canvas' },
    { key: 'Scroll',         action: 'Zoom in / out' },
    { key: '⌘ + / -',       action: 'Zoom in / out' },
    { key: '⌘ 0',           action: 'Reset zoom' },
    { key: 'Middle click',   action: 'Pan canvas' },
  ]},
  { category: 'Edit', items: [
    { key: 'Delete / ⌫',    action: 'Delete selected' },
    { key: '⌘ Z',           action: 'Undo' },
    { key: '⌘ ⇧ Z',        action: 'Redo' },
    { key: '⌘ K',           action: 'Command palette' },
  ]},
  { category: 'Nodes', items: [
    { key: 'Drag node',      action: 'Move node' },
    { key: 'Drag port',     action: 'Create connection' },
    { key: 'Right-click',   action: 'Context menu' },
  ]},
];

interface Props { onClose: () => void }

export function KeyboardShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[6px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-white">Keyboard Shortcuts</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {SHORTCUTS.map((section) => (
                <div key={section.category}>
                  <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-2 px-1">
                    {section.category}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map(({ key, action }) => (
                      <div 
                        key={key} 
                        className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
                      >
                        <span className="text-xs text-slate-400">{action}</span>
                        <kbd className="text-[10px] font-mono font-medium text-slate-300 bg-white/8 border border-white/10 rounded px-1.5 py-0.5 ml-2 shrink-0">
                          {key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-2.5 border-t border-white/8">
            <p className="text-[10px] text-slate-600 text-center">Press ? to toggle this panel</p>
          </div>
        </div>
      </div>
    </>
  );
}
