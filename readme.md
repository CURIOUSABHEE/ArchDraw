# ArchDraw

A browser-based, drag-and-drop **architecture diagramming tool** for designing and visualising software system diagrams — built as an MVP.

---

## Features

- 🖱️ **Drag & Drop Canvas** — drag components from the sidebar onto a ReactFlow-powered canvas
- 🔗 **Connect Nodes** — draw animated, smooth-step edges between components
- 🔍 **Searchable Component Library** — filter components by name, grouped by category
- 🗺️ **MiniMap & Controls** — zoom, pan, and navigate large diagrams easily
- 📥 **Import** — load a previously saved `.json` diagram
- 📤 **Export** — save your diagram as **JSON**, **PNG**, **SVG**, or **PDF**
- 🗑️ **Clear** — wipe the canvas and start fresh

---

## Component Library

| Category | Components |
|---|---|
| Network | API Gateway, Load Balancer, CDN |
| Compute | Web Server, Lambda, Auth Service |
| Database | Redis Cache, PostgreSQL, MongoDB |
| Messaging | Kafka, RabbitMQ |
| Storage | S3 Storage |

---

## Tech Stack

- **React + TypeScript** (Vite)
- **ReactFlow** — interactive node-based canvas
- **Zustand** — global state management
- **Tailwind CSS + shadcn/ui** — UI and styling
- **html-to-image + jsPDF** — diagram export

---

## Getting Started

```sh
# Install dependencies
cd diagram-canvas
npm install

# Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
ArchDraw/
├── diagram-canvas/          # Frontend (Vite + React)
│   └── src/
│       ├── components/      # Canvas, Toolbar, Sidebar, SystemNode
│       ├── store/           # Zustand diagramStore
│       ├── data/            # components.json (component library)
│       └── pages/           # Editor, NotFound
└── backend/                 # (not yet implemented)
```

---

## Status

MVP — core diagramming loop is fully functional. Backend (persistence, auth, collaboration) not yet implemented.
