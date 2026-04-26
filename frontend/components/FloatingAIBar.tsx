'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Sparkles, Plus, Mic, Send, Loader2, ChevronDown, Lightbulb, Zap, MessageSquare,
  Workflow, Layers, X, Clock, Star, Trash2, Search
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
  onGenerate: (description: string, model?: string) => Promise<void>;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: 'groq' | 'openrouter';
}

const MODELS: ModelOption[] = [
  { id: 'google/gemma-4-26b-a4b-it', name: 'Gemma 26B', description: 'OpenRouter Free - Fast & capable', provider: 'openrouter' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 120B', description: 'OpenRouter Free - Most capable', provider: 'openrouter' },
  { id: 'meta-llama/llama-3-8b-instruct', name: 'LLaMA 3 8B', description: 'OpenRouter Free - Great for reasoning', provider: 'openrouter' },
  { id: 'mistralai/mistral-nemo-instruct-2407', name: 'Mistral Nemo', description: 'OpenRouter Free - Balanced', provider: 'openrouter' },
];

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

export function FloatingAIBar({ onGenerate }: FloatingAIBarProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [activeTab, setActiveTab] = useState<'inspiration' | 'history'>('inspiration');
  const inputRef = useRef<HTMLInputElement>(null);

  const { history, favorites, addToHistory, getSuggestions, clearHistory, addToFavorites, removeFromFavorites } = usePromptHistory();
  
  const suggestions = getSuggestions(input);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) {
      toast.error('Please describe your architecture');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(null);

    try {
      await onGenerate(input, selectedModel.id);
      addToHistory(input, selectedModel.id);
      setInput('');
      setIsExpanded(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [input, onGenerate, selectedModel, addToHistory]);

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

  const selectHistoryItem = (item: { prompt: string }) => {
    setInput(item.prompt);
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
                                  {item.nodeCount ? `${item.nodeCount} nodes` : 'Just now'}
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
