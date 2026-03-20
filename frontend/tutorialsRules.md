# ArchFlow Tutorial System — Non-Negotiable Rules
# Version 2.0 — Updated after Netflix static conversion

You are working on the ArchFlow tutorial system.
These rules are absolute. Follow every single one
without exception before writing any tutorial code,
data, or content. Violation of any rule causes
bugs that directly harm the user experience.

Read this file completely before touching any tutorial.
Do not skim. Every rule exists because something broke
without it.

---

## 0. BEFORE YOU WRITE ANYTHING (Absolute)

Read these files first. Every time. No exceptions.

/data/components.json
  → Source of truth for all component IDs and labels
/data/tutorials/netflix-architecture.ts
  → Reference implementation for 3-level structure
/data/tutorials/chatgpt-architecture.ts
  → Reference implementation for static tutorial
/data/tutorialCache.json
  → Cache format reference
/components/tutorial/GuidePanel.tsx
  → Understand phase machine before writing step data
/lib/tutorial/types.ts
  → All TypeScript types — use these, never invent new ones
/lib/tutorial/factories.ts
  → All factory functions — use these to build steps
/lib/tutorial/validators.ts
  → Run this mentally before submitting any tutorial
/lib/tutorial/defaults.ts
  → Shared builders for action, celebration, opening messages

Not reading these files before writing is the single
most common cause of bugs in this codebase.

---

## 1. NO LIVE AI TUTORIALS (Absolute)

isLive is false for ALL tutorials without exception.

Netflix was previously isLive: true. It is now static.
No tutorial currently uses the Groq API for content.
The API route exists for future use but is currently
disabled for all tutorials.

LIVE_TUTORIALS array in the API route is empty: []

Never set isLive: true on any tutorial.
Never add any tutorial ID to LIVE_TUTORIALS.
If you need live AI for a new tutorial, discuss first.

The tutorialCache.json and pre-written step content
are the ONLY sources of tutorial messages.

---

## 2. ALWAYS USE FACTORY FUNCTIONS (Absolute)

Never write raw tutorial objects.
Always use the factory functions from /lib/tutorial/factories.ts

Required imports for every tutorial file:
```typescript
import {
  step,
  level,
  tutorial,
  component,
  edge,
  msg
} from '@/lib/tutorial/factories'

import {
  buildAction,
  buildCelebration,
  buildOpeningL1,
  buildOpeningL2,
  buildOpeningL3,
  buildFirstStepAction
} from '@/lib/tutorial/defaults'
```

Every step uses step()
Every level uses level()
Every tutorial uses tutorial()
Every component ref uses component()
Every edge requirement uses edge()
Every message uses msg()

Never write { role: 'ai', content: '...' } directly.
Use msg('...') instead.

Never write { id: 'cdn', label: 'CDN', searchHint: 'CDN' } directly.
Use component('cdn', 'CDN') instead.

The factory functions enforce the schema.
Raw objects bypass enforcement and cause bugs.

---

## 3. TUTORIAL DATA STRUCTURE (Absolute)

Every tutorial file exports exactly one Tutorial object
built with the tutorial() factory function.

Required top-level fields:
```typescript
tutorial({
  id: string,           // kebab-case, ends with -architecture
  title: string,        // "How to Design X Architecture"
  description: string,  // 2 sentences max
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
  category: string,     // single category label
  isLive: false,        // ALWAYS false — see Rule 1
  icon: string,         // valid Lucide icon name
  color: string,        // hex color
  tags: string[],       // 3-5 short tags
  estimatedTime: string,// total time across all levels
  levels: [level1, level2, level3]  // exactly 3 levels
})
```

No flat steps array at the top level.
No steps outside of levels.
Exactly 3 levels per tutorial.
No more, no less.

---

## 4. STEP STRUCTURE (Absolute)

Every step is built with the step() factory.
Every field is required. No field may be empty,
null, undefined, or a placeholder string.
```typescript
step({
  id: number,                    // sequential per level, starts at 1
  title: string,                 // max 6 words
  explanation: string,           // 2-3 sentences
  action: string,                // use buildAction() or buildFirstStepAction()
  why: string,                   // 1-2 sentences
  component: ComponentRef,       // use component() factory
  openingMessage: string,        // use buildOpeningL1/2/3()
  celebrationMessage: string,    // use buildCelebration()
  messages: TutorialMessage[],   // use msg(), exactly 2-3 items
  requiredNodes: string[],       // IDs from components.json
  requiredEdges: EdgeRequirement[], // use edge(), empty ONLY for step 1
  successMessage?: string,       // optional, has default
  errorMessage?: string          // optional, has default
})
```

