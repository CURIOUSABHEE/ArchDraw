import { describe, it, expect, afterAll } from 'vitest';
import { runMermaidPipeline } from './index';
import type { UserIntent } from '../../types';
import { generateDeterministicMermaid } from './deterministicMermaid';
import { runArchitecturePlanner } from './stage1-planner';

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

interface QualityReport {
  name: string;
  durationMs: number;
  nodeCount: number;
  edgeCount: number;
  groupCount: number;
  score: number;
  orphanCount: number;
  nodeNames: string[];
  edgeList: { source: string; target: string; label: string }[];
  groups: { name: string; members: string[] }[];
  mermaidText: string;
  warnings: string[];
  errors: string[];
}

const reports: QualityReport[] = [];

const GENERIC_LABELS = ['connects', 'sends', 'calls', 'to', 'connected to', 'flows to', 'sends message', 'sends data'];

function assessLabels(labels: string[], warnings: string[]) {
  for (const label of labels) {
    const lower = label.toLowerCase();
    if (GENERIC_LABELS.some(b => lower.includes(b))) {
      warnings.push(`Generic edge label: "${label}"`);
    }
    if (label.length < 3) {
      warnings.push(`Trivial edge label: "${label}"`);
    }
    if (lower === label && !/[A-Z]/.test(label)) {
      warnings.push(`Edge label lacks capitals: "${label}"`);
    }
  }
}

function assessTopology(nodes: string[], edges: { source: string; target: string }[], errors: string[]) {
  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  for (const e of edges) {
    inbound.set(e.target, (inbound.get(e.target) || 0) + 1);
    outbound.set(e.source, (outbound.get(e.source) || 0) + 1);
  }
  for (const node of nodes) {
    const lower = node.toLowerCase();
    const outDeg = outbound.get(node) || 0;
    const inDeg = inbound.get(node) || 0;
    if ((lower.includes('client') || lower === 'user' || lower.includes('browser') || lower.includes('mobile')) && inDeg > 0 && outDeg === 0) {
      errors.push(`Client "${node}" is a sink (incoming but no outgoing)`);
    }
    if ((lower.includes('database') || lower.includes('cache') || lower.includes('redis') || lower.includes('data store')) && outDeg > 0 && inDeg === 0) {
      errors.push(`Data store "${node}" is a source (outgoing but no incoming)`);
    }
    if (outDeg === 0 && inDeg === 0) {
      // Already counted as orphan
    }
  }
}

