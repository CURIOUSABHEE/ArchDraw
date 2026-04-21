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

const airbnbTutorial: TutorialDefinition = {
  id: 'airbnb-architecture',
  title: 'How to Design Airbnb Architecture',
  description: 'Build the global rental marketplace. Learn about geo-search, dynamic pricing, and two-sided trust systems.',
  difficulty: 'intermediate',
  estimatedMinutes: 45,
  tags: ['marketplace', 'geo-search', 'booking'],
  icon: 'Home',
  color: '#FF5A5F',

  levels: [
    {
      id: 'level-1',
      title: 'Marketplace Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Guest App',
          phases: {
            context: { heading: 'Welcome to Airbnb Architecture', body: 'Building a global rental marketplace.' },
            intro: { heading: 'About Guest App', body: 'Guests search and book stays.' },
            teaching: { heading: 'Deep dive: Guest App', body: 'Guest App lets users search and book.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Web'." },
            connecting: { heading: 'Connect it up', body: 'First step.' },
            celebration: { heading: 'Great job!', body: 'Guest App added.' },
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
          title: 'Add Search Service',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding Search Service.' },
            intro: { heading: 'About Search', body: 'Search finds listings.' },
            teaching: { heading: 'Deep dive: Search', body: 'Search Service finds listings.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Search Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway → Search.' },
            celebration: { heading: 'Level 1 Complete!', body: 'Foundation ready!' },
          },
          validation: [allOf(nodeRule('search_service', 'Search Service'), edgeRule('api_gateway', 'search_service'))],
          hints: ['Search for "Search Service"'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-4',
          title: 'Add Database',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding Database.' },
            intro: { heading: 'About Database', body: 'Database stores data.' },
            teaching: { heading: 'Deep dive: Database', body: 'Database stores listings.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Database'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Search.' },
            celebration: { heading: 'Level 2 Complete!', body: 'Production ready!' },
          },
          validation: [nodeRule('database', 'Database')],
          hints: ['Search for "Database"'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-5',
          title: 'Add Payment Service',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Payment Service.' },
            intro: { heading: 'About Payments', body: 'Payments handle money.' },
            teaching: { heading: 'Deep dive: Payment', body: 'Payment Service processes payments.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Payment Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Gateway.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed Airbnb!" },
          },
          validation: [nodeRule('payment_service', 'Payment Service')],
          hints: ['Search for "Payment Service"'],
        },
      ],
    },
  ],
};

export default airbnbTutorial;