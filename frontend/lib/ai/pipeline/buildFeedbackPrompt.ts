import type { ValidationFeedback } from './types';

export function buildFeedbackPrompt(originalPrompt: string, feedback: ValidationFeedback, attempt: number): string {
  if (feedback.isValid) return originalPrompt;

  const criticalIssues = feedback.issues.filter(i => i.severity === 'critical');
  const warningIssues = feedback.issues.filter(i => i.severity === 'warning');

  let correctionBlock = `\n\n--- CORRECTION FEEDBACK (Attempt ${attempt}) ---\n`;
  correctionBlock += `Your previous architecture generation had structural flaws (Score: ${feedback.score}/100).\n`;
  correctionBlock += `Please regenerate the architecture taking the following into account:\n\n`;

  if (criticalIssues.length > 0) {
    correctionBlock += `CRITICAL ISSUES (Must Fix):\n`;
    criticalIssues.forEach(issue => {
      correctionBlock += `- ${issue.message}\n`;
    });
    correctionBlock += '\n';
  }

  if (warningIssues.length > 0) {
    correctionBlock += `WARNINGS (Should Fix):\n`;
    warningIssues.forEach(issue => {
      correctionBlock += `- ${issue.message}\n`;
    });
    correctionBlock += '\n';
  }

  if (feedback.injectedNodes.length > 0) {
    correctionBlock += `Nodes you missed (added by system): ${feedback.injectedNodes.join(', ')}\n`;
  }
  
  if (feedback.prunedNodes.length > 0) {
    correctionBlock += `Irrelevant nodes you added (removed by system): ${feedback.prunedNodes.join(', ')}\n`;
  }

  correctionBlock += `\nREMINDERS:\n`;
  correctionBlock += `- Every node must have at least one connection edge. Do not leave orphan nodes.\n`;
  correctionBlock += `- You must explicitly assign every node to one of these valid tiers: client, edge, gateway, application, queue, data, infrastructure, observability, external.\n`;
  correctionBlock += `- Only create edges between logically adjacent tiers. E.g., clients connect to edge/gateway, not directly to databases.\n`;

  return originalPrompt + correctionBlock;
}
