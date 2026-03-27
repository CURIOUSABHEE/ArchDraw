# ArchDraw

A free, open-source tool for designing system architecture diagrams. Built with Next.js, React Flow, and Tailwind CSS.

**Live:** [https://archdraw.abhishekjamdade.xyz](https://archdraw.abhishekjamdade.xyz)

## Features

- **Drag & Drop Components** - Build diagrams by dragging components from a curated library
- **150+ Components** - Includes AWS services, databases, AI/ML tools, and more
- **Custom Components** - Create and save your own reusable components
- **AI-Powered** - Generate diagrams from text descriptions
- **Interactive Tutorials** - Learn system design patterns with guided tutorials
- **Real-time Templates** - Start from battle-tested architectures (ChatGPT, Instagram, Netflix, etc.)
- **Export Options** - Download as PNG, PDF, JSON, or embed as HTML
- **Shareable Links** - Share your diagrams with a single click
- **Dark/Light Mode** - Works in both themes

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Diagramming:** React Flow
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Framer Motion + GSAP
- **Backend:** Supabase (auth, database, real-time)
- **Icons:** Lucide React
- **State:** Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm/bun

### Installation

```bash
# Clone the repository
git clone https://github.com/anomalyco/archdraw.git
cd archdraw/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start designing.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open component search |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Delete/Backspace` | Delete selected |
| `Cmd/Ctrl + D` | Duplicate selected |
| `Cmd/Ctrl + Shift + N` | Create new component |
| `?` | Show shortcuts |

## Project Structure

```
frontend/
├── app/                    # Next.js app router
├── components/
│   ├── landing/           # Landing page components
│   ├── ui/                # shadcn/ui components
│   └── ...                # Core editor components
├── data/                  # Component definitions
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities & registries
├── store/                 # Zustand stores
└── views/                 # Page views
```

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/anomalyco/archdraw)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
