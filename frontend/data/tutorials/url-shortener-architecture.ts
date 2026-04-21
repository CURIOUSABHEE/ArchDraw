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

const urlShortenerTutorial: TutorialDefinition = {
  id: 'url-shortener-architecture',
  title: 'How to Design URL Shortener Architecture',
  description: 'Build the classic system design interview question — a URL shortening service like Bitly. Learn hash generation, redirect logic, analytics, and the tradeoffs between consistent hashing and base-62 encoding.',
  difficulty: 'beginner',
  estimatedMinutes: 15,
  tags: ['caching', 'analytics', 'api'],
  icon: 'Link',
  color: '#8B3DFF',

  levels: [
    {
      id: 'level-1',
      title: 'URL Shortener',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to URL Shortener Architecture',
              body: "Let's build a URL shortener from scratch — the classic system design interview question. Services like Bitly and TinyURL handle billions of redirects daily.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: 'The client is any web browser. Users paste a long URL and get back a short code.',
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "Every system starts with the client. For a URL shortener, the client is simple — it only needs to accept a URL input and display the shortened result.",
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
              body: 'Adding the API Gateway — routes POST for shortening, GET for redirect.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: 'All requests hit the API Gateway. Two main flows: POST /shorten and GET /{code}.',
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "The API Gateway handles both flows: creating short URLs (POST) and redirecting browsers (GET). It also enforces rate limits.",
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
              body: 'Adding the Load Balancer — distributes millions of daily redirects.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: "URL shorteners are read-heavy — 95% of traffic is redirects, only 5% is URL creation.",
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: "The Load Balancer enables horizontal scaling to handle redirect bursts. Consistent hashing keeps redirect lookups cache-friendly.",
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
              body: 'Load Balancer added. Now the Cache.',
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
          title: 'Add In-Memory Cache',
          phases: {
            context: {
              heading: 'Level 1: Step 4',
              body: 'Adding the Cache — serves redirect lookups from Redis.',
            },
            intro: {
              heading: 'Do you know about In-Memory Caches?',
              body: "Before hitting the database, the redirect handler checks Redis. 95% of traffic is redirects — caching makes redirects sub-millisecond.",
            },
            teaching: {
              heading: 'Deep dive: In-Memory Cache',
              body: "Redis stores the code → URL mapping. A redirect checks Redis first. Sub-millisecond lookup. Only 5% of requests (cache misses) hit the database.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'In-Memory Cache', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Load Balancer → In-Memory Cache.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Cache added. Tutorial complete! You have built a URL Shortener.',
            },
          },
          validation: [
            allOf(
              nodeRule('in_memory_cache', 'Cache'),
              edgeRule('load_balancer', 'in_memory_cache')
            ),
          ],
          hints: ['Search for "In-Memory Cache"', 'Connect Load Balancer to it'],
        },
      ],
    },
  ],
};

export default urlShortenerTutorial;