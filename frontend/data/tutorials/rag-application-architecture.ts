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

const ragTutorial: TutorialDefinition = {
  id: 'rag-application-architecture',
  title: 'How to Design RAG Application Architecture',
  description: 'Build a production RAG (Retrieval-Augmented Generation) system. Learn document ingestion, chunking strategies, vector embeddings, semantic search, reranking, and LLM synthesis at scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 25,
  tags: ['ai', 'llm', 'embeddings'],
  icon: 'Brain',
  color: '#7C3AED',

  levels: [
    {
      id: 'level-1',
      title: 'Production RAG System',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to RAG Architecture',
              body: "Let's build a production RAG system from scratch. RAG combines your private data with LLMs — the system retrieves relevant documents and feeds them to the LLM as context.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: 'The client is a chat interface where users ask questions in natural language.',
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "The client is a Q&A interface. Users ask questions, the RAG system retrieves relevant documents, and the LLM synthesizes an answer.",
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
              body: 'Adding the API Gateway — routes query and ingestion requests.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: 'All requests flow through the API Gateway — both Q&A and ingestion flows.',
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "The API Gateway handles two flows: query routing and document ingestion. Both need auth and rate limiting, but at very different scales.",
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
              body: 'Adding the Load Balancer — distributes query and ingestion traffic.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: "The Load Balancer distributes both query and ingestion requests across application servers.",
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: "RAG systems are read-heavy on queries (latency-critical) and write-heavy on ingestion (throughput-critical).",
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
              body: 'Load Balancer added. Now the LLM API.',
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
          title: 'Add LLM API',
          phases: {
            context: {
              heading: 'Level 1: Step 4',
              body: 'Adding the LLM API — synthesizes answers with retrieved context.',
            },
            intro: {
              heading: 'Do you know about LLM APIs?',
              body: "The LLM API (GPT-4, Claude, Gemini) synthesizes the final answer with retrieved document context.",
            },
            teaching: {
              heading: 'Deep dive: LLM API',
              body: "Without RAG, LLMs hallucinate. With RAG, the LLM uses retrieved documents as context — making answers accurate and grounded.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'LLM API', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Load Balancer → LLM API.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'LLM API added. Tutorial complete! You have built a RAG system.',
            },
          },
          validation: [
            allOf(
              nodeRule('llm_api', 'LLM'),
              edgeRule('load_balancer', 'llm_api')
            ),
          ],
          hints: ['Search for "LLM API"', 'Connect Load Balancer to it'],
        },
      ],
    },
  ],
};

export default ragTutorial;