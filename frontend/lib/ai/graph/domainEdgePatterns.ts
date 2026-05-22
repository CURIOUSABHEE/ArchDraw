import type { ArchitectureNode, ArchitectureEdge } from '../types';
import logger from '@/lib/logger';

/**
 * Applies domain-specific edge patterns (e.g., standard RAG flows, e-commerce flows)
 */
export function applyDomainEdgePatterns(
  nodes: ArchitectureNode[],
  domain: string,
  currentEdges: ArchitectureEdge[]
): { edges: ArchitectureEdge[]; added: number } {
  const addedEdges: ArchitectureEdge[] = [];
  const leafNodes = nodes.filter(n => !n.isGroup);
  
  const edgeExists = (source: string, target: string) => 
    [...currentEdges, ...addedEdges].some(e => e.source === source && e.target === target);

  const pushEdge = (sourceId: string, targetId: string, label: string = '', async = false) => {
    if (edgeExists(sourceId, targetId)) return;
    addedEdges.push({
      id: `domain-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      sourceHandle: 'right',
      targetHandle: 'left',
      communicationType: async ? 'async' : 'sync',
      pathType: 'smooth',
      label,
      animated: async,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: 'arrowclosed',
    } as ArchitectureEdge);
  };

  if (domain === 'rag') {
    const vectorDb = leafNodes.find(n => n.label.toLowerCase().includes('vector'));
    const llm = leafNodes.find(n => n.label.toLowerCase().includes('llm') || n.label.toLowerCase().includes('model'));
    const api = leafNodes.find(n => n.layer === 'application' && !n.label.toLowerCase().includes('llm'));
    
    if (api && vectorDb) pushEdge(api.id, vectorDb.id, 'semantic search');
    if (vectorDb && llm) pushEdge(vectorDb.id, llm.id, 'context injection');
  }

  if (addedEdges.length > 0) {
    logger.log(`[DomainEdgePatterns] Added ${addedEdges.length} domain-specific edges for ${domain}`);
  }
  
  return { edges: addedEdges, added: addedEdges.length };
}
