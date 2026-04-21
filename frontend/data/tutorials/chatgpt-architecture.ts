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

function anyOf(...rules: ValidationRule[]): ValidationRule {
  return { type: 'any_of', rules };
}

const chatgptTutorial: TutorialDefinition = {
  id: 'chatgpt-architecture',
  title: 'How to Design ChatGPT Architecture',
  description: 'Build a production-ready AI inference system from scratch. Learn how LLMs, vector databases, RAG pipelines, and streaming services work together at OpenAI scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 60,
  tags: ['LLM', 'Vector DB', 'RAG', 'AI', 'GPT'],
  icon: 'Brain',
  color: '#ec4899',

  levels: [
    {
      id: 'level-1',
      title: 'The Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Mobile Client',
          phases: {
            context: {
              heading: 'Welcome to ChatGPT Architecture',
              body: "Let's build ChatGPT from scratch. Level 1 is the minimum viable system — 8 components that receive a message, process it through an LLM, and return a response.",
            },
            intro: {
              heading: 'Do you know about Mobile Clients?',
              body: 'The Mobile Client is the iOS or Android app where users type messages and read AI responses.',
            },
            teaching: {
              heading: 'Deep dive: Mobile Client',
              body: 'The Mobile Client is the iOS or Android app where users type messages and read AI responses. Over 60% of ChatGPT usage comes from mobile — it is the primary client for most users.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K and search for 'Mobile' to add the primary client to the canvas.",
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
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Level 1: Step 2',
              body: 'Now adding the Web Client — the browser interface.',
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: 'The Web Client is the browser interface where users type messages.',
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "The Web Client is the browser interface where users type messages and read AI responses. It is the second client entry point — architecturally identical to mobile in what it sends and receives.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K and search for 'Web' to add the secondary client.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'This is the second client, so no connections needed yet.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Web Client added. Now the CDN.',
            },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Press ⌘K to open component search', 'Search for "Web"'],
        },
        {
          id: 'step-3',
          title: 'Add CDN',
          phases: {
            context: {
              heading: 'Level 1: Step 3',
              body: 'Adding the CDN — Content Delivery Network.',
            },
            intro: {
              heading: 'Do you know about CDNs?',
              body: 'CDNs serve static assets from edge servers close to users.',
            },
            teaching: {
              heading: 'Deep dive: CDN',
              body: 'The CDN serves static assets — CSS, JavaScript, fonts — from edge servers close to each user. It also serves cached AI responses.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'CDN', and add it to the canvas.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Mobile Client → CDN and Web Client → CDN.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'CDN added and connected. Now the API Gateway.',
            },
          },
          validation: [
            allOf(
              nodeRule('cdn', 'CDN'),
              edgeRule('client_mobile', 'cdn'),
              edgeRule('client_web', 'cdn')
            ),
          ],
          hints: ['Search for "CDN"', 'Connect both clients to CDN'],
        },
        {
          id: 'step-4',
          title: 'Add API Gateway',
          phases: {
            context: {
              heading: 'Level 1: Step 4',
              body: 'Adding the API Gateway — the front door for all dynamic requests.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: 'API Gateways route requests and enforce rate limits.',
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: 'The API Gateway receives every chat message sent by every user and routes it to the correct backend service. It enforces rate limits.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'API Gateway', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Mobile Client → API Gateway, Web Client → API Gateway, and CDN → API Gateway.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'API Gateway added and connected. Now the Load Balancer.',
            },
          },
          validation: [
            allOf(
              nodeRule('api_gateway', 'API Gateway'),
              edgeRule('client_mobile', 'api_gateway'),
              edgeRule('client_web', 'api_gateway'),
              edgeRule('cdn', 'api_gateway')
            ),
          ],
          hints: ['Search for "API Gateway"', 'Connect both clients and CDN to it'],
        },
        {
          id: 'step-5',
          title: 'Add Load Balancer',
          phases: {
            context: {
              heading: 'Level 1: Step 5',
              body: 'Adding the Load Balancer — distributes traffic across servers.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: 'Load Balancers distribute incoming requests across multiple servers.',
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: 'The Load Balancer distributes incoming requests across multiple chat servers so no single server is overwhelmed.',
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
              body: 'Load Balancer added and connected. Now the Chat Service.',
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
          id: 'step-6',
          title: 'Add Chat Service',
          phases: {
            context: {
              heading: 'Level 1: Step 6',
              body: 'Adding the Chat Service — the brain of the operation.',
            },
            intro: {
              heading: 'Do you know about Microservices?',
              body: 'Microservices handle specific business logic.',
            },
            teaching: {
              heading: 'Deep dive: Chat Service',
              body: 'The Chat Service orchestrates the entire conversation flow — it receives messages, manages context, calls the LLM, and streams the response back.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Microservice', and add the Chat Service.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Load Balancer → Chat Service.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Chat Service added and connected. Now the LLM API.',
            },
          },
          validation: [
            allOf(
              nodeRule('microservice', 'Microservice'),
              edgeRule('load_balancer', 'microservice')
            ),
          ],
          hints: ['Search for "Microservice"', 'Connect Load Balancer to it'],
        },
        {
          id: 'step-7',
          title: 'Add LLM API',
          phases: {
            context: {
              heading: 'Level 1: Step 7',
              body: 'Adding the LLM API — where GPT generates responses.',
            },
            intro: {
              heading: 'Do you know about LLMs?',
              body: 'LLMs (Large Language Models) generate human-like text.',
            },
            teaching: {
              heading: 'Deep dive: LLM API',
              body: 'The LLM API receives the formatted prompt and generates a response token by token using GPT. Everything else in the architecture exists to get the right prompt here and return the response.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'LLM API', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Chat Service → LLM API.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'LLM API added and connected. Now the NoSQL Database.',
            },
          },
          validation: [
            allOf(
              nodeRule('llm_api', 'LLM API'),
              edgeRule('microservice', 'llm_api')
            ),
          ],
          hints: ['Search for "LLM API"', 'Connect Chat Service to it'],
        },
        {
          id: 'step-8',
          title: 'Add NoSQL Database',
          phases: {
            context: {
              heading: 'Level 1: Step 8',
              body: 'Adding the NoSQL Database — stores conversation history.',
            },
            intro: {
              heading: 'Do you know about NoSQL Databases?',
              body: 'NoSQL databases handle unstructured data like conversation logs.',
            },
            teaching: {
              heading: 'Deep dive: NoSQL Database',
              body: 'The NoSQL Database stores every conversation — all messages, all responses, all conversation metadata per user.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'NoSQL Database', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Chat Service → NoSQL Database.',
            },
            celebration: {
              heading: 'Level 1 Complete!',
              body: 'You have a working AI chat foundation!',
            },
          },
          validation: [
            allOf(
              nodeRule('nosql_db', 'NoSQL Database'),
              edgeRule('microservice', 'nosql_db')
            ),
          ],
          hints: ['Search for "NoSQL Database"', 'Connect Chat Service to it'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-9',
          title: 'Add Auth Service',
          phases: {
            context: {
              heading: 'Level 2: Step 1',
              body: 'Now adding what OpenAI actually runs in production — auth with subscription tiers.',
            },
            intro: {
              heading: 'Do you know about Auth Services?',
              body: 'Auth Services validate tokens and check permissions.',
            },
            teaching: {
              heading: 'Deep dive: Auth Service',
              body: 'The Auth Service validates JWT tokens AND checks subscription tier — free vs Plus vs Enterprise — in every request.',
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
              body: 'Auth Service added. Now the SQL Database.',
            },
          },
          validation: [
            allOf(
              nodeRule('auth_service', 'Auth Service'),
              edgeRule('load_balancer', 'auth_service')
            ),
          ],
          hints: ['Search for "Auth Service"', 'Connect Load Balancer to it'],
        },
        {
          id: 'step-10',
          title: 'Add SQL Database',
          phases: {
            context: {
              heading: 'Level 2: Step 2',
              body: 'Adding the SQL Database — stores user accounts and billing.',
            },
            intro: {
              heading: 'Do you know about SQL Databases?',
              body: 'SQL databases provide ACID transaction guarantees.',
            },
            teaching: {
              heading: 'Deep dive: SQL Database',
              body: 'The SQL Database stores user accounts, subscription status, billing records, and API usage quotas.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'SQL Database', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Auth Service → SQL Database.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'SQL Database added. Now the In-Memory Cache.',
            },
          },
          validation: [
            allOf(
              nodeRule('sql_db', 'SQL Database'),
              edgeRule('auth_service', 'sql_db')
            ),
          ],
          hints: ['Search for "SQL Database"', 'Connect Auth Service to it'],
        },
        {
          id: 'step-11',
          title: 'Add In-Memory Cache',
          phases: {
            context: {
              heading: 'Level 2: Step 3',
              body: 'Adding the In-Memory Cache — Redis for fast responses.',
            },
            intro: {
              heading: 'Do you know about In-Memory Caches?',
              body: 'In-memory caches store data in RAM for instant access.',
            },
            teaching: {
              heading: 'Deep dive: In-Memory Cache',
              body: 'The In-Memory Cache stores active conversation context so the Chat Service does not re-fetch conversation history from the database on every message.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'In-Memory Cache', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Chat Service → In-Memory Cache.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'In-Memory Cache added. Now the Embedding Service.',
            },
          },
          validation: [
            allOf(
              nodeRule('in_memory_cache', 'In-Memory Cache'),
              edgeRule('microservice', 'in_memory_cache')
            ),
          ],
          hints: ['Search for "In-Memory Cache"', 'Connect Chat Service to it'],
        },
        {
          id: 'step-12',
          title: 'Add Embedding Service',
          phases: {
            context: {
              heading: 'Level 2: Step 4',
              body: 'Adding the Embedding Service — converts text to vectors.',
            },
            intro: {
              heading: 'Do you know about Embeddings?',
              body: 'Embeddings convert text to numerical vectors for semantic search.',
            },
            teaching: {
              heading: 'Deep dive: Embedding Service',
              body: 'The Embedding Service converts every message into a vector representation so similar past conversations can be retrieved for context injection.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Embedding Service', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Chat Service → Embedding Service.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Embedding Service added. Now the Vector Database.',
            },
          },
          validation: [
            allOf(
              nodeRule('embedding_service', 'Embedding Service'),
              edgeRule('microservice', 'embedding_service')
            ),
          ],
          hints: ['Search for "Embedding Service"', 'Connect Chat Service to it'],
        },
        {
          id: 'step-13',
          title: 'Add Vector Database',
          phases: {
            context: {
              heading: 'Level 2: Step 5',
              body: 'Adding the Vector Database — stores embeddings for semantic search.',
            },
            intro: {
              heading: 'Do you know about Vector Databases?',
              body: 'Vector databases store numerical embeddings for similarity search.',
            },
            teaching: {
              heading: 'Deep dive: Vector Database',
              body: 'The Vector Database stores billions of message embeddings and retrieves the most semantically relevant past context for any new user message.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Vector Database', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Embedding Service → Vector Database.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Vector Database added. Now the RAG Pipeline.',
            },
          },
          validation: [
            allOf(
              nodeRule('vector_db', 'Vector Database'),
              edgeRule('embedding_service', 'vector_db')
            ),
          ],
          hints: ['Search for "Vector Database"', 'Connect Embedding Service to it'],
        },
        {
          id: 'step-14',
          title: 'Add RAG Pipeline',
          phases: {
            context: {
              heading: 'Level 2: Step 6',
              body: 'Adding the RAG Pipeline — retrieves context for the LLM.',
            },
            intro: {
              heading: 'Do you know about RAG?',
              body: 'RAG (Retrieval Augmented Generation) adds context to LLM prompts.',
            },
            teaching: {
              heading: 'Deep dive: RAG Pipeline',
              body: 'The RAG Pipeline retrieves relevant past conversation chunks from the vector database and injects them into the prompt before sending to the LLM.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'RAG Pipeline', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Vector Database → RAG Pipeline, then RAG Pipeline → LLM API.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'RAG Pipeline added. Now the Message Queue.',
            },
          },
          validation: [
            allOf(
              nodeRule('rag_pipeline', 'RAG Pipeline'),
              edgeRule('vector_db', 'rag_pipeline'),
              edgeRule('rag_pipeline', 'llm_api')
            ),
          ],
          hints: ['Search for "RAG Pipeline"', 'Connect Vector DB to RAG, then RAG to LLM API'],
        },
        {
          id: 'step-15',
          title: 'Add Message Queue',
          phases: {
            context: {
              heading: 'Level 2: Step 7',
              body: 'Adding the Message Queue — handles async tasks.',
            },
            intro: {
              heading: 'Do you know about Message Queues?',
              body: 'Message queues handle asynchronous task processing.',
            },
            teaching: {
              heading: 'Deep dive: Message Queue',
              body: 'The Message Queue queues async tasks like usage tracking, conversation indexing, and billing updates so they do not slow down the response.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Message Queue', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Chat Service → Message Queue.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Message Queue added. Now the Logger.',
            },
          },
          validation: [
            allOf(
              nodeRule('message_queue', 'Message Queue'),
              edgeRule('microservice', 'message_queue')
            ),
          ],
          hints: ['Search for "Message Queue"', 'Connect Chat Service to it'],
        },
        {
          id: 'step-16',
          title: 'Add Logger',
          phases: {
            context: {
              heading: 'Level 2: Step 8',
              body: 'Adding the Logger — captures logs for debugging.',
            },
            intro: {
              heading: 'Do you know about Loggers?',
              body: 'Loggers capture structured logs for debugging and compliance.',
            },
            teaching: {
              heading: 'Deep dive: Logger',
              body: 'The Logger captures structured logs of every request including model used, tokens consumed, latency, and any errors.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Logger', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Chat Service → Logger.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Logger added. Now the Metrics Collector.',
            },
          },
          validation: [
            allOf(
              nodeRule('logger', 'Logger'),
              edgeRule('microservice', 'logger')
            ),
          ],
          hints: ['Search for "Logger"', 'Connect Chat Service to it'],
        },
        {
          id: 'step-17',
          title: 'Add Metrics Collector',
          phases: {
            context: {
              heading: 'Level 2: Step 9',
              body: 'Adding the Metrics Collector — aggregates real-time metrics.',
            },
            intro: {
              heading: 'Do you know about Metrics Collectors?',
              body: 'Metrics collectors aggregate performance data.',
            },
            teaching: {
              heading: 'Deep dive: Metrics Collector',
              body: 'The Metrics Collector aggregates real-time metrics on response latency, error rates, token throughput, and GPU utilization.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Metrics Collector', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Logger → Metrics Collector.',
            },
            celebration: {
              heading: 'Level 2 Complete!',
              body: 'You have a production-ready ChatGPT architecture!',
            },
          },
          validation: [
            allOf(
              nodeRule('metrics_collector', 'Metrics Collector'),
              edgeRule('logger', 'metrics_collector')
            ),
          ],
          hints: ['Search for "Metrics Collector"', 'Connect Logger to it'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-18',
          title: 'Add Rate Limiter',
          phases: {
            context: {
              heading: 'Level 3: Step 1',
              body: 'Adding the Rate Limiter — enforces API rate limits.',
            },
            intro: {
              heading: 'Do you know about Rate Limiters?',
              body: 'Rate limiters prevent abuse by limiting requests per user.',
            },
            teaching: {
              heading: 'Deep dive: Rate Limiter',
              body: 'The Rate Limiter enforces API rate limits per user — free users get fewer requests than Plus subscribers.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Rate Limiter', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Auth Service → Rate Limiter.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Rate Limiter added. Now the API Docs.',
            },
          },
          validation: [
            allOf(
              nodeRule('rate_limiter', 'Rate Limiter'),
              edgeRule('auth_service', 'rate_limiter')
            ),
          ],
          hints: ['Search for "Rate Limiter"', 'Connect Auth Service to it'],
        },
        {
          id: 'step-19',
          title: 'Add API Docs',
          phases: {
            context: {
              heading: 'Level 3: Step 2',
              body: 'Adding API Docs — developer documentation.',
            },
            intro: {
              heading: 'Do you know about API Docs?',
              body: 'API documentation helps developers integrate with your API.',
            },
            teaching: {
              heading: 'Deep dive: API Docs',
              body: 'The API Docs provide interactive documentation for developers building on the ChatGPT API.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'API Docs', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Rate Limiter → API Docs.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'API Docs added. Now the CDN Cache Invalidation.',
            },
          },
          validation: [
            allOf(
              nodeRule('api_docs', 'API Docs'),
              edgeRule('rate_limiter', 'api_docs')
            ),
          ],
          hints: ['Search for "API Docs"', 'Connect Rate Limiter to it'],
        },
        {
          id: 'step-20',
          title: 'Add CDN Cache Invalidation',
          phases: {
            context: {
              heading: 'Level 3: Step 3',
              body: 'Adding CDN Cache Invalidation — manages cached responses.',
            },
            intro: {
              heading: 'Do you know about Cache Invalidation?',
              body: 'Cache invalidation removes stale cached data.',
            },
            teaching: {
              heading: 'Deep dive: CDN Cache Invalidation',
              body: 'The CDN Cache Invalidation triggers when cached responses become stale and need refresh.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'CDN Cache Invalidation', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect CDN → CDN Cache Invalidation.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'CDN Cache Invalidation added. Now the Streaming Service.',
            },
          },
          validation: [
            allOf(
              nodeRule('cdn_cache_invalidation', 'CDN Cache Invalidation'),
              edgeRule('cdn', 'cdn_cache_invalidation')
            ),
          ],
          hints: ['Search for "CDN Cache Invalidation"', 'Connect CDN to it'],
        },
        {
          id: 'step-21',
          title: 'Add Streaming Service',
          phases: {
            context: {
              heading: 'Level 3: Step 4',
              body: 'Adding the Streaming Service — streams LLM tokens in real-time.',
            },
            intro: {
              heading: 'Do you know about Streaming?',
              body: 'Streaming delivers tokens as they are generated, not all at once.',
            },
            teaching: {
              heading: 'Deep dive: Streaming Service',
              body: 'The Streaming Service streams LLM tokens back to clients in real-time using Server-Sent Events (SSE).',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Streaming Service', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect LLM API → Streaming Service.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Streaming Service added. Now the WebSocket Server.',
            },
          },
          validation: [
            allOf(
              nodeRule('streaming_service', 'Streaming Service'),
              edgeRule('llm_api', 'streaming_service')
            ),
          ],
          hints: ['Search for "Streaming Service"', 'Connect LLM API to it'],
        },
        {
          id: 'step-22',
          title: 'Add WebSocket Server',
          phases: {
            context: {
              heading: 'Level 3: Step 5',
              body: 'Adding the WebSocket Server — real-time bidirectional communication.',
            },
            intro: {
              heading: 'Do you know about WebSockets?',
              body: 'WebSockets enable real-time bidirectional communication.',
            },
            teaching: {
              heading: 'Deep dive: WebSocket Server',
              body: 'The WebSocket Server maintains persistent connections for real-time updates to clients.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'WebSocket Server', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Streaming Service → WebSocket Server.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'WebSocket Server added. Now the Tracing Collector.',
            },
          },
          validation: [
            allOf(
              nodeRule('websocket_server', 'WebSocket Server'),
              edgeRule('streaming_service', 'websocket_server')
            ),
          ],
          hints: ['Search for "WebSocket Server"', 'Connect Streaming Service to it'],
        },
        {
          id: 'step-23',
          title: 'Add Tracing Collector',
          phases: {
            context: {
              heading: 'Level 3: Step 6',
              body: 'Adding the Tracing Collector — distributed tracing.',
            },
            intro: {
              heading: 'Do you know about Distributed Tracing?',
              body: 'Distributed tracing tracks requests across multiple services.',
            },
            teaching: {
              heading: 'Deep dive: Tracing Collector',
              body: 'The Tracing Collector captures distributed traces to debug issues across the entire system.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Tracing Collector', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Chat Service → Tracing Collector.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Tracing Collector added. Now the Alerting System.',
            },
          },
          validation: [
            allOf(
              nodeRule('tracing_collector', 'Tracing Collector'),
              edgeRule('microservice', 'tracing_collector')
            ),
          ],
          hints: ['Search for "Tracing Collector"', 'Connect Chat Service to it'],
        },
        {
          id: 'step-24',
          title: 'Add Alerting System',
          phases: {
            context: {
              heading: 'Level 3: Step 7',
              body: 'Adding the Alerting System — notifies on incidents.',
            },
            intro: {
              heading: 'Do you know about Alerting Systems?',
              body: 'Alerting systems notify teams when issues occur.',
            },
            teaching: {
              heading: 'Deep dive: Alerting System',
              body: 'The Alerting System monitors metrics and sends alerts when thresholds are exceeded.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Alerting System', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Metrics Collector → Alerting System.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Alerting System added. Now the Model Server.',
            },
          },
          validation: [
            allOf(
              nodeRule('alerting_system', 'Alerting System'),
              edgeRule('metrics_collector', 'alerting_system')
            ),
          ],
          hints: ['Search for "Alerting System"', 'Connect Metrics Collector to it'],
        },
        {
          id: 'step-25',
          title: 'Add Model Server',
          phases: {
            context: {
              heading: 'Level 3: Step 8',
              body: 'Adding the Model Server — runs the LLM inference.',
            },
            intro: {
              heading: 'Do you know about Model Servers?',
              body: 'Model servers run ML model inference.',
            },
            teaching: {
              heading: 'Deep dive: Model Server',
              body: 'The Model Server runs the actual LLM inference on GPUs, processing prompts and generating tokens.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Model Server', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect LLM API → Model Server.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Model Server added. Now the Cache Stampede Prevention.',
            },
          },
          validation: [
            allOf(
              nodeRule('model_server', 'Model Server'),
              edgeRule('llm_api', 'model_server')
            ),
          ],
          hints: ['Search for "Model Server"', 'Connect LLM API to it'],
        },
        {
          id: 'step-26',
          title: 'Add Cache Stampede Prevention',
          phases: {
            context: {
              heading: 'Level 3: Step 9',
              body: 'Adding Cache Stampede Prevention — prevents thundering herd.',
            },
            intro: {
              heading: 'Do you know about Cache Stampede?',
              body: 'Cache stampede happens when many requests hit expired cache simultaneously.',
            },
            teaching: {
              heading: 'Deep dive: Cache Stampede Prevention',
              body: 'Cache Stampede Prevention prevents thundering herd problems when a popular cache entry expires.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Cache Stampede Prevention', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect In-Memory Cache → Cache Stampede Prevention.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Cache Stampede Prevention added. Now the Data Warehouse.',
            },
          },
          validation: [
            allOf(
              nodeRule('cache_stampede_prevention', 'Cache Stampede Prevention'),
              edgeRule('in_memory_cache', 'cache_stampede_prevention')
            ),
          ],
          hints: ['Search for "Cache Stampede Prevention"', 'Connect In-Memory Cache to it'],
        },
        {
          id: 'step-27',
          title: 'Add Data Warehouse',
          phases: {
            context: {
              heading: 'Level 3: Step 10',
              body: 'Adding the Data Warehouse — analytical store for research.',
            },
            intro: {
              heading: 'Do you know about Data Warehouses?',
              body: 'Data warehouses store historical data for analytics.',
            },
            teaching: {
              heading: 'Deep dive: Data Warehouse',
              body: 'The Data Warehouse is an append-only analytical store that powers safety research and model evaluation.',
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Data Warehouse', and add it.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Message Queue → Data Warehouse.',
            },
            celebration: {
              heading: 'Expert Architecture Complete!',
              body: "You've designed ChatGPT at the senior engineer level!",
            },
          },
          validation: [
            allOf(
              nodeRule('data_warehouse', 'Data Warehouse'),
              edgeRule('message_queue', 'data_warehouse')
            ),
          ],
          hints: ['Search for "Data Warehouse"', 'Connect Message Queue to it'],
        },
      ],
    },
  ],
};

export default chatgptTutorial;
