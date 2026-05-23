import { analyzeFeedbackLog } from '../lib/ai/pipeline/feedbackAnalyzer';

function run() {
  const analysis = analyzeFeedbackLog();

  console.log('\n=== ArchDraw Generation Quality Report ===');
  console.log(`Total generations logged : ${analysis.totalGenerations}`);
  console.log(`Average quality score    : ${analysis.averageScore} / 100`);
  console.log(`Average attempts needed  : ${analysis.averageAttempts}`);
  console.log(`Needed repair            : ${analysis.repairedPercentage}% of generations\n`);

  console.log('Top recurring issues:');
  if (analysis.topIssues.length === 0) {
    console.log('  None');
  } else {
    analysis.topIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.message} (${issue.count}x)`);
    });
  }
  console.log('');

  console.log('Top injected nodes:');
  if (analysis.topInjectedNodes.length === 0) {
    console.log('  None');
  } else {
    analysis.topInjectedNodes.forEach((node, i) => {
      console.log(`  ${i + 1}. ${node.node} (${node.count}x)`);
    });
  }
  console.log('');

  console.log('Domains with lowest average scores:');
  if (analysis.domainBreakdown.length === 0) {
    console.log('  None');
  } else {
    analysis.domainBreakdown.forEach((stat, i) => {
      console.log(`  ${i + 1}. ${stat.domain.padEnd(15)} → avg score ${stat.avgScore}`);
    });
  }
  console.log('');

  console.log(`Low-score generations (score < 50): ${analysis.lowScoreGenerations.length} entries`);
  
  if (process.argv.includes('--dump-low')) {
    console.log('\n--- Low Score Prompts ---');
    analysis.lowScoreGenerations.forEach(entry => {
      console.log(`\nScore: ${entry.finalScore} | Domain: ${entry.detectedDomain}`);
      console.log(`Prompt: ${entry.originalPrompt}`);
    });
  } else {
    console.log('Run with --dump-low to print their prompts.');
  }
  console.log('');
}

run();
