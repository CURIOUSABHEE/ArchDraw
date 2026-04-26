import type { ArchitectureNode } from '../types';

const DOMAIN_COMPONENT_RULES: Record<string, {
  required: string[];
  recommended: string[];
  forbidden: string[];
  minNodes: number;
  maxNodes: number;
}> = {
  chat: {
    required: ['Chat Service', 'Message Store', 'Client'],
    recommended: ['Queue', 'Cache', 'Load Balancer', 'API Gateway'],
    forbidden: ['Clients', 'Services', 'System', 'Backend', 'Platform'],
    minNodes: 6,
    maxNodes: 20,
  },
  'video streaming': {
    required: ['Video Upload', 'Transcoding', 'CDN', 'Storage'],
    recommended: ['API Gateway', 'Database', 'Load Balancer'],
    forbidden: ['Application Layer', 'Data Layer', 'Services'],
    minNodes: 6,
    maxNodes: 20,
  },
  ecommerce: {
    required: ['API Gateway', 'Product Service', 'Order Service', 'Database'],
    recommended: ['Cache', 'Payment Gateway', 'CDN', 'Queue'],
    forbidden: ['Backend Services', 'System', 'Services'],
    minNodes: 8,
    maxNodes: 25,
  },
  general: {
    required: ['API Gateway', 'Database'],
    recommended: ['Cache', 'Queue', 'Load Balancer'],
    forbidden: ['Clients', 'Services', 'System', 'Platform', 'Infrastructure', 'Backend'],
    minNodes: 6,
    maxNodes: 20,
  },
};

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

export function getDomainRules(domain: string) {
  return DOMAIN_COMPONENT_RULES[domain] || DOMAIN_COMPONENT_RULES['general'];
}

export function isVagueNode(node: ArchitectureNode): boolean {
  const vaguePatterns = [
    /^clients?$/i,
    /^services?$/i,
    /^system$/i,
    /^platform$/i,
    /^infrastructure$/i,
    /^application$/i,
    /^backend$/i,
    /^frontend$/i,
    /^layer$/i,
    /^tier$/i,
    /^data layer$/i,
    /^application layer$/i,
    /^presentation layer$/i,
  ];
  
  return vaguePatterns.some(pattern => pattern.test(node.label.trim()));
}

export function deduplicateNodes(nodes: ArchitectureNode[]): ArchitectureNode[] {
  const seen = new Map<string, ArchitectureNode>();
  const duplicates: string[] = [];
  
  for (const node of nodes) {
    const normalizedLabel = node.label.toLowerCase().trim();
    const existing = seen.get(normalizedLabel);
    
    if (existing) {
      duplicates.push(node.label);
      continue;
    }
    
    for (const [key, existingNode] of seen) {
      if (existingNode.serviceType === node.serviceType) {
        if (normalizedLabel.includes(key) || key.includes(normalizedLabel)) {
          duplicates.push(node.label);
          continue;
        }
      }
    }
    
    seen.set(normalizedLabel, node);
  }
  
  if (duplicates.length > 0) {
    console.log(`[ComponentValidator] Removed ${duplicates.length} duplicates:`, duplicates);
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
  
  result = result.filter(node => {
    if (isVagueNode(node)) {
      fixes.push(`Removed vague node: "${node.label}"`);
      console.log(`[ComponentValidator] Removing vague node: "${node.label}"`);
      return false;
    }
    return true;
  });
  
  const forbidden = result.filter(node =>
    rules.forbidden.some(f => node.label.toLowerCase().includes(f.toLowerCase()))
  );
  
  if (forbidden.length > 0) {
    const labels = forbidden.map(n => n.label);
    fixes.push(`Removed forbidden: ${labels.join(', ')}`);
    console.log(`[ComponentValidator] Removing forbidden:`, labels);
    result = result.filter(n => !forbidden.includes(n));
  }
  
  result = deduplicateNodes(result);
  
  if (result.length < rules.minNodes) {
    fixes.push(`Node count (${result.length}) below minimum (${rules.minNodes})`);
    console.warn(`[ComponentValidator] Node count ${result.length} < ${rules.minNodes}`);
  }
  
  if (result.length > rules.maxNodes) {
    fixes.push(`Truncated from ${result.length} to ${rules.maxNodes} nodes`);
    console.log(`[ComponentValidator] Truncating from ${result.length} to ${rules.maxNodes}`);
    result = result.slice(0, rules.maxNodes);
  }
  
  return { nodes: result, fixApplied: fixes };
}

export function requiresMinimumComponent(
  domain: string,
  componentType: string
): boolean {
  const rules = getDomainRules(domain);
  return rules.required.some(r => r.toLowerCase().includes(componentType.toLowerCase()));
}