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

const shopifyTutorial: TutorialDefinition = {
  id: 'shopify-architecture',
  title: 'How to Design Shopify Architecture',
  description: 'Build an e-commerce platform for 2 million merchants processing $235B in annual sales. Learn cart management, inventory locking, checkout flows, payment processing, and Black Friday traffic spikes.',
  difficulty: 'intermediate',
  estimatedMinutes: 30,
  tags: ['e-commerce', 'payments', 'inventory'],
  icon: 'ShoppingCart',
  color: '#96BF48',

  levels: [
    {
      id: 'level-1',
      title: 'E-Commerce Platform',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to Shopify Architecture',
              body: "Let's build Shopify from scratch. 2 million merchants, $235 billion in annual sales, and a Black Friday peak of 4.2 million orders per hour.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: "Shopify's web client is the storefront — the customer-facing shop handling product browsing, cart management, and checkout.",
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "Shopify powers 2 million storefronts, each with a unique domain and theme. A 1-second delay in page load reduces conversions by 7%.",
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
              body: 'Web Client added. Now the CDN.',
            },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Press ⌘K to open component search', 'Search for "Web"'],
        },
        {
          id: 'step-2',
          title: 'Add CDN',
          phases: {
            context: {
              heading: 'Level 1: Step 2',
              body: 'Adding the CDN — serves storefront assets from edge locations.',
            },
            intro: {
              heading: 'Do you know about CDNs?',
              body: "Shopify's CDN serves storefront assets — product images, CSS, JavaScript — from edge locations worldwide.",
            },
            teaching: {
              heading: 'Deep dive: CDN',
              body: "When a merchant uploads a 5MB product photo, Shopify stores the original and generates thumbnails lazily. The CDN serves the right size for each device.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'CDN', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Web Client → CDN.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'CDN added. Now the API Gateway.',
            },
          },
          validation: [
            allOf(
              nodeRule('cdn', 'CDN'),
              edgeRule('client_web', 'cdn')
            ),
          ],
          hints: ['Search for "CDN"', 'Connect Web to it'],
        },
        {
          id: 'step-3',
          title: 'Add API Gateway',
          phases: {
            context: {
              heading: 'Level 1: Step 3',
              body: 'Adding the API Gateway — handles storefront API requests with per-merchant rate limiting.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: "Shopify's API Gateway enforces API rate limits per merchant — a merchant's app can't hammer the API and affect other merchants.",
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "Shopify uses a leaky bucket rate limiter: each merchant gets 40 API calls per second. The gateway tracks usage per merchant, not per IP.",
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
          id: 'step-4',
          title: 'Add Load Balancer',
          phases: {
            context: {
              heading: 'Level 1: Step 4',
              body: 'Adding the Load Balancer — distributes traffic with pre-scaling for Black Friday.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: "Shopify's Load Balancer distributes requests across service instances with pre-scaling for traffic spikes.",
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: "Shopify pre-scales for Black Friday — they don't wait for traffic to spike before adding capacity. Flash sale drills run throughout the year.",
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
              body: 'Load Balancer added. Now the Cart Service.',
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
          id: 'step-5',
          title: 'Add Cart Service',
          phases: {
            context: {
              heading: 'Level 1: Step 5',
              body: 'Adding the Cart Service — manages shopping carts in Redis.',
            },
            intro: {
              heading: 'Do you know about Cart Services?',
              body: 'The Cart Service manages shopping carts stored in Redis for sub-millisecond reads.',
            },
            teaching: {
              heading: 'Deep dive: Cart Service',
              body: "Every time you add an item, change quantity, or apply a discount code, the Cart Service updates Redis. Carts expire after 30 days of inactivity.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Cart Service', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Load Balancer → Cart Service.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Cart Service added. Tutorial complete! You have built Shopify.',
            },
          },
          validation: [
            allOf(
              nodeRule('cart_service', 'Cart'),
              edgeRule('load_balancer', 'cart_service')
            ),
          ],
          hints: ['Search for "Cart Service"', 'Connect Load Balancer to it'],
        },
      ],
    },
  ],
};

export default shopifyTutorial;