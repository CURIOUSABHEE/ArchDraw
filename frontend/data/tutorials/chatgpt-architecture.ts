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
      explanation: "Every system starts with the user. The client is the web or mobile app that users interact with to send messages and receive responses. In ChatGPT's case, this is the web interface or mobile app.",
      action: 'Add a "Client (Web / Mobile)" node to the canvas. Press ⌘K to search for it.',
      searchHint: 'Client',
      why: "The client is the entry point of every system. Without it, there's no way for users to interact with the system. Always start your architecture diagram from the user's perspective.",
      messages: [
        { type: 'guide', content: "Welcome to the ChatGPT Architecture tutorial! 🎯 We're going to build a production-ready AI chat system step by step." },
        { type: 'guide', content: "Every great system starts with the user. Let's add our first component — the Client." },
        { type: 'guide', content: 'Search for "Client" in the sidebar and drag it onto the canvas, or click it to add it to the center.' },
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
      explanation: 'The API Gateway is the single entry point for all client requests. It handles routing, authentication checks, rate limiting, and load distribution. ChatGPT uses this to route your messages to the right service.',
      action: 'Add an "API Gateway" node and connect it to the Client with an edge. Draw the connection by hovering over the Client node and dragging from the handle that appears.',
      searchHint: 'API Gateway',
      why: "Without an API Gateway, every client would need to know the address of every backend service. The gateway abstracts this complexity and provides a single, secure entry point.",
      messages: [
        { type: 'guide', content: 'Now we need a gateway to receive requests from the client. Add an "API Gateway" from the sidebar.' },
        { type: 'guide', content: 'Once added, draw a connection from the Client to the API Gateway. Hover over the Client node and drag from the small circle handle that appears on its edge.' },
        { type: 'guide', content: "The connection represents HTTPS requests flowing from the user's browser to your backend." },
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
      explanation: "ChatGPT handles millions of requests simultaneously. A Load Balancer distributes incoming traffic across multiple server instances, preventing any single server from being overwhelmed. This is critical for ChatGPT's scale.",
      action: 'Add a "Load Balancer" node and connect it from the API Gateway.',
      searchHint: 'Load Balancer',
      why: "At ChatGPT's scale, a single server can't handle all traffic. The load balancer ensures requests are distributed evenly, enabling horizontal scaling and high availability.",
      messages: [
        { type: 'guide', content: "Imagine millions of people using ChatGPT at the same time. How does one server handle that? It can't." },
        { type: 'guide', content: 'Add a Load Balancer after the API Gateway. This distributes traffic across many server instances.' },
        { type: 'guide', content: 'Connect: API Gateway → Load Balancer' },
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
      explanation: 'The Chat Service is the brain of the operation. It receives messages, manages conversation context, calls the LLM API, and streams responses back. This is the most critical microservice in the ChatGPT architecture.',
      action: 'Add a "Microservice" node (this will be your Chat Service) and connect it from the Load Balancer.',
      searchHint: 'Microservice',
      why: 'Breaking this into its own microservice means it can be scaled, deployed, and updated independently from other parts of the system.',
      messages: [
        { type: 'guide', content: "The heart of ChatGPT is the Chat Service — it orchestrates everything. Add a Microservice node for this." },
        { type: 'guide', content: 'Connect: Load Balancer → Chat Service (Microservice)' },
        { type: 'guide', content: "This service does the heavy lifting: it receives your message, fetches relevant context, calls the AI model, and streams the response." },
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
      explanation: 'The LLM API (Large Language Model) is what actually generates the AI responses. ChatGPT uses GPT-4 under the hood. The Chat Service sends the conversation history and context to the LLM and gets back a response to stream to the user.',
      action: 'Add an "LLM API" node and connect it from the Microservice (Chat Service).',
      searchHint: 'LLM',
      why: "The LLM is the most computationally expensive part of the system. By making it a separate service, OpenAI can optimize GPU allocation independently and serve multiple products from the same model infrastructure.",
      messages: [
        { type: 'guide', content: 'Now for the most interesting part — the AI model itself.' },
        { type: 'guide', content: 'Add an "LLM API" node. This represents GPT-4 or whatever language model is generating the responses.' },
        { type: 'guide', content: 'Connect: Chat Service → LLM API' },
        { type: 'guide', content: "This is the call that takes your message and returns a generated response. It's stateless — the Chat Service sends the full conversation history each time." },
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
      explanation: "ChatGPT can only process a limited amount of text at once (context window). For longer conversations, previous messages are stored as vector embeddings in a Vector Database. When you send a new message, relevant past context is retrieved and included.",
      action: 'Add a "Vector Database" and "Embedding Service" node. Connect: Microservice → Embedding Service → Vector Database.',
      searchHint: 'Vector Database',
      why: "This is what makes ChatGPT seem to 'remember' your conversation. Without vector storage, it could only see the last few messages. This is also the foundation of RAG (Retrieval Augmented Generation).",
      messages: [
        { type: 'guide', content: 'Have you ever wondered how ChatGPT remembers what you said earlier in a long conversation?' },
        { type: 'guide', content: 'It uses a Vector Database. Your messages are converted into mathematical vectors and stored. When you ask something new, similar past messages are retrieved as context.' },
        { type: 'guide', content: 'Add: Embedding Service + Vector Database' },
        { type: 'guide', content: 'Connect: Chat Service → Embedding Service → Vector Database' },
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
      explanation: "Every conversation is stored in a NoSQL database (like MongoDB or DynamoDB). This allows you to see your chat history when you come back. NoSQL is used because chat data is unstructured and the schema can vary between conversations.",
      action: 'Add a "NoSQL Database" node and connect it from the Microservice.',
      searchHint: 'NoSQL',
      why: "SQL databases enforce rigid schemas which don't fit well with variable conversation structures. NoSQL's flexible document model is perfect for storing messages, metadata, and varying conversation formats.",
      messages: [
        { type: 'guide', content: 'When you come back to ChatGPT tomorrow, your conversations are still there. Where are they stored?' },
        { type: 'guide', content: 'In a NoSQL database. Add one and connect it from the Chat Service.' },
        { type: 'guide', content: 'Connect: Chat Service → NoSQL Database' },
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
      why: "Authentication is critical for security, rate limiting, and monetization. ChatGPT Plus users get priority access and GPT-4. Without auth, anyone could use the system for free and abuse the expensive LLM API.",
      messages: [
        { type: 'guide', content: 'Security is critical. Add an Auth Service.' },
        { type: 'guide', content: 'Connect: Load Balancer → Auth Service' },
        { type: 'guide', content: 'The auth service does three things: verifies your identity (JWT token), checks your plan (free/Plus), and enforces rate limits. Free users get GPT-3.5, Plus users get GPT-4 priority.' },
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
      explanation: "At ChatGPT's scale, something is always breaking somewhere. A Logger and Metrics Collector let the engineering team monitor system health, track error rates, measure response times, and get alerted when something goes wrong.",
      action: 'Add a "Logger" and "Metrics Collector" node. Connect both from the Microservice.',
      searchHint: 'Logger',
      why: "Without observability, debugging production issues is like fixing a car blindfolded. These systems tell you what's happening in real time, how fast responses are being generated, and where errors are occurring.",
      messages: [
        { type: 'guide', content: 'Final step — observability. Every production system needs logging and metrics.' },
        { type: 'guide', content: 'Add: Logger + Metrics Collector. Connect both from the Chat Service (Microservice).' },
        { type: 'guide', content: "These are what the on-call engineer looks at at 3am when something breaks. Without them, you're flying blind." },
        { type: 'guide', content: "Congratulations — you've just designed the core architecture of ChatGPT! 🎉" },
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
