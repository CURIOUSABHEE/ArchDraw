# ArchFlow Diagram Generation Rules
# Version 1.0 — Non-Negotiable Constraints

You are working on the ArchFlow diagram generation pipeline.
These rules are absolute. Read this file completely before
touching any pipeline file. Every rule exists because something
broke without it.

---

## 0. BEFORE YOU WRITE ANYTHING (Absolute)

Read these files first. Every time. No exceptions.

/data/components.json
  → Source of truth for all component IDs, labels, colors, icons
/api/generate-diagram-cognitive/types.ts
  → All TypeScript interfaces — use these, never invent new ones
/api/generate-diagram-cognitive/componentLibrary.ts
  → Component resolution logic
/lib/layoutUtils.ts
  → ELK layout API — read before calling it

If a component does not exist in components.json:
ADD it to components.json FIRST with the correct schema.
Then reference it. Never reference a component that does not exist.

---

## 1. COMPONENT FIDELITY (Absolute)

### 1A — components.json is the single source of truth

Every node in every generated diagram must correspond to
a real entry in components.json.

Three-way consistency check:
1. componentId used in pipeline === id in components.json
2. label rendered in diagram === label in components.json
3. color applied to node === color in components.json

If any of these three do not match: fix all three.

### 1B — Component schema for new entries

When adding a new component to components.json follow this schema:
{
  "id": "snake_case_id",
  "label": "Human Readable Label",
  "category": "one of the valid categories below",
  "color": "#hexcolor matching category",
  "icon": "ValidLucideIconName",
  "description": "One clear sentence explaining what this does."
}

Valid categories and their colors:
- "Client & Entry":      #6366f1 (indigo)
- "Compute":             #3b82f6 (blue)
- "Data Storage":        #334155 (slate)
- "Caching":             #ef4444 (red)
- "Messaging & Events":  #f59e0b (amber)
- "Auth & Security":     #8b5cf6 (purple)
- "Observability":       #06b6d4 (cyan)
- "AI / ML":             #ec4899 (pink)
- "External Services":   #10b981 (green)
- "DevOps / Infra":      #64748b (gray)
- "Real-time":           #f59e0b (amber)

Icon must be a valid Lucide React icon name.
Verify it exists before using it.
Never add duplicate component IDs.

### 1C — Banned component references

These IDs no longer exist and must never be used:
- "client_web_mobile" → use "client_web" or "client_mobile"
- "microservice" (as a generic catch-all) → use specific service ID
- Any invented ID not in components.json

---

## 2. PHASE RULES (Absolute)

### PHASE 0: Intent Extraction

Required output fields — all must be present:
- industry: string
- scale: "startup" | "growth" | "hyperscale"
- constraints: string[]
- latencyClass: "interactive" | "batch" | "realtime"
- consistencyRequirement: "eventual" | "strong"
- primaryActor: string
- primaryGoal: string

If user prompt is under 10 words:
Return an error asking for more detail.
Never proceed with an ambiguous intent.
Never assume. Never guess.

The intent contract is immutable after Phase 0.
No subsequent phase may modify it.

### PHASE 1: Flow Definition

Required constraints:
- Flow must have exactly 6 to 9 steps. Not fewer. Not more.
- Each step has exactly ONE responsible component
- Every step.componentId must exist in components.json
- Every step declares sync: true | false
- Step 1 must always be a Client & Entry component
- Steps are strictly sequential — no branching in the flow

Reject and regenerate if:
- Any step references a componentId not in components.json
- The flow has fewer than 6 or more than 9 steps
- Step 1 is not a client component
- Two steps share the same componentId

The flow defines the spine of the diagram.
Everything else is derived from the flow.

### PHASE 2: Component Resolution

Required constraints:
- Every componentId in the manifest must exist in components.json
- No database may be owned by more than one service
- Maximum 20 total components across the entire manifest
- If component count exceeds 20: split into bounded contexts

Component classification rules:
- "spine": appears in the primary flow
- "database": owned by exactly one spine service
- "cache": supports exactly one spine service
- "async": receives events, never called synchronously from spine
- "external": third-party services, only receive calls
- "observability": logger, metrics, tracing
- "auth": authentication and security services

When to add supporting components:
- Auth required by intent → add auth_service
- Async events required → add kafka_streaming or message_queue
- Observability required → add logger + metrics_collector
- Payment required → add payment_gateway (external)
- Real-time tracking → add location_service + kafka_streaming

### PHASE 3: Mermaid Generation

Required output format:
```mermaid
flowchart LR
  [subgraphs]
  [primary flow edges]
  [database edges]
  [async edges]
  [external edges]
  [observability edges]
  [classDef definitions]
  [class assignments]
```

Subgraph rules:
- Create one subgraph per classification that has nodes
- Never create an empty subgraph
- Node ids inside subgraphs must match components.json ids exactly

Node shape rules by classification:
- spine services:      componentId["Label"]
- databases:           componentId[("Label")]
- external services:   componentId[["Label"]]
- async/queue:         componentId(["Label"])
- auth services:       componentId{"Label"}

