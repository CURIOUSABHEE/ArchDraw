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

const discordTutorial: TutorialDefinition = {
  id: 'discord-architecture',
  title: 'How to Design Discord Architecture',
  description: 'Build a real-time voice and text platform for 19 million active servers. Understand WebRTC, guild sharding, voice channel architecture, and message history at scale.',
  difficulty: 'advanced',
  estimatedMinutes: 87,
  tags: ['real-time', 'websocket', 'gaming'],
  icon: 'MessageCircle',
  color: '#5865F2',

  levels: [
    {
      id: 'level-1',
      title: 'Real-Time Platform',
      steps: [
        {
          id: 'step-1',
          title: 'Add Web Client',
          phases: {
            context: { heading: 'Welcome to Discord Architecture', body: '19 million active servers, 200 million users, 4 billion messages monthly.' },
            intro: { heading: 'About Clients', body: "Discord's client maintains persistent WebSocket connections." },
            teaching: { heading: 'Deep dive: Web Client', body: "Discord's client is the web app, desktop app (Electron), and mobile app. All maintain persistent WebSocket connections." },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Web' to add the client." },
            connecting: { heading: 'Connect it up', body: 'First step, no connections yet.' },
            celebration: { heading: 'Great job!', body: 'Web Client added.' },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Search for "Web"'],
        },
        {
          id: 'step-2',
          title: 'Add CDN',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding CDN for static assets.' },
            intro: { heading: 'About CDN', body: 'CDN serves static assets.' },
            teaching: { heading: 'Deep dive: CDN', body: 'The CDN serves static assets like CSS, JS, and emojis from edge servers.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'CDN' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Web Client → CDN.' },
            celebration: { heading: 'Great job!', body: 'CDN added.' },
          },
          validation: [allOf(nodeRule('cdn', 'CDN'), edgeRule('client_web', 'cdn'))],
          hints: ['Search for "CDN"', 'Connect Web to CDN'],
        },
        {
          id: 'step-3',
          title: 'Add Gateway Service',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding Gateway Service for WebSocket handling.' },
            intro: { heading: 'About Gateway Services', body: 'Gateway services handle WebSocket connections.' },
            teaching: { heading: 'Deep dive: Gateway', body: 'The Gateway Service maintains persistent WebSocket connections for real-time communication.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Gateway' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Web Client → Gateway Service.' },
            celebration: { heading: 'Great job!', body: 'Gateway Service added.' },
          },
          validation: [allOf(nodeRule('gateway_service', 'Gateway Service'), edgeRule('client_web', 'gateway_service'))],
          hints: ['Search for "Gateway"', 'Connect Web to Gateway'],
        },
        {
          id: 'step-4',
          title: 'Add API Gateway',
          phases: {
            context: { heading: 'Level 1: Step 4', body: 'Adding API Gateway for REST requests.' },
            intro: { heading: 'About API Gateway', body: 'API Gateways handle REST API calls.' },
            teaching: { heading: 'Deep dive: API Gateway', body: 'The API Gateway handles REST requests — profile updates, server settings, etc.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'API Gateway' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway Service → API Gateway.' },
            celebration: { heading: 'Great job!', body: 'API Gateway added.' },
          },
          validation: [allOf(nodeRule('api_gateway', 'API Gateway'), edgeRule('gateway_service', 'api_gateway'))],
          hints: ['Search for "API Gateway"', 'Connect Gateway to it'],
        },
        {
          id: 'step-5',
          title: 'Add Auth Service',
          phases: {
            context: { heading: 'Level 1: Step 5', body: 'Adding Auth Service.' },
            intro: { heading: 'About Auth Services', body: 'Auth services validate tokens.' },
            teaching: { heading: 'Deep dive: Auth Service', body: 'The Auth Service validates tokens and manages user authentication.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Auth Service' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Auth Service.' },
            celebration: { heading: 'Great job!', body: 'Auth Service added.' },
          },
          validation: [allOf(nodeRule('auth_service', 'Auth Service'), edgeRule('api_gateway', 'auth_service'))],
          hints: ['Search for "Auth Service"', 'Connect API Gateway to it'],
        },
        {
          id: 'step-6',
          title: 'Add Guild Service',
          phases: {
            context: { heading: 'Level 1: Step 6', body: 'Adding Guild Service for server management.' },
            intro: { heading: 'About Guild Services', body: 'Guild services manage servers.' },
            teaching: { heading: 'Deep dive: Guild Service', body: 'The Guild Service manages servers (guilds), channels, and roles.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Guild Service' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Guild Service.' },
            celebration: { heading: 'Great job!', body: 'Guild Service added.' },
          },
          validation: [allOf(nodeRule('guild_service', 'Guild Service'), edgeRule('api_gateway', 'guild_service'))],
          hints: ['Search for "Guild Service"', 'Connect API Gateway to it'],
        },
        {
          id: 'step-7',
          title: 'Add Message Service',
          phases: {
            context: { heading: 'Level 1: Step 7', body: 'Adding Message Service for real-time messaging.' },
            intro: { heading: 'About Message Services', body: 'Message services handle chat.' },
            teaching: { heading: 'Deep dive: Message Service', body: 'The Message Service handles real-time message delivery via WebSockets.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Message Service' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Guild Service → Message Service.' },
            celebration: { heading: 'Great job!', body: 'Message Service added.' },
          },
          validation: [allOf(nodeRule('message_service', 'Message Service'), edgeRule('guild_service', 'message_service'))],
          hints: ['Search for "Message Service"', 'Connect Guild Service to it'],
        },
        {
          id: 'step-8',
          title: 'Add Database',
          phases: {
            context: { heading: 'Level 1: Step 8', body: 'Adding Database for message storage.' },
            intro: { heading: 'About Databases', body: 'Databases store data.' },
            teaching: { heading: 'Deep dive: Database', body: 'The Database stores messages, user data, and server configurations.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'NoSQL Database' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Message Service → Database.' },
            celebration: { heading: 'Great job!', body: 'Database added.' },
          },
          validation: [allOf(nodeRule('nosql_db', 'NoSQL Database'), edgeRule('message_service', 'nosql_db'))],
          hints: ['Search for "NoSQL Database"', 'Connect Message Service to it'],
        },
        {
          id: 'step-9',
          title: 'Add Voice Service',
          phases: {
            context: { heading: 'Level 1: Step 9', body: 'Adding Voice Service for voice chat.' },
            intro: { heading: 'About Voice Services', body: 'Voice services handle audio.' },
            teaching: { heading: 'Deep dive: Voice Service', body: 'The Voice Service handles real-time voice communication using WebRTC.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Voice Service' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Guild Service → Voice Service.' },
            celebration: { heading: 'Great job!', body: 'Voice Service added.' },
          },
          validation: [allOf(nodeRule('voice_service', 'Voice Service'), edgeRule('guild_service', 'voice_service'))],
          hints: ['Search for "Voice Service"', 'Connect Guild Service to it'],
        },
        {
          id: 'step-10',
          title: 'Add Session Service',
          phases: {
            context: { heading: 'Level 1: Step 10', body: 'Adding Session Service for presence.' },
            intro: { heading: 'About Session Services', body: 'Session services track online status.' },
            teaching: { heading: 'Deep dive: Session Service', body: 'The Session Service tracks user presence and online status.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Session Service' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway Service → Session Service.' },
            celebration: { heading: 'Level 1 Complete!', body: 'You have the foundation!' },
          },
          validation: [allOf(nodeRule('session_service', 'Session Service'), edgeRule('gateway_service', 'session_service'))],
          hints: ['Search for "Session Service"', 'Connect Gateway to it'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-11',
          title: 'Add CDN',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding CDN for media.' },
            intro: { heading: 'About CDN', body: 'CDN serves media files.' },
            teaching: { heading: 'Deep dive: CDN', body: 'The CDN serves avatars, emojis, and attachments.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'CDN' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → CDN.' },
            celebration: { heading: 'Great job!', body: 'CDN added.' },
          },
          validation: [nodeRule('cdn', 'CDN')],
          hints: ['Search for "CDN"'],
        },
        {
          id: 'step-12',
          title: 'Add Cache',
          phases: {
            context: { heading: 'Level 2: Step 2', body: 'Adding Cache for performance.' },
            intro: { heading: 'About Cache', body: 'Cache improves performance.' },
            teaching: { heading: 'Deep dive: Cache', body: 'The Cache stores frequently accessed data like user sessions.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Cache' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Session Service → Cache.' },
            celebration: { heading: 'Level 2 Complete!', body: 'Production-ready Discord!' },
          },
          validation: [allOf(nodeRule('cache', 'Cache'), edgeRule('session_service', 'cache'))],
          hints: ['Search for "Cache"', 'Connect Session Service to it'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-13',
          title: 'Add Metrics Collector',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Metrics Collector.' },
            intro: { heading: 'About Metrics', body: 'Metrics collect performance data.' },
            teaching: { heading: 'Deep dive: Metrics Collector', body: 'The Metrics Collector aggregates performance metrics.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Metrics Collector' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect to Session Service.' },
            celebration: { heading: 'Great job!', body: 'Metrics Collector added.' },
          },
          validation: [nodeRule('metrics_collector', 'Metrics Collector')],
          hints: ['Search for "Metrics Collector"'],
        },
        {
          id: 'step-14',
          title: 'Add Tracing Collector',
          phases: {
            context: { heading: 'Level 3: Step 2', body: 'Adding Tracing Collector.' },
            intro: { heading: 'About Tracing', body: 'Tracing tracks requests across services.' },
            teaching: { heading: 'Deep dive: Tracing Collector', body: 'The Tracing Collector tracks distributed traces.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Tracing Collector' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Session Service → Tracing.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed Discord at senior level!" },
          },
          validation: [nodeRule('tracing_collector', 'Tracing Collector')],
          hints: ['Search for "Tracing Collector"'],
        },
      ],
    },
  ],
};

export default discordTutorial;