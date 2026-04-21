export interface EdgeTooltipData {
  protocol: string;
  description: string;
  whyThisProtocol: string;
  realWorldFact: string;
  alternative: string;
  alternativeWhy: string;
}

export const EDGE_TOOLTIPS: Record<string, EdgeTooltipData> = {
  'REST': {
    protocol: 'REST API',
    description: "HTTP-based request-response pattern using standard HTTP methods and JSON body.",
    whyThisProtocol: "Ubiquitous, well-understood, firewall-friendly, and stateless — ideal for client-server communication.",
    realWorldFact: "Amazon's internal APIs use REST with API Gateway handling over 1 trillion calls per month.",
    alternative: 'gRPC',
    alternativeWhy: "gRPC offers better performance for service-service communication but requires HTTP/2 and Protocol Buffers knowledge."
  },
  'gRPC': {
    protocol: 'gRPC / Protocol Buffers',
    description: "HTTP/2-based binary serialization using Protocol Buffers for compact, typed communication.",
    whyThisProtocol: "Smaller payloads (5-10x), faster serialization, and streaming support — ideal for service-service communication.",
    realWorldFact: "Google uses gRPC internally for all service communication — billions of RPCs per second across their infrastructure.",
    alternative: 'REST',
    alternativeWhy: "REST is simpler for external APIs and has broader tool support."
  },
  'WebSocket': {
    protocol: 'WebSocket',
    description: "Persistent bidirectional connection — server can push to client without polling.",
    whyThisProtocol: "Enables real-time features: chat, live updates, notifications — without polling overhead.",
    realWorldFact: "Discord maintains 1M+ concurrent WebSocket connections for real-time voice and chat state in a single shard.",
    alternative: 'Long Polling',
    alternativeWhy: "Long polling was used before WebSocket. It works but wastes connections and adds latency."
  },
  'Pub/Sub': {
    protocol: 'Pub/Sub / Message Queue',
    description: "Asynchronous message passing through a message broker — Kafka, RabbitMQ, SQS.",
    whyThisProtocol: "Decouples producers from consumers, provides durability, and enables independent scaling.",
    realWorldFact: "LinkedIn processes 7 trillion messages per day through Kafka across their event streaming backbone.",
    alternative: 'Direct HTTP',
    alternativeWhy: "Direct HTTP is simpler but creates tight coupling — if a consumer is down, messages are lost."
  },
  'GraphQL': {
    protocol: 'GraphQL',
    description: "Single endpoint with client-specified query — returns exactly the data requested, nothing more.",
    whyThisProtocol: "Prevents over-fetching and under-fetching. Mobile apps benefit from reduced payload sizes.",
    realWorldFact: "Apollo GraphQL powers GraphQL at Netflix and Airbnb, reducing mobile data usage by 40%+.",
    alternative: 'REST',
    alternativeWhy: "REST returns fixed response structure — client gets everything whether needed or not."
  },
  'GraphQL Federation': {
    protocol: 'GraphQL Federation',
    description: "Single GraphQL API that composes schemas from multiple underlying services.",
    whyThisProtocol: "Product teams move fast without coordinating API changes. Single query surface.",
    realWorldFact: "Apollo Federation is used by Netflix, Airbnb, and Coursera for unified API surfaces.",
    alternative: 'BFF Pattern',
    alternativeWhy: "BFF has per-client code duplication. Federation is centralized but more complex."
  },
  'mTLS': {
    protocol: 'mTLS (Mutual TLS)',
    description: "Bidirectional TLS — both client and server authenticate each other with certificates.",
    whyThisProtocol: "Strongest service-to-service authentication. No API keys or tokens to leak or rotate.",
    realWorldFact: "Service meshes like Linkerd and Istio use mTLS for all service communication automatically.",
    alternative: 'API Keys',
    alternativeWhy: "API keys are simpler but can be leaked. mTLS requires infrastructure but is more secure."
  },
  'CDC': {
    protocol: 'Change Data Capture (CDC)',
    description: "Database transaction log streaming — captures INSERT, UPDATE, DELETE as events.",
    whyThisProtocol: "Enables real-time data sync without polling or application code changes.",
    realWorldFact: "Debezium streams database changes to Kafka for 1,000+ companies — enables real-time ETL.",
    alternative: 'Polling',
    alternativeWhy: "Polling is simpler but adds database load and has latency. CDC has zero load but adds complexity."
  },
  'SQL': {
    protocol: 'SQL / JDBC',
    description: "Direct database connection using SQL queries over JDBC/ODBC.",
    whyThisProtocol: "ACID guarantees, complex joins, and strict schema — essential for transactional data.",
    realWorldFact: "PostgreSQL handles billions of queries daily at companies like Apple, Instagram, and Spotify.",
    alternative: 'NoSQL API',
    alternativeWhy: "NoSQL APIs are faster at scale but sacrifice ACID guarantees and complex queries."
  },
  'Cache': {
    protocol: 'In-Memory Cache (Redis/Memcached)',
    description: "Direct connection to in-memory cache using native protocols.",
    whyThisProtocol: "Sub-millisecond latency for hot data — 10x to 100x faster than database queries.",
    realWorldFact: "Twitter serves 6 million timeline queries per second from Redis — reduces database load by 99%.",
    alternative: 'Database',
    alternativeWhy: "Databases have higher latency but provide durability and querying."
  },
  'Streaming': {
    protocol: 'Streaming / Kafka',
    description: "Distributed event streaming using Kafka's binary protocol.",
    whyThisProtocol: "Ordered, durable event log — enables replay, replayability, and event sourcing.",
    realWorldFact: "Confluent runs Kafka for 80% of Fortune 100 companies processing trillions of events.",
    alternative: 'Message Queue',
    alternativeWhy: "Traditional queues don't preserve ordering or enable replay. Kafka does both."
  },
  'Event Streaming': {
    protocol: 'Event Streaming',
    description: "Real-time event delivery through a streaming platform like Kafka.",
    whyThisProtocol: "Enables real-time data pipelines, event sourcing, and replay capability.",
    realWorldFact: "Uber processes 4 million location updates per second through Kafka streams.",
    alternative: 'Batch ETL',
    alternativeWhy: "Batch ETL has latency (hours). Streaming has seconds of latency but higher cost."
  },
  'Webhook': {
    protocol: 'Webhook (HTTP Callback)',
    description: "HTTP POST from server to server as event notification — no polling required.",
    whyThisProtocol: "Server pushes events immediately. Enables real-time integrations.",
    realWorldFact: "Stripe sends millions of webhooks daily for payment events with built-in retry logic.",
    alternative: 'Polling',
    alternativeWhy: "Polling is simpler but wastes bandwidth and has latency. Webhooks are instant."
  },
  'RTC': {
    protocol: 'WebRTC / Media',
    description: "Real-time media streaming — audio/video between peers or through SFU/MCU.",
    whyThisProtocol: "Enables voice/video calls, live streaming with minimal latency.",
    realWorldFact: "Discord handles 100M+ WebRTC connections daily across voice and video channels.",
    alternative: 'HTTP Long Poll',
    alternativeWhy: "Long poll works for chat but not for media. WebRTC has dedicated protocols for media."
  },
  'SSE': {
    protocol: 'Server-Sent Events (SSE)',
    description: "One-way server-to-client streaming over HTTP — server pushes, client receives.",
    whyThisProtocol: "Simpler than WebSocket for one-way streaming. Works over HTTP/1.1.",
    realWorldFact: "Google and Apple use SSE for real-time updates in Gmail, Google Docs, and Apple News notifications.",
    alternative: 'WebSocket',
    alternativeWhy: "WebSocket is bidirectional. SSE is simpler if only server pushes."
  },
  'HTTP/2': {
    protocol: 'HTTP/2 Multiplexing',
    description: "Multiple concurrent requests over single TCP connection with header compression.",
    whyThisProtocol: "Eliminates head-of-line blocking, reduces latency significantly vs HTTP/1.1.",
    realWorldFact: "Cloudflare's HTTP/2 coverage improves page load times by 30% on average.",
    alternative: 'HTTP/1.1',
    alternativeWhy: "HTTP/1.1 requires multiple connections for concurrency. HTTP/2 handles with one."
  },
  'HTTP/3': {
    protocol: 'HTTP/3 (QUIC)',
    description: "UDP-based transport with built-in encryption — eliminates head-of-line blocking.",
    whyThisProtocol: "Faster connection establishment, better on lossy networks, no head-of-line blocking.",
    realWorldFact: "Google serves 50% of YouTube traffic over HTTP/3. Chrome uses HTTP/3 by default.",
    alternative: 'HTTP/2',
    alternativeWhy: "HTTP/2 over TCP has head-of-line blocking. HTTP/3 uses QUIC to avoid it."
  },
  'OAuth': {
    protocol: 'OAuth 2.0 Token Exchange',
    description: "Token-based authentication using access tokens and refresh tokens.",
    whyThisProtocol: "Delegated access without sharing passwords. Supports scopes and expiration.",
    realWorldFact: "Auth0 handles 2.5 billion logins monthly for 70,000+ organizations worldwide.",
    alternative: 'API Keys',
    alternativeWhy: "API keys are simpler but don't support delegation, scopes, or automatic expiration."
  },
  'RDB': {
    protocol: 'Relational Database',
    description: "SQL-based database access with ACID transactions.",
    whyThisProtocol: "ACID guarantees are required for financial transactions and data integrity.",
    realWorldFact: "PostgreSQL at Stripe processes $1 trillion in payments annually.",
    alternative: 'NoSQL',
    alternativeWhy: "NoSQL trades ACID for scale. Not suitable where consistency is critical."
  },
  'CDN': {
    protocol: 'CDN Edge Fetch',
    description: "Content Delivery Network — edge servers fetch from origin and cache.",
    whyThisProtocol: "Dramatically reduces latency by serving from edge locations closest to users.",
    realWorldFact: "Cloudflare processes over 1.2 trillion HTTP requests per day globally.",
    alternative: 'Direct Origin',
    alternativeWhy: "Direct fetch to origin has higher latency and overloads origin at scale."
  },
  'Lambda': {
    protocol: 'Lambda / Serverless Invocation',
    description: "Function-as-a-Service invocation for ephemeral compute.",
    whyThisProtocol: "Scales to zero, no server management — pay only for actual compute time.",
    realWorldFact: "AWS Lambda executes trillions of invocations monthly for millions of enterprises.",
    alternative: 'Container/VM',
    alternativeWhy: "Containers have faster cold starts but require server management. Lambda is more managed."
  },
  'S3': {
    protocol: 'S3 / Object Storage API',
    description: "RESTful API for object storage — GET/PUT with built-in durability.",
    whyThisProtocol: "Infinitely scalable, 11-nines durable, cost-effective for unstructured data.",
    realWorldFact: "Amazon S3 stores exabytes of data for millions of customers globally.",
    alternative: 'Block Storage',
    alternativeWhy: "Block storage is faster but doesn't scale to S3 levels. Object storage is the better fit for cloud."
  },
  'Kafka Streams': {
    protocol: 'Kafka Streams',
    description: "Lightweight stream processing library built on Kafka — processes events in-flight.",
    whyThisProtocol: "Enables real-time event processing without separate infrastructure.",
    realWorldFact: "Kafka Streams processes trillions of events daily at companies like Uber and Netflix.",
    alternative: 'Spark Streaming',
    alternativeWhy: "Spark Streaming is heavier but has better fault tolerance for complex processing."
  },
  // Interview-critical protocols
  'Thrift': {
    protocol: 'Apache Thrift',
    description: "Facebook's binary serialization protocol — efficient cross-language RPC.",
    whyThisProtocol: "More efficient than JSON, supports multiple languages, built-in schema evolution.",
    realWorldFact: "Facebook developed Thrift for internal RPC. Apache Thrift is now used by 1000+ companies.",
    alternative: 'REST',
    alternativeWhy: "REST is human-readable and ubiquitous. Thrift is faster but less debuggable."
  },
  'Server-Sent Events': {
    protocol: 'SSE (Server-Sent Events)',
    description: "One-way server-to-client streaming over HTTP — server pushes, client receives.",
    whyThisProtocol: "Simpler than WebSocket for one-way streaming. Works over HTTP/1.1.",
    realWorldFact: "Google uses SSE for real-time updates in Gmail and Google Docs.",
    alternative: 'WebSocket',
    alternativeWhy: "WebSocket is bidirectional. SSE is simpler for server→client only streaming."
  },
  'HTTP/2 Multiplexing': {
    protocol: 'HTTP/2',
    description: "Multiple concurrent requests over single TCP connection with header compression.",
    whyThisProtocol: "Eliminates head-of-line blocking, reduces latency significantly vs HTTP/1.1.",
    realWorldFact: "Cloudflare's HTTP/2 coverage improves page load times by 30% on average.",
    alternative: 'HTTP/1.1',
    alternativeWhy: "HTTP/1.1 requires multiple connections for concurrency. HTTP/2 handles with one."
  },
  'HTTP/3 (QUIC)': {
    protocol: 'HTTP/3',
    description: "UDP-based transport with built-in encryption — eliminates head-of-line blocking.",
    whyThisProtocol: "Faster connection establishment, better on lossy networks, no head-of-line blocking.",
    realWorldFact: "Google serves 50% of YouTube traffic over HTTP/3. Chrome uses HTTP/3 by default.",
    alternative: 'HTTP/2',
    alternativeWhy: "HTTP/2 over TCP has head-of-line blocking. HTTP/3 uses QUIC to avoid it."
  },
  'gRPC Streaming': {
    protocol: 'gRPC Streaming',
    description: "Bidirectional streaming over gRPC — client and server send multiple messages over time.",
    whyThisProtocol: "Enables real-time communication with efficient binary serialization.",
    realWorldFact: "Google uses gRPC streaming for real-time features across all internal services.",
    alternative: 'REST Polling',
    alternativeWhy: "REST polling wastes bandwidth. Streaming is more efficient for real-time data."
  },
  'Memcached': {
    protocol: 'Memcached Protocol',
    description: "In-memory key-value cache using simple text protocol.",
    whyThisProtocol: "Extremely low latency for simple cache operations. Simpler than Redis.",
    realWorldFact: "Facebook uses Memcached extensively for caching — handles billions of requests.",
    alternative: 'Redis',
    alternativeWhy: "Redis has more data structures, persistence, and clustering. Memcached is simpler."
  },
  'Redis': {
    protocol: 'Redis Protocol',
    description: "In-memory data structure store — strings, hashes, lists, sets, sorted sets.",
    whyThisProtocol: "Sub-millisecond latency with rich data structures. Supports pub/sub, streams.",
    realWorldFact: "Twitter serves 6M queries/second from Redis. 99%+ database load reduction.",
    alternative: 'Memcached',
    alternativeWhy: "Memcached is simpler with lower memory overhead. Redis has more features but higher overhead."
  }
};