'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GenerationProgress } from '@/lib/ai/types';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (description: string) => Promise<void>;
}

const EXAMPLE_PROMPTS = [
  'Microservices e-commerce with user auth, product catalog, cart, payment, and order management',
  'Real-time chat application with WebSocket support, message persistence, and push notifications',
  'CI/CD pipeline from GitHub to production with monitoring and rollback',
  'Data pipeline from IoT devices to dashboard with stream processing and time-series storage',
];

export function AIGenerateModal({ isOpen, onClose, onGenerate }: AIGenerateModalProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      toast.error('Please describe your architecture');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(null);

    try {
      await onGenerate(description);
      setDescription('');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [description, onGenerate, onClose]);

  const handleClose = useCallback(() => {
    if (!isGenerating) {
      setDescription('');
      setProgress(null);
      setError(null);
      onClose();
    }
  }, [isGenerating, onClose]);

  const fillExample = (example: string) => {
    setDescription(example);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Architecture Generator
          </DialogTitle>
          <DialogDescription>
            Describe your system architecture and let AI generate a complete diagram for you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">System Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your architecture... (e.g., microservices e-commerce system with user auth, product catalog, cart, payment, and order management)"
              className="w-full h-32 px-3 py-2 text-sm rounded-lg border border-input bg-background 
                         placeholder:text-muted-foreground focus:outline-none focus:ring-2 
                         focus:ring-ring focus:border-transparent resize-none"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Example prompts</label>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => fillExample(example)}
                  className="text-xs px-3 py-1.5 rounded-full bg-accent/50 hover:bg-accent 
                             text-muted-foreground hover:text-foreground transition-colors
                             border border-border/50"
                  disabled={isGenerating}
                >
                  {example.split(' ').slice(0, 5).join(' ')}...
                </button>
              ))}
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-3 p-4 rounded-lg bg-accent/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Generating...</span>
              </div>

              {progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.message}</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Iteration: {progress.iteration}</span>
                    {progress.score > 0 && <span>Score: {progress.score}/100</span>}
                    <span className="capitalize">Phase: {progress.phase.replace('_', ' ')}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {progress?.phase === 'complete' && !error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-600">Generation Complete!</p>
                <p className="text-xs text-muted-foreground">
                  Created {progress.message.match(/\d+/)?.[0] || 'multiple'} components
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
