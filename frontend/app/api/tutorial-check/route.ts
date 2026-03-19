import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Only allow AI work checking for Netflix architecture
const ALLOWED_TUTORIAL_ID = 'netflix-architecture';

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const SYSTEM_PROMPT = `You are an expert system design tutor reviewing a student's Netflix architecture diagram.
The student has placed nodes (components) and edges (connections) on a canvas.
Your job is to review their work for the current step and give concise, specific feedback.
Be encouraging but honest. Point out what's correct, what's missing or wrong, and one concrete improvement.
Keep your response under 120 words. Do not use bullet points — write in 2-3 short sentences.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tutorialId,
      stepNumber,
      stepTitle,
      stepExplanation,
      requiredNodes,
      requiredEdges,
      canvasNodes,
      canvasEdges,
    }: {
      tutorialId: string;
      stepNumber: number;
      stepTitle: string;
      stepExplanation: string;
      requiredNodes: string[];
      requiredEdges: { from: string; to: string }[];
      canvasNodes: { label: string }[];
      canvasEdges: { source: string; target: string }[];
    } = body;

    if (tutorialId !== ALLOWED_TUTORIAL_ID) {
      return NextResponse.json({ error: 'AI work review is only available for the Netflix tutorial.' }, { status: 403 });
    }

    if (!stepNumber || !canvasNodes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const nodeList = canvasNodes.map((n) => n.label).join(', ') || 'none';
    const edgeList = canvasEdges.length > 0
      ? canvasEdges.map((e) => `${e.source} → ${e.target}`).join(', ')
      : 'none';
    const requiredNodeList = requiredNodes.join(', ') || 'none';
    const requiredEdgeList = requiredEdges.length > 0
      ? requiredEdges.map((e) => `${e.from} → ${e.to}`).join(', ')
      : 'none';

    const userPrompt = `Step ${stepNumber}: "${stepTitle}"
Goal: ${stepExplanation}

Required components: ${requiredNodeList}
Required connections: ${requiredEdgeList}

Student's canvas components: ${nodeList}
Student's canvas connections: ${edgeList}

Review the student's work for this step. Is it correct? What's good? What's missing or needs fixing?`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await getGroq().chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 200,
            temperature: 0.5,
            stream: true,
          });

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) controller.enqueue(encoder.encode(delta));
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
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('Tutorial check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
