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

const aiAgentTutorial: TutorialDefinition = {
  id: 'ai-agent-system-architecture',
  title: 'How to Design AI Agent System Architecture',
  description: 'Build a production AI agent system. Learn multi-agent orchestration, tool calling, memory systems, agent supervision, and LangGraph-style workflows that power autonomous AI systems.',
  difficulty: 'advanced',
  estimatedMinutes: 30,
  tags: ['ai', 'agents', 'orchestration'],
  icon: 'Bot',
  color: '#7C3AED',

  levels: [
    {
      id: 'level-1',
      title: 'Multi-Agent Orchestration',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to AI Agent System Architecture',
              body: "Let's build an AI Agent System from scratch. AI agents are LLMs that take actions — they plan, use tools, make decisions, and learn from feedback.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: 'The client is a chat interface that sends a goal to the agent system.',
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "AI agents change the user interaction model. Instead of one question → one answer, the user gives a goal and the agent autonomously plans and executes steps.",
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
              body: 'Adding the API Gateway — enforces token budgets and rate limits.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: 'The API Gateway handles agent requests with token budgets preventing runaway execution.',
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "AI agents consume tokens rapidly — a single agent loop can generate thousands of tokens. Token budgets are what make agents economically viable.",
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
              body: 'API Gateway added. Now the Agent Orchestrator.',
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
          title: 'Add Agent Orchestrator',
          phases: {
            context: {
              heading: 'Level 1: Step 3',
              body: 'Adding the Agent Orchestrator — decomposes goals into sub-tasks.',
            },
            intro: {
              heading: 'Do you know about Agent Orchestrators?',
              body: 'The Agent Orchestrator decomposes the user goal into sub-tasks and assigns them to specialized agents.',
            },
            teaching: {
              heading: 'Deep dive: Agent Orchestrator',
              body: "Given a goal like 'research competitors and draft a report', the orchestrator decomposes into: identify competitors, search, extract data, draft report.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Agent Orchestrator', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect API Gateway → Agent Orchestrator.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Agent Orchestrator added. Tutorial complete! You have built an AI Agent System.',
            },
          },
          validation: [
            allOf(
              nodeRule('agent_orchestrator', 'Agent'),
              edgeRule('api_gateway', 'agent_orchestrator')
            ),
          ],
          hints: ['Search for "Agent Orchestrator"', 'Connect API Gateway to it'],
        },
      ],
    },
  ],
};

export default aiAgentTutorial;