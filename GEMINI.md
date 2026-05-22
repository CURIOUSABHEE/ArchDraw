# ArchDraw — Diagram Generation Rules

These rules are foundational mandates and take absolute precedence over all other instructions, including general workflows and tool defaults.

## 1. LAYOUT ALGORITHM
- ALWAYS use a ranked/layered layout (Dagre, ELK, or Graphviz dot engine)
- Direction: LEFT TO RIGHT (rankdir=LR) or TOP TO BOTTOM (rankdir=TB)
- Never place nodes with random/arbitrary x,y coordinates
- Minimum rank separation: 120px between tiers
- Minimum node separation: 60px within same tier

## 2. NODE SIZING — NO TRUNCATION EVER
- Node width = auto-fit to longest text line + 40px padding on each side
- Node height = auto-fit to number of text lines + 20px padding top/bottom
- NEVER hardcode a fixed width smaller than the label
- If subtitle exists, calculate width based on whichever line is longer
- Minimum node width: 180px. No maximum.

## 3. TIERED STRUCTURE — MANDATORY
- Group all nodes into explicit tiers before rendering:
    - Tier 1 → Entry points (Client, Browser, Mobile)
    - Tier 2 → Infrastructure (Load Balancer, CDN, API Gateway)
    - Tier 3 → Services (Auth, Business Logic, Workers)
    - Tier 4 → Data Layer (Databases, Cache, Queue)
- Nodes in the same tier must be vertically aligned
- No node from Tier N should visually overlap with Tier N+1

## 4. EDGE ROUTING — NO CROSSING OR OVERLAPPING
- Use orthogonal (right-angle) or curved (bezier) routing — never straight diagonal lines that cross nodes
- Edges must never pass through a node bounding box
- If two edges share a path, offset them by at least 8px
- Sync connections (REST, HTTPS, SQL, gRPC) → solid lines
- Async connections (AMQP, Kafka, Queue, Pub/Sub) → dashed lines
- Always label edges with protocol name (REST, HTTPS, SQL, AMQP, etc.)
- Arrow direction must clearly show data/request flow

## 5. COLLISION DETECTION — NO OVERLAPPING NODES
- After placing all nodes, run a bounding box collision check
- If any two nodes overlap, increase node separation and re-layout
- Nodes must have a minimum margin of 40px between each other on all sides
- If a tier has too many nodes, split into sub-tiers or increase canvas height

## 6. COLOR & VISUAL GROUPING
- Color-code nodes by category, not randomly:
    - Infrastructure → Gray (#6B7280)
    - Auth/Security  → Purple (#7C3AED)
    - Services       → Blue (#2563EB)
    - Async/Queue    → Orange (#D97706)
    - Databases      → Green (#059669)
    - Cache          → Teal (#0891B2)
- Use same color for border and icon; light tint for fill (10% opacity)
- Group related nodes inside a labeled bounding box/container

## 7. TYPOGRAPHY
- Primary label: Bold, 13-14px, full name (NO ellipsis, NO truncation)
- Subtitle: Regular, 11px, tech stack (e.g., "MySQL, PostgreSQL")
- Edge labels: 10px, italic, placed at midpoint of edge
- Font: Inter, Roboto, or any clean sans-serif

## 8. CANVAS & OUTPUT
- Auto-size the canvas to fit all nodes + 80px padding on all sides
- Never clip any node or label at canvas boundary
- Export/render at minimum 1400px wide for complex diagrams
- Background: White (#FFFFFF) or Off-white (#F9FAFB)
