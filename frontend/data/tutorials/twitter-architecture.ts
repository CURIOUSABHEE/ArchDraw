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
  title: 'Fan-Out at Social Scale',
  subtitle: 'Solve the fan-out problem in 11 steps',
  description:
    'Solve the fan-out problem serving 500M users. Build tweet delivery, real-time feeds, trending topics, and a timeline that scales to millions of concurrent reads.',
  estimatedTime: '~32 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build Twitter from scratch. 500 million users, 500 million tweets per day, and the hardest fan-out problem in social media. When a celebrity tweets, 150 million followers need to see it in under 5 seconds. This hybrid push/pull architecture is what makes that possible.",
  steps: [
    step({
      id: 1,
      title: 'Start with the Client',
      explanation:
        "Twitter's client is the web app and mobile app. Users compose tweets, scroll their timeline, and receive real-time notifications. The client maintains a WebSocket connection for live updates.",
      action: buildFirstStepAction('Web'),
      why: "Every architecture starts from the user. Twitter's web and mobile clients define the two core flows: writing tweets (low volume, high fanout) and reading timelines (extremely high volume).",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'Web and Mobile Clients',
        'handle two distinct flows: composing and fan-outing tweets for writers, and reading pre-computed timelines for readers',
        "Writing a tweet is rare but triggers massive fan-out — potentially 150 million writes if a celebrity tweets. Reading your timeline happens constantly and must be instant. These two flows — write-heavy fan-out vs read-heavy pre-computation — drive the entire architecture.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Twitter's clients handle two distinct flows: writing tweets (low volume, high fan-out to millions of followers) and reading timelines (high volume, pre-computed for instant loads). These two flows shape every architectural decision.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the Twitter/X Architecture tutorial. 500 million users, 500 million tweets per day, and the hardest fan-out problem in social media."
        ),
        msg(
          "Twitter's client handles two very different flows: writing a tweet (rare, but triggers massive fan-out) and reading your timeline (happens constantly, must be instant)."
        ),
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Client added. Now the entry layer.',
      errorMessage: 'Add a Web Client node using ⌘K → search "Web".',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        "All requests from Twitter clients flow through an API Gateway. It handles OAuth authentication, rate limiting (300 requests per 15 minutes for free tier), and routes to the correct backend service.",
      action: buildAction(
        'API Gateway',
        'Web',
        'API Gateway',
        'OAuth validation, rate limiting (300 requests per 15 minutes), and routing to the correct service: tweet, timeline, or search'
      ),
      why: "Twitter's API Gateway enforces rate limits that protect the backend from abuse. Without it, a single bot could flood the tweet service with millions of requests.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'API Gateway',
        'enforce rate limits of 300 requests per 15 minutes and route each request to the correct backend service',
        "Twitter's API Gateway is the enforcer of fairness. Without rate limits, a single bot could send millions of requests per second and crash the service. The gateway validates OAuth tokens, enforces per-user rate limits, and routes to tweet service, timeline service, or search.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "Twitter's API Gateway validates OAuth tokens, enforces per-user rate limits (300 requests/15 min), and routes to the right service — tweet service, timeline service, search. This is the single entry point for all 500 million daily users.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "Every tweet, like, and timeline request hits the API Gateway first. It's the enforcer of Twitter's rate limits."
        ),
        msg(
          "Twitter's API Gateway validates OAuth tokens, enforces per-user rate limits (300 requests/15 min), and routes to the right service — tweet service, timeline service, search, etc."
        ),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added. Now distribute the traffic.',
      errorMessage: 'Add an API Gateway and connect Web → API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "Twitter's API Gateway routes to a Load Balancer that distributes requests across thousands of application servers. Twitter handles 6,000 tweets per second at peak.",
      action: buildAction(
        'Load Balancer',
        'API Gateway',
        'Load Balancer',
        '6,000 tweets per second being distributed across thousands of servers using consistent hashing for session affinity'
      ),
      why: "At 6,000 tweets per second, no single server can handle the write load. The load balancer enables horizontal scaling across Twitter's massive server fleet.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'Load Balancer',
        'distribute 6,000 tweets per second across thousands of servers with consistent hashing for connection and cache affinity',
        "At 6,000 tweets per second at peak, no single server can handle the load. Twitter uses consistent hashing in the load balancer — a user's requests always route to the same server cluster, which maintains connection state and keeps cache hot.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "Twitter handles 6,000 tweets per second at peak. The Load Balancer uses consistent hashing — a user's requests always route to the same server cluster, maintaining connection state and cache affinity even as the fleet scales.",
        'Auth Service'
      ),
      messages: [
        msg("6,000 tweets per second at peak. The load balancer distributes this across thousands of servers."),
        msg(
          "Twitter uses consistent hashing in their load balancer — a user's requests always route to the same server cluster, which helps with connection state and caching."
        ),
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added. Now the auth layer.',
      errorMessage: 'Add a Load Balancer and connect API Gateway → Load Balancer.',
    }),
    step({
      id: 4,
      title: 'Add Auth Service',
      explanation:
        "Twitter uses OAuth 2.0 for authentication. The Auth Service validates tokens, checks account status (suspended, verified, etc.), and enforces per-account rate limits.",
      action: buildAction(
        'Auth Service',
        'Load Balancer',
        'Auth Service',
        'OAuth 2.0 token validation, account status checks, and per-account rate limit enforcement on every request'
      ),
      why: "Auth is critical for Twitter's trust and safety. A suspended account must be blocked at the auth layer before any tweet reaches the fan-out pipeline.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'Auth Service',
        'validate OAuth 2.0 tokens and check account status — suspended accounts are blocked before any fan-out happens',
        "Before any tweet is processed, the Auth Service validates the OAuth token and checks account status. A suspended account is blocked here — before any fan-out can happen. This prevents banned users from reaching millions of followers.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "Twitter uses OAuth 2.0 for authentication. The Auth Service validates tokens and checks account status — suspended accounts are blocked here, before any fan-out happens. This prevents banned users from reaching millions of followers.",
        'Tweet Service'
      ),
      messages: [
        msg(
          "Before any tweet is processed, the user must be authenticated and their account status checked."
        ),
        msg(
          "The Auth Service validates OAuth tokens and checks account status — suspended accounts are blocked here, before any fan-out happens. This prevents banned users from reaching millions of followers."
        ),
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth added. Now the tweet creation service.',
      errorMessage: 'Add an Auth Service and connect Load Balancer → Auth Service.',
    }),
    step({
      id: 5,
      title: 'Add Tweet Service',
      explanation:
        "The Tweet Service handles tweet creation and storage. Every tweet gets a Snowflake ID — a 64-bit integer encoding timestamp, datacenter ID, and sequence number. This gives chronological ordering without a central counter.",
      action: buildAction(
        'Microservice',
        'Auth',
        'Tweet Service',
        'tweets being created and assigned Snowflake IDs — 64-bit integers encoding timestamp, machine ID, and sequence for distributed chronological ordering'
      ),
      why: "Snowflake IDs are Twitter's solution to distributed ID generation. They're sortable by time, unique across datacenters, and generated without any central coordination.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'Tweet Service',
        'create tweets with Snowflake IDs — 64-bit integers with 41 bits for timestamp, 10 bits for machine ID, 12 bits for sequence',
        "A Snowflake ID is a 64-bit integer: 41 bits for timestamp (milliseconds since 2010), 10 bits for machine ID, 12 bits for sequence. This gives 4,096 unique IDs per millisecond per machine — sortable by time, unique across all datacenters, generated without any central coordination.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Tweet Service',
        'Auth Service',
        "Every tweet gets a Snowflake ID: 41 bits timestamp + 10 bits machine ID + 12 bits sequence. 4,096 unique IDs per millisecond per machine — sortable by time, unique across datacenters, generated without central coordination. 500M tweets per day, all with globally unique, time-ordered IDs.",
        'Fan-out Service'
      ),
      messages: [
        msg(
          "The Tweet Service creates and stores tweets. Every tweet gets a Snowflake ID — Twitter's invention for distributed unique IDs."
        ),
        msg(
          "A Snowflake ID is a 64-bit integer: 41 bits for timestamp (milliseconds since 2010), 10 bits for machine ID, 12 bits for sequence. This means 4,096 unique IDs per millisecond per machine — no central counter needed."
        ),
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Tweet Service.'),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Tweet Service added. Now the fan-out layer.',
      errorMessage: 'Add a Microservice (Tweet Service) and connect Auth Service → Tweet Service.',
    }),
    step({
      id: 6,
      title: 'Add Fan-out Service',
      explanation:
        "When Elon Musk tweets, 150 million followers need to see it. The Fan-out Service uses a hybrid model: regular users get push fan-out (tweet written to all follower timelines immediately), celebrities use pull fan-out (followers fetch on demand).",
      action: buildAction(
        'Fan-out Service',
        'Microservice',
        'Fan-out Service',
        'hybrid fan-out: tweets from regular users pushed to follower timelines, tweets from celebrities fetched on demand by followers'
      ),
      why: "Push fan-out for 150M followers would require 150M writes per tweet. Twitter's hybrid model caps the write amplification by using pull for celebrity accounts.",
      component: component('fanout_service', 'Fan-out'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'Fan-out Service',
        'push tweets to follower timelines for regular users, but use pull model for celebrities to cap write amplification at 150M writes per tweet',
        "When a celebrity tweets to 150 million followers, push fan-out would require 150 million writes. Twitter's hybrid model solves this: regular users (<1M followers) use push — tweet written to all timelines immediately. Celebrities (>1M followers) use pull — followers fetch tweets when they open the app.",
        'Fan-out Service'
      ),
      celebrationMessage: buildCelebration(
        'Fan-out Service',
        'Tweet Service',
        "Twitter uses hybrid fan-out: regular users (<1M followers) get push — tweet written to all follower timeline caches immediately. Celebrities (>1M followers) use pull — followers fetch their tweets on demand. This caps write amplification: even a 150M-follower celebrity triggers pull, not 150M writes.",
        'Timeline Service'
      ),
      messages: [
        msg(
          "Here's the hardest problem in Twitter's architecture: when a celebrity tweets, how do you deliver it to 150 million followers in under 5 seconds?"
        ),
        msg(
          "Twitter uses hybrid fan-out. Regular users (<1M followers): push model — tweet is written to all follower timeline caches immediately. Celebrities (>1M followers): pull model — followers fetch their tweets on demand when opening the app."
        ),
        msg('Press ⌘K, search for "Fan-out Service", add it, then connect Tweet Service → Fan-out Service.'),
      ],
      requiredNodes: ['fanout_service'],
      requiredEdges: [edge('microservice', 'fanout_service')],
      successMessage: 'Fan-out Service added. Now the timeline layer.',
      errorMessage: 'Add a Fan-out Service and connect Tweet Service → Fan-out Service.',
    }),
    step({
      id: 7,
      title: 'Add Timeline Service',
      explanation:
        "The Timeline Service assembles and serves your personalized feed. Your timeline is pre-computed and stored in Redis. Reading it is a single Redis read — not a database query across millions of tweets.",
      action: buildAction(
        'Timeline Service',
        'Fan-out',
        'Timeline Service',
        'pre-computed timeline being served from Redis sorted sets — 200 tweet IDs ordered by time, assembled in a single sub-millisecond read'
      ),
      why: "Pre-computing timelines in Redis is what makes Twitter load instantly. Without it, every timeline request would require joining millions of tweets from thousands of followed accounts.",
      component: component('timeline_service', 'Timeline'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'Timeline Service',
        'serve pre-computed timelines from Redis sorted sets — the top 200 tweet IDs per user, sorted by time, read in a single sub-millisecond query',
        "Your Twitter timeline loads in under 100ms because it's pre-computed. The Fan-out Service writes tweet IDs to each follower's Redis sorted set. When you open Twitter, the Timeline Service reads your top 200 tweet IDs from Redis and fetches their content — no database query across millions of tweets.",
        'Timeline Service'
      ),
      celebrationMessage: buildCelebration(
        'Timeline Service',
        'Fan-out Service',
        "Your Twitter timeline loads in under 100ms because it's pre-computed and cached in Redis. Each user has a sorted set of tweet IDs. When you open Twitter, it reads the top 200 IDs from Redis — a single sub-millisecond read. The database is almost never touched for feed reads.",
        'Trending Service'
      ),
      messages: [
        msg("Your Twitter timeline loads in under 100ms. How? It's pre-computed and cached in Redis."),
        msg(
          "The Timeline Service maintains a Redis sorted set per user — a list of tweet IDs ordered by time. When you open Twitter, it reads the top 200 tweet IDs from Redis and fetches their content. No database query needed."
        ),
        msg('Press ⌘K, search for "Timeline Service", add it, then connect Fan-out Service → Timeline Service.'),
      ],
      requiredNodes: ['timeline_service'],
      requiredEdges: [edge('fanout_service', 'timeline_service')],
      successMessage: 'Timeline Service added. Now trending topics.',
      errorMessage: 'Add a Timeline Service and connect Fan-out Service → Timeline Service.',
    }),
    step({
      id: 8,
      title: 'Add Trending Service',
      explanation:
        "The Trending Service computes trending topics in real-time using sliding window counters. Every hashtag gets a counter per geographic region, updated every 30 seconds. Topics trending in NYC may not trend in Tokyo.",
      action: buildAction(
        'Trending Service',
        'Microservice',
        'Trending Service',
        'hashtag frequency being tracked per region using Count-Min Sketch — a probabilistic data structure updated every 30 seconds'
      ),
      why: "Trending topics are computed from billions of tweets using approximate counting algorithms. Exact counts would require too much memory — Twitter uses Count-Min Sketch for space-efficient frequency estimation.",
      component: component('trending_service', 'Trending'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'Trending Service',
        'track hashtag frequency per geographic region using Count-Min Sketch — updated every 30 seconds with space-efficient probabilistic counting',
        "Count-Min Sketch is a probabilistic data structure that estimates hashtag frequency using a fraction of the memory exact counting would need. Updated every 30 seconds, localized by region — topics trending in NYC may not trend in Tokyo. This is what enables trending topics across billions of tweets.",
        'Trending Service'
      ),
      celebrationMessage: buildCelebration(
        'Trending Service',
        'Tweet Service',
        "Twitter uses Count-Min Sketch for trending — a probabilistic data structure that estimates hashtag frequency with minimal memory. Updated every 30 seconds, localized by region. Topics trending in NYC may not trend in Tokyo. This enables real-time trending across billions of tweets.",
        'Graph Database'
      ),
      messages: [
        msg("How does Twitter know what's trending? Every hashtag gets a sliding window counter per geographic region."),
        msg(
          "The Trending Service uses Count-Min Sketch — a probabilistic data structure that estimates hashtag frequency using a fraction of the memory exact counting would require. Updated every 30 seconds, localized by region."
        ),
        msg('Press ⌘K, search for "Trending Service", add it, then connect Tweet Service → Trending Service.'),
      ],
      requiredNodes: ['trending_service'],
      requiredEdges: [edge('microservice', 'trending_service')],
      successMessage: 'Trending Service added. Now the social graph.',
      errorMessage: 'Add a Trending Service and connect Tweet Service → Trending Service.',
    }),
    step({
      id: 9,
      title: 'Add Graph Database',
      explanation:
        "Twitter's social graph — who follows whom — is stored in a Graph Database. With 500M users and billions of follow relationships, graph traversal (finding mutual followers, suggested follows) requires a database optimized for relationship queries.",
      action: buildAction(
        'Graph Database',
        'Fan-out',
        'Graph Database',
        'billions of follow relationships being stored and traversed — directed edges (A follows B) enabling fast queries like who follows this user'
      ),
      why: "SQL JOINs across billions of follow relationships would be impossibly slow. Graph databases store relationships as first-class citizens, making traversal queries orders of magnitude faster.",
      component: component('graph_database', 'Graph'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'Graph Database',
        'store 500M users and billions of follow relationships as directed edges enabling fast traversal queries for mutual followers and suggestions',
        "SQL JOINs across billions of follow relationships would be impossibly slow. Twitter built FlockDB — a graph database optimized for social graph traversal. Directed edges (A follows B) make queries like 'who follows this user' and 'who does this user follow' fast at billion-edge scale.",
        'Graph Database'
      ),
      celebrationMessage: buildCelebration(
        'Graph Database',
        'Fan-out Service',
        "Twitter built FlockDB — a custom graph database for social graph traversal at billion-edge scale. Directed edges (A follows B) enable fast 'who follows this user' queries. The Fan-out Service queries the graph to find all followers and push tweets to their timeline caches.",
        'NoSQL Database'
      ),
      messages: [
        msg("Twitter has billions of follow relationships. Storing them in SQL and doing JOINs would be too slow."),
        msg(
          "Twitter built FlockDB — a custom graph database optimized for social graph traversal. It stores directed edges (A follows B) and supports fast queries like 'who follows this user' and 'who does this user follow'."
        ),
        msg('Press ⌘K, search for "Graph Database", add it, then connect Fan-out Service → Graph Database.'),
      ],
      requiredNodes: ['graph_database'],
      requiredEdges: [edge('fanout_service', 'graph_database')],
      successMessage: 'Graph Database added. Now tweet storage.',
      errorMessage: 'Add a Graph Database and connect Fan-out Service → Graph Database.',
    }),
    step({
      id: 10,
      title: 'Add NoSQL Database',
      explanation:
        "Tweets themselves are stored in a NoSQL database (Twitter uses Manhattan, their own distributed key-value store). Each tweet is a document with text, media URLs, engagement counts, and metadata.",
      action: buildAction(
        'NoSQL Database',
        'Microservice',
        'NoSQL Database',
        'tweets being stored by Snowflake ID with O(1) lookups — a flexible document model for all tweet types: text, images, polls, threads'
      ),
      why: "Tweets have a flexible schema — different tweet types (text, image, video, poll, thread) have different fields. NoSQL's flexible document model handles this without schema migrations.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'NoSQL Database',
        'persist tweets by Snowflake ID with O(1) lookups — flexible schema for all tweet types: text, images, polls, threads, Spaces',
        "Twitter built Manhattan — their own distributed key-value store. Tweets are stored by Snowflake ID, enabling O(1) lookups. The flexible schema handles all tweet types: text, images, polls, threads, Spaces — each with different fields, no schema migrations needed.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Tweet Service',
        "Tweets are stored in Manhattan — Twitter's distributed key-value store, organized by Snowflake ID for O(1) lookups. The flexible document model handles all tweet types: text, images, polls, threads, Spaces — each with different fields, no schema migrations needed.",
        'In-Memory Cache'
      ),
      messages: [
        msg(
          "Tweets are stored in a NoSQL database. Twitter built Manhattan — their own distributed key-value store — for this."
        ),
        msg(
          "Manhattan stores tweets by Snowflake ID. Lookups are O(1) by ID. The flexible schema handles all tweet types: text, images, polls, threads, spaces — each with different fields."
        ),
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Tweet Service → NoSQL Database.'),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('microservice', 'nosql_db')],
      successMessage: 'NoSQL Database added. Final step — the timeline cache.',
      errorMessage: 'Add a NoSQL Database and connect Tweet Service → NoSQL Database.',
    }),
    step({
      id: 11,
      title: 'Add In-Memory Cache',
      explanation:
        "Twitter caches pre-computed timelines, tweet content, and user profiles in Redis. The timeline cache holds the top 800 tweet IDs per user. Cache hit rate exceeds 99% — almost no timeline reads touch the database.",
      action: buildAction(
        'In-Memory Cache',
        'Timeline',
        'In-Memory Cache',
        'top 800 tweet IDs per user being cached in Redis sorted sets with a 99%+ cache hit rate — the database is almost never touched for feed reads'
      ),
      why: "Without the timeline cache, every feed load would require reading from the NoSQL database and assembling tweets from thousands of followed accounts. Redis makes it a single sub-millisecond read.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'Twitter',
        'In-Memory Cache',
        'serve pre-computed timelines from Redis with a 99%+ hit rate — each user has 800 tweet IDs cached, read in sub-millisecond time',
        "Without the timeline cache, every feed load would require reading from the NoSQL database and assembling tweets from thousands of followed accounts. Redis makes it a single sub-millisecond read. 99%+ hit rate means the database is almost never touched for feed reads.",
        'In-Memory Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'Timeline Service',
        "Each user has 800 tweet IDs cached in Redis sorted sets. Timeline reads hit Redis 99%+ of the time — the database is almost never touched for feed reads. This is what makes Twitter feel instant. You have built Twitter.",
        'nothing — you have built Twitter'
      ),
      messages: [
        msg(
          "Final step — the cache that makes everything fast. Twitter stores pre-computed timelines in Redis."
        ),
        msg(
          "Each user has a Redis sorted set holding their top 800 tweet IDs. Timeline reads hit Redis 99%+ of the time — the database is almost never touched for feed reads. This is what makes Twitter feel instant."
        ),
        msg(
          'Press ⌘K, search for "In-Memory Cache", add it, then connect Timeline Service → In-Memory Cache.'
        ),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('timeline_service', 'in_memory_cache')],
      successMessage: 'In-Memory Cache added and connected. You have built Twitter.',
      errorMessage: 'Add an In-Memory Cache and connect Timeline Service → In-Memory Cache.',
    }),
  ],
});

