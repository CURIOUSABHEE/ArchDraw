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
  title: 'Professional Social Network',
  subtitle: 'Build a professional social network in 11 steps',
  description:
    'Build a professional social network for 1 billion members. Learn social graph traversal, feed ranking, connection degrees, job matching, and real-time messaging at scale.',
  estimatedTime: '~30 mins',
  unlocks: undefined,
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
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
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
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
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
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
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
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
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
        msg('Press ⌘K, search for "Feed Ranker", add it, then connect Auth Service → Feed Ranker.'),
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
        msg('Press ⌘K, search for "Graph Database", add it, then connect Feed Ranker → Graph Database.'),
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
        msg('Press ⌘K, search for "Search Engine", add it, then connect Auth Service → Search Service.'),
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
        msg('Press ⌘K, search for "Timeline Service", add it, then connect Feed Ranker → Timeline Service.'),
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
        msg('Press ⌘K, search for "Message Queue", add it, then connect Timeline Service → Message Queue.'),
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
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Timeline Service → NoSQL Database.'),
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
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect Graph Database → In-Memory Cache.'),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('graph_database', 'in_memory_cache')],
      successMessage: 'Tutorial complete! You have built LinkedIn.',
      errorMessage: 'Add an In-Memory Cache and connect it from the Graph Database.',
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
  estimatedTime: '~30 mins',
  levels: [l1],
});
