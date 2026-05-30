# GEMINI.md — ArchDraw

> You are working on **ArchDraw**, a web-based AI-powered system architecture
> diagram tool. Read this entire file before touching any code.
> Every rule here is absolute. Do not deviate, do not suggest alternatives,
> do not silently skip a rule because it seems inconvenient.

---

## WHO MAINTAINS THIS PROJECT

**Abhishek Jamdade** — sole developer.
Ask for clarification before making any decision that isn't covered here.
When in doubt: do less, not more.

---

## FIRST PRINCIPLES

1. **Read before you write.** Understand what the code does before changing it.
2. **Git is truth.** If a feature was working before, find it in git history. Do not rewrite from scratch.
3. **One config file.** All default values live in `lib/config.ts`. Never hardcode values elsewhere.
4. **One factory.** All node and edge objects are created via `lib/factory.ts`. Never construct them inline.
5. **Scope discipline.** Change only what the task requires. Nothing more.

---

## TECH STACK

| Concern | Library | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | Never Pages Router |
| UI | React 19 | |
| Canvas | React Flow (v11) | See edge rules carefully |
| State | Zustand + persist | Port-isolated localStorage |
| Styling | Tailwind CSS v4 | ONLY — no inline styles |
| Components | shadcn/ui + Radix UI | |
| Icons | Lucide React | ONLY — no other icon lib |
| Database | Supabase PostgreSQL | |
| Auth | Supabase magic link OTP | NEVER password auth |
| Email | Resend | |
| Hosting | Vercel | |
| Layout | ELK (elkjs) | Not Dagre — ELK only |
| Export | html-to-image | PNG only, never SVG |
| Notifications | Sonner | |
| Animation | Tailwind only | No framer-motion |

**Never install a new package without being explicitly asked.**
**Never suggest replacing any library above with an alternative.**

---

## FILE STRUCTURE

```
/app
  /canvas              — main canvas page (no auth required)
  /share/[id]          — read-only shared canvas viewer
  /auth/callback       — magic link callback
/components
  /edges               — SimpleFloatingEdge and edge components
  /ui                  — shadcn components
  ShareModal.tsx
  EmailCaptureModal.tsx
  TemplateModal.tsx
/data
  /templates           — one .ts file per template, index.ts exports all
  components.json      — ONLY source of truth for node types
/lib
  config.ts            — ALL default values (canvas, edge, ELK, theme)
  factory.ts           — ONLY place that constructs node/edge objects
  edgeColors.ts        — overlap detection, 2-color system
  /features
    dynamicHandles.ts  — PROTECTED: dynamic handle selection logic
    index.ts           — feature registry
  /utils               — helpers (columnAlignNodes.ts pending deletion)
/types
  index.ts             — all TypeScript types
/store
  index.ts             — Zustand store with persist
```

---

## SCOPE DISCIPLINE (read this every time)

Before making any change:
1. List the files you will touch
2. Confirm each file is necessary for THIS task
3. Make ONLY the required changes
4. Do NOT rename variables, classes, or functions in files you touch
5. Do NOT refactor code that isn't broken
6. Do NOT add unrequested features
7. After finishing, state exactly what you changed and why

---

## CODE QUALITY

- TypeScript strict mode — `any` is forbidden
- No `// @ts-ignore` or `// @ts-nocheck`
- No `console.log` left in committed code
- Reuse existing Supabase client — never create a new instance
- Reuse existing Zustand store actions — never duplicate store logic
- Always handle loading + error states
- Always show Sonner toast for async actions (success and error)
- Business logic never goes inside UI components

---

## STYLING RULES

- Tailwind utility classes only — no `style={{ }}` ever
- No arbitrary Tailwind values unless unavoidable
- Dynamic/interactive colors use RGB values
- Default theme: dark slate
- **Forbidden:** pink, rose, fuchsia, warm tints — nowhere in the app
- **Palette:**
  - Accent: `indigo-600` / `#6366f1`
  - Muted text: `slate-400` / `#94a3b8`
  - Borders: `white/8` or `slate-700`
  - Cards: `slate-800` or `slate-900`
