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
  title: 'Professional Social Network',
  subtitle: 'Build a professional social network in 11 steps',
  description:
    'Build a professional social network for 1 billion members. Learn social graph traversal, feed ranking, connection degrees, job matching, and real-time messaging at scale.',
  estimatedTime: '~30 mins',
  unlocks: 'Production Layer',
  contextMessage:
    "Let's build LinkedIn from scratch. 1 billion members, 40 million job postings, and a social graph with billions of connections. The hardest problem: when you search for '2nd-degree connections who work at Google', LinkedIn must traverse a graph of billions of edges in milliseconds.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "LinkedIn's web client handles the feed, profile pages, job search, and messaging. It's a React SPA that renders the feed, connection suggestions, and job recommendations — all personalized per user.",
      action: buildFirstStepAction('Web'),
      why: "The web client is where 1 billion members spend their time. It must render a personalized feed, connection suggestions, and job recommendations — all different for every user.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'Web Client',
        'render personalized feeds, connection suggestions, and job recommendations for 1 billion members',
        "LinkedIn's hardest problem: when you search for '2nd-degree connections who work at Google', LinkedIn must traverse a graph of billions of edges in milliseconds. That requires a purpose-built graph database.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "LinkedIn's web client handles the feed, profile pages, job search, and messaging for 1 billion members. It renders a personalized feed, connection suggestions, and job recommendations — all different for every user.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the LinkedIn Architecture tutorial. 1 billion members, 40 million job postings, and a social graph with billions of connections."
        ),
        msg(
          "LinkedIn's hardest problem: when you search for '2nd-degree connections who work at Google', LinkedIn must traverse a graph of billions of edges in milliseconds. That requires a purpose-built graph database."
        ),
        msg("Press ⌘K and search for \"Web\" and press Enter to add the client to the canvas."),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Web Client added. Now the API layer.',
      errorMessage: 'Add a Web Client node to the canvas first.',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        "All client requests flow through the API Gateway. LinkedIn uses a gateway that handles authentication, rate limiting, and routing to the correct microservice — whether that's the feed service, search service, or messaging service.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'all client requests being routed with authentication and rate limiting'),
      why: "LinkedIn has dozens of microservices. The API Gateway is the single entry point that routes requests, enforces rate limits, and handles auth token validation before any service sees the request.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'API Gateway',
        'route requests to the correct microservice while enforcing authentication and rate limits',
        "The gateway validates your auth token, checks rate limits (LinkedIn throttles aggressive scrapers), and routes to the right service. A profile view goes to the profile service; a job search goes to the search service.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "LinkedIn has dozens of microservices. The API Gateway is the single entry point that routes requests, enforces rate limits, and handles auth token validation. LinkedIn throttles aggressive scrapers at the gateway level.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "All LinkedIn requests flow through the API Gateway — feed loads, profile views, job searches, and messages."
        ),
        msg(
          "The gateway validates your auth token, checks rate limits (LinkedIn throttles aggressive scrapers), and routes to the right service. A profile view goes to the profile service; a job search goes to the search service."
        ),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added. Now distribute the load.',
      errorMessage: 'Add an API Gateway and connect it from the Client.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "LinkedIn's Load Balancer distributes traffic across service instances. LinkedIn uses consistent hashing to route requests for the same user to the same service instance — this improves cache hit rates for user-specific data.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'traffic being distributed with consistent hashing for improved cache hit rates'),
      why: "Consistent hashing means user A's requests always go to the same server. That server caches user A's connection graph in memory, making subsequent requests much faster.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'Load Balancer',
        'distribute traffic with consistent hashing so the same user always hits the same server',
        "This matters because the server can cache your connection graph in memory. If your requests were random, every request would need a cold graph lookup. Consistent hashing turns cold lookups into warm cache hits.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "LinkedIn uses consistent hashing in its load balancer — your requests tend to go to the same server instance. That server caches your connection graph in memory, turning cold graph lookups into warm cache hits.",
        'Auth Service'
      ),
      messages: [
        msg(
          "LinkedIn uses consistent hashing in its load balancer — your requests tend to go to the same server instance."
        ),
        msg(
          "This matters because the server can cache your connection graph in memory. If your requests were random, every request would need a cold graph lookup. Consistent hashing turns cold lookups into warm cache hits."
        ),
        msg("Press ⌘K and search for \"Load Balancer\" and press Enter to add it, then connect API Gateway → Load Balancer."),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added. Now authentication.',
      errorMessage: 'Add a Load Balancer and connect it from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add Auth Service',
      explanation:
        "LinkedIn's Auth Service handles OAuth login (Google, Microsoft), email/password, and SSO for enterprise accounts. It issues JWTs with short expiry and refresh tokens for long-lived sessions.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'user and enterprise SSO authentication with JWT token issuance'),
      why: "LinkedIn has enterprise SSO requirements — companies configure SAML/OIDC so employees log in with their corporate credentials. The Auth Service must support both consumer OAuth and enterprise SSO.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'Auth Service',
        'authenticate users with OAuth, email/password, and SAML 2.0 enterprise SSO',
        "Enterprise customers configure their identity provider (Okta, Azure AD) to authenticate employees. The Auth Service validates the SAML assertion and issues a LinkedIn JWT. This is how 'Sign in with your company account' works.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "LinkedIn's auth handles both consumer logins (Google OAuth) and enterprise SSO (SAML for corporate accounts). Enterprise customers configure their identity provider to authenticate employees with their corporate credentials.",
        'Feed Ranker'
      ),
      messages: [
        msg(
          "LinkedIn's auth handles both consumer logins (Google OAuth) and enterprise SSO (SAML for corporate accounts)."
        ),
        msg(
          "Enterprise customers configure their identity provider (Okta, Azure AD) to authenticate employees. The Auth Service validates the SAML assertion and issues a LinkedIn JWT. This is how 'Sign in with your company account' works."
        ),
        msg("Press ⌘K and search for \"Auth Service\" and press Enter to add it, then connect Load Balancer → Auth Service."),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth Service added. Now the core of LinkedIn — the graph.',
      errorMessage: 'Add an Auth Service and connect it from the Load Balancer.',
    }),
    step({
      id: 5,
      title: 'Add Feed Ranker',
      explanation:
        "LinkedIn's Feed Ranker scores every post for every user using a machine learning model. It considers: your relationship to the author, post engagement velocity, content type preference, and recency. The top-scored posts appear in your feed.",
      action: buildAction('Feed Ranker', 'Auth', 'Feed Ranker', 'candidate posts being scored using ML to determine relevance for each user'),
      why: "Without ranking, your feed would be a chronological firehose. The Feed Ranker filters thousands of eligible posts down to the 20 most relevant — the ones you're most likely to engage with.",
      component: component('feed_ranker', 'Feed'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'Feed Ranker',
        'score thousands of candidate posts per user to determine the most relevant 20 for their feed',
        "The model considers: how close you are to the author (1st degree > 2nd degree), how fast the post is getting likes, whether you prefer articles vs. job updates, and how old the post is. A viral post from a 2nd-degree connection can outrank a stale post from a 1st-degree connection.",
        'Feed Ranker'
      ),
      celebrationMessage: buildCelebration(
        'Feed Ranker',
        'Auth Service',
        "LinkedIn's Feed Ranker scores thousands of candidate posts using ML. It considers connection degree, engagement velocity, content type preference, and recency. Without ranking, your feed would be a chronological firehose.",
        'Graph Database'
      ),
      messages: [
        msg(
          "LinkedIn's Feed Ranker scores thousands of candidate posts and picks the 20 most relevant for your feed."
        ),
        msg(
          "The model considers: how close you are to the author (1st degree > 2nd degree), how fast the post is getting likes, whether you prefer articles vs. job updates, and how old the post is. A viral post from a 2nd-degree connection can outrank a stale post from a 1st-degree connection."
        ),
        msg("Press ⌘K and search for \"Feed Ranker\" and press Enter to add it, then connect Auth Service → Feed Ranker."),
      ],
      requiredNodes: ['feed_ranker'],
      requiredEdges: [edge('auth_service', 'feed_ranker')],
      successMessage: 'Feed Ranker added. Now the social graph database.',
      errorMessage: 'Add a Feed Ranker and connect it from the Auth Service.',
    }),
    step({
      id: 6,
      title: 'Add Graph Database',
      explanation:
        "LinkedIn's Graph Database stores the social graph — who is connected to whom, who follows whom, and company-to-employee relationships. LinkedIn built their own graph database called LinkedIn Graph (based on Voldemort) to handle billions of nodes and edges.",
      action: buildAction('Graph Database', 'Feed', 'Graph Database', 'the social graph being stored and traversed for connection degree queries'),
      why: "Relational databases are terrible at graph traversal. Finding all 2nd-degree connections requires a JOIN of a JOIN — exponentially expensive. A graph database stores relationships as first-class citizens, making traversal O(connections) instead of O(table size).",
      component: component('graph_database', 'Graph'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'Graph Database',
        'store and traverse billions of connections in milliseconds for degree-of-separation queries',
        "In a relational DB, finding 2nd-degree connections requires: SELECT friends of friends WHERE NOT already connected. That's a self-join on a billion-row table — catastrophically slow. A graph DB traverses edges directly: O(connections) not O(table size).",
        'Graph Database'
      ),
      celebrationMessage: buildCelebration(
        'Graph Database',
        'Feed Ranker',
        "The Graph Database is LinkedIn's most critical infrastructure. It stores billions of connections and enables degree-of-separation queries in milliseconds. Relational databases would require self-joins on billion-row tables — catastrophically slow.",
        'Search Service'
      ),
      messages: [
        msg(
          "The Graph Database is LinkedIn's most critical infrastructure. It stores billions of connections and enables degree-of-separation queries in milliseconds."
        ),
        msg(
          "In a relational DB, finding 2nd-degree connections requires: SELECT friends of friends WHERE NOT already connected. That's a self-join on a billion-row table — catastrophically slow. A graph DB traverses edges directly: start at your node, hop to neighbors, hop again. O(connections) not O(table size)."
        ),
        msg("Press ⌘K and search for \"Graph Database\" and press Enter to add it, then connect Feed Ranker → Graph Database."),
      ],
      requiredNodes: ['graph_database'],
      requiredEdges: [edge('feed_ranker', 'graph_database')],
      successMessage: 'Graph Database added. Now the search layer.',
      errorMessage: 'Add a Graph Database and connect it from the Feed Ranker.',
    }),
    step({
      id: 7,
      title: 'Add Search Service',
      explanation:
        "LinkedIn's Search Service powers people search, job search, and company search. It uses Elasticsearch under the hood with custom ranking that boosts results based on your network — a 1st-degree connection named 'John Smith' ranks above a stranger named 'John Smith'.",
      action: buildAction('Search Engine', 'Auth', 'Search Service', 'network-aware search results being boosted by connection degree'),
      why: "LinkedIn search is network-aware. The same query returns different results for different users based on their connections. This requires combining full-text search scores with graph proximity scores.",
      component: component('search_engine', 'Search'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'Search Service',
        'power network-aware search that boosts results based on your connection degree',
        "When you search 'software engineer at Google', LinkedIn combines text relevance (does the profile match?) with network proximity (are they in your network?). A 2nd-degree connection ranks above a stranger with the same title. This requires the Search Service to query both Elasticsearch and the Graph Database.",
        'Search Engine'
      ),
      celebrationMessage: buildCelebration(
        'Search Service',
        'Auth Service',
        "LinkedIn's search is network-aware — the same query returns different results for different users. When you search for 'software engineer at Google', a 2nd-degree connection ranks above a stranger with the same title. This combines Elasticsearch with graph proximity.",
        'Timeline Service'
      ),
      messages: [
        msg(
          "LinkedIn's search is network-aware — the same query returns different results for different users."
        ),
        msg(
          "When you search 'software engineer at Google', LinkedIn combines text relevance (does the profile match?) with network proximity (are they in your network?). A 2nd-degree connection ranks above a stranger with the same title. This requires the Search Service to query both Elasticsearch and the Graph Database."
        ),
        msg("Press ⌘K and search for \"Search Engine\" and press Enter to add it, then connect Auth Service → Search Service."),
      ],
      requiredNodes: ['search_engine'],
      requiredEdges: [edge('auth_service', 'search_engine')],
      successMessage: 'Search Service added. Now the timeline service.',
      errorMessage: 'Add a Search Service (Search Engine) and connect it from the Auth Service.',
    }),
    step({
      id: 8,
      title: 'Add Timeline Service',
      explanation:
        "The Timeline Service aggregates posts from your connections and follows, applies the Feed Ranker scores, and assembles your feed. It uses a pull model — when you open LinkedIn, it fetches recent posts from your connections and ranks them in real-time.",
      action: buildAction('Timeline Service', 'Feed', 'Timeline Service', 'posts from your connections being aggregated and ranked for your feed'),
      why: "LinkedIn uses a pull model (not push) because the average user has 500 connections. Pushing every post to every follower's feed would be 500x write amplification. Pull is cheaper for LinkedIn's connection density.",
      component: component('timeline_service', 'Timeline'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'Timeline Service',
        'aggregate posts from your connections using a pull model optimized for high connection density',
        "When you open LinkedIn, the Timeline Service fetches recent posts from your 500 connections, passes them to the Feed Ranker, and returns the top 20. LinkedIn chose pull over push because 500 connections × millions of posts = too many writes.",
        'Timeline Service'
      ),
      celebrationMessage: buildCelebration(
        'Timeline Service',
        'Feed Ranker',
        "The Timeline Service uses a pull model — when you open LinkedIn, it fetches recent posts from your 500 connections, passes them to the Feed Ranker, and returns the top 20. LinkedIn chose pull over push because 500 connections × millions of posts = too many writes.",
        'Message Queue'
      ),
      messages: [
        msg(
          "The Timeline Service assembles your feed on demand using a pull model."
        ),
        msg(
          "When you open LinkedIn, the Timeline Service fetches recent posts from your 500 connections, passes them to the Feed Ranker, and returns the top 20. LinkedIn chose pull over push because 500 connections × millions of posts = too many writes. Twitter uses push for celebrities (fan-out on write) but LinkedIn's connection graph is denser."
        ),
        msg("Press ⌘K and search for \"Timeline Service\" and press Enter to add it, then connect Feed Ranker → Timeline Service."),
      ],
      requiredNodes: ['timeline_service'],
      requiredEdges: [edge('feed_ranker', 'timeline_service')],
      successMessage: 'Timeline Service added. Now the message queue.',
      errorMessage: 'Add a Timeline Service and connect it from the Feed Ranker.',
    }),
    step({
      id: 9,
      title: 'Add Message Queue',
      explanation:
        "LinkedIn's Message Queue (Kafka) handles async events: new post published, connection request sent, job application submitted. These events fan out to multiple consumers — the notification service, the analytics pipeline, and the feed indexer.",
      action: buildAction('Message Queue', 'Timeline', 'Message Queue', 'async events being published for multiple downstream consumers to process independently'),
      why: "When you post on LinkedIn, 10 things need to happen: notify your connections, index the post for search, update analytics, check for spam, etc. Kafka decouples the post action from all downstream processing.",
      component: component('message_queue', 'Message'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'Message Queue',
        'fan out async events to multiple consumers for notifications, analytics, and search indexing',
        "LinkedIn actually built Kafka — it was created by LinkedIn engineers and open-sourced in 2011. When you post on LinkedIn, a single event goes to Kafka. Multiple consumers process it independently: the notification service, the search indexer, the spam detector, and the analytics pipeline.",
        'Message Queue'
      ),
      celebrationMessage: buildCelebration(
        'Message Queue',
        'Timeline Service',
        "LinkedIn actually built Kafka — it was created by LinkedIn engineers and open-sourced in 2011. When you post, a single event goes to Kafka and multiple consumers process it independently: notifications, search indexing, spam detection, and analytics. All decoupled, all async.",
        'NoSQL Database'
      ),
      messages: [
        msg(
          "LinkedIn actually built Kafka — it was created by LinkedIn engineers and open-sourced in 2011."
        ),
        msg(
          "When you post on LinkedIn, a single event goes to Kafka. Multiple consumers process it independently: the notification service sends alerts to your connections, the search indexer makes it searchable, the spam detector checks for violations, the analytics pipeline records the event. All decoupled, all async."
        ),
        msg("Press ⌘K and search for \"Message Queue\" and press Enter to add it, then connect Timeline Service → Message Queue."),
      ],
      requiredNodes: ['message_queue'],
      requiredEdges: [edge('timeline_service', 'message_queue')],
      successMessage: 'Message Queue added. Now the data layer.',
      errorMessage: 'Add a Message Queue and connect it from the Timeline Service.',
    }),
    step({
      id: 10,
      title: 'Add NoSQL Database',
      explanation:
        "LinkedIn stores profiles, posts, job listings, and activity data in NoSQL databases. Profile data is document-oriented — each profile has a flexible schema with different sections for different users (some have patents, some have publications).",
      action: buildAction('NoSQL Database', 'Timeline', 'NoSQL Database', 'profiles, posts, and job listings being stored with flexible schemas per user'),
      why: "LinkedIn profiles have wildly different schemas — a researcher has publications, a designer has a portfolio, an executive has board memberships. NoSQL's flexible schema handles this without ALTER TABLE migrations.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'NoSQL Database',
        'store profiles and posts with flexible schemas that vary per user type',
        "A researcher's profile has publications and patents. A designer's has portfolio links. An executive's has board memberships. In a relational DB, you'd need nullable columns for every possible field — or complex joins. NoSQL stores each profile as a self-contained document.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Timeline Service',
        "LinkedIn profiles have wildly different schemas — a researcher has publications, a designer has a portfolio, an executive has board memberships. NoSQL's flexible schema handles this without ALTER TABLE migrations. Posts and activity data are also stored as documents.",
        'In-Memory Cache'
      ),
      messages: [
        msg(
          "LinkedIn profiles are stored as documents in NoSQL — each profile is a JSON document with different fields per user."
        ),
        msg(
          "A researcher's profile has publications and patents. A designer's has portfolio links. An executive's has board memberships. In a relational DB, you'd need nullable columns for every possible field — or complex joins. NoSQL stores each profile as a self-contained document."
        ),
        msg("Press ⌘K and search for \"NoSQL Database\" and press Enter to add it, then connect Timeline Service → NoSQL Database."),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('timeline_service', 'nosql_db')],
      successMessage: 'NoSQL Database added. Final step — the cache layer.',
      errorMessage: 'Add a NoSQL Database and connect it from the Timeline Service.',
    }),
    step({
      id: 11,
      title: 'Add In-Memory Cache',
      explanation:
        "LinkedIn caches connection graphs, profile data, and feed results in an in-memory cache. Your connection list is cached so degree-of-separation queries don't hit the graph database on every request.",
      action: buildAction('In-Memory Cache', 'Graph', 'In-Memory Cache', 'hot connection graphs and profile data being cached for sub-millisecond reads'),
      why: "Graph traversal is expensive even with a graph database. Caching your first-degree connections in memory means 'people you may know' suggestions can be computed without a live graph query.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'LinkedIn',
        'In-Memory Cache',
        'cache connection graphs and profile data for sub-millisecond reads without graph traversal',
        "Your 500 connections are cached in memory. When LinkedIn computes 'people you may know', it uses the cached graph to find friends-of-friends without hitting the graph database. Cache invalidation happens when you add or remove a connection.",
        'In-Memory Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'Graph Database',
        "LinkedIn caches your connection graph in memory so 'people you may know' suggestions can be computed without a live graph query. Cache invalidation happens when you add or remove a connection. You have built LinkedIn.",
        'nothing — you have built LinkedIn'
      ),
      messages: [
        msg(
          "The In-Memory Cache stores your connection graph so LinkedIn doesn't traverse the graph database on every page load."
        ),
        msg(
          "Your 500 connections are cached in memory. When LinkedIn computes 'people you may know', it uses the cached graph to find friends-of-friends without hitting the graph database. Cache invalidation happens when you add or remove a connection."
        ),
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect Graph Database → In-Memory Cache."),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('graph_database', 'in_memory_cache')],
      successMessage: 'Tutorial complete! You have built LinkedIn.',
      errorMessage: 'Add an In-Memory Cache and connect it from the Graph Database.',
    }),
  ],
});

