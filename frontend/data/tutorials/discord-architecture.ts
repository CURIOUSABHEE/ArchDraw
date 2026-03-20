import { step, level, tutorial, component, edge, msg } from '@/lib/tutorial/factories';
import {
  buildAction,
  buildFirstStepAction,
  buildOpeningL1,
  buildCelebration,
} from '@/lib/tutorial/defaults';
import type { Tutorial } from '@/lib/tutorial/types';

const l1 = level({
  level: 1,
  title: 'Real-Time Platform',
  subtitle: 'Build a voice and text platform in 11 steps',
  description:
    'Build Discord from scratch — a real-time voice and text platform for 19 million active servers. Understand WebRTC peer connections, guild sharding, voice channel architecture, and message history at Cassandra scale.',
  estimatedTime: '~33 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build Discord from scratch. 19 million active servers, 200 million users, 4 billion messages monthly — all delivered in real-time to clients that maintain persistent WebSocket connections even when you're not actively chatting.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "Discord's client is the web app, desktop app (Electron), and mobile app. All maintain persistent WebSocket connections for real-time message delivery and voice channel state — not just when you're actively chatting.",
      action: buildFirstStepAction('Web'),
      why: "Discord's client is unique — it's one of the few apps that maintains persistent connections across web, desktop, and mobile simultaneously. A user might be logged in on all three at once.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Discord',
        'Web Client',
        'maintain persistent WebSocket connections for real-time delivery even when you are not actively chatting',
        "This is how you see the green dot when friends come online instantly — the client keeps a connection open at all times, not just during active use.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Discord has 200 million monthly users across web, desktop (Electron), and mobile apps simultaneously. Each maintains persistent WebSocket connections for real-time events.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the Discord Architecture tutorial. 19 million active servers, 200 million users, 4 billion messages monthly."
        ),
        msg(
          "Discord's client maintains a persistent WebSocket connection at all times — not just when you're actively chatting. This is how you see the green dot when friends come online instantly."
        ),
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Web Client added. Now the API Gateway.',
      errorMessage: 'Add a Web Client node using ⌘K → search "Web".',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        'All HTTP requests (loading message history, updating settings, joining servers) flow through the API Gateway. WebSocket connections for real-time events are also established through it — the gateway handles the initial guild state sync.',
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'all HTTP requests and WebSocket connection establishments entering through a single entry point'),
      why: "Discord's API Gateway handles both REST (message history, settings) and WebSocket (real-time events) traffic. Separating these at the gateway level allows different scaling strategies.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Discord',
        'API Gateway',
        'handle both REST requests for loading history and WebSocket upgrades for real-time event delivery',
        "The gateway routes REST requests to the message service and upgrades WebSocket connections for real-time delivery. It also handles the initial guild state sync — sending you all the channels and members when you connect.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "Discord's gateway handles both REST and WebSocket traffic. When you open Discord, the gateway sends you the full guild state — all servers, channels, roles, and member lists — in one shot.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "Discord handles two types of traffic: REST requests for loading history and WebSocket connections for real-time events."
        ),
        msg(
          "The API Gateway routes REST requests to the message service and upgrades WebSocket connections for real-time delivery. Discord's gateway also handles the initial guild state sync — sending you all the channels and members when you connect."
        ),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now the Load Balancer.',
      errorMessage: 'Add an API Gateway and connect Web → API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add the Load Balancer',
      explanation:
        "Discord's Load Balancer distributes WebSocket connections across thousands of gateway servers. Each gateway server handles ~100,000 concurrent connections using Elixir's actor model — a language designed for massive concurrency.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', '200 million user connections being distributed across thousands of gateway servers'),
      why: "Discord migrated from Python to Elixir for their gateway servers specifically because Elixir handles millions of concurrent lightweight processes — perfect for persistent WebSocket connections.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'Discord',
        'Load Balancer',
        'distribute 200 million persistent WebSocket connections across thousands of Elixir gateway servers',
        "Discord migrated their gateway servers from Python to Elixir for this reason: Elixir handles 100,000 concurrent connections per server without breaking a sweat.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "Discord's gateway servers handle 100,000 concurrent connections each using Elixir's actor model. Connection affinity is maintained — once you connect to a gateway server, all your events flow through that server.",
        'Auth Service'
      ),
      messages: [
        msg(
          "Discord migrated their gateway servers from Python to Elixir. Why? Elixir handles 100,000 concurrent connections per server."
        ),
        msg(
          'The Load Balancer distributes WebSocket connections across Elixir gateway servers. Connection affinity is maintained — once you connect to a gateway server, all your events come through that server.'
        ),
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added and connected. Now the Auth Service.',
      errorMessage: 'Add a Load Balancer and connect API Gateway → Load Balancer.',
    }),
    step({
      id: 4,
      title: 'Add the Auth Service',
      explanation:
        "Discord authenticates users with email/password or OAuth (Google, Apple). The Auth Service issues tokens and manages bot authentication — Discord has millions of bots with their own token system and different rate limits than user tokens.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'every connection being authenticated and classified as either a user or a bot with different rate limits'),
      why: "Discord's auth must handle both human users and bots. Bot tokens have different rate limits and permissions than user tokens — the Auth Service enforces these distinctions on every request.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'Discord',
        'Auth Service',
        'authenticate users and bots, issuing tokens that enforce different rate limits for each',
        "Discord has millions of bots with their own token system. Bots can send 5 messages per second per channel. Users have different limits. The Auth Service enforces these distinctions on every request.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "The Auth Service validates tokens and determines whether the requester is a user or bot. Bots have different rate limits than users — the Auth Service enforces these distinctions on every connection.",
        'Message Service'
      ),
      messages: [
        msg(
          "Discord authenticates both humans and bots. Bots have their own token system with different rate limits."
        ),
        msg(
          "The Auth Service validates tokens and determines whether the requester is a user or bot. Bots can send 5 messages per second per channel. Users have different limits. The Auth Service enforces these distinctions on every request."
        ),
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth Service added and connected. Now the Message Service.',
      errorMessage: 'Add an Auth Service and connect Load Balancer → Auth Service.',
    }),
    step({
      id: 5,
      title: 'Add the Message Service',
      explanation:
        'The Message Service handles text channel messages. Discord stores messages in Cassandra — each message is stored by channel ID and Snowflake message ID, enabling fast range queries for loading message history.',
      action: buildAction('Microservice', 'Auth', 'Message Service', 'text messages being received, processed, and stored with efficient range queries by channel and time'),
      why: "Discord chose Cassandra for message storage because it handles high write throughput and time-series range queries efficiently — exactly what loading a channel's message history requires.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Discord',
        'Message Service',
        'receive, process, and store text messages with efficient time-series range queries by channel',
        "Cassandra's data model is perfect for Discord: messages are stored by (channel_id, message_id) where message_id is a Snowflake. Loading the last 50 messages is a single range query — no JOINs, no full table scans.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Message Service',
        'Auth Service',
        "Cassandra stores messages by (channel_id, message_id) where message_id is a Snowflake timestamp. Loading the last 50 messages is a single range query — no JOINs, no full table scans. 4 billion messages monthly with consistent write performance.",
        'Signaling Server'
      ),
      messages: [
        msg(
          'The Message Service handles all text channel operations. Discord stores messages in Cassandra — chosen for its high write throughput and efficient time-series range queries.'
        ),
        msg(
          "Cassandra's data model is perfect for Discord: messages are stored by (channel_id, message_id) where message_id is a Snowflake. Loading the last 50 messages is a single range query — no JOINs, no full table scans."
        ),
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Message Service.'),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Message Service added and connected. Now the Signaling Server.',
      errorMessage: 'Add a Microservice (Message Service) and connect Auth Service → Message Service.',
    }),
    step({
      id: 6,
      title: 'Add the Signaling Server',
      explanation:
        'Before two Discord users can talk via voice, their clients must exchange SDP (Session Description Protocol) offers through the Signaling Server. This negotiates codecs, ports, and encryption keys before peer-to-peer media can flow.',
      action: buildAction('Signaling Server', 'Microservice', 'Signaling Server', 'SDP offers being exchanged between voice clients before peer-to-peer media can be negotiated'),
      why: "WebRTC requires a signaling channel to exchange connection metadata before peer-to-peer media can flow. The Signaling Server is that channel — it's only used during connection setup, not for media.",
      component: component('signaling_server', 'Signaling'),
      openingMessage: buildOpeningL1(
        'Discord',
        'Signaling Server',
        'exchange SDP offers between voice clients to negotiate codecs, ports, and encryption keys before a call starts',
        "Once both clients agree on connection parameters, the Signaling Server's job is done — media flows directly peer-to-peer, never through Discord's servers.",
        'Signaling Server'
      ),
      celebrationMessage: buildCelebration(
        'Signaling Server',
        'Message Service',
        "The Signaling Server exchanges SDP offers: 'I support Opus codec at 64kbps, my public IP is X, my encryption key is Y.' Once both sides agree, media flows directly peer-to-peer without touching Discord's servers.",
        'TURN Server'
      ),
      messages: [
        msg(
          "Before voice can flow between Discord users, they need to negotiate connection parameters. That's the Signaling Server's job."
        ),
        msg(
          "The Signaling Server exchanges SDP offers between clients: 'I support Opus codec at 64kbps, my public IP is X, my encryption key is Y.' Once both sides agree, the Signaling Server's job is done — media flows directly."
        ),
        msg('Press ⌘K, search for "Signaling Server", add it, then connect Message Service → Signaling Server.'),
      ],
      requiredNodes: ['signaling_server'],
      requiredEdges: [edge('microservice', 'signaling_server')],
      successMessage: 'Signaling Server added and connected. Now the TURN Server.',
      errorMessage: 'Add a Signaling Server and connect Message Service → Signaling Server.',
    }),
    step({
      id: 7,
      title: 'Add the TURN Server',
      explanation:
        '15-20% of WebRTC connections cannot go peer-to-peer due to strict corporate firewalls or symmetric NAT. TURN servers relay the audio — adding ~20ms latency but guaranteeing voice connectivity for everyone.',
      action: buildAction('TURN Server', 'Signaling', 'TURN Server', 'voice traffic being relayed through Discord servers when direct peer-to-peer connection is blocked by firewalls'),
      why: "Without TURN servers, 15-20% of Discord users couldn't use voice chat at all. TURN is the fallback that ensures voice works even in restrictive network environments.",
      component: component('turn_server', 'TURN'),
      openingMessage: buildOpeningL1(
        'Discord',
        'TURN Server',
        'relay voice traffic when direct peer-to-peer connection is blocked by corporate firewalls or strict NAT',
        "15-20% of Discord users are behind firewalls that block direct peer-to-peer connections. Without TURN relay, these users would hear nothing.",
        'TURN Server'
      ),
      celebrationMessage: buildCelebration(
        'TURN Server',
        'Signaling Server',
        "TURN (Traversal Using Relays around NAT) relays audio through Discord's servers when direct connection fails. It adds ~20ms latency but guarantees connectivity. Discord runs TURN servers in every major region to minimize this latency.",
        'Media Server'
      ),
      messages: [
        msg(
          "15-20% of Discord users are behind firewalls that block direct peer-to-peer connections. TURN servers are the solution."
        ),
        msg(
          "TURN (Traversal Using Relays around NAT) relays audio through Discord's servers when direct connection fails. It adds ~20ms latency but guarantees connectivity. Discord runs TURN servers in every major region to minimize this latency."
        ),
        msg('Press ⌘K, search for "TURN Server", add it, then connect Signaling Server → TURN Server.'),
      ],
      requiredNodes: ['turn_server'],
      requiredEdges: [edge('signaling_server', 'turn_server')],
      successMessage: 'TURN Server added and connected. Now the Media Server.',
      errorMessage: 'Add a TURN Server and connect Signaling Server → TURN Server.',
    }),
    step({
      id: 8,
      title: 'Add the Media Server',
      explanation:
        "Discord's Media Server mixes audio from all voice channel participants. In a 10-person channel, each person sends 64kbps Opus audio. The Media Server mixes it and sends each participant the combined stream — reducing 90 peer-to-peer streams to 10.",
      action: buildAction('Media Server', 'TURN', 'Media Server', 'audio from all participants being mixed into a single stream per user, reducing N² connections to N'),
      why: "Without a Media Server, each participant would need to send audio to every other participant — 10 people means 90 streams. The Media Server reduces this to 10 streams total (one per participant).",
      component: component('media_server', 'Media'),
      openingMessage: buildOpeningL1(
        'Discord',
        'Media Server',
        'mix audio from all voice channel participants into one stream per user — reducing 90 peer-to-peer streams to 10',
        "Without a Media Server: 10 people = 90 audio streams, each participant's device CPU explodes. With one: 10 people = 10 streams, each receiving everyone else's voice mixed together minus their own.",
        'Media Server'
      ),
      celebrationMessage: buildCelebration(
        'Media Server',
        'TURN Server',
        "In a 10-person Discord voice channel: without a Media Server, 90 streams. With one: 10 streams. The Media Server receives audio from all participants, mixes them, and sends each person the combined stream minus their own voice. Discord uses Opus codec at 64kbps — high quality, low bandwidth.",
        'Presence Service'
      ),
      messages: [
        msg(
          "In a 10-person Discord voice channel, how many audio streams are there? Without a Media Server: 90. With one: 10."
        ),
        msg(
          'The Media Server receives audio from all participants, mixes them, and sends each person the combined stream minus their own voice. Discord uses Opus codec at 64kbps — high quality, low bandwidth.'
        ),
        msg('Press ⌘K, search for "Media Server", add it, then connect TURN Server → Media Server.'),
      ],
      requiredNodes: ['media_server'],
      requiredEdges: [edge('turn_server', 'media_server')],
      successMessage: 'Media Server added and connected. Now the Presence Service.',
      errorMessage: 'Add a Media Server and connect TURN Server → Media Server.',
    }),
    step({
      id: 9,
      title: 'Add the Presence Service',
      explanation:
        "Discord's Presence Service tracks online status, activity (playing a game, listening to Spotify), and voice channel membership for all users. It broadcasts status changes to all friends in real-time — fanning out updates across millions of users.",
      action: buildAction('Presence Service', 'Microservice', 'Presence Service', 'online status, game activity, and voice channel membership being tracked and broadcast in real-time'),
      why: "Presence is one of Discord's most queried data points — every time you open a server, you see who's online. At 200M users, even 10% online simultaneously is 20M presence queries per second.",
      component: component('presence_service', 'Presence'),
      openingMessage: buildOpeningL1(
        'Discord',
        'Presence Service',
        'track online status, game activity, and voice channel membership for 200 million users and broadcast updates in real-time',
        "The green dot next to your friend's name — that's the Presence Service. It tracks online status for 200 million users and fans out status changes to all your friends' connections instantly.",
        'Presence Service'
      ),
      celebrationMessage: buildCelebration(
        'Presence Service',
        'Message Service',
        "Discord shards presence by user ID. When you come online, your shard broadcasts your status to all your friends' shards. This fan-out is why Discord uses Elixir — it handles millions of concurrent lightweight processes for real-time presence updates.",
        'NoSQL Database'
      ),
      messages: [
        msg(
          "The green dot next to your friend's name — that's the Presence Service. It tracks online status for 200 million users."
        ),
        msg(
          "Discord shards presence by user ID. When you come online, your shard broadcasts your status to all your friends' shards. This fan-out is why Discord uses Elixir — it handles millions of concurrent lightweight processes."
        ),
        msg('Press ⌘K, search for "Presence Service", add it, then connect Message Service → Presence Service.'),
      ],
      requiredNodes: ['presence_service'],
      requiredEdges: [edge('microservice', 'presence_service')],
      successMessage: 'Presence Service added and connected. Now the data layer.',
      errorMessage: 'Add a Presence Service and connect Message Service → Presence Service.',
    }),
    step({
      id: 10,
      title: 'Add the NoSQL Database',
      explanation:
        'Discord stores message history, server configurations, and user data in Cassandra. Discord stores trillions of messages — Cassandra\'s linear scalability and high write throughput make it the right choice for this volume.',
      action: buildAction('NoSQL Database', 'Microservice', 'NoSQL Database', 'all message history, server configurations, and user data being persisted in a linearly scalable document store'),
      why: "Discord migrated from MongoDB to Cassandra as they scaled. Cassandra's write throughput and linear scalability handle Discord's message volume — billions of new messages per day.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'Discord',
        'NoSQL Database',
        'persist message history, server configurations, and user data with linear scalability across trillions of messages',
        "Discord migrated from MongoDB to Cassandra as they scaled. Cassandra's linear scalability and high write throughput handle billions of new messages per day — add nodes, get more capacity.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Message Service',
        "Discord partitions messages by channel_id so all messages in a channel are co-located. When you load a channel, Cassandra fetches all messages from the same partition in parallel — fast reads at massive scale.",
        'In-Memory Cache'
      ),
      messages: [
        msg(
          'Discord stores trillions of messages. They migrated from MongoDB to Cassandra as they scaled.'
        ),
        msg(
          "Cassandra handles Discord's write throughput: billions of new messages per day. It scales linearly — add more nodes, get more capacity. No single point of failure. Discord partitions by channel_id so all messages in a channel are co-located."
        ),
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Message Service → NoSQL Database.'),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('microservice', 'nosql_db')],
      successMessage: 'NoSQL Database added and connected. Now the cache.',
      errorMessage: 'Add a NoSQL Database and connect Message Service → NoSQL Database.',
    }),
    step({
      id: 11,
      title: 'Add the In-Memory Cache',
      explanation:
        "Discord caches guild state, member lists, and active voice sessions in Redis. When you join a server, the member list and channel list are served from Redis — permission checks take microseconds instead of milliseconds.",
      action: buildAction('In-Memory Cache', 'Microservice', 'In-Memory Cache', 'guild state, member lists, and permission settings being cached for sub-millisecond reads'),
      why: "Guild state is read constantly — every message send requires knowing the channel's permission settings. Caching this in Redis means permission checks take microseconds instead of milliseconds.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'Discord',
        'In-Memory Cache',
        'cache guild state, member lists, and permission settings for sub-millisecond reads on every message',
        "Every message send requires a permission check: can this user send messages in this channel? That check hits Redis in under 1ms. Without the cache, every message would require a database read.",
        'In-Memory Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'Message Service',
        "Guild state is read on every single interaction: message sends, channel joins, role checks. Caching this in Redis means permission checks take microseconds instead of milliseconds. This is the final piece — you have built Discord.",
        'nothing — you have built Discord'
      ),
      messages: [
        msg(
          "Final step — the cache. Discord caches guild state in Redis so permission checks are instant."
        ),
        msg(
          "Every message send requires a permission check: can this user send messages in this channel? That check hits Redis — sub-millisecond. Without the cache, every message would require a database read for permissions."
        ),
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect Message Service → In-Memory Cache.'),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('microservice', 'in_memory_cache')],
      successMessage: 'In-Memory Cache added and connected. You have built Discord.',
      errorMessage: 'Add an In-Memory Cache and connect Message Service → In-Memory Cache.',
    }),
  ],
});

export const discordTutorial: Tutorial = tutorial({
  id: 'discord-architecture',
  title: 'How to Design Discord Architecture',
  description:
    'Build a real-time voice and text platform for 19 million active servers. Understand WebRTC, guild sharding, voice channel architecture, and message history at scale.',
  difficulty: 'Advanced',
  category: 'Communication',
  isLive: false,
  icon: 'MessageSquare',
  color: '#5865f2',
  tags: ['WebRTC', 'Voice', 'Sharding', 'Real-time', 'Guilds'],
  estimatedTime: '~33 mins',
  levels: [l1],
});
