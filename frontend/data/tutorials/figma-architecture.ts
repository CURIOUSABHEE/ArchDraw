import type { TutorialDefinition, ValidationRule } from '@/lib/tutorial/schema';

function nodeRule(nodeType: string, label?: string): ValidationRule {
  return { type: 'node_exists', nodeType, label };
}

function edgeRule(source: string, target: string): ValidationRule {
  return { type: 'edge_exists', source, target };
}

function allOf(...rules: ValidationRule[]): ValidationRule {
  return { type: 'all_of', rules };
}

const figmaTutorial: TutorialDefinition = {
  id: 'figma-architecture',
  title: 'How to Design Figma Architecture',
  description: 'Build a collaborative design tool for 4 million teams. Learn CRDTs for conflict-free simultaneous editing, presence awareness, canvas rendering, and version history at scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 25,
  tags: ['design', 'collaboration', 'crdt'],
  icon: 'PenTool',
  color: '#F24E1E',

  levels: [
    {
      id: 'level-1',
      title: 'Collaborative Design Tool',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to Figma Architecture',
              body: "Let's build Figma from scratch. 4 million design teams, simultaneous editing, and a CRDT implementation so good that two designers can move the same element at the same time without conflict.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: 'Figma runs entirely in the browser using WebAssembly and WebGL for GPU-accelerated rendering.',
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "Figma's biggest technical achievement: solving the simultaneous edit problem using CRDTs — Conflict-free Replicated Data Types.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Web', and add the client to the canvas.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'This is the first step, so no connections needed yet.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Web Client added. Now the API Gateway.',
            },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Press ⌘K to open component search', 'Search for "Web"'],
        },
        {
          id: 'step-2',
          title: 'Add API Gateway',
          phases: {
            context: {
              heading: 'Level 1: Step 2',
              body: 'Adding the API Gateway — handles REST API requests.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: "Figma's API Gateway handles file loading, asset uploads, and plugin API calls.",
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "Real-time edit operations bypass the gateway and go directly to the collaboration server via WebSocket.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'API Gateway', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Web Client → API Gateway.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'API Gateway added. Now the Load Balancer.',
            },
          },
          validation: [
            allOf(
              nodeRule('api_gateway', 'API Gateway'),
              edgeRule('client_web', 'api_gateway')
            ),
          ],
          hints: ['Search for "API Gateway"', 'Connect Web to it'],
        },
        {
          id: 'step-3',
          title: 'Add Load Balancer',
          phases: {
            context: {
              heading: 'Level 1: Step 3',
              body: 'Adding the Load Balancer — routes collaboration sessions with sticky routing.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: "Figma's Load Balancer routes collaboration sessions using sticky routing by file ID.",
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: "If Alice and Bob are both editing 'Homepage Design', they must connect to the same collaboration server. This ensures the CRDT engine sees all edits in one place.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Load Balancer', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect API Gateway → Load Balancer.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Load Balancer added. Now the Auth Service.',
            },
          },
          validation: [
            allOf(
              nodeRule('load_balancer', 'Load Balancer'),
              edgeRule('api_gateway', 'load_balancer')
            ),
          ],
          hints: ['Search for "Load Balancer"', 'Connect API Gateway to it'],
        },
        {
          id: 'step-4',
          title: 'Add Auth Service',
          phases: {
            context: {
              heading: 'Level 1: Step 4',
              body: 'Adding the Auth Service — enforces file permissions at the connection level.',
            },
            intro: {
              heading: 'Do you know about Auth Services?',
              body: "Figma's Auth Service handles user authentication and file permissions.",
            },
            teaching: {
              heading: 'Deep dive: Auth Service',
              body: "When you connect to a Figma file via WebSocket, the Auth Service checks your permission level. Viewers get a read-only connection; editors get a read-write connection.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Auth Service', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Load Balancer → Auth Service.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Auth Service added. Tutorial complete! You have built Figma.',
            },
          },
          validation: [
            allOf(
              nodeRule('auth_service', 'Auth'),
              edgeRule('load_balancer', 'auth_service')
            ),
          ],
          hints: ['Search for "Auth Service"', 'Connect Load Balancer to it'],
        },
      ],
    },
  ],
};

export default figmaTutorial;