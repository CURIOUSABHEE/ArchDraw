import { describe, it, expect, afterAll } from 'vitest';
import { runMermaidPipeline } from './index';
import type { UserIntent } from '../../types';

const PROMPTS: { name: string; intent: UserIntent }[] = [
  {
    name: 'Load Balancer',
    intent: {
      description: 'Describe the Load Balancer architecture showing how a load balancer distributes incoming traffic across multiple backend servers.',
      systemType: 'architecture',
      complexity: 'medium',
      diagramSize: 'medium',
    },
  },
  {
    name: 'E-Commerce Platform',
    intent: {
      description: 'Design an e-commerce platform with user authentication, product catalog, shopping cart, order processing, payment gateway integration, and a recommendation engine.',
      systemType: 'e-commerce',
      complexity: 'high',
      diagramSize: 'medium',
    },
  },
  {
    name: 'Microservice Architecture',
    intent: {
      description: 'Create a microservice architecture diagram showing API Gateway, multiple services, message queue, and databases.',
      systemType: 'microservices',
      complexity: 'medium',
      diagramSize: 'medium',
    },
  },
];

describe('Mermaid Pipeline Benchmark', () => {
  const results: { name: string; durationMs: number; nodes: number; edges: number; success: boolean }[] = [];

  for (const { name, intent } of PROMPTS) {
    it(`measures generation time for "${name}"`, async () => {
      const start = performance.now();
      let result;
      try {
        result = await runMermaidPipeline(intent);
      } catch (err) {
        const durationMs = performance.now() - start;
        results.push({ name, durationMs, nodes: 0, edges: 0, success: false });
        console.log(`\n[Benchmark] "${name}" — FAILED — ${(durationMs / 1000).toFixed(1)}s`);
        throw err;
      }
      const durationMs = performance.now() - start;
      const nodeCount = result.nodes?.length ?? 0;
      const edgeCount = result.edges?.length ?? 0;
      results.push({ name, durationMs, nodes: nodeCount, edges: edgeCount, success: true });

      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  Prompt:       "${name}"`);
      console.log(`  Duration:     ${(durationMs / 1000).toFixed(1)}s`);
      console.log(`  Nodes:        ${nodeCount}`);
      console.log(`  Edges:        ${edgeCount}`);
      console.log(`  Score:        ${result.score ?? 'N/A'}`);
      console.log(`  Success:      ${result.success}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      expect(durationMs).toBeGreaterThan(0);
    });
  }

  afterAll(() => {
    console.log('\n═══════════════════════════════════════════════');
    console.log('  BENCHMARK SUMMARY');
    console.log('═══════════════════════════════════════════════');
    for (const r of results) {
      const status = r.success ? '✓' : '✗';
      console.log(`  ${status} ${r.name.padEnd(30)} ${(r.durationMs / 1000).toFixed(1)}s  (${r.nodes} nodes, ${r.edges} edges)`);
    }
    if (results.length > 0) {
      const avg = results.reduce((s, r) => s + r.durationMs, 0) / results.length;
      console.log(`  ───────────────────────────────────────────`);
      console.log(`  Average:      ${(avg / 1000).toFixed(1)}s`);
    }
    console.log('═══════════════════════════════════════════════\n');
  });
});
