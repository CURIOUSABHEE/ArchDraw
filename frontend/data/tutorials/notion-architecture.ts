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

const notionTutorial: TutorialDefinition = {
  id: 'notion-architecture',
  title: 'How to Design Notion Architecture',
  description: 'Build the all-in-one workspace used by millions. Learn about block-based storage, real-time collaboration, and rich text editing.',
  difficulty: 'intermediate',
  estimatedMinutes: 50,
  tags: ['collaboration', 'productivity', 'real-time'],
  icon: 'FileText',
  color: '#000000',

  levels: [
    {
      id: 'level-1',
      title: 'Workspace Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Client',
          phases: {
            context: { heading: 'Welcome to Notion Architecture', body: 'Building the all-in-one workspace.' },
            intro: { heading: 'About Client', body: 'Clients access Notion.' },
            teaching: { heading: 'Deep dive: Client', body: 'The Client provides the UI.' },
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
          title: 'Add Block Service',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding Block Service.' },
            intro: { heading: 'About Block Service', body: 'Block services manage content.' },
            teaching: { heading: 'Deep dive: Block Service', body: 'Block Service manages blocks.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Block Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway → Block.' },
            celebration: { heading: 'Level 1 Complete!', body: 'Foundation ready!' },
          },
          validation: [allOf(nodeRule('block_service', 'Block Service'), edgeRule('api_gateway', 'block_service'))],
          hints: ['Search for "Block Service"'],
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
            teaching: { heading: 'Deep dive: Database', body: 'Database stores content.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Database'." },
            connecting: { heading: 'Connect it up', body: 'Connect Block → Database.' },
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
          title: 'Add Real-time Service',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Real-time Service.' },
            intro: { heading: 'About Real-time', body: 'Real-time syncs updates.' },
            teaching: { heading: 'Deep dive: Real-time', body: 'Real-time service syncs changes.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Real-time'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Gateway.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed Notion!" },
          },
          validation: [nodeRule('realtime_service', 'Real-time Service')],
          hints: ['Search for "Real-time"'],
        },
      ],
    },
  ],
};

export default notionTutorial;