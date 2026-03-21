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
  title: 'URL Shortener',
  subtitle: 'Build a URL shortener in 9 steps',
  description:
    'Build the classic system design interview question — a URL shortening service like Bitly. Learn hash generation, redirect logic, analytics, and the tradeoffs between consistent hashing and base-62 encoding.',
  estimatedTime: '~15 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build a URL shortener from scratch — the classic system design interview question. Services like Bitly and TinyURL handle billions of redirects daily. The challenge: converting long URLs into short, unique codes that redirect reliably at massive scale.",
  steps: [
    step({
      id: 1,
      title: 'Start with the Client',
      explanation:
        "The client is any web browser or mobile app. Users paste a long URL and get back a short code. The redirect itself is just an HTTP 301/302 — a standard browser behavior.",
      action: buildFirstStepAction('Web'),
      why: "Every system starts with the client. For a URL shortener, the client is simple — it only needs to accept a URL input and display the shortened result. All the complexity is on the server side.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'Web Client',
        'accept long URLs from users and display shortened codes, with redirect happening automatically in the browser',
        "When you visit a short URL, your browser follows a 301/302 redirect automatically. The user sees only the short URL, but the browser handles the redirect transparently.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "The client is intentionally simple — just a URL input form. All the interesting engineering happens on the server: hash generation, database lookups, and analytics tracking.",
        'API Gateway'
      ),
      messages: [
        msg("Welcome to the URL Shortener tutorial. This is the classic system design interview question — used by Google, Bitly, and TinyURL."),
        msg("The client is simple: a user pastes a long URL, gets back a short code. When someone visits the short URL, the browser automatically follows a 301/302 redirect to the original URL."),
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
        "All requests hit the API Gateway. Two main flows: POST /shorten (create short URL) and GET /{code} (redirect). The gateway routes each to the right handler.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'all requests being routed: POST for shortening, GET for redirects, with rate limiting on both'),
      why: "A URL shortener has two very different request types. The API Gateway routes each to the right handler and enforces rate limits to prevent abuse.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'API Gateway',
        'route two request types: POST /shorten for creation and GET /{code} for redirecting users',
        "The API Gateway handles both flows: creating short URLs (POST) and redirecting browsers (GET). It also enforces rate limits — a single bad actor could create millions of short URLs without limits.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "The API Gateway routes two request types: POST /shorten creates short URLs, GET /{code} redirects browsers. Both flows go through here. Rate limiting prevents abuse.",
        'Load Balancer'
      ),
      messages: [
        msg("The URL shortener has two main flows: creating a short URL (POST) and redirecting to the original (GET)."),
        msg("Both flows go through the API Gateway. It routes POST requests to the shortening handler and GET requests to the redirect handler. It also enforces rate limits — without them, a single user could create millions of short URLs."),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now distribute the traffic.',
      errorMessage: 'Add an API Gateway and connect Web → API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "At Bitly's scale, millions of redirects happen per minute. The Load Balancer distributes traffic across multiple application servers. Consistent hashing ensures that short code lookups stay cache-friendly.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'millions of daily requests being distributed across application servers with consistent hashing for cache affinity'),
      why: "URL shorteners are read-heavy — 95% of traffic is redirects, only 5% is URL creation. The load balancer enables horizontal scaling to handle redirect bursts.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'Load Balancer',
        'distribute millions of daily redirects across servers with consistent hashing for cache affinity',
        "URL shorteners are read-heavy: 95% of traffic is redirects, 5% is URL creation. Consistent hashing means a short code's redirect is always served by the same server cluster — keeping the cache hot.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "URL shorteners are read-heavy: 95% redirects, 5% creations. The Load Balancer enables horizontal scaling. Consistent hashing keeps redirect lookups cache-friendly.",
        'Cache'
      ),
      messages: [
        msg("URL shorteners are read-heavy: 95% of traffic is redirects, only 5% is URL creation."),
        msg("The Load Balancer distributes requests across application servers. Consistent hashing ensures that short code lookups are routed to the same server cluster — keeping the redirect cache hot and avoiding cache misses on every request."),
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added and connected. Now the cache layer.',
      errorMessage: 'Add a Load Balancer and connect API Gateway → Load Balancer.',
    }),
    step({
      id: 4,
      title: 'Add In-Memory Cache',
      explanation:
        "Before hitting the database, the redirect handler checks Redis. 95% of traffic is redirects — caching the code → URL mapping makes redirects sub-millisecond.",
      action: buildAction(
        'In-Memory Cache',
        'Load Balancer',
        'Cache',
        'code → URL redirect mappings being served from Redis in sub-millisecond time, avoiding database round trips for 95% of traffic'
      ),
      why: "A URL shortener is basically a key-value lookup: code → URL. With 95% reads, caching at the Redis layer makes the critical path (redirect) blazingly fast.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'In-Memory Cache',
        'serve redirect lookups from Redis in sub-millisecond time, avoiding the database for 95% of requests',
        "A URL shortener is a key-value store: short code maps to long URL. With 95% of traffic being redirects, caching the code → URL mapping in Redis makes redirects sub-millisecond. Only 5% of requests hit the database.",
        'Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'Load Balancer',
        "95% of URL shortener traffic is redirects. The Cache serves code → URL mappings in sub-millisecond time from Redis. Only 5% of requests (cache misses) hit the database.",
        'SQL Database'
      ),
      messages: [
        msg("95% of URL shortener traffic is redirects. Before hitting the database, check the cache."),
        msg("Redis stores the code → URL mapping. A redirect checks Redis first: 'code=abc123' → 'https://long-url...'. Sub-millisecond lookup. Only 5% of requests (cache misses) hit the database. This is what makes URL shorteners fast at scale."),
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect Load Balancer → Cache.'),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('load_balancer', 'in_memory_cache')],
      successMessage: 'Cache added and connected. Now the database layer.',
      errorMessage: 'Add an In-Memory Cache and connect Load Balancer → Cache.',
    }),
    step({
      id: 5,
      title: 'Add SQL Database',
      explanation:
        "The SQL Database stores the permanent mapping: short_code, original_url, created_at, click_count, creator_id. ACID guarantees ensure no duplicate short codes are issued.",
      action: buildAction(
        'SQL Database',
        'Load Balancer',
        'SQL Database',
        'permanent short_code → URL mappings being stored with ACID guarantees ensuring no duplicate short codes are ever issued'
      ),
      why: "The database is the source of truth. SQL's UNIQUE constraint on short_code prevents collisions. ACID transactions ensure that when you create a short URL, it's immediately queryable.",
      component: component('sql_db', 'SQL'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'SQL Database',
        'persist short_code → URL mappings with UNIQUE constraints preventing collisions and ACID guarantees for instant queryability',
        "The SQL Database is the source of truth. The UNIQUE constraint on short_code prevents collisions. When you create a short URL, it's immediately readable — no eventual consistency delays. This is critical for a service where correctness matters.",
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Load Balancer',
        "The SQL Database is the source of truth. UNIQUE constraint on short_code prevents collisions. ACID transactions ensure created URLs are immediately queryable — critical for correctness in a URL shortener.",
        'Analytics'
      ),
      messages: [
        msg("The database stores the permanent mapping: short code, original URL, creation timestamp, click count."),
        msg("SQL's UNIQUE constraint on short_code prevents collisions — two users can never get the same short code. ACID transactions ensure that when a short URL is created, it's immediately readable. No eventual consistency delays."),
        msg('Press ⌘K, search for "SQL Database", add it, then connect Load Balancer → SQL Database.'),
      ],
      requiredNodes: ['sql_db'],
      requiredEdges: [edge('load_balancer', 'sql_db')],
      successMessage: 'SQL Database added. Now analytics.',
      errorMessage: 'Add a SQL Database and connect Load Balancer → SQL Database.',
    }),
    step({
      id: 6,
      title: 'Add Analytics',
      explanation:
        "Every redirect increments a click counter. Analytics track total clicks, unique visitors, geographic distribution, and referrer data. This is why companies pay for URL shorteners.",
      action: buildAction(
        'In-Memory Cache',
        'SQL',
        'Analytics',
        'click events being tracked: total clicks, unique visitors, geographic distribution, referrer, and device type'
      ),
      why: "URL shorteners make money from analytics. Bitly charges for click reports, geographic data, and referrer tracking. The analytics layer is what turns a free utility into a paid product.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'Analytics',
        'track click events in real-time: total clicks, unique visitors, geographic distribution, and referrer data',
        "URL shorteners make money from analytics, not URL shortening. Bitly charges for click reports, geographic data, and referrer tracking. Every redirect is an analytics event — companies pay for these insights.",
        'Analytics'
      ),
      celebrationMessage: buildCelebration(
        'Analytics',
        'SQL Database',
        "URL shorteners make money from analytics, not URL shortening. Bitly charges for click reports and geographic data. Every redirect increments click_count and logs referrer, device, and location data. This is what turns a free utility into a paid product.",
        'Worker Job'
      ),
      messages: [
        msg("Every redirect is an analytics event. Total clicks, unique visitors, referrer, geographic distribution."),
        msg("URL shorteners make money from analytics, not URL shortening. Bitly charges for click reports and geographic data. When a short URL is visited, the click is logged: who clicked, when, from where, and what device. This data is what companies pay for."),
        msg('Press ⌘K, search for "In-Memory Cache", add it again for Analytics, then connect SQL Database → Analytics.'),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('sql_db', 'in_memory_cache')],
      successMessage: 'Analytics added. Now async aggregation.',
      errorMessage: 'Add an In-Memory Cache for Analytics and connect SQL Database → Analytics.',
    }),
    step({
      id: 7,
      title: 'Add Background Worker',
      explanation:
        "Click analytics are batched and aggregated by a background worker. Counting every click in real-time would overwhelm the database. The worker runs every minute and flushes in-memory counters to the database.",
      action: buildAction(
        'Worker',
        'Load Balancer',
        'Worker',
        'click counters being batched and flushed to the database every minute, preventing real-time writes from overwhelming the database'
      ),
      why: "At millions of clicks per minute, writing every analytics event to the database synchronously would saturate it. Batching via a worker is the standard pattern — write to Redis counters, flush to DB periodically.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'Worker',
        'batch analytics counters and flush them to the database every minute, preventing millions of writes per minute from overwhelming the DB',
        "At millions of clicks per minute, writing every analytics event to the database synchronously would saturate it. The Worker batches: increments Redis counters in real-time, flushes to the database every minute. This is the standard write-batching pattern.",
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Worker',
        'Load Balancer',
        "At millions of clicks per minute, the Worker batches analytics: real-time Redis counters are flushed to the database every minute. This prevents the database from being overwhelmed by write traffic. Batch processing is key to URL shortener scalability.",
        'Logger'
      ),
      messages: [
        msg("Click counters can't be written to the database in real-time at scale. Batch them with a Worker."),
        msg("The Worker flushes Redis click counters to the database every minute. In real-time, clicks increment an in-memory counter in Redis. Every 60 seconds, the Worker batches all those increments into the database. This is the standard write-batching pattern."),
        msg('Press ⌘K, search for "Worker / Background Job", add it, then connect Load Balancer → Worker.'),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('load_balancer', 'worker_job')],
      successMessage: 'Worker added. Now observability.',
      errorMessage: 'Add a Worker / Background Job and connect Load Balancer → Worker.',
    }),
    step({
      id: 8,
      title: 'Add Logger',
      explanation:
        "Every redirect, creation, and error is logged. Log data feeds into analytics, security auditing, and incident investigation. In production, logs go to a centralized logging system like Datadog or CloudWatch.",
      action: buildAction(
        'Logger',
        'Load Balancer',
        'Logger',
        'every URL creation, redirect, and error being captured with timestamps, IPs, and user agents for auditing and debugging'
      ),
      why: "Logging is the foundation of observability. When a redirect fails or a short code returns 404, logs tell you what happened. At scale, logs are sent to a centralized system like Datadog or CloudWatch.",
      component: component('logger', 'Logger'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'Logger',
        'capture every URL creation, redirect, and error with timestamps, IP addresses, and user agents for auditing',
        "When a redirect fails or a short code 404s, logs are the first place to look. At scale, logs feed into centralized logging (Datadog, CloudWatch) for real-time monitoring and post-incident analysis.",
        'Logger'
      ),
      celebrationMessage: buildCelebration(
        'Logger',
        'Load Balancer',
        "Every URL creation and redirect is logged with timestamp, IP, and user agent. Logs feed into centralized logging (Datadog, CloudWatch) for real-time monitoring. When a short URL returns 404, logs tell you exactly what happened. You have built a URL shortener.",
        'nothing — you have built a URL Shortener'
      ),
      messages: [
        msg("Final step — observability. Every URL creation, redirect, and error is logged."),
        msg("Logs capture: timestamp, short code, original URL, client IP, user agent, and response status. These logs feed into centralized logging (Datadog, CloudWatch) for real-time alerting and post-incident analysis. When a short URL returns 404, logs tell you what happened."),
        msg('Press ⌘K, search for "Logger", add it, then connect Load Balancer → Logger.'),
      ],
      requiredNodes: ['logger'],
      requiredEdges: [edge('load_balancer', 'logger')],
      successMessage: 'Logger added. You have built a URL Shortener.',
      errorMessage: 'Add a Logger and connect Load Balancer → Logger.',
    }),
    step({
      id: 9,
      title: 'Add a Second Web Client (QR Codes)',
      explanation:
        "Short URLs are often shared via QR codes. A second Web Client represents the mobile scanner — someone scanning a QR code that encodes the short URL. This completes the full flow: create, share, scan, redirect.",
      action: buildAction(
        'Client',
        'Web',
        'Mobile Client',
        'QR code scanning and mobile redirect being handled as a separate client path from the primary web client'
      ),
      why: "QR codes are a major use case for URL shorteners. Adding a mobile client shows that the same redirect flow works across web and mobile, completing the architectural picture.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'URL Shortener',
        'Mobile Scanner',
        'handle QR code scans as a separate client path, where the mobile camera reads the short URL and the same redirect logic applies',
        "QR codes are a major use case for URL shorteners — the short URL makes the QR code small and scannable. The mobile scanner follows the same redirect flow as the web client, hitting the API Gateway and load balancer identically.",
        'Client'
      ),
      celebrationMessage: buildCelebration(
        'Web and Mobile Clients',
        'API Gateway',
        "Both web and mobile clients use the same redirect flow: short URL → API Gateway → Load Balancer → Cache → Database → redirect. QR codes use the same infrastructure. You have built a URL shortener.",
        'nothing — you have built a URL Shortener'
      ),
      messages: [
        msg("Short URLs are often shared via QR codes. The mobile scanner follows the same redirect flow."),
        msg("QR code scanners (mobile apps) use the same redirect infrastructure: scan short URL → API Gateway → Load Balancer → Cache → Database → redirect. The short URL makes the QR code small and scannable — this is a major use case for URL shorteners."),
        msg('Press ⌘K, search for "Web", add a second client to represent the mobile scanner.'),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Mobile client added. You have built a complete URL Shortener.',
      errorMessage: 'Add a second Web Client to represent the mobile scanner.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "URL Shortener at Scale",
  subtitle: "Handle billions of redirects with analytics streaming and caching",
  description:
    "Add Kafka event streaming, Redis caching for viral links, CDC pipelines, and SLO tracking. Handle billions of redirects with sub-10ms latency and real-time analytics dashboards.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale the URL Shortener. Billions of redirects, viral link stampedes, and real-time analytics. This requires Kafka for click streaming, Redis for hot link caching, and SLO-grade observability.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "URL Shortener's Event Bus streams click events and analytics data. Every redirect generates a click event that streams to the analytics pipeline — millions of clicks per second during viral campaigns.",
      action: buildAction(
        "Kafka / Streaming",
        "Load Balancer",
        "Kafka Streaming",
        "click events and analytics data being streamed to the analytics pipeline — millions of clicks per second during viral campaigns"
      ),
      why: "Without Kafka, computing trending analytics would require synchronous database queries that slow down every redirect. Kafka decouples event producers from consumers — the redirect path stays fast regardless of how many downstream systems consume events.",
      component: component("kafka_streaming", "Kafka / Streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "URL Shortener",
        "Kafka Streaming",
        "stream click events and analytics data — millions of clicks per second during viral campaigns",
        "Every redirect generates a click event that streams to the analytics pipeline.",
        "Kafka Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "Load Balancer",
        "URL Shortener's Event Bus streams click events. Every redirect generates a click event — millions per second during viral campaigns.",
        "Notification Worker"
      ),
      messages: [
        msg("Level 2 — URL Shortener at Scale. Let's stream click events and add real-time analytics."),
        msg("Every redirect generates a click event that streams to Kafka — millions of clicks per second during viral campaigns. Analytics consumers compute real-time dashboards."),
        msg('Press ⌘K, search for "Kafka / Streaming", add it, then connect Load Balancer → Kafka Streaming.'),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("load_balancer", "kafka_streaming")],
      successMessage: "Events streaming. Now notifications.",
      errorMessage: "Add Kafka Streaming connected from the Load Balancer.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "URL Shortener's Notification Worker handles alert delivery for link performance thresholds. When a link exceeds its click limit or expires, notifications are sent to the link owner.",
      action: buildAction(
        "Worker",
        "Kafka",
        "Notification Worker",
        "alert delivery for link performance thresholds — notifying owners when links exceed click limits or expire"
      ),
      why: "Notification batching prevents notification storms. When a link goes viral and exceeds its click limit, the Notification Worker sends alerts in waves to avoid overwhelming users' devices.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "URL Shortener",
        "Notification Worker",
        "deliver alerts when links exceed click limits or expire",
        "When a link exceeds its click limit or expires, notifications are sent to the link owner.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "URL Shortener's Notification Worker handles alert delivery for link performance thresholds. When a link exceeds its click limit or expires, notifications are sent to the link owner.",
        "In-Memory Cache"
      ),
      messages: [
        msg("Notification workers consume Kafka events to send alerts — link click limits, expiration warnings."),
        msg("When a link exceeds its click limit or expires, the Notification Worker sends alerts to the link owner."),
        msg('Press ⌘K, search for "Worker / Background Job", add it, then connect Kafka Streaming → Notification Worker.'),
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
        "URL Shortener's Redis Cache stores popular short link mappings with TTLs. Viral links are cached at the edge — serving redirects from cache instead of the database handles millions of requests per second.",
      action: buildAction(
        "In-Memory Cache",
        "Load Balancer",
        "Redis Cache",
        "popular short link mappings being cached with TTLs — viral links served from cache instead of the database"
      ),
      why: "Viral links can generate millions of redirects per second. Caching at the Redis layer serves viral links from memory instead of hitting the database — this is what makes URL shorteners fast during traffic spikes.",
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "URL Shortener",
        "Redis Cache",
        "cache popular short link mappings with TTLs — serving millions of requests per second from cache",
        "Viral links are cached at the edge — serving from cache instead of the database handles millions of requests.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "Load Balancer",
        "URL Shortener's Redis Cache stores popular short link mappings with TTLs. Viral links are served from cache — millions of requests per second without database load.",
        "CDC Connector"
      ),
      messages: [
        msg("Redis Cache stores popular short link mappings with TTLs for viral links."),
        msg("Viral links are cached at the edge — serving redirects from cache instead of the database handles millions of requests per second."),
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect Load Balancer → Redis Cache.'),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("load_balancer", "in_memory_cache")],
      successMessage: "Cache added. Now CDC pipeline.",
      errorMessage: "Add an In-Memory Cache connected from the Load Balancer.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "URL Shortener's CDC Connector mirrors analytics data to the data warehouse. Click counts, geographic distribution, and referrer data stream to ClickHouse for real-time dashboards.",
      action: buildAction(
        "CDC Connector",
        "SQL Database",
        "CDC Connector",
        "analytics data being mirrored to the data warehouse — click counts, geographic distribution, and referrer data"
      ),
      why: "CDC pipelines stream analytics data to ClickHouse without impacting the operational database. The CDC Connector captures changes in real-time — enabling real-time dashboards without adding load to the production database.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "URL Shortener",
        "CDC Connector",
        "mirror analytics data to the data warehouse for real-time dashboards",
        "Click counts and geographic data stream to ClickHouse for real-time dashboards.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "SQL Database",
        "URL Shortener's CDC Connector mirrors analytics data to the data warehouse. Click counts, geographic distribution, and referrer data stream to ClickHouse for real-time dashboards.",
        "SQL Database"
      ),
      messages: [
        msg("CDC Connector mirrors analytics data to the data warehouse for real-time dashboards."),
        msg("Click counts, geographic distribution, and referrer data stream to ClickHouse."),
        msg('Press ⌘K, search for "CDC Connector", add it, then connect SQL Database → CDC Connector.'),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("sql_db", "cdc_connector")],
      successMessage: "CDC added. Now the database layer.",
      errorMessage: "Add a CDC Connector connected from the SQL Database.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "URL Shortener's PostgreSQL stores link metadata: original URL, creation date, click count, owner. PostgreSQL handles the relational data efficiently with indexing on short codes.",
      action: buildAction(
        "SQL Database",
        "Load Balancer",
        "SQL Database",
        "link metadata being stored: original URL, creation date, click count, owner with indexing on short codes"
      ),
      why: "PostgreSQL is the source of truth for link metadata with ACID guarantees. The UNIQUE constraint on short_code prevents collisions. When you create a short URL, it's immediately queryable — critical for a service where correctness matters.",
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "URL Shortener",
        "SQL Database",
        "store link metadata with indexing on short codes for efficient lookups",
        "PostgreSQL handles the relational data efficiently with indexing on short codes.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "Load Balancer",
        "URL Shortener's PostgreSQL stores link metadata: original URL, creation date, click count, owner. PostgreSQL handles the relational data efficiently with indexing on short codes.",
        "Structured Logger"
      ),
      messages: [
        msg("PostgreSQL stores link metadata with indexing on short codes for efficient lookups."),
        msg("Original URL, creation date, click count, and owner are stored with indexing for fast lookups."),
        msg('Press ⌘K, search for "SQL Database", add it, then connect Load Balancer → SQL Database.'),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("load_balancer", "sql_db")],
      successMessage: "Database added. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the Load Balancer.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "URL Shortener's Structured Logger captures redirect latency, cache hit rates, and error rates. Performance logs track p99 latency — redirect must complete in <10ms.",
      action: buildAction(
        "Structured Logger",
        "Load Balancer",
        "Structured Logger",
        "redirect latency, cache hit rates, and error rates being captured with p99 latency tracking"
      ),
      why: "Structured JSON logs enable fast LogQL aggregation across billions of entries. When debugging a redirect failure, structured logs let you query by short code, cache hit rate, and latency percentile — essential for p99 latency tracking.",
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "URL Shortener",
        "Structured Logger",
        "capture redirect latency, cache hit rates, and error rates with p99 latency tracking",
        "Performance logs track p99 latency — redirect must complete in <10ms.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "Load Balancer",
        "URL Shortener's Structured Logger captures redirect latency, cache hit rates, and error rates. Performance logs track p99 latency — redirect must complete in <10ms.",
        "SLO Tracker"
      ),
      messages: [
        msg("Structured Logger captures redirect latency, cache hit rates, and error rates."),
        msg("Performance logs track p99 latency — redirect must complete in <10ms."),
        msg('Press ⌘K, search for "Structured Logger", add it, then connect Load Balancer → Structured Logger.'),
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
        "URL Shortener's SLO Tracker monitors redirect latency, availability, and cache hit rate. Redirect latency must stay under 10ms — tracked as a critical SLO for millions of daily redirects.",
      action: buildAction(
        "SLO/SLI Tracker",
        "Metrics Collector",
        "SLO Tracker",
        "redirect latency, availability, and cache hit rate being monitored against SLO targets"
      ),
      why: "Redirect latency is a critical SLO — users expect instant redirects. The SLO Tracker defines the target (p99 < 10ms) and alerts when the error budget burns. Without SLOs, engineering teams argue about what 'acceptable' means.",
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "URL Shortener",
        "SLO Tracker",
        "monitor redirect latency, availability, and cache hit rate against SLO targets",
        "Redirect latency must stay under 10ms — tracked as a critical SLO for millions of daily redirects.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO Tracker",
        "Metrics Collector",
        "URL Shortener's SLO Tracker monitors redirect latency, availability, and cache hit rate. Redirect latency must stay under 10ms — tracked as a critical SLO for millions of daily redirects.",
        "Error Budget Monitor"
      ),
      messages: [
        msg("SLO Tracker monitors redirect latency, availability, and cache hit rate against SLO targets."),
        msg("Redirect latency must stay under 10ms — tracked as a critical SLO for millions of daily redirects."),
        msg('Press ⌘K, search for "SLO/SLI Tracker", add it, then connect Metrics Collector → SLO Tracker.'),
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
        "URL Shortener's Error Budget Monitor tracks redirect SLO consumption. During DDoS attacks, the error budget is consumed rapidly — the system auto-scales before the budget is depleted.",
      action: buildAction(
        "Error Budget Monitor",
        "SLO/SLI Tracker",
        "Error Budget Monitor",
        "redirect SLO consumption being tracked — auto-scaling before error budget is depleted during DDoS"
      ),
      why: "The error budget is the reliability buffer — the difference between the SLO target and 100%. During DDoS attacks, the budget is consumed rapidly. When it's depleted, feature launches pause until reliability improves.",
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "URL Shortener",
        "Error Budget Monitor",
        "track redirect SLO consumption — auto-scale before error budget is depleted during DDoS",
        "During DDoS attacks, the error budget is consumed rapidly — the system auto-scales before the budget is depleted.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Monitor",
        "SLO/SLI Tracker",
        "URL Shortener's Error Budget Monitor tracks redirect SLO consumption. During DDoS attacks, the error budget is consumed rapidly — the system auto-scales before the budget is depleted.",
        "Level 3"
      ),
      messages: [
        msg("Error Budget Monitor tracks redirect SLO consumption during DDoS attacks."),
        msg("The system auto-scales before the error budget is depleted during DDoS attacks."),
        msg('Press ⌘K, search for "Error Budget Monitor", add it, then connect SLO Tracker → Error Budget Monitor.'),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget monitoring added. URL Shortener is now production-ready.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO Tracker.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "URL Shortener Enterprise",
  subtitle: "Add zero-trust networking, distributed caching, and petabyte-scale analytics",
  description:
    "Implement zero-trust networking, consistent hashing for horizontal scaling, and petabyte-scale click analytics. URL Shortener Enterprise serves marketing teams with compliance and analytics requirements.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make the URL Shortener enterprise-grade. Zero-trust networking, consistent hash sharding for scale, and petabyte-scale analytics. URL Shortener Enterprise serves marketing teams with compliance requirements and campaign-scale analytics.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "URL Shortener's Service Mesh (Envoy) handles mTLS between redirect services, analytics workers, and API servers. Even a simple URL shortener benefits from zero-trust networking at scale.",
      action: buildAction(
        "Service Mesh",
        "Load Balancer",
        "Service Mesh",
        "mTLS between redirect services, analytics workers, and API servers with zero-trust networking"
      ),
      why: "Without a service mesh, each service implements TLS, circuit breaking, and retries differently — inconsistent and hard to maintain. Envoy handles this transparently at the infrastructure layer with automatic mTLS.",
      component: component("service_mesh", "Service Mesh"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "Service Mesh",
        "handle mTLS between all services with zero-trust networking",
        "Even a simple URL shortener benefits from zero-trust networking at scale.",
        "Service Mesh"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "Load Balancer",
        "URL Shortener's Service Mesh (Envoy) handles mTLS between redirect services, analytics workers, and API servers. Even a simple URL shortener benefits from zero-trust networking at scale.",
        "Consistent Hash Ring"
      ),
      messages: [
        msg("Level 3 — URL Shortener Enterprise. Service Mesh adds zero-trust networking with mTLS."),
        msg("Every service-to-service call is encrypted with mTLS — redirect services, analytics workers, and API servers all communicate securely."),
        msg('Press ⌘K, search for "Service Mesh", add it, then connect Load Balancer → Service Mesh.'),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("load_balancer", "service_mesh")],
      successMessage: "Service mesh added. Now consistent hashing.",
      errorMessage: "Add a Service Mesh connected from the Load Balancer.",
    }),
    step({
      id: 2,
      title: "Add Consistent Hash Ring",
      explanation:
        "URL Shortener's Consistent Hash Ring distributes short code mappings across database shards. Consistent hashing ensures minimal remapping when shards are added — critical for hot viral links.",
      action: buildAction(
        "Consistent Hash Ring",
        "Load Balancer",
        "Consistent Hash Ring",
        "short code mappings being distributed across database shards with minimal remapping when shards are added"
      ),
      why: "Without consistent hashing, adding a new database shard would require remapping all short code mappings — causing a massive cache invalidation storm. Consistent hashing ensures minimal remapping — critical for hot viral links during scale events.",
      component: component("consistent_hash_ring", "Consistent Hash Ring"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "Consistent Hash Ring",
        "distribute short code mappings across shards with minimal remapping when shards are added",
        "Consistent hashing ensures minimal remapping when shards are added — critical for hot viral links.",
        "Consistent Hash Ring"
      ),
      celebrationMessage: buildCelebration(
        "Consistent Hash Ring",
        "Load Balancer",
        "URL Shortener's Consistent Hash Ring distributes short code mappings across database shards. Consistent hashing ensures minimal remapping when shards are added — critical for hot viral links.",
        "Token Bucket Rate Limiter"
      ),
      messages: [
        msg("Consistent Hash Ring distributes short code mappings across database shards."),
        msg("Consistent hashing ensures minimal remapping when shards are added — critical for hot viral links."),
        msg('Press ⌘K, search for "Consistent Hash Ring", add it, then connect Load Balancer → Consistent Hash Ring.'),
      ],
      requiredNodes: ["consistent_hash_ring"],
      requiredEdges: [edge("load_balancer", "consistent_hash_ring")],
      successMessage: "Consistent hashing added. Now rate limiting.",
      errorMessage: "Add a Consistent Hash Ring connected from the Load Balancer.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "URL Shortener's Rate Limiter uses token buckets per API key: free tier (100 req/min), pro tier (1000 req/min), enterprise (unlimited). Token buckets prevent abuse while allowing legitimate burst traffic.",
      action: buildAction(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "Token Bucket Rate Limiter",
        "per-API-key rate limiting with free tier (100 req/min), pro tier (1000 req/min), and enterprise (unlimited)"
      ),
      why: "Token buckets allow burst traffic while enforcing average rate limits. A user can burst to 1000 requests, then slow down — this is more user-friendly than a hard rate limit that cuts off mid-session.",
      component: component("token_bucket_limiter", "Token Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "Token Bucket Rate Limiter",
        "per-API-key rate limiting with free tier (100 req/min), pro tier (1000 req/min), enterprise (unlimited)",
        "Token buckets prevent abuse while allowing legitimate burst traffic.",
        "Token Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "URL Shortener's Rate Limiter uses token buckets per API key: free tier (100 req/min), pro tier (1000 req/min), enterprise (unlimited). Token buckets prevent abuse while allowing legitimate burst traffic.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg("Token Bucket Rate Limiter uses token buckets per API key for tiered rate limiting."),
        msg("Free tier (100 req/min), pro tier (1000 req/min), enterprise (unlimited). Token buckets prevent abuse while allowing legitimate burst traffic."),
        msg('Press ⌘K, search for "Token Bucket Rate Limiter", add it, then connect API Gateway → Token Bucket Rate Limiter.'),
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
        "URL Shortener's OTel Collector traces redirect requests through cache lookup, database query, and CDN invalidation. Even simple redirects touch multiple systems at scale.",
      action: buildAction(
        "OpenTelemetry Collector",
        "Service Mesh",
        "OTel Collector",
        "redirect requests being traced through cache lookup, database query, and CDN invalidation"
      ),
      why: "OTel Collector provides vendor-neutral distributed tracing. Even simple redirects touch multiple systems — cache, database, CDN — at scale. Without tracing, debugging a slow redirect requires guesswork across all these systems.",
      component: component("otel_collector", "OpenTelemetry Collector"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "OpenTelemetry Collector",
        "trace redirect requests through cache lookup, database query, and CDN invalidation",
        "Even simple redirects touch multiple systems at scale.",
        "OpenTelemetry Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "Service Mesh",
        "URL Shortener's OTel Collector traces redirect requests through cache lookup, database query, and CDN invalidation. Even simple redirects touch multiple systems at scale.",
        "Correlation ID Handler"
      ),
      messages: [
        msg("OpenTelemetry Collector traces redirect requests through cache lookup, database query, and CDN invalidation."),
        msg("Even simple redirects touch multiple systems at scale — tracing is essential for debugging."),
        msg('Press ⌘K, search for "OpenTelemetry Collector", add it, then connect Service Mesh → OTel Collector.'),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("service_mesh", "otel_collector")],
      successMessage: "Distributed tracing added. Now correlation IDs.",
      errorMessage: "Add an OpenTelemetry Collector connected from the Service Mesh.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "URL Shortener's Correlation ID links a click event to the redirect, analytics write, and notification delivery. Debugging a lost click requires tracing across the analytics pipeline.",
      action: buildAction(
        "Correlation ID Handler",
        "Kafka",
        "Correlation ID Handler",
        "click events being linked to redirects, analytics writes, and notification delivery across the pipeline"
      ),
      why: "Correlation IDs enable end-to-end tracing across the analytics pipeline. A lost click requires tracing from redirect to analytics write to notification delivery — without correlation IDs, this is impossible.",
      component: component("correlation_id_handler", "Correlation ID Handler"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "Correlation ID Handler",
        "link click events to redirects, analytics writes, and notification delivery across the pipeline",
        "Debugging a lost click requires tracing across the analytics pipeline.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "Kafka Streaming",
        "URL Shortener's Correlation ID links a click event to the redirect, analytics write, and notification delivery. Debugging a lost click requires tracing across the analytics pipeline.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg("Correlation ID links click events to redirects, analytics writes, and notification delivery."),
        msg("Debugging a lost click requires tracing across the analytics pipeline — correlation IDs enable end-to-end visibility."),
        msg('Press ⌘K, search for "Correlation ID Handler", add it, then connect Kafka Streaming → Correlation ID Handler.'),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("kafka_streaming", "correlation_id_handler")],
      successMessage: "Correlation IDs added. Now certificate authority.",
      errorMessage: "Add a Correlation ID Handler connected from Kafka Streaming.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "URL Shortener's SPIFFE CA issues certificates to every service in the redirect pipeline. Automated certificate rotation ensures zero-trust without manual certificate management.",
      action: buildAction(
        "mTLS Certificate Authority",
        "Service Mesh",
        "SPIFFE CA",
        "certificates being issued to every service with automated rotation for zero-trust without manual management"
      ),
      why: "SPIFFE automates certificate issuance and rotation across all services. Without SPIFFE, certificate rotation requires manual updates on every service — a security risk when certificates expire and services go down.",
      component: component("mtls_certificate_authority", "mTLS Certificate Authority"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "SPIFFE CA",
        "issue certificates to every service with automated rotation for zero-trust without manual management",
        "Automated certificate rotation ensures zero-trust without manual certificate management.",
        "mTLS Certificate Authority"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "URL Shortener's SPIFFE CA issues certificates to every service in the redirect pipeline. Automated certificate rotation ensures zero-trust without manual certificate management.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg("SPIFFE CA issues certificates to every service in the redirect pipeline."),
        msg("Automated certificate rotation ensures zero-trust without manual certificate management."),
        msg('Press ⌘K, search for "mTLS Certificate Authority", add it, then connect Service Mesh → SPIFFE CA.'),
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "Certificate authority added. Now cache stampede prevention.",
      errorMessage: "Add an mTLS Certificate Authority connected from the Service Mesh.",
    }),
    step({
      id: 7,
      title: "Add Cache Stampede Guard",
      explanation:
        "URL Shortener's Cache Stampede Guard prevents thundering herds when a viral link's cache expires. Lock-assisted refresh ensures only one worker refreshes the cache — others serve stale data.",
      action: buildAction(
        "Cache Stampede Guard",
        "Redis Cache",
        "Cache Stampede Guard",
        "thundering herd prevention with lock-assisted refresh ensuring only one worker refreshes the cache"
      ),
      why: "Without cache stampede protection, when a viral link's cache expires, millions of requests simultaneously hit the database — a thundering herd. Lock-assisted refresh ensures only one worker refreshes while others serve stale data.",
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "Cache Stampede Guard",
        "prevent thundering herds with lock-assisted refresh — only one worker refreshes while others serve stale data",
        "Lock-assisted refresh ensures only one worker refreshes the cache — others serve stale data.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "Redis Cache",
        "URL Shortener's Cache Stampede Guard prevents thundering herds when a viral link's cache expires. Lock-assisted refresh ensures only one worker refreshes the cache — others serve stale data.",
        "Change Data Cache"
      ),
      messages: [
        msg("Cache Stampede Guard prevents thundering herds when a viral link's cache expires."),
        msg("Lock-assisted refresh ensures only one worker refreshes the cache — others serve stale data to prevent database overload."),
        msg('Press ⌘K, search for "Cache Stampede Guard", add it, then connect Redis Cache → Cache Stampede Guard.'),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache stampede prevention added. Now CDC cache.",
      errorMessage: "Add a Cache Stampede Guard connected from the Redis Cache.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "URL Shortener's CDC pipeline precomputes analytics aggregations: top links, geographic heat maps, referrer distributions. These are materialized in Redis for instant dashboard queries.",
      action: buildAction(
        "Change Data Cache",
        "CDC Connector",
        "CDC Cache",
        "analytics aggregations being precomputed: top links, geographic heat maps, referrer distributions materialized in Redis"
      ),
      why: "Precomputing analytics aggregations in Redis enables instant dashboard queries. Without this, dashboards would need to scan petabytes of click data on every refresh — unacceptable for marketing teams checking campaign performance.",
      component: component("change_data_cache", "Change Data Cache"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "CDC Cache",
        "precompute analytics aggregations materialized in Redis for instant dashboard queries",
        "Top links, geographic heat maps, and referrer distributions are materialized in Redis for instant dashboard queries.",
        "Change Data Cache"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "CDC Connector",
        "URL Shortener's CDC pipeline precomputes analytics aggregations: top links, geographic heat maps, referrer distributions. These are materialized in Redis for instant dashboard queries.",
        "Data Warehouse"
      ),
      messages: [
        msg("CDC pipeline precomputes analytics aggregations: top links, geographic heat maps, referrer distributions."),
        msg("These are materialized in Redis for instant dashboard queries."),
        msg('Press ⌘K, search for "Change Data Cache", add it, then connect CDC Connector → CDC Cache.'),
      ],
      requiredNodes: ["change_data_cache"],
      requiredEdges: [edge("cdc_connector", "change_data_cache")],
      successMessage: "CDC cache added. Now data warehouse.",
      errorMessage: "Add a Change Data Cache connected from the CDC Connector.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "URL Shortener's Data Warehouse (ClickHouse) stores click analytics at scale. Petabyte-scale click data enables A/B testing of redirect strategies and campaign performance analysis.",
      action: buildAction(
        "Data Warehouse",
        "CDC Connector",
        "Data Warehouse",
        "petabyte-scale click analytics being stored for A/B testing and campaign performance analysis"
      ),
      why: "ClickHouse stores petabyte-scale click data at a fraction of the cost of traditional data warehouses. A/B testing redirect strategies and campaign performance analysis require scanning billions of rows — ClickHouse handles this at interactive query speeds.",
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "Data Warehouse",
        "store petabyte-scale click analytics for A/B testing and campaign performance analysis",
        "Petabyte-scale click data enables A/B testing of redirect strategies and campaign performance analysis.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "CDC Connector",
        "URL Shortener's Data Warehouse (ClickHouse) stores click analytics at scale. Petabyte-scale click data enables A/B testing of redirect strategies and campaign performance analysis.",
        "Event Store"
      ),
      messages: [
        msg("Data Warehouse stores petabyte-scale click analytics for A/B testing and campaign performance analysis."),
        msg("Petabyte-scale click data enables A/B testing of redirect strategies and campaign performance analysis."),
        msg('Press ⌘K, search for "Data Warehouse", add it, then connect CDC Connector → Data Warehouse.'),
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("cdc_connector", "data_warehouse")],
      successMessage: "Data warehouse added. Now event store.",
      errorMessage: "Add a Data Warehouse connected from the CDC Connector.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "URL Shortener's Event Store stores every link creation and modification event. Immutable audit logs enable compliance with data retention policies and support legal discovery requests.",
      action: buildAction(
        "Event Store",
        "Load Balancer",
        "Event Store",
        "link creation and modification events being stored with immutable audit logs for compliance"
      ),
      why: "Event stores provide immutable audit logs for compliance with data retention policies. When legal discovery requests come in, you need to prove what links existed, who created them, and when they were modified.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "Event Store",
        "store link creation and modification events with immutable audit logs for compliance",
        "Immutable audit logs enable compliance with data retention policies and support legal discovery requests.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "Load Balancer",
        "URL Shortener's Event Store stores every link creation and modification event. Immutable audit logs enable compliance with data retention policies and support legal discovery requests.",
        "Leaky Bucket Rate Limiter"
      ),
      messages: [
        msg("Event Store stores every link creation and modification event."),
        msg("Immutable audit logs enable compliance with data retention policies and support legal discovery requests."),
        msg('Press ⌘K, search for "Event Store", add it, then connect Load Balancer → Event Store.'),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("load_balancer", "event_store")],
      successMessage: "Event store added. Now leaky bucket rate limiting.",
      errorMessage: "Add an Event Store connected from the Load Balancer.",
    }),
    step({
      id: 11,
      title: "Add Leaky Bucket Rate Limiter",
      explanation:
        "URL Shortener's Leaky Bucket Rate Limiter smooths analytics API burst queries. Dashboard queries are rate-limited to prevent analytics workloads from impacting redirect latency.",
      action: buildAction(
        "Leaky Bucket Rate Limiter",
        "CDC Cache",
        "Leaky Bucket Rate Limiter",
        "analytics API burst queries being smoothed to prevent analytics workloads from impacting redirect latency"
      ),
      why: "Leaky buckets smooth burst queries by processing them at a constant rate. Marketing dashboards can burst to thousands of queries, but they're processed gradually — preventing analytics workloads from impacting the redirect latency SLA.",
      component: component("leaky_bucket_limiter", "Leaky Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "URL Shortener",
        "Leaky Bucket Rate Limiter",
        "smooth analytics API burst queries to prevent analytics workloads from impacting redirect latency",
        "Dashboard queries are rate-limited to prevent analytics workloads from impacting redirect latency.",
        "Leaky Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Leaky Bucket Rate Limiter",
        "CDC Cache",
        "URL Shortener's Leaky Bucket Rate Limiter smooths analytics API burst queries. Dashboard queries are rate-limited to prevent analytics workloads from impacting redirect latency.",
        "nothing — you have built URL Shortener Enterprise"
      ),
      messages: [
        msg("Leaky Bucket Rate Limiter smooths analytics API burst queries."),
        msg("Dashboard queries are rate-limited to prevent analytics workloads from impacting redirect latency."),
        msg('Press ⌘K, search for "Leaky Bucket Rate Limiter", add it, then connect CDC Cache → Leaky Bucket Rate Limiter.'),
      ],
      requiredNodes: ["leaky_bucket_limiter"],
      requiredEdges: [edge("change_data_cache", "leaky_bucket_limiter")],
      successMessage: "Leaky bucket rate limiting added. You have built URL Shortener Enterprise.",
      errorMessage: "Add a Leaky Bucket Rate Limiter connected from the CDC Cache.",
    }),
  ],
});

export const urlShortenerTutorial: Tutorial = tutorial({
  id: 'url-shortener-architecture',
  title: 'How to Design a URL Shortener',
  description:
    'Build the classic system design interview question — a URL shortening service. Learn hash generation, redirect logic, analytics, and the tradeoffs between caching and database writes.',
  difficulty: 'Beginner',
  category: 'Interview Prep',
  isLive: false,
  icon: 'Link',
  color: '#6366f1',
  tags: ['Hashing', 'Redirect', 'Analytics', 'Cache'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
