import type { Node, Edge } from 'reactflow';
import type { ValidationRule } from './schema';

const DEV_MODE = process.env.NODE_ENV === 'development';

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function fuzzyMatch(nodeLabel: string, pattern: string): boolean {
  const normalizedLabel = normalize(nodeLabel);
  const normalizedPattern = normalize(pattern);
  
  if (normalizedLabel === normalizedPattern) return true;
  if (normalizedLabel.includes(normalizedPattern)) return true;
  if (normalizedPattern.split(' ').every(word => word.length > 0 && normalizedLabel.includes(word))) return true;
  
  return false;
}

function getNodeLabel(node: Node): string {
  return node.data?.label ?? '';
}

function getNodeType(node: Node): string {
  return node.type ?? node.data?.type ?? '';
}

function findMatchingNodes(
  nodes: Node[],
  nodeType: string,
  label?: string
): Node[] {
  return nodes.filter(node => {
    const matchesType = nodeType ? fuzzyMatch(getNodeType(node), nodeType) : true;
    const matchesLabel = label ? fuzzyMatch(getNodeLabel(node), label) : true;
    const matchesComponentType = node.data?.componentType 
      ? fuzzyMatch(node.data.componentType, nodeType) 
      : true;
    
    return matchesType && (matchesLabel || matchesComponentType);
  });
}

function findEdge(
  edges: Edge[],
  sourceNode: Node,
  targetNode: Node
): Edge | undefined {
  return edges.find(
    edge => edge.source === sourceNode.id && edge.target === targetNode.id
  );
}

export function evaluateValidationRule(
  rule: ValidationRule,
  nodes: Node[],
  edges: Edge[]
): boolean {
  if (DEV_MODE) {
    console.log('[Detection] Evaluating rule:', rule);
  }

  switch (rule.type) {
    case 'node_exists': {
      const matches = findMatchingNodes(nodes, rule.nodeType, rule.label);
      const result = matches.length > 0;
      if (DEV_MODE) {
        console.log('[Detection] node_exists:', { rule, matches: matches.length, result });
      }
      return result;
    }

    case 'node_count': {
      const matches = findMatchingNodes(nodes, rule.nodeType);
      const result = matches.length >= rule.min;
      if (DEV_MODE) {
        console.log('[Detection] node_count:', { rule, found: matches.length, required: rule.min, result });
      }
      return result;
    }

    case 'edge_exists': {
      const sourceNodes = findMatchingNodes(nodes, rule.source);
      const targetNodes = findMatchingNodes(nodes, rule.target);
      
      if (sourceNodes.length === 0 || targetNodes.length === 0) {
        if (DEV_MODE) {
          console.log('[Detection] edge_exists: no matching nodes found', { sourceMatches: sourceNodes.length, targetMatches: targetNodes.length });
        }
        return false;
      }

      for (const source of sourceNodes) {
        for (const target of targetNodes) {
          if (findEdge(edges, source, target)) {
            if (DEV_MODE) {
              console.log('[Detection] edge_exists: found edge', { source: source.id, target: target.id });
            }
            return true;
          }
        }
      }

      if (DEV_MODE) {
        console.log('[Detection] edge_exists: no edge found between any matching nodes');
      }
      return false;
    }

    case 'edge_from_type': {
      const sourceNodes = findMatchingNodes(nodes, rule.sourceType);
      const targetNodes = findMatchingNodes(nodes, rule.targetType);
      
      if (sourceNodes.length === 0 || targetNodes.length === 0) {
        return false;
      }

      for (const source of sourceNodes) {
        for (const target of targetNodes) {
          if (findEdge(edges, source, target)) {
            return true;
          }
        }
      }
      return false;
    }

    case 'all_of': {
      const results = rule.rules.map(r => evaluateValidationRule(r, nodes, edges));
      const result = results.every(Boolean);
      if (DEV_MODE) {
        console.log('[Detection] all_of:', { results, result });
      }
      return result;
    }

    case 'any_of': {
      const results = rule.rules.map(r => evaluateValidationRule(r, nodes, edges));
      const result = results.some(Boolean);
      if (DEV_MODE) {
        console.log('[Detection] any_of:', { results, result });
      }
      return result;
    }

    default:
      if (DEV_MODE) {
        console.log('[Detection] Unknown rule type:', rule);
      }
      return false;
  }
}

export function validateAllRules(
  rules: ValidationRule[],
  nodes: Node[],
  edges: Edge[]
): { passed: boolean; unmetRules: ValidationRule[] } {
  const passed = rules.every(rule => evaluateValidationRule(rule, nodes, edges));
  const unmetRules = passed 
    ? [] 
    : rules.filter(rule => !evaluateValidationRule(rule, nodes, edges));
  
  return { passed, unmetRules };
}