describe('Diagram Quality Assessment', () => {
  for (const { name, intent } of PROMPTS) {
    it(`generates quality diagram for "${name}"`, async () => {
      const start = performance.now();
      const warnings: string[] = [];
      const errors: string[] = [];

      // Step 1: Run planner to get the architecture plan + mermaid text
      const plannerResult = await runArchitecturePlanner(intent.description, intent.diagramSize ?? 'medium', intent.model);

      // Step 2: Generate deterministic mermaid
      const mermaidResult = generateDeterministicMermaid(
        plannerResult.formatConfig,
        plannerResult.inventoryConfig,
        plannerResult.edgeConfig,
        plannerResult.groupAssignments,
      );
      const mermaidText = mermaidResult.mermaidText;

      // Step 3: Run full pipeline for ReactFlow output
      let result;
      try {
        result = await runMermaidPipeline(intent);
      } catch (err) {
        const durationMs = performance.now() - start;
        reports.push({
          name, durationMs: 0, nodeCount: 0, edgeCount: 0, groupCount: 0,
          score: 0, orphanCount: 0, nodeNames: [], edgeList: [],
          groups: [], mermaidText, warnings, errors: [`Pipeline failed: ${err}`],
        });
        throw err;
      }
      const durationMs = performance.now() - start;

      const nodeCount = result.nodes?.length ?? 0;
      const edgeCount = result.edges?.length ?? 0;
      const score = result.score ?? 0;

      // Nodes from pipeline output (deduplicated by label)
      const seen = new Set<string>();
      const nodeNames: string[] = [];
      for (const n of result.nodes ?? []) {
        const label = (n as any).data?.label || n.id || '';
        if (!seen.has(label)) {
          seen.add(label);
          nodeNames.push(label);
        }
      }

      // Edges
      const edgeList = (result.edges ?? []).map((e: any) => ({
        source: e.source || '',
        target: e.target || '',
        label: e.label || e.data?.label || '',
      }));

      // Groups: find frameNode/groupNode types
      const groupNodes = (result.nodes ?? []).filter(
        (n: any) => n.type === 'groupNode' || n.type === 'frameNode'
      );
      const groupNames = new Map<string, string>();
      for (const g of groupNodes) {
        const gid = g.id || '';
        const glabel = (g as any).data?.label || gid;
        groupNames.set(gid, glabel);
      }
      const groups: { name: string; members: string[] }[] = [];
      for (const [gid, glabel] of groupNames) {
        const members = (result.nodes ?? [])
          .filter((n: any) => n.data?.parentId === gid || n.parentId === gid)
          .map((n: any) => (n as any).data?.label || n.id || '');
        groups.push({ name: glabel, members });
      }
      const groupCount = groups.length;

      // Orphans
      const connected = new Set<string>();
      for (const e of edgeList) {
        connected.add(e.source);
        connected.add(e.target);
      }
      const orphanCount = nodeNames.filter(n => !connected.has(n)).length;

      // Quality assessments
      assessLabels(edgeList.map(e => e.label), warnings);
      assessTopology(nodeNames, edgeList, errors);

      // Node quality
      for (const n of nodeNames) {
        if (/\[.*\]/.test(n)) warnings.push(`Bracket tech stack in node: "${n}"`);
      }

      // Edge quantity
      if (nodeNames.length > 0 && edgeCount < Math.max(1, nodeNames.length * 0.4)) {
        warnings.push(`Low edge ratio: ${edgeCount} edges for ${nodeNames.length} nodes`);
      }

      // Group quality
      if (groupCount === 0 && nodeNames.length > 4) {
        warnings.push(`No groups for ${nodeNames.length} nodes`);
      }
      for (const g of groups) {
        if (g.members.length === 1 && nodeNames.length > 6) {
          warnings.push(`Group "${g.name}" has single member`);
        }
      }

      // Planner output quality
      if (plannerResult.inventoryConfig.nodeCount < 4) {
        errors.push(`Planner generated < 4 nodes (${plannerResult.inventoryConfig.nodeCount})`);
      }
      if (plannerResult.edgeConfig.edges.length === 0) {
        errors.push('Planner generated 0 edges');
      }

      const report: QualityReport = {
        name, durationMs, nodeCount, edgeCount, groupCount, score, orphanCount,
        nodeNames, edgeList, groups, mermaidText, warnings, errors,
      };
      reports.push(report);

      // Pretty print
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`  QUALITY REPORT: "${report.name}"`);
      console.log(`${'═'.repeat(70)}`);
      console.log(`  Time:     ${(report.durationMs / 1000).toFixed(1)}s  |  Score: ${report.score}/100`);
      console.log(`  Nodes:    ${report.nodeCount}  |  Edges: ${report.edgeCount}  |  Groups: ${report.groupCount}  |  Orphans: ${report.orphanCount}`);
      console.log(`\n  ── Nodes (${report.nodeNames.length}) ──`);
      for (const n of report.nodeNames) {
        const isOrphan = !connected.has(n);
        console.log(`    ${isOrphan ? '○' : '●'}  ${n}`);
      }
      console.log(`\n  ── Edges (${report.edgeList.length}) ──`);
      for (const e of report.edgeList) {
        console.log(`    ${e.source} → ${e.target}  ${e.label ? `"${e.label}"` : '(no label)'}`);
      }
      if (report.groups.length > 0) {
        console.log(`\n  ── Groups (${report.groups.length}) ──`);
        for (const g of report.groups) {
          console.log(`    ${g.name}: [${g.members.join(', ')}]`);
        }
      }
      console.log(`\n  ── Planner Plan ──`);
      console.log(`    Groups from planner: ${plannerResult.inventoryConfig.groups.join(', ') || '(none)'}`);
      console.log(`    Planned nodes: ${plannerResult.inventoryConfig.nodeCount}`);
      console.log(`    Planned edges: ${plannerResult.edgeConfig.edgeCount}`);
      console.log(`    Node→Group assignments: ${Object.keys(plannerResult.groupAssignments).length}`);
      console.log(`\n  ── Mermaid Text ──`);
      for (const line of report.mermaidText.split('\n')) {
        console.log(`    ${line}`);
      }

      if (report.warnings.length > 0) {
        console.log(`\n  ── Warnings (${report.warnings.length}) ──`);
        for (const w of report.warnings) console.log(`    ⚠  ${w}`);
      }
      if (report.errors.length > 0) {
        console.log(`\n  ── Errors (${report.errors.length}) ──`);
        for (const e of report.errors) console.log(`    ✗  ${e}`);
      }
      console.log();

      expect(report.errors.length).toBe(0);
    });
  }

  afterAll(() => {
    console.log(`\n${'═'.repeat(70)}`);
    console.log('  QUALITY SUMMARY');
    console.log(`${'═'.repeat(70)}`);
    for (const r of reports) {
      const status = r.errors.length === 0 ? '✓' : '✗';
      console.log(`  ${status} ${r.name.padEnd(30)} ${r.score} pts  |  ${r.nodeCount}N ${r.edgeCount}E ${r.groupCount}G  |  ${r.orphanCount} orphan  |  ${r.warnings.length} warn  |  ${(r.durationMs / 1000).toFixed(1)}s`);
    }
    const avgScore = reports.reduce((s, r) => s + r.score, 0) / reports.length;
    const avgTime = reports.reduce((s, r) => s + r.durationMs, 0) / reports.length;
    console.log(`  ${'─'.repeat(68)}`);
    console.log(`  Average:  ${avgScore.toFixed(0)} pts  |  ${(avgTime / 1000).toFixed(1)}s`);
    console.log(`${'═'.repeat(70)}\n`);
  });
});
