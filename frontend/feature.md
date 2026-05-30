# ArchDraw — Non-Negotiable Behaviors & Features

> This document defines the core behaviors of ArchDraw that must NEVER be removed,
> overridden, or silently broken by any AI agent, refactor, or dependency update.
> Every item here was explicitly designed and verified. Treat this as a contract.

---

## How to use this file

Before making ANY change to edge routing, layout, node positioning, color logic,
or diagram generation — read this file first. If your change touches a protected
behavior, you must explicitly justify why and get confirmation before proceeding.

---

## 1. Dynamic Handle Selection

**File:** `lib/features/dynamicHandles.ts`
**Status:** 🔴 Protected — do not modify without explicit instruction

### What it does
When Node A connects to Node B, the edge handle side is chosen based on the
relative position of the two nodes at that moment:

| B is relative to A | A uses handle | B uses handle |
|--------------------|---------------|---------------|
| Above              | Top           | Bottom        |
| Below              | Bottom        | Top           |
| Right              | Right         | Left          |
| Left               | Left          | Right         |

The dominant axis (horizontal vs vertical) is determined by comparing
`Math.abs(dx)` vs `Math.abs(dy)` between node centers.

### Dynamic nature
This recalculates on EVERY node position change — drag, programmatic move,
ELK layout settle. It must NEVER be computed once at edge creation and stored.

### How it works (React Flow v11 — current version)
- Uses `useStore()` inside `SimpleFloatingEdge` to subscribe to live node state
- Reads from `node.positionAbsolute` directly — v11 API (NOT `node.internals.positionAbsolute`)
- Node dimensions from `node.width` / `node.height` — v11 API (NOT `node.measured`)
- Handle position computed via `getSimpleHandlePosition()` which applies `HANDLE_OFFSETS`
- `getHandleCoordinate()` is exported from the feature file but not in the active render path —
  do not delete it, but do not assume it is being called during edge rendering

> ⚠️ If upgrading to React Flow v12, update to `node.internals.positionAbsolute`
> and `node.measured?.width` / `node.measured?.height` across all edge files.

### What must NOT happen
- Do not hardcode `sourceHandle` / `targetHandle` IDs on edge objects
- Do not read node positions from `props.data`, `useState`, or `initialNodes`
- Do not compute handle position once in `onConnect` and freeze it
- Do not replace `useStore()` with `useNodes()` — `useNodes()` does not
  trigger re-renders on position change during drag

---

## 2. Simple Floating Edges

**File:** `components/edges/SimpleFloatingEdge.ts`
**Status:** 🔴 Protected — do not replace with standard fixed edges

### What it does
Edges dynamically attach to the closest available boundary point of a node
rather than being locked to a fixed named handle. Combined with Dynamic Handle
Selection (§1), edges always take the most geometrically direct path.

### Current implementation (actual)
- Renders a `<path>` element directly — does NOT use `<BaseEdge />`
- Does NOT use `getSimpleFloatingEdgePosition` — that function does not exist
- Path is drawn using `getSmoothStepPath` or equivalent with computed XY values
- All visual props (`markerEnd`, `markerStart`, `style`) must be read from
  edge props and applied directly to the `<path>` element

### Rules
- `edgeTypes` map must be defined OUTSIDE the component function — never inside
- `ConnectionMode.Loose` must be verified as set on `<ReactFlow />` — check this
- Do not switch rendering to `<BaseEdge />` without updating all prop forwarding
- Do not add `sourceHandle` or `targetHandle` keys to any edge object

---

## 3. Edge Marker Colors

**Status:** 🔴 Protected — both `style.stroke` AND `markerEnd.color` must always match

### Rule
When an edge has a color applied, it must be set in TWO places:

```ts
{
  style: { stroke: color, strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: color },
}
```

Setting only `style.stroke` changes the line but leaves the arrowhead grey.
Setting only `markerEnd.color` changes the arrow but leaves the line grey.
Both must always be set to the same value.

### Marker objects
Always use the object form for `markerEnd`:
```ts
markerEnd: { type: MarkerType.ArrowClosed, color: '#hex' }  // ✅ correct
markerEnd: 'url(#some-id)'                                   // ❌ wrong
```

---

## 4. Two-Color Overlap Detection System

