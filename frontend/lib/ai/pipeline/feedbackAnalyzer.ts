import * as fs from 'fs';
import * as path from 'path';
import type { FeedbackLogEntry } from './feedbackLogger';

export interface FeedbackAnalysis {
  totalGenerations: number;
  averageScore: number;
  averageAttempts: number;
  repairedPercentage: number;
  topIssues: { message: string; count: number }[];
  topInjectedNodes: { node: string; count: number }[];
  domainBreakdown: { domain: string; count: number; avgScore: number }[];
  lowScoreGenerations: FeedbackLogEntry[];
}

const LOG_FILE = path.join(process.cwd(), 'logs', 'feedback.jsonl');

export function analyzeFeedbackLog(): FeedbackAnalysis {
  const emptyAnalysis: FeedbackAnalysis = {
    totalGenerations: 0,
    averageScore: 0,
    averageAttempts: 0,
    repairedPercentage: 0,
    topIssues: [],
    topInjectedNodes: [],
    domainBreakdown: [],
    lowScoreGenerations: [],
  };

  if (!fs.existsSync(LOG_FILE)) {
    return emptyAnalysis;
  }

  try {
    const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n').filter(Boolean);
    if (lines.length === 0) return emptyAnalysis;

    const entries: FeedbackLogEntry[] = lines.map(line => JSON.parse(line));
    
    let totalScore = 0;
    let totalAttempts = 0;
    let repairedCount = 0;
    const issueCounts = new Map<string, number>();
    const nodeCounts = new Map<string, number>();
    const domainStats = new Map<string, { count: number; totalScore: number }>();

    entries.forEach(entry => {
      totalScore += entry.finalScore;
      totalAttempts += entry.totalAttempts;
      if (entry.wasRepaired) repairedCount++;

      // Count issues
      entry.issues.forEach(issue => {
        const key = issue.message;
        issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
      });

      // Count injected nodes
      entry.injectedNodes.forEach(node => {
        nodeCounts.set(node, (nodeCounts.get(node) || 0) + 1);
      });

      // Domain breakdown
      const domain = entry.detectedDomain || 'unknown';
      const stats = domainStats.get(domain) || { count: 0, totalScore: 0 };
      stats.count++;
      stats.totalScore += entry.finalScore;
      domainStats.set(domain, stats);
    });

    const topIssues = Array.from(issueCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topInjectedNodes = Array.from(nodeCounts.entries())
      .map(([node, count]) => ({ node, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const domainBreakdown = Array.from(domainStats.entries())
      .map(([domain, stats]) => ({
        domain,
        count: stats.count,
        avgScore: Math.round(stats.totalScore / stats.count)
      }))
      .sort((a, b) => a.avgScore - b.avgScore);

    return {
      totalGenerations: entries.length,
      averageScore: Math.round(totalScore / entries.length),
      averageAttempts: Number((totalAttempts / entries.length).toFixed(1)),
      repairedPercentage: Math.round((repairedCount / entries.length) * 100),
      topIssues,
      topInjectedNodes,
      domainBreakdown,
      lowScoreGenerations: entries.filter(e => e.finalScore < 50),
    };
  } catch (error) {
    console.warn('[FeedbackAnalyzer] Failed to analyze feedback log:', error);
    return emptyAnalysis;
  }
}
