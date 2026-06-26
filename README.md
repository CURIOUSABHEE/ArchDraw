# ArchDraw

**ArchDraw** is a web-based, AI-assisted interactive system architecture diagramming tool. Describe a system in plain English (or Mermaid syntax) and have it automatically rendered as a professional React Flow diagram with auto-layout, subgraph grouping, typed edges, and export capabilities.

---

## Features

- **AI-Powered Diagram Generation**: Describe your architecture in natural language and ArchDraw's multi-stage AI pipeline generates a complete, styled diagram.
- **Interactive Canvas**: Drag, pan, zoom, group, and connect nodes on a React Flow canvas with collision resolution, guide lines, and floating edges.
- **Multi-Canvas Tabs**: Work on multiple diagrams simultaneously with Zustand-backed tab management and undo/redo history.
- **Mermaid Support**: Input or export raw Mermaid syntax, with automatic validation and self-repair.
- **Auto-Layout**: ELK (Eclipse Layout Kernel) and Dagre engines compute hierarchical, collision-free layouts with tier alignment and subgraph sizing.
- **Template Library**: Pre-built architecture templates (Netflix, Uber, E-Commerce, Instagram, ChatGPT, and more).
- **Tutorial System**: Guided, hands-on tutorials that teach system architecture concepts by building diagrams step-by-step.
- **AI Validation & Repair**: The pipeline validates generated diagrams and self-repairs syntax errors with up to 16 retry attempts.
- **Share & Embed**: Public share links (`/share/[id]`) and embeddable viewers (`/embed/[id]`) for published diagrams.
- **MCP Server**: A Model Context Protocol server that allows AI coding assistants to programmatically generate, edit, and export diagrams.
- **Export**: Export diagrams as JSON, Mermaid, PNG, or SVG.
- **Authentication**: Supabase-powered Magic Link OTP authentication.
- **Dashboard**: Personal dashboard with recent canvases, templates, and learning resources.
- **Dark Theme**: Full dark-mode UI with Tailwind CSS v4.

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Canvas** | React Flow v11 |
| **State** | Zustand v5 (with undo/redo and persistence) |
| **Layout** | ELK (elkjs) + Dagre |
| **AI / LLM** | Groq API (Llama 3.3 70B), Google Generative AI |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Magic Link OTP |
| **Cache** | Upstash Redis |
| **CSS** | Tailwind CSS v4 |
| **Animation** | GSAP + Framer Motion |
| **UI Library** | Radix UI primitives + shadcn/ui |
| **Charts** | Recharts |
| **Mermaid** | Mermaid.js v11 |
| **Testing** | Vitest + Testing Library |
| **Deployment** | Vercel |

---

## Architecture

ArchDraw is split into three main subsystems:

### 1. Interactive Frontend Canvas (`frontend/`)
A React Flow canvas with custom node types (SystemNode, ShapeNode, GroupNode, AnnotationNode), custom edge types (SimpleFloatingEdge with dynamic handle mapping), collision detection, guide lines, and context menus. The Zustand store (`diagramStore.ts`) is the single source of truth, managing multi-canvas tabs, undo/redo stacks, handle mappings, and AI pipeline state.

### 2. Next.js API Backend (`frontend/app/api/`)
Serverless API routes handle diagram generation, loading, saving, exporting, sharing, embedding, session management, and MCP protocol endpoints.

### 3. AI Pipeline & MCP Server (`frontend/lib/ai/`, `frontend/mcp-server/`)
A multi-stage, self-repairing pipeline that transforms natural language prompts into React Flow diagram states:
- **Stage 1 — Intent Detection**: Classifies the user's prompt and extracts system inventory.
- **Stage 2 — Reasoning**: LLM call to plan component relationships.
- **Stage 3 — Diagram Generation**: Generates Mermaid syntax or raw JSON diagram elements.
- **Stage 4 — Parsing**: Parses Mermaid output into an intermediate representation.
- **Stage 5 — Validation & Repair**: Validates diagram structure and self-repairs errors (up to 16 retries).
- **Stage 6 — Layout**: Runs ELK or Dagre to compute coordinates, tiers, and subgraph sizing.
- **Stage 7 — Conversion**: Transforms into React Flow nodes/edges with tier-colored styling.
- **Stage 8 — Scoring**: Quality-scoring gate before final rendering.

