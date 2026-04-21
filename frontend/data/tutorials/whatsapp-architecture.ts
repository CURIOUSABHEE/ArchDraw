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

const whatsappTutorial: TutorialDefinition = {
  id: 'whatsapp-architecture',
  title: 'How to Design WhatsApp Architecture',
  description: 'Build the messaging platform that powers 2 billion users. Learn about end-to-end encryption, message delivery, and voice calls at global scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 55,
  tags: ['messaging', 'encryption', 'voice'],
  icon: 'MessageCircle',
  color: '#25D366',

  levels: [
    {
      id: 'level-1',
      title: 'Messaging Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Mobile Client',
          phases: {
            context: { heading: 'Welcome to WhatsApp Architecture', body: 'Building a messaging platform for 2 billion users.' },
            intro: { heading: 'About Clients', body: 'The Mobile Client is the primary interface.' },
            teaching: { heading: 'Deep dive: Mobile Client', body: 'The Mobile Client sends and receives messages.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Mobile'." },
            connecting: { heading: 'Connect it up', body: 'First step.' },
            celebration: { heading: 'Great job!', body: 'Client added.' },
          },
          validation: [nodeRule('client_mobile', 'Mobile')],
          hints: ['Search for "Mobile"'],
        },
        {
          id: 'step-2',
          title: 'Add API Gateway',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding API Gateway.' },
            intro: { heading: 'About Gateway', body: 'API Gateway routes requests.' },
            teaching: { heading: 'Deep dive: API Gateway', body: 'The API Gateway handles message routing.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'API Gateway'." },
            connecting: { heading: 'Connect it up', body: 'Connect Mobile → Gateway.' },
            celebration: { heading: 'Great job!', body: 'Gateway added.' },
          },
          validation: [allOf(nodeRule('api_gateway', 'API Gateway'), edgeRule('client_mobile', 'api_gateway'))],
          hints: ['Search for "API Gateway"'],
        },
        {
          id: 'step-3',
          title: 'Add Message Service',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding Message Service.' },
            intro: { heading: 'About Message Service', body: 'Message services handle chat.' },
            teaching: { heading: 'Deep dive: Message Service', body: 'The Message Service delivers messages.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Message Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway → Message.' },
            celebration: { heading: 'Great job!', body: 'Message Service added.' },
          },
          validation: [allOf(nodeRule('message_service', 'Message Service'), edgeRule('api_gateway', 'message_service'))],
          hints: ['Search for "Message Service"'],
        },
        {
          id: 'step-4',
          title: 'Add Database',
          phases: {
            context: { heading: 'Level 1: Step 4', body: 'Adding Database.' },
            intro: { heading: 'About Database', body: 'Databases store messages.' },
            teaching: { heading: 'Deep dive: Database', body: 'The Database stores messages permanently.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Database'." },
            connecting: { heading: 'Connect it up', body: 'Connect Message → Database.' },
            celebration: { heading: 'Level 1 Complete!', body: 'Foundation ready!' },
          },
          validation: [allOf(nodeRule('database', 'Database'), edgeRule('message_service', 'database'))],
          hints: ['Search for "Database"'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Layer',
      steps: [
        {
          id: 'step-5',
          title: 'Add Auth Service',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding Auth Service.' },
            intro: { heading: 'About Auth', body: 'Auth validates users.' },
            teaching: { heading: 'Deep dive: Auth Service', body: 'The Auth Service validates users.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Auth Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway → Auth.' },
            celebration: { heading: 'Level 2 Complete!', body: 'Production layer ready!' },
          },
          validation: [allOf(nodeRule('auth_service', 'Auth Service'), edgeRule('api_gateway', 'auth_service'))],
          hints: ['Search for "Auth Service"'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-6',
          title: 'Add Voice Service',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Voice Service.' },
            intro: { heading: 'About Voice', body: 'Voice services handle calls.' },
            teaching: { heading: 'Deep dive: Voice Service', body: 'The Voice Service handles voice calls.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Voice Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect Mobile → Voice.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed WhatsApp!" },
          },
          validation: [edgeRule('client_mobile', 'message_service') ? nodeRule('voice_service', 'Voice Service') : nodeRule('voice_service', 'Voice Service')],
          hints: ['Search for "Voice Service"'],
        },
      ],
    },
  ],
};

export default whatsappTutorial;