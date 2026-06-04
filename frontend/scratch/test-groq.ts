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

import { runArchitecturePipeline } from '../lib/ai/pipeline/pipelineOrchestrator';

async function run() {
  console.log("Starting pipeline test...");
  
  // Clear all GROQ keys to simulate missing keys
  for (let i = 1; i <= 9; i++) {
    delete process.env[`GROQ_API_KEY_FOR_DESC_${i}`];
  }
  console.log("GROQ keys cleared from process.env.");

  try {
    console.log("\nCalling runArchitecturePipeline...");
    const result = await runArchitecturePipeline({
      description: "video streaming platform with transcoding",
      systemType: "Streaming Platform",
      complexity: "medium",
      diagramSize: "medium",
    });
    console.log("Pipeline result nodes count:", result.nodes.length);
    console.log("Pipeline result edges count:", result.edges.length);
    console.log("Pipeline score:", result.score);
  } catch (err) {
    console.error("Error occurred in pipeline:", err);
  }
}

run();
