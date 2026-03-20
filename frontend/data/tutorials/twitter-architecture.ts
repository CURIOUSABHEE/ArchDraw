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
  estimatedTime: '~32 mins',
  levels: [l1],
});
