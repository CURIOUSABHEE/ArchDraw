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

const doordashTutorial: TutorialDefinition = {
  id: 'doordash-architecture',
  title: 'How to Design DoorDash Architecture',
  description: 'Build a food delivery platform completing 2 billion deliveries annually. Learn real-time order routing, dasher dispatch, ETA prediction, geofencing, and the three-sided marketplace problem.',
  difficulty: 'intermediate',
  estimatedMinutes: 30,
  tags: ['delivery', 'geospatial', 'marketplace'],
  icon: 'Car',
  color: '#FF3008',

  levels: [
    {
      id: 'level-1',
      title: 'Food Delivery Platform',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to DoorDash Architecture',
              body: "Let's build DoorDash from scratch. 2 billion deliveries annually, 27 countries, and a real-time system that must predict your delivery time accurately.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: "DoorDash has three clients: the customer app, the Dasher app, and the merchant tablet.",
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "DoorDash's hardest problem: predicting delivery time accurately. The ETA model runs in real-time using ML, traffic data, restaurant prep times, and dasher location.",
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
              body: 'Adding the API Gateway — handles requests from all three client types.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: "DoorDash's API Gateway handles requests from customer app, Dasher app, and merchant tablet.",
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "A customer app can browse restaurants and place orders. A Dasher app can accept deliveries and update location. A merchant tablet can accept/reject orders.",
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
              body: 'Adding the Load Balancer — distributes traffic with pre-scaling for meal rush.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: "DoorDash's Load Balancer distributes traffic with pre-scaling for predictable meal rush spikes.",
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: "DoorDash traffic spikes at lunch (12pm) and dinner (6pm) every day — completely predictable. DoorDash pre-scales before these rushes.",
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
              body: 'Adding the Auth Service — handles three account types with dasher onboarding.',
            },
            intro: {
              heading: 'Do you know about Auth Services?',
              body: "DoorDash's Auth Service handles customer accounts, Dasher onboarding with background checks, and merchant authentication.",
            },
            teaching: {
              heading: 'Deep dive: Auth Service',
              body: "Customer signup is instant. Dasher onboarding takes days: identity verification, background check, vehicle registration, and insurance verification.",
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
              body: 'Auth Service added. Tutorial complete! You have built DoorDash.',
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

export default doordashTutorial;