stepCount in level metadata is computed automatically
by the level() factory. Never set it manually.

---

## 5. COMPONENT CONSISTENCY (Absolute)

### 5A — components.json is the single source of truth

Before writing any step, look up the component in
components.json. Copy the id and label exactly.

Use component(id, label) with values from components.json.
Never invent component IDs.
Never approximate component labels.

### 5B — Three-way consistency enforced by factories

The component() factory ensures:
searchHint defaults to label if not specified.

This means:
action search term === component.searchHint === component.label
in components.json

They are always consistent when using the factory.
If you override searchHint manually, it must still
match the label in components.json exactly.

### 5C — requiredNodes must use valid IDs

Every string in requiredNodes must be a component ID
that exists in components.json.
The validator in validators.ts checks this.
Run the validator mentally before finishing any tutorial.

### 5D — Missing components must be added first

If a tutorial references a component that does not
exist in components.json:
ADD it to components.json FIRST.
Then reference it in the tutorial.
Never reference a component that does not exist.

Category and color assignment:
- Client & Entry: #6366f1
- Compute: #3b82f6
- Data Storage: #334155
- Caching: #ef4444
- Messaging & Events: #f59e0b
- Auth & Security: #8b5cf6
- Observability: #06b6d4
- AI / ML: #ec4899
- External Services: #10b981
- DevOps / Infra: #64748b

Icon must be a valid Lucide React icon name.
Verify it exists before using it.
Description: one clear sentence.
Never add duplicate components.

### 5E — Split client components

The old "Client (Web / Mobile)" component no longer exists.
It has been split into two components:

client_web  → label: "Web"  → icon: Monitor
client_mobile → label: "Mobile" → icon: Smartphone

When a tutorial's first step adds a client:
- Web-primary products: use client_web ("Web")
- Mobile-primary products: use client_mobile ("Mobile")
- Both equally: use client_web for step 1,
  optionally add client_mobile in a later step

requiredEdges from/to must use "Web" or "Mobile"
not "Client" — "Client" will not fuzzy match either.

---

## 6. NO DUPLICATE COMPONENTS ACROSS LEVELS (Absolute)

Track every component introduced across ALL levels
of a tutorial. A component may appear in only ONE level.

The canonical level ownership:
Level 1 owns: entry points + core services + primary database
Level 2 owns: auth + caching + event streaming + observability
Level 3 owns: ML/AI + security + advanced observability + config

If a Level 2 step would add a component from Level 1:
STOP. Convert it to a CONNECTION step instead.
"Connect [Level1Component] → [NewLevel2Component]"

If a Level 3 step would add a component from Levels 1 or 2:
STOP. Convert it to a CONNECTION or TEACHING step.

Canvas is NEVER cleared between levels.
Level 2 starts with all Level 1 nodes present.
Level 3 starts with all Level 1 + Level 2 nodes present.

Before finalizing: list all components per level.
Verify zero overlap.

---

## 7. ACTION FIELD FORMAT (Absolute)

Use buildAction() for all steps except step 1.
Use buildFirstStepAction() for step 1.

buildAction() produces this exact format:
"Press ⌘K and search for '[label]' and add it to
the canvas. Then connect [from] → [to] by hovering
over [from] and dragging from the handle on its edge
to [to]. This connection represents [meaning]."

buildFirstStepAction() produces:
"Press ⌘K and search for '[label]' and add it to the canvas."

Never write action fields manually.
If buildAction() does not fit, fix the factory function.

---

## 8. REQUIRED EDGES (Absolute)

### 8A — Every step from step 2 must have requiredEdges

step 1: requiredEdges = [] (only acceptable empty case)
step 2+: requiredEdges must have at least one edge()

No exceptions. A floating node with no connection
teaches nothing about system architecture.

### 8B — Use the edge() factory

edge('Web', 'CDN') not { from: 'Web', to: 'CDN' }

### 8C — from/to values must fuzzy match canvas labels

The edge detection uses fuzzy matching.
Use values that will reliably match the actual
rendered node labels on canvas.

