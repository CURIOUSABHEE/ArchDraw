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

const openclawTutorial: TutorialDefinition = {
  id: 'openclaw-architecture',
  title: 'How to Design OpenClaw Architecture',
  description: 'Build a subscription analytics platform. Learn event ingestion, Kafka streaming, analytics computation, cohort retention, and metrics visualization at scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 15,
  tags: ['analytics', 'subscription', 'metrics'],
  icon: 'BarChart',
  color: '#6366F1',

  levels: [
    {
      id: 'level-1',
      title: 'The Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Mobile Client',
          phases: {
            context: {
              heading: 'Welcome to OpenClaw Architecture',
              body: "Let's build OpenClaw from scratch. Level 1 is the foundation — a system that ingests subscription events, stores them durably, and streams them for downstream processing.",
            },
            intro: {
              heading: 'Do you know about Mobile Clients?',
              body: 'The Mobile Client is the iOS or Android app where analysts check subscription metrics on the go.',
            },
            teaching: {
              heading: 'Deep dive: Mobile Client',
              body: "OpenClaw's mobile app lets executives check MRR, churn rates, and retention metrics from anywhere without being tied to a desktop.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Mobile', and add the mobile client.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'This is the first step, so no connections needed yet.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Mobile Client added. Now the Web Client.',
            },
          },
          validation: [nodeRule('client_mobile', 'Mobile')],
          hints: ['Press ⌘K to open component search', 'Search for "Mobile"'],
        },
        {
          id: 'step-2',
          title: 'Add Web Client',
          phases: {
            context: {
              heading: 'Level 1: Step 2',
              body: 'Adding the Web Client — the browser-based dashboard.',
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: "The Web Client is the browser-based dashboard where analysts build custom reports and set up alerts.",
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "OpenClaw's web dashboard is where analysts build reports, filter by cohort, and export CSVs. Mobile is the executive summary view.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Web', and add the web client.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'This is the second client, so no connections needed yet.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Web Client added. Now the API Gateway.',
            },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Search for "Web"'],
        },
        {
          id: 'step-3',
          title: 'Add API Gateway',
          phases: {
            context: {
              heading: 'Level 1: Step 3',
              body: 'Adding the API Gateway — the single entry point.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: "The API Gateway is the single entry point for all dashboard queries and SDK event ingestion from payment processors.",
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "It is the front door for both data coming in from payment processors (Stripe, Chargebee) and queries coming from the dashboard.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'API Gateway', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Mobile Client → API Gateway, then Web Client → API Gateway.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'API Gateway added. Tutorial complete! You have built OpenClaw.',
            },
          },
          validation: [
            allOf(
              nodeRule('api_gateway', 'API Gateway'),
              edgeRule('client_mobile', 'api_gateway'),
              edgeRule('client_web', 'api_gateway')
            ),
          ],
          hints: ['Search for "API Gateway"', 'Connect both clients to it'],
        },
      ],
    },
  ],
};

export default openclawTutorial;