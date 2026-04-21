import type { TutorialDefinition } from '@/lib/tutorial/schema';
import type { ValidationRule } from '@/lib/tutorial/schema';

const tutorialFiles = import.meta.glob('./**/*.ts', { eager: true });

const forbiddenImports = ['react', 'zustand', '@/store'];

interface TestResult {
  file: string;
  passed: boolean;
  errors: string[];
}

function validateTutorialDefinition(tutorial: unknown, filePath: string): TestResult {
  const errors: string[] = [];
  
  if (!tutorial || typeof tutorial !== 'object') {
    return { file: filePath, passed: false, errors: ['Tutorial is not an object'] };
  }
  
  const t = tutorial as Record<string, unknown>;
  
  if (!t.id || typeof t.id !== 'string') {
    errors.push('Missing or invalid id');
  }
  if (!t.title || typeof t.title !== 'string') {
    errors.push('Missing or invalid title');
  }
  if (!t.description || typeof t.description !== 'string') {
    errors.push('Missing or invalid description');
  }
  if (!t.difficulty || !['beginner', 'intermediate', 'advanced'].includes(t.difficulty as string)) {
    errors.push('Missing or invalid difficulty');
  }
  if (typeof t.estimatedMinutes !== 'number') {
    errors.push('Missing or invalid estimatedMinutes');
  }
  if (!Array.isArray(t.levels)) {
    errors.push('Missing or invalid levels array');
  } else {
    t.levels.forEach((level: unknown, i: number) => {
      const l = level as Record<string, unknown>;
      if (!l.id) errors.push(`Level ${i}: missing id`);
      if (!l.title) errors.push(`Level ${i}: missing title`);
      if (!Array.isArray(l.steps)) {
        errors.push(`Level ${i}: missing steps array`);
      } else {
        l.steps.forEach((step: unknown, j: number) => {
          const s = step as Record<string, unknown>;
          if (!s.id) errors.push(`Level ${i} Step ${j}: missing id`);
          if (!s.title) errors.push(`Level ${i} Step ${j}: missing title`);
          if (!s.phases || typeof s.phases !== 'object') {
            errors.push(`Level ${i} Step ${j}: missing phases`);
          }
          if (!Array.isArray(s.validation)) {
            errors.push(`Level ${i} Step ${j}: missing validation array`);
          }
        });
      }
    });
  }
  
  return { file: filePath, passed: errors.length === 0, errors };
}

function test() {
  console.log('Testing tutorial definitions...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [path, mod] of Object.entries(tutorialFiles)) {
    if (path.includes('TUTORIAL_TEMPLATE') || path.includes('.schema.')) continue;
    if (!path.includes('-architecture.ts')) continue;
    
    const tutorial = (mod as { default?: TutorialDefinition }).default;
    if (!tutorial) {
      console.log(`❌ ${path}: No default export`);
      failed++;
      continue;
    }
    
    const result = validateTutorialDefinition(tutorial, path);
    if (result.passed) {
      console.log(`✅ ${tutorial.id}: ${tutorial.title}`);
      passed++;
    } else {
      console.log(`❌ ${path}:`);
      result.errors.forEach(e => console.log(`   - ${e}`));
      failed++;
    }
  }
  
  console.log(`\n─────────────────────────`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

test();