The standalone MCP server (`mcp-server/`) exposes tools like `generate_diagram`, `fix_layout`, `apply_template`, `export_diagram` for AI coding assistants to manipulate the canvas programmatically via stdio.

---

## Project Structure

```
ArchDraw/
├── architecture.md                     # Detailed system architecture documentation
├── ARCHITECTURE-BEST-PRACTICES.md      # Architecture principles checklist
├── GEMINI.md                           # LLF-facing diagram generation rules
├── .conductor/                         # Conductor build tool config
├── .vercel/                            # Vercel project linking
├── .vscode/                            # Editor settings
└── frontend/                           # Main application
    ├── app/                            # Next.js App Router pages & API routes
    │   ├── page.tsx                    # Landing page
    │   ├── layout.tsx                  # Root layout (ThemeProvider, AuthProvider, fonts)
    │   ├── globals.css                 # Global styles
    │   ├── editor/                     # /editor — Main diagram editor
    │   ├── dashboard/                  # /dashboard — User dashboard
    │   ├── docs/                       # /docs — Documentation
    │   ├── share/[id]/                 # /share/[id] — Public share viewer
    │   ├── embed/[id]/                 # /embed/[id] — Embeddable diagram
    │   ├── tutorials/                  # /tutorials — Guided tutorials
    │   ├── blogs/                      # /blogs — Blog posts
    │   ├── privacy/                    # Privacy policy
    │   ├── terms/                      # Terms of service
    │   └── api/                        # API routes
    │       ├── generate-diagram/       # AI diagram generation
    │       ├── diagram/load            # Load/save diagrams
    │       ├── diagram/export          # Export diagrams
    │       ├── share/[id]/             # Share link resolution
    │       ├── embed/[id]/             # Embed data endpoint
    │       ├── session/[sessionId]/    # Session management
    │       ├── repo-diagram/           # GitHub repo diagramming
    │       ├── mcp/                    # MCP protocol endpoint
    │       ├── og/[id]/                # Open Graph images
    │       ├── tutorial-chat/          # Tutorial AI chat
    │       └── tutorial-check/         # Tutorial validation
    ├── components/                     # React components
    │   ├── Canvas.tsx                  # Main React Flow canvas
    │   ├── SystemNode.tsx              # Custom node types
    │   ├── SimpleFloatingEdge.tsx      # Floating edge rendering
    │   ├── FloatingAIBar.tsx           # AI prompt input bar
    │   ├── PropertiesPanel.tsx         # Node/edge properties panel
    │   ├── MermaidCodePanel.tsx        # Mermaid code editor
    │   ├── GenerationProgress.tsx      # Pipeline progress indicator
    │   ├── AuthModal.tsx               # Authentication modal
    │   ├── AuthProvider.tsx            # Auth context provider
    │   ├── ThemeProvider.tsx           # Theme context provider
    │   ├── GuideLines.tsx              # Alignment guide lines
    │   ├── CommandPalette.tsx          # Command palette (Cmd+K)
    │   ├── dashboard/                  # Dashboard components
    │   ├── edges/                      # Edge components
    │   ├── editor/                     # Editor-specific components
    │   ├── embed/                      # Embed viewer components
    │   ├── icons/                      # Technology icons (AWS, etc.)
    │   ├── landing/                    # Landing page components
    │   ├── nodes/                      # Node components & floating handles
    │   ├── onboarding/                 # Onboarding tutorial overlay
    │   ├── tutorial/                   # Tutorial canvas & guidance
    │   └── ui/                         # shadcn/ui primitives
    ├── store/                          # Zustand state stores
    │   ├── diagramStore.ts             # Core canvas store (nodes, edges, history, AI state)
    │   ├── authStore.ts                # Authentication state
    │   ├── modalStore.ts               # Modal visibility state
    │   ├── onboardingStore.ts          # Onboarding progress
    │   ├── promptHistory.ts            # AI prompt history
    │   └── tutorialStore.ts            # Tutorial session state
    ├── lib/                            # Core logic & utilities
    │   ├── ai/                         # AI pipeline
    │   │   ├── pipeline/               # Main 8-stage pipeline orchestrator
    │   │   ├── agents/                 # LLM agents (planner, layout, validator, etc.)
    │   │   ├── services/               # ELK layout, edge routing, caching, MCP client
    │   │   ├── graph/                  # Graph analysis (connectivity, domain patterns)
    │   │   ├── layouts/                # Deterministic & ELK layout configs
    │   │   ├── edges/                  # Edge repair, validation, port allocation
    │   │   ├── prompts/                # Architecture rules & prompt templates
    │   │   ├── validation/             # Diagram quality validation
    │   │   ├── utils/                  # LLM API key management, JSON parsing, model store
    │   │   └── workers/                # ELK Web Worker
    │   ├── mermaid/                    # Mermaid parsing, building, validation
    │   ├── canvas/                     # Layout presets, apply layout
    │   ├── cache/                      # Canvas preloading & transition caching
    │   ├── config/                     # Edge configuration
    │   ├── features/                   # Dynamic handle features
    │   ├── tutorial/                   # Tutorial engine, detection, validation
    │   ├── utils/                      # Edge colors, node sizing, collision, SVG export
    │   ├── agents/                     # Repo analysis agents (for repo-diagram feature)
    │   ├── factory.ts                  # Node factory
    │   ├── nodeFactory.ts              # Component node creation
    │   ├── supabase.ts                 # Supabase client
    │   ├── redis.ts                    # Upstash Redis client
    │   ├── config.ts                   # App configuration
    │   ├── utils.ts                    # General utilities
    │   └── logger.ts                   # Logging
    ├── data/                           # Static data
    │   ├── components.json             # Pre-built component library (150+ types)
    │   ├── aws-components.json         # AWS-specific components
    │   ├── db-components.json          # Database components
    │   ├── services-components.json    # Service components
    │   ├── templates/                  # Architecture templates
    │   ├── tutorials/                  # Tutorial definitions (22 tutorials)
    │   ├── blogs.ts                    # Blog post content
    │   └── componentTooltips.ts        # Component tooltip definitions
    ├── hooks/                          # React hooks
    │   ├── use-mobile.tsx              # Mobile detection
    │   ├── useCanvasInteractions.ts    # Canvas interaction handlers
    │   ├── useGrouping.ts              # Node grouping logic
    │   ├── useNodeHandles.ts           # Dynamic handle assignment
    │   └── useSnapping.ts              # Grid snapping
    ├── views/                          # Page-level views
    │   ├── Landing.tsx                 # Landing page view
    │   └── Editor.tsx                  # Editor view
    ├── constants/                      # Constants & configuration
    │   ├── diagram.ts                  # Diagram constants
    │   └── nodeShapeConfig.ts          # Node shape defaults
    ├── types/                          # TypeScript type definitions
    │   └── supabase.ts                 # Supabase database types
    ├── supabase/                       # Database schema & migrations
    │   ├── supabase-schema.sql
    │   └── migrations/
    ├── scripts/                        # Build/utility scripts
    ├── public/                         # Static assets
    └── mcp-server/                     # Standalone MCP server
        ├── src/
        │   ├── index.ts                # Main entry (10 tools)
        │   ├── server.ts               # Alternative server factory
        │   ├── lib/                    # Schema, state, ELK, prompt, checkpoint libs
        │   ├── tools/                  # Individual tool implementations
        │   └── types/                  # Type definitions
        └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A Groq API key (for AI diagram generation)
- A Supabase project (for auth & persistence, optional for local dev)

### Installation

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Install MCP server dependencies
cd mcp-server && npm install && cd ..

# 4. Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` in `frontend/`:

