# ArchFlow

A browser-based, drag-and-drop **system architecture diagramming tool** — built with Next.js, React Flow, and Supabase.

Live at: [archflow.app](https://archflow.app)

---

## Features

- 🖱️ **Drag & Drop Canvas** — drag 150+ components from the sidebar onto a React Flow canvas
- 🔗 **Connect Nodes** — draw animated smoothstep edges between components
- 🗂️ **Multi-Canvas Tabs** — work across multiple diagrams simultaneously, persisted to localStorage
- 🤖 **Auto Layout** — one-click Dagre-powered left-to-right layout
- 📐 **Snap to Grid** — 20px grid snapping for clean, aligned diagrams
- 🔍 **Searchable Component Library** — filter 150+ components by name, grouped by category
- 📋 **Templates** — pre-built architectures (ArchFlow, ChatGPT-like, Instagram-like) loaded with auto layout
- ⌨️ **Keyboard Shortcuts** — Cmd/Ctrl+D to duplicate, and more
- 🗺️ **MiniMap & Controls** — zoom, pan, and navigate large diagrams
- 📤 **Export** — save as Dark PNG, Light PNG, or Transparent PNG (3× pixel ratio)
- 🔗 **Share** — publish a read-only shareable link via Supabase
- 👤 **Auth** — magic link / OTP via Supabase (no passwords)
- 🧑‍💻 **Guest Mode** — full canvas access without an account; work is preserved through auth flow

---

## Component Library

| Category | Examples |
|---|---|
| Network | API Gateway, Load Balancer, CDN |
| Compute | Web Server, Lambda, Auth Service |
| Database | Redis Cache, PostgreSQL, MongoDB |
| Messaging | Kafka, RabbitMQ |
| Storage | S3 Storage, Object Storage |
| AI / ML | LLM API, RAG Pipeline, Vector DB |
| Services | Stripe, Resend, Analytics |

---

## Templates

| Template | Description |
|---|---|
| ArchFlow Architecture | The system design of ArchFlow itself |
| ChatGPT-like | LLM chat app with RAG, vector DB, and streaming |
| Instagram-like | Social platform with Kafka, media storage, and search |

---

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **React Flow** — interactive node-based canvas
- **Zustand** — global state management
- **Tailwind CSS v4** + **shadcn/ui** + **Radix UI** — styling and components
- **Supabase** — PostgreSQL database + magic link auth
- **Dagre** — automatic graph layout
- **html-to-image** — PNG export
- **GSAP** — landing page animations
- **Sonner** — toast notifications
- **Vercel** — hosting

---

## Getting Started

```sh
# Install dependencies
cd frontend
npm install

# Copy env vars
cp .env.example .env.local
# Fill in your Supabase URL and anon key in .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
frontend/
├── app/
│   ├── editor/          # Main canvas page (no auth required)
│   ├── share/[id]/      # Public read-only shared canvas viewer
│   └── auth/callback/   # Supabase magic link callback
├── components/
│   ├── edges/           # Custom edge components
│   ├── landing/         # Landing page sections
│   └── ui/              # shadcn/ui components
├── data/
│   ├── templates/       # Pre-built diagram templates
│   └── components.json  # Single source of truth for all node types
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (Dagre layout, icon registry, Supabase client)
├── store/               # Zustand diagram store
└── views/               # Page-level view components
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Status

Beta — core diagramming loop, auth, sharing, and export are fully functional.
