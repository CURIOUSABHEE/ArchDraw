import type { ArchitectureNode } from '../types';

// Minimal rules - don't block anything, just guidelines
const DOMAIN_COMPONENT_RULES: Record<string, {
  suggested: string[];
  minNodes: number;
  maxNodes: number;
}> = {
  chat: {
    suggested: ['Chat Service', 'Message Store', 'Client', 'API Gateway', 'Database'],
    minNodes: 2,
    maxNodes: 50,
  },
  'video streaming': {
    suggested: ['Video Upload', 'Transcoding', 'CDN', 'Storage', 'API Gateway'],
    minNodes: 2,
    maxNodes: 50,
  },
  ecommerce: {
    suggested: ['API Gateway', 'Product Service', 'Order Service', 'Database'],
    minNodes: 2,
    maxNodes: 50,
  },
  general: {
    suggested: ['API Gateway', 'Database', 'Cache', 'Queue'],
    minNodes: 1,
    maxNodes: 50,
  },
};

function getDomainRules(domain: string) {
  return DOMAIN_COMPONENT_RULES[domain] || DOMAIN_COMPONENT_RULES.general;
}

export function detectDomain(prompt: string): string {
  const domainMap: Record<string, string[]> = {
    chat: ['chat', 'messaging', 'messenger', 'conversation', 'whatsapp', 'telegram'],
    'video streaming': ['video', 'streaming', 'media', 'youtube', 'twitch', 'stream'],
    ecommerce: ['shop', 'store', 'e-commerce', 'marketplace', 'cart', 'payment'],
    'social media': ['social', 'feed', 'post', 'timeline', 'instagram', 'twitter'],
    'ml ai': ['ml', 'machine learning', 'ai', 'model', 'training', 'inference'],
    'api': ['api', 'rest', 'graphql', 'endpoint'],
  };
  
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [domain, keywords] of Object.entries(domainMap)) {
    if (keywords.some(k => lowerPrompt.includes(k))) {
      return domain;
    }
  }
  
  return 'general';
}

function isVagueNode(node: ArchitectureNode): boolean {
  // Only remove truly invalid placeholders, not real components
  const vague = ['placeholder', 'todo', 'undefined', 'unknown', 'tbd'];
  return vague.some(v => node.label.toLowerCase() === v);
}

function deduplicateNodes(nodes: ArchitectureNode[]): ArchitectureNode[] {
  const seen = new Map<string, ArchitectureNode>();
  
  for (const node of nodes) {
    const key = node.label.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, node);
    }
  }
  
  return Array.from(seen.values());
}

export function validateAndFixComponents(
  nodes: ArchitectureNode[],
  domain: string
): { nodes: ArchitectureNode[]; fixApplied: string[] } {
  const fixes: string[] = [];
  let result = [...nodes];
  
  const rules = getDomainRules(domain);
  
  // Just deduplicate, don't remove anything
  result = deduplicateNodes(result);
  
  // Warn if outside range, but don't truncate
  if (result.length < rules.minNodes) {
    fixes.push(`Note: ${result.length} nodes (minimum suggested: ${rules.minNodes})`);
  }
  
  if (result.length > rules.maxNodes) {
    fixes.push(`Note: ${result.length} nodes (maximum suggested: ${rules.maxNodes})`);
  }
  
  return { nodes: result, fixApplied: fixes };
}

export function requiresMinimumComponent(
  domain: string,
  componentType: string
): boolean {
  // Always return false - don't enforce requirements
  return false;
}