// ── Level 2 — LinkedIn at Scale (8 steps) ─────────────────────────────────────

const l2 = level({
  level: 2,
  title: "LinkedIn at Scale",
  subtitle: "Scale to 1 billion members with event streaming and graph caching",
  description:
    "Add Kafka event streaming, Redis graph caching, CDC pipelines, and SLO tracking to LinkedIn's architecture. Handle 5 trillion events per day and serve the social graph with sub-100ms latency.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale LinkedIn. 1 billion members, 5 trillion events per day, and a social graph with billions of connections. This requires Kafka for event streaming, Redis for graph caching, and CDC to mirror data for analytics.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "LinkedIn's Event Bus streams profile updates, connection requests, and feed events. Kafka handles 5 trillion events per day — every view, click, and connection streams to analytics.",
      action: buildAction(
        "Kafka / Streaming",
        "API Gateway",
        "Kafka Streaming",
        "profile updates, connection requests, and feed events being streamed to multiple consumers for analytics"
      ),
      why: "At 5 trillion events per day, synchronous processing is impossible. Kafka decouples producers from consumers — profile updates, feed events, and analytics all consume the same stream.",
      component: component("kafka_streaming", "Kafka / Streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "LinkedIn",
        "Kafka Streaming",
        "stream 5 trillion events per day for profile updates, connection requests, and feed analytics",
        "At 5 trillion events per day, synchronous processing is impossible — Kafka decouples producers from consumers.",
        "Kafka / Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "API Gateway",
        "LinkedIn's Kafka streams 5 trillion events per day — every profile view, connection request, and feed interaction. Multiple consumers process events independently: analytics, notifications, and search indexing.",
        "Notification Worker"
      ),
      messages: [
        msg(
          "Level 2 — LinkedIn at Scale. Kafka handles 5 trillion events per day — every view, click, and connection."
        ),
        msg(
          "Profile updates, feed events, and analytics all consume the same Kafka stream. This decouples producers from consumers — the feed service doesn't wait for analytics to process."
        ),
        msg("Press ⌘K and search for \"Kafka / Streaming\" and press Enter to add it, then connect API Gateway → Kafka Streaming."),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("api_gateway", "kafka_streaming")],
      successMessage: "Event streaming added. Now notifications.",
      errorMessage: "Add a Kafka Streaming component connected from the API Gateway.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "LinkedIn's Notification Worker handles email, push, and inMail notifications. When you get a connection request, it notifies via email, push, and in-app simultaneously.",
      action: buildAction(
        "Worker",
        "Kafka",
        "Notification Worker",
        "email, push, and inMail notifications being sent simultaneously when connection requests arrive"
      ),
      why: "Notification delivery must be fast and reliable. When you get a connection request, you want to know immediately via push, email, and in-app — all delivered from the same worker.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "LinkedIn",
        "Notification Worker",
        "send email, push, and inMail notifications simultaneously when connection requests arrive",
        "Notification delivery must be fast and reliable — push, email, and in-app all from one worker.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "LinkedIn's Notification Worker delivers email, push, and inMail simultaneously when you get a connection request. When you get a job recommendation, it notifies via all three channels.",
        "In-Memory Cache"
      ),
      messages: [
        msg("Notification workers consume Kafka events to send email, push, and inMail notifications."),
        msg(
          "When you get a connection request, all three channels fire simultaneously. The worker batches notifications during peak times to prevent email provider rate limits."
        ),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Kafka Streaming → Notification Worker."),
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
        "LinkedIn's Redis Cache serves the social graph with 95%+ cache hit rate. Profile data, connection lists, and feed content are cached aggressively — MySQL can't handle direct queries at this scale.",
      action: buildAction(
        "In-Memory Cache",
        "Graph Database",
        "In-Memory Cache",
        "social graph with 95%+ cache hit rate being served from Redis instead of expensive graph traversal"
      ),
      why: "Graph traversal is expensive even with a graph database. Redis caches your first-degree connections — 'people you may know' suggestions compute without graph queries 95% of the time.",
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "LinkedIn",
        "Redis Cache",
        "serve the social graph with 95%+ cache hit rate instead of expensive graph database traversal",
        "Graph traversal is expensive — Redis caches your connection graph for sub-10ms reads.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "Graph Database",
        "LinkedIn's Redis cache serves the social graph with 95%+ hit rate. Profile data, connection lists, and feed content are cached aggressively — MySQL can't handle direct queries at this scale.",
        "CDC Connector"
      ),
      messages: [
        msg("LinkedIn's Redis Cache serves the social graph with 95%+ hit rate."),
        msg(
          "Profile data, connection lists, and feed content are cached aggressively. When a viral profile's connections are cached, sub-10ms reads replace expensive graph traversal."
        ),
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect Graph Database → In-Memory Cache."),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("graph_database", "in_memory_cache")],
      successMessage: "Graph caching added. Now CDC pipelines.",
      errorMessage: "Add an In-Memory Cache connected from the Graph Database.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "LinkedIn's CDC Connector mirrors data to the analytics platform. Profile changes, job views, and connection graphs stream to Kafka for real-time analytics and ML training.",
      action: buildAction(
        "CDC Connector",
        "Graph Database",
        "CDC Connector",
        "profile changes and connection graphs being mirrored to Kafka for real-time analytics and ML training"
      ),
      why: "Analytics queries on the production database would degrade user-facing performance. CDC streams changes to a separate analytics platform — no impact on production traffic.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "LinkedIn",
        "CDC Connector",
        "mirror profile changes and connection graphs to Kafka for real-time analytics and ML training",
        "Analytics queries on the production database would degrade performance — CDC streams changes to analytics.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "Graph Database",
        "LinkedIn's CDC Connector mirrors data to the analytics platform. Profile changes, job views, and connection graphs stream to Kafka for real-time analytics and ML training data.",
        "SQL Database"
      ),
      messages: [
        msg("CDC Connector mirrors production data to the analytics platform without impacting user-facing performance."),
        msg(
          "Profile changes, job views, and connection graphs stream to Kafka. Analytics consumers and ML training pipelines consume the CDC stream independently."
        ),
        msg("Press ⌘K and search for \"CDC Connector\" and press Enter to add it, then connect Graph Database → CDC Connector."),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("graph_database", "cdc_connector")],
      successMessage: "CDC pipelines added. Now SQL for profiles.",
      errorMessage: "Add a CDC Connector connected from the Graph Database.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "LinkedIn's MySQL cluster stores profiles, job listings, and company pages. LinkedIn famously runs MySQL at scale — they even wrote their own storage engine (HeidiDB) on top of MySQL.",
      action: buildAction(
        "SQL Database",
        "Graph Database",
        "SQL Database",
        "profiles, job listings, and company pages being stored in MySQL with LinkedIn's custom HeidiDB storage engine"
      ),
      why: "LinkedIn's relational data — job listings, company info, billing records — requires ACID transactions. MySQL handles this with LinkedIn's custom storage engine optimized for their access patterns.",
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "LinkedIn",
        "MySQL Cluster",
        "store profiles, job listings, and company pages with ACID guarantees using LinkedIn's custom HeidiDB storage engine",
        "LinkedIn runs MySQL at scale — they wrote their own storage engine for optimal performance.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "Graph Database",
        "LinkedIn's MySQL cluster stores profiles, job listings, and company pages. LinkedIn famously runs MySQL at scale — they even wrote their own storage engine (HeidiDB) on top of MySQL.",
        "Structured Logger"
      ),
      messages: [
        msg("LinkedIn's MySQL cluster stores profiles, job listings, and company pages."),
        msg(
          "LinkedIn famously runs MySQL at scale — they even wrote their own storage engine (HeidiDB). ACID transactions ensure billing records and job applications are reliable."
        ),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect Graph Database → SQL Database."),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("graph_database", "sql_db")],
      successMessage: "SQL added. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the Graph Database.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "LinkedIn's Structured Logger captures every feed impression, job view, and message sent. Logs flow to Kafka and then to the data lake — LinkedIn processes petabytes of logs daily.",
      action: buildAction(
        "Structured Logger",
        "API Gateway",
        "Structured Logger",
        "every feed impression, job view, and message being captured in structured JSON logs flowing to Kafka"
      ),
      why: "At petabyte scale, text logs are impossible to query. Structured JSON logs with consistent schemas enable fast LogQL aggregation across billions of events per day.",
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "LinkedIn",
        "Structured Logger",
        "capture every feed impression, job view, and message in structured JSON logs flowing to Kafka",
        "At petabyte scale, text logs are impossible to query — structured JSON enables fast LogQL aggregation.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "API Gateway",
        "LinkedIn's Structured Logger captures every feed impression, job view, and message sent. Logs flow to Kafka and then to the data lake — LinkedIn processes petabytes of logs daily.",
        "SLO Tracker"
      ),
      messages: [
        msg("LinkedIn's Structured Logger captures every feed impression, job view, and message sent."),
        msg(
          "Logs flow to Kafka and then to the data lake. Structured JSON with consistent schemas enables fast aggregation across billions of events per day."
        ),
        msg("Press ⌘K and search for \"Structured Logger\" and press Enter to add it, then connect API Gateway → Structured Logger."),
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("api_gateway", "structured_logger")],
      successMessage: "Structured logging added. Now SLO tracking.",
      errorMessage: "Add a Structured Logger connected from the API Gateway.",
    }),
    step({
      id: 7,
      title: "Add SLO Tracker",
      explanation:
        "LinkedIn's SLO Tracker monitors feed ranking latency, search response time, and InMail delivery. Feed ranking must complete in <200ms — tracked as a top-tier SLO.",
      action: buildAction(
        "SLO/SLI Tracker",
        "Feed Ranker",
        "SLO Tracker",
        "feed ranking latency, search response time, and InMail delivery being tracked against defined SLO targets"
      ),
      why: "With 1 billion members, even a 10ms regression in feed ranking impacts engagement. SLOs define what 'good enough' means — without them, teams argue about priorities.",
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "LinkedIn",
        "SLO Tracker",
        "monitor feed ranking latency, search response time, and InMail delivery against defined SLO targets",
        "With 1 billion members, even a 10ms regression impacts engagement — SLOs define acceptable performance.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO Tracker",
        "Feed Ranker",
        "LinkedIn's SLO Tracker monitors feed ranking latency, search response time, and InMail delivery. Feed ranking must complete in <200ms — tracked as a top-tier SLO.",
        "Error Budget Alert"
      ),
      messages: [
        msg("SLO Tracker monitors feed ranking latency, search response time, and InMail delivery."),
        msg(
          "Feed ranking must complete in <200ms — tracked as a top-tier SLO. Search response time SLO: <100ms for 95% of queries. When these SLOs are violated, on-call is paged."
        ),
        msg("Press ⌘K and search for \"SLO/SLI Tracker\" and press Enter to add it, then connect Feed Ranker → SLO Tracker."),
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("feed_ranker", "slo_tracker")],
      successMessage: "SLO tracking added. Now error budgets.",
      errorMessage: "Add an SLO/SLI Tracker connected from the Feed Ranker.",
    }),
    step({
      id: 8,
      title: "Add Error Budget Alert",
      explanation:
        "LinkedIn's Error Budget Monitor ensures reliability investments balance feature velocity. When the feed SLO budget is consumed, deployments are halted until reliability recovers.",
      action: buildAction(
        "Error Budget Monitor",
        "SLO Tracker",
        "Error Budget Alert",
        "error budget burn rate being tracked — halting deployments when the feed SLO budget is consumed"
      ),
      why: "Without error budgets, reliability is sacrificed for velocity. When the error budget burns faster than acceptable, feature launches pause until reliability recovers.",
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "LinkedIn",
        "Error Budget Monitor",
        "track error budget burn rate — halting deployments when the feed SLO budget is consumed",
        "Without error budgets, reliability is sacrificed for velocity — deployments pause when budget depletes.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Alert",
        "SLO Tracker",
        "LinkedIn's Error Budget Monitor ensures reliability investments balance feature velocity. When the feed SLO budget is consumed, deployments are halted until reliability recovers.",
        "Level 3"
      ),
      messages: [
        msg("Error Budget Monitor tracks remaining reliability budget for the feed ranking SLO."),
        msg(
          "When the error budget burns faster than acceptable, feature launches pause until reliability improves. This prevents reliability from being sacrificed for velocity."
        ),
        msg("Press ⌘K and search for \"Error Budget Monitor\" and press Enter to add it, then connect SLO Tracker → Error Budget Alert."),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget monitoring added. LinkedIn is now scaled.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO Tracker.",
    }),
  ],
});

