import { NextRequest, NextResponse } from 'next/server';
import { generateDiagram } from '@/lib/ai/services/orchestrator';
import type { UserIntent, GenerationProgress } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface GenerateRequestBody {
  description: string;
  systemType?: string;
  complexity?: 'low' | 'medium' | 'high';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateRequestBody;

    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "description" field' },
        { status: 400 }
      );
    }

    const userIntent: UserIntent = {
      description: body.description.trim(),
      systemType: body.systemType ?? inferSystemType(body.description),
      complexity: body.complexity ?? inferComplexity(body.description),
    };

    console.log('[API] Starting diagram generation:', userIntent);

    const progressEvents: GenerationProgress[] = [];

    const result = await generateDiagram(userIntent, (progress) => {
      progressEvents.push(progress);
      console.log(`[API] Progress: ${progress.phase} - ${progress.message} (${progress.progress}%)`);
    });

    console.log('[API] Generation complete:', {
      nodes: result.nodes.length,
      edges: result.edges.length,
      score: result.metadata.score,
      iterations: result.metadata.iterations,
    });

    return NextResponse.json({
      success: true,
      data: result,
      progress: progressEvents,
    });

  } catch (error) {
    console.error('[API] Generation failed:', error);

    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Diagram generation failed',
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Diagram generation API is running',
    endpoints: {
      POST: 'Generate a new architecture diagram',
    },
  });
}

function inferSystemType(description: string): string {
  const lower = description.toLowerCase();

  if (lower.includes('ecommerce') || lower.includes('shop') || lower.includes('order')) {
    return 'E-commerce Platform';
  }
  if (lower.includes('chat') || lower.includes('messaging') || lower.includes('realtime')) {
    return 'Real-time Messaging';
  }
  if (lower.includes('social') || lower.includes('twitter') || lower.includes('instagram')) {
    return 'Social Media Platform';
  }
  if (lower.includes('streaming') || lower.includes('video') || lower.includes('netflix')) {
    return 'Streaming Platform';
  }
  if (lower.includes('payment') || lower.includes('transaction') || lower.includes('fintech')) {
    return 'Payment System';
  }
  if (lower.includes('iot') || lower.includes('sensor') || lower.includes('device')) {
    return 'IoT Platform';
  }
  if (lower.includes('ml') || lower.includes('machine learning') || lower.includes('ai')) {
    return 'ML/AI Platform';
  }
  if (lower.includes('saas') || lower.includes('multi-tenant')) {
    return 'SaaS Platform';
  }

  return 'Microservices Architecture';
}

function inferComplexity(description: string): 'low' | 'medium' | 'high' {
  const lower = description.toLowerCase();
  const wordCount = description.split(/\s+/).length;

  const complexKeywords = [
    'microservices', 'distributed', 'event-driven', 'real-time',
    'multi-tenant', 'caching', 'message queue', 'load balancer',
    'cdn', 'cdn', 'database', 'cache', 'queue', 'worker',
  ];

  const complexCount = complexKeywords.filter(kw => lower.includes(kw)).length;

  if (complexCount >= 5 || wordCount > 50) {
    return 'high';
  }
  if (complexCount >= 2 || wordCount > 20) {
    return 'medium';
  }
  return 'low';
}
