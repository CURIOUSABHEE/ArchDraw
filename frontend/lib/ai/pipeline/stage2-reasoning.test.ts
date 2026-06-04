import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callReasoningLLM, inferStylePlan } from './stage2-reasoning';

describe('stage2-reasoning', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('GROQ_API_KEY_FOR_DESC_')) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('throws generation_failed when all providers fail', async () => {
    await expect(callReasoningLLM('test system', 'monolith', 'medium')).rejects.toThrow(
      /generation_failed/
    );
  });

  it('inferStylePlan does not default to production depth for simple prompts', () => {
    const plan = inferStylePlan('Draw a simple monolith blog app', 'monolith');
    expect(plan.style).toBe('monolith');
    expect(plan.productionDepth).toBe('conceptual');
  });

  it('inferStylePlan detects production depth from prompt signals', () => {
    const plan = inferStylePlan(
      'Draw production-ready video streaming on AWS with Kubernetes observability',
      'saas'
    );
    expect(plan.productionDepth).toBe('production');
  });
});
