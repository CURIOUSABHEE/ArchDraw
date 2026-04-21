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

const netflixTutorial: TutorialDefinition = {
  id: 'netflix-architecture',
  title: 'How to Design Netflix Architecture',
  description: 'Build the streaming platform that serves 270M subscribers. Learn CDN-first design, distributed encoding, and ML-powered recommendations.',
  difficulty: 'advanced',
  estimatedMinutes: 60,
  tags: ['streaming', 'cdn', 'recommendations'],
  icon: 'Play',
  color: '#E50914',

  levels: [
    {
      id: 'level-1',
      title: 'The Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Client',
          phases: {
            context: { heading: 'Welcome to Netflix Architecture', body: 'Level 1: The foundation. What does a system need to stream video to 270 million subscribers?' },
            intro: { heading: 'Do you know about Clients?', body: "Netflix's client runs on 2,000+ device types." },
            teaching: { heading: 'Deep dive: Client', body: "Netflix's client runs on 2,000+ device types — Smart TVs, phones, tablets, browsers, and game consoles. Each implements adaptive bitrate streaming." },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Web' to add the client." },
            connecting: { heading: 'Connect it up', body: 'This is the first step, no connections needed yet.' },
            celebration: { heading: 'Great job!', body: 'Client added. Now the routing layer.' },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Search for "Web"', 'Add Web Client to canvas'],
        },
        {
          id: 'step-2',
          title: 'Add DNS and CDN',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding DNS and CDN for global content delivery.' },
            intro: { heading: 'Do you know about DNS and CDN?', body: 'DNS routes requests, CDN delivers content from edge servers.' },
            teaching: { heading: 'Deep dive: DNS and CDN', body: "Netflix's Open Connect CDN has 15,000+ servers embedded inside ISPs worldwide. 94% of Netflix traffic is served from these edge nodes." },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'DNS', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Web → DNS.' },
            celebration: { heading: 'Great job!', body: 'DNS and CDN added. Now the API layer.' },
          },
          validation: [allOf(nodeRule('dns', 'DNS'), edgeRule('client_web', 'dns'))],
          hints: ['Search for "DNS"', 'Connect Web to DNS'],
        },
        {
          id: 'step-3',
          title: 'Add API Gateway and Load Balancer',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding the API Gateway for handling non-video requests.' },
            intro: { heading: 'Do you know about API Gateways?', body: 'API Gateways route, authenticate, and rate-limit API calls.' },
            teaching: { heading: 'Deep dive: API Gateway', body: "Netflix's Zuul API Gateway handles all non-video requests — login, search, watchlist, recommendations. It routes, authenticates, and rate-limits billions of API calls per day." },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'API Gateway', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect DNS → API Gateway.' },
            celebration: { heading: 'Great job!', body: 'API Gateway added. Now the auth layer.' },
          },
          validation: [allOf(nodeRule('api_gateway', 'API Gateway'), edgeRule('dns', 'api_gateway'))],
          hints: ['Search for "API Gateway"', 'Connect DNS to it'],
        },
        {
          id: 'step-4',
          title: 'Add Auth Service',
          phases: {
            context: { heading: 'Level 1: Step 4', body: 'Adding the Auth Service for token validation.' },
            intro: { heading: 'Do you know about Auth Services?', body: 'Auth Services validate tokens and check subscription status.' },
            teaching: { heading: 'Deep dive: Auth Service', body: "Netflix's Auth Service validates OAuth tokens, checks subscription plans, and counts active streams in real time. It enforces concurrent stream limits." },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'Auth Service', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Auth Service.' },
            celebration: { heading: 'Great job!', body: 'Auth Service added. Now the user data layer.' },
          },
          validation: [allOf(nodeRule('auth_service', 'Auth Service'), edgeRule('api_gateway', 'auth_service'))],
          hints: ['Search for "Auth Service"', 'Connect API Gateway to it'],
        },
        {
          id: 'step-5',
          title: 'Add Load Balancer',
          phases: {
            context: { heading: 'Level 1: Step 5', body: 'Adding Load Balancer for distributing traffic.' },
            intro: { heading: 'Do you know about Load Balancers?', body: 'Load balancers distribute traffic across multiple servers.' },
            teaching: { heading: 'Deep dive: Load Balancer', body: "Netflix's Load Balancer distributes API requests across thousands of application servers, enabling horizontal scaling." },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'Load Balancer', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Load Balancer.' },
            celebration: { heading: 'Great job!', body: 'Load Balancer added. Now the streaming layer.' },
          },
          validation: [allOf(nodeRule('load_balancer', 'Load Balancer'), edgeRule('api_gateway', 'load_balancer'))],
          hints: ['Search for "Load Balancer"', 'Connect API Gateway to it'],
        },
        {
          id: 'step-6',
          title: 'Add Streaming Service',
          phases: {
            context: { heading: 'Level 1: Step 6', body: 'Adding the Streaming Service for video delivery.' },
            intro: { heading: 'Do you know about Streaming Services?', body: 'Streaming services generate pre-signed URLs for video segments.' },
            teaching: { heading: 'Deep dive: Streaming Service', body: 'The Streaming Service generates time-limited pre-signed URLs for video segments — a URL that grants access for only 60 seconds.' },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'Microservice', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Load Balancer → Streaming Service.' },
            celebration: { heading: 'Great job!', body: 'Streaming Service added. Now the storage layer.' },
          },
          validation: [allOf(nodeRule('microservice', 'Microservice'), edgeRule('load_balancer', 'microservice'))],
          hints: ['Search for "Microservice"', 'Connect Load Balancer to it'],
        },
        {
          id: 'step-7',
          title: 'Add Object Storage',
          phases: {
            context: { heading: 'Level 1: Step 7', body: 'Adding Object Storage for video files.' },
            intro: { heading: 'Do you know about Object Storage?', body: 'Object storage holds large amounts of unstructured data.' },
            teaching: { heading: 'Deep dive: Object Storage', body: 'Object Storage holds petabytes of encoded video files. Netflix stores every title in 120+ different formats.' },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'Object Storage', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Streaming Service → Object Storage.' },
            celebration: { heading: 'Level 1 Complete!', body: 'You have a working Netflix streaming foundation!' },
          },
          validation: [allOf(nodeRule('object_storage', 'Object Storage'), edgeRule('microservice', 'object_storage'))],
          hints: ['Search for "Object Storage"', 'Connect Streaming Service to it'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-8',
          title: 'Add User Service',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding User Service for profile management.' },
            intro: { heading: 'Do you know about User Services?', body: 'User services handle user profiles and preferences.' },
            teaching: { heading: 'Deep dive: User Service', body: 'The User Service manages user profiles, preferences, and account settings.' },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'User Service', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Auth Service → User Service.' },
            celebration: { heading: 'Great job!', body: 'User Service added.' },
          },
          validation: [allOf(nodeRule('user_service', 'User Service'), edgeRule('auth_service', 'user_service'))],
          hints: ['Search for "User Service"', 'Connect Auth Service to it'],
        },
        {
          id: 'step-9',
          title: 'Add SQL Database',
          phases: {
            context: { heading: 'Level 2: Step 2', body: 'Adding SQL Database for user data.' },
            intro: { heading: 'Do you know about SQL Databases?', body: 'SQL databases provide ACID transaction guarantees.' },
            teaching: { heading: 'Deep dive: SQL Database', body: 'The SQL Database stores user accounts, subscription status, and billing records.' },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'SQL Database', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect User Service → SQL Database.' },
            celebration: { heading: 'Great job!', body: 'SQL Database added.' },
          },
          validation: [allOf(nodeRule('sql_db', 'SQL Database'), edgeRule('user_service', 'sql_db'))],
          hints: ['Search for "SQL Database"', 'Connect User Service to it'],
        },
        {
          id: 'step-10',
          title: 'Add Recommendation Engine',
          phases: {
            context: { heading: 'Level 2: Step 3', body: 'Adding Recommendation Engine for personalized content.' },
            intro: { heading: 'Do you know about Recommendation Engines?', body: 'Recommendation engines suggest content based on user behavior.' },
            teaching: { heading: 'Deep dive: Recommendation Engine', body: 'The Recommendation Engine uses ML to analyze viewing history and suggest personalized content.' },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'Recommendation Engine', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect User Service → Recommendation Engine.' },
            celebration: { heading: 'Level 2 Complete!', body: 'You have a production-ready Netflix architecture!' },
          },
          validation: [allOf(nodeRule('recommendation_engine', 'Recommendation Engine'), edgeRule('user_service', 'recommendation_engine'))],
          hints: ['Search for "Recommendation Engine"', 'Connect User Service to it'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-11',
          title: 'Add Transcoding Worker',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Transcoding Worker for video encoding.' },
            intro: { heading: 'Do you know about Transcoding?', body: 'Transcoding converts video to different formats.' },
            teaching: { heading: 'Deep dive: Transcoding Worker', body: 'The Transcoding Worker encodes video into multiple formats and resolutions for adaptive streaming.' },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'Worker', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect to Object Storage.' },
            celebration: { heading: 'Great job!', body: 'Transcoding Worker added.' },
          },
          validation: [nodeRule('worker', 'Worker')],
          hints: ['Search for "Worker"', 'Add Worker to canvas'],
        },
        {
          id: 'step-12',
          title: 'Add Content Catalog',
          phases: {
            context: { heading: 'Level 3: Step 2', body: 'Adding Content Catalog service.' },
            intro: { heading: 'Do you know about Content Catalogs?', body: 'Content catalogs manage metadata about videos.' },
            teaching: { heading: 'Deep dive: Content Catalog', body: 'The Content Catalog manages metadata about movies, shows, and episodes.' },
            action: { heading: 'Your turn!', body: "Press ⌘K, search for 'Content Catalog', and add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Content Catalog.' },
            celebration: { heading: 'Expert Architecture Complete!', body: "You've designed Netflix at the senior engineer level!" },
          },
          validation: [nodeRule('content_catalog', 'Content Catalog')],
          hints: ['Search for "Content Catalog"', 'Add to canvas'],
        },
      ],
    },
  ],
};

export default netflixTutorial;
