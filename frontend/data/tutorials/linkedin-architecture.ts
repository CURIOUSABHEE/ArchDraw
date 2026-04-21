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

const linkedinTutorial: TutorialDefinition = {
  id: 'linkedin-architecture',
  title: 'How to Design LinkedIn Architecture',
  description: 'Build a professional social network for 1 billion members. Learn social graph traversal, feed ranking, connection degrees, job matching, and real-time messaging at scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 30,
  tags: ['social-media', 'job-matching', 'networking'],
  icon: 'Users',
  color: '#0A66C2',

  levels: [
    {
      id: 'level-1',
      title: 'Professional Social Network',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to LinkedIn Architecture',
              body: "Let's build LinkedIn from scratch. 1 billion members, 40 million job postings, and a social graph with billions of connections.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: "LinkedIn's web client handles the feed, profile pages, job search, and messaging.",
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "LinkedIn's hardest problem: when you search for '2nd-degree connections who work at Google', LinkedIn must traverse a graph of billions of edges in milliseconds.",
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
              body: 'Adding the API Gateway — routes requests to the correct microservice.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: 'All client requests flow through the API Gateway with authentication and rate limiting.',
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "The gateway validates your auth token, checks rate limits (LinkedIn throttles aggressive scrapers), and routes to the right service.",
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
              body: 'Adding the Load Balancer — distributes traffic with consistent hashing.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: "LinkedIn's Load Balancer distributes traffic across service instances with consistent hashing.",
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: "Consistent hashing means user A's requests always go to the same server. That server caches your connection graph in memory, making subsequent requests much faster.",
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
              body: 'Adding the Auth Service — handles OAuth and enterprise SSO.',
            },
            intro: {
              heading: 'Do you know about Auth Services?',
              body: "LinkedIn's Auth Service handles OAuth login, email/password, and SAML enterprise SSO.",
            },
            teaching: {
              heading: 'Deep dive: Auth Service',
              body: "Enterprise customers configure their identity provider (Okta, Azure AD) to authenticate employees. This is how 'Sign in with your company account' works.",
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
              body: 'Auth Service added. Tutorial complete! You have built LinkedIn.',
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

export default linkedinTutorial;