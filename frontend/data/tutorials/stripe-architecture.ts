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
  title: 'Payment Processing at Scale',
  subtitle: 'Build a production payment system in 10 steps',
  description:
    'Build a production payment processing system. Learn idempotency keys, webhook delivery, fraud detection, and distributed ledger design that handles trillions in payments.',
  estimatedTime: '~28 mins',
  unlocks: 'Production Layer',
  contextMessage:
    "Let's build Stripe from scratch. Hundreds of billions of dollars processed annually across 197 countries. Every design decision is shaped by the hardest problem in distributed systems: making financial transactions safe, consistent, and retry-safe in an unreliable network.",
  steps: [
    step({
      id: 1,
      title: 'Start with the Client',
      explanation:
        "Stripe's client is the merchant's checkout page — a web or mobile app that collects card details and sends them to Stripe. Stripe.js tokenizes card data in the browser so raw card numbers never touch the merchant's servers.",
      action: buildFirstStepAction('Web'),
      why: "The client-side tokenization model is fundamental to Stripe's security architecture. It means merchants can accept payments without ever handling sensitive card data.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'Stripe.js',
        'tokenize card data directly in the browser so raw card numbers never touch the merchant server',
        "This is critical for PCI compliance. If card numbers never touch the merchant's server, the merchant's infrastructure doesn't need to be PCI-compliant. Stripe handles all the sensitive data.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Stripe.js tokenizes card data in the browser. Raw card numbers never touch the merchant's server, which is why merchants don't need to be PCI-compliant for card data storage.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the Stripe Architecture tutorial. Stripe processes hundreds of billions of dollars annually across 197 countries."
        ),
        msg(
          "The client is the merchant's checkout page. Stripe.js runs in the browser, tokenizes card data locally, and sends a token to Stripe — raw card numbers never touch the merchant's server."
        ),
        msg("Press ⌘K and search for \"Web\" and press Enter to add the client to the canvas."),
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
        "All payment requests flow through Stripe's API Gateway. It validates API keys, enforces rate limits, and routes requests to the correct internal service.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'all payment requests being validated for API keys, rate limits, and routed to the correct internal service'),
      why: "Stripe's API Gateway is the enforcement point for API key validation, rate limiting, and idempotency key deduplication — all critical for a payment system.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'API Gateway',
        'validate API keys, enforce rate limits, and deduplicate idempotency keys before payment requests reach the backend',
        "Every payment request hits the API Gateway first. It validates your API key and enforces rate limits. The gateway also handles idempotency key deduplication — if the same payment request is sent twice, it returns the first result.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "Stripe's API Gateway is the enforcement point for all payment security: API key validation, rate limiting, and idempotency key deduplication. Every request — whether a charge, refund, or webhook — goes through here first.",
        'Auth Service'
      ),
      messages: [
        msg("Every payment request hits the API Gateway first. It validates your API key and enforces rate limits."),
        msg(
          "The gateway also handles idempotency key deduplication — if the same payment request is sent twice (network retry), the gateway returns the first result instead of charging twice."
        ),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now the auth layer.',
      errorMessage: 'Add an API Gateway and connect Web → API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add Auth Service',
      explanation:
        "Stripe authenticates merchants using API keys — a publishable key for client-side operations and a secret key for server-side operations. The Auth Service validates these keys and determines the merchant's permissions.",
      action: buildAction(
        'Auth Service',
        'API Gateway',
        'Auth Service',
        'API keys being validated on every request with permission scopes determining what operations are allowed'
      ),
      why: "API key validation is the first line of defense. A compromised secret key could allow unauthorized charges. The Auth Service also enforces per-merchant rate limits and permission scopes.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'Auth Service',
        'validate publishable and secret API keys, enforcing permission scopes and per-merchant rate limits',
        "Every merchant gets two keys: a publishable key (safe for client-side) and a secret key (server-side only). A restricted key might only be allowed to create charges but not issue refunds — the Auth Service enforces these scopes on every request.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'API Gateway',
        "Stripe uses two API keys — publishable and secret. The Auth Service validates these keys on every request and enforces permission scopes. A restricted key might only create charges, not refunds.",
        'Payment Service'
      ),
      messages: [
        msg(
          "Stripe uses API keys for authentication — not username/password. Every merchant gets a publishable key (safe for client-side) and a secret key (server-side only)."
        ),
        msg(
          "The Auth Service validates these keys on every request and enforces permission scopes. A restricted key might only be allowed to create charges, not issue refunds."
        ),
        msg("Press ⌘K and search for \"Auth Service\" and press Enter to add it, then connect API Gateway → Auth Service."),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('api_gateway', 'auth_service')],
      successMessage: 'Auth added and connected. Now the core payment orchestration.',
      errorMessage: 'Add an Auth Service and connect API Gateway → Auth Service.',
    }),
    step({
      id: 4,
      title: 'Add Payment Service',
      explanation:
        "The Payment Service orchestrates the entire payment flow. It uses idempotency keys to prevent double charges, coordinates with fraud detection, calls the bank network, and updates the ledger — all in under 200ms.",
      action: buildAction(
        'Microservice',
        'Auth',
        'Payment Service',
        'the entire payment flow being orchestrated: idempotency validation, fraud checks, bank network calls, and ledger updates — all in under 200ms'
      ),
      why: "The Payment Service is Stripe's core IP. Isolating it as a microservice means it can be updated, A/B tested, and scaled independently. Idempotency is implemented here to guarantee exactly-once payment semantics.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'Payment Service',
        'orchestrate the entire payment flow in under 200ms: idempotency checks, fraud evaluation, bank network calls, and ledger updates',
        "The Payment Service is Stripe's core intellectual property. It implements idempotency keys: a unique ID per payment attempt. If the same request arrives twice (network retry), the second one returns the first result. This is one of the hardest problems in distributed payments.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Payment Service',
        'Auth Service',
        "The Payment Service is Stripe's core IP — isolated as a microservice for independent updates, A/B testing, and scaling. It orchestrates the entire flow in under 200ms, coordinating fraud checks, bank calls, and ledger updates atomically.",
        'Fraud Detection'
      ),
      messages: [
        msg(
          "The Payment Service is the brain of Stripe — it orchestrates the entire payment flow in under 200ms."
        ),
        msg(
          "It implements idempotency keys: a unique ID per payment attempt. If the same request arrives twice (network retry), the second one returns the first result. This is one of the hardest problems in distributed payments."
        ),
        msg("Press ⌘K and search for \"Microservice\" and press Enter to add it, then connect Auth Service → Payment Service."),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Payment Service added and connected. Now fraud detection.',
      errorMessage: 'Add a Microservice (Payment Service) and connect Auth Service → Payment Service.',
    }),
    step({
      id: 5,
      title: 'Add Fraud Detection',
      explanation:
        "Stripe Radar runs 1000+ ML signals per transaction — card velocity, device fingerprint, email age, IP reputation. All in under 50ms.",
      action: buildAction(
        'Microservice',
        'Microservice',
        'Fraud Detection',
        '1000+ ML signals being evaluated per transaction — card velocity, device fingerprint, email age, IP reputation'
      ),
      why: "Fraud detection is a competitive differentiator for Stripe. Merchants choose Stripe partly because Radar reduces chargebacks. Every false positive is a lost sale, so precision matters as much as recall.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'Fraud Detection',
        'evaluate 1000+ ML signals per transaction in under 50ms to decide whether to block, flag, or allow each payment',
        "Radar evaluates card velocity (charges in the last hour), device fingerprint, email age, IP reputation, and behavioral patterns across Stripe's entire merchant network. Every false positive is a lost sale — precision matters as much as recall.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Fraud Detection',
        'Payment Service',
        "Stripe Radar evaluates 1000+ signals in 50ms: card velocity, device fingerprint, email age, IP reputation, and behavioral patterns. Merchants choose Stripe partly because Radar dramatically reduces chargebacks — fraud detection is Stripe's competitive moat.",
        'Payment Gateway'
      ),
      messages: [
        msg("Before charging a card, Stripe runs it through Radar — their ML fraud detection system."),
        msg(
          "Radar evaluates 1000+ signals in under 50ms: card velocity (how many charges in the last hour), device fingerprint, email age, IP reputation, and behavioral patterns across Stripe's entire network."
        ),
        msg(
          'Press ⌘K and search for "Microservice" and press Enter to add another one for Fraud Detection, then connect Payment Service → Fraud Detection.'
        ),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('microservice', 'microservice')],
      successMessage: 'Fraud Detection added. Now the bank connection.',
      errorMessage: 'Add a second Microservice (Fraud Detection) and connect it from the Payment Service.',
    }),
    step({
      id: 6,
      title: 'Add Payment Gateway',
      explanation:
        "The Payment Gateway connects Stripe to the actual bank networks — Visa, Mastercard, and ACH. It translates Stripe's internal payment request into the ISO 8583 message format that banks understand.",
      action: buildAction(
        'Payment Gateway',
        'Microservice',
        'Payment Gateway',
        'Stripe payment requests being translated into ISO 8583 format for Visa, Mastercard, and ACH bank networks'
      ),
      why: "Banks speak a different protocol (ISO 8583) than modern APIs. The Payment Gateway is the translator between Stripe's modern infrastructure and the legacy banking network.",
      component: component('payment_gateway', 'Payment'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'Payment Gateway',
        'translate modern API payment requests into ISO 8583 format — the 1980s message standard still used by bank networks',
        "Banks use ISO 8583 — a message format from the 1980s. The Payment Gateway is the translator between Stripe's modern API infrastructure and the legacy banking network. Without it, Stripe couldn't talk to any bank.",
        'Payment Gateway'
      ),
      celebrationMessage: buildCelebration(
        'Payment Gateway',
        'Fraud Detection',
        "Banks still use ISO 8583 — a message format from the 1980s. The Payment Gateway translates Stripe's modern API into this format and sends it to Visa, Mastercard, or ACH. Only fraud-cleared payments reach the bank network.",
        'Webhook Service'
      ),
      messages: [
        msg("After fraud checks pass, the payment needs to reach the actual bank. That's the Payment Gateway's job."),
        msg(
          "Banks use ISO 8583 — a message format from the 1980s. The Payment Gateway translates Stripe's modern API request into this format and sends it to Visa, Mastercard, or the ACH network."
        ),
        msg("Press ⌘K and search for \"Payment Gateway\" and press Enter to add it, then connect Fraud Detection → Payment Gateway."),
      ],
      requiredNodes: ['payment_gateway'],
      requiredEdges: [edge('microservice', 'payment_gateway')],
      successMessage: 'Payment Gateway added. Now webhook delivery.',
      errorMessage: 'Add a Payment Gateway and connect Fraud Detection → Payment Gateway.',
    }),
    step({
      id: 7,
      title: 'Add Webhook Service',
      explanation:
        "Stripe attempts webhook delivery with exponential backoff — immediately, then 1hr, 4hr, 24hr, 72hr. Merchants must make their webhook handlers idempotent because the same event can be delivered twice.",
      action: buildAction(
        'Microservice',
        'Microservice',
        'Webhook Service',
        'payment events being delivered to merchant servers with exponential backoff retry: immediately, then 1hr, 4hr, 24hr, 72hr'
      ),
      why: "Webhooks are how Stripe notifies merchants of payment events. Reliable delivery with retry logic is critical — a missed 'payment_succeeded' event could mean a merchant never ships an order.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'Webhook Service',
        'deliver payment events to merchant servers with exponential backoff retry: immediately, then 1hr, 4hr, 24hr, 72hr',
        "A missed 'payment_succeeded' webhook could mean a merchant never ships an order. The Webhook Service retries with exponential backoff. Because retries happen, merchants must build idempotent webhook handlers that handle the same event twice.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Webhook Service',
        'Payment Service',
        "The Webhook Service retries with exponential backoff: immediately, then 1hr, 4hr, 24hr, 72hr. Because of retries, merchants must handle the same event twice gracefully — idempotent webhook handlers are required for Stripe integrations.",
        'Message Queue'
      ),
      messages: [
        msg(
          "When a payment succeeds, Stripe needs to notify the merchant's server. That's done via webhooks."
        ),
        msg(
          "The Webhook Service retries with exponential backoff: immediately, then 1hr, 4hr, 24hr, 72hr. Because of retries, merchants must handle the same event twice gracefully — idempotent webhook handlers."
        ),
        msg(
          'Press ⌘K and search for "Microservice" and press Enter to add another one for the Webhook Service, then connect Payment Service → Webhook Service.'
        ),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('microservice', 'microservice')],
      successMessage: 'Webhook Service added. Now async event processing.',
      errorMessage: 'Add a third Microservice (Webhook Service) and connect it from the Payment Service.',
    }),
    step({
      id: 8,
      title: 'Add Message Queue',
      explanation:
        "Stripe uses a message queue to decouple payment events from downstream processing — webhook delivery, ledger updates, analytics, and fraud model retraining all consume from the same event stream.",
      action: buildAction(
        'Message Queue',
        'Microservice',
        'Message Queue',
        'payment_succeeded events being published and consumed independently by webhook delivery, ledger updates, analytics, and ML retraining'
      ),
      why: "Payment events trigger many downstream actions. A queue ensures that a slow webhook delivery doesn't block ledger updates, and a ledger failure doesn't prevent analytics from recording the transaction.",
      component: component('message_queue', 'Message'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'Message Queue',
        'decouple payment events from downstream processing so that a slow webhook delivery does not block ledger updates',
        "When a payment completes, many things happen: update the ledger, deliver webhooks, record analytics, retrain fraud models. A queue means the Payment Service publishes one event. Every downstream service consumes independently. A slow webhook doesn't block the ledger.",
        'Message Queue'
      ),
      celebrationMessage: buildCelebration(
        'Message Queue',
        'Payment Service',
        "A single 'payment_succeeded' event fans out from the Message Queue to multiple consumers: ledger updates, webhook delivery, analytics, and fraud model retraining. Each consumer processes independently — a slow webhook doesn't block the ledger.",
        'SQL Database'
      ),
      messages: [
        msg(
          "When a payment completes, many things need to happen: update the ledger, deliver webhooks, update analytics, retrain fraud models..."
        ),
        msg(
          "A Message Queue decouples all of this. The Payment Service publishes one event. Every downstream service consumes it independently. A slow webhook delivery doesn't block the ledger update."
        ),
        msg("Press ⌘K and search for \"Message Queue\" and press Enter to add it, then connect Payment Service → Message Queue."),
      ],
      requiredNodes: ['message_queue'],
      requiredEdges: [edge('microservice', 'message_queue')],
      successMessage: 'Message Queue added. Now the ledger.',
      errorMessage: 'Add a Message Queue and connect Payment Service → Message Queue.',
    }),
    step({
      id: 9,
      title: 'Add SQL Database (Ledger)',
      explanation:
        "Stripe uses double-entry bookkeeping — every debit has a corresponding credit. The ledger is append-only. No record is ever updated or deleted. This makes the entire payment history auditable forever.",
      action: buildAction(
        'SQL Database',
        'Microservice',
        'SQL Database',
        'every payment being recorded as an immutable, append-only double-entry ledger entry with a corresponding debit and credit'
      ),
      why: "Financial data requires ACID transactions and an immutable audit trail. SQL's transaction guarantees ensure that a charge and its corresponding ledger entry are always consistent.",
      component: component('sql_db', 'SQL'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'SQL Database',
        'persist an append-only, immutable ledger using double-entry bookkeeping where every debit has a corresponding credit',
        "The ledger is append-only — no record is ever updated or deleted. This makes the entire payment history auditable forever, critical for financial compliance. ACID transactions ensure every charge and its ledger entry are always consistent.",
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Payment Service',
        "Stripe uses double-entry bookkeeping — every debit has a corresponding credit. The ledger is append-only and immutable. No record is ever updated or deleted. This makes the entire payment history auditable forever for financial compliance.",
        'Logger and Metrics'
      ),
      messages: [
        msg(
          "Every payment creates a ledger entry. Stripe uses double-entry bookkeeping — every debit has a corresponding credit."
        ),
        msg(
          "The ledger is append-only and immutable. No record is ever updated or deleted. This makes the entire payment history auditable forever — critical for financial compliance."
        ),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect Payment Service → SQL Database."),
      ],
      requiredNodes: ['sql_db'],
      requiredEdges: [edge('microservice', 'sql_db')],
      successMessage: 'Ledger added. Final step — observability.',
      errorMessage: 'Add a SQL Database (Ledger) and connect Payment Service → SQL Database.',
    }),
    step({
      id: 10,
      title: 'Add Observability',
      explanation:
        "Stripe monitors payment success rates, fraud detection accuracy, webhook delivery rates, and API latency in real time. A 0.1% drop in payment success rate represents millions of dollars in lost revenue.",
      action: buildAction(
        'Logger',
        'Microservice',
        'Logger',
        'detailed payment traces being captured for debugging with per-merchant, per-payment granularity'
      ),
      why: "Every failed payment is a lost sale for a merchant. Observability lets Stripe detect degradation in payment success rates within seconds and page the on-call engineer before merchants notice.",
      component: component('logger', 'Logger'),
      openingMessage: buildOpeningL1(
        'Stripe',
        'Logger',
        'capture detailed payment traces for debugging with per-merchant, per-payment granularity across all 197 countries',
        "A 0.1% drop in payment success rate at Stripe's scale is millions of dollars in lost merchant revenue. Every failed payment is debugged with detailed traces — the Logger captures everything needed to diagnose issues within seconds.",
        'Logger'
      ),
      celebrationMessage: buildCelebration(
        'Logger and Metrics',
        'Payment Service',
        "A 0.1% payment failure rate at Stripe's scale is millions in lost revenue. The Logger captures detailed traces. The Metrics Collector tracks payment success rates, fraud block rates, and webhook delivery rates in real time. You have built Stripe.",
        'nothing — you have built Stripe'
      ),
      messages: [
        msg(
          "Final step — observability. A 0.1% drop in payment success rate at Stripe's scale is millions of dollars in lost merchant revenue."
        ),
        msg(
          "The Logger captures detailed payment traces for debugging. The Metrics Collector tracks payment success rates, fraud block rates, and webhook delivery rates in real time."
        ),
        msg(
          'Press ⌘K and search for "Logger" and press Enter to add it. Then search for "Metrics Collector" and add that too. Connect both from the Payment Service.'
        ),
      ],
      requiredNodes: ['logger', 'metrics_collector'],
      requiredEdges: [
        edge('microservice', 'logger'),
        edge('microservice', 'metrics_collector'),
      ],
      successMessage: 'Observability added. You have built Stripe.',
      errorMessage: 'Add both Logger and Metrics Collector and connect them from the Payment Service.',
    }),
  ],
});

