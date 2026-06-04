import type { ValidationFeedback } from './types';

export function buildFeedbackPrompt(
  originalPrompt: string,
  feedback: ValidationFeedback,
  attempt: number
): string {
  if (feedback.issues.length === 0) return originalPrompt;

  const criticalIssues = feedback.issues.filter((i) => i.severity === 'critical');
  const warningIssues = feedback.issues.filter((i) => i.severity === 'warning');

  const orphanIds = feedback.issues
    .filter((i) => i.type === 'orphan_node')
    .map((o) => o.nodeId || 'unknown');

  const hasLabelIssues = feedback.issues.some(
    (i) => i.type === 'empty_edge_label' || i.type === 'vague_edge_label'
  );

  let block = `\n\n--- CORRECTION (Attempt ${attempt}, Score: ${feedback.score}/100) ---\nFix every item below:\n`;

  if (criticalIssues.length > 0) {
    block += `CRITICAL:\n${criticalIssues.map((i) => `- ${i.message}`).join('\n')}\n`;
  }
  if (warningIssues.length > 0) {
    block += `WARNINGS:\n${warningIssues.map((i) => `- ${i.message}`).join('\n')}\n`;
  }
  if (orphanIds.length > 0) {
    block += `CONNECT: orphan IDs to fix/remove: ${orphanIds.join(', ')}. Every node must be in ≥1 flow.\n`;
  }
  if (hasLabelIssues) {
    block += `LABELS: every flow needs a 2-5 word label. Banned: "connects to", "calls", "uses", "requests", "integrates with".\n`;
  }

  return originalPrompt + block;
}
