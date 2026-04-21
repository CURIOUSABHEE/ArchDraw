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

const githubTutorial: TutorialDefinition = {
  id: 'github-architecture',
  title: 'How to Design GitHub Architecture',
  description: 'Build a code hosting platform for 100 million developers with 420 million repositories. Learn Git object storage, pull request workflows, CI/CD pipelines, code search, and webhook delivery at scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 30,
  tags: ['code-hosting', 'ci-cd', 'git'],
  icon: 'Github',
  color: '#181717',

  levels: [
    {
      id: 'level-1',
      title: 'Code Hosting Platform',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to GitHub Architecture',
              body: "Let's build GitHub from scratch. 100 million developers, 420 million repositories, and a push that triggers CI/CD pipelines, notifies collaborators, and updates integrations.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: "GitHub's web client is where developers browse code, review pull requests, and manage issues.",
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "GitHub's scale of Git storage alone is staggering. Every commit, every file, every version of every file across 420 million repositories.",
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
              body: 'Adding the API Gateway — handles REST, GraphQL, and Git protocol.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: "GitHub's API Gateway handles REST API v3, GraphQL API v4, and Git protocol requests.",
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "Loading a pull request page used to require 10+ REST API calls. GraphQL lets the client specify exactly what it needs in one request.",
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
              body: 'Adding the Load Balancer — distributes Git operations and API requests.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: "GitHub's Load Balancer distributes traffic across service instances using HAProxy.",
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: "When a popular open-source project releases a new version, thousands of CI systems clone the repository simultaneously. Git operations are stateless, so any server can handle any clone.",
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
              body: 'Adding the Auth Service — handles tokens, OAuth, GitHub Apps, and SSH keys.',
            },
            intro: {
              heading: 'Do you know about Auth Services?',
              body: "GitHub's Auth Service handles personal access tokens, OAuth apps, GitHub Apps, and SSH key authentication.",
            },
            teaching: {
              heading: 'Deep dive: Auth Service',
              body: "GitHub Apps have repository-level permissions — a CI app only gets read access to your code repo, not your private repos.",
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
              body: 'Auth Service added. Tutorial complete! You have built GitHub.',
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

export default githubTutorial;