**File:** `lib/edgeColors.ts`
**Status:** 🔴 Protected — do not revert to static or random multi-color assignment

### Color palette (exactly 2 colors, no exceptions)
```ts
const EDGE_COLORS = {
  default:     '#94a3b8',  // slate-400  — normal edge, no overlap
  nodeOverlap: '#000000',  // pure black — edge path passes through a node body
};
```

### Rules
- Exactly 2 colors. Do not add a third.
- `default` (slate) is used for all edges that do not pass through a node
- `nodeOverlap` (pure black) is used ONLY when an edge path passes through
  a node that is neither its source nor its target
- Edge-to-edge overlap does NOT change color — only node-over-edge overlap does
- Detection uses **path-based Cohen-Sutherland line-rect clipping** against
  actual smoothstep waypoints — NOT AABB bounding box of source/target nodes
- `coloredEdges` is **derived display state only** — never written back to
  the edges store via `setEdges`
- The `useEdgeColors` hook must use `useNodesInitialized()` guard before
  running detection — nodes must be measured first
- Dependencies: `[edges, nodes, getInternalNode]` — all three required

### What must NOT happen
- Do not add a third color for edge-edge overlap
- Do not revert to giving every edge a unique color from a large palette
- Do not use AABB overlap detection (causes false positives)
- Do not store computed colors in edge.data or initialEdges

---

## 5. ELK Layout — Fixed Spacing Constants

**Files:** `stage6-layout.ts`, `elkLayoutService.ts` (all instances in both files)
**Status:** 🔴 Protected — spacing values are fixed, not dynamic

### Fixed ELK options (apply to ALL diagrams regardless of node count)
```ts
const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',                                        // default
  'elk.spacing.nodeNode': '200',
  'elk.layered.spacing.nodeNodeBetweenLayers': '300',
  'elk.spacing.edgeNode': '120',
  'elk.spacing.edgeEdge': '80',
  'elk.padding': '[top=200, left=200, bottom=200, right=200]',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.compaction.postCompaction.strategy': 'EDGE_LENGTH',
  'elk.portConstraints': 'FIXED_SIDE',    // current: FIXED_SIDE (not FIXED_ORDER)
  'elk.layered.mergeEdges': 'true',       // current: true (edges merge at shared ports)
  // portPort spacing: removed from all files — do not re-add
};
```

> ⚠️ Note on portConstraints: the codebase currently uses `FIXED_SIDE` across all
> 7 option blocks. A previous iteration attempted `FIXED_ORDER` + `portPort: 24`
> but this was reverted. Do not change back to `FIXED_ORDER` without testing.

> ⚠️ Note on mergeEdges: currently `true` in all 6 files. Do not set to `false`
> without explicit instruction — it was reverted from `false` deliberately.

### The ONLY allowed override
Direction can change per diagram type. Nothing else:
```ts
if (diagramType === 'mvc' || diagramType === 'flow_diagram') {
  ELK_OPTIONS['elk.direction'] = 'DOWN';
}
```

### What must NOT happen
- Do not add if/else or ternary blocks that change spacing based on node count
- Do not reduce spacing for "large" diagrams — spacing is fixed at all sizes
- Do not change `portConstraints` or `mergeEdges` without explicit instruction

---

## 6. Column Alignment Post-Processing — PENDING REMOVAL

**File:** `lib/utils/columnAlignNodes.ts`
**Status:** ⚫ Marked for removal — but still active in codebase

This feature was decided to be removed but is still called in:
- `stage6-layout.ts` line 233 (`snapNodesToColumns`)
- `elkLayoutService.ts` line 686 (`snapNodesToColumns`)

### Action required
Remove both call sites and delete `columnAlignNodes.ts`.
ELK layout output must be used as-is without X-coordinate snapping.

```ts
// DELETE these lines from stage6-layout.ts and elkLayoutService.ts:
const alignedNodes = snapNodesToColumns(layoutedNodes, 60);
// and replace with:
const alignedNodes = layoutedNodes;
// then delete the import of snapNodesToColumns
```

### Do not re-introduce
Once removed, column alignment must not be added back in any form —
not as a post-layout step, not on drag stop, not as a toolbar button.

---

## 7. Diagram Type Classification (Stage 0)

**Status:** 🔴 Protected — must run before any diagram generation