Canonical from/to values for common components:
- client_web renders as "Web" → use "Web"
- client_mobile renders as "Mobile" → use "Mobile"
- api_gateway renders as "API Gateway" → use "API"
- load_balancer renders as "Load Balancer" → use "Load"
- auth_service renders as "Auth Service (JWT)" → use "Auth"
- kafka renders as "Kafka / Streaming" → use "Kafka"
- nosql_database renders as "NoSQL Database" → use "NoSQL"
- sql_database renders as "SQL Database" → use "SQL"
- in_memory_cache renders as "In-Memory Cache" → use "Cache"
- object_storage renders as "Object Storage (S3)" → use "Object"

Mental test before writing:
Does the actual canvas label CONTAIN the from/to value?
"API Gateway" contains "API" → YES ✓
"API Gateway" contains "Client" → NO ✗

### 8D — Edge direction must be architecturally correct

Traffic flows left to right in the diagram.
Requests flow FROM entry points TOWARD storage.

Client → API Gateway ✓
API Gateway → Client ✗

Load Balancer → Service ✓
Service → Load Balancer ✗

Service → Database ✓
Database → Service ✗

### 8E — Reverse connection detection

The GuidePanel detects reverse connections and shows
a hint. Your requiredEdges direction must match the
intended correct direction, not the reverse.

---

## 9. OPENING MESSAGE FORMAT (Absolute)

Always use buildOpeningL1(), buildOpeningL2(), or
buildOpeningL3() from defaults.ts.

These enforce:
- Maximum 3 sentences
- Company name mentioned
- Component name mentioned
- Ends with ⌘K search instruction
- Depth appropriate to level

Level 1: simple analogy, beginner vocabulary
Level 2: production consequence, real numbers
Level 3: architectural pattern name, trade-off insight

Never write an openingMessage over 3 sentences.
Never skip the ⌘K instruction at the end.
Never mention the connection in openingMessage —
connection instruction belongs in action field only.

---

## 10. CELEBRATION MESSAGE FORMAT (Absolute)

Always use buildCelebration() from defaults.ts.

This enforces the format:
"[Component] added and connected to [PreviousNode].
[Real fact with specific number about this company].
Next we add [hint at next component]."

Real facts must be accurate and documented.
Never invent numbers.
The number must be specific to the actual company.

Examples of good real facts:
✓ "Netflix has 15,000+ CDN servers embedded inside
  ISPs worldwide, serving 94% of traffic from edge."
✓ "Stripe processes payment authorization in under
  100ms including fraud scoring across 1000+ signals."
✗ "This is very important at scale." (no number, vague)
✗ "Netflix uses this a lot." (not specific)

---

## 11. MESSAGES ARRAY FORMAT (Absolute)

Always use msg() for each message.
Exactly 2-3 messages per step. Never 1, never 4+.

Message 1: Concept explanation with company-specific analogy
Message 2: Instruction to add using ⌘K and connect
Message 3: Optional — scale fact specific to the company

Each message: maximum 3 sentences.
Messages must be distinct — no content repetition.
Messages must not repeat the openingMessage content.
Messages must not repeat the celebrationMessage content.

---

## 12. LEVEL CONTEXT MESSAGES (Absolute)

Every level must have a contextMessage field.
This is shown when the user starts a new level.

Level 1 context format:
"We're building the foundation — the minimum viable
[company] that actually works. [X] components,
[Y] connections. Think of this as the MVP."

Level 2 context format:
"Your foundation works. Now make it production-ready.
Real [company] runs [list 3 key additions].
We're adding [X] more components to your existing diagram."

Level 3 context format:
"You have what most engineers call good architecture.
Level 3 adds [3 advanced concerns].
These separate good architectures from great ones."

Also add to tutorialCache.json:
{tutorialId}:level:1:context
{tutorialId}:level:2:context
{tutorialId}:level:3:context

---

## 13. LEVEL STEP COUNTS (Absolute)

Level 1: minimum 6 steps, maximum 8 steps
Level 2: minimum 7 steps, maximum 10 steps
Level 3: minimum 8 steps, maximum 11 steps

stepCount is computed by the level() factory.
You never set it manually.
If your steps array has the wrong count, fix the steps.

---

## 14. TEACHING DEPTH PER LEVEL (Absolute)

Level 1 — Beginner:
- What the component does in plain English
- Why the system cannot work without it
- Simple real-world analogy
- No jargon without explanation
- Understandable by someone who has never designed a system

Level 2 — Production:
- Why production specifically needs this (not just "nice to have")
- What breaks at scale without it (specific failure mode)
- Real numbers from the actual company
- One pattern name is acceptable with brief explanation

