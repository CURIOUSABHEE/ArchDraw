import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InventoryConfig, EdgeConfig, FormatConfig, StyleConfig } from './stage1-pregen';

const mockRunMermaidGenerator = vi.hoisted(() => vi.fn());
const mockValidateMermaid = vi.hoisted(() => vi.fn());
const mockRunStage1 = vi.hoisted(() => vi.fn());
const mockTranslate = vi.hoisted(() => vi.fn(() => ({ nodes: [], edges: [] })));
const mockScore = vi.hoisted(() => vi.fn(() => ({
  score: 85, breakdown: {}, details: { prompt: 'test', nodes: 0, edges: 0, diagramSize: 'medium' },
})));

vi.mock('./stage1-pregen', () => ({
  runStage1PreGeneration: mockRunStage1,
}));

vi.mock('./stage2-mermaid', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./stage2-mermaid')>();
  return {
    ...actual,
    runMermaidGenerator: mockRunMermaidGenerator,
  };
});

vi.mock('./stage3-validate', () => ({
  validateMermaid: mockValidateMermaid,
}));

vi.mock('./stage4-translate', () => ({
  translateMermaidToReactFlowJSON: mockTranslate,
}));

vi.mock('../stage8-score', () => ({
  scoreDiagram: mockScore,
}));

import { runMermaidPipeline } from './index';
import type { UserIntent } from '../../types';

const DEFAULT_FORMAT_CONFIG: FormatConfig = {
  format: 'mermaid',
  diagramType: 'graph TD',
  optionalVariants: [],
};

const DEFAULT_STYLE_CONFIG: StyleConfig = {
  primaryColor: '#2D6A4F',
  secondaryColor: '#354F52',
  background: '#F8F9FA',
  fontFamily: 'Inter',
  theme: 'forest-green',
};

const DEFAULT_INVENTORY: InventoryConfig = {
  nodes: ['User Profile Service', 'Post Service', 'Message Queue', 'Payment Processing'],
  groups: ['API Gateway Layer', 'Core Services', 'Data & Queue Layer'],
  nodeCount: 4,
};

const DEFAULT_EDGE_CONFIG: EdgeConfig = {
  edges: [
    { from: 'User Profile Service', to: 'Post Service', label: 'creates post', bidirectional: false },
    { from: 'Post Service', to: 'Message Queue', label: 'enqueues', bidirectional: false },
    { from: 'User Profile Service', to: 'Payment Processing', label: 'handles payment', bidirectional: false },
  ],
  edgeCount: 3,
};

const SOCIAL_PLATFORM_INTENT: UserIntent = {
  description: 'Design a social media platform with user profiles, posts, a message queue, and payment processing.',
  systemType: 'social-media',
  complexity: 'medium',
  diagramSize: 'medium',
};