- No emoji in app UI — use Lucide icons instead

---

## CANVAS RULES

### ReactFlow JSX (must always match)

```tsx
<ReactFlow
  defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}   // from lib/config.ts
  connectionMode={ConnectionMode.Loose}        // required for floating edges
  snapToGrid={true}
  snapGrid={[20, 20]}
  minZoom={0.1}
  maxZoom={2}
  edgeTypes={edgeTypes}                        // defined OUTSIDE component
>
  <Background
    variant={BackgroundVariant.Dots}
    gap={20}
    size={1}
    color="#334155"
  />
</ReactFlow>
```

- `edgeTypes` must be defined outside the component function — never inside
- Grid background must always exist — never remove
- Snap to grid must always be on — never remove
- `ConnectionMode.Loose` must always be set

### New Node Placement

Always place at viewport center — never at `{x:0, y:0}`:

```ts
const { x, y, zoom } = reactFlowInstance.getViewport();
const centerX = (bounds.width / 2 - x) / zoom;
const centerY = (bounds.height / 2 - y) / zoom;
```

### Multi-Canvas

```ts
type CanvasTab = { id: string; name: string; nodes: Node[]; edges: Edge[] }
```

- All operations target `activeCanvasId` only
- Minimum 1 tab — never allow closing the last tab
- Tab "+" button is left-aligned, immediately after last tab — no `ml-auto`
- State persisted to localStorage using port-isolated key (see config.ts)

### Node Cards

- Never change node card design, size, or layout
- Never rename CSS class names in node components
- Shine overlay must always be present as first child:
  ```tsx
  <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10
  bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent" />
  ```

---

## EDGE RULES

### Default edge config (from lib/config.ts)

```ts
export const DEFAULT_EDGE_OPTIONS = {
  type:     'floating',
  animated: true,
  style:    { strokeWidth: 1.5, stroke: '#94a3b8' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
};
```

### Marker color rule (critical)

Always set stroke color in BOTH places — missing either causes mismatch:

```ts
style:    { stroke: color, strokeWidth: 1.5 },   // line color
markerEnd: { type: MarkerType.ArrowClosed, color } // arrow color
```

Always use object form for `markerEnd` — never `'url(#id)'` string form.

### Overlap color system (exactly 2 colors)

```ts
const EDGE_COLORS = {
  default:     '#94a3b8',  // slate — normal edge
  nodeOverlap: '#000000',  // black — edge passes through a node body
};
```

- Only 2 colors, never 3
- Detection uses Cohen-Sutherland path clipping — NOT AABB
- `coloredEdges` is derived display state — never written to store via `setEdges`

### CSS rule — never override edge stroke globally

No CSS rule may set `stroke` on `.react-flow__edge-path` or `.react-flow__edge`.
Colors are inline only. Global CSS overrides inline on canvas but not in export —
this causes the "visible in PNG but not on canvas" bug.

### Self-loop edges — ALLOWED

`source === target` edges are valid. Do not filter them anywhere.

**Pending fix:** remove `edges.filter(e => e.source !== e.target)` from:
- `stage6-layout.ts` line 107
- `elkLayoutService.ts` line 564

### Dynamic Handle Selection — PROTECTED

**File:** `lib/features/dynamicHandles.ts` and `components/nodes/FloatingHandles.tsx` — do not modify without instruction.

Handle side is computed from relative node position on EVERY render:

| Target relative to source | Source handle | Target handle |
|---|---|---|
| Above | Top | Bottom |
| Below | Bottom | Top |
| Right | Right | Left |
| Left | Left | Right |

**React Flow Handle Architecture (Critical):**
- Nodes must have exactly 2 handles per side (8 total): one `target` and one `source`.
- Handle IDs must be explicitly separated (e.g., `target-left`, `source-left`).
- Handles MUST be invisible (`opacity: 0`, `border: 'none'`, `background: 'transparent'`). They exist only to satisfy ReactFlow's connection engine.
- `getHandleCoordinate()` receives a `type: 'source' | 'target'` parameter and applies a `+6px` offset for source edges and a `-6px` offset for target edges. This creates a permanent 12px visual gap between incoming and outgoing edges on the same side.