// ── Level 2 — Production Ready (9 steps) ─────────────────────────────────────

const l2 = level({
  level: 2,
  title: 'Production Ready',
  subtitle: 'Scale to millions of concurrent users',
  description:
    "Your fan-out architecture works. Now add what Twitter actually ships: Kafka for events, notification workers, SQL for user data, write-through cache for engagement, CDC for analytics, and structured logging.",
  estimatedTime: '~25 mins',
  unlocks: 'Expert Architecture',
  prerequisite: 'Builds on your Level 1 diagram',
  contextMessage:
    "Level 2: Production Ready. Your fan-out architecture serves timelines at scale. Now add Kafka event streaming, notifications, SQL, write-through caching, CDC, and structured logging.",
  steps: [
    step({
      id: 1,
      title: 'Add Kafka Streaming',
      explanation:
        "Every tweet, like, retweet, and follow is published to Kafka. The trending algorithm consumes tweet events in real time. Analytics pipelines consume engagement data to train the recommendation model.",
      action: buildAction(
        'Kafka / Streaming',
        'Load Balancer',
        'Kafka Streaming',
        'every tweet, like, and follow being streamed to trending and analytics consumers in real time'
      ),
      why: "Without Kafka, computing trending topics would require synchronous database queries. Kafka decouples event producers from consumers — the tweet path stays fast regardless of how many downstream systems consume events.",
      component: component('kafka_streaming', 'Kafka / Streaming', 'Kafka / Streaming'),
      openingMessage: buildOpeningL2(
        'Twitter',
        'Kafka',
        'stream every tweet, like, and follow to trending and analytics consumers in real time',
        'Without Kafka, trending computation would require synchronous calls — slowing down every tweet.',
        'Kafka / Streaming'
      ),
      celebrationMessage: buildCelebration(
        'Kafka Streaming',
        'Load Balancer',
        "Twitter publishes billions of events per day to Kafka — every tweet, like, retweet, and follow. The trending algorithm reacts within 30 seconds. Analytics pipelines consume engagement data to retrain recommendation models daily.",
        'Notification Worker'
      ),
      messages: [
        msg("Level 2 — Production Ready. Every tweet, like, and follow is published to Kafka for downstream consumers."),
        msg("The trending algorithm consumes tweet events to compute trending topics. Analytics pipelines consume engagement data to train recommendation models."),
        msg('Press ⌘K, search for "Kafka / Streaming", add it, then connect Load Balancer → Kafka Streaming.'),
      ],
      requiredNodes: ['kafka_streaming'],
      requiredEdges: [edge('load_balancer', 'kafka_streaming')],
      successMessage: 'Events streaming. Now notifications.',
      errorMessage: 'Add Kafka Streaming connected from the Load Balancer.',
    }),
    step({
      id: 2,
      title: 'Add Notification Worker',
      explanation:
        "Notification workers consume Kafka events to send push notifications — mentions, replies, followers, and trending alerts. They batch notifications to avoid notification storms during viral tweets.",
      action: buildAction(
        'Worker',
        'Kafka',
        'Notification Worker',
        'push notifications being sent for mentions, replies, and followers — batched to prevent notification storms during viral tweets'
      ),
      why: "If Twitter sent a notification to 150 million followers the instant a celebrity tweets, devices would crash. Notification batching prevents storms while keeping users informed.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL2(
        'Twitter',
        'Notification Worker',
        'batch push notifications for viral tweets to prevent device overwhelm while keeping users informed',
        'If Twitter notified 150M followers instantly when a celebrity tweets, devices would crash.',
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Notification Worker',
        'Kafka Streaming',
        "Twitter's notification workers batch alerts for viral tweets — sending in waves to prevent device overwhelm. When a celebrity tweets to 150M followers, notifications go out in batches over 30 minutes.",
        'Write-Through Cache'
      ),
      messages: [
        msg("Notification workers consume Kafka events to send push notifications — mentions, replies, followers, trending alerts."),
        msg("Notifications are batched to prevent notification storms. When a celebrity tweets to 150M followers, notifications go out in waves over 30 minutes."),
        msg('Press ⌘K, search for "Worker / Background Job", add it, then connect Kafka Streaming → Notification Worker.'),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('kafka_streaming', 'worker_job')],
      successMessage: 'Notifications added. Now write-through cache.',
      errorMessage: 'Add a Worker connected from Kafka Streaming.',
    }),
    step({
      id: 3,
      title: 'Add Write-Through Cache',
      explanation:
        "Twitter's Write-Through Cache synchronously updates both Redis and the NoSQL database on every like, retweet, and follow. Engagement counts are immediately consistent — no stale counts displayed to users.",
      action: buildAction(
        'Write-Through Cache',
        'Load Balancer',
        'Write-Through Cache',
        'engagement counts being synchronously updated in both Redis and NoSQL on every like and retweet — immediately consistent'
      ),
      why: "Without write-through caching, like counts would be eventually consistent — users might see stale counts. For engagement metrics, immediate consistency matters — a tweet with 1M likes must show 1M immediately.",
      component: component('write_through_cache', 'Write-Through Cache'),
      openingMessage: buildOpeningL2(
        'Twitter',
        'Write-Through Cache',
        'synchronously update engagement counts in Redis and NoSQL on every like and retweet — immediately consistent',
        'Without write-through caching, like counts would be stale — immediate consistency matters for engagement.',
        'Write-Through Cache'
      ),
      celebrationMessage: buildCelebration(
        'Write-Through Cache',
        'Load Balancer',
        "Twitter's Write-Through Cache synchronously updates both Redis and NoSQL on every like and retweet. Engagement counts are immediately consistent — no stale counts displayed. A tweet with 1M likes shows 1M instantly.",
        'CDC Connector'
      ),
      messages: [
        msg("Write-Through Cache synchronously updates both Redis and NoSQL on every like and retweet."),
        msg("Engagement counts are immediately consistent — a tweet with 1M likes shows 1M instantly. No stale counts displayed to users."),
        msg('Press ⌘K, search for "Write-Through Cache", add it, then connect Load Balancer → Write-Through Cache.'),
      ],
      requiredNodes: ['write_through_cache'],
      requiredEdges: [edge('load_balancer', 'write_through_cache')],
      successMessage: 'Write-through cache added. Now CDC for analytics.',
      errorMessage: 'Add a Write-Through Cache connected from the Load Balancer.',
    }),
    step({
      id: 4,
      title: 'Add CDC Connector (Debezium)',
      explanation:
        "The CDC Connector captures row-level changes from Twitter's NoSQL database transaction log — streaming tweet creations, profile updates, and engagement changes to Kafka for analytics without database query overhead.",
      action: buildAction(
        'CDC Connector (Debezium)',
        'NoSQL Database',
        'CDC Connector',
        'row-level changes being captured from the NoSQL transaction log and streamed to Kafka for analytics'
      ),
      why: "Without CDC, analytics queries would require direct database reads that add load to the production database. CDC captures changes from the transaction log — zero production query overhead.",
      component: component('cdc_connector', 'CDC Connector (Debezium)'),
      openingMessage: buildOpeningL2(
        'Twitter',
        'CDC Connector (Debezium)',
        'capture row-level changes from the NoSQL transaction log and stream to Kafka — zero production query overhead',
        'Without CDC, analytics queries add load to production database — CDC captures changes from the transaction log.',
        'CDC Connector (Debezium)'
      ),
      celebrationMessage: buildCelebration(
        'CDC Connector',
        'NoSQL Database',
        "Twitter's CDC Connector captures every tweet creation and engagement update from the NoSQL transaction log — streaming to Kafka for analytics without adding load to the production database.",
        'SQL Database'
      ),
      messages: [
        msg("CDC Connector captures row-level changes from the NoSQL transaction log and streams them to Kafka for analytics."),
        msg("Without CDC, analytics queries would add load to the production database. CDC captures changes from the transaction log — zero query overhead."),
        msg('Press ⌘K, search for "CDC Connector (Debezium)", add it, then connect NoSQL Database → CDC Connector.'),
      ],
      requiredNodes: ['cdc_connector'],
      requiredEdges: [edge('nosql_db', 'cdc_connector')],
      successMessage: 'CDC added. Now SQL for user data.',
      errorMessage: 'Add a CDC Connector connected from the NoSQL Database.',
    }),
    step({
      id: 5,
      title: 'Add SQL Database',
      explanation:
        "Twitter stores user profiles, direct messages, and advertising data in PostgreSQL. Direct messages require ACID transactions — a dropped message is a support ticket.",
      action: buildAction(
        'SQL Database',
        'Auth Service',
        'SQL Database',
        'user profiles, DMs, and advertising data being stored with ACID guarantees for message delivery'
      ),
      why: "Direct messages must be delivered exactly once. ACID transactions ensure every message is recorded exactly once — a dropped message is a support ticket.",
      component: component('sql_db', 'SQL Database'),
      openingMessage: buildOpeningL2(
        'Twitter',
        'SQL Database',
        'store user profiles, DMs, and advertising data with ACID guarantees for message delivery',
        'Direct messages require ACID transactions — a dropped message is a support ticket.',
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Auth Service',
        "Twitter stores direct messages in PostgreSQL with full ACID compliance. Every message delivered exactly once — a dropped DM is a support ticket. User profiles and advertising data also require ACID guarantees.",
        'Structured Logger'
      ),
      messages: [
        msg("User profiles, direct messages, and advertising data need ACID compliance. PostgreSQL stores the authoritative records."),
        msg("Direct messages must be delivered exactly once. ACID transactions ensure every message is recorded — a dropped message is a support ticket."),
        msg('Press ⌘K, search for "SQL Database", add it, then connect Auth Service → SQL Database.'),
      ],
      requiredNodes: ['sql_db'],
      requiredEdges: [edge('auth_service', 'sql_db')],
      successMessage: 'SQL added. Now structured logging.',
      errorMessage: 'Add a SQL Database connected from the Auth Service.',
    }),
    step({
      id: 6,
      title: 'Add Structured Logger',
      explanation:
        "Twitter's Structured Logger emits JSON-formatted logs with consistent field schemas — user_id, tweet_id, event_type, engagement_count. LogQL queries aggregate metrics across billions of logs per day.",
      action: buildAction(
        'Structured Logger',
        'Load Balancer',
        'Structured Logger',
        'JSON-formatted logs being emitted with consistent schemas for user_id, tweet_id, and event_type across all services'
      ),
      why: "Text logs require regex parsing — slow and error-prone at scale. Structured JSON logs enable LogQL queries that aggregate metrics across billions of entries in seconds.",
      component: component('structured_logger', 'Structured Logger'),
      openingMessage: buildOpeningL2(
        'Twitter',
        'Structured Logger',
        'emit JSON logs with consistent field schemas for user_id, tweet_id, and event_type across all services',
        'Text logs require regex parsing — structured JSON enables fast LogQL aggregation across billions of entries.',
        'Structured Logger'
      ),
      celebrationMessage: buildCelebration(
        'Structured Logger',
        'Load Balancer',
        "Twitter's Structured Logger emits JSON with consistent schemas: user_id, tweet_id, event_type, engagement_count. LogQL queries aggregate trending detection across billions of entries — enabling real-time trending alerts.",
        'SLO/SLI Tracker'
      ),
      messages: [
        msg("Structured Logger emits JSON-formatted logs with consistent schemas — user_id, tweet_id, event_type, engagement_count."),
        msg("LogQL queries aggregate metrics across billions of logs per day in seconds. Trending detection and anomaly alerts use structured log queries."),
        msg('Press ⌘K, search for "Structured Logger", add it, then connect Load Balancer → Structured Logger.'),
      ],
      requiredNodes: ['structured_logger'],
      requiredEdges: [edge('load_balancer', 'structured_logger')],
      successMessage: 'Structured logging added. Now SLO tracking.',
      errorMessage: 'Add a Structured Logger connected from the Load Balancer.',
    }),
    step({
      id: 7,
      title: 'Add SLO/SLI Tracker',
      explanation:
        "Twitter's SLO/SLI Tracker monitors tweet delivery latency, timeline load time, and API availability against defined Service Level Objectives. Timeline load time SLO: 99.9% of timelines load within 500ms.",
      action: buildAction(
        'SLO/SLI Tracker',
        'Metrics Collector',
        'SLO/SLI Tracker',
        'tweet delivery latency and timeline load time being tracked against SLOs — alerting when error budgets burn'
      ),
      why: "Without SLOs, engineering teams argue about what 'good' means. With SLOs, there's a clear contractual target — timeline load must be under 500ms for 99.9% of requests.",
      component: component('slo_tracker', 'SLO/SLI Tracker'),
      openingMessage: buildOpeningL2(
        'Twitter',
        'SLO/SLI Tracker',
        'monitor tweet delivery latency and timeline load time against defined SLO targets',
        'Without SLOs, engineering teams argue about what acceptable performance means.',
        'SLO/SLI Tracker'
      ),
      celebrationMessage: buildCelebration(
        'SLO/SLI Tracker',
        'Metrics Collector',
        "Twitter's SLO: 99.9% of timelines load within 500ms. The SLO/SLI Tracker alerts when error budgets burn — pages on-call before users notice degradation in tweet delivery.",
        'Error Budget Monitor'
      ),
      messages: [
        msg("The SLO/SLI Tracker monitors tweet delivery latency, timeline load time, and API availability against defined Service Level Objectives."),
        msg("Twitter's timeline load time SLO: 99.9% of timelines load within 500ms. When latency exceeds the error budget, on-call is paged."),
        msg('Press ⌘K, search for "SLO/SLI Tracker", add it, then connect Metrics Collector → SLO/SLI Tracker.'),
      ],
      requiredNodes: ['slo_tracker'],
      requiredEdges: [edge('metrics_collector', 'slo_tracker')],
      successMessage: 'SLO tracking added. Now error budgets.',
      errorMessage: 'Add an SLO/SLI Tracker connected from the Metrics Collector.',
    }),
    step({
      id: 8,
      title: 'Add Error Budget Monitor',
      explanation:
        "Twitter's Error Budget Monitor tracks remaining reliability budget for timeline load time SLO. When the error budget burns faster than acceptable, feature launches pause until reliability improves.",
      action: buildAction(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        'Error Budget Monitor',
        'error budget burn rate being tracked — pausing feature launches when budget depletes faster than acceptable'
      ),
      why: "The error budget is the 'spare' reliability — the difference between the SLO target and 100%. When it's depleted, feature launches pause until reliability improves.",
      component: component('error_budget_alert', 'Error Budget Monitor'),
      openingMessage: buildOpeningL2(
        'Twitter',
        'Error Budget Monitor',
        'track error budget burn rate — pausing feature launches when budget depletes to protect reliability',
        'The error budget is the reliability buffer — when depleted, feature launches pause for reliability work.',
        'Error Budget Monitor'
      ),
      celebrationMessage: buildCelebration(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        "Twitter's error budget policy: when more than 10% of the monthly budget burns in a week, feature launches pause. Engineering prioritizes reliability until the budget recovers — protecting user experience.",
        'Level 3'
      ),
      messages: [
        msg("The Error Budget Monitor tracks remaining reliability budget for timeline load time SLO."),
        msg("When the error budget burns faster than acceptable, feature launches pause until reliability improves. This prevents reliability from being sacrificed for velocity."),
        msg('Press ⌘K, search for "Error Budget Monitor", add it, then connect SLO/SLI Tracker → Error Budget Monitor.'),
      ],
      requiredNodes: ['error_budget_alert'],
      requiredEdges: [edge('slo_tracker', 'error_budget_alert')],
      successMessage: 'Error budget monitoring added. Twitter is now production-ready.',
      errorMessage: 'Add an Error Budget Monitor connected from the SLO/SLI Tracker.',
    }),
  ],
});

