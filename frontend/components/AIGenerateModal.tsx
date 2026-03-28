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
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, AlertCircle, CheckCircle2, ArrowRight, Zap, Layers, MessageSquare, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import type { GenerationProgress } from '@/lib/ai/types';
import { motion, AnimatePresence } from 'framer-motion';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (description: string) => Promise<void>;
}

const EXAMPLE_PROMPTS = [
  {
    title: 'E-Commerce',
    icon: Layers,
    description: 'Microservices e-commerce with user auth, product catalog, cart, payment, and order management',
    color: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Real-time Chat',
    icon: MessageSquare,
    description: 'Real-time chat application with WebSocket support, message persistence, and push notifications',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'CI/CD Pipeline',
    icon: Workflow,
    description: 'CI/CD pipeline from GitHub to production with monitoring and rollback',
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Data Pipeline',
    icon: Zap,
    description: 'Data pipeline from IoT devices to dashboard with stream processing and time-series storage',
    color: 'from-orange-500 to-amber-500',
  },
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-background border-border/50">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">
                AI Architecture Generator
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Describe your system architecture and let AI create a complete diagram for you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {/* Main Input Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold flex items-center gap-2">
                <span className="text-violet-500">●</span>
                Describe Your Architecture
              </label>
              <span className="text-xs text-muted-foreground">
                {description.length}/500
              </span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="E.g., A microservices-based e-commerce platform with user authentication, product catalog, shopping cart, payment processing, and order management services..."
              className="w-full h-32 px-4 py-3 text-sm rounded-xl border-border/50 bg-background/50 
                         placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 
                         focus:ring-violet-500/30 focus:border-violet-500/50 resize-none transition-all
                         hover:border-violet-500/30"
              disabled={isGenerating}
            />
          </div>

          {/* Quick Templates */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <span className="text-blue-500">●</span>
              Quick Start Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => fillExample(example.description)}
                  disabled={isGenerating}
                  className="group relative flex items-start gap-3 p-4 rounded-xl border border-border/50 
                           bg-gradient-to-br from-background/80 to-background/40 hover:from-violet-500/5 
                           hover:to-purple-500/5 hover:border-violet-500/30 transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${example.color} flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform`}>
                    <example.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold block mb-0.5">{example.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2 group-hover:text-muted-foreground/80">
                      {example.description}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 absolute right-3 top-1/2 -translate-y-1/2 
                                        opacity-0 group-hover:opacity-100 group-hover:translate-x-2 
                                        transition-all duration-200" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Generation Progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 p-5 rounded-2xl bg-gradient-to-r from-violet-500/5 to-purple-500/5 border border-violet-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Generating Architecture</p>
                      <p className="text-xs text-muted-foreground">This may take a few moments...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-violet-500">{progress?.progress || 0}%</p>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-violet-500/20 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress?.progress || 0}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

                {progress && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      Iteration {progress.iteration}
                    </span>
                    {progress.score > 0 && (
                      <span className={`flex items-center gap-1 ${progress.score >= 85 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        Score: {progress.score}/100
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 capitalize">
                      {progress.phase.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-500">Generation Failed</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success State */}
          <AnimatePresence>
            {progress?.phase === 'complete' && !error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-500">Generation Complete!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your architecture diagram is ready with {progress.message.match(/\d+/)?.[0] || 'multiple'} components
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50 shrink-0">
          <p className="text-xs text-muted-foreground">
            Powered by AI • May not always be perfect
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isGenerating}
              className="gap-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 
                       text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Diagram
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
