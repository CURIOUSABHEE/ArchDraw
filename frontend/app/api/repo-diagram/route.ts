import { NextRequest, NextResponse } from 'next/server';
import { generateRepoArchitectureDiagram } from '@/lib/repo-diagram-pipeline';
import type { RepoDiagramApiResponse } from '@/lib/types/repo-diagram';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 300; // Allows pipeline up to 5 minutes to complete

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { success: false, error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    const cleanedUrl = repoUrl.trim().replace(/\/+$/, '');
    const match = cleanedUrl.match(
      /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9-._]+)\/([a-zA-Z0-9-._]+?)(?:\.git)?$/
    );
    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid GitHub URL. Must match pattern: https://github.com/{owner}/{repo} (no trailing slashes or subdirectories)',
        },
        { status: 400 }
      );
    }

    const canonicalUrl = `https://github.com/${match[1]}/${match[2]}`;
    const result = await generateRepoArchitectureDiagram(canonicalUrl);

    const payload: RepoDiagramApiResponse = {
      success: true,
      ndjson: result.ndjson,
      nodeCount: result.nodeCount,
      edgeCount: result.edgeCount,
      workflowCount: result.workflowCount,
      workflows: result.workflows,
      repoMeta: result.repoMeta,
      repoProfile: result.repoProfile,
      dependencyMap: result.dependencyMap,
      reviewNotes: result.reviewNotes,
      confidence: result.confidence,
    };

    return NextResponse.json(payload);
  } catch (error) {
    logger.error('[API] Repo diagram generation failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
