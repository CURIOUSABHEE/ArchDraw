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
- If two nodes exchange edges (bidirectional or parallel connections), align and position them so they face each other directly.

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

## 9. EDGE DIRECTION — MANDATORY (THE #1 GENERATION ERROR)
**Edges MUST flow LEFT→RIGHT through tiers. Client nodes are SOURCES, never SINKS.**

Tier order (mandatory left-to-right direction):
```
client (0) → edge (1) → compute (2) → async (3) → data (4) → external (5)
```

CORRECT:
- Web App → API Gateway → Order Service → Kafka → PostgreSQL
- Mobile App → API Gateway → Auth Service (login only)

WRONG — NEVER DO THIS:
- Order Service → Web App (service connecting back to client = FORBIDDEN)
- PostgreSQL → Web App (data to client = FORBIDDEN)
- 10 services all pointing TO Web App (star topology = REJECTED by validator)

**Web Client is NOT a hub.** It sends requests outward and receives responses via the HTTP cycle — it does not receive direct edges from backend services.

If backend needs to push real-time updates to the client:
→ Add a `WebSocket Gateway` (tier: edge) with `stream` edges
→ Or a `Push Notification Service` (tier: compute) with `stream` edge to client

PRE-FLIGHT EDGE AUDIT — run this check before every call to `generate_diagram`:
1. Find every edge where `target` is a `client` tier node
2. If `source` is NOT also client tier → DELETE that edge
3. Count inbound edges per node — if any node receives >45% of all edges → it's a hub, redistribute

---

## 10. AUTH SERVICE TOPOLOGY — MANDATORY
**The Auth Service receives arrows ONLY from login and token refresh endpoints. No other arrows from the gateway into Auth Service are permitted.**

CORRECT flow:
- Client → API Gateway → Auth Service: ONLY for `/login`, `/register`, `/token/refresh` routes
- All other routes: API Gateway validates JWT internally (or via sidecar), then routes DIRECTLY to the target service
- Auth Service is NOT an intermediate hop in the request chain for business operations

WRONG (never draw this):
- API Gateway → Auth Service → Order Service (Auth as proxy/middleware hop)
- Any business service having Auth Service as an upstream dependency on the happy path

ENFORCEMENT: Before finalizing, audit every edge whose target is the Auth Service. If the source is the API Gateway and the edge label is not login/register/token-refresh — delete that edge immediately.


---

## 10. OBJECT STORAGE — DOMAIN-REQUIRED NODE
**For any domain that handles binary files, object storage (S3, GCS, Azure Blob) is not optional. Drawing a CDN without an origin storage is architecturally invalid.**

Mandatory when the domain includes:
- Video streaming / VOD → S3 for raw uploads + transcoded outputs
- Image/social platforms → S3 for photo and video blobs
- Audio streaming → S3 for audio asset files
- Document/file management → S3 or equivalent
- Any CDN node → the CDN MUST have an arrow FROM an object storage origin

Complete video pipeline that MUST appear:
```
Upload Client → Object Storage (raw) → Transcoding Worker → Object Storage (processed) → CDN → Playback Client
```

Never omit the object storage node if a CDN or Transcoding Worker is present.

---

## 11. ANALYTICS & WATCH EVENT STREAMS — DOMAIN-REQUIRED NODE
**For engagement-loop platforms, the analytics event stream is core product infrastructure — not optional observability.**

Mandatory when the domain includes:
- Video/audio streaming → play, pause, seek, completion events → recommendation engine
- Social media → like, share, follow events → feed ranking algorithm
- E-commerce → click, view, add-to-cart, purchase events → recommendation + pricing
- Gaming → session, achievement, match events → matchmaking + monetization

The feedback loop MUST be shown:
```
Client → (play/click/view event) → Event Stream (Kafka / Kinesis) → Analytics Processor → Recommendation Engine
```

This is the primary business intelligence source and product feedback loop — not a nice-to-have logging feature.

---

## 12. SECURITY SERVICE ROUTING — NO CLIENT BYPASS
**Security-sensitive services (DRM, Auth, Token Validation, License Servers) must NEVER connect directly to client-tier nodes. All such connections bypass gateway auth enforcement.**

CORRECT:
- Client → API Gateway → DRM License Service (gateway verifies subscription/entitlement first)
- Client → API Gateway → Auth Service (only for login/token flows)

WRONG (never draw this):
- Client → DRM License Service (unauthenticated clients could request licenses)
- Client → Auth Service directly for general API calls

ENFORCEMENT: Audit every edge where source is `client` tier and target is a security/DRM/auth node in `compute` tier. If no API Gateway is in the path — re-route through the gateway.

---

## 13. DOMAIN COMPLETENESS CHECKLIST
Before finalizing any diagram, verify all domain-specific required nodes are present:

| Domain | Required Nodes (cannot be omitted) |
|--------|-------------------------------------|
| Video Streaming | Object Storage (raw + output), Transcoding Worker, CDN, DRM Service (via gateway), Analytics Event Stream, Recommendation Engine |
| Social Media | Object Storage (media blobs), CDN, Engagement Event Stream, Feed Ranking Service, Notification Service |
| E-Commerce | Payment Gateway, Order Queue, Inventory Service, Notification Service, Cart Service |
| Ride-sharing | Real-time Location Service, Driver Matching Engine, Payment Gateway, Push Notification |
| SaaS / B2B | Auth Service (login only), Billing/Subscription Service, Audit Log, Webhook Delivery |
| Chat / Messaging | WebSocket Gateway, Message Queue, Notification Service, Media Storage |
| Audio Streaming | Object Storage, CDN, Transcoding Worker, Recommendation Engine, Analytics Stream |

If any required node for the detected domain is absent — add it before generating the diagram.