### What it does
Classifies user input into a diagram type BEFORE the generation LLM call.
Prevents the model from defaulting to microservices for all inputs.

### Keyword override (runs before LLM classifier)
```ts
function getTypeOverride(userInput: string): string | null {
  const input = userInput.toLowerCase();
  if (input.includes('mvc'))                          return 'mvc';
  if (input.includes('model view'))                   return 'mvc';
  if (input.includes('cicd') || input.includes('ci/cd')) return 'cicd_pipeline';
  if (input.includes('erd') || input.includes('schema')) return 'database_schema';
  if (input.includes('monolith'))                     return 'monolith';
  return null; // fall through to LLM classifier
}
```

Keyword override always wins over LLM classifier output. This is intentional.

### Valid diagram types
```
system_architecture | flow_diagram | cicd_pipeline | data_flow |
database_schema | sequence_diagram | network_topology | monolith | mvc
```

### Node type restriction
Each diagram type has an allowed node set. The generation prompt must include:
`"Only use these node types: ${ALLOWED_NODES[diagramType]}"`

This prevents Lambda/SQS/queue nodes appearing in login flows or MVC diagrams.

### Output validation
After generation, if `diagramType === 'mvc'` and output contains nodes with
tech: `Lambda, SQS, Kafka, API Gateway, Docker` — reject and retry.
Maximum 2 retries.

---

## 8. Self-Loop Edges — ALLOWED (pending fix)

**Status:** 🟢 Permitted — but currently being incorrectly filtered in codebase

Self-loop edges (where `source === target`) are intentionally allowed in ArchDraw.
They represent valid architectural relationships such as a service calling itself,
a retry mechanism, or a recursive process.

### Action required
Remove the self-loop filter from both locations:

```ts
// DELETE from stage6-layout.ts line 107:
edges.filter(e => e.source !== e.target)

// DELETE from elkLayoutService.ts line 564:
edges.filter(e => e.source !== e.target)
```

Replace both with the unfiltered edges array.

### Rule going forward
Self-loop edges must pass through to ELK, React Flow state, and rendering
without being stripped at any stage of the pipeline. Do not add this filter
back anywhere — not in layout, not in onConnect, not in the AI pipeline.

---

## 9. Edge Label Readability

**Status:** 🟡 Required — do not remove label backgrounds

Edge labels must always render with a background so they remain readable
when overlapping edges or nodes:

```tsx
<EdgeLabelRenderer>
  <div style={{
    background: 'rgba(255,255,255,0.85)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    letterSpacing: '0.05em',
  }}>
    {label}
  </div>
</EdgeLabelRenderer>
```

`edgeLabels.inline` must be `false` in ELK options.

---

## 10. CSS Override Protection for Edge Colors

**Status:** 🔴 Protected — do not add global stroke rules for edges

No global CSS rule may set `stroke` on `.react-flow__edge-path` or
`.react-flow__edge`. Edge colors are controlled entirely via inline
`style` props on edge objects. Any global CSS stroke rule will override
inline styles on the canvas while the export captures raw SVG, causing
the "colors visible in export but not on canvas" bug.

---

## Quick Reference — What to check before editing

| Area you want to change       | Files to check first                          |
|-------------------------------|-----------------------------------------------|
| Edge handle positions         | `lib/features/dynamicHandles.ts` (§1)         |
| Edge routing / path shape     | `SimpleFloatingEdge.ts` (§2)                  |
| Edge colors / markers         | `lib/edgeColors.ts` (§3, §4)                  |
| ELK spacing or layout config  | `stage6-layout.ts`, `elkLayoutService.ts` (§5)|
| Column alignment              | REMOVED — do not re-add (§6)                  |
| Diagram generation prompts    | Stage 0 classifier + NODE_GUIDELINES (§7)     |
| Self-loop edges               | Allowed — do not filter them (§8)             |
| Edge label rendering          | EdgeLabelRenderer styles (§9)                 |
| Global CSS / theme files      | No stroke overrides on edge paths (§10)       |

---

> Last updated: May 2026 — synced with actual codebase audit
> Maintained by: Abhishek Jamdade
> Project: ArchDraw
>
> Sections marked "Action required" reflect decisions made but not yet
> implemented in code. Complete those before the next session.
