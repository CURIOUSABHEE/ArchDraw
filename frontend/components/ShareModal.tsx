'use client';

import { useState } from 'react';
import { X, Share2, Copy, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  shareUrl: string;
  canvasName: string;
  onClose: () => void;
}

export function ShareModal({ shareUrl, canvasName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[10px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
            <div className="w-6 h-6 rounded-md bg-indigo-500/15 flex items-center justify-center">
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Share Diagram</p>
              <p className="text-[10px] text-muted-foreground truncate">{canvasName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* URL row */}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs bg-muted/60 border border-border/60 rounded-md outline-none text-foreground/80 font-mono select-all"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                  copied
                    ? 'bg-green-500/15 text-green-500 border border-green-500/20'
                    : 'bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white border border-indigo-500/20 hover:border-indigo-500'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground">
                Anyone with this link can view and interact with this diagram.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                <Clock className="w-3 h-3" />
                <span>Link expires in 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
