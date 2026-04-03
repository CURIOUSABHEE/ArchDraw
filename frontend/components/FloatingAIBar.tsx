'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Sparkles, Plus, Mic, Send, Loader2, ChevronDown, Lightbulb, Zap, MessageSquare,
  Workflow, Layers, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import type { GenerationProgress } from '@/lib/ai/types';
import { toast } from 'sonner';

interface FloatingAIBarProps {
  onGenerate: (description: string) => Promise<void>;
}

const INSPIRATION_PROMPTS = [
  {
    title: 'E-Commerce Platform',
    icon: Layers,
    description: 'User auth, product catalog, cart, payments, orders',
    prompt: 'Microservices e-commerce with user authentication, product catalog, shopping cart, payment processing, and order management',
  },
  {
    title: 'Real-time Chat',
    icon: MessageSquare,
    description: 'WebSocket, persistence, notifications',
    prompt: 'Real-time chat application with WebSocket support, message persistence, and push notifications',
  },
  {
    title: 'CI/CD Pipeline',
    icon: Workflow,
    description: 'GitHub to production, monitoring',
    prompt: 'CI/CD pipeline from GitHub to production with monitoring and rollback capabilities',
  },
  {
    title: 'Data Pipeline',
    icon: Zap,
    description: 'IoT to dashboard, stream processing',
    prompt: 'Data pipeline from IoT devices to dashboard with stream processing and time-series storage',
  },
];

const MODELS = [
  { id: 'llama-3', name: 'LLaMA 3', description: 'Fast & local' },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Best overall' },
  { id: 'claude-3.5', name: 'Claude 3.5', description: 'Best for complex' },
  { id: 'gemini-2', name: 'Gemini 2', description: 'Fast & capable' },
];

export function FloatingAIBar({ onGenerate }: FloatingAIBarProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) {
      toast.error('Please describe your architecture');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(null);

    try {
      await onGenerate(input);
      setInput('');
      setIsExpanded(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [input, onGenerate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
      setInput('');
    }
  };

  const selectInspiration = (prompt: string) => {
    setInput(prompt);
    setIsExpanded(true);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4"
    >
      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="solid-panel flex items-center gap-4 px-5 py-4"
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Generating Architecture</span>
                <span className="text-sm font-bold text-primary">{progress?.progress || 0}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress?.progress || 0}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="solid-panel flex items-center gap-3 px-4 py-3"
          >
            {/* Add Button */}
            <button
              className="solid-icon-btn"
              title="Add component"
              onClick={() => window.dispatchEvent(new CustomEvent('open-create-component'))}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Divider */}
            <div className="w-px h-7 bg-foreground/10" />

            {/* Inspiration Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="solid-dropdown-trigger">
                  <Lightbulb className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Inspiration</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 py-2">
                  Quick Start Templates
                </p>
                {INSPIRATION_PROMPTS.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => selectInspiration(item.prompt)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Model Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="solid-dropdown-trigger">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">{selectedModel.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                      selectedModel.id === model.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                  </button>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Main Input */}
            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your architecture..."
                className="solid-input text-sm w-full h-11 px-4"
                disabled={isGenerating}
              />
            </div>

            {/* Mic Button (disabled) */}
            <button 
              className="solid-icon-btn opacity-30 cursor-not-allowed" 
              disabled 
              title="Voice input coming soon"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Submit Button */}
            <button
              onClick={handleGenerate}
              disabled={!input.trim() || isGenerating}
              className="solid-submit-btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Input Area */}
      <AnimatePresence>
        {isExpanded && input && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="solid-panel mt-2 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">AI Architecture Generator</p>
                <p className="text-xs text-muted-foreground">
                  Describe your system architecture and let AI create a complete diagram for you.
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