// ── Level 3 — LinkedIn Enterprise (11 steps) ──────────────────────────────────

const l3 = level({
  level: 3,
  title: "LinkedIn Enterprise",
  subtitle: "Add zero-trust networking, distributed tracing, and real-time analytics",
  description:
    "Implement zero-trust networking with SPIFFE mTLS, distributed tracing across 1000+ microservices, and real-time analytics with Pinot. LinkedIn Enterprise serves Fortune 500 companies with compliance-grade observability.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make LinkedIn enterprise-grade. Zero-trust networking, 1000+ microservices with distributed tracing, and real-time analytics. LinkedIn Enterprise serves companies with compliance requirements that drive every architectural decision.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "LinkedIn's Service Mesh (Envoy) handles mTLS between 1000+ microservices. Every internal call is encrypted — LinkedIn's zero-trust architecture ensures compromised services can't impersonate others.",
      action: buildAction(
        "Service Mesh (Istio)",
        "API Gateway",
        "Service Mesh",
        "mTLS encryption being enforced between 1000+ microservices with zero-trust architecture"
      ),
      why: "At 1000+ microservices, manual TLS certificate management is impossible. The service mesh handles certificate rotation and mTLS transparently — compromised containers are ejected from the mesh within minutes.",
      component: component("service_mesh", "Service Mesh (Istio)"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "Service Mesh (Envoy)",
        "handle mTLS between 1000+ microservices with zero-trust architecture — compromised services can't impersonate others",
        "At 1000+ microservices, manual TLS management is impossible — the service mesh handles it transparently.",
        "Service Mesh (Istio)"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "API Gateway",
        "LinkedIn's Service Mesh (Envoy) handles mTLS between 1000+ microservices. Every internal call is encrypted — LinkedIn's zero-trust architecture ensures compromised services can't impersonate others.",
        "GraphQL Federation"
      ),
      messages: [
        msg("Level 3 — LinkedIn Enterprise. Service Mesh adds zero-trust networking across 1000+ microservices."),
        msg(
          "Every internal call is encrypted with mTLS. Compromised containers are ejected from the mesh within minutes — they can't impersonate other services."
        ),
        msg("Press ⌘K and search for \"Service Mesh (Istio)\" and press Enter to add it, then connect API Gateway → Service Mesh."),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("api_gateway", "service_mesh")],
      successMessage: "Service mesh added. Now GraphQL Federation.",
      errorMessage: "Add a Service Mesh connected from the API Gateway.",
    }),
    step({
      id: 2,
      title: "Add GraphQL Federation",
      explanation:
        "LinkedIn's GraphQL Federation composes the API from domain services: Profiles, Jobs, Companies, Messaging. Each team owns their schema while the gateway provides a unified API.",
      action: buildAction(
        "GraphQL Federation Gateway",
        "Service Mesh",
        "GraphQL Federation",
        "Profiles, Jobs, Companies, and Messaging schemas being composed into a unified API from domain subgraphs"
      ),
      why: "With 1000+ microservices, clients making multiple REST calls is inefficient. GraphQL Federation lets clients fetch all needed data in one query — the gateway fans out to multiple subgraphs.",
      component: component("graphql_federation", "GraphQL Federation Gateway"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "GraphQL Federation",
        "compose Profiles, Jobs, Companies, and Messaging schemas into a unified API from domain subgraphs",
        "With 1000+ microservices, clients making multiple REST calls is inefficient — GraphQL composes them.",
        "GraphQL Federation Gateway"
      ),
      celebrationMessage: buildCelebration(
        "GraphQL Federation",
        "Service Mesh",
        "LinkedIn's GraphQL Federation composes the API from domain services: Profiles, Jobs, Companies, Messaging. Each team owns their schema while the gateway provides a unified API.",
        "Token Bucket Rate Limiter"
      ),
      messages: [
        msg("GraphQL Federation composes the API from domain services: Profiles, Jobs, Companies, Messaging."),
        msg(
          "Each team owns their schema while the gateway provides a unified API. Mobile clients query one endpoint — the gateway fans out to multiple subgraphs and composes the response."
        ),
        msg("Press ⌘K and search for \"GraphQL Federation Gateway\" and press Enter to add it, then connect Service Mesh → GraphQL Federation."),
      ],
      requiredNodes: ["graphql_federation"],
      requiredEdges: [edge("service_mesh", "graphql_federation")],
      successMessage: "GraphQL Federation added. Now rate limiting.",
      errorMessage: "Add a GraphQL Federation Gateway connected from the Service Mesh.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "LinkedIn's Rate Limiter uses token buckets per tier: free users get 100 API calls/day, Premium gets 500, Sales Navigator gets 5,000. Token buckets prevent abuse while allowing legitimate usage spikes.",
      action: buildAction(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "Token Bucket Rate Limiter",
        "token buckets per tier being enforced — free users get 100 calls/day, Premium 500, Sales Navigator 5,000"
      ),
      why: "Token buckets smooth out burst traffic while enforcing daily limits. A user scraping 10,000 profiles in an hour can't exhaust resources meant for legitimate premium users.",
      component: component("token_bucket_limiter", "Token Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "Token Bucket Rate Limiter",
        "enforce token buckets per tier — free users 100 calls/day, Premium 500, Sales Navigator 5,000",
        "Token buckets smooth burst traffic while enforcing daily limits — preventing resource exhaustion.",
        "Token Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "LinkedIn's Rate Limiter uses token buckets per tier: free users get 100 API calls/day, Premium gets 500, Sales Navigator gets 5,000. Token buckets prevent abuse while allowing legitimate usage spikes.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg("Token Bucket Rate Limiter enforces per-tier API limits: free 100/day, Premium 500, Sales Navigator 5,000."),
        msg(
          "Token buckets smooth out burst traffic while enforcing daily limits. A user scraping 10,000 profiles in an hour can't exhaust resources meant for legitimate premium users."
        ),
        msg("Press ⌘K and search for \"Token Bucket Rate Limiter\" and press Enter to add it, then connect API Gateway → Token Bucket Rate Limiter."),
      ],
      requiredNodes: ["token_bucket_limiter"],
      requiredEdges: [edge("api_gateway", "token_bucket_limiter")],
      successMessage: "Rate limiting added. Now distributed tracing.",
      errorMessage: "Add a Token Bucket Rate Limiter connected from the API Gateway.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "LinkedIn's OTel Collector traces feed ranking, search, and messaging pipelines. With 1000+ microservices, distributed tracing is essential — a single request touches 50+ services.",
      action: buildAction(
        "OTel Collector",
        "Service Mesh",
        "OpenTelemetry Collector",
        "distributed traces being collected across feed ranking, search, and messaging pipelines spanning 50+ services"
      ),
      why: "Without distributed tracing, debugging a slow request at this scale is impossible. OTel automatically instruments every service call — a single trace links all 50+ services a request touches.",
      component: component("otel_collector", "OTel Collector"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "OpenTelemetry Collector",
        "collect distributed traces across 1000+ microservices — a single request touches 50+ services",
        "Without distributed tracing, debugging a slow request is impossible — OTel links all 50+ services.",
        "OTel Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "Service Mesh",
        "LinkedIn's OTel Collector traces feed ranking, search, and messaging pipelines. With 1000+ microservices, distributed tracing is essential — a single request touches 50+ services.",
        "Correlation ID Handler"
      ),
      messages: [
        msg("OTel Collector traces feed ranking, search, and messaging pipelines across 1000+ microservices."),
        msg(
          "A single request touches 50+ services. Without distributed tracing, debugging a slow request is impossible — OTel automatically instruments every service call."
        ),
        msg("Press ⌘K and search for \"OTel Collector\" and press Enter to add it, then connect Service Mesh → OpenTelemetry Collector."),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("service_mesh", "otel_collector")],
      successMessage: "Distributed tracing added. Now correlation IDs.",
      errorMessage: "Add an OTel Collector connected from the Service Mesh.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "LinkedIn's Correlation ID links a user action (viewing a profile) to every service it touches: feed service, search service, InMail service. Debugging without correlation IDs at this scale would be impossible.",
      action: buildAction(
        "Correlation ID Handler",
        "Load Balancer",
        "Correlation ID Handler",
        "correlation IDs linking user actions to every service they touch for end-to-end request tracing"
      ),
      why: "Correlation IDs are the thread that ties distributed traces together. Without them, correlating logs from 50+ services during an incident would require manual guesswork.",
      component: component("correlation_id_handler", "Correlation ID Handler"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "Correlation ID Handler",
        "link user actions to every service they touch — feed service, search service, InMail service — for end-to-end debugging",
        "Correlation IDs tie distributed traces together — without them, correlating logs from 50+ services is impossible.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "Load Balancer",
        "LinkedIn's Correlation ID links a user action (viewing a profile) to every service it touches: feed service, search service, InMail service. Debugging without correlation IDs at this scale would be impossible.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg("Correlation IDs link a user action to every service it touches: feed, search, InMail."),
        msg(
          "When debugging an incident, you search for the correlation ID and see the complete request timeline across all 50+ services — invaluable for diagnosing latency issues."
        ),
        msg("Press ⌘K and search for \"Correlation ID Handler\" and press Enter to add it, then connect Load Balancer → Correlation ID Handler."),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("load_balancer", "correlation_id_handler")],
      successMessage: "Correlation IDs added. Now certificate management.",
      errorMessage: "Add a Correlation ID Handler connected from the Load Balancer.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "LinkedIn's SPIFFE CA issues certificates to every service pod. LinkedIn rotates certificates every 24 hours — compromised containers are ejected from the mesh within minutes.",
      action: buildAction(
        "SPIFFE CA",
        "Service Mesh",
        "mTLS Certificate Authority",
        "SPIFFE certificates being issued to every service pod with 24-hour rotation and mesh ejection for compromised containers"
      ),
      why: "Manual certificate management doesn't scale to 1000+ services. SPIFFE automates certificate issuance and rotation — certificates expire in 24 hours so compromised containers can't impersonate services long.",
      component: component("mtls_certificate_authority", "SPIFFE CA"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "SPIFFE CA",
        "issue SPIFFE certificates to every service pod with 24-hour rotation — compromised containers ejected within minutes",
        "Manual certificate management doesn't scale — SPIFFE automates issuance and rotation.",
        "SPIFFE CA"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "LinkedIn's SPIFFE CA issues certificates to every service pod. LinkedIn rotates certificates every 24 hours — compromised containers are ejected from the mesh within minutes.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg("SPIFFE CA issues certificates to every service pod with 24-hour rotation."),
        msg(
          "Compromised containers are ejected from the mesh within minutes — they can't impersonate other services. This zero-trust networking is essential for enterprise compliance."
        ),
        msg("Press ⌘K and search for \"SPIFFE CA\" and press Enter to add it, then connect Service Mesh → mTLS Certificate Authority."),
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "Certificate authority added. Now cache protection.",
      errorMessage: "Add an SPIFFE CA connected from the Service Mesh.",
    }),
    step({
      id: 7,
      title: "Add Cache Stampede Guard",
      explanation:
        "LinkedIn's Cache Stampede Guard protects the social graph cache from thundering herds when a viral profile's cache expires. Lock-assisted refresh ensures only one worker computes the expensive graph.",
      action: buildAction(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Cache Stampede Guard",
        "lock-assisted cache refresh being used when viral profile caches expire — preventing thundering herd stampedes"
      ),
      why: "When a viral profile's cache expires, thousands of requests simultaneously try to recompute the graph — a thundering herd. Lock-assisted refresh ensures only one worker computes while others wait.",
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "Cache Stampede Guard",
        "protect the social graph cache from thundering herds when viral profile caches expire using lock-assisted refresh",
        "When a viral profile's cache expires, thousands of requests simultaneously try to recompute — lock-assisted refresh prevents this.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "LinkedIn's Cache Stampede Guard protects the social graph cache from thundering herds when a viral profile's cache expires. Lock-assisted refresh ensures only one worker computes the expensive graph.",
        "Change Data Cache"
      ),
      messages: [
        msg("Cache Stampede Guard protects the social graph cache from thundering herds when viral profile caches expire."),
        msg(
          "Lock-assisted refresh ensures only one worker computes the expensive graph while others wait. Without this guard, thousands of simultaneous recomputations would overwhelm the database."
        ),
        msg("Press ⌘K and search for \"Cache Stampede Guard\" and press Enter to add it, then connect In-Memory Cache → Cache Stampede Guard."),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache protection added. Now CDC-driven cache.",
      errorMessage: "Add a Cache Stampede Guard connected from the In-Memory Cache.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "LinkedIn's CDC pipeline precomputes graph views: 'People You May Know', 'Jobs You May Like'. These ML features are materialized in Redis for sub-10ms retrieval.",
      action: buildAction(
        "CDC Connector",
        "Graph Database",
        "Change Data Cache",
        "precomputed 'People You May Know' and 'Jobs You May Like' views being materialized in Redis from CDC pipeline"
      ),
      why: "ML features like 'People You May Know' are expensive to compute on-the-fly. CDC precomputes these features and materializes them in Redis — serving recommendations in sub-10ms instead of seconds.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "Change Data Cache",
        "precompute 'People You May Know' and 'Jobs You May Like' views in Redis from CDC pipeline for sub-10ms retrieval",
        "ML features are expensive to compute on-the-fly — CDC precomputes them in Redis for sub-10ms serving.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "Graph Database",
        "LinkedIn's CDC pipeline precomputes graph views: 'People You May Know', 'Jobs You May Like'. These ML features are materialized in Redis for sub-10ms retrieval.",
        "Data Warehouse"
      ),
      messages: [
        msg("CDC pipeline precomputes 'People You May Know' and 'Jobs You May Like' views in Redis."),
        msg(
          "ML features are expensive to compute on-the-fly. CDC streams graph changes and recomputes recommendations in advance — serving in sub-10ms instead of seconds."
        ),
        msg("Press ⌘K and search for \"CDC Connector\" and press Enter to add another one, then connect Graph Database → Change Data Cache."),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("graph_database", "cdc_connector")],
      successMessage: "CDC-driven cache added. Now real-time analytics.",
      errorMessage: "Add another CDC Connector connected from the Graph Database.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "LinkedIn's Data Warehouse (Pinot) stores activity streams for analytics: who viewed your profile, who messaged you, which jobs you clicked. Real-time analytics power the 'Who Viewed My Profile' feature.",
      action: buildAction(
        "Data Warehouse",
        "Kafka",
        "Data Warehouse",
        "activity streams for analytics being stored in Pinot — profile views, messages, job clicks powering real-time features"
      ),
      why: "The 'Who Viewed My Profile' feature requires real-time analytics on profile view events. Pinot is LinkedIn's OLAP database — built for exactly this use case with sub-second query latency.",
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "Data Warehouse (Pinot)",
        "store activity streams for real-time analytics — profile views, messages, job clicks powering 'Who Viewed My Profile'",
        "The 'Who Viewed My Profile' feature requires real-time analytics — Pinot handles this with sub-second queries.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "Kafka",
        "LinkedIn's Data Warehouse (Pinot) stores activity streams for analytics: who viewed your profile, who messaged you, which jobs you clicked. Real-time analytics power the 'Who Viewed My Profile' feature.",
        "Event Store"
      ),
      messages: [
        msg("Data Warehouse (Pinot) stores activity streams for real-time analytics: profile views, messages, job clicks."),
        msg(
          "The 'Who Viewed My Profile' feature requires real-time analytics on profile view events. Pinot is LinkedIn's OLAP database — built for exactly this use case with sub-second query latency."
        ),
        msg("Press ⌘K and search for \"Data Warehouse\" and press Enter to add it, then connect Kafka Streaming → Data Warehouse."),
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("kafka_streaming", "data_warehouse")],
      successMessage: "Data warehouse added. Now audit logging.",
      errorMessage: "Add a Data Warehouse connected from Kafka Streaming.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "LinkedIn's Event Store stores every audit event: profile edits, connection requests, InMail sends. Immutable audit logs are required for GDPR compliance and legal discovery.",
      action: buildAction(
        "Event Store",
        "Kafka",
        "Event Store",
        "immutable audit events being stored for GDPR compliance — profile edits, connection requests, InMail sends"
      ),
      why: "GDPR requires LinkedIn to delete user data on request — the Event Store enables compliance by providing a complete audit trail of every action taken on user data.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "Event Store",
        "store immutable audit events for GDPR compliance — profile edits, connection requests, InMail sends",
        "GDPR requires complete audit trails of user data actions — immutable event logs enable compliance.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "Kafka",
        "LinkedIn's Event Store stores every audit event: profile edits, connection requests, InMail sends. Immutable audit logs are required for GDPR compliance and legal discovery.",
        "BFF Gateway"
      ),
      messages: [
        msg("Event Store stores immutable audit events: profile edits, connection requests, InMail sends."),
        msg(
          "GDPR requires LinkedIn to delete user data on request — the Event Store provides a complete audit trail of every action taken on user data for legal discovery."
        ),
        msg("Press ⌘K and search for \"Event Store\" and press Enter to add it, then connect Kafka Streaming → Event Store."),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("kafka_streaming", "event_store")],
      successMessage: "Event store added. Now BFF for mobile.",
      errorMessage: "Add an Event Store connected from Kafka Streaming.",
    }),
    step({
      id: 11,
      title: "Add BFF Gateway",
      explanation:
        "LinkedIn's BFF Gateway serves the mobile app with optimized APIs. The BFF aggregates data from multiple GraphQL resolvers, handles pagination, and manages session state for mobile clients.",
      action: buildAction(
        "BFF Gateway",
        "GraphQL Federation",
        "BFF Gateway",
        "mobile-optimized APIs being aggregated from multiple GraphQL resolvers with pagination and session management"
      ),
      why: "Mobile clients have different requirements than web — smaller screens, offline support, battery constraints. The BFF adapts the GraphQL API for mobile-specific needs without changing the core API.",
      component: component("bff_gateway", "BFF Gateway"),
      openingMessage: buildOpeningL3(
        "LinkedIn",
        "BFF Gateway",
        "serve mobile app with optimized APIs — aggregating GraphQL resolvers, handling pagination, managing session state",
        "Mobile clients have different requirements — the BFF adapts the API without changing the core GraphQL schema.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "GraphQL Federation",
        "LinkedIn's BFF Gateway serves the mobile app with optimized APIs. The BFF aggregates data from multiple GraphQL resolvers, handles pagination, and manages session state for mobile clients.",
        "nothing — you have built LinkedIn Enterprise"
      ),
      messages: [
        msg("BFF Gateway serves the mobile app with optimized APIs."),
        msg(
          "The BFF aggregates data from multiple GraphQL resolvers, handles pagination for mobile screens, and manages session state. Mobile-specific logic lives here without polluting the core API."
        ),
        msg("Press ⌘K and search for \"BFF Gateway\" and press Enter to add it, then connect GraphQL Federation → BFF Gateway."),
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("graphql_federation", "bff_gateway")],
      successMessage: "BFF Gateway added. You have built LinkedIn Enterprise.",
      errorMessage: "Add a BFF Gateway connected from the GraphQL Federation.",
    }),
  ],
});

export const linkedinTutorial: Tutorial = tutorial({
  id: 'linkedin-architecture',
  title: 'How to Design LinkedIn Architecture',
  description:
    'Build a professional social network for 1 billion members. Learn social graph traversal, feed ranking, connection degrees, job matching, and real-time messaging at scale.',
  difficulty: 'Advanced',
  category: 'Social Network',
  isLive: false,
  icon: 'Linkedin',
  color: '#0a66c2',
  tags: ['Social Graph', 'Feed Ranking', 'Graph DB', 'Connections'],
  levels: [l1, l2, l3],
  estimatedTime: '~87 mins',
});