**React Flow v11 implementation:**
- Uses `useStore(s => s.nodeInternals.get(id))` — NOT `useNodes()`
- Reads `node.positionAbsolute` (v11) — NOT `node.internals.positionAbsolute`
- Dimensions from `node.width` / `node.height`
- `SimpleFloatingEdge` must IGNORE `props.sourcePosition` / `props.targetPosition`
  and recompute from `getDynamicHandles()` on every render

**Never do:**
- Hardcode `sourceHandle` or `targetHandle` on any edge object (not even `null`)
- Compute handle position once in `onConnect` and store it
- Use `useNodes()` instead of `useStore()` for position subscriptions
- Merge the target and source handles or make them visible.

> ⚠️ If upgrading to React Flow v12: change to `node.internals.positionAbsolute`
> and `node.measured?.width/height` across all edge files.

### SimpleFloatingEdge — PROTECTED

**File:** `components/edges/SimpleFloatingEdge.ts`

Current implementation:
- Renders `<path>` directly — NOT `<BaseEdge />`
- Calls `getDynamicHandles()` to get positions — ignores React Flow prop positions
- Passes `sourcePosition` and `targetPosition` to `getSmoothStepPath`

If the feature is broken: run `git log -- components/edges/SimpleFloatingEdge.ts`
and restore the last working version. Do not rewrite from scratch.

---

## LAYOUT RULES

### ELK config (fixed — never dynamic)

All values live in `lib/config.ts` as `ELK_CONFIG`:

```ts
{
  'elk.algorithm':                                  'layered',
  'elk.direction':                                  'RIGHT',
  'elk.spacing.nodeNode':                           '200',
  'elk.layered.spacing.nodeNodeBetweenLayers':      '300',
  'elk.spacing.edgeNode':                           '120',
  'elk.spacing.edgeEdge':                           '80',
  'elk.padding':                                    '[top=200,left=200,bottom=200,right=200]',
  'elk.layered.nodePlacement.strategy':             'BRANDES_KOEPF',
  'elk.layered.crossingMinimization.strategy':      'LAYER_SWEEP',
  'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
  'elk.portConstraints':                            'FIXED_SIDE',
  'elk.layered.mergeEdges':                         'true',
}
```

- Values are FIXED — never scale based on node count
- `portConstraints`: `FIXED_SIDE` — do not change to `FIXED_ORDER`
- `mergeEdges`: `true` — do not change to `false`
- Only allowed override: `elk.direction = 'DOWN'` for `mvc` and `flow_diagram`

### Column alignment — PENDING REMOVAL

`lib/utils/columnAlignNodes.ts` must be deleted. Remove calls from:
- `stage6-layout.ts` line 233
- `elkLayoutService.ts` line 686

Do not re-introduce in any form.

### Templates

- Template nodes start at `{ x: 0, y: 0 }` — ELK handles layout on load
- ELK auto-layout runs when any template is loaded
- Each template file: `/data/templates/[name].ts`, exported from `index.ts`
- Template metadata required: `id`, `name`, `description`, `category`, `tags`, `icon`, `color`

---

## DIAGRAM GENERATION RULES

### Stage 0 — classify before generating

Keyword override runs BEFORE LLM classifier and always wins:

```ts
if (input.includes('mvc'))    → 'mvc'
if (input.includes('cicd'))   → 'cicd_pipeline'
if (input.includes('erd'))    → 'database_schema'
if (input.includes('monolith'))→ 'monolith'
// else → LLM classifier
```

Valid types: `system_architecture | flow_diagram | cicd_pipeline | data_flow |
database_schema | sequence_diagram | network_topology | monolith | mvc`

Each type has an allowed node set — pass it in the generation prompt.
If `diagramType === 'mvc'` and output has `Lambda/SQS/Kafka/API Gateway/Docker`
→ reject and retry. Max 2 retries.

### components.json

- Single source of truth for all node types
- Every entry needs: `id`, `label`, `category`, `color`, `icon`
- `icon` must be a valid Lucide icon name — verify before committing
- Every entry must appear in the sidebar
- Never create a node type in a template that doesn't exist here