Edge style rules:
- Spine edges (sync):     --> with label
- Database edges:         <--> with label
- Async edges:            -.-> with label
- External call edges:    --> with label
- Observability edges:    -.-> with label

EVERY edge must have a label.
Label format: -->|"verb phrase"| (2-5 words)
Example: api_gateway -->|"routes request"| auth_service
NEVER: api_gateway --> auth_service (no label = invalid)

Node labels must match components.json exactly.
Never invent custom labels.

### PHASE 4: Validation

Validation is binary. Pass or fail. No scoring.
If any check fails: identify which phase caused it,
re-run only that phase with the violation as context.
Maximum 3 retries per phase.

Hard constraints (all must pass):

FLOW INTEGRITY:
□ Flow has 6-9 steps
□ Every step.componentId exists in components.json
□ Step 1 is a Client & Entry component
□ No componentId appears in two steps

COMPONENT INTEGRITY:
□ Total component count is 6-20
□ Every node id exists in components.json
□ Every node label matches components.json exactly
□ No database has two owning services
□ No component appears in two subgraphs

EDGE INTEGRITY:
□ Every edge has a label
□ No edge label exceeds 5 words
□ No edge connects two database nodes directly
□ No edge goes FROM external service TO spine service
□ Spine edges use --> (solid)
□ Database edges use <--> (bidirectional)
□ Async edges use -.-> (dashed)

STRUCTURAL INTEGRITY:
□ No orphan nodes (every node has at least one edge)
□ No circular dependencies among spine services
□ Every subgraph has at least one node
□ Mermaid syntax is valid (parseable)

### PHASE 5: Mermaid to React Flow Conversion

CRITICAL RULES — violation causes scattered nodes and zig-zag edges:

Rule 1: NEVER calculate node positions manually.
Set ALL node positions to { x: 0, y: 0 }.
ELK layout computes real positions.

Rule 2: NEVER call applyGridLayout() or any custom
position calculation function.
Grid layout ignores topology and produces scattered nodes.

Rule 3: ALWAYS call getLayoutedElements from layoutUtils.ts
after conversion and BEFORE returning nodes to the caller.

Rule 4: ALWAYS use type: 'smoothstep' on ALL edges.
Never use type: 'default' or type: 'straight'.
smoothstep produces clean bezier curves.
default and straight produce zig-zag diagonal lines.

Rule 5: ALWAYS await getLayoutedElements if it is async.
Check the layoutUtils.ts signature before calling.

Rule 6: ALWAYS use layoutedNodes and layoutedEdges
in the API response. NEVER use the original 0,0 nodes.

Edge format requirements:
{
  id: "unique-edge-id",
  source: "componentId",
  target: "componentId",
  type: "smoothstep",              ← always smoothstep
  animated: true,                  ← true for spine, false for others
  label: "verb phrase from mermaid",
  style: {
    stroke: "#94a3b8",
    strokeWidth: 1.5,
    strokeDasharray: "6 3"         ← only for async/dashed edges
  },
  markerEnd: {
    type: "ArrowClosed",
    color: "#94a3b8"
  }
}

Node format requirements:
{
  id: "componentId",
  type: "default",
  position: { x: 0, y: 0 },       ← always 0,0 before ELK
  data: {
    label: "exact label from components.json",
    componentId: "id from components.json",
    category: "category from components.json",
    color: "color from components.json",
    icon: "icon from components.json",
    description: "description from components.json",
    classification: "spine|database|cache|async|external|auth|observability"
  }
}

---

## 3. ELK LAYOUT RULES (Absolute)

ELK is the only acceptable layout algorithm.
No other layout function may be used.

Required ELK options for architecture diagrams:
{
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '200',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP'
}

ELK must be called in the orchestrator AFTER mermaidToReactFlow()
and BEFORE the API response is returned.

Always wrap ELK call in try/catch.
If ELK fails: log the error and fall back to a simple
left-to-right grid layout (not scattered random positions).

Verification after ELK runs:
- No node should have position.x === 0 AND position.y === 0
- If any node is at 0,0 → ELK did not run → fix before returning

---

## 4. ORCHESTRATOR RULES (Absolute)

Phase execution order is strict and non-negotiable:
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → ELK → Output

Rules:
- Each phase must complete before the next begins
- Error from any phase must be caught and logged
- On phase failure: re-run that phase with failure context (max 3 times)
- If phase fails 3 times: return error to user with specific message
- The full intent contract from Phase 0 must be passed to every phase
- The API response must include: intent, mermaid, nodes, edges, validation
- Never return nodes at position 0,0
- Never return edges without labels
- Never return a diagram that failed Phase 4 validation

Timing requirements:
- Log execution time for each phase
- Total pipeline timeout: 30 seconds
- If any phase exceeds 10 seconds: log a warning

---

## 5. MERMAID OUTPUT RULES (Absolute)