```env
# Groq API (required for AI generation)
GROQ_API_KEY=your_groq_api_key

# Supabase (optional — auth & persistence)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Upstash Redis (optional — caching)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
```

### Development

```bash
# Start frontend + MCP server concurrently
npm run dev

# Or run separately:
npm run dev:frontend   # Next.js on http://localhost:3000
npm run dev:mcp        # MCP server on stdio

# Run tests
npm test

# Lint
npm run lint
```

### Build for Production

```bash
npm run build
npm run start
```

---

## API Endpoints

| Route | Method | Description |
|---|---|---|
| `/api/generate-diagram` | POST | Generate diagram from natural language prompt |
| `/api/generate-diagram/streaming` | POST | Streaming diagram generation |
| `/api/diagram/load` | POST | Load or create a diagram from JSON/Mermaid |
| `/api/diagram/export` | POST | Export diagram as JSON/PNG/SVG |
| `/api/session/[sessionId]` | GET/PUT | Session management |
| `/api/share/[id]` | GET | Resolve share link |
| `/api/embed/[id]` | GET | Embed data endpoint |
| `/api/repo-diagram` | POST | Generate diagram from GitHub repository |
| `/api/mcp` | POST | MCP protocol endpoint |
| `/api/tutorial-chat` | POST | Tutorial AI chat assistant |
| `/api/tutorial-check` | POST | Validate tutorial step completion |
| `/api/og/[id]` | GET | Open Graph image for share links |

