import { step, level, tutorial, component, edge, msg } from '@/lib/tutorial/factories';
import {
  buildAction,
  buildFirstStepAction,
  buildOpeningL1,
  buildOpeningL2,
  buildOpeningL3,
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
  unlocks: 'Production Layer',
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
        msg("Press ⌘K and search for \"Web\" and press Enter to add the client to the canvas."),
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
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
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
        msg("Press ⌘K and search for \"Load Balancer\" and press Enter to add it, then connect API Gateway → Load Balancer."),
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
        msg("Press ⌘K and search for \"Auth Service\" and press Enter to add it, then connect Load Balancer → Auth Service."),
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
        msg("Press ⌘K and search for \"Microservice\" and press Enter to add it, then connect Auth Service → Message Service."),
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
        msg("Press ⌘K and search for \"Signaling Server\" and press Enter to add it, then connect Message Service → Signaling Server."),
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
        msg("Press ⌘K and search for \"TURN Server\" and press Enter to add it, then connect Signaling Server → TURN Server."),
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
        msg("Press ⌘K and search for \"Media Server\" and press Enter to add it, then connect TURN Server → Media Server."),
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
        msg("Press ⌘K and search for \"Presence Service\" and press Enter to add it, then connect Message Service → Presence Service."),
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
        msg("Press ⌘K and search for \"NoSQL Database\" and press Enter to add it, then connect Message Service → NoSQL Database."),
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
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect Message Service → In-Memory Cache."),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('microservice', 'in_memory_cache')],
      successMessage: 'In-Memory Cache added and connected. You have built Discord.',
      errorMessage: 'Add an In-Memory Cache and connect Message Service → In-Memory Cache.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "Discord at Scale",
  subtitle: "Stream billions of real-time events with presence and rate limiting",
  description:
    "Add Kafka event streaming, Redis presence caching, CDC pipelines, and SLO tracking to Discord's architecture. Handle billions of real-time events and millions of concurrent voice users.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale Discord. 200 million users, billions of real-time events, and millions of concurrent voice connections. This requires Kafka for event streaming, Redis for presence, and enterprise-grade observability.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "Discord's Event Bus streams message events, voice state changes, and presence updates. When a popular streamer goes live, millions of presence updates stream through Kafka within seconds.",
      why:
        "Without Kafka, presence updates would require synchronous database writes for every status change. At 200 million users, that's millions of writes per second — impossible to scale.",
      action: buildAction(
        "Kafka / Streaming",
        "Load Balancer",
        "Kafka Streaming",
        "message events, voice state changes, and presence updates being streamed to consumers in real time"
      ),
      component: component("kafka_streaming", "Kafka / Streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "Discord",
        "Kafka Streaming",
        "stream message events, voice state changes, and presence updates to consumers in real time",
        "When a popular streamer goes live, millions of presence updates stream through Kafka within seconds.",
        "Kafka / Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "Load Balancer",
        "Discord's Event Bus streams message events, voice state changes, and presence updates. When a popular streamer goes live, millions of presence updates stream through Kafka within seconds.",
        "Notification Worker"
      ),
      messages: [
        msg(
          "Level 2 — Discord at Scale. Now add Kafka for event streaming, Redis for presence, and enterprise-grade observability."
        ),
        msg(
          "Discord's Event Bus streams message events, voice state changes, and presence updates. When a popular streamer goes live, millions of presence updates stream through Kafka within seconds."
        ),
        msg(
          "Press ⌘K and search for \"Kafka / Streaming\" and press Enter to add it, then connect Load Balancer → Kafka Streaming."
        ),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("load_balancer", "kafka_streaming")],
      successMessage: "Kafka streaming added. Now notifications.",
      errorMessage: "Add Kafka Streaming connected from the Load Balancer.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "Discord's Notification Worker handles push notifications for mentions, DMs, and server announcements. It must route notifications to the correct device — mobile, desktop, or browser.",
      why:
        "Notification routing across platforms is complex — the worker must route to the correct device based on user preferences and connection state.",
      action: buildAction(
        "Worker",
        "Kafka",
        "Notification Worker",
        "push notifications being routed to the correct device — mobile, desktop, or browser"
      ),
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "Discord",
        "Notification Worker",
        "route push notifications to the correct device — mobile, desktop, or browser",
        "Discord's Notification Worker must route notifications to the correct device across multiple platforms.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "Discord's Notification Worker handles push notifications for mentions, DMs, and server announcements. It must route notifications to the correct device — mobile, desktop, or browser.",
        "In-Memory Cache"
      ),
      messages: [
        msg(
          "Discord's Notification Worker handles push notifications for mentions, DMs, and server announcements."
        ),
        msg(
          "It must route notifications to the correct device — mobile, desktop, or browser. When you're on mobile, you get a push. When you're on desktop, you get an in-app notification."
        ),
        msg(
          "Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Kafka Streaming → Notification Worker."
        ),
      ],
      requiredNodes: ["worker_job"],
      requiredEdges: [edge("kafka_streaming", "worker_job")],
      successMessage: "Notifications added. Now Redis caching.",
      errorMessage: "Add a Worker connected from Kafka Streaming.",
    }),
    step({
      id: 3,
      title: "Add In-Memory Cache",
      explanation:
        "Discord's Redis Cache stores active voice channel state, online presence, and rate limit buckets. With 200 million users, Redis must handle millions of presence updates per second.",
      why:
        "Presence is the most queried data in Discord — every channel view shows online friends. Redis handles millions of presence reads per second with sub-millisecond latency.",
      action: buildAction(
        "In-Memory Cache",
        "Load Balancer",
        "In-Memory Cache",
        "voice channel state, online presence, and rate limit buckets being cached for millions of concurrent users"
      ),
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "Discord",
        "Redis Cache",
        "cache voice channel state, online presence, and rate limit buckets for millions of concurrent users",
        "With 200 million users, Redis must handle millions of presence updates per second.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "Load Balancer",
        "Discord's Redis Cache stores active voice channel state, online presence, and rate limit buckets. With 200 million users, Redis must handle millions of presence updates per second.",
        "CDC Connector"
      ),
      messages: [
        msg(
          "Discord's Redis Cache stores active voice channel state, online presence, and rate limit buckets."
        ),
        msg(
          "With 200 million users, Redis must handle millions of presence updates per second. When you come online, your status fans out to all your friends' connections instantly."
        ),
        msg(
          "Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect Load Balancer → In-Memory Cache."
        ),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("load_balancer", "in_memory_cache")],
      successMessage: "Redis caching added. Now CDC pipelines.",
      errorMessage: "Add an In-Memory Cache connected from the Load Balancer.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "Discord's CDC Connector mirrors message data to the analytics platform. Message sentiment, engagement metrics, and channel activity stream to ClickHouse for real-time analytics.",
      why:
        "CDC (Change Data Capture) streams database changes to analytics without impacting the primary Cassandra write path — essential for real-time insights at scale.",
      action: buildAction(
        "CDC Connector",
        "Microservice",
        "CDC Connector",
        "message data being mirrored to ClickHouse for real-time analytics on sentiment and engagement"
      ),
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "Discord",
        "CDC Connector",
        "mirror message data to ClickHouse for real-time analytics on sentiment and engagement",
        "Message sentiment, engagement metrics, and channel activity stream to ClickHouse for real-time analytics.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "Message Service",
        "Discord's CDC Connector mirrors message data to the analytics platform. Message sentiment, engagement metrics, and channel activity stream to ClickHouse for real-time analytics.",
        "SQL Database"
      ),
      messages: [
        msg(
          "Discord's CDC Connector mirrors message data to the analytics platform."
        ),
        msg(
          "Message sentiment, engagement metrics, and channel activity stream to ClickHouse for real-time analytics. Discord can see trending channels within seconds of activity."
        ),
        msg(
          "Press ⌘K and search for \"CDC Connector\" and press Enter to add it, then connect Message Service → CDC Connector."
        ),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("microservice", "cdc_connector")],
      successMessage: "CDC pipeline added. Now SQL for users.",
      errorMessage: "Add a CDC Connector connected from the Message Service.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "Discord's MySQL stores user accounts, server membership, and message history (for premium servers). Discord's message history is stored in Cassandra — but user and server data lives in MySQL.",
      why:
        "User accounts require ACID transactions for billing and Nitro subscriptions. Cassandra handles messages at scale, but MySQL is required for financial data integrity.",
      action: buildAction(
        "SQL Database",
        "Auth Service",
        "SQL Database",
        "user accounts, server membership, and premium message history being stored with ACID guarantees"
      ),
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "Discord",
        "SQL Database",
        "store user accounts, server membership, and premium message history with ACID guarantees",
        "Discord's message history is stored in Cassandra — but user and server data lives in MySQL.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "Auth Service",
        "Discord's MySQL stores user accounts, server membership, and message history (for premium servers). Discord's message history is stored in Cassandra — but user and server data lives in MySQL.",
        "Structured Logger"
      ),
      messages: [
        msg(
          "Discord's MySQL stores user accounts, server membership, and message history (for premium servers)."
        ),
        msg(
          "Discord's message history is stored in Cassandra — but user and server data lives in MySQL. ACID transactions ensure consistent billing for Nitro subscriptions."
        ),
        msg(
          "Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect Auth Service → SQL Database."
        ),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("auth_service", "sql_db")],
      successMessage: "SQL database added. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the Auth Service.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "Discord's Structured Logger captures every message sent, voice join, and moderation action. Logs flow to Datadog — Discord processes billions of log lines from millions of concurrent connections.",
      why:
        "Without structured logging, debugging issues across thousands of concurrent connections would be impossible. Datadog queries structured logs to find issues in seconds.",
      action: buildAction(
        "Structured Logger",
        "Load Balancer",
        "Structured Logger",
        "every message, voice join, and moderation action being captured as structured logs flowing to Datadog"
      ),
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "Discord",
        "Structured Logger",
        "capture every message, voice join, and moderation action as structured logs flowing to Datadog",
        "Discord processes billions of log lines from millions of concurrent connections.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "Load Balancer",
        "Discord's Structured Logger captures every message sent, voice join, and moderation action. Logs flow to Datadog — Discord processes billions of log lines from millions of concurrent connections.",
        "SLO Tracker"
      ),
      messages: [
        msg(
          "Discord's Structured Logger captures every message sent, voice join, and moderation action."
        ),
        msg(
          "Logs flow to Datadog — Discord processes billions of log lines from millions of concurrent connections. Moderation teams can audit any action in seconds."
        ),
        msg(
          "Press ⌘K and search for \"Structured Logger\" and press Enter to add it, then connect Load Balancer → Structured Logger."
        ),
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("load_balancer", "structured_logger")],
      successMessage: "Structured logging added. Now SLO tracking.",
      errorMessage: "Add a Structured Logger connected from the Load Balancer.",
    }),
    step({
      id: 7,
      title: "Add SLO Tracker",
      explanation:
        "Discord's SLO Tracker monitors message delivery latency, voice connection time, and gateway uptime. Message delivery must complete in <100ms — tracked as a top-tier SLO.",
      why:
        "Without SLOs, engineering teams argue about what 'good enough' means. With SLOs, there's a clear contractual target — message delivery under 100ms is non-negotiable.",
      action: buildAction(
        "SLO/SLI Tracker",
        "Metrics Collector",
        "SLO/SLI Tracker",
        "message delivery latency, voice connection time, and gateway uptime being tracked as top-tier SLOs"
      ),
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "Discord",
        "SLO Tracker",
        "monitor message delivery latency, voice connection time, and gateway uptime as top-tier SLOs",
        "Message delivery must complete in <100ms — tracked as a top-tier SLO.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO/SLI Tracker",
        "Metrics Collector",
        "Discord's SLO Tracker monitors message delivery latency, voice connection time, and gateway uptime. Message delivery must complete in <100ms — tracked as a top-tier SLO.",
        "Error Budget Alert"
      ),
      messages: [
        msg(
          "Discord's SLO Tracker monitors message delivery latency, voice connection time, and gateway uptime."
        ),
        msg(
          "Message delivery must complete in <100ms — tracked as a top-tier SLO. When latency exceeds the SLO target, on-call is alerted."
        ),
        msg(
          "Press ⌘K and search for \"SLO/SLI Tracker\" and press Enter to add it, then connect Metrics Collector → SLO/SLI Tracker."
        ),
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("metrics_collector", "slo_tracker")],
      successMessage: "SLO tracking added. Now error budgets.",
      errorMessage: "Add an SLO/SLI Tracker connected from the Metrics Collector.",
    }),
    step({
      id: 8,
      title: "Add Error Budget Alert",
      explanation:
        "Discord's Error Budget Monitor tracks message delivery SLO consumption. During a DDoS attack, the error budget is consumed rapidly — on-call teams use this to make real-time capacity decisions.",
      why:
        "The error budget is the reliability buffer between SLO target and 100%. When depleted during an attack, feature launches pause until reliability recovers.",
      action: buildAction(
        "Error Budget Monitor",
        "SLO/SLI Tracker",
        "Error Budget Monitor",
        "error budget burn rate being tracked for real-time capacity decisions during DDoS attacks"
      ),
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "Discord",
        "Error Budget Alert",
        "track error budget burn rate for real-time capacity decisions during DDoS attacks",
        "During a DDoS attack, the error budget is consumed rapidly — on-call teams use this to make real-time capacity decisions.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Alert",
        "SLO/SLI Tracker",
        "Discord's Error Budget Monitor tracks message delivery SLO consumption. During a DDoS attack, the error budget is consumed rapidly — on-call teams use this to make real-time capacity decisions.",
        "Level 3"
      ),
      messages: [
        msg(
          "Discord's Error Budget Monitor tracks message delivery SLO consumption."
        ),
        msg(
          "During a DDoS attack, the error budget is consumed rapidly — on-call teams use this to make real-time capacity decisions."
        ),
        msg(
          "Press ⌘K and search for \"Error Budget Monitor\" and press Enter to add it, then connect SLO/SLI Tracker → Error Budget Monitor."
        ),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget monitoring added. Discord is now at scale.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO/SLI Tracker.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "Discord Enterprise",
  subtitle: "Add zero-trust voice routing, gateway tracing, and audit logging",
  description:
    "Implement zero-trust networking for voice media, distributed tracing across gateway servers, and audit logging for moderation. Discord Enterprise serves gaming companies with compliance-grade logging requirements.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make Discord enterprise-grade. Zero-trust voice routing, gateway distributed tracing, and immutable audit logs. Discord Enterprise serves gaming studios with compliance requirements that drive architectural decisions.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "Discord's Service Mesh (Envoy) handles mTLS between gateway servers, voice servers, and media services. Discord's architecture uses a custom transport (Disstress) over UDP for voice — meshed separately from the REST API mesh.",
      why:
        "Without a service mesh, each service implements TLS differently — inconsistent and hard to maintain. Envoy handles mTLS transparently at the infrastructure layer.",
      action: buildAction(
        "Service Mesh (Istio)",
        "Load Balancer",
        "Service Mesh",
        "mTLS being enforced between gateway servers, voice servers, and media services with separate meshes for UDP voice and REST API"
      ),
      component: component("service_mesh", "Service Mesh (Istio)"),
      openingMessage: buildOpeningL3(
        "Discord",
        "Service Mesh",
        "enforce mTLS between gateway servers, voice servers, and media services with separate meshes for UDP voice and REST API",
        "Discord's architecture uses a custom transport (Disstress) over UDP for voice — meshed separately from the REST API mesh.",
        "Service Mesh (Istio)"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "Load Balancer",
        "Discord's Service Mesh (Envoy) handles mTLS between gateway servers, voice servers, and media services. Discord's architecture uses a custom transport (Disstress) over UDP for voice — meshed separately from the REST API mesh.",
        "BFF Gateway"
      ),
      messages: [
        msg(
          "Level 3 — Discord Enterprise. Let's add zero-trust networking for voice media, distributed tracing, and audit logging."
        ),
        msg(
          "Discord's Service Mesh (Envoy) handles mTLS between gateway servers, voice servers, and media services. Discord's architecture uses a custom transport (Disstress) over UDP for voice — meshed separately from the REST API mesh."
        ),
        msg(
          "Press ⌘K and search for \"Service Mesh (Istio)\" and press Enter to add it, then connect Load Balancer → Service Mesh."
        ),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("load_balancer", "service_mesh")],
      successMessage: "Service mesh added. Now the BFF gateway.",
      errorMessage: "Add a Service Mesh connected from the Load Balancer.",
    }),
    step({
      id: 2,
      title: "Add BFF Gateway",
      explanation:
        "Discord's BFF Gateway serves the client with optimized gateway protocols. The BFF manages WebSocket connections, batches events, and handles the proprietary Discord Gateway protocol for real-time updates.",
      why:
        "Without a BFF, the client would need to manage WebSocket connections and event batching itself. The BFF abstracts this complexity and provides a cleaner API.",
      action: buildAction(
        "BFF Gateway",
        "API Gateway",
        "BFF Gateway",
        "WebSocket connections, event batching, and the proprietary Discord Gateway protocol being handled for real-time updates"
      ),
      component: component("bff_gateway", "BFF Gateway"),
      openingMessage: buildOpeningL3(
        "Discord",
        "BFF Gateway",
        "handle WebSocket connections, event batching, and the proprietary Discord Gateway protocol for real-time updates",
        "The BFF manages WebSocket connections, batches events, and handles the proprietary Discord Gateway protocol for real-time updates.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "API Gateway",
        "Discord's BFF Gateway serves the client with optimized gateway protocols. The BFF manages WebSocket connections, batches events, and handles the proprietary Discord Gateway protocol for real-time updates.",
        "Leaky Bucket Rate Limiter"
      ),
      messages: [
        msg(
          "Discord's BFF Gateway serves the client with optimized gateway protocols."
        ),
        msg(
          "The BFF manages WebSocket connections, batches events, and handles the proprietary Discord Gateway protocol for real-time updates. This is the protocol that keeps your Discord open in the background."
        ),
        msg(
          "Press ⌘K and search for \"BFF Gateway\" and press Enter to add it, then connect API Gateway → BFF Gateway."
        ),
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("api_gateway", "bff_gateway")],
      successMessage: "BFF gateway added. Now rate limiting.",
      errorMessage: "Add a BFF Gateway connected from the API Gateway.",
    }),
    step({
      id: 3,
      title: "Add Leaky Bucket Rate Limiter",
      explanation:
        "Discord's Leaky Bucket Rate Limiter enforces API rate limits: 10 requests/second globally, 120 requests/minute per channel. Leaky buckets smooth bursts while preventing sustained abuse.",
      why:
        "Without rate limiting, abusive clients could overwhelm Discord's services. Leaky buckets smooth traffic spikes while enforcing fair usage limits.",
      action: buildAction(
        "Leaky Bucket Rate Limiter",
        "BFF Gateway",
        "Leaky Bucket Rate Limiter",
        "10 requests/second globally and 120 requests/minute per channel being enforced with leaky bucket smoothing"
      ),
      component: component("leaky_bucket_limiter", "Leaky Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "Discord",
        "Leaky Bucket Rate Limiter",
        "enforce 10 requests/second globally and 120 requests/minute per channel with leaky bucket smoothing",
        "Leaky buckets smooth bursts while preventing sustained abuse.",
        "Leaky Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Leaky Bucket Rate Limiter",
        "BFF Gateway",
        "Discord's Leaky Bucket Rate Limiter enforces API rate limits: 10 requests/second globally, 120 requests/minute per channel. Leaky buckets smooth bursts while preventing sustained abuse.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg(
          "Discord's Leaky Bucket Rate Limiter enforces API rate limits: 10 requests/second globally, 120 requests/minute per channel."
        ),
        msg(
          "Leaky buckets smooth bursts while preventing sustained abuse. If a bot tries to spam messages, the rate limiter kicks in — you know that 429 error you see sometimes?"
        ),
        msg(
          "Press ⌘K and search for \"Leaky Bucket Rate Limiter\" and press Enter to add it, then connect BFF Gateway → Leaky Bucket Rate Limiter."
        ),
      ],
      requiredNodes: ["leaky_bucket_limiter"],
      requiredEdges: [edge("bff_gateway", "leaky_bucket_limiter")],
      successMessage: "Rate limiting added. Now distributed tracing.",
      errorMessage: "Add a Leaky Bucket Rate Limiter connected from the BFF Gateway.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "Discord's OTel Collector traces message routing, voice channel allocation, and guild shard placement. A message to a 100,000-member server touches dozens of services.",
      why:
        "Without distributed tracing, debugging a slow message delivery across dozens of services would be impossible. OTel makes the entire flow visible.",
      action: buildAction(
        "OpenTelemetry Collector",
        "Metrics Collector",
        "OpenTelemetry Collector",
        "message routing, voice channel allocation, and guild shard placement being traced across dozens of services"
      ),
      component: component("otel_collector", "OpenTelemetry Collector"),
      openingMessage: buildOpeningL3(
        "Discord",
        "OpenTelemetry Collector",
        "trace message routing, voice channel allocation, and guild shard placement across dozens of services",
        "A message to a 100,000-member server touches dozens of services.",
        "OpenTelemetry Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "Metrics Collector",
        "Discord's OTel Collector traces message routing, voice channel allocation, and guild shard placement. A message to a 100,000-member server touches dozens of services.",
        "Correlation ID Handler"
      ),
      messages: [
        msg(
          "Discord's OTel Collector traces message routing, voice channel allocation, and guild shard placement."
        ),
        msg(
          "A message to a 100,000-member server touches dozens of services. Without distributed tracing, debugging a slow message delivery would be impossible."
        ),
        msg(
          "Press ⌘K and search for \"OpenTelemetry Collector\" and press Enter to add it, then connect Metrics Collector → OpenTelemetry Collector."
        ),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("metrics_collector", "otel_collector")],
      successMessage: "Distributed tracing added. Now correlation IDs.",
      errorMessage: "Add an OpenTelemetry Collector connected from the Metrics Collector.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "Discord's Correlation ID links a user action (posting a message) to the gateway, message processing, notification worker, and CDN upload. Debugging a lost message requires tracing across all these components.",
      why:
        "Without correlation IDs, tracing a message across multiple services is impossible. The correlation ID follows the message through every hop.",
      action: buildAction(
        "Correlation ID Handler",
        "BFF Gateway",
        "Correlation ID Handler",
        "user actions being traced across gateway, message processing, notification worker, and CDN upload"
      ),
      component: component("correlation_id_handler", "Correlation ID Handler"),
      openingMessage: buildOpeningL3(
        "Discord",
        "Correlation ID Handler",
        "trace user actions across gateway, message processing, notification worker, and CDN upload",
        "Debugging a lost message requires tracing across all these components.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "BFF Gateway",
        "Discord's Correlation ID links a user action (posting a message) to the gateway, message processing, notification worker, and CDN upload. Debugging a lost message requires tracing across all these components.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg(
          "Discord's Correlation ID links a user action (posting a message) to the gateway, message processing, notification worker, and CDN upload."
        ),
        msg(
          "Debugging a lost message requires tracing across all these components. The correlation ID follows every hop — from the client to the gateway to the notification worker."
        ),
        msg(
          "Press ⌘K and search for \"Correlation ID Handler\" and press Enter to add it, then connect BFF Gateway → Correlation ID Handler."
        ),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("bff_gateway", "correlation_id_handler")],
      successMessage: "Correlation IDs added. Now mTLS certificates.",
      errorMessage: "Add a Correlation ID Handler connected from the BFF Gateway.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "Discord's SPIFFE CA issues certificates to every voice server and gateway node. Voice servers are particularly sensitive — compromised voice nodes could intercept media.",
      why:
        "Without automated certificate rotation, expired certificates would cause voice outages. SPIFFE automates certificate issuance and rotation across all nodes.",
      action: buildAction(
        "mTLS Certificate Authority",
        "Service Mesh",
        "mTLS Certificate Authority",
        "SPIFFE certificates being issued to every voice server and gateway node for zero-trust voice media"
      ),
      component: component("mtls_certificate_authority", "mTLS Certificate Authority"),
      openingMessage: buildOpeningL3(
        "Discord",
        "mTLS Certificate Authority",
        "issue SPIFFE certificates to every voice server and gateway node for zero-trust voice media",
        "Voice servers are particularly sensitive — compromised voice nodes could intercept media.",
        "mTLS Certificate Authority"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "Discord's SPIFFE CA issues certificates to every voice server and gateway node. Voice servers are particularly sensitive — compromised voice nodes could intercept media.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg(
          "Discord's SPIFFE CA issues certificates to every voice server and gateway node."
        ),
        msg(
          "Voice servers are particularly sensitive — compromised voice nodes could intercept media. SPIFFE certificates ensure every node is authenticated before handling voice traffic."
        ),
        msg(
          "Press ⌘K and search for \"mTLS Certificate Authority\" and press Enter to add it, then connect Service Mesh → mTLS Certificate Authority."
        ),
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "mTLS certificates added. Now cache stampede protection.",
      errorMessage: "Add an mTLS Certificate Authority connected from the Service Mesh.",
    }),
    step({
      id: 7,
      title: "Add Cache Stampede Guard",
      explanation:
        "Discord's Cache Stampede Guard protects emoji and sticker CDN caches from stampedes when a viral message uses a new sticker. Lock-assisted refresh prevents origin overload.",
      why:
        "Without stampede protection, a viral sticker would cause millions of simultaneous cache misses, overwhelming the origin server.",
      action: buildAction(
        "Cache Stampede Guard",
        "CDN",
        "Cache Stampede Guard",
        "emoji and sticker CDN caches being protected from stampedes with lock-assisted refresh"
      ),
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "Discord",
        "Cache Stampede Guard",
        "protect emoji and sticker CDN caches from stampedes when viral messages use new stickers",
        "Lock-assisted refresh prevents origin overload.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "CDN",
        "Discord's Cache Stampede Guard protects emoji and sticker CDN caches from stampedes when a viral message uses a new sticker. Lock-assisted refresh prevents origin overload.",
        "Change Data Cache"
      ),
      messages: [
        msg(
          "Discord's Cache Stampede Guard protects emoji and sticker CDN caches from stampedes when a viral message uses a new sticker."
        ),
        msg(
          "Lock-assisted refresh prevents origin overload. Without it, millions of requests would hit the origin simultaneously when a cache misses during a viral moment."
        ),
        msg(
          "Press ⌘K and search for \"Cache Stampede Guard\" and press Enter to add it, then connect CDN → Cache Stampede Guard."
        ),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("cdn", "cache_stampede_guard")],
      successMessage: "Cache stampede protection added. Now CDC caching.",
      errorMessage: "Add a Cache Stampede Guard connected from the CDN.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "Discord's CDC pipeline caches guild member lists and role hierarchies. These are precomputed in Redis for fast permission checks — sub-millisecond role resolution is critical for moderation.",
      why:
        "Without precomputed role hierarchies, permission checks would require database joins on every message. At 4 billion messages monthly, that's millions of joins per second.",
      action: buildAction(
        "Change Data Cache",
        "CDC Connector",
        "Change Data Cache",
        "guild member lists and role hierarchies being precomputed in Redis for sub-millisecond permission checks"
      ),
      component: component("change_data_cache", "Change Data Cache"),
      openingMessage: buildOpeningL3(
        "Discord",
        "Change Data Cache",
        "precompute guild member lists and role hierarchies in Redis for sub-millisecond permission checks",
        "Sub-millisecond role resolution is critical for moderation.",
        "Change Data Cache"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "CDC Connector",
        "Discord's CDC pipeline caches guild member lists and role hierarchies. These are precomputed in Redis for fast permission checks — sub-millisecond role resolution is critical for moderation.",
        "Data Warehouse"
      ),
      messages: [
        msg(
          "Discord's CDC pipeline caches guild member lists and role hierarchies."
        ),
        msg(
          "These are precomputed in Redis for fast permission checks — sub-millisecond role resolution is critical for moderation. When someone with Manage Messages tries to purge spam, the permission check must be instant."
        ),
        msg(
          "Press ⌘K and search for \"Change Data Cache\" and press Enter to add it, then connect CDC Connector → Change Data Cache."
        ),
      ],
      requiredNodes: ["change_data_cache"],
      requiredEdges: [edge("cdc_connector", "change_data_cache")],
      successMessage: "CDC caching added. Now data warehouse.",
      errorMessage: "Add a Change Data Cache connected from the CDC Connector.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "Discord's Data Warehouse (ClickHouse) stores message analytics, Nitro subscription metrics, and engagement funnels. This data drives Discord's product and monetization decisions.",
      why:
        "The operational database is optimized for writes, not analytical queries. ClickHouse handles billions of rows for product analytics without impacting live services.",
      action: buildAction(
        "Data Warehouse",
        "CDC Connector",
        "Data Warehouse",
        "message analytics, Nitro subscription metrics, and engagement funnels being stored for product decisions"
      ),
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "Discord",
        "Data Warehouse",
        "store message analytics, Nitro subscription metrics, and engagement funnels for product decisions",
        "This data drives Discord's product and monetization decisions.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "CDC Connector",
        "Discord's Data Warehouse (ClickHouse) stores message analytics, Nitro subscription metrics, and engagement funnels. This data drives Discord's product and monetization decisions.",
        "Event Store"
      ),
      messages: [
        msg(
          "Discord's Data Warehouse (ClickHouse) stores message analytics, Nitro subscription metrics, and engagement funnels."
        ),
        msg(
          "This data drives Discord's product and monetization decisions. Product managers query ClickHouse to understand which features drive Nitro conversions."
        ),
        msg(
          "Press ⌘K and search for \"Data Warehouse\" and press Enter to add it, then connect CDC Connector → Data Warehouse."
        ),
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("cdc_connector", "data_warehouse")],
      successMessage: "Data warehouse added. Now audit logging.",
      errorMessage: "Add a Data Warehouse connected from the CDC Connector.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "Discord's Event Store stores audit logs for server moderation: bans, kicks, role changes. Immutable audit logs are required for server admins and legal compliance.",
      why:
        "Event stores provide immutable, append-only logs. Once written, audit logs cannot be modified — essential for legal compliance and server administration.",
      action: buildAction(
        "Event Store",
        "Structured Logger",
        "Event Store",
        "immutable audit logs being stored for bans, kicks, and role changes for server admins and legal compliance"
      ),
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "Discord",
        "Event Store",
        "store immutable audit logs for bans, kicks, and role changes for server admins and legal compliance",
        "Immutable audit logs are required for server admins and legal compliance.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "Structured Logger",
        "Discord's Event Store stores audit logs for server moderation: bans, kicks, role changes. Immutable audit logs are required for server admins and legal compliance.",
        "Prefetch Cache"
      ),
      messages: [
        msg(
          "Discord's Event Store stores audit logs for server moderation: bans, kicks, role changes."
        ),
        msg(
          "Immutable audit logs are required for server admins and legal compliance. Server admins can review who banned whom and why. Legal teams can subpoena moderation records."
        ),
        msg(
          "Press ⌘K and search for \"Event Store\" and press Enter to add it, then connect Structured Logger → Event Store."
        ),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("structured_logger", "event_store")],
      successMessage: "Event store added. Now prefetch caching.",
      errorMessage: "Add an Event Store connected from the Structured Logger.",
    }),
    step({
      id: 11,
      title: "Add Prefetch Cache",
      explanation:
        "Discord's Prefetch Cache preloads emoji packs and channel state for servers users frequently visit. When you switch channels, the next channel's state is preloaded.",
      why:
        "Prefetching makes channel switches feel instant. The BFF predicts where users will go next and preloads content before they click.",
      action: buildAction(
        "Prefetch Cache",
        "BFF Gateway",
        "Prefetch Cache",
        "emoji packs and channel state being preloaded for frequently visited servers"
      ),
      component: component("prefetch_cache", "Prefetch Cache"),
      openingMessage: buildOpeningL3(
        "Discord",
        "Prefetch Cache",
        "preload emoji packs and channel state for frequently visited servers",
        "When you switch channels, the next channel's state is preloaded.",
        "Prefetch Cache"
      ),
      celebrationMessage: buildCelebration(
        "Prefetch Cache",
        "BFF Gateway",
        "Discord's Prefetch Cache preloads emoji packs and channel state for servers users frequently visit. When you switch channels, the next channel's state is preloaded.",
        "nothing — you have built Discord Enterprise"
      ),
      messages: [
        msg(
          "Discord's Prefetch Cache preloads emoji packs and channel state for servers users frequently visit."
        ),
        msg(
          "When you switch channels, the next channel's state is preloaded. This is why channel switches feel instant — the BFF already fetched the messages before you clicked."
        ),
        msg(
          "Press ⌘K and search for \"Prefetch Cache\" and press Enter to add it, then connect BFF Gateway → Prefetch Cache."
        ),
      ],
      requiredNodes: ["prefetch_cache"],
      requiredEdges: [edge("bff_gateway", "prefetch_cache")],
      successMessage: "Prefetch caching added. You have built Discord Enterprise.",
      errorMessage: "Add a Prefetch Cache connected from the BFF Gateway.",
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
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
