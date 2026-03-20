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
  title: 'Payment Processing at Scale',
  subtitle: 'Build a production payment system in 10 steps',
  description:
    'Build a production payment processing system. Learn idempotency keys, webhook delivery, fraud detection, and distributed ledger design that handles trillions in payments.',
  estimatedTime: '~28 mins',
  unlocks: undefined,
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
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
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
        msg('Press ⌘K, search for "Auth Service", add it, then connect API Gateway → Auth Service.'),
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
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Payment Service.'),
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
          'Press ⌘K, search for "Microservice", add another one for Fraud Detection, then connect Payment Service → Fraud Detection.'
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
        msg('Press ⌘K, search for "Payment Gateway", add it, then connect Fraud Detection → Payment Gateway.'),
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
          'Press ⌘K, search for "Microservice", add another one for the Webhook Service, then connect Payment Service → Webhook Service.'
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
        msg('Press ⌘K, search for "Message Queue", add it, then connect Payment Service → Message Queue.'),
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
        msg('Press ⌘K, search for "SQL Database", add it, then connect Payment Service → SQL Database.'),
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
          'Press ⌘K, search for "Logger", add it. Then search for "Metrics Collector" and add that too. Connect both from the Payment Service.'
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
  estimatedTime: '~28 mins',
  levels: [l1],
});