---

## NODE & EDGE FACTORY

All node and edge objects must be created via `lib/factory.ts`:

```ts
// Node
createNode(typeId, label, position?, extraData?)

// Edge
createEdge(source, target, label?, extraData?)
```

Use this in: sidebar add, AI pipeline output, template load, Cmd+D duplicate,
`onConnect` handler. Never construct node/edge objects inline elsewhere.

---

## AUTH & SHARE

- `/canvas` has no auth protection — accessible to guests
- Auth: Supabase magic link OTP only — **never password fields**
- Guests get full canvas EXCEPT Share + Download (triggers `EmailCaptureModal`)
- Guest state saved to localStorage before auth redirect, restored after
- Auth callback: `/app/auth/callback/route.ts`
- Never store auth tokens or emails in localStorage

### Share

- Table: `shared_canvases`, URL: `/share/[uuid]`
- Viewer is read-only: `nodesDraggable={false} nodesConnectable={false}`
- Shows: app name, canvas name, "View only" badge, "Create your own →" CTA
- Share button always visible; disabled with tooltip when canvas has 0 nodes

### Export

- PNG only — SVG is permanently removed, never re-add
- `pixelRatio: 3` minimum
- `fitView({ padding: 0.1, duration: 0 })` before capturing
- Filter out minimap, controls, panels
- Options: Dark PNG, Light PNG, Transparent PNG

---

## STATE & STORAGE

```ts
// Port-isolated key — prevents cross-port state bleeding
const STORAGE_KEY = typeof window !== 'undefined'
  ? `archdraw-state-${process.env.NODE_ENV}-${window.location.port}`
  : 'archdraw-state';

// Bump version when node.data or edge shape changes
version: 2,
migrate: (old, version) => version < 2 ? undefined : old,
```

Sanitize nodes and edges on rehydration — any node missing `color`, `category`,
or `icon` gets rebuilt via `createNode()` factory.

---

## KEYBOARD SHORTCUTS

| Shortcut | Action |
|---|---|
| `Cmd+D` / `Ctrl+D` | Duplicate selected nodes (+40px offset) |

- Duplicate: `crypto.randomUUID()` id, original deselected, duplicate selected
- `e.preventDefault()` required on Cmd+D
- Never fire shortcuts when focused on input or textarea

---

## BEFORE EVERY TASK — CHECKLIST

```
[ ] Read GEMINI.md (this file)
[ ] Read ARCHDRAW_NON_NEGOTIABLES.md
[ ] List files I will change
[ ] Confirm no protected file is in that list
[ ] Check if feature existed before in git history
[ ] Import from lib/config.ts — no hardcoded values
[ ] Use lib/factory.ts — no inline node/edge construction
[ ] Run: grep -rn "console.log" on files I touched
[ ] State what I changed and why
```

---

## WHEN SOMETHING IS BROKEN

1. **Check git history first:**
   ```bash
   git log --oneline -- <broken-file>
   git show <last-working-commit>:<broken-file>
   ```
2. Diff working vs broken: `git diff <commit> HEAD -- <file>`
3. Restore working version: `git checkout <commit> -- <file>`
4. Do NOT rewrite from scratch unless git has no working version

---

## PENDING ACTIONS (incomplete in codebase)

- [x] Component Registry (`lib/componentRegistry.ts`) - Centralize `components.json` loading.
- [x] Storage Keys Centralization - Move all `localStorage` keys into `STORAGE_KEYS` object in `lib/config.ts`.
- [x] Clean Up Unused API Routes (`/api/diagram/export`, `/api/diagram/load`, etc.).
- [x] Logging Pipeline - Route all console.log/warn/error through `lib/logger.ts`.
- [x] Store Merge - Consolidate persistence logic between `store/storage.ts` and `store/diagramStore.ts`.
- [x] Action Refactoring - Move `useDiagramStore.setState` calls into named store actions.

---

> Last updated: May 2026
> Project: ArchDraw
> Maintained by: Abhishek Jamdade