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

const twitterTutorial: TutorialDefinition = {
  id: 'twitter-architecture',
  title: 'How to Design Twitter Architecture',
  description: 'Build the real-time social network serving 200M+ users. Learn about timeline generation, tweet storage, and high-throughput systems.',
  difficulty: 'advanced',
  estimatedMinutes: 65,
  tags: ['social-media', 'real-time', 'feed'],
  icon: 'Twitter',
  color: '#1DA1F2',

  levels: [
    {
      id: 'level-1',
      title: 'Tweet Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Client',
          phases: {
            context: { heading: 'Welcome to Twitter Architecture', body: 'Building a real-time social network.' },
            intro: { heading: 'About Client', body: 'Clients access Twitter.' },
            teaching: { heading: 'Deep dive: Client', body: 'The Client displays tweets.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Web'." },
            connecting: { heading: 'Connect it up', body: 'First step.' },
            celebration: { heading: 'Great job!', body: 'Client added.' },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Search for "Web"'],
        },
        {
          id: 'step-2',
          title: 'Add API Gateway',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding API Gateway.' },
            intro: { heading: 'About Gateway', body: 'Gateway handles requests.' },
            teaching: { heading: 'Deep dive: API Gateway', body: 'API Gateway routes requests.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'API Gateway'." },
            connecting: { heading: 'Connect it up', body: 'Connect Client → Gateway.' },
            celebration: { heading: 'Great job!', body: 'Gateway added.' },
          },
          validation: [allOf(nodeRule('api_gateway', 'API Gateway'), edgeRule('client_web', 'api_gateway'))],
          hints: ['Search for "API Gateway"'],
        },
        {
          id: 'step-3',
          title: 'Add Tweet Service',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding Tweet Service.' },
            intro: { heading: 'About Tweet Service', body: 'Tweet service handles tweets.' },
            teaching: { heading: 'Deep dive: Tweet Service', body: 'Tweet Service manages tweets.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Tweet Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway → Tweet.' },
            celebration: { heading: 'Great job!', body: 'Tweet Service added.' },
          },
          validation: [allOf(nodeRule('tweet_service', 'Tweet Service'), edgeRule('api_gateway', 'tweet_service'))],
          hints: ['Search for "Tweet Service"'],
        },
        {
          id: 'step-4',
          title: 'Add Database',
          phases: {
            context: { heading: 'Level 1: Step 4', body: 'Adding Database.' },
            intro: { heading: 'About Database', body: 'Database stores tweets.' },
            teaching: { heading: 'Deep dive: Database', body: 'Database stores tweets.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'NoSQL Database'." },
            connecting: { heading: 'Connect it up', body: 'Connect Tweet → Database.' },
            celebration: { heading: 'Level 1 Complete!', body: 'Foundation ready!' },
          },
          validation: [allOf(nodeRule('nosql_db', 'NoSQL Database'), edgeRule('tweet_service', 'nosql_db'))],
          hints: ['Search for "NoSQL Database"'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-5',
          title: 'Add Timeline Service',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding Timeline Service.' },
            intro: { heading: 'About Timeline', body: 'Timeline generates feeds.' },
            teaching: { heading: 'Deep dive: Timeline', body: 'Timeline Service generates feeds.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Timeline Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Gateway.' },
            celebration: { heading: 'Level 2 Complete!', body: 'Production ready!' },
          },
          validation: [nodeRule('timeline_service', 'Timeline Service')],
          hints: ['Search for "Timeline Service"'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-6',
          title: 'Add Cache',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Cache.' },
            intro: { heading: 'About Cache', body: 'Cache improves performance.' },
            teaching: { heading: 'Deep dive: Cache', body: 'Cache stores frequently accessed data.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Cache'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Timeline.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed Twitter!" },
          },
          validation: [nodeRule('cache', 'Cache')],
          hints: ['Search for "Cache"'],
        },
      ],
    },
  ],
};

export default twitterTutorial;