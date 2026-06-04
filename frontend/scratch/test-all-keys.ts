import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf-8');
  envText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.substring(0, index).trim();
        let value = trimmed.substring(index + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  });
}

import { MODEL_CONFIG } from '../lib/ai/constants';

const GROQ_KEY_ENV_VARS = [
  'GROQ_API_KEY_FOR_DESC_1', 'GROQ_API_KEY_FOR_DESC_2', 'GROQ_API_KEY_FOR_DESC_3',
  'GROQ_API_KEY_FOR_DESC_4', 'GROQ_API_KEY_FOR_DESC_5', 'GROQ_API_KEY_FOR_DESC_6',
  'GROQ_API_KEY_FOR_DESC_7', 'GROQ_API_KEY_FOR_DESC_8', 'GROQ_API_KEY_FOR_DESC_9',
];

async function testKey(envVar: string): Promise<boolean> {
  const apiKey = process.env[envVar];
  if (!apiKey) {
    console.log(`[${envVar}] MISSING`);
    return false;
  }
  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey });
    const res = await groq.chat.completions.create({
      model: MODEL_CONFIG.reasoning.primary,
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 5,
    });
    console.log(`[${envVar}] SUCCESS (response: "${res.choices[0]?.message?.content?.trim()}")`);
    return true;
  } catch (error: any) {
    console.log(`[${envVar}] FAILED: ${error?.message || error}`);
    return false;
  }
}

async function run() {
  console.log("Testing all Groq keys...");
  for (const envVar of GROQ_KEY_ENV_VARS) {
    await testKey(envVar);
  }
}

run();
