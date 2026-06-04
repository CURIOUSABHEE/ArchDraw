'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, Mic, Send, Loader2, ChevronDown, Lightbulb, Clock, Star, Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import type { GenerationProgress } from '@/lib/ai/types';
import { toast } from 'sonner';
import { usePromptHistory, PROMPT_SUGGESTIONS } from '@/store/promptHistory';

interface FloatingAIBarProps {
  onGenerate: (description: string, diagramSize: 'small' | 'medium' | 'large') => Promise<void>;
}

export function FloatingAIBar({ onGenerate }: FloatingAIBarProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [diagramSize, setDiagramSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [activeTab, setActiveTab] = useState<'inspiration' | 'history'>('inspiration');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { history, addToHistory, getSuggestions, clearHistory, addToFavorites } = usePromptHistory();
  
  // Auto-grow textarea height calculation
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 56), 200)}px`;
    }
  }, [input]);

  // Global keyboard shortcut: Shift+? (e.key === '?') to focus prompt input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') {
        const active = document.activeElement;
        const isInput = active && (
          active.tagName === 'INPUT' || 
          active.tagName === 'TEXTAREA' || 
          active.getAttribute('contenteditable') === 'true'
        );
        if (!isInput) {
          e.preventDefault();
          textareaRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) {
      toast.error('Please describe your architecture');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await onGenerate(input, diagramSize);
      addToHistory(input, diagramSize);
      setInput('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [input, onGenerate, diagramSize, addToHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === 'Escape') {
      setInput('');
    }
  };

  const selectInspiration = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const selectHistoryItem = (item: { prompt: string }) => {
    setInput(item.prompt);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="input"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="flex flex-col w-full rounded-[20px] overflow-hidden border border-border/40 focus-within:border-primary/50 bg-card shadow-soft-3 transition-colors duration-200"
        >
          {/* Top Section */}
          <div className="p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your architecture, or paste a GitHub repo link… (e.g. https://github.com/owner/repo)"
              className="w-full bg-transparent border-0 border-transparent outline-none focus:outline-none focus:ring-0 focus:border-transparent focus:border-0 focus-visible:ring-0 resize-none text-sm text-foreground placeholder:text-muted-foreground/60 p-2 min-h-[56px] shadow-none focus:shadow-none focus-visible:!outline-none focus:!outline-none focus-visible:!ring-0"
              disabled={isGenerating}
            />
          </div>

          {/* Bottom Section (Toolbar) */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-border/10 bg-muted/20">
            {/* Left items */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Add Button */}
              <button
                className="solid-icon-btn shrink-0"
                title="Add component"
                onClick={() => window.dispatchEvent(new CustomEvent('open-create-component'))}
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Divider */}
              <div className="w-px h-5 bg-border/20 shrink-0" />

              {/* Inspiration Dropdown */}
              <DropdownMenu open={showHistory} onOpenChange={setShowHistory}>
                <DropdownMenuTrigger asChild>
                  <button className="solid-dropdown-trigger">
                    <Lightbulb className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Inspiration</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-80 p-0 !bg-white !text-black"
                  style={{ backgroundColor: '#ffffff', opacity: 1, backdropFilter: 'none' }}
                >
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setActiveTab('inspiration')}
                      className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                        activeTab === 'inspiration' 
                          ? 'text-primary border-b-2 border-primary' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Templates
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                        activeTab === 'history' 
                          ? 'text-primary border-b-2 border-primary' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      History ({history.length})
                    </button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto p-2">
                    {activeTab === 'inspiration' ? (
                      <>
                        {PROMPT_SUGGESTIONS.map((category) => (
                          <div key={category.category} className="mb-4">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1">
                              {category.category}
                            </p>
                            {category.prompts.map((item, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  selectInspiration(item.prompt);
                                  setShowHistory(false);
                                }}
                                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
                              >
                                <p className="text-sm font-medium">{item.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                              </button>
                            ))}
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {history.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No history yet</p>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => clearHistory()}
                              className="w-full text-xs text-muted-foreground hover:text-destructive px-3 py-2 text-left flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Clear History
                            </button>
                            {history.slice(0, 10).map((item) => (
                              <div
                                key={item.id}
                                className="group flex items-start gap-2 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                onClick={() => {
                                  selectHistoryItem(item);
                                  setShowHistory(false);
                                }}
                              >
                                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{item.prompt}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.model ? `Size: ${item.model}` : 'Just now'}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToFavorites(item);
                                    toast.success('Added to favorites');
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
                                >
                                  <Star className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Divider */}
              <div className="w-px h-5 bg-border/20 shrink-0" />

              {/* Segmented Size Selector */}
              <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border/10">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setDiagramSize(size)}
                    className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                      diagramSize === size
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Right items */}
            <div className="flex items-center gap-2">
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
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