// ── Level 2 — Production Ready (9 steps) ─────────────────────────────────────

const l2 = level({
  level: 2,
  title: 'Production Ready',
  subtitle: 'Scale to trillions in annual volume',
  description:
    "Your payment system processes transactions. Now add what Stripe actually ships: Kafka for event streaming, notification workers, SQL for merchant data, Redis caching, CDC for analytics, and structured logging.",
  estimatedTime: '~25 mins',
  unlocks: 'Expert Architecture',
  prerequisite: 'Builds on your Level 1 diagram',
  contextMessage:
    "Level 2: Production Ready. Your payment system processes transactions. Now add Kafka event streaming, notifications, SQL merchant data, caching, CDC analytics, and structured logging.",
  steps: [
    step({
      id: 1,
      title: 'Add Kafka Streaming',
      explanation:
        "Every payment, refund, dispute, and webhook delivery is published to Kafka. The analytics pipeline consumes payment events for real-time revenue dashboards. Dispute prediction models consume chargeback events for fraud scoring.",
      action: buildAction(
        'Kafka / Streaming',
        'Load Balancer',
        'Kafka Streaming',
        'every payment, refund, and dispute being streamed to analytics and fraud prediction consumers in real time'
      ),
      why: "Without Kafka, real-time revenue dashboards would require synchronous database queries. Kafka decouples event producers from consumers — the payment path stays fast regardless of downstream processing.",
      component: component('kafka_streaming', 'Kafka / Streaming', 'Kafka / Streaming'),
      openingMessage: buildOpeningL2(
        'Stripe',
        'Kafka',
        'stream every payment, refund, and dispute to analytics and fraud prediction consumers in real time',
        'Without Kafka, real-time revenue dashboards would require synchronous database queries.',
        'Kafka / Streaming'
      ),
      celebrationMessage: buildCelebration(
        'Kafka Streaming',
        'Load Balancer',
        "Stripe publishes billions of payment events per day to Kafka. Real-time revenue dashboards update within seconds. Dispute prediction models consume chargeback events for real-time fraud scoring.",
        'Notification Worker'
      ),
      messages: [
        msg("Level 2 — Production Ready. Every payment, refund, and dispute is published to Kafka for downstream consumers."),
        msg("Real-time revenue dashboards update within seconds. Dispute prediction models consume chargeback events for real-time fraud scoring."),
        msg("Press ⌘K and search for \"Kafka / Streaming\" and press Enter to add it, then connect Load Balancer → Kafka Streaming."),
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
        "Notification workers consume Kafka events to send email, SMS, and push notifications — payment receipts, refund confirmations, dispute alerts, and subscription reminders.",
      action: buildAction(
        'Worker',
        'Kafka',
        'Notification Worker',
        'payment receipts, refund confirmations, and dispute alerts being sent via email, SMS, and push notifications'
      ),
      why: "If Stripe sent notifications synchronously, slow email delivery could delay the payment response. Background workers handle notification delivery asynchronously.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL2(
        'Stripe',
        'Notification Worker',
        'deliver payment receipts and dispute alerts asynchronously via email, SMS, and push',
        'Synchronous notifications would delay payment responses — background workers handle delivery asynchronously.',
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Notification Worker',
        'Kafka Streaming',
        "Stripe's notification workers deliver payment receipts, refund confirmations, and dispute alerts via email, SMS, and push notifications. All delivery is asynchronous — payment responses are never delayed by notification delivery.",
        'In-Memory Cache'
      ),
      messages: [
        msg("Notification workers consume Kafka events to send payment receipts, refund confirmations, and dispute alerts."),
        msg("All notification delivery is asynchronous — payment responses are never delayed by slow email or SMS delivery."),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Kafka Streaming → Notification Worker."),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('kafka_streaming', 'worker_job')],
      successMessage: 'Notifications added. Now caching.',
      errorMessage: 'Add a Worker connected from Kafka Streaming.',
    }),
    step({
      id: 3,
      title: 'Add In-Memory Cache',
      explanation:
        "Stripe caches merchant configuration, API rate limits, and payment method metadata in Redis. Rate limit counters are cached with 1-second TTL — enabling sub-millisecond rate limit checks.",
      action: buildAction(
        'In-Memory Cache',
        'API Gateway',
        'In-Memory Cache',
        'rate limit counters and merchant configuration being cached for sub-millisecond rate limit enforcement'
      ),
      why: "Rate limit checks on every request hitting the database would add 5-20ms latency. Redis caches rate limit counters with 1-second TTL — sub-millisecond checks, no database load.",
      component: component('in_memory_cache', 'In-Memory Cache'),
      openingMessage: buildOpeningL2(
        'Stripe',
        'Redis (In-Memory Cache)',
        'cache rate limit counters with 1-second TTL for sub-millisecond rate limit enforcement',
        'Rate limit checks on every request hitting the database would add 5-20ms latency.',
        'In-Memory Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'API Gateway',
        "Stripe's Redis cache holds rate limit counters with 1-second TTL. Every API request checks Redis first — sub-millisecond checks, no database load. 99.9% of rate limit checks hit the cache.",
        'CDC Connector'
      ),
      messages: [
        msg("Rate limit counters are cached in Redis with 1-second TTL — enabling sub-millisecond rate limit checks."),
        msg("Every API request checks Redis first — no database load for rate limit enforcement. 99.9% of checks hit the cache."),
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect API Gateway → In-Memory Cache."),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('api_gateway', 'in_memory_cache')],
      successMessage: 'Cache added. Now CDC for analytics.',
      errorMessage: 'Add an In-Memory Cache connected from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add CDC Connector (Debezium)',
      explanation:
        "The CDC Connector captures row-level changes from Stripe's SQL ledger and streams them to Kafka for analytics — payment recordings, ledger updates, and dispute events without adding load to the production database.",
      action: buildAction(
        'CDC Connector (Debezium)',
        'SQL Database',
        'CDC Connector',
        'ledger changes being captured from the SQL transaction log and streamed to Kafka for analytics'
      ),
      why: "Without CDC, analytics queries would require direct database reads that add load to the production ledger. CDC captures changes from the transaction log — zero production query overhead.",
      component: component('cdc_connector', 'CDC Connector (Debezium)'),
      openingMessage: buildOpeningL2(
        'Stripe',
        'CDC Connector (Debezium)',
        'capture ledger changes from the SQL transaction log and stream to Kafka — zero production query overhead',
        'Without CDC, analytics queries add load to the production ledger — CDC captures changes from the transaction log.',
        'CDC Connector (Debezium)'
      ),
      celebrationMessage: buildCelebration(
        'CDC Connector',
        'SQL Database',
        "Stripe's CDC Connector captures every ledger update and dispute event from the SQL transaction log — streaming to Kafka for analytics without adding load to the production database.",
        'SQL Database'
      ),
      messages: [
        msg("CDC Connector captures row-level changes from the SQL ledger and streams them to Kafka for analytics."),
        msg("Without CDC, analytics queries would add load to the production ledger. CDC captures changes from the transaction log — zero query overhead."),
        msg("Press ⌘K and search for \"CDC Connector (Debezium)\" and press Enter to add it, then connect SQL Database → CDC Connector."),
      ],
      requiredNodes: ['cdc_connector'],
      requiredEdges: [edge('sql_db', 'cdc_connector')],
      successMessage: 'CDC added. Now SQL for merchants.',
      errorMessage: 'Add a CDC Connector connected from the SQL Database.',
    }),
    step({
      id: 5,
      title: 'Add SQL Database',
      explanation:
        "Stripe stores merchant profiles, API keys, and subscription data in PostgreSQL. Financial data requires ACID transactions — a missing payment from a merchant's earnings report is a legal issue.",
      action: buildAction(
        'SQL Database',
        'Auth Service',
        'SQL Database',
        'merchant profiles and API keys being stored with ACID guarantees for financial compliance'
      ),
      why: "Merchant earnings and API key management require auditable, ACID-compliant records. Eventual consistency is unacceptable for financial data.",
      component: component('sql_db', 'SQL Database'),
      openingMessage: buildOpeningL2(
        'Stripe',
        'SQL Database',
        'store merchant profiles and API keys with ACID guarantees for financial compliance',
        'Merchant earnings require auditable, ACID-compliant records — eventual consistency is unacceptable.',
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Auth Service',
        "Stripe stores merchant profiles and API keys in PostgreSQL with full ACID compliance. API key management requires auditable records — every key creation, rotation, and revocation is tracked.",
        'Structured Logger'
      ),
      messages: [
        msg("Merchant profiles, API keys, and subscription data need ACID compliance. PostgreSQL stores the authoritative records."),
        msg("API key management requires auditable records — every key creation, rotation, and revocation is tracked for compliance."),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect Auth Service → SQL Database."),
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
        "Stripe's Structured Logger emits JSON-formatted logs with consistent field schemas — payment_id, merchant_id, amount, currency, event_type. PCI-compliant logging excludes card numbers.",
      action: buildAction(
        'Structured Logger',
        'Load Balancer',
        'Structured Logger',
        'JSON-formatted payment traces being emitted with consistent schemas — PCI-compliant, excluding card numbers'
      ),
      why: "Text logs require regex parsing — slow and error-prone. Structured JSON logs enable fast LogQL queries across billions of payment events. PCI compliance requires careful handling of card data in logs.",
      component: component('structured_logger', 'Structured Logger'),
      openingMessage: buildOpeningL2(
        'Stripe',
        'Structured Logger',
        'emit JSON payment traces with consistent schemas — PCI-compliant logging excluding card numbers',
        'PCI compliance requires careful handling of card data in logs — structured logging ensures consistency.',
        'Structured Logger'
      ),
      celebrationMessage: buildCelebration(
        'Structured Logger',
        'Load Balancer',
        "Stripe's Structured Logger emits JSON payment traces with consistent schemas: payment_id, merchant_id, amount, currency, event_type. PCI-compliant logging excludes card numbers. LogQL queries aggregate metrics across billions of events.",
        'SLO/SLI Tracker'
      ),
      messages: [
        msg("Structured Logger emits JSON-formatted payment traces with consistent schemas."),
        msg("PCI-compliant logging excludes card numbers. LogQL queries aggregate metrics across billions of payment events for debugging and analytics."),
        msg("Press ⌘K and search for \"Structured Logger\" and press Enter to add it, then connect Load Balancer → Structured Logger."),
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
        "Stripe's SLO/SLI Tracker monitors payment success rate, API latency, and webhook delivery rate against defined Service Level Objectives. Payment success rate SLO: 99.99% — maximum 52 minutes of downtime per year.",
      action: buildAction(
        'SLO/SLI Tracker',
        'Metrics Collector',
        'SLO/SLI Tracker',
        'payment success rate and API latency being tracked against SLOs — alerting when error budgets burn'
      ),
      why: "Without SLOs, engineering teams argue about what 'good' means. With SLOs, there's a clear contractual target — 99.99% payment success rate is the industry standard for payments.",
      component: component('slo_tracker', 'SLO/SLI Tracker'),
      openingMessage: buildOpeningL2(
        'Stripe',
        'SLO/SLI Tracker',
        'monitor payment success rate and API latency against 99.99% SLO targets',
        'Without SLOs, engineering teams argue about what acceptable performance means.',
        'SLO/SLI Tracker'
      ),
      celebrationMessage: buildCelebration(
        'SLO/SLI Tracker',
        'Metrics Collector',
        "Stripe's SLO: 99.99% payment success rate — maximum 52 minutes of downtime per year. The SLO/SLI Tracker alerts when error budgets burn — paged on-call before merchants notice degradation.",
        'Error Budget Monitor'
      ),
      messages: [
        msg("The SLO/SLI Tracker monitors payment success rate, API latency, and webhook delivery rate against defined Service Level Objectives."),
        msg("Stripe's payment success rate SLO: 99.99% — maximum 52 minutes of downtime per year. When error budgets burn, on-call is paged."),
        msg("Press ⌘K and search for \"SLO/SLI Tracker\" and press Enter to add it, then connect Metrics Collector → SLO/SLI Tracker."),
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
        "Stripe's Error Budget Monitor tracks remaining reliability budget for payment success rate SLO. When the error budget burns faster than acceptable, feature launches pause until reliability improves.",
      action: buildAction(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        'Error Budget Monitor',
        'error budget burn rate being tracked — pausing feature launches when budget depletes faster than acceptable'
      ),
      why: "The error budget is the 'spare' reliability. When depleted, feature launches pause. For financial services, reliability is non-negotiable — a payment failure costs merchants real money.",
      component: component('error_budget_alert', 'Error Budget Monitor'),
      openingMessage: buildOpeningL2(
        'Stripe',
        'Error Budget Monitor',
        'track error budget burn rate — pausing feature launches when budget depletes to protect reliability',
        'For financial services, reliability is non-negotiable — a payment failure costs merchants real money.',
        'Error Budget Monitor'
      ),
      celebrationMessage: buildCelebration(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        "Stripe's error budget policy: when more than 5% of the monthly budget burns in a week, feature launches pause. Engineering prioritizes reliability until the budget recovers — protecting merchant revenue.",
        'Level 3'
      ),
      messages: [
        msg("The Error Budget Monitor tracks remaining reliability budget for payment success rate SLO."),
        msg("When the error budget burns faster than acceptable, feature launches pause until reliability improves. For payments, reliability is non-negotiable."),
        msg("Press ⌘K and search for \"Error Budget Monitor\" and press Enter to add it, then connect SLO/SLI Tracker → Error Budget Monitor."),
      ],
      requiredNodes: ['error_budget_alert'],
      requiredEdges: [edge('slo_tracker', 'error_budget_alert')],
      successMessage: 'Error budget monitoring added. Stripe is now production-ready.',
      errorMessage: 'Add an Error Budget Monitor connected from the SLO/SLI Tracker.',
    }),
  ],
});

// ── Level 3 — Expert Architecture (11 steps) ───────────────────────────────────

const l3 = level({
  level: 3,
  title: 'Expert Architecture',
  subtitle: 'Design like a Stripe senior engineer',
  description:
    "You have production Stripe. Now add what separates senior engineers — service mesh, GraphQL Federation, token bucket rate limiting, distributed tracing with correlation IDs, mTLS for service authentication, JWT validation, and event sourcing for the ledger.",
  estimatedTime: '~30 mins',
  prerequisite: 'Builds on your Level 2 diagram',
  contextMessage:
    "Level 3: Expert Architecture. Add service mesh, GraphQL Federation, advanced rate limiting, distributed tracing, mTLS, JWT validation, and event sourcing.",
  steps: [
    step({
      id: 1,
      title: 'Add Service Mesh (Istio)',
      explanation:
        "Stripe's Service Mesh uses Istio to manage all east-west traffic between services — automatic mTLS encryption between every payment service, circuit breaking, retries, and load balancing at the sidecar proxy level.",
      action: buildAction(
        'Service Mesh (Istio)',
        'Load Balancer',
        'Service Mesh',
        'automatic mTLS and traffic management being enforced at the sidecar proxy level for all payment services'
      ),
      why: "Without a service mesh, each payment service implements TLS differently. Istio handles this transparently at the infrastructure layer — critical for PCI DSS compliance.",
      component: component('service_mesh', 'Service Mesh (Istio)'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'Service Mesh (Istio)',
        'automatic mTLS, circuit breaking, and traffic policies enforced at the sidecar proxy level across all payment services',
        'Without a service mesh, TLS implementation varies across services — a risk for PCI DSS compliance.',
        'Service Mesh (Istio)'
      ),
      celebrationMessage: buildCelebration(
        'Service Mesh',
        'Load Balancer',
        "Stripe's service mesh handles billions of payment service calls per day. Every call is encrypted with mTLS — no service code changes required. PCI DSS compliance requires consistent encryption across all services.",
        'GraphQL Federation Gateway'
      ),
      messages: [
        msg("Level 3 — Expert Architecture. The Service Mesh (Istio) adds sidecar proxies to every pod — handling mTLS, retries, circuit breaking, and load balancing transparently."),
        msg("Automatic mTLS encrypts every service-to-service call. PCI DSS compliance requires consistent encryption — the Control Plane enforces this across the entire cluster."),
        msg("Press ⌘K and search for \"Service Mesh (Istio)\" and press Enter to add it, then connect Load Balancer → Service Mesh."),
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
        "Stripe's GraphQL Federation Gateway combines payment, subscription, and invoice schemas into a unified supergraph. Enterprise dashboards query one endpoint — the gateway fans out to multiple subgraphs and composes the response.",
      action: buildAction(
        'GraphQL Federation Gateway',
        'API Gateway',
        'GraphQL Federation Gateway',
        'payment, subscription, and invoice schemas being composed into a unified API from multiple subgraphs'
      ),
      why: "Without Federation, enterprise dashboards make multiple API calls. GraphQL Federation lets dashboards fetch all needed data in a single query.",
      component: component('graphql_federation', 'GraphQL Federation Gateway'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'GraphQL Federation Gateway',
        'compose payment, subscription, and invoice schemas into a unified supergraph from multiple subgraphs',
        'Without Federation, enterprise dashboards make multiple API calls — GraphQL reduces this to one.',
        'GraphQL Federation Gateway'
      ),
      celebrationMessage: buildCelebration(
        'GraphQL Federation Gateway',
        'API Gateway',
        "Stripe's GraphQL Federation Gateway serves enterprise dashboards with a unified API — one query fetches payments, subscriptions, and invoices. API call volume reduced by 70%, dashboard latency reduced by 50%.",
        'Token Bucket Rate Limiter'
      ),
      messages: [
        msg("GraphQL Federation combines payment, subscription, and invoice schemas into a unified supergraph."),
        msg("Enterprise dashboards query one endpoint — the gateway fans out to multiple subgraphs and composes the response. API calls reduced by 70%."),
        msg("Press ⌘K and search for \"GraphQL Federation Gateway\" and press Enter to add it, then connect API Gateway → GraphQL Federation Gateway."),
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
        "Stripe's Token Bucket Rate Limiter enforces API quotas using the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate. Enterprise API clients get larger buckets for batch operations.",
      action: buildAction(
        'Token Bucket Rate Limiter',
        'API Gateway',
        'Token Bucket Rate Limiter',
        'API quotas being enforced with burst allowance using the token bucket algorithm — enterprise clients get larger buckets'
      ),
      why: "Fixed rate limiting can't handle legitimate API bursts. Enterprise clients uploading batch payments need burst capacity — the token bucket allows this while maintaining average limits.",
      component: component('token_bucket_limiter', 'Token Bucket Rate Limiter'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'Token Bucket Rate Limiter',
        'enforce API quotas with burst allowance — enterprise batch payment clients get larger token buckets',
        'Fixed rate limiting cannot handle legitimate bursts — token bucket allows bursts while maintaining average limits.',
        'Token Bucket Rate Limiter'
      ),
      celebrationMessage: buildCelebration(
        'Token Bucket Rate Limiter',
        'API Gateway',
        "Stripe's token bucket rate limiter allows enterprise API clients to burst batch payment requests — a client processing 1000 refunds can use their full bucket. Casual API users get smaller buckets. The steady average rate prevents abuse.",
        'Leaky Bucket Rate Limiter'
      ),
      messages: [
        msg("Token Bucket Rate Limiter uses the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate."),
        msg("Enterprise batch payment clients get larger buckets. The steady average rate prevents abuse while enabling legitimate bursts."),
        msg("Press ⌘K and search for \"Token Bucket Rate Limiter\" and press Enter to add it, then connect API Gateway → Token Bucket Rate Limiter."),
      ],
      requiredNodes: ['token_bucket_limiter'],
      requiredEdges: [edge('api_gateway', 'token_bucket_limiter')],
      successMessage: 'Rate limiting added. Now leaky bucket for network.',
      errorMessage: 'Add a Token Bucket Rate Limiter connected from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add Leaky Bucket Rate Limiter',
      explanation:
        "Stripe's Leaky Bucket Rate Limiter smooths traffic bursts by processing requests at a constant rate — preventing traffic bursts from overwhelming the bank network connection with ISO 8583 messages.",
      action: buildAction(
        'Leaky Bucket Rate Limiter',
        'Payment Gateway',
        'Leaky Bucket Rate Limiter',
        'outgoing bank network traffic being smoothed at a constant rate — preventing burst overwhelming of ISO 8583 connections'
      ),
      why: "Bank networks have connection limits — they can only process a fixed number of ISO 8583 messages per second. The leaky bucket smooths outgoing traffic to match the bank's capacity.",
      component: component('leaky_bucket_limiter', 'Leaky Bucket Rate Limiter'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'Leaky Bucket Rate Limiter',
        'smooth outgoing bank network traffic at a constant rate — preventing burst overwhelming of ISO 8583 connections',
        "Bank networks have connection limits — the leaky bucket smooths traffic to match the bank's capacity.",
        'Leaky Bucket Rate Limiter'
      ),
      celebrationMessage: buildCelebration(
        'Leaky Bucket Rate Limiter',
        'Payment Gateway',
        "Stripe's Leaky Bucket Rate Limiter smooths outgoing ISO 8583 messages to the bank network at a constant rate. Even during traffic bursts, the bank network connection is never overwhelmed — constant throughput, no connection drops.",
        'OpenTelemetry Collector'
      ),
      messages: [
        msg("Leaky Bucket Rate Limiter smooths outgoing bank network traffic at a constant rate."),
        msg("Bank networks have connection limits. The leaky bucket prevents traffic bursts from overwhelming the ISO 8583 connection — constant throughput, no connection drops."),
        msg("Press ⌘K and search for \"Leaky Bucket Rate Limiter\" and press Enter to add it, then connect Payment Gateway → Leaky Bucket Rate Limiter."),
      ],
      requiredNodes: ['leaky_bucket_limiter'],
      requiredEdges: [edge('payment_gateway', 'leaky_bucket_limiter')],
      successMessage: 'Leaky bucket added. Now distributed tracing.',
      errorMessage: 'Add a Leaky Bucket Rate Limiter connected from the Payment Gateway.',
    }),
    step({
      id: 5,
      title: 'Add OpenTelemetry Collector',
      explanation:
        "Stripe's OpenTelemetry Collector receives traces, metrics, and logs from all payment services — processing and exporting to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs.",
      action: buildAction(
        'OpenTelemetry Collector',
        'Structured Logger',
        'OpenTelemetry Collector',
        'traces, metrics, and logs being aggregated and exported to multiple backends from a single unified collector'
      ),
      why: "Without OTel, each payment service uses different tracing libraries. The OTel Collector normalizes everything — one instrumentation, multiple backends.",
      component: component('otel_collector', 'OpenTelemetry Collector'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'OpenTelemetry Collector',
        'unified telemetry pipeline for traces, metrics, and logs with multi-backend export',
        'Without OTel, each payment service uses different tracing libraries — the OTel Collector normalizes everything.',
        'OpenTelemetry Collector'
      ),
      celebrationMessage: buildCelebration(
        'OpenTelemetry Collector',
        'Structured Logger',
        "Stripe's OTel Collector processes billions of payment spans per day. One instrumentation exports to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs — three backends, zero per-service configuration.",
        'Correlation ID Injector'
      ),
      messages: [
        msg("The OpenTelemetry Collector is the unified observability pipeline — receiving spans, metrics, and logs from all services, normalizing the format, and exporting to multiple backends."),
        msg("Without OTel, adding a new tracing backend requires changing every payment service. With OTel, services instrument once and the collector routes to any backend."),
        msg("Press ⌘K and search for \"OpenTelemetry Collector\" and press Enter to add it, then connect Structured Logger → OpenTelemetry Collector."),
      ],
      requiredNodes: ['otel_collector'],
      requiredEdges: [edge('structured_logger', 'otel_collector')],
      successMessage: 'OTel Collector added. Now correlation IDs.',
      errorMessage: 'Add an OpenTelemetry Collector connected from the Structured Logger.',
    }),
    step({
      id: 6,
      title: 'Add Correlation ID Injector',
      explanation:
        "The Correlation ID Injector assigns a unique trace ID to every payment request that propagates via HTTP headers across all service calls — enabling end-to-end request tracing from the merchant API through fraud detection, bank calls, and ledger updates.",
      action: buildAction(
        'Correlation ID Injector',
        'otel_collector',
        'Correlation ID Injector',
        'unique trace IDs being propagated across all payment service calls for end-to-end request visibility'
      ),
      why: "Without correlation IDs, debugging a failed payment requires checking logs from the API gateway, fraud service, payment gateway, and ledger separately. Correlation IDs link all logs under one trace.",
      component: component('correlation_id_handler', 'Correlation ID Injector'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'Correlation ID Injector',
        'propagate unique trace IDs across all payment service calls for instant cross-service log correlation',
        'Without correlation IDs, debugging failed payments requires checking logs from 5+ services separately.',
        'Correlation ID Injector'
      ),
      celebrationMessage: buildCelebration(
        'Correlation ID Injector',
        'OpenTelemetry Collector',
        "Stripe's correlation IDs flow through every payment service call: API Gateway → Fraud Detection → Payment Gateway → Ledger. All logs under one trace ID — instant debugging of failed payments.",
        'mTLS Certificate Authority'
      ),
      messages: [
        msg("The Correlation ID Injector generates a unique trace ID at request entry and propagates it via HTTP headers through every payment service call."),
        msg("All logs for a payment request share one correlation ID — instant debugging across Fraud Detection, Payment Gateway, and Ledger."),
        msg("Press ⌘K and search for \"Correlation ID Injector\" and press Enter to add it, then connect OpenTelemetry Collector → Correlation ID Injector."),
      ],
      requiredNodes: ['correlation_id_handler'],
      requiredEdges: [edge('otel_collector', 'correlation_id_handler')],
      successMessage: 'Correlation IDs added. Now mTLS.',
      errorMessage: 'Add a Correlation ID Injector connected from the OpenTelemetry Collector.',
    }),
    step({
      id: 7,
      title: 'Add mTLS Certificate Authority',
      explanation:
        "Stripe's mTLS Certificate Authority issues and rotates TLS certificates for all service-to-service authentication — enabling mutual TLS where both client and server verify each other. Certificates rotate automatically every 24 hours.",
      action: buildAction(
        'mTLS Certificate Authority',
        'Service Mesh',
        'mTLS Certificate Authority',
        'TLS certificates being issued and rotated automatically every 24 hours for service-to-service authentication'
      ),
      why: "mTLS ensures that only authorized services can communicate with each other. Automatic certificate rotation prevents expired certificates from causing outages.",
      component: component('mtls_certificate_authority', 'mTLS Certificate Authority'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'mTLS Certificate Authority',
        'issue and rotate TLS certificates automatically every 24 hours for mutual service-to-service authentication',
        'mTLS ensures only authorized services communicate — automatic rotation prevents certificate expiration outages.',
        'mTLS Certificate Authority'
      ),
      celebrationMessage: buildCelebration(
        'mTLS Certificate Authority',
        'Service Mesh',
        "Stripe's mTLS CA issues certificates that rotate every 24 hours automatically. Every service-to-service call verifies both client and server certificates — even if one service is compromised, it cannot impersonate another.",
        'JWT Validation Service'
      ),
      messages: [
        msg("mTLS Certificate Authority issues and rotates TLS certificates for all service-to-service authentication."),
        msg("Mutual TLS ensures both client and server verify each other. Automatic rotation every 24 hours prevents expired certificates from causing outages."),
        msg("Press ⌘K and search for \"mTLS Certificate Authority\" and press Enter to add it, then connect Service Mesh → mTLS CA."),
      ],
      requiredNodes: ['mtls_certificate_authority'],
      requiredEdges: [edge('service_mesh', 'mtls_certificate_authority')],
      successMessage: 'mTLS CA added. Now JWT validation.',
      errorMessage: 'Add an mTLS Certificate Authority connected from the Service Mesh.',
    }),
    step({
      id: 8,
      title: 'Add JWT Validation Service',
      explanation:
        "Stripe's JWT Validation Service parses and verifies JWT tokens at the API gateway — verifying signature, expiration, and merchant permissions without hitting the auth server on every request.",
      action: buildAction(
        'JWT Validation Service',
        'API Gateway',
        'JWT Validation',
        'JWT tokens being validated at the gateway — verifying signature, expiration, and merchant scopes without per-request auth calls'
      ),
      why: "Without JWT validation at the gateway, every API request would require a synchronous call to the auth server. JWT validation at the gateway adds zero latency.",
      component: component('jwt_validator', 'JWT Validation Service'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'JWT Validation Service',
        'validate JWT tokens at the gateway — verifying signature, expiration, and scopes without per-request auth calls',
        'Without gateway JWT validation, every request requires a synchronous auth server call — added latency.',
        'JWT Validation Service'
      ),
      celebrationMessage: buildCelebration(
        'JWT Validation Service',
        'API Gateway',
        "Stripe's JWT Validation Service verifies tokens at the API gateway — signature, expiration, merchant scopes. No synchronous auth server calls on every request. Zero added latency for authenticated requests.",
        'Token Rotation Service'
      ),
      messages: [
        msg("JWT Validation Service parses and verifies JWT tokens at the API gateway."),
        msg("Signature, expiration, and merchant permissions are verified without hitting the auth server on every request — zero added latency."),
        msg("Press ⌘K and search for \"JWT Validation Service\" and press Enter to add it, then connect API Gateway → JWT Validation Service."),
      ],
      requiredNodes: ['jwt_validator'],
      requiredEdges: [edge('api_gateway', 'jwt_validator')],
      successMessage: 'JWT validation added. Now token rotation.',
      errorMessage: 'Add a JWT Validation Service connected from the API Gateway.',
    }),
    step({
      id: 9,
      title: 'Add Token Rotation Service',
      explanation:
        "Stripe's Token Rotation Service automatically rotates API keys and refresh tokens on a schedule and immediately after security incidents — without service restarts or merchant disruption.",
      action: buildAction(
        'Token Rotation Service',
        'Auth Service',
        'Token Rotation',
        'API keys and refresh tokens being rotated automatically on schedule and after security incidents without service restarts'
      ),
      why: "Manual key rotation is error-prone and slow. Automatic rotation on schedule and immediate rotation after incidents reduces the window of exposure from compromised credentials.",
      component: component('token_rotation', 'Token Rotation Service'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'Token Rotation Service',
        'rotate API keys and refresh tokens automatically on schedule and after security incidents without service restarts',
        'Manual key rotation is error-prone — automatic rotation reduces the window of exposure from compromised credentials.',
        'Token Rotation Service'
      ),
      celebrationMessage: buildCelebration(
        'Token Rotation Service',
        'Auth Service',
        "Stripe's Token Rotation Service rotates API keys every 90 days automatically. After any security incident, keys rotate immediately — without service restarts or merchant disruption. The window of exposure from compromised credentials is minimized.",
        'Data Warehouse'
      ),
      messages: [
        msg("Token Rotation Service automatically rotates API keys and refresh tokens on schedule and after security incidents."),
        msg("Automatic rotation reduces the window of exposure from compromised credentials — no manual process, no service restarts."),
        msg("Press ⌘K and search for \"Token Rotation Service\" and press Enter to add it, then connect Auth Service → Token Rotation Service."),
      ],
      requiredNodes: ['token_rotation'],
      requiredEdges: [edge('auth_service', 'token_rotation')],
      successMessage: 'Token rotation added. Now analytics pipeline.',
      errorMessage: 'Add a Token Rotation Service connected from the Auth Service.',
    }),
    step({
      id: 10,
      title: 'Add Data Warehouse',
      explanation:
        "Stripe's Data Warehouse stores all historical transaction data — revenue, disputes, refunds, merchant growth. It powers the business intelligence that guides pricing decisions and product investments.",
      action: buildAction(
        'Data Warehouse',
        'CDC Connector',
        'Data Warehouse',
        'all historical transaction data being stored for business intelligence and financial analytics'
      ),
      why: "The SQL ledger answers 'what is this merchant's balance right now?' The Data Warehouse answers 'what are the dispute trends by merchant category over the past year?' — different query patterns requiring different storage.",
      component: component('data_warehouse', 'Data Warehouse'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'Data Warehouse',
        'columnar analytics storage for revenue trends and dispute patterns across years of transaction data',
        'The SQL ledger cannot answer multi-year trend questions — that needs a data warehouse.',
        'Data Warehouse'
      ),
      celebrationMessage: buildCelebration(
        'Data Warehouse',
        'CDC Connector',
        "Stripe's data warehouse processes petabytes of transaction data. Dispute trend analysis, merchant growth modeling, and pricing decisions all use this data — guiding Stripe's multi-billion dollar business strategy.",
        'Event Store'
      ),
      messages: [
        msg("Data Warehouse stores all historical transaction data for business intelligence and financial analytics."),
        msg("The SQL ledger cannot answer multi-year dispute trend questions — columnar storage optimized for analytics is required."),
        msg("Press ⌘K and search for \"Data Warehouse\" and press Enter to add it, then connect CDC Connector → Data Warehouse."),
      ],
      requiredNodes: ['data_warehouse'],
      requiredEdges: [edge('cdc_connector', 'data_warehouse')],
      successMessage: 'Analytics pipeline added. Now event sourcing.',
      errorMessage: 'Add a Data Warehouse connected from the CDC Connector.',
    }),
    step({
      id: 11,
      title: 'Add Event Store',
      explanation:
        "Stripe's Event Store (EventStoreDB) maintains an immutable log of all payment lifecycle events — charged, disputed, refunded, paid out. The entire ledger state can be reconstructed by replaying events for audit and regulatory compliance.",
      action: buildAction(
        'Event Store (EventStoreDB)',
        'Payment Service',
        'Event Store',
        'immutable event log being maintained for payment lifecycle — enabling audit trails and state reconstruction by replay'
      ),
      why: "Financial regulators require a complete audit trail. The Event Store provides immutable evidence of every payment decision — critical for SOC 2 and PCI DSS compliance.",
      component: component('event_store', 'Event Store (EventStoreDB)'),
      openingMessage: buildOpeningL3(
        'Stripe',
        'Event Store (EventStoreDB)',
        'immutable event log for payment lifecycle enabling audit trails and state reconstruction for regulatory compliance',
        'Financial regulators require a complete audit trail — the Event Store provides immutable evidence for compliance.',
        'Event Store (EventStoreDB)'
      ),
      celebrationMessage: buildCelebration(
        'Event Store',
        'Payment Service',
        "Stripe's Event Store maintains an immutable log of every payment lifecycle event — charged, disputed, refunded, paid out. The entire ledger state can be reconstructed by replaying events. This completes the expert architecture.",
        'completion'
      ),
      messages: [
        msg("Event Store (EventStoreDB) maintains an immutable log of all payment lifecycle events — charged, disputed, refunded, paid out."),
        msg("The entire ledger state can be reconstructed by replaying events. Financial regulators require a complete audit trail — the Event Store provides immutable evidence for SOC 2 and PCI DSS compliance."),
        msg("Press ⌘K and search for \"Event Store (EventStoreDB)\" and press Enter to add it, then connect Payment Service → Event Store. This completes the expert architecture!"),
      ],
      requiredNodes: ['event_store'],
      requiredEdges: [edge('microservice', 'event_store')],
      successMessage: "Expert architecture complete! You've designed Stripe at the senior engineer level.",
      errorMessage: 'Add an Event Store connected from the Payment Service.',
    }),
  ],
});

export const stripeTutorial: Tutorial = tutorial({
  id: 'stripe-architecture',
  title: 'How to Design Stripe Architecture',
  description:
    'Build a production payment processing system. Learn idempotency keys, webhook delivery, fraud detection, and distributed ledger design that handles trillions in payments.',
  difficulty: 'Advanced',
  category: 'Payments',
  isLive: false,
  icon: 'CreditCard',
  color: '#635bff',
  tags: ['Idempotency', 'Webhooks', 'Fraud', 'Ledger', 'Security'],
  estimatedTime: '~83 mins',
  levels: [l1, l2, l3],
});
