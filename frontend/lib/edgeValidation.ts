export type ConnectionRule = 'allow' | 'deny' | 'warn';

export interface CategoryConnectionRule {
  from: string;
  to: string;
  rule: ConnectionRule;
  reason?: string;
}

export const CONNECTION_RULES: CategoryConnectionRule[] = [
  { from: 'Data Storage', to: 'Client & Entry', rule: 'deny', reason: 'Database cannot directly output to client' },
  { from: 'Data Storage', to: 'External Services', rule: 'deny', reason: 'Database should not directly connect to external services' },
  { from: 'Worker', to: 'Client & Entry', rule: 'deny', reason: 'Worker cannot directly output to client' },
  { from: 'Worker', to: 'External Services', rule: 'deny', reason: 'Worker should go through API Gateway' },
  { from: 'Caching', to: 'Data Storage', rule: 'warn', reason: 'Cache typically sits in front of compute, not storage' },
];

export const CATEGORY_GROUPS = {
  ENTRY: ['Client & Entry', 'CDN & Edge', 'DNS & Network'],
  COMPUTE: ['Compute', 'Serverless', 'API Gateway', 'Load Balancer'],
  STORAGE: ['Data Storage', 'Database', 'Cache & Storage'],
  CACHE: ['Caching'],
  MESSAGING: ['Messaging & Events'],
  EXTERNAL: ['External Services'],
  SECURITY: ['Auth & Security', 'Authentication'],
  OBSERVABILITY: ['Observability'],
  AI: ['AI / ML', 'AI & ML'],
  WORKER: ['Worker'],
};

export function isCategoryInGroup(category: string, group: string[]): boolean {
  return group.includes(category);
}

export function validateConnection(
  sourceCategory: string,
  targetCategory: string
): { allowed: boolean; rule: ConnectionRule; reason?: string } {
  const rule = CONNECTION_RULES.find(
    r => r.from === sourceCategory && r.to === targetCategory
  );

  if (rule) {
    return {
      allowed: rule.rule !== 'deny',
      rule: rule.rule,
      reason: rule.reason,
    };
  }

  if (sourceCategory === targetCategory) {
    return { allowed: true, rule: 'allow' };
  }

  return { allowed: true, rule: 'allow' };
}

export function getValidTargets(sourceCategory: string): string[] {
  const allCategories = Object.keys(CATEGORY_GROUPS).flatMap(
    key => CATEGORY_GROUPS[key as keyof typeof CATEGORY_GROUPS]
  );
  
  return allCategories.filter(cat => {
    const result = validateConnection(sourceCategory, cat);
    return result.allowed;
  });
}

export function getInvalidTargets(sourceCategory: string): { category: string; reason: string }[] {
  const allCategories = Object.keys(CATEGORY_GROUPS).flatMap(
    key => CATEGORY_GROUPS[key as keyof typeof CATEGORY_GROUPS]
  );
  
  return allCategories
    .filter(cat => {
      const result = validateConnection(sourceCategory, cat);
      return !result.allowed;
    })
    .map(cat => {
      const result = validateConnection(sourceCategory, cat);
      return { category: cat, reason: result.reason || 'Connection not allowed' };
    });
}
