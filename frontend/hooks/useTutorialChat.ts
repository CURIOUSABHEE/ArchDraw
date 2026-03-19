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
  suggestions: string[];
  history: ChatMessage[];
  clearHistory: () => void;
}

const MIN_CALL_INTERVAL_MS = 2000;
const DEBOUNCE_MS = 500;

export function useTutorialChat(opts: UseTutorialChatOptions): UseTutorialChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const lastCallRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Deduplication: track in-flight question hashes
  const pendingRef = useRef<Map<string, Promise<void>>>(new Map());

  const sendMessage = useCallback(
    (question: string): Promise<void> => {
      // Debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);

      return new Promise((resolve) => {
        debounceRef.current = setTimeout(async () => {
          const trimmed = question.trim();
          if (!trimmed) { resolve(); return; }

          // Rate limit
          const now = Date.now();
          if (now - lastCallRef.current < MIN_CALL_INTERVAL_MS) { resolve(); return; }

          // Dedup
          const key = trimmed.toLowerCase().slice(0, 50);
          if (pendingRef.current.has(key)) {
            await pendingRef.current.get(key);
            resolve();
            return;
          }

          // Cancel previous request
          abortRef.current?.abort();
          abortRef.current = new AbortController();

          lastCallRef.current = Date.now();
          setIsLoading(true);
          setStreamingContent('');
          setSuggestions([]);

          const execute = (async () => {
            try {
              const res = await fetch('/api/tutorial-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: abortRef.current!.signal,
                body: JSON.stringify({
                  tutorialId: opts.tutorialId,
                  stepNumber: opts.stepNumber,
                  stepTitle: opts.stepTitle,
                  stepExplanation: opts.stepExplanation,
                  question: trimmed,
                  history: history.slice(-8), // send last 8 messages for context
                }),
              });

              if (!res.ok || !res.body) throw new Error('Request failed');

              // Check cache hit — non-streaming response
              const cacheHeader = res.headers.get('X-Cache');
              if (cacheHeader === 'HIT') {
                const data = await res.json();
                setStreamingContent(data.content);
                setSuggestions(data.suggestions ?? []);
                setHistory(prev => [
                  ...prev,
                  { role: 'user', content: trimmed },
                  { role: 'assistant', content: data.content },
                ]);
                return;
              }

              // Stream
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let accumulated = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                accumulated += chunk;

                // Check for suggestions marker
                const markerIdx = accumulated.indexOf('|||SUGGESTIONS|||');
                if (markerIdx !== -1) {
                  const cleanText = accumulated.slice(0, markerIdx).trim();
                  setStreamingContent(cleanText);

                  const match = accumulated.match(/\|\|\|SUGGESTIONS\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
                  if (match) {
                    try {
                      setSuggestions(JSON.parse(match[1]));
                    } catch { /* ignore */ }
                  }
                } else {
                  setStreamingContent(accumulated);
                }
              }

              const finalText = accumulated
                .replace(/\|\|\|SUGGESTIONS\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '')
                .trim();

              setHistory(prev => [
                ...prev,
                { role: 'user', content: trimmed },
                { role: 'assistant', content: finalText },
              ]);
            } catch (err: unknown) {
              if (err instanceof Error && err.name === 'AbortError') return;
              console.error('Tutorial chat error:', err);
              setStreamingContent('Sorry, something went wrong. Please try again.');
            } finally {
              setIsLoading(false);
              pendingRef.current.delete(key);
            }
          })();

          pendingRef.current.set(key, execute);
          await execute;
          resolve();
        }, DEBOUNCE_MS);
      });
    },
    [opts.tutorialId, opts.stepNumber, opts.stepTitle, opts.stepExplanation, history],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setStreamingContent('');
    setSuggestions([]);
  }, []);

  return { sendMessage, isLoading, streamingContent, suggestions, history, clearHistory };
}
