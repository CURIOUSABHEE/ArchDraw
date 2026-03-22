import { NextRequest } from 'next/server';
import { z } from 'zod';
import { runOrchestrator } from '@/lib/ai/agents/orchestrator';
import { runSubagentWithProgress } from '@/lib/ai/agents/subagents';
import { runSynthesiser } from '@/lib/ai/agents/synthesiser';
import { runCritic } from '@/lib/ai/agents/critic';
import { validateAndRepair } from '@/lib/ai/structuralValidator';
import { buildReactFlowDiagramRaw, sanitiseSynthesiserOutput } from '@/lib/ai/buildReactFlowDiagram';
import { fetchExistingCustomNodes, saveNewCustomNodes } from '@/lib/ai/customNodeRegistry';
import { applyGridLayout } from '@/lib/ai/layoutEngine';
import { checkRateLimit } from '@/lib/redis';

import componentsData from '@/data/components.json';
import awsData from '@/data/aws-components.json';
import servicesData from '@/data/services-components.json';

const allComponents = [...componentsData, ...awsData, ...servicesData];
const BUILTIN_COMPONENT_KEYS = allComponents.map((c: any) => c.id);

const RequestSchema = z.object({
  description: z.string().min(3).max(5000),
});

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIdentifier(req);
  const rateLimit = await checkRateLimit(clientIp, 5, 60);

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded. Please wait before generating another diagram.',
      retryAfter: rateLimit.resetAt
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rateLimit.resetAt),
        'Retry-After': '60'
      },
    });
  }

  let description: string;
  try {
    const body = await req.json();
    const parsed = RequestSchema.parse(body);
    description = parsed.description.trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  let isClosed = false;

  const send = async (event: object) => {
    if (isClosed) return;
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch (error) {
      console.error('[SSE] Write failed:', error instanceof Error ? error.message : error);
    }
  };

  const close = async () => {
    if (isClosed) return;
    isClosed = true;
    try { await writer.close(); } catch (error) {
      console.error('[SSE] Close failed:', error instanceof Error ? error.message : error);
    }
  };

  (async () => {
    try {
      // ── PHASE 1: Orchestrator ─────────────────────────────────────────────
      await send({ type: 'status', phase: 'thinking', message: 'Analysing your description...' });

      const orchestratorOutput = await runOrchestrator(description);
      console.log('[AI] Orchestrator done. Domain:', orchestratorOutput.domain);

      if (orchestratorOutput.needsClarification) {
        await send({ type: 'clarification', question: orchestratorOutput.clarificationQuestion });
        await close();
        return;
      }

      await send({
        type: 'status',
        phase: 'expanding',
        message: `Identified: ${orchestratorOutput.domain}`,
        detail: `Actors: ${orchestratorOutput.actors?.join(', ')} · ${orchestratorOutput.implicitNeeds?.length ?? 0} implicit services found`,
      });

      // ── PHASE 2: Parallel Subagents ───────────────────────────────────────
      await send({ type: 'status', phase: 'mapping', message: 'Mapping system layers...' });

      const projectContext = `${orchestratorOutput.domain} for ${(orchestratorOutput.actors ?? []).join(', ')} at ${orchestratorOutput.scale}`;

      const [subA, subB, subC, subD] = await Promise.all([
        runSubagentWithProgress('subagent_a', 'Client & Entry Layer', orchestratorOutput.briefA, projectContext, orchestratorOutput.complexityTier, (out) => {
          send({ type: 'layer_complete', layer: 'A', layerName: 'Client & Entry', serviceCount: out.services.length });
        }),
        runSubagentWithProgress('subagent_b', 'Business Logic Layer', orchestratorOutput.briefB, projectContext, orchestratorOutput.complexityTier, (out) => {
          send({ type: 'layer_complete', layer: 'B', layerName: 'Business Logic', serviceCount: out.services.length });
        }),
        runSubagentWithProgress('subagent_c', 'Data Layer', orchestratorOutput.briefC, projectContext, orchestratorOutput.complexityTier, (out) => {
          send({ type: 'layer_complete', layer: 'C', layerName: 'Data & Storage', serviceCount: out.services.length });
        }),
        runSubagentWithProgress('subagent_d', 'External APIs', orchestratorOutput.briefD, projectContext, orchestratorOutput.complexityTier, (out) => {
          send({ type: 'layer_complete', layer: 'D', layerName: 'External APIs', serviceCount: out.services.length });
        }),
      ]);

      console.log('[AI] Subagents done.');

      // ── PHASE 3: Synthesiser ──────────────────────────────────────────────
      await send({ type: 'status', phase: 'synthesising', message: 'Building component graph...' });

      const existingCustomNodes = await fetchExistingCustomNodes();
      const existingCustomKeys = existingCustomNodes.map((n) => n.component_key);

      let synthesiserOutput = await runSynthesiser(
        orchestratorOutput, [subA, subB, subC, subD],
        BUILTIN_COMPONENT_KEYS, existingCustomKeys, description,
        orchestratorOutput.complexityTier
      );
      console.log('[AI] Synthesiser done. Nodes:', synthesiserOutput.nodes?.length);

      // ── PHASE 4: Critic loop ──────────────────────────────────────────────
      await send({ type: 'status', phase: 'reviewing', message: 'Reviewing for completeness...' });

      let criticOutput = await runCritic(description, synthesiserOutput, orchestratorOutput.complexityTier);
      console.log('[AI] Critic score:', criticOutput.score);

      if (!criticOutput.passed) {
        await send({
          type: 'status',
          phase: 'improving',
          message: `Improving (score: ${criticOutput.score}/10)...`,
          detail: typeof criticOutput.suggestions === 'string' ? criticOutput.suggestions : 'Revising diagram...',
        });

        synthesiserOutput = await runSynthesiser(
          orchestratorOutput, [subA, subB, subC, subD],
          BUILTIN_COMPONENT_KEYS, existingCustomKeys,
          description + `\n\nFIX THESE ISSUES: ${criticOutput.suggestions}\nAdd missing: ${(criticOutput.missingSystems ?? []).join(', ')}`,
          orchestratorOutput.complexityTier
        );
        criticOutput = await runCritic(description, synthesiserOutput, orchestratorOutput.complexityTier, criticOutput.issues);
      }

      // ── PHASE 5: Sanitise + Validate ──────────────────────────────────────
      await send({ type: 'status', phase: 'validating', message: 'Validating diagram structure...' });

      // Run sanitisation FIRST (catches layer code in sublabel, forbidden edge labels)
      const sanitised = sanitiseSynthesiserOutput(synthesiserOutput);

      // Then run structural validator (connects orphans, fuzzy-repairs component keys)
      const validated = validateAndRepair(sanitised, [...BUILTIN_COMPONENT_KEYS, ...existingCustomKeys]);

      if (validated.customNodeDefinitions?.length > 0) {
        saveNewCustomNodes(validated.customNodeDefinitions, description).catch(console.error);
      }

      // ── PHASE 6: Build React Flow format (NO layout yet) ──────────────────
      const { nodes: rfNodesRaw, edges: rfEdges } = buildReactFlowDiagramRaw(
        validated,
        validated.customNodeDefinitions ?? []
      );

      // ── PHASE 7: Apply grid layout ─────────────────────────────────────────
      const rfNodes = applyGridLayout(rfNodesRaw);

      // ── PHASE 8: Final sanity check — verify no node has position {0,0} ───
      const allPositioned = rfNodes.every((n) => n.position.x !== 0 || n.position.y !== 0);
      if (!allPositioned) {
        const cols = Math.ceil(Math.sqrt(rfNodes.length));
        rfNodes.forEach((node, i) => {
          if (node.position.x === 0 && node.position.y === 0) {
            node.position = {
              x: 80 + (i % cols) * 280,
              y: 80 + Math.floor(i / cols) * 140,
            };
          }
        });
      }

      console.log('[AI] Built diagram. Nodes:', rfNodes.length, 'Edges:', rfEdges.length);

      // ── PHASE 9: Stream nodes then edges ───────────────────────────────────
      await send({ type: 'stream_start', totalNodes: rfNodes.length, totalEdges: rfEdges.length });

      for (let i = 0; i < rfNodes.length; i++) {
        await send({ type: 'add_node', node: rfNodes[i], index: i, total: rfNodes.length });
      }

      await send({ type: 'nodes_complete', nodeCount: rfNodes.length });

      for (let i = 0; i < rfEdges.length; i++) {
        await send({ type: 'add_edge', edge: rfEdges[i], index: i, total: rfEdges.length });
      }

      await send({
        type: 'complete',
        meta: {
          projectName: orchestratorOutput.projectName,
          nodeCount: rfNodes.length,
          edgeCount: rfEdges.length,
          criticScore: criticOutput.score,
          customNodesCreated: validated.customNodeDefinitions?.length ?? 0,
        },
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI] Pipeline error:', message);
      await send({ type: 'error', message });
    } finally {
      await close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
