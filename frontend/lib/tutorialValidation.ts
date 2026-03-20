import type { Node, Edge } from 'reactflow';
import type { TutorialStep as LegacyTutorialStep } from '@/data/tutorials';
import type { TutorialStep as CanonicalTutorialStep, EdgeRequirement } from '@/lib/tutorial/types';
import { EDGE_LABEL } from '@/lib/tutorial/factories';

type AnyTutorialStep = LegacyTutorialStep | CanonicalTutorialStep;

function getRequiredNodes(step: AnyTutorialStep): string[] {
  return (step as any).validation?.requiredNodes ?? (step as any).requiredNodes ?? [];
}

function getRequiredEdges(step: AnyTutorialStep): EdgeRequirement[] {
  return (step as any).validation?.requiredEdges ?? (step as any).requiredEdges ?? [];
}

function getErrorMessage(step: AnyTutorialStep): string {
  return (step as any).validation?.errorMessage ?? (step as any).errorMessage ?? 'Step incomplete.';
}

function getSuccessMessage(step: AnyTutorialStep): string {
  return (step as any).validation?.successMessage ?? (step as any).successMessage ?? 'Great job!';
}

function nodeMatchesComponent(node: Node, componentId: string): boolean {
  const label = node.data?.label ?? '';
  const componentIdFromNode = node.data?.componentId ?? '';
  const labelPrefix = EDGE_LABEL[componentId] ?? componentId;
  return (
    componentIdFromNode === componentId ||
    label.toLowerCase() === componentId.toLowerCase() ||
    label.toLowerCase().startsWith(labelPrefix.toLowerCase())
  );
}

export function validateStep(
  step: AnyTutorialStep,
  nodes: Node[],
  edges: Edge[]
): { valid: boolean; message: string } {
  const requiredNodes = getRequiredNodes(step);
  for (const required of requiredNodes) {
    const found = nodes.some((n) => nodeMatchesComponent(n, required));
    if (!found) {
      return {
        valid: false,
        message: getErrorMessage(step) || `Missing component: ${required}. Add it from the sidebar.`,
      };
    }
  }

  const requiredEdges = getRequiredEdges(step);
  for (const requiredEdge of requiredEdges) {
    const found = edges.some((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source);
      const targetNode = nodes.find((n) => n.id === e.target);
      if (!sourceNode || !targetNode) return false;
      return (
        nodeMatchesComponent(sourceNode, requiredEdge.from) &&
        nodeMatchesComponent(targetNode, requiredEdge.to)
      );
    });
    if (!found) {
      return {
        valid: false,
        message: `Connect ${requiredEdge.from} → ${requiredEdge.to} by drawing an edge between them.`,
      };
    }
  }

  return { valid: true, message: getSuccessMessage(step) };
}