Level 3 — Expert:
- Advanced architectural pattern by name
- The trade-off made at this decision point
- How this component interacts with 3+ other components
- What a senior engineer specifically thinks about
- Deep metrics: latency targets, throughput, scale numbers
- Interesting to someone who already knows the basics

If a Level 1 message mentions CAP theorem: too advanced.
If a Level 3 message says only "distributes traffic": too shallow.

---

## 15. TUTORIAL CACHE REQUIREMENTS (Absolute)

After writing or modifying any tutorial, add or verify
these entries in tutorialCache.json:

Required for every tutorial:
{tutorialId}:level:1:context
{tutorialId}:level:2:context
{tutorialId}:level:3:context

Required for steps 1-3 of every tutorial:
{tutorialId}:{step}:intro:0
{tutorialId}:{step}:teaching:0
{tutorialId}:{step}:teaching:1
{tutorialId}:{step}:action:0
{tutorialId}:{step}:celebration:0
{tutorialId}:{step}:wrong_component:0

Required for steps 4+ of every tutorial:
{tutorialId}:{step}:action:0
{tutorialId}:{step}:celebration:0

Cache content must match the tutorial data content.
If tutorial data changes, update cache entries.
Stale cache entries cause inconsistent user experience.

---

## 16. VALIDATION MESSAGES (Absolute)

successMessage default (auto-generated by factory):
"[Component label] added and connected correctly."

errorMessage default (auto-generated by factory):
"Add [Component label] using ⌘K and connect it as instructed."

Override only when the default is insufficient.
When overriding, follow this format:

successMessage:
"[Component] added and connected to [Node]."

errorMessage:
"Add [ComponentLabel] using ⌘K and connect it FROM
[PreviousNode] TO [NewNode]. The arrow must point
FROM [PreviousNode] TO [NewNode]."

Never vague messages like "Something went wrong."
Always tell the user exactly what to do.

---

## 17. COMPONENT NAMING FOR MICROSERVICES (Absolute)

When a step adds a microservice with a specific role:

Use the base microservice component from components.json.
Use component('microservice', 'Microservice') for the ref.
Set a custom label in the step title and explanation.

Example:
```typescript
step({
  title: 'Add Chat Service',
  component: component('microservice', 'Microservice'),
  // searchHint is 'Microservice' — what user searches
  explanation: 'The Chat Service is a microservice that...',
  // ...
})
```

This prevents referencing non-existent IDs like
'chat_service' or 'feed_service' which are not in
components.json. The base 'microservice' component
always exists.

---

## 18. PHASE MACHINE COMPATIBILITY (Absolute)

The GuidePanel phase machine runs:
context → intro → teaching → action → connecting → celebration

Your tutorial data must support every phase:

context: uses level.contextMessage
intro: uses step.openingMessage (asks if user knows component)
teaching: uses step.messages[0] (explanation with analogy)
action: uses step.action (⌘K instruction)
connecting: uses step.requiredEdges (connection instruction)
celebration: uses step.celebrationMessage

If any of these fields is empty the phase machine
hits a dead end and the user gets stuck.

All fields populated = no dead ends.
Any empty field = guaranteed dead end.

---

## 19. QUALITY CHECKLIST (Run before finalizing)

Run this checklist mentally for every tutorial.
Every item must be checked. No skipping.

### Factory usage:
□ All steps use step() factory
□ All levels use level() factory
□ Tutorial uses tutorial() factory
□ All components use component() factory
□ All edges use edge() factory
□ All messages use msg() factory
□ buildAction() used for steps 2+
□ buildFirstStepAction() used for step 1
□ buildOpeningL1/2/3() used for openingMessages
□ buildCelebration() used for celebrationMessages

### Component checks:
□ Every requiredNodes ID exists in components.json
□ Every component().label matches components.json exactly
□ No component appears in more than one level
□ client_web/client_mobile used instead of old client

### Connection checks:
□ Every step from step 2 has requiredEdges
□ All edge() from/to values will fuzzy match canvas labels
□ Edge directions are architecturally correct (left to right)
□ Level 2 adds zero Level 1 components
□ Level 3 adds zero Level 1 or Level 2 components

### Content checks:
□ Every openingMessage ends with ⌘K instruction
□ Every celebrationMessage has real fact with number
□ Every action uses buildAction() with all 3 elements
□ Every step has exactly 2-3 messages
□ Level 1 language is beginner-friendly
□ Level 3 content interests a senior engineer
□ No invented numbers — all facts are documented

