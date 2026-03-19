'use client';

import { useState, useRef, useCallback } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseTutorialChatOptions {
  tutorialId: string;
  stepNumber: number;
  stepTitle: string;
  stepExplanation: string;
}

interface UseTutorialChatReturn {
  sendMessage: (question: string) => Promise<void>;
  isLoading: boolean;
  streamingContent: string;
  clearHistory: () => void;
  abort: () => void;
}

export function useTutorialChat(_opts: UseTutorialChatOptions): UseTutorialChatReturn {
  // Start as true so loading dots show immediately on mount
  const [isLoading, setIsLoading] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');

  const historyRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const optsRef = useRef(_opts);
  optsRef.current = _opts;

  const sendMessage = useCallback(async (question: string): Promise<void> => {
    const trimmed = question.trim();
    if (!trimmed) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);

    console.log('[TutorialChat] sendMessage', {
      phase: trimmed.match(/PHASE:(\w+)/)?.[1] ?? 'free-text',
      step: optsRef.current.stepNumber,
      title: optsRef.current.stepTitle,
    });

    try {
      const res = await fetch('/api/tutorial-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          tutorialId: optsRef.current.tutorialId,
          stepNumber: optsRef.current.stepNumber,
          stepTitle: optsRef.current.stepTitle,
          stepExplanation: optsRef.current.stepExplanation,
          question: trimmed,
          history: historyRef.current.slice(-6),
        }),
      });

      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

      console.log('[TutorialChat] response received, cache:', res.headers.get('X-Cache'));

      // Runtime cache hit — JSON response (not a stream)
      if (res.headers.get('X-Cache') === 'HIT') {
        const data = await res.json();
        setStreamingContent(data.content);
        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: trimmed },
          { role: 'assistant', content: data.content },
        ];
        // NOTE: falls through to finally which sets isLoading(false)
        return;
      }

      // Streaming response (live Groq or STATIC-HIT)
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        if (firstChunk) {
          firstChunk = false;
          console.log('[TutorialChat] first chunk received, length:', chunk.length);
          setStreamingContent(accumulated);
        } else {
          setStreamingContent(accumulated);
        }
      }

      const finalText = accumulated.trim();
      console.log('[TutorialChat] stream complete, total chars:', finalText.length);

      // Fallback: if stream completed but was empty, use step explanation
      if (!finalText) {
        console.warn('[TutorialChat] empty stream response — using fallback');
        setStreamingContent(optsRef.current.stepExplanation || 'Let\'s continue building.');
      }

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: trimmed },
        { role: 'assistant', content: finalText || optsRef.current.stepExplanation },
      ];
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[TutorialChat] aborted');
        return;
      }
      console.error('[TutorialChat] error:', err);
      // Always show something — never leave the bubble empty on error
      setStreamingContent(optsRef.current.stepExplanation || 'Something went wrong. Try adding the component to continue.');
    } finally {
      setIsLoading(false);
    }
  }, []); // stable — all reads via refs

  // Expose abort controller so GuidePanel timeouts can cancel hung requests
  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const clearHistory = useCallback(() => {
    abortRef.current?.abort();
    historyRef.current = [];
  }, []);

  return { sendMessage, isLoading, streamingContent, clearHistory, abort };
}
