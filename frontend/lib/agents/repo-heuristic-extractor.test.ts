import { describe, it, expect } from 'vitest';
import { extractComponentsHeuristic, inferRelationshipsHeuristic } from './repo-heuristic-extractor';
import type { RepoSnapshot } from '@/lib/types/repo-diagram';

describe('repo-heuristic-extractor', () => {
  it('extracts main.py and sqlite from a minimal FastAPI-style tree', () => {
    const snapshot: RepoSnapshot = {
      repoUrl: 'https://github.com/o/r',
      owner: 'o',
      repo: 'r',
      fileTree: ['main.py', 'app/routers/campaign.py', 'requirements.txt'],
      selectedFiles: [
        {
          path: 'main.py',
          content: 'import sqlite3\nfrom fastapi import FastAPI\n',
        },
      ],
      repoMeta: {
        hasAppDir: true,
        hasPagesDir: false,
        hasPrisma: false,
        hasMiddleware: false,
        hasEnvExample: false,
        packageJson: null,
      },
      surfaceClassification: {
        primaryLanguage: 'Python',
        detectedFrameworks: ['FastAPI'],
        hasDocker: false,
        hasMultipleServices: false,
        isMonorepo: false,
        projectType: 'unknown',
      },
      phase1Files: [],
      phase2Files: [],
    };

    const nodes = extractComponentsHeuristic(snapshot, {
      repoType: 'backend_only',
      architecturePattern: 'layered',
      primaryStack: { framework: 'FastAPI', language: 'Python', runtime: 'Python' },
      confidence: 'low',
      reasoning: 'test',
      extractionStrategy: {
        keyDirectories: ['app'],
        entryPoints: ['main.py'],
        moduleStructure: 'layered',
        focusAreas: [],
      },
    });

    expect(nodes.length).toBeGreaterThanOrEqual(2);
    expect(nodes.some((n) => n.type === 'DATABASE' || n.id.includes('sqlite'))).toBe(true);
  });

  it('infers edges between entry, routes, and database', () => {
    const nodes = extractComponentsHeuristic(
      {
        repoUrl: '',
        owner: 'o',
        repo: 'r',
        fileTree: ['main.py', 'app/routers/api.py'],
        selectedFiles: [{ path: 'main.py', content: 'import sqlite3' }],
        repoMeta: {
          hasAppDir: true,
          hasPagesDir: false,
          hasPrisma: false,
          hasMiddleware: false,
          hasEnvExample: false,
          packageJson: null,
        },
        surfaceClassification: {
          primaryLanguage: 'Python',
          detectedFrameworks: [],
          hasDocker: false,
          hasMultipleServices: false,
          isMonorepo: false,
          projectType: 'unknown',
        },
        phase1Files: [],
        phase2Files: [],
      },
      undefined
    );

    const { edges } = inferRelationshipsHeuristic(nodes);
    expect(edges.length).toBeGreaterThan(0);
  });
});
