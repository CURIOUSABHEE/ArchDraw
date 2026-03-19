export interface TutorialMessage {
  type: 'guide' | 'user' | 'success' | 'error';
  content: string;
}

export interface StepValidation {
  requiredNodes: string[];
  requiredEdges: Array<{ from: string; to: string }>;
  errorMessage: string;
  successMessage: string;
}

export interface TutorialStep {
  id: number;
  title: string;
  explanation: string;
  action: string;
  why: string;
  searchHint?: string;
  messages: TutorialMessage[];
  validation: StepValidation;
}

export interface TutorialData {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  estimatedTime: string;
  nodeCount: number;
  stepCount: number;
  icon: string;
  color: string;
  tags: string[];
  steps: TutorialStep[];
}

export const chatgptTutorial: TutorialData = {
  id: 'chatgpt-architecture',
  title: 'How to Design ChatGPT Architecture',
  description: 'Build a production-ready AI chat system from scratch. Learn how LLMs, vector databases, and streaming services work together.',
  difficulty: 'Intermediate',
  category: 'AI Systems',
  estimatedTime: '~25 mins',
  nodeCount: 14,
  stepCount: 9,
  icon: 'Brain',
  color: '#ec4899',
  tags: ['LLM', 'Vector DB', 'RAG', 'Streaming'],
  steps: [
    {
      id: 1,
      title: 'Start with the Client',
      explanation: "Every system starts with the user. The client is the web or mobile app that users interact with to send messages and receive responses.",
      action: 'Add a "Client (Web / Mobile)" node to the canvas. Press ⌘K to search for it.',
      searchHint: 'Client',
      why: "The client is the entry point of every system. Always start your architecture diagram from the user's perspective.",
      messages: [
        { type: 'guide', content: "Welcome to the ChatGPT Architecture tutorial! 🎯 We're going to build a production-ready AI chat system step by step." },
        { type: 'guide', content: "Every great system starts with the user. The client is the web or mobile app where users type messages and read responses — in ChatGPT's case, the browser interface or mobile app." },
        { type: 'guide', content: "Starting from the client keeps the architecture user-focused. Without it, there's no entry point into the system." },
        { type: 'guide', content: 'Press ⌘K, search for "Client", and add it to the canvas.' },
      ],
      validation: {
        requiredNodes: ['client'],
        requiredEdges: [],
        successMessage: "Great start! The client is on the canvas. Now let's add the next layer.",
        errorMessage: 'Add a Client (Web/Mobile) node to the canvas first.',
      },
    },
    {
      id: 2,
      title: 'Add the API Gateway',
      explanation: 'The API Gateway is the single entry point for all client requests. It handles routing, authentication checks, rate limiting, and load distribution.',
      action: 'Add an "API Gateway" node and connect it to the Client with an edge.',
      searchHint: 'API Gateway',
      why: "Without an API Gateway, every client would need to know the address of every backend service. The gateway abstracts this complexity and provides a single, secure entry point.",
      messages: [
        { type: 'guide', content: 'Now we need a gateway to receive requests from the client. Add an "API Gateway" using ⌘K.' },
        { type: 'guide', content: 'The API Gateway is the single entry point for all client requests — it handles routing, rate limiting, and authentication checks before anything reaches your backend services.' },
        { type: 'guide', content: 'Without it, every client would need to know the address of every backend service. The gateway abstracts all that complexity.' },
        { type: 'guide', content: 'Once added, draw a connection from Client → API Gateway by hovering over the Client node and dragging from the handle that appears.' },
      ],
      validation: {
        requiredNodes: ['client', 'api gateway'],
        requiredEdges: [{ from: 'Client', to: 'API Gateway' }],
        successMessage: 'Excellent! The client is now talking to your API Gateway.',
        errorMessage: 'Make sure both nodes are on the canvas AND connected with an edge.',
      },
    },
    {
      id: 3,
      title: 'Add Load Balancer',
      explanation: "A Load Balancer distributes incoming traffic across multiple server instances, preventing any single server from being overwhelmed.",
      action: 'Add a "Load Balancer" node and connect it from the API Gateway.',
      searchHint: 'Load Balancer',
      why: "At ChatGPT's scale, a single server can't handle all traffic. The load balancer enables horizontal scaling and high availability.",
      messages: [
        { type: 'guide', content: "Imagine millions of people using ChatGPT simultaneously. A single server can't handle that — it needs to be distributed." },
        { type: 'guide', content: 'A Load Balancer sits after the API Gateway and distributes traffic across many server instances. When one server is busy, requests go to another.' },
        { type: 'guide', content: 'This is also what enables zero-downtime deployments — you can take servers offline one at a time while the load balancer routes around them.' },
        { type: 'guide', content: 'Add a Load Balancer and connect: API Gateway → Load Balancer.' },
      ],
      validation: {
        requiredNodes: ['api gateway', 'load balancer'],
        requiredEdges: [{ from: 'API Gateway', to: 'Load Balancer' }],
        successMessage: 'Your system can now scale horizontally.',
        errorMessage: 'Add a Load Balancer and connect it from the API Gateway.',
      },
    },
    {
      id: 4,
      title: 'Add the Chat Service (Core)',
      explanation: 'The Chat Service receives messages, manages conversation context, calls the LLM API, and streams responses back. This is the most critical microservice in the architecture.',
      action: 'Add a "Microservice" node (this will be your Chat Service) and connect it from the Load Balancer.',
      searchHint: 'Microservice',
      why: 'Breaking this into its own microservice means it can be scaled, deployed, and updated independently from other parts of the system.',
      messages: [
        { type: 'guide', content: "The heart of ChatGPT is the Chat Service — it orchestrates everything. Add a Microservice node for this." },
        { type: 'guide', content: 'This service does the heavy lifting: receives your message, fetches relevant context from memory, calls the AI model, and streams the response back to the client.' },
        { type: 'guide', content: 'Making it a dedicated microservice means it can be scaled independently — you can run 1,000 instances of the Chat Service without touching auth or storage.' },
        { type: 'guide', content: 'Connect: Load Balancer → Chat Service (Microservice).' },
      ],
      validation: {
        requiredNodes: ['load balancer', 'microservice'],
        requiredEdges: [{ from: 'Load Balancer', to: 'Microservice' }],
        successMessage: "Core service added. Now let's connect it to the AI model.",
        errorMessage: 'Add a Microservice (Chat Service) connected from the Load Balancer.',
      },
    },
    {
      id: 5,
      title: 'Connect to the LLM API',
      explanation: 'The LLM API is what actually generates the AI responses. The Chat Service sends the conversation history and context to the LLM and gets back a response to stream to the user.',
      action: 'Add an "LLM API" node and connect it from the Microservice (Chat Service).',
      searchHint: 'LLM',
      why: "The LLM is the most computationally expensive part. By making it a separate service, GPU allocation can be optimized independently and shared across multiple products.",
      messages: [
        { type: 'guide', content: 'Now for the most interesting part — the AI model itself.' },
        { type: 'guide', content: 'The LLM API represents GPT-4 (or whatever language model is generating responses). The Chat Service sends the full conversation history to it and gets back a generated response.' },
        { type: 'guide', content: "It's stateless — the Chat Service sends the entire conversation context on every call. The LLM doesn't remember anything between requests." },
        { type: 'guide', content: 'Keeping it as a separate service means GPU resources can be scaled and optimized independently. Add LLM API and connect: Chat Service → LLM API.' },
      ],
      validation: {
        requiredNodes: ['llm api'],
        requiredEdges: [{ from: 'Microservice', to: 'LLM' }],
        successMessage: 'The AI brain is connected. Now we need memory.',
        errorMessage: 'Add an LLM API node and connect it from the Microservice.',
      },
    },
    {
      id: 6,
      title: 'Add Vector Database for Memory',
      explanation: "ChatGPT can only process a limited amount of text at once (context window). For longer conversations, previous messages are stored as vector embeddings. When you send a new message, relevant past context is retrieved and included.",
      action: 'Add a "Vector Database" and "Embedding Service" node. Connect: Microservice → Embedding Service → Vector Database.',
      searchHint: 'Vector Database',
      why: "This is what makes ChatGPT seem to 'remember' your conversation. This is also the foundation of RAG (Retrieval Augmented Generation).",
      messages: [
        { type: 'guide', content: 'Have you ever wondered how ChatGPT remembers what you said earlier in a long conversation?' },
        { type: 'guide', content: 'It uses a Vector Database. Your messages are converted into mathematical vectors (embeddings) and stored. When you ask something new, semantically similar past messages are retrieved as context.' },
        { type: 'guide', content: "This is called RAG — Retrieval Augmented Generation. It's how the model 'remembers' beyond its context window limit." },
        { type: 'guide', content: 'Add an Embedding Service + Vector Database. Connect: Chat Service → Embedding Service → Vector Database.' },
      ],
      validation: {
        requiredNodes: ['vector', 'embedding'],
        requiredEdges: [
          { from: 'Microservice', to: 'Embedding' },
          { from: 'Embedding', to: 'Vector' },
        ],
        successMessage: "ChatGPT now has memory. Let's add the conversation store.",
        errorMessage: 'Add both Vector Database and Embedding Service with the correct connections.',
      },
    },
    {
      id: 7,
      title: 'Add NoSQL Database for Chat History',
      explanation: "Every conversation is stored in a NoSQL database. This allows you to see your chat history when you come back. NoSQL is used because chat data is unstructured and the schema can vary.",
      action: 'Add a "NoSQL Database" node and connect it from the Microservice.',
      searchHint: 'NoSQL',
      why: "SQL databases enforce rigid schemas which don't fit well with variable conversation structures. NoSQL's flexible document model is perfect for storing messages and metadata.",
      messages: [
        { type: 'guide', content: 'When you come back to ChatGPT tomorrow, your conversations are still there. Where are they stored?' },
        { type: 'guide', content: 'In a NoSQL database (like MongoDB or DynamoDB). Each conversation is a document — flexible schema, no rigid columns. Perfect for variable message formats and metadata.' },
        { type: 'guide', content: "SQL would require a fixed schema for every message type. NoSQL lets the structure evolve as the product changes — new message types, reactions, attachments — without migrations." },
        { type: 'guide', content: 'Add a NoSQL Database and connect: Chat Service → NoSQL Database.' },
      ],
      validation: {
        requiredNodes: ['nosql'],
        requiredEdges: [{ from: 'Microservice', to: 'NoSQL' }],
        successMessage: 'Conversation history is now persisted.',
        errorMessage: 'Add a NoSQL Database connected from the Microservice.',
      },
    },
    {
      id: 8,
      title: 'Add Auth Service',
      explanation: "Every user must be authenticated before they can use ChatGPT. The Auth Service validates JWT tokens, checks subscription status (free vs Plus vs Team), and enforces rate limits based on the user's plan.",
      action: 'Add an "Auth Service" node and connect it from the Load Balancer.',
      searchHint: 'Auth',
      why: "Authentication is critical for security, rate limiting, and monetization. Without auth, anyone could use the system for free and abuse the expensive LLM API.",
      messages: [
        { type: 'guide', content: 'Security is critical. Add an Auth Service.' },
        { type: 'guide', content: 'The Auth Service does three things: verifies your identity (JWT token), checks your plan (free/Plus/Team), and enforces rate limits. Free users get GPT-3.5, Plus users get GPT-4 priority.' },
        { type: 'guide', content: "Without auth, anyone could hammer the LLM API for free. At ~$0.03 per 1K tokens, that would bankrupt the service instantly." },
        { type: 'guide', content: 'Connect: Load Balancer → Auth Service.' },
      ],
      validation: {
        requiredNodes: ['auth'],
        requiredEdges: [{ from: 'Load Balancer', to: 'Auth' }],
        successMessage: 'Security layer added.',
        errorMessage: 'Add an Auth Service connected from the Load Balancer.',
      },
    },
    {
      id: 9,
      title: 'Add Observability',
      explanation: "At ChatGPT's scale, something is always breaking somewhere. A Logger and Metrics Collector let the engineering team monitor system health, track error rates, and measure response times.",
      action: 'Add a "Logger" and "Metrics Collector" node. Connect both from the Microservice.',
      searchHint: 'Logger',
      why: "Without observability, debugging production issues is like fixing a car blindfolded. These systems tell you what's happening in real time and where errors are occurring.",
      messages: [
        { type: 'guide', content: 'Final step — observability. Every production system needs logging and metrics.' },
        { type: 'guide', content: 'The Logger captures detailed request traces — what happened, in what order, and how long each step took. Essential for debugging slow responses or errors.' },
        { type: 'guide', content: 'The Metrics Collector tracks aggregate health — requests per second, error rate, p99 latency, LLM token usage. This is what the on-call engineer watches at 3am.' },
        { type: 'guide', content: "Add Logger + Metrics Collector, connect both from the Chat Service. Congratulations — you've just designed the core architecture of ChatGPT! 🎉" },
      ],
      validation: {
        requiredNodes: ['logger', 'metrics'],
        requiredEdges: [
          { from: 'Microservice', to: 'Logger' },
          { from: 'Microservice', to: 'Metrics' },
        ],
        successMessage: "🎉 Tutorial complete! You've designed the ChatGPT architecture from scratch.",
        errorMessage: 'Add both Logger and Metrics Collector connected from the Microservice.',
      },
    },
  ],
};
