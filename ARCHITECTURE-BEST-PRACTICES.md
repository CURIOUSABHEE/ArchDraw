# Architecture Best Practices — Day 1 Checklist

## 1. State boundaries before components
- Server state (DB data) → React Query / SWR, never duplicated into local state
- Ephemeral UI state (canvas position, modal open) → local component state, never persisted unless needed
- Shareable state (filters, active tab) → URL params, not context

## 2. Server Components by default (Next.js)
- Every component that doesn't need interactivity ships zero JS to the browser
- Decide the boundary at the start of each feature

## 3. Optimistic UI for every mutation
- Any action hitting Supabase (create/update/delete) updates UI immediately, reconciles in background
- This alone is what makes an app feel "snappy" vs "laggy"

## 4. Offload heavy compute to Web Workers
- Layout algorithms, AST parsing, diagram generation → off the main thread
- Prevents drag/pan jank even when computation is fast

## 5. Canvas interactions: transform, not re-render
- Use CSS transforms via refs/RAF, not state updates on every mousemove
- Debounce the state commit, not the visual feedback

## 6. Bundle budget from day one
- Run `next/bundle-analyzer` from week one
- Code-split WASM, charting libs, layout engines on-demand

## 7. Database indexes + pagination upfront
- Add indexes on foreign keys and filter/sort columns at table-creation time
- Add pagination to list endpoints from day one

## 8. Strict TypeScript + shared types
- Single source of truth for types (codegen from Supabase or shared package)
- Eliminates "agent changed API shape, frontend silently broke" bugs

## 9. Skeleton states + streaming, not spinners
- Suspense boundaries per data-dependent section
- Each with its own skeleton — not one global loading spinner

## 10. Single orchestrator, decided in writing
- For pipeline/multi-step logic, document which module owns sequencing before coding
- "Competing orchestrators" is a symptom of skipping this decision
