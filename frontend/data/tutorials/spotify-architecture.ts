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

const spotifyTutorial: TutorialDefinition = {
  id: 'spotify-architecture',
  title: 'How to Design Spotify Architecture',
  description: 'Build a music streaming platform for 600 million users. Learn audio transcoding, CDN delivery, offline sync, recommendation algorithms, and real-time listening sessions.',
  difficulty: 'intermediate',
  estimatedMinutes: 30,
  tags: ['streaming', 'cdn', 'music'],
  icon: 'Music',
  color: '#1DB954',

  levels: [
    {
      id: 'level-1',
      title: 'Music Streaming Platform',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Web Client',
          phases: {
            context: {
              heading: 'Welcome to Spotify Architecture',
              body: "Let's build Spotify from scratch. 600 million users, 100 million songs and podcasts, and a recommendation system that feels like it reads your mind.",
            },
            intro: {
              heading: 'Do you know about Web Clients?',
              body: "Spotify's client is the web app, desktop app, and mobile app that handles audio quality selection, local playback queue, and offline downloads.",
            },
            teaching: {
              heading: 'Deep dive: Web Client',
              body: "Spotify's client selects audio quality automatically: 24kbps on 2G, 96kbps on 3G, 160kbps on WiFi, 320kbps for Premium users. The client also manages the local playback queue and offline downloads.",
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
              body: 'Web Client added. Now the Audio CDN.',
            },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Press ⌘K to open component search', 'Search for "Web"'],
        },
        {
          id: 'step-2',
          title: 'Add Audio CDN',
          phases: {
            context: {
              heading: 'Level 1: Step 2',
              body: 'Adding the Audio CDN — delivers audio from edge locations.',
            },
            intro: {
              heading: 'Do you know about Audio CDNs?',
              body: "Spotify's Audio CDN delivers audio files from edge locations close to listeners.",
            },
            teaching: {
              heading: 'Deep dive: Audio CDN',
              body: "Spotify uses multiple CDN providers simultaneously. A song request goes to whichever CDN has the lowest latency for your location. The top 10,000 songs account for 80% of streams — pre-cached everywhere.",
            },
            action: {
              heading: 'Your turn!',
              body: "Press ⌘K, search for 'Audio CDN', and add it to the canvas.",
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Connect Web Client → Audio CDN.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Audio CDN added. Now the API Gateway.',
            },
          },
          validation: [
            allOf(
              nodeRule('audio_cdn', 'Audio'),
              edgeRule('client_web', 'audio_cdn')
            ),
          ],
          hints: ['Search for "Audio CDN"', 'Connect Web to Audio CDN'],
        },
        {
          id: 'step-3',
          title: 'Add API Gateway',
          phases: {
            context: {
              heading: 'Level 1: Step 3',
              body: 'Adding the API Gateway — handles non-audio requests.',
            },
            intro: {
              heading: 'Do you know about API Gateways?',
              body: 'All non-audio requests — search, playlist management, social features — flow through the API Gateway.',
            },
            teaching: {
              heading: 'Deep dive: API Gateway',
              body: "The API Gateway routes requests to the right microservice: search queries go to the search service, playlist updates go to the playlist service, recommendation requests go to the ML inference service.",
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
          id: 'step-4',
          title: 'Add Load Balancer',
          phases: {
            context: {
              heading: 'Level 1: Step 4',
              body: 'Adding the Load Balancer — distributes traffic across 800+ services.',
            },
            intro: {
              heading: 'Do you know about Load Balancers?',
              body: "Spotify's Load Balancer distributes API requests across thousands of microservice instances.",
            },
            teaching: {
              heading: 'Deep dive: Load Balancer',
              body: "When Taylor Swift drops a new album, millions of users search simultaneously. The load balancer auto-scales the search service cluster while other services remain unaffected.",
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
          id: 'step-5',
          title: 'Add Auth Service',
          phases: {
            context: {
              heading: 'Level 1: Step 5',
              body: 'Adding the Auth Service — handles authentication and Spotify Connect.',
            },
            intro: {
              heading: 'Do you know about Auth Services?',
              body: "Spotify authenticates users via email/password or OAuth (Facebook, Google, Apple).",
            },
            teaching: {
              heading: 'Deep dive: Auth Service',
              body: "Spotify Connect lets you control your TV's Spotify from your phone. The Auth Service issues device tokens so your phone can send commands to your TV's session.",
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
              body: 'Auth Service added. Tutorial complete! You have built Spotify.',
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

export default spotifyTutorial;