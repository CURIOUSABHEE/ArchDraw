'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bot, Plus, Lightbulb, Check, AlertCircle, CheckCircle, Search,
} from 'lucide-react';
import type { TutorialStep, TutorialData } from '@/data/tutorials';
import type { TutorialMessage } from '@/store/tutorialStore';
import { useTutorialStore } from '@/store/tutorialStore';

interface GuidePanelProps {
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  tutorial: TutorialData;
  messages: TutorialMessage[];
  isTyping: boolean;
  validationStatus: 'idle' | 'success' | 'error';
  validationError: string;
  onValidate: () => void;
  onSkip: () => void;
}

export function GuidePanel({
  step,
  currentStep,
  totalSteps,
  tutorial,
  messages,
  isTyping,
  validationStatus,
  validationError,
  onValidate,
  onSkip,
}: GuidePanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);
  const { addMessage, clearMessages } = useTutorialStore();

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  // Load step messages immediately on step change
  useEffect(() => {
    if (!tutorial || currentStep < 1) return;
    const stepData = tutorial.steps[currentStep - 1];
    if (!stepData?.messages) return;
    clearMessages();
    for (const msg of stepData.messages) {
      addMessage(msg.type, msg.content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, tutorial?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Progress */}
      <div className="p-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs text-indigo-400 font-medium">
            {currentStep}/{totalSteps} steps
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Current step */}
      <div className="p-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-bold shrink-0">
            {currentStep}
          </div>
          <span className="text-xs text-indigo-400 font-medium uppercase tracking-wide">
            Current Step
          </span>
        </div>

        <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{step.explanation}</p>

        {step.action && (
          <div
            className="mt-3 p-3 rounded-lg"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-3 h-3 text-indigo-400" />
              <span className="text-xs text-indigo-400 font-medium">Your task:</span>
            </div>
            <p className="text-xs text-white leading-relaxed">{step.action}</p>

            {/* Cmd+K hint */}
            <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono border border-white/20">
                  {isMac ? '⌘' : 'Ctrl'}
                </kbd>
                <span className="text-[10px] text-slate-500">+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono border border-white/20">
                  K
                </kbd>
              </div>
              <span className="text-[10px] text-slate-400">to search and add components</span>
            </div>

            {/* Step-specific search hint */}
            {(step as any).searchHint && (
              <button
                onClick={() => {
                  const fn = (window as any).__tutorialOpenPalette;
                  if (fn) fn((step as any).searchHint);
                }}
                className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors group"
              >
                <Search className="w-3 h-3" />
                Search for &ldquo;{(step as any).searchHint}&rdquo;
                <span className="text-slate-600 group-hover:text-slate-500">or press ⌘K</span>
              </button>
            )}
          </div>
        )}

        {step.why && (
          <div
            className="mt-2 p-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">Why this matters:</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{step.why}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${
              msg.type === 'guide' ? 'items-start' : 'items-end flex-row-reverse'
            }`}
          >
            {msg.type === 'guide' && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#4f46e5' }}
              >
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.type === 'success'
                  ? 'rounded-tl-sm'
                  : msg.type === 'error'
                  ? 'rounded-tl-sm'
                  : msg.type === 'guide'
                  ? 'rounded-tl-sm'
                  : 'rounded-tr-sm'
              }`}
              style={{
                background:
                  msg.type === 'success'
                    ? 'rgba(34,197,94,0.1)'
                    : msg.type === 'error'
                    ? 'rgba(239,68,68,0.1)'
                    : msg.type === 'guide'
                    ? 'rgba(255,255,255,0.06)'
                    : '#4f46e5',
                color:
                  msg.type === 'success'
                    ? '#4ade80'
                    : msg.type === 'error'
                    ? '#f87171'
                    : '#cbd5e1',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 items-start">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#4f46e5' }}
            >
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div
              className="rounded-xl rounded-tl-sm px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: '0.15s' }}
                />
                <div
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Actions */}
      <div className="p-4 shrink-0 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {validationStatus === 'success' && (
          <div
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-xs text-green-400">Step completed! Well done.</span>
          </div>
        )}

        {validationStatus === 'error' && (
          <div
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-400">{validationError}</span>
          </div>
        )}

        <button
          onClick={onValidate}
          className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          style={{ background: '#4f46e5' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#6366f1')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
        >
          <Check className="w-4 h-4" />
          Check my work
        </button>

        <button
          onClick={onSkip}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          Skip this step →
        </button>
      </div>
    </div>
  );
}
