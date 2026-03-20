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

export const urlShortenerTutorial: Tutorial = tutorial({
  id: 'url-shortener',
  title: 'How to Design a URL Shortener',
  description:
    'Build the classic system design interview question — a URL shortening service. Learn hash generation, redirect logic, analytics, and the tradeoffs between caching and database writes.',
  difficulty: 'Beginner',
  category: 'Interview Prep',
  isLive: false,
  icon: 'Link',
  color: '#6366f1',
  tags: ['Hashing', 'Redirect', 'Analytics', 'Cache'],
  estimatedTime: '~15 mins',
  levels: [l1],
});