// ── Level 3 — Expert Architecture (11 steps) ───────────────────────────────────

const l3 = level({
  level: 3,
  title: 'Expert Architecture',
  subtitle: 'Design like a Twitter senior engineer',
  description:
    "You have production Twitter. Now add what separates senior engineers — service mesh, GraphQL Federation, token bucket rate limiting, distributed tracing with correlation IDs, SLO tracking, CDC analytics, leader election for trending, and event sourcing.",
  estimatedTime: '~30 mins',
  prerequisite: 'Builds on your Level 2 diagram',
  contextMessage:
    "Level 3: Expert Architecture. Add service mesh, GraphQL Federation, advanced rate limiting, distributed tracing, CDC analytics, leader election, and event sourcing for tweets.",
  steps: [
    step({
      id: 1,
      title: 'Add Service Mesh (Istio)',
      explanation:
        "Twitter's Service Mesh uses Istio to manage all east-west traffic between services — automatic mTLS encryption, circuit breaking, retries, and load balancing at the sidecar proxy level.",
      action: buildAction(
        'Service Mesh (Istio)',
        'Load Balancer',
        'Service Mesh',
        'automatic mTLS and traffic management being enforced at the sidecar proxy level for all service-to-service communication'
      ),
      why: "Without a service mesh, each service implements TLS, circuit breaking, and retries differently. Istio handles this transparently at the infrastructure layer.",
      component: component('service_mesh', 'Service Mesh (Istio)'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'Service Mesh (Istio)',
        'automatic mTLS, circuit breaking, and traffic policies enforced at the sidecar proxy level across all services',
        'Without a service mesh, each service implements TLS, retries, and circuit breaking differently.',
        'Service Mesh (Istio)'
      ),
      celebrationMessage: buildCelebration(
        'Service Mesh',
        'Load Balancer',
        "Twitter's service mesh handles billions of service-to-service calls per day. Every call is encrypted with mTLS — no service code changes required. The Control Plane pushes traffic policies across the cluster instantly.",
        'GraphQL Federation Gateway'
      ),
      messages: [
        msg("Level 3 — Expert Architecture. The Service Mesh (Istio) adds sidecar proxies to every pod — handling mTLS, retries, circuit breaking, and load balancing transparently."),
        msg("With automatic mTLS, every service-to-service call is encrypted. The Control Plane distributes traffic policies across all sidecars instantly."),
        msg('Press ⌘K, search for "Service Mesh (Istio)", add it, then connect Load Balancer → Service Mesh.'),
      ],
      requiredNodes: ['service_mesh'],
      requiredEdges: [edge('load_balancer', 'service_mesh')],
      successMessage: 'Service mesh added. Now GraphQL Federation.',
      errorMessage: 'Add a Service Mesh connected from the Load Balancer.',
    }),
    step({
      id: 2,
      title: 'Add GraphQL Federation Gateway',
      explanation:
        "Twitter's GraphQL Federation Gateway combines tweet, user, and timeline schemas into a unified supergraph. Mobile clients query one endpoint — the gateway fans out to multiple subgraphs and composes the response.",
      action: buildAction(
        'GraphQL Federation Gateway',
        'API Gateway',
        'GraphQL Federation Gateway',
        'tweet, user, and timeline schemas being composed into a unified API from multiple subgraphs'
      ),
      why: "Without Federation, clients make multiple round trips to different REST endpoints. GraphQL Federation lets clients fetch all needed data in a single query.",
      component: component('graphql_federation', 'GraphQL Federation Gateway'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'GraphQL Federation Gateway',
        'compose tweet, user, and timeline schemas into a unified supergraph from multiple subgraphs',
        'Without Federation, clients make multiple round trips to different REST endpoints.',
        'GraphQL Federation Gateway'
      ),
      celebrationMessage: buildCelebration(
        'GraphQL Federation Gateway',
        'API Gateway',
        "Twitter's GraphQL Federation Gateway serves the mobile app with a unified API — one query fetches tweets, user profiles, and timeline data. Mobile API calls reduced by 60%, latency reduced by 40%.",
        'Token Bucket Rate Limiter'
      ),
      messages: [
        msg("GraphQL Federation combines tweet, user, and timeline schemas into a unified supergraph."),
        msg("Mobile clients query one endpoint — the gateway fans out to multiple subgraphs and composes the response. Mobile API calls reduced by 60%."),
        msg('Press ⌘K, search for "GraphQL Federation Gateway", add it, then connect API Gateway → GraphQL Federation Gateway.'),
      ],
      requiredNodes: ['graphql_federation'],
      requiredEdges: [edge('api_gateway', 'graphql_federation')],
      successMessage: 'GraphQL Federation added. Now rate limiting.',
      errorMessage: 'Add a GraphQL Federation Gateway connected from the API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add Token Bucket Rate Limiter',
      explanation:
        "Twitter's Token Bucket Rate Limiter enforces API quotas using the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate. Developers with premium API access get larger buckets.",
      action: buildAction(
        'Token Bucket Rate Limiter',
        'API Gateway',
        'Token Bucket Rate Limiter',
        'API quotas being enforced with burst allowance using the token bucket algorithm — premium developers get larger buckets'
      ),
      why: "Fixed rate limiting can't handle legitimate bursts. API developers uploading batches of tweets need burst capacity — the token bucket allows this while maintaining average limits.",
      component: component('token_bucket_limiter', 'Token Bucket Rate Limiter'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'Token Bucket Rate Limiter',
        'enforce API quotas with burst allowance — premium developers get larger token buckets for batch operations',
        'Fixed rate limiting cannot handle legitimate bursts — token bucket allows bursts while maintaining average limits.',
        'Token Bucket Rate Limiter'
      ),
      celebrationMessage: buildCelebration(
        'Token Bucket Rate Limiter',
        'API Gateway',
        "Twitter's token bucket rate limiter allows developers to burst API requests — a premium developer uploading a batch of tweets can use their full bucket. Casual users get smaller buckets. The steady average rate prevents abuse.",
        'OpenTelemetry Collector'
      ),
      messages: [
        msg("Token Bucket Rate Limiter uses the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate."),
        msg("Premium API developers get larger buckets for batch operations. The steady average rate prevents abuse while enabling legitimate bursts."),
        msg('Press ⌘K, search for "Token Bucket Rate Limiter", add it, then connect API Gateway → Token Bucket Rate Limiter.'),
      ],
      requiredNodes: ['token_bucket_limiter'],
      requiredEdges: [edge('api_gateway', 'token_bucket_limiter')],
      successMessage: 'Rate limiting added. Now distributed tracing.',
      errorMessage: 'Add a Token Bucket Rate Limiter connected from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add OpenTelemetry Collector',
      explanation:
        "Twitter's OpenTelemetry Collector receives traces, metrics, and logs from all services — processing and exporting to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs.",
      action: buildAction(
        'OpenTelemetry Collector',
        'Structured Logger',
        'OpenTelemetry Collector',
        'traces, metrics, and logs being aggregated and exported to multiple backends from a single unified collector'
      ),
      why: "Without OTel, each service uses different tracing libraries. The OTel Collector normalizes everything — one instrumentation, multiple backends.",
      component: component('otel_collector', 'OpenTelemetry Collector'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'OpenTelemetry Collector',
        'unified telemetry pipeline for traces, metrics, and logs with multi-backend export to Jaeger, Prometheus, and Elasticsearch',
        'Without OTel, each service uses different tracing libraries — the OTel Collector normalizes everything.',
        'OpenTelemetry Collector'
      ),
      celebrationMessage: buildCelebration(
        'OpenTelemetry Collector',
        'Structured Logger',
        "Twitter's OTel Collector processes billions of spans per day. One instrumentation exports to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs — three backends, zero per-service configuration.",
        'Correlation ID Injector'
      ),
      messages: [
        msg("The OpenTelemetry Collector is the unified observability pipeline — receiving spans, metrics, and logs from all services, normalizing the format, and exporting to multiple backends."),
        msg("Without OTel, adding a new tracing backend requires changing every service. With OTel, services instrument once and the collector routes to any backend."),
        msg('Press ⌘K, search for "OpenTelemetry Collector", add it, then connect Structured Logger → OpenTelemetry Collector.'),
      ],
      requiredNodes: ['otel_collector'],
      requiredEdges: [edge('structured_logger', 'otel_collector')],
      successMessage: 'OTel Collector added. Now correlation IDs.',
      errorMessage: 'Add an OpenTelemetry Collector connected from the Structured Logger.',
    }),
    step({
      id: 5,
      title: 'Add Correlation ID Injector',
      explanation:
        "The Correlation ID Injector assigns a unique trace ID to every request that propagates via HTTP headers across all service calls — enabling end-to-end request tracing from the mobile client through tweet creation, fan-out, and timeline assembly.",
      action: buildAction(
        'Correlation ID Injector',
        'otel_collector',
        'Correlation ID Injector',
        'unique trace IDs being propagated across all service calls for end-to-end request visibility'
      ),
      why: "Without correlation IDs, debugging a slow tweet delivery requires checking logs from the API gateway, tweet service, fan-out service, and timeline service separately. Correlation IDs link all logs under one trace.",
      component: component('correlation_id_handler', 'Correlation ID Injector'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'Correlation ID Injector',
        'propagate unique trace IDs across all service calls for instant cross-service log correlation',
        'Without correlation IDs, debugging slow tweets requires checking logs from 5+ services separately.',
        'Correlation ID Injector'
      ),
      celebrationMessage: buildCelebration(
        'Correlation ID Injector',
        'OpenTelemetry Collector',
        "Twitter's correlation IDs flow through every service call: API Gateway → Tweet Service → Fan-out Service → Timeline Service. All logs under one trace ID — instant debugging of tweet delivery latency.",
        'Leader Election'
      ),
      messages: [
        msg("The Correlation ID Injector generates a unique trace ID at request entry and propagates it via HTTP headers through every service call."),
        msg("All logs for a request share one correlation ID — instant debugging across Tweet Service, Fan-out Service, and Timeline Service."),
        msg('Press ⌘K, search for "Correlation ID Injector", add it, then connect OpenTelemetry Collector → Correlation ID Injector.'),
      ],
      requiredNodes: ['correlation_id_handler'],
      requiredEdges: [edge('otel_collector', 'correlation_id_handler')],
      successMessage: 'Correlation IDs added. Now leader election.',
      errorMessage: 'Add a Correlation ID Injector connected from the OpenTelemetry Collector.',
    }),
    step({
      id: 6,
      title: 'Add Leader Election',
      explanation:
        "Twitter's Leader Election ensures exactly one Trending Service instance processes trending counter updates — preventing split-brain scenarios where two instances compute different trending lists simultaneously.",
      action: buildAction(
        'Leader Election',
        'Kafka Streaming',
        'Leader Election',
        'exactly one Trending Service instance being elected to process trending counter updates — preventing split-brain scenarios'
      ),
      why: "Without leader election, multiple Trending Service instances might process the same hashtag counters, leading to inconsistent trending lists. Leader election ensures serial processing.",
      component: component('leader_election', 'Leader Election'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'Leader Election',
        'elect exactly one Trending Service instance to process counters — preventing split-brain inconsistent trending lists',
        'Without leader election, multiple instances process counters simultaneously — inconsistent trending lists.',
        'Leader Election'
      ),
      celebrationMessage: buildCelebration(
        'Leader Election',
        'Kafka Streaming',
        "Twitter's Leader Election ensures exactly one Trending Service instance processes trending counters. If the leader fails, a new leader is elected within seconds — trending computation never stops.",
        'CQRS Command Handler'
      ),
      messages: [
        msg("Leader Election ensures exactly one Trending Service instance processes trending counter updates."),
        msg("Without leader election, multiple instances might process the same counters, leading to inconsistent trending lists. The leader processes all updates — no split-brain scenarios."),
        msg('Press ⌘K, search for "Leader Election", add it, then connect Kafka Streaming → Leader Election.'),
      ],
      requiredNodes: ['leader_election'],
      requiredEdges: [edge('kafka_streaming', 'leader_election')],
      successMessage: 'Leader election added. Now CQRS pattern.',
      errorMessage: 'Add a Leader Election connected from Kafka Streaming.',
    }),
    step({
      id: 7,
      title: 'Add CQRS Command Handler',
      explanation:
        "Twitter's CQRS Command Handler processes write operations — tweet creation, likes, follows. Commands are validated and persisted to the write model with strict consistency guarantees before acknowledgment.",
      action: buildAction(
        'CQRS Command Handler',
        'Auth Service',
        'CQRS Command Handler',
        'write operations being validated and persisted to the write model with strict consistency — tweet creation, likes, follows'
      ),
      why: "CQRS separates read and write models — writes go through strict validation and consistency checks, reads go through optimized query paths. This prevents stale reads from blocking writes.",
      component: component('cqrs_command_handler', 'CQRS Command Handler'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'CQRS Command Handler',
        'process write operations with strict consistency — tweet creation, likes, follows validated before persistence',
        'CQRS separates read and write models — writes go through strict validation, reads go through optimized paths.',
        'CQRS Command Handler'
      ),
      celebrationMessage: buildCelebration(
        'CQRS Command Handler',
        'Auth Service',
        "Twitter's CQRS Command Handler processes tweet creation, likes, and follows with strict consistency. Commands are validated and persisted to the write model before acknowledgment — no partial writes.",
        'CQRS Query Handler'
      ),
      messages: [
        msg("CQRS Command Handler processes write operations — tweet creation, likes, follows."),
        msg("Commands are validated and persisted to the write model with strict consistency before acknowledgment. Reads go through an optimized query path separately."),
        msg('Press ⌘K, search for "CQRS Command Handler", add it, then connect Auth Service → CQRS Command Handler.'),
      ],
      requiredNodes: ['cqrs_command_handler'],
      requiredEdges: [edge('auth_service', 'cqrs_command_handler')],
      successMessage: 'CQRS Command Handler added. Now the query handler.',
      errorMessage: 'Add a CQRS Command Handler connected from the Auth Service.',
    }),
    step({
      id: 8,
      title: 'Add CQRS Query Handler',
      explanation:
        "Twitter's CQRS Query Handler serves read operations from a denormalized read model — optimized for fast queries without the overhead of translating from a normalized write model. Timeline reads use this optimized path.",
      action: buildAction(
        'CQRS Query Handler',
        'Timeline Service',
        'CQRS Query Handler',
        'read operations being served from a denormalized read model optimized for fast queries — timeline reads'
      ),
      why: "Without CQRS, every read requires translating from the normalized write model. The Query Handler serves reads from a pre-computed denormalized model — sub-millisecond timeline reads.",
      component: component('cqrs_query_handler', 'CQRS Query Handler'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'CQRS Query Handler',
        'serve read operations from a denormalized read model — sub-millisecond timeline reads without write model translation',
        'Without CQRS, every read requires translating from the normalized write model — slower queries.',
        'CQRS Query Handler'
      ),
      celebrationMessage: buildCelebration(
        'CQRS Query Handler',
        'Timeline Service',
        "Twitter's CQRS Query Handler serves timeline reads from a denormalized read model — pre-computed tweet IDs sorted by time. Timeline reads are sub-millisecond without any write model translation.",
        'Data Warehouse'
      ),
      messages: [
        msg("CQRS Query Handler serves read operations from a denormalized read model."),
        msg("Timeline reads use the pre-computed denormalized model — sub-millisecond queries without translating from the normalized write model."),
        msg('Press ⌘K, search for "CQRS Query Handler", add it, then connect Timeline Service → CQRS Query Handler.'),
      ],
      requiredNodes: ['cqrs_query_handler'],
      requiredEdges: [edge('timeline_service', 'cqrs_query_handler')],
      successMessage: 'CQRS Query Handler added. Now the analytics pipeline.',
      errorMessage: 'Add a CQRS Query Handler connected from the Timeline Service.',
    }),
    step({
      id: 9,
      title: 'Add Data Warehouse',
      explanation:
        "Twitter's Data Warehouse stores all historical engagement data — tweet performance, user growth, advertising metrics. It powers the business intelligence that guides product decisions and ad targeting.",
      action: buildAction(
        'Data Warehouse',
        'CDC Connector',
        'Data Warehouse',
        'all historical engagement data being stored for business intelligence, ad targeting, and ML training'
      ),
      why: "The NoSQL database answers 'what is the current like count for this tweet?' The Data Warehouse answers 'what are the engagement trends for political content over the past year?' — different query patterns requiring different storage.",
      component: component('data_warehouse', 'Data Warehouse'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'Data Warehouse',
        'columnar analytics storage for engagement trends and ad targeting performance across years of data',
        'The NoSQL database cannot answer multi-year trend questions — that needs a data warehouse.',
        'Data Warehouse'
      ),
      celebrationMessage: buildCelebration(
        'Data Warehouse',
        'CDC Connector',
        "Twitter's data warehouse processes petabytes of engagement data. Ad targeting models, content moderation policies, and recommendation training all use this data — guiding what 500M users see.",
        'Event Store'
      ),
      messages: [
        msg("Data Warehouse stores all historical engagement data for business intelligence, ad targeting, and ML training."),
        msg("The NoSQL database cannot answer multi-year engagement trend questions — columnar storage optimized for analytics is required."),
        msg('Press ⌘K, search for "Data Warehouse", add it, then connect CDC Connector → Data Warehouse.'),
      ],
      requiredNodes: ['data_warehouse'],
      requiredEdges: [edge('cdc_connector', 'data_warehouse')],
      successMessage: 'Analytics pipeline added. Now event sourcing.',
      errorMessage: 'Add a Data Warehouse connected from the CDC Connector.',
    }),
    step({
      id: 10,
      title: 'Add Saga Orchestrator',
      explanation:
        "Twitter's Saga Orchestrator coordinates multi-service distributed transactions — when a tweet is deleted, the saga coordinates deletion across tweet storage, timeline caches, trending counters, and notification queues using compensating actions.",
      action: buildAction(
        'Saga Orchestrator',
        'Tweet Service',
        'Saga Orchestrator',
        'multi-service tweet deletion being coordinated across storage, timelines, trending, and notifications using compensating actions'
      ),
      why: "Without saga orchestration, deleting a tweet would require manual compensation across multiple services when one fails. The saga coordinates rollback automatically.",
      component: component('saga_orchestrator', 'Saga Orchestrator'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'Saga Orchestrator',
        'coordinate multi-service tweet deletion across storage, timelines, trending, and notifications using compensating actions',
        'Without saga orchestration, multi-service deletions require manual compensation when failures occur.',
        'Saga Orchestrator'
      ),
      celebrationMessage: buildCelebration(
        'Saga Orchestrator',
        'Tweet Service',
        "Twitter's Saga Orchestrator coordinates tweet deletion across tweet storage, timeline caches, trending counters, and notification queues. If one service fails, compensating actions roll back the entire operation atomically.",
        'Event Store'
      ),
      messages: [
        msg("Saga Orchestrator coordinates multi-service distributed transactions — tweet deletion across storage, timelines, trending, and notifications."),
        msg("If one service fails during deletion, compensating actions roll back the entire operation automatically. No partial state left behind."),
        msg('Press ⌘K, search for "Saga Orchestrator", add it, then connect Tweet Service → Saga Orchestrator.'),
      ],
      requiredNodes: ['saga_orchestrator'],
      requiredEdges: [edge('microservice', 'saga_orchestrator')],
      successMessage: 'Saga orchestration added. Now event sourcing.',
      errorMessage: 'Add a Saga Orchestrator connected from the Tweet Service.',
    }),
    step({
      id: 11,
      title: 'Add Event Store',
      explanation:
        "Twitter's Event Store (EventStoreDB) maintains an immutable log of all tweet lifecycle events — created, liked, retweeted, deleted, moderated. The entire tweet history can be reconstructed by replaying events for audit and compliance.",
      action: buildAction(
        'Event Store (EventStoreDB)',
        'Tweet Service',
        'Event Store',
        'immutable event log being maintained for tweet lifecycle — enabling audit trails and state reconstruction by replay'
      ),
      why: "Content moderation decisions require a complete audit trail — who deleted what, when, why. The Event Store provides immutable evidence for legal and compliance requirements.",
      component: component('event_store', 'Event Store (EventStoreDB)'),
      openingMessage: buildOpeningL3(
        'Twitter',
        'Event Store (EventStoreDB)',
        'immutable event log for tweet lifecycle enabling audit trails and state reconstruction for legal compliance',
        'Content moderation decisions require a complete audit trail — the Event Store provides immutable evidence.',
        'Event Store (EventStoreDB)'
      ),
      celebrationMessage: buildCelebration(
        'Event Store',
        'Tweet Service',
        "Twitter's Event Store maintains an immutable log of every tweet lifecycle event — created, liked, retweeted, deleted, moderated. Legal teams can reconstruct exactly what happened and when. This completes the expert architecture.",
        'completion'
      ),
      messages: [
        msg("Event Store (EventStoreDB) maintains an immutable log of all tweet lifecycle events — created, liked, retweeted, deleted, moderated."),
        msg("The entire tweet history can be reconstructed by replaying events. Content moderation decisions require a complete audit trail — the Event Store provides immutable evidence for legal and compliance."),
        msg('Press ⌘K, search for "Event Store (EventStoreDB)", add it, then connect Tweet Service → Event Store. This completes the expert architecture!'),
      ],
      requiredNodes: ['event_store'],
      requiredEdges: [edge('microservice', 'event_store')],
      successMessage: "Expert architecture complete! You've designed Twitter at the senior engineer level.",
      errorMessage: 'Add an Event Store connected from the Tweet Service.',
    }),
  ],
});

export const twitterTutorial: Tutorial = tutorial({
  id: 'twitter-architecture',
  title: 'How to Design Twitter/X Architecture',
  description:
    'Solve the fan-out problem serving 500M users. Build tweet delivery, real-time feeds, trending topics, and a timeline that scales to millions of concurrent reads.',
  difficulty: 'Advanced',
  category: 'Social Media',
  isLive: false,
  icon: 'Twitter',
  color: '#1da1f2',
  tags: ['Fan-out', 'Timeline', 'Trending', 'Cache', 'Graph'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
