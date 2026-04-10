# ArchDraw MCP Server

An MCP (Model Context Protocol) server that exposes ArchDraw's architecture diagram tools for Claude/Gemini to use. The AI reasoning and diagram generation is done entirely by the calling model.

## Features

- **Generate Diagrams**: Create architecture diagrams with ELK auto-layout
- **Fix Layouts**: Auto-layout existing diagrams using ELK.js
- **List Node Types**: Browse 150+ pre-built component types
- **Apply Templates**: Use pre-built architecture templates

## Installation

```bash
cd frontend/mcp-server
npm install
```

## Configuration

No API keys required - the MCP server is a pure data provider. The AI model (Claude/Gemini) provides the reasoning.

### Claude Desktop Configuration

Add this to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "archdraw": {
      "command": "node",
      "args": ["C:/Users/Shyam/OneDrive/Desktop/Python/ArchDraw/frontend/mcp-server/dist/index.js"]
    }
  }
}
```

## Development

```bash
# Run in development mode (tsx watches and reloads)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Available Tools

### generate_diagram

Generate React Flow nodes and edges with ELK auto-layout positions.

**Input:**
- `nodes` (required): Array of nodes with labels and tier assignments
- `edges` (optional): Array of connections between nodes
- `direction`: Layout direction (RIGHT, DOWN, LEFT, UP)

**Example:**
```json
{
  "nodes": [
    { "label": "React App", "tier": "client" },
    { "label": "API Gateway", "tier": "edge" },
    { "label": "PostgreSQL", "tier": "data" }
  ],
  "edges": [
    { "source": "react-app", "target": "api-gateway", "communicationType": "sync" }
  ]
}
```

### fix_layout

Apply ELK auto-layout algorithm to existing nodes and edges.

**Input:**
- `nodes`: Array of nodes with layer assignments
- `edges`: Array of edges connecting nodes
- `direction`: Layout direction

### list_node_types

List all available pre-made node types from the component library.

**Input:**
- `category`: Filter by category name
- `search`: Search by label or description
- `limit`: Maximum number of results

### apply_template

Apply a pre-built architecture template.

**Input:**
- `templateId`: Template identifier (archflow, chatgpt, instagram, rideshare, ecommerce)

### list_templates

List all available architecture templates.

## Example Prompts for Claude

1. **List all available node types:**
   > "List all available premade node types in the ArchDraw diagram tool"

2. **Generate an architecture diagram:**
   > "Generate an architecture diagram for an e-commerce site with: React frontend, Node.js API, PostgreSQL database, Redis cache, Stripe payment, and S3 for images. Use LR layout."

3. **Use a template:**
   > "Apply the ecommerce template from ArchDraw and add a custom Payment Gateway node"

## Architecture

```
frontend/mcp-server/
├── src/
│   ├── index.ts           # Main MCP server entry
│   ├── tools/
│   │   ├── generate-diagram.ts  # Diagram generation tool
│   │   ├── fix-layout.ts       # Layout fixing tool
│   │   ├── list-nodes.ts      # Node catalog tool
│   │   └── apply-template.ts   # Template application tool
│   ├── lib/
│   │   ├── elk-runner.ts       # ELK layout computation
│   │   ├── node-catalog.ts    # Node type registry
│   │   ├── prompt-builder.ts  # Pure utility functions
│   │   └── schema.ts          # Zod validation schemas
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

## Tech Stack

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **elkjs**: Graph layout algorithm
- **zod**: Schema validation
- **tsx**: TypeScript execution

## How It Works

The MCP server is a **pure data provider**. It does NOT call any LLM internally. Instead:

1. The AI model (Claude/Gemini) reads the user's request
2. The model decides what nodes and edges to create
3. The model calls `generate_diagram` with its generated nodes/edges
4. The MCP server runs the ELK layout algorithm
5. The MCP server returns positioned React Flow nodes/edges
6. The AI model presents the result to the user

This architecture allows any AI model to generate diagrams without needing its own diagram-specific prompt engineering.

## License

MIT
