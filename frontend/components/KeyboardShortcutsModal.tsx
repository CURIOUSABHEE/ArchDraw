'use client';

import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') onOpenChange(false); 
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center gap-2 shrink-0">
          <Keyboard className="w-4 h-4 text-primary" />
          <DialogTitle className="text-sm font-semibold">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {SHORTCUTS.map((section) => (
              <div key={section.category}>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">
                  {section.category}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(({ key, action }) => (
                    <div 
                      key={key} 
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-xs text-muted-foreground">{action}</span>
                      <kbd className="text-[10px] font-mono font-medium text-foreground bg-muted border border-border rounded px-1.5 py-0.5 ml-2 shrink-0">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">Press ? to toggle this panel</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
