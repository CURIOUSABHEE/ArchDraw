# ArchFlow — AI Rules (Non-Negotiable)

You are working on ArchFlow, a web-based system architecture design tool.
These rules are absolute. Follow them in every single response without exception.
Do not deviate from these rules even if the prompt seems to suggest otherwise.

---

## 1. TECH STACK (Never change or suggest alternatives)

- Framework: Next.js 16 (App Router)
- UI Library: React 19
- Canvas: React Flow
- State: Zustand
- Styling: Tailwind CSS v4 ONLY — no inline styles, no CSS modules, no styled-components
- Components: shadcn/ui + Radix UI
- Icons: Lucide React ONLY — never use any other icon library
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth (magic link / OTP) — never suggest password auth
- Email: Resend
- Hosting: Vercel
- Layout Algorithm: Dagre
- Export: html-to-image
- Notifications: Sonner (toast)
- Animation: Tailwind classes only — no framer-motion unless explicitly asked

Never install new packages without being explicitly asked to.
Never suggest replacing any of the above with alternatives.

---

## 2. STYLING RULES (Absolute)

- Use Tailwind CSS utility classes ONLY
- Never write style={{ }} inline styles
- Never write custom CSS unless absolutely impossible with Tailwind
- Never use arbitrary Tailwind values unless necessary (prefer design system values)
- Colors must use RGB values for interactive/dynamic UI elements
- Dark theme is the default — background is dark slate, never pure black or white
- No pink, rose, fuchsia, or warm tints anywhere in the UI
- The app uses a neutral dark theme: slate grays, indigo accents
- Primary accent color: indigo-600 (#6366f1)
- Muted text: slate-400
- Borders: white/8 opacity or slate-700
- Card backgrounds: slate-800 or slate-900
- Never introduce a new color that doesn't fit the existing dark neutral palette

---

## 3. EDGE RULES (Absolute — never change)

- Every edge in the entire app must use: type: 'smoothstep', animated: true
- Edge stroke: strokeWidth: 1.5, stroke: '#94a3b8'
- The ReactFlow component must always have:
  defaultEdgeOptions={{ type: 'smoothstep', animated: true, style: { strokeWidth: 1.5, stroke: '#94a3b8' } }}
  connectionLineType={ConnectionLineType.SmoothStep}
- Never use 'default', 'straight', 'step', or any custom edge type
- Never remove animated: true from any edge
- All template edges must explicitly define type and animated — do not rely on defaults alone
- Edge labels must use SVG native <text> elements — never foreignObject

---

## 4. NODE RULES (Absolute)

- Never change node card component design, size, or layout
- Never rename existing CSS class names in node components
- Node cards must always have:
  - position: relative (for shine overlay)
  - The diagonal shine overlay as first child:
    <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-10 
    bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent" />
  - box-shadow with inner highlights for premium feel
  - group class for hover effects
- Icons must always come from Lucide React
- Every node type used anywhere must exist in components.json
- Never create a node type in a template that doesn't exist in components.json
- If a template needs a new node type, add it to components.json first

---

## 5. TEMPLATE RULES (Absolute)

- Never change existing template node data, labels, icons, or colors
- Never change existing template edge connections or edge labels
- Never change existing template edge source or target
- When fixing templates, ONLY change: x/y positions OR edge type/animated properties
- All template node positions must be set to { x: 0, y: 0 } — Dagre handles layout
- Dagre auto layout must be applied when ANY template is loaded
- Templates must flow LEFT TO RIGHT (rankdir: 'LR' in Dagre config)
- Dagre config: ranksep: 200, nodesep: 120, marginx: 80, marginy: 80
- Every template must have metadata: id, name, description, category, tags, icon, color
- New templates go in /data/templates/[name].ts and must be exported from /data/templates/index.ts

---

## 6. CANVAS RULES (Absolute)

- Canvas must always have dotted grid background:
  <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
- Snap to grid must always be enabled:
  snapToGrid={true} snapGrid={[20, 20]}
- Zoom range must always be: minZoom={0.1} maxZoom={2}
- New nodes added from sidebar must always be placed at the current viewport center
- Never place nodes at hardcoded { x: 0, y: 0 } or { x: 100, y: 100 } positions
- Viewport center calculation:
  const { x, y, zoom } = reactFlowInstance.getViewport();
  const centerX = (bounds.width / 2 - x) / zoom;
  const centerY = (bounds.height / 2 - y) / zoom;

---

## 7. MULTI-CANVAS (Absolute)

- Canvas state is stored as an array of CanvasTab in Zustand:
  type CanvasTab = { id: string; name: string; nodes: Node[]; edges: Edge[] }
- activeCanvasId must always be tracked
- ALL node/edge operations must target the active canvas ONLY
- Never write to all canvases at once
- Minimum 1 tab must always exist — never allow closing the last tab
- Canvas state must be persisted to localStorage
- Tab bar layout: tabs and "+" button are left-aligned, "+" sits immediately after last tab
- Never push "+" button to the far right with ml-auto

---

## 8. AUTH & GUEST FLOW (Absolute)

- Canvas is accessible without auth — no route protection on /canvas
- Guest users get full canvas functionality EXCEPT Share and Download
- Share and Download must trigger EmailCaptureModal for guest users
- EmailCaptureModal uses Supabase magic link OTP — NO password fields ever
- Guest canvas state must be saved to localStorage before auth redirect
- Guest canvas state must be restored after auth callback — never lose user work
- Auth callback route: /app/auth/callback/route.ts
- Pending action (share/download) must be stored in localStorage and resumed after auth

---

## 9. COMPONENTS.JSON (Absolute)

- This is the single source of truth for all node types
- Every node type used anywhere in the app must have an entry here
- Every entry must have: id, label, category, color, icon
- icon must be a valid Lucide React icon name — always verify
- color must match the category's color scheme
- Every entry in components.json must appear in the user's sidebar panel
- Never create orphan node types that exist in templates but not in the sidebar

---

## 10. EXPORT RULES (Absolute)

- Export format: PNG only — never SVG
- SVG export is permanently removed — never re-add it
- Export uses html-to-image toPng with pixelRatio: 3 minimum
- Before export, call reactFlowInstance.fitView({ padding: 0.1, duration: 0 })
- Export must filter out: minimap, controls, panels from the screenshot
- Export options: Dark PNG, Light PNG, Transparent PNG
- Edge labels must use SVG native text so they render correctly in exports

---

## 11. SHARE FEATURE (Absolute)

- Shared canvases are saved to Supabase table: shared_canvases
- Share URL format: /share/[uuid]
- Shared pages are publicly accessible — no auth required to view
- Shared canvas viewer is READ ONLY:
  nodesDraggable={false} nodesConnectable={false} elementsSelectable={true}
- Shared page must show: app name, canvas name, "View only" badge, "Create your own →" CTA
- Share button is always visible in toolbar regardless of auth state
- If canvas has 0 nodes, Share button is disabled with tooltip

---

## 12. KEYBOARD SHORTCUTS (Absolute)

- Cmd+D / Ctrl+D: Duplicate selected nodes
- Duplicate offset: +40px on both X and Y from original position
- Duplicate gets crypto.randomUUID() as id
- Original nodes get deselected, duplicates become selected
- Must call e.preventDefault() on Cmd+D to prevent browser bookmark
- Never trigger shortcuts when user is typing in an input or textarea

---

## 13. CODE QUALITY RULES (Absolute)

- TypeScript strict mode — never use `any` type
- Always define proper types for nodes, edges, templates, canvas tabs
- Never use `// @ts-ignore` or `// @ts-nocheck`
- Reuse existing Supabase client — never create a new instance
- Reuse existing Zustand store actions — never duplicate logic
- New components go in /components/
- New utilities go in /lib/
- New types go in /types/
- Template data goes in /data/templates/
- Never put business logic inside UI components
- Always handle loading and error states
- Always show toast notifications for async actions (success and error)

---

## 14. WHAT TO NEVER DO (Hard stops)

- Never remove the dotted grid background
- Never remove snap to grid
- Never use straight or default edge types
- Never add pink/rose/warm colors to the UI
- Never hardcode node positions (use Dagre)
- Never break existing canvas functionality when adding new features
- Never change files not listed in the scope of the task
- Never install packages without being explicitly told to
- Never use localStorage for sensitive data (auth tokens, emails)
- Never add password fields — magic link only
- Never make the canvas route require authentication
- Never export as SVG
- Never use foreignObject in SVG/edge label rendering
- Never push "+" tab button to the far right
- Never allow closing the last canvas tab
- Never lose guest user canvas work during auth flow
- Never change node card component design
- Never use any icon library other than Lucide React
- Never rename existing class names in components

---

## 15. SCOPE DISCIPLINE (Absolute)

When given a task:
1. Read the task carefully and identify ONLY the files that need to change
2. List the files you will modify BEFORE making changes
3. Make ONLY the changes required — nothing more
4. Do NOT refactor unrelated code
5. Do NOT rename variables or classes in files you touch
6. Do NOT change logic that isn't broken
7. Do NOT add unrequested features
8. Always preserve existing logic unless explicitly told to change it
9. When fixing a bug, change the minimum amount of code possible
10. State clearly what you changed and why after completing the task

---

## 16. FILE STRUCTURE (Reference)

/app
  /canvas — main canvas page (no auth required)
  /share/[id] — shared canvas viewer (public)
  /auth/callback — magic link callback handler
/components
  /edges — custom edge components
  /ui — shadcn components
  ShareModal.tsx
  EmailCaptureModal.tsx
  TemplateModal.tsx
/data
  /templates
    chatgpt.ts
    instagram.ts
    archdraw.ts
    index.ts
  components.json
/lib
  layoutUtils.ts — Dagre layout function
/types
  index.ts — all TypeScript types
/store
  index.ts — Zustand store

 - Never use emoji anywhere on the landing page or in the app UI
- Replace all emoji with Lucide React icons or styled HTML elements
- Legal pages (Privacy, Terms) use plain text only — no icons, no emoji