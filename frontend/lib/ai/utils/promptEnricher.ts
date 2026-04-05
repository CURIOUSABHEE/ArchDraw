export function enrichPrompt(userPrompt: string, options?: { isTutorial?: boolean; systemType?: string }): string {
  if (options?.isTutorial) return userPrompt
  
  const systemType = options?.systemType ?? 'Microservices Architecture';
  
  return `
SYSTEM TYPE: ${systemType}
SYSTEM DESCRIPTION (this is the subject of the diagram, not a component):
"${userPrompt}"

CRITICAL RULE: The text above describes WHAT YOU ARE DIAGRAMMING.
It is the title and context. It is NOT a node.
Do NOT generate any node whose label is derived from the overall 
system name or the prompt description.
Generate ONLY the internal components, services, and infrastructure 
that make up this ${systemType}.

${CONTAINER_CHECKLIST}

${UNIVERSAL_ARCHITECTURE_PROMPT}
  `.trim()
}

const CONTAINER_CHECKLIST = `

═══════════════════════════════════════════════════════════════════════════
CONTAINER SELF-CHECK (verify before outputting JSON)
═══════════════════════════════════════════════════════════════════════════

Before you output JSON, verify ALL of these:

☐ At least ONE container/group node exists (isGroup: true)
☐ Every group has at least 2 child nodes (parentId references exist)
☐ No group has exactly 1 child (minimum is 2 or remove the group)
☐ Backend services are inside containers (not floating at root)
☐ Only client and external nodes may be at root level
☐ Container IDs appear BEFORE their children in the output array
☐ ParentId references point to valid group IDs
☐ Maximum 12 leaf nodes total (consolidate if more)
☐ None of my node labels are derived from the user's system description. 
  The system description is the SUBJECT of the diagram. 
  Components are the CONTENTS of the diagram.
  If the user said 'build me X', no node should be called 'X'.

If ANY check fails, FIX the output before returning JSON.
`;

const UNIVERSAL_ARCHITECTURE_PROMPT = `

DIAGRAM PHILOSOPHY — read this before generating anything:

The target output is an architecture diagram in the style of 
Cloudcraft, Brainboard, or AWS Architecture Center diagrams.
These diagrams communicate through STRUCTURE and CONTAINMENT.
They do NOT communicate through edge labels or edge style variation.

A good architecture diagram has these properties:
  - Fewer than 12 nodes total
  - Fewer edges than nodes
  - Every node has an icon
  - Nodes are organized into nested containers
  - The outermost container is the deployment boundary
  - Edges are clean, sparse, and label-free
  - Reading the diagram takes 5 seconds, not 5 minutes

A bad architecture diagram has these properties:
  - More than 15 nodes (too complex to read at a glance)
  - More edges than nodes (spaghetti)
  - Labels on every edge (flowchart, not architecture)
  - Flat list of nodes with no grouping (no spatial hierarchy)
  - Everything connected to everything (no clear primary path)

SIMPLICITY RULE:
  If the user describes a complex system with many services,
  ABSTRACT and GROUP related services rather than listing every one.
  Example: user says "auth service, JWT validator, session manager, OAuth handler"
  → generate ONE node: "Auth Service"
  
  The diagram shows WHAT the system is made of at the right level of 
  abstraction — not every implementation detail.

CONTAINMENT RULE:
  The primary question for every node is:
  "What environment does this live in?"
  Not: "What layer number is this?"
  
  Group by deployment context:
    In the same VPC? → same container
    Lambda functions? → LAMBDA FUNCTIONS container
    In the same Kubernetes cluster? → same container
    Third-party SaaS? → EXTERNAL SERVICES container

EDGE RULE:
  Draw only the edges a senior engineer would draw on a whiteboard 
  in the first 30 seconds of explaining this system.
  Those are the only edges that matter.
  Everything else is noise.
`;
