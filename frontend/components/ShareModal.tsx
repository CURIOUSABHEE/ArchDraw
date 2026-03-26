'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Check, Link2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Props {
  shareUrl: string;
  canvasName: string;
  onClose: () => void;
}

export function ShareModal({ shareUrl, canvasName, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
      e.preventDefault();
      handleCopy();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Share Diagram</DialogTitle>
              <DialogDescription className="text-xs">
                {canvasName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                readOnly
                value={shareUrl}
                className="pr-20 font-mono text-sm h-11 bg-muted/50"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Badge 
                variant="secondary" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] h-5 px-1.5"
              >
                <Clock className="w-2.5 h-2.5 mr-1" />
                30 days
              </Badge>
            </div>
          </div>

          <Button 
            onClick={handleCopy} 
            className="w-full h-11 text-sm font-medium"
            variant={copied ? 'secondary' : 'default'}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Anyone with this link can view this diagram. No account required.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
