# ArchDraw Feature Summary

## 1. Diagram Editor (Canvas)
**What:** Interactive canvas for creating system architecture diagrams with React Flow.

**How:**
- `components/Canvas.tsx` - Main canvas using ReactFlow with snap-to-grid, pan/zoom, multi-selection
- `components/SystemNode.tsx` - Node rendering with icons, labels, handles
- `components/edges/FlowEdge.tsx` - Custom animated edges with dashed lines
- `store/diagramStore.ts` - Zustand store for nodes, edges, selection state
- `hooks/useSnapping.ts` - Alignment guide lines (8px threshold)
- `hooks/useCanvasInteractions.ts` - Middle-mouse pan, space+drag pan

---

## 2. Component System
**What:** Sidebar with 150+ drag-and-drop components organized by category.

**How:**
- `components/ComponentSidebar.tsx` - Accordion UI with search, custom components at top
- `lib/componentRegistry.ts` - Singleton registry managing all components
- `data/*.json` - Component definitions (general, aws, databases, services)
- Drag: `onDragStart` sets `dataTransfer` with component JSON
- Drop: `onDrop` parses JSON and calls `addNode` with calculated position

---

## 3. Templates
**What:** Pre-built architecture templates (ChatGPT, Instagram, Netflix, etc.)

**How:**
- `components/TemplateModal.tsx` - Modal with template grid and search
- `data/templates/index.ts` - Template definitions with nodes/edges data
- `store/diagramStore.ts` - `loadTemplate()` replaces current canvas
- Auto-layout using `getLayoutedElements()` (dagre algorithm)

---

## 4. AI Generation
**What:** Generate diagrams from natural language descriptions using AI.

**How:**
- `components/ai/GenerateDiagramPanel.tsx` - Slide-out panel with chat UI
- `lib/ai/agents/orchestrator.ts` - Main orchestrator agent
- `lib/ai/agents/synthesiser.ts` - Builds diagram from agent output
- `lib/ai/agents/critic.ts` - Validates and critiques generated diagrams
- SSE streaming for real-time node/edge addition to canvas
- Uses Groq LLM API for inference

---

## 5. Export Options
**What:** Export diagrams as PNG, PDF, JSON, or embeddable HTML.

**How:**
- `components/Toolbar.tsx` - Export dropdown with format options
- PNG/PDF: `html-to-image` captures viewport, `jspdf` creates PDF
- JSON: Direct serialization of `nodes` and `edges` arrays
- HTML Embed: `generateEmbedHTML()` creates self-contained SVG, copies iframe code to clipboard

---

## 5b. Edge Type Consistency
**What:** Global edge type selector ensures new connections use the same edge style.

**How:**
- `store/diagramStore.ts` - Added `currentEdgeType` state (default: 'sync')
- `onConnect` uses `get().currentEdgeType` for new edge's `data.edgeType`
- `components/Toolbar.tsx` - `EdgeTypeSelector` component with dropdown
- Dropdown shows visual preview of each edge type (sync, async, stream, event, dep)
- Edge type persists across the canvas until explicitly changed

---

## 6. Custom Components
**What:** Create reusable custom component types.

**How:**
- `components/CreateComponentModal.tsx` - Modal with type selection and form
- `lib/componentRegistry.ts` - `addCustomComponent()`, `updateCustomComponent()`, `deleteCustomComponent()`
- localStorage persistence with key `archflow-custom-components`
- Custom components appear at top of sidebar with gradient highlight
- Same drag-and-drop behavior as built-in components

---

## 7. Undo/Redo
**What:** 30-step history for all canvas operations.

**How:**
- `store/diagramStore.ts` - `past[]` and `future[]` arrays
- `pushHistory()` called on any structural change (add/delete/move node)
- `undo()` pops from past, pushes current to future
- `redo()` pops from future, pushes current to past
- Keyboard: `Cmd+Z` / `Cmd+Shift+Z`

---

## 8. Command Palette (Cmd+K)
**What:** Quick search and add components from anywhere.

**How:**
- `components/CommandPalette.tsx` - Modal with search input
- `componentRegistry.search()` filters by label, category, technology, description
- Arrow keys navigate, Enter adds to canvas at viewport center
- Listens for `custom-component-added` events to refresh

---

## 9. Keyboard Shortcuts
**What:** Comprehensive keyboard shortcuts for all operations.

**How:**
- `views/Editor.tsx` - Global keyboard listener
- `components/KeyboardShortcutsModal.tsx` - Reference modal (press `?`)
- `components/Canvas.tsx` - Canvas-specific shortcuts
- Copy/Cut/Paste: `hooks/useCanvasInteractions.ts` using `e.clipboardData`
- Duplicate: `Cmd+D` clones selected nodes with offset

---

## 10. Theming (Dark/Light Mode)
**What:** Toggle between dark and light themes.

**How:**
- `components/ThemeProvider.tsx` - Wraps app with `next-themes`
- CSS variables for all colors in `app/globals.css`
- `components/ThemeToggle.tsx` - Sun/moon toggle button
- Persisted to localStorage

---

## 11. Authentication
**What:** User accounts via Supabase magic link.

**How:**
- `store/authStore.ts` - Zustand store for user state
- `lib/supabase.ts` - Supabase client configuration
- Magic link: `supabase.auth.signInWithOtp()`
- Session stored in Supabase, syncs with local state
- Guest mode available without login

---

## 12. Sharing
**What:** Generate public shareable links for diagrams.

**How:**
- `components/ShareModal.tsx` - Modal with copy link button
- `components/SharedCanvasViewer.tsx` - Public read-only view page
- Supabase table `shared_canvases` stores public diagrams
- Links format: `/share/{id}`
- 30-day expiration with badge indicator

---

## 13. Multi-Canvas Tabs
**What:** Multiple diagrams in tabs within the same window.

**How:**
- `store/diagramStore.ts` - `canvases[]`, `activeCanvasId`
- `components/Toolbar.tsx` - Tab bar with add/close/switch
- Double-click to rename, X to close (with confirm if non-empty)
- Each canvas has independent nodes/edges/history

---

## 14. Tutorials
**What:** Interactive step-by-step tutorials for learning system design.

**How:**
- `store/tutorialStore.ts` - Tutorial state and progress
- `lib/tutorial/engine.ts` - Tutorial runner and validation
- `lib/tutorial/validation.ts` - Checks if diagram matches expected structure
- `components/tutorial/` - UI components for tutorial mode
- Progress synced to Supabase for logged-in users
- Available: Netflix, Uber, Twitter, Instagram, Spotify, Airbnb, etc.

---

## 15. Onboarding
**What:** First-time user guided tour.

**How:**
- `store/onboardingStore.ts` - Onboarding state
- `components/onboarding/` - Overlay with highlights
- Detects first visit, shows step-by-step guide
- Stored in localStorage, dismissed permanently after completion
- Detects drag interactions to auto-dismiss

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Canvas | React Flow |
| State | Zustand |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion + GSAP |
| Icons | Lucide React |
| Backend | Supabase |
| AI | Groq LLM + Multi-agent |
| Theming | next-themes |
