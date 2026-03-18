import type { Node, Edge } from 'reactflow';
import type { TutorialStep } from '@/data/tutorials';

export function validateStep(
  step: TutorialStep,
  nodes: Node[],
  edges: Edge[]
): { valid: boolean; message: string } {
  const { validation } = step;

  // Check required node labels exist on canvas
  for (const required of validation.requiredNodes) {
    const found = nodes.some((n) =>
      n.data?.label?.toLowerCase().includes(required.toLowerCase())
    );
    if (!found) {
      return {
        valid: false,
        message: validation.errorMessage || `Missing component: ${required}. Add it from the sidebar.`,
      };
    }
  }

  // Check required edges exist
  for (const requiredEdge of validation.requiredEdges) {
    const found = edges.some((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source);
      const targetNode = nodes.find((n) => n.id === e.target);
      return (
        sourceNode?.data?.label?.toLowerCase().includes(requiredEdge.from.toLowerCase()) &&
        targetNode?.data?.label?.toLowerCase().includes(requiredEdge.to.toLowerCase())
      );
    });
    if (!found) {
      return {
        valid: false,
        message: `Connect ${requiredEdge.from} → ${requiredEdge.to} by drawing an edge between them.`,
      };
    }
  }

  return { valid: true, message: validation.successMessage };
}
