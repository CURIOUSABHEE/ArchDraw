import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client — initialized once, shared across all API routes.
 *
 * Cache invalidation:
 *   - Tutorial responses: no TTL (permanent). To clear after content updates,
 *     run `redis.flushdb()` or delete specific keys with `redis.del(key)`.
 *   - Free-text responses: 7-day TTL (604800s).
 *   - Shared canvas: 24-hour TTL (86400s).
 */
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Upstash Redis client — initialized conditionally.
 * During static build phases where credentials might be missing,
 * this prevents initialization warnings from the SDK.
 */
export const redis = url && token 
  ? new Redis({ url, token })
  : {
      get: async () => null,
      set: async () => null,
      del: async () => null,
      flushdb: async () => null,
    } as unknown as Redis;

// ── Key builders ──────────────────────────────────────────────────────────────

export const redisKeys = {
  tutorialPhase: (tutorialId: string, step: number, phase: string, explainCount: number) =>
    `tutorial:${tutorialId}:step:${step}:phase:${phase}:explain:${explainCount}`,

  tutorialWrong: (tutorialId: string, step: number) =>
    `tutorial:${tutorialId}:step:${step}:wrong`,

  tutorialFreeText: (questionHash: string, tutorialId: string, step: number) =>
    `tutorial:freetext:${questionHash}:${tutorialId}:${step}`,

  sharedCanvas: (shareId: string) =>
    `canvas:shared:${shareId}`,
};