---

## MCP Server

The `archdraw-mcp-server` is a standalone Model Context Protocol server that allows AI coding assistants to interact with ArchDraw programmatically.

### Available Tools

| Tool | Description |
|---|---|
| `generate_diagram` | Generate a diagram from Mermaid code or JSON |
| `fix_layout` | Re-run layout algorithms on existing nodes |
| `list_node_types` | List available node/component types |
| `apply_template` | Apply a pre-built architecture template |
| `list_templates` | List all available templates |
| `read_me` | Read the project's structure or file contents |
| `get_diagram_state` | Get full JSON state of the current diagram |
| `update_diagram` | Add/modify/delete nodes and edges |
| `validate_diagram` | Validate a diagram for structural correctness |
| `save_checkpoint` | Save a named checkpoint of the current state |
| `load_checkpoint` | Restore a previous checkpoint |
| `export_diagram` | Export the diagram as JSON or Mermaid |

---

## AI Pipeline (Detailed)

The diagram generation pipeline in `lib/ai/pipeline/` is a multi-stage orchestrator:

1. **Intent Detection** (`stage1-intent.ts`) — Classifies user prompt intent and extracts system inventory.
2. **Reasoning** (`stage2-reasoning.ts`) — LLM call to reason about component relationships and architecture patterns.
3. **Diagram Generation** (`stage3-diagram.ts`) — Generates Mermaid syntax or raw JSON diagram elements.
4. **Parse** (`stage4-parse.ts`) — Parses Mermaid into an intermediate structured representation.
5. **Validate** (`stage5-validate.ts`) — Validates diagram structure; feeds errors back for self-repair (up to 16 retries).
6. **Layout** (`stage6-layout.ts`) — Applies ELK or Dagre layout algorithms for tier alignment and subgraph sizing.
7. **Convert** (`stage7-convert.ts`) — Transforms the validated layout into React Flow node/edge objects with tier-colored styling.
8. **Score** (`stage8-score.ts`) — Quality-scoring gate that assesses the diagram before rendering.

Supporting subsystems include:
- **Graph analysis** (`lib/ai/graph/`) — Connectivity enforcement, domain edge patterns, compensating components.
- **Edge services** (`lib/ai/edges/`) — Edge repair, port allocation, collision detection.
- **Prompts** (`lib/ai/prompts/`) — Architecture rules and prompt builders for LLM calls.
- **Validation** (`lib/ai/validation/`) — Quality scoring and structural validation.

---

## Tutorial System

ArchDraw includes 22+ guided tutorials that teach system architecture concepts by having users build real diagrams step-by-step. Tutorials cover systems like Airbnb, ChatGPT, Discord, DoorDash, Figma, GitHub, Instagram, LinkedIn, Netflix, Notion, OpenAI, RAG patterns, Shopify, Spotify, Stripe, Twitter, Uber, WhatsApp, YouTube, Zoom, and more.

Each tutorial provides:
- A structured goal and step-by-step instructions
- Real-time validation of user progress
- Interactive guidance with highlights and tooltips
- A dedicated AI chat assistant for help

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT
