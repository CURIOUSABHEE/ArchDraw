import type { Node, Edge } from 'reactflow';
import type { TutorialStep, EdgeRequirement } from '@/lib/tutorial/types';
import { EDGE_LABEL } from '@/lib/tutorial/factories';

type AnyTutorialStep = TutorialStep;

interface ValidationFields {
  requiredNodes?: string[];
  requiredEdges?: EdgeRequirement[];
  errorMessage?: string;
  successMessage?: string;
}

function getValidationFields(step: AnyTutorialStep): ValidationFields {
  return {
    requiredNodes: step.requiredNodes,
    requiredEdges: step.requiredEdges,
    errorMessage: step.errorMessage,
    successMessage: step.successMessage,
  };
}

function getRequiredNodes(step: AnyTutorialStep): string[] {
  return getValidationFields(step).requiredNodes ?? [];
}

function getRequiredEdges(step: AnyTutorialStep): EdgeRequirement[] {
  return getValidationFields(step).requiredEdges ?? [];
}

function getErrorMessage(step: AnyTutorialStep): string {
  return getValidationFields(step).errorMessage ?? 'Step incomplete.';
}

function getSuccessMessage(step: AnyTutorialStep): string {
  return getValidationFields(step).successMessage ?? 'Great job!';
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