### Cache checks:
□ Level context messages in tutorialCache.json
□ Steps 1-3 have all 6 cache entries per step
□ Steps 4+ have action and celebration cache entries
□ Cache content matches tutorial data

### Configuration:
□ isLive: false (always)
□ stepCount computed by level() factory (never manual)
□ Tutorial ID ends with -architecture
□ Exactly 3 levels

If any item fails: fix before finishing.
If you skip this checklist: you will introduce bugs.

---

## 20. WHAT NEVER TO DO (Hard stops)

These are instant failures. Stop immediately if you
are about to do any of these:

- Set isLive: true on any tutorial
- Write raw objects instead of using factory functions
- Reference a componentId not in components.json
- Leave requiredEdges empty for step 2+
- Add a component already introduced in a previous level
- Use "Client" as edge from/to (use "Web" or "Mobile")
- Write an openingMessage over 3 sentences
- Write a celebrationMessage with invented numbers
- Write a celebrationMessage with no real fact
- Have fewer than 2 or more than 3 messages per step
- Skip the quality checklist
- Set stepCount manually (let factory compute it)
- Write action fields without buildAction()
- Write opening messages without buildOpeningL1/2/3()
- Reference a Lucide icon that does not exist
- Add duplicate components to components.json
- Leave any step field empty, null, or placeholder

---

## 21. THE DRY PRINCIPLE IN THIS CODEBASE

Every tutorial file must contain ONLY the unique
data for that tutorial. Nothing else.

What belongs in tutorial files:
- The unique facts about each company
- The specific components in the right order
- The real numbers for each company
- The specific analogies per step

What does NOT belong in tutorial files:
- Type definitions (those are in /lib/tutorial/types.ts)
- Validation logic (in /lib/tutorial/validators.ts)
- Default message formats (in /lib/tutorial/defaults.ts)
- Factory function implementations (in /lib/tutorial/factories.ts)

If you find yourself copying the same structure
from one tutorial to another: stop and ask whether
it should be in the shared library instead.

Consistent inputs → consistent outputs → satisfied users.
That is the entire goal of this rule.

---

## 22. RUNNING THE VALIDATOR (Absolute)

After writing any tutorial, the validator in
/lib/tutorial/validators.ts will run automatically
in development mode when the app starts.

Read the validator output before considering any
tutorial work complete.

Zero errors = tutorial is structurally sound.
Any errors = fix them before finishing.

If the validator does not catch something but you
know it is wrong: fix the validator too so it
catches it next time.

The validator improves over time by catching new
failure modes as they are discovered.


---

## 23. EDGE LABELS MUST MATCH CANVAS LABELS (Absolute)

The `from` and `to` values in `requiredEdges` must match
the actual label rendered on the canvas node — not a
generic name like "Client" or "Service".

### 8F. Use component IDs in edge() calls (new-format tutorials)

In new-format tutorials (those using factory functions),
always pass component IDs to `edge()`:

```ts
// CORRECT — component IDs resolve to canvas labels
edge('client_web', 'api_gateway')   // → { from: 'Web', to: 'API Gateway' }
edge('load_balancer', 'microservice') // → { from: 'Load Balancer', to: 'Microservice' }

// WRONG — raw strings that may not match canvas labels
edge('Client', 'API Gateway')  // 'Client' never matches any canvas label
edge('Load Balancer', 'Recommendation')  // wrong if component is 'microservice'
```

The `edge()` factory resolves IDs via the `EDGE_LABEL` map in
`/lib/tutorial/factories.ts`. If a component ID is missing from
the map, add it before using it.

### 8G. 'Client' is a banned edge label

`from: 'Client'` and `to: 'Client'` are permanently banned.

Canvas nodes render as "Web" (client_web) or "Mobile" (client_mobile).
The string "Client" never matches any canvas label.

Use the actual canvas label:
- `client_web` renders as "Web" → use `'Web'` or `edge('client_web', ...)`
- `client_mobile` renders as "Mobile" → use `'Mobile'` or `edge('client_mobile', ...)`

### 8H. Match the component that was actually added in the step

When a step adds component X, the `requiredEdges` must reference
the label of X — not a different component that happens to be
on the canvas.

Example: if step 8 adds `recommendation_service` (label "Recommendation"),
the edge FROM that step must use `'Recommendation'` or `edge('recommendation_service', ...)`.
Using `'Microservice'` would match the wrong node.

The validator in `/lib/tutorial/validators.ts` checks for banned labels
and label mismatches. Run it and fix all errors before finishing.
