import { useCallback, useRef } from 'react';
import { useTutorialStore } from '@/store/tutorialStore';
import { useDiagramStore } from '@/store/diagramStore';
import type { Node, Edge } from 'reactflow';
import type { TutorialStep, ArchitectureGraph } from '@/lib/tutorial/types';
import { createGraph, matchesMatcher } from '@/lib/tutorial/graph';
import type { ComponentMatcher } from '@/lib/tutorial/types';

interface ValidationResult {
  isValid: boolean;
  message: string;
  missingNodes: string[];
  missingEdges: Array<{ from: string; to: string }>;
}

function extractMatcherIdentifiers(matcher: ComponentMatcher): string[] {
  const identifiers: string[] = [];
  
  if (matcher.labelContains && matcher.labelContains.length > 0) {
    identifiers.push(...matcher.labelContains);
  }
  if (matcher.keywords && matcher.keywords.length > 0) {
    identifiers.push(...matcher.keywords);
  }
  if (matcher.category) {
    identifiers.push(matcher.category);
  }
  
  return identifiers;
}

function nodeMatchesAnyIdentifier(node: Node, identifiers: string[]): boolean {
  const nodeLabel = (node.data?.label as string ?? '').toLowerCase().trim();
  const nodeComponentId = (node.data?.componentId as string ?? '').toLowerCase().trim();

  for (const id of identifiers) {
    const idLower = id.toLowerCase();
    
    // Direct componentId match
    if (nodeComponentId && (nodeComponentId === idLower || nodeComponentId.includes(idLower) || idLower.includes(nodeComponentId))) {
      return true;
    }
    
    // Label match
    if (nodeLabel.includes(idLower) || idLower.includes(nodeLabel)) {
      return true;
    }
    
    // Strip and compare (handles snake_case vs spaces)
    const strippedNode = nodeLabel.replace(/[^a-z0-9]/g, '');
    const strippedId = idLower.replace(/[^a-z0-9]/g, '');
    if (strippedNode && strippedId && (strippedNode.includes(strippedId) || strippedId.includes(strippedNode))) {
      return true;
    }
  }
  
  return false;
}

function edgeMatchesRequired(
  edge: Edge,
  nodes: Node[],
  fromIdentifiers: string[],
  toIdentifiers: string[]
): boolean {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  if (!sourceNode || !targetNode) return false;
  
  const sourceMatches = nodeMatchesAnyIdentifier(sourceNode, fromIdentifiers);
  const targetMatches = nodeMatchesAnyIdentifier(targetNode, toIdentifiers);
  
  return sourceMatches && targetMatches;
}

export function useTutorialValidation() {
  const { nodes: storeNodes, edges: storeEdges } = useDiagramStore();
  
  const validateStep = useCallback((
    step: TutorialStep,
    nodes?: Node[],
    edges?: Edge[]
  ): ValidationResult => {
    const currentNodes = nodes || storeNodes;
    const currentEdges = edges || storeEdges;
    
    // Try new system validation first (if step has a validation function)
    if (typeof step.validation === 'function') {
      const graph = createGraph(currentNodes, currentEdges);
      const result = step.validation(graph);
      
      if (result.isValid) {
        return { isValid: true, message: step.successMessage || 'Step completed!', missingNodes: [], missingEdges: [] };
      }
      
      return {
        isValid: false,
        message: result.errors[0]?.message || 'Step incomplete.',
        missingNodes: result.errors
          .filter(e => e.code === 'MISSING_NODE' || e.code === 'NODE_NOT_ADDED')
          .map(e => e.message),
        missingEdges: result.errors
          .filter(e => e.code === 'MISSING_CONNECTION' || e.code === 'NOT_CONNECTED')
          .map(() => ({ from: '', to: '' })),
      };
    }
    
    // Fall back to legacy requiredNodes/requiredEdges
    const requiredNodes: string[] = (step as any).requiredNodes || [];
    const requiredEdges: Array<{ from: string; to: string }> = (step as any).requiredEdges || [];
    
    const missingNodes: string[] = [];
    
    // Check required nodes
    for (const requiredNodeId of requiredNodes) {
      const found = currentNodes.some(node => {
        const identifiers = [requiredNodeId];
        return nodeMatchesAnyIdentifier(node, identifiers);
      });
      if (!found) {
        missingNodes.push(requiredNodeId);
      }
    }
    
    const missingEdges: Array<{ from: string; to: string }> = [];
    
    // Check required edges
    for (const requiredEdge of requiredEdges) {
      const found = currentEdges.some(edge => 
        edgeMatchesRequired(edge, currentNodes, [requiredEdge.from], [requiredEdge.to])
      );
      if (!found) {
        missingEdges.push(requiredEdge);
      }
    }
    
    if (missingNodes.length > 0) {
      return {
        isValid: false,
        message: `Add: ${missingNodes.join(', ')}`,
        missingNodes,
        missingEdges: [],
      };
    }
    
    if (missingEdges.length > 0) {
      return {
        isValid: false,
        message: `Connect: ${missingEdges.map(e => `${e.from} → ${e.to}`).join(', ')}`,
        missingNodes: [],
        missingEdges,
      };
    }
    
    return { 
      isValid: true, 
      message: step.successMessage || 'Step completed!',
      missingNodes: [],
      missingEdges: [],
    };
  }, [storeNodes, storeEdges]);
  
  const checkNodeAdded = useCallback((
    step: TutorialStep,
    newNodes: Node[]
  ): { matched: boolean; node?: Node } => {
    const requiredNodes: string[] = (step as any).requiredNodes || [];
    
    if (requiredNodes.length === 0) {
      // For new system, check if the node matches the step's nodeMatcher
      if (step.validation && typeof step.validation === 'function') {
        const graph = createGraph(newNodes, []);
        const result = step.validation(graph);
        if (result.isValid) {
          return { matched: true, node: newNodes[0] };
        }
      }
      return { matched: false };
    }
    
    for (const node of newNodes) {
      for (const requiredId of requiredNodes) {
        if (nodeMatchesAnyIdentifier(node, [requiredId])) {
          return { matched: true, node };
        }
      }
    }
    
    return { matched: false };
  }, []);
  
  const checkEdgeAdded = useCallback((
    step: TutorialStep,
    allEdges: Edge[],
    allNodes: Node[],
    currentEdgeIndex: number
  ): { matched: boolean; edge?: Edge } => {
    const requiredEdges: Array<{ from: string; to: string }> = (step as any).requiredEdges || [];
    
    if (currentEdgeIndex >= requiredEdges.length) {
      return { matched: false };
    }
    
    const requiredEdge = requiredEdges[currentEdgeIndex];
    if (!requiredEdge) {
      return { matched: false };
    }
    
    for (const edge of allEdges) {
      if (edgeMatchesRequired(edge, allNodes, [requiredEdge.from], [requiredEdge.to])) {
        return { matched: true, edge };
      }
    }
    
    return { matched: false };
  }, []);
  
  return {
    validateStep,
    checkNodeAdded,
    checkEdgeAdded,
  };
}

export function createValidationResult(
  isValid: boolean,
  message: string,
  missingNodes: string[] = [],
  missingEdges: Array<{ from: string; to: string }> = []
): ValidationResult {
  return { isValid, message, missingNodes, missingEdges };
}