The generated Mermaid string must:
- Start with: flowchart LR
- Have at least one subgraph
- Have at least 6 nodes
- Have at least 5 edges
- Have ALL edges labeled
- Be valid Mermaid syntax (test at mermaid.live)
- Include classDef definitions for each classification
- Include class assignments for every node

The Mermaid string is returned to the user as a code block.
It must be independently renderable — a user should be able
to copy it into mermaid.live and see a correct diagram.

---

## 6. API RESPONSE CONTRACT (Absolute)

The /api/generate-diagram-cognitive endpoint must return:

{
  "intent": {
    "industry": string,
    "scale": string,
    "constraints": string[],
    "primaryActor": string,
    "primaryGoal": string
  },
  "flow": FlowDefinition[],        ← the 6-9 step spine
  "manifest": ComponentManifest,   ← classified components
  "mermaid": string,               ← valid mermaid code block
  "nodes": SystemNode[],           ← positions from ELK (not 0,0)
  "edges": SystemEdge[],           ← all labeled, smoothstep type
  "validation": {
    "passed": boolean,
    "errors": string[],
    "warnings": string[]
  }
}

If validation.passed is false:
Return the response with passed: false AND the errors array.
Never return a 500 error for validation failures.
Return 200 with the validation failure details so the
client can display the error to the user.

---

## 7. WHAT NEVER TO DO (Hard Stops)

These are instant failures. Stop immediately if you are
about to do any of these:

COMPONENT VIOLATIONS:
- Reference a componentId not in components.json
- Use a label that differs from components.json
- Use the banned ID "client_web_mobile"
- Use generic "microservice" when a specific component exists
- Add duplicate IDs to components.json

LAYOUT VIOLATIONS:
- Call applyGridLayout() or any manual position calculation
- Return nodes with position: { x: 0, y: 0 } in the final response
- Use edge type: 'default' or type: 'straight'
- Calculate edge paths or waypoints manually
- Render before ELK layout completes

MERMAID VIOLATIONS:
- Generate an edge without a label
- Generate a subgraph with zero nodes
- Use a node label that differs from components.json
- Generate invalid Mermaid syntax
- Mix edge styles incorrectly (sync as dashed, async as solid)

PIPELINE VIOLATIONS:
- Skip any phase
- Run phases out of order
- Proceed with an ambiguous intent from Phase 0
- Return more than 20 nodes without splitting by context
- Share a database between two services

NEVER fix what should not have been generated.
Fix the upstream phase that generated the problem.

---

## 8. QUALITY CONTRACT (Verify before returning)

Before returning any diagram output, verify all of these:

□ Can the primary request be traced from client to
  final service in 8 hops or fewer?
□ Does every node have a classification?
□ Does every database have exactly one owning service?
□ Are all async flows visually separate from the spine?
□ Are all node positions non-zero (ELK ran successfully)?
□ Do all edges use type: smoothstep?
□ Does every edge have a label?
□ Is total node count between 6 and 20?
□ Does the Mermaid string render at mermaid.live?
□ Are all componentIds valid entries in components.json?

If any answer is NO: fix the specific phase responsible
and re-verify. Do not return until all answers are YES.

---

## 9. TESTING STANDARD

After any change to the pipeline run this regression test:

Input: "Design a food delivery app like Uber Eats"

Expected output:
- 12-18 nodes
- 15-22 edges
- All node positions have real x,y values (not 0,0)
- All edges have labels
- All edges use type: smoothstep
- No orphan nodes
- Mermaid renders at mermaid.live without errors
- validation.passed === true

Log this before returning:
  nodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }))

If any node shows x:0, y:0 → ELK did not run.
If all nodes show real coordinates → ELK ran correctly.

---

## 10. FILE RESPONSIBILITIES

Each file has one job. Never expand a file's responsibility
beyond what is listed here.

/phase0-intent.ts
  → Extract and enhance intent from user prompt
  → Produce immutable intent contract
  → Nothing else

/phase1-flow.ts
  → Define the 6-9 step primary flow
  → Validate componentIds against components.json
  → Nothing else

/phase2-services.ts
  → Resolve all components from flow + intent
  → Classify each component
  → Enforce one-database-per-service rule
  → Nothing else

/phase3-mermaid.ts
  → Generate valid Mermaid flowchart LR string
  → Apply correct edge styles per classification
  → Include classDef and class assignments
  → Nothing else

/phase4-validation.ts
  → Run binary validation checks
  → Return passed: boolean + errors: string[]
  → Never fix anything — only validate and report
  → Nothing else

/mermaidToReactFlow.ts
  → Parse Mermaid string into nodes and edges
  → Map component data from components.json
  → Set all positions to { x: 0, y: 0 }
  → Return raw nodes and edges WITHOUT layout
  → NEVER call any layout function
  → Nothing else

/orchestrator.ts
  → Execute phases in order
  → Call getLayoutedElements from layoutUtils.ts
  → Return the final API response
  → Handle errors and retries per phase
  → Nothing else

/componentLibrary.ts
  → Export the components array from components.json
  → Provide lookup functions by id and category
  → Validate component schema on startup
  → Nothing else