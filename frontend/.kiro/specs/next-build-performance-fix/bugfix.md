# Bugfix Requirements Document

## Introduction

This bugfix addresses severe Next.js build performance issues in a React Flow-based diagram editor application. The application experiences slow compilation on every file change, with full graph recompilation when touching any node component. The root causes are:

1. **Eager bundling of heavy libraries**: React Flow (~500KB) and ELK.js (~1.5MB) are imported at module root level, causing them to be bundled on every compile cycle
2. **Top-level imports pulling entire dependency graphs**: Module-level imports force Next.js to process massive dependency chains even for unrelated file changes
3. **Barrel file re-exports**: Index files that re-export everything create unnecessary module coupling
4. **Missing dynamic imports**: Heavy libraries lack code-splitting, preventing lazy loading

The fix will implement dynamic imports with SSR disabled for heavy libraries, eliminate problematic barrel files, and optimize the build configuration to enable persistent caching and faster compilation.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN any file in the editor is modified THEN the system recompiles React Flow and ELK.js on every build cycle, causing 5-10 second compilation times

1.2 WHEN a single node component file is edited THEN the system pulls the entire React Flow dependency graph into the bundle, causing full graph recompilation

1.3 WHEN `components/Canvas.tsx` is loaded THEN the system eagerly imports React Flow at module root level with `import ReactFlow from 'reactflow'`, forcing immediate bundling

1.4 WHEN `lib/ai/pipeline/stage6-layout.ts` is loaded THEN the system eagerly imports ELK.js with `import ELK from 'elkjs/lib/elk.bundled.js'`, forcing immediate bundling of the 1.5MB library

1.5 WHEN `lib/ai/workers/elkWorker.ts` is loaded THEN the system eagerly imports ELK.js at module root level, duplicating the bundling overhead

1.6 WHEN barrel files like `lib/ai/services/index.ts` re-export multiple modules THEN the system creates unnecessary coupling where importing one service pulls all services into the bundle

1.7 WHEN the Next.js dev server restarts THEN the system does not persist the `.next/cache` properly, losing all previous compilation work

1.8 WHEN the application attempts to start on port 3000 THEN the system falls back to port 3001 due to a stale process on port 44676 (Note: this specific issue is already resolved as verified by `lsof -ti:44676` returning no process)

### Expected Behavior (Correct)

2.1 WHEN any file in the editor is modified THEN the system SHALL only recompile the changed module and its direct dependencies, completing in under 2 seconds

2.2 WHEN a single node component file is edited THEN the system SHALL NOT pull React Flow into the bundle unless the Canvas component itself is accessed

2.3 WHEN `components/Canvas.tsx` is loaded THEN the system SHALL dynamically import React Flow using `dynamic(() => import('reactflow'), { ssr: false })` to enable code-splitting and lazy loading

2.4 WHEN `lib/ai/pipeline/stage6-layout.ts` needs ELK.js THEN the system SHALL dynamically import it using `const ELKModule = await import('elkjs/lib/elk.bundled.js')` to defer loading until actually needed

2.5 WHEN `lib/ai/workers/elkWorker.ts` needs ELK.js THEN the system SHALL use the same dynamic import pattern to avoid eager bundling

2.6 WHEN barrel files exist THEN the system SHALL use direct imports (e.g., `import { edgeLayout } from '@/lib/ai/services/edgeLayout'`) instead of re-exporting through index files

2.7 WHEN the Next.js dev server restarts THEN the system SHALL persist the `.next/cache` directory and utilize turbotrace experimental config for faster subsequent builds

2.8 WHEN the application starts THEN the system SHALL successfully bind to port 3000 without port conflicts

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the Canvas component renders in the browser THEN the system SHALL CONTINUE TO display the React Flow diagram editor with all existing functionality

3.2 WHEN ELK.js layout is invoked for diagram generation THEN the system SHALL CONTINUE TO produce correctly laid-out diagrams with the same visual output

3.3 WHEN users interact with nodes and edges THEN the system SHALL CONTINUE TO support all existing interactions (drag, select, connect, edit)

3.4 WHEN the application is built for production with `npm run build` THEN the system SHALL CONTINUE TO generate optimized bundles with proper code-splitting

3.5 WHEN components import from `@/lib/ai/services` THEN the system SHALL CONTINUE TO resolve the imports correctly after barrel file removal

3.6 WHEN the Canvas component is server-side rendered THEN the system SHALL CONTINUE TO skip React Flow rendering on the server (maintaining `ssr: false` behavior)

3.7 WHEN existing layout algorithms run THEN the system SHALL CONTINUE TO use the same ELK configuration options and produce identical layouts

3.8 WHEN the development server hot-reloads after a file change THEN the system SHALL CONTINUE TO preserve React state and not cause full page refreshes
