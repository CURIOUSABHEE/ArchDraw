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

const stripeTutorial: TutorialDefinition = {
  id: 'stripe-architecture',
  title: 'How to Design Stripe Architecture',
  description: 'Build the payments platform that processes billions of dollars. Learn about payment processing, idempotency, and financial compliance.',
  difficulty: 'advanced',
  estimatedMinutes: 70,
  tags: ['payments', 'fintech', 'compliance'],
  icon: 'CreditCard',
  color: '#635BFF',

  levels: [
    {
      id: 'level-1',
      title: 'Payments Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Client',
          phases: {
            context: { heading: 'Welcome to Stripe Architecture', body: 'Building a payments platform processing billions of dollars.' },
            intro: { heading: 'About Client', body: 'The Client initiates payments.' },
            teaching: { heading: 'Deep dive: Client', body: 'The Client collects payment information.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Client'." },
            connecting: { heading: 'Connect it up', body: 'First step.' },
            celebration: { heading: 'Great job!', body: 'Client added.' },
          },
          validation: [nodeRule('client', 'Client')],
          hints: ['Search for "Client"'],
        },
        {
          id: 'step-2',
          title: 'Add API Gateway',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding API Gateway.' },
            intro: { heading: 'About Gateway', body: 'API Gateway handles requests.' },
            teaching: { heading: 'Deep dive: API Gateway', body: 'The API Gateway handles payment requests.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'API Gateway'." },
            connecting: { heading: 'Connect it up', body: 'Connect Client → Gateway.' },
            celebration: { heading: 'Great job!', body: 'Gateway added.' },
          },
          validation: [allOf(nodeRule('api_gateway', 'API Gateway'), edgeRule('client', 'api_gateway'))],
          hints: ['Search for "API Gateway"'],
        },
        {
          id: 'step-3',
          title: 'Add Payment Service',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding Payment Service.' },
            intro: { heading: 'About Payment Service', body: 'Payment services process payments.' },
            teaching: { heading: 'Deep dive: Payment Service', body: 'The Payment Service processes transactions.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Payment Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway → Payment.' },
            celebration: { heading: 'Great job!', body: 'Payment Service added.' },
          },
          validation: [allOf(nodeRule('payment_service', 'Payment Service'), edgeRule('api_gateway', 'payment_service'))],
          hints: ['Search for "Payment Service"'],
        },
        {
          id: 'step-4',
          title: 'Add Payment Gateway',
          phases: {
            context: { heading: 'Level 1: Step 4', body: 'Adding Payment Gateway for processor connection.' },
            intro: { heading: 'About Payment Gateway', body: 'Payment gateways connect to processors.' },
            teaching: { heading: 'Deep dive: Payment Gateway', body: 'The Payment Gateway connects to card networks.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Payment Gateway'." },
            connecting: { heading: 'Connect it up', body: 'Connect Payment → Gateway.' },
            celebration: { heading: 'Great job!', body: 'Payment Gateway added.' },
          },
          validation: [allOf(nodeRule('payment_gateway', 'Payment Gateway'), edgeRule('payment_service', 'payment_gateway'))],
          hints: ['Search for "Payment Gateway"'],
        },
        {
          id: 'step-5',
          title: 'Add Ledger',
          phases: {
            context: { heading: 'Level 1: Step 5', body: 'Adding Ledger for financial records.' },
            intro: { heading: 'About Ledger', body: 'Ledgers track financial transactions.' },
            teaching: { heading: 'Deep dive: Ledger', body: 'The Ledger tracks every transaction entry.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Ledger'." },
            connecting: { heading: 'Connect it up', body: 'Connect Payment Service → Ledger.' },
            celebration: { heading: 'Level 1 Complete!', body: 'Foundation ready!' },
          },
          validation: [allOf(nodeRule('ledger', 'Ledger'), edgeRule('payment_service', 'ledger'))],
          hints: ['Search for "Ledger"'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Layer',
      steps: [
        {
          id: 'step-6',
          title: 'Add Auth Service',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding Auth Service.' },
            intro: { heading: 'About Auth', body: 'Auth validates requests.' },
            teaching: { heading: 'Deep dive: Auth Service', body: 'The Auth Service validates API keys.' },
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
          id: 'step-7',
          title: 'Add Webhook Handler',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Webhook Handler.' },
            intro: { heading: 'About Webhooks', body: 'Webhooks notify of events.' },
            teaching: { heading: 'Deep dive: Webhook Handler', body: 'The Webhook Handler sends event notifications.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Webhook Handler'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Payment Service.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed Stripe!" },
          },
          validation: [nodeRule('webhook_handler', 'Webhook Handler')],
          hints: ['Search for "Webhook Handler"'],
        },
      ],
    },
  ],
};

export default stripeTutorial;