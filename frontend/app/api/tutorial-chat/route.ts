import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import {
  getCacheKey,
  hashQuestion,
  getCached,
  setCache,
  compressHistory,
  type CompressedMessage,
} from '@/lib/tutorialCache';

// Lazy-initialize to avoid build-time errors when env var is absent
let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

const SYSTEM_PROMPT = `You are an expert system design tutor helping users learn architecture patterns through hands-on diagramming. 
You are concise, encouraging, and technically precise. 
When answering questions, relate your answers back to the current tutorial step and the component being discussed.
Keep responses under 150 words. End with a brief follow-up suggestion if relevant.
After your response, output exactly this format on a new line:
|||SUGGESTIONS|||["suggestion 1","suggestion 2","suggestion 3"]|||END|||`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tutorialId,
      stepNumber,
      stepTitle,
      stepExplanation,
      question,
      history = [],
    }: {
      tutorialId: string;
      stepNumber: number;
      stepTitle: string;
      stepExplanation: string;
      question: string;
      history: CompressedMessage[];
    } = body;

    if (!tutorialId || !stepNumber || !question) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check cache
    const qHash = hashQuestion(question);
    const cacheKey = getCacheKey(tutorialId, stepNumber, 'question', qHash);
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(
        { content: cached.content, suggestions: cached.suggestions },
        { headers: { 'X-Cache': 'HIT' } },
      );
    }

    const contextMessage = `Current tutorial step ${stepNumber}: "${stepTitle}"\nContext: ${stepExplanation}`;
    const compressedHistory = compressHistory(history);

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: contextMessage },
      ...compressedHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ];

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await getGroq().chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages,
            max_tokens: 300,
            temperature: 0.7,
            stream: true,
          });

          let fullText = '';
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              fullText += delta;
              controller.enqueue(encoder.encode(delta));
            }
          }

          // Parse suggestions from response
          const suggestionMatch = fullText.match(/\|\|\|SUGGESTIONS\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
          let suggestions: string[] = [];
          let cleanContent = fullText;

          if (suggestionMatch) {
            try {
              suggestions = JSON.parse(suggestionMatch[1]);
              cleanContent = fullText.replace(/\|\|\|SUGGESTIONS\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '').trim();
            } catch {
              // keep suggestions empty
            }
          }

          // Cache the result
          setCache(cacheKey, cleanContent, suggestions);

          // Send suggestions marker
          if (suggestions.length > 0) {
            controller.enqueue(
              encoder.encode(`|||SUGGESTIONS|||${JSON.stringify(suggestions)}|||END|||`),
            );
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Cache': 'MISS',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Tutorial chat error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