function validMermaidFor(config: { nodes: string[]; groups: string[] }): string {
  const lines: string[] = ['graph TD'];
  const idMap: Record<string, string> = {};
  for (const name of config.nodes) {
    idMap[name] = name.replace(/\s+/g, '');
  }

  for (const group of config.groups) {
    const gId = group.replace(/\s+/g, '');
    lines.push(`  subgraph ${gId}["${group}"]`);
    if (group === config.groups[0]) {
      lines.push(`    ${idMap[config.nodes[0]]}["${config.nodes[0]}\\nReact"]`);
      lines.push(`    ${idMap[config.nodes[1]]}["${config.nodes[1]}\\nNode.js"]`);
    } else if (group === config.groups[1]) {
      lines.push(`    ${idMap[config.nodes[2]]}["${config.nodes[2]}\\nRedis"]`);
    } else {
      lines.push(`    ${idMap[config.nodes[3]]}["${config.nodes[3]}\\nStripe"]`);
    }
    lines.push('  end');
  }

  return lines.join('\n');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('runMermaidPipeline Integration', () => {
  it('passes on first attempt when all stages produce valid output (happy path)', async () => {
    const mermaidText = validMermaidFor(DEFAULT_INVENTORY);

    mockRunStage1.mockResolvedValue({
      formatConfig: DEFAULT_FORMAT_CONFIG,
      styleConfig: DEFAULT_STYLE_CONFIG,
      inventoryConfig: DEFAULT_INVENTORY,
      edgeConfig: DEFAULT_EDGE_CONFIG,
      groupAssignments: {},
    });

    mockRunMermaidGenerator.mockResolvedValue(mermaidText);
    mockValidateMermaid.mockReturnValue({
      isValid: true,
      parsed: { subgraphs: [], nodes: [], edges: [] },
      nodeIssues: [],
      edgeIssues: [],
      groupIssues: [],
      bidiIssues: [],
    });

    const result = await runMermaidPipeline(SOCIAL_PLATFORM_INTENT);
    expect(result.success).toBe(true);
    expect(mockRunMermaidGenerator).toHaveBeenCalledTimes(1);
  });

  it('retries with locked ID repair instructions when validation fails, then succeeds', async () => {
    const mermaidText = validMermaidFor(DEFAULT_INVENTORY);

    mockRunStage1.mockResolvedValue({
      formatConfig: DEFAULT_FORMAT_CONFIG,
      styleConfig: DEFAULT_STYLE_CONFIG,
      inventoryConfig: DEFAULT_INVENTORY,
      edgeConfig: DEFAULT_EDGE_CONFIG,
      groupAssignments: {},
    });

    mockRunMermaidGenerator.mockResolvedValue(mermaidText);

    mockValidateMermaid
      .mockReturnValueOnce({
        isValid: false,
        repairInstructions: 'MISSING EDGES: The following connections are missing.',
        parsed: { subgraphs: [], nodes: [], edges: [{ source: 'UserProfileService', target: 'PostService', label: 'creates post', bidirectional: false }] },
        nodeIssues: [],
        edgeIssues: ['MISSING EDGES: connection missing'],
        groupIssues: [],
        bidiIssues: [],
      })
      .mockReturnValueOnce({
        isValid: true,
        parsed: { subgraphs: [], nodes: [], edges: [] },
        nodeIssues: [],
        edgeIssues: [],
        groupIssues: [],
        bidiIssues: [],
      });

    const result = await runMermaidPipeline(SOCIAL_PLATFORM_INTENT);
    expect(result.success).toBe(true);
    expect(mockRunMermaidGenerator).toHaveBeenCalledTimes(2);
    // Second call should include locked IDs in repair instructions
    const secondRepair = mockRunMermaidGenerator.mock.calls[1][5] as string;
    expect(secondRepair).toContain('LOCKED NODE IDs');
    expect(secondRepair).toContain('UserProfileService');
  });

  it('fails gracefully after max repair iterations with error thrown', async () => {
    const mermaidText = validMermaidFor(DEFAULT_INVENTORY);

    mockRunStage1.mockResolvedValue({
      formatConfig: DEFAULT_FORMAT_CONFIG,
      styleConfig: DEFAULT_STYLE_CONFIG,
      inventoryConfig: DEFAULT_INVENTORY,
      edgeConfig: DEFAULT_EDGE_CONFIG,
      groupAssignments: {},
    });

    mockRunMermaidGenerator.mockResolvedValue(mermaidText);
    mockValidateMermaid.mockReturnValue({
      isValid: false,
      repairInstructions: 'NODE COUNT MISMATCH: Expected 4 nodes, found 2.',
      parsed: { subgraphs: [], nodes: [], edges: [] },
      nodeIssues: ['NODE COUNT MISMATCH'],
      edgeIssues: [],
      groupIssues: [],
      bidiIssues: [],
    });

    await expect(runMermaidPipeline(SOCIAL_PLATFORM_INTENT)).rejects.toThrow('validation_failed');
    expect(mockRunMermaidGenerator).toHaveBeenCalledTimes(4);
  });

  it('pipeline throws if stage 1 fails (error propagation)', async () => {
    mockRunStage1.mockRejectedValue(new Error('Stage 1 failed'));
    await expect(runMermaidPipeline(SOCIAL_PLATFORM_INTENT)).rejects.toThrow('Stage 1 failed');
  });
});
