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
  title: 'Marketplace Architecture',
  subtitle: 'Build a global rental marketplace in 12 steps',
  description:
    'Build a global home rental marketplace from scratch. Master availability calendars, geo-spatial search with Elasticsearch, dynamic ML-powered pricing, trust systems, and the two-sided payment escrow that makes strangers booking strangers feel safe.',
  estimatedTime: '~34 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build Airbnb from scratch. A global marketplace where 150 million guests book stays in 4 million homes managed by strangers — and trust the whole thing enough to actually complete a booking.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "Airbnb has two clients: the guest app (searching and booking) and the host app (managing listings and calendars). Both are web and mobile, with the guest app handling far more traffic. The guest client is where most users start — searching, browsing photos, and initiating bookings.",
      action: buildFirstStepAction('Web'),
      why: "Airbnb's two-sided marketplace means the client layer must support two very different user journeys — guests searching and booking, hosts managing availability and pricing.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Web Client',
        'serve as the primary interface for guests searching homes and initiating bookings on desktop',
        "The guest client handles 10x more traffic than the host client — most users are searching, not hosting.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Airbnb's guest-facing web app handles 150 million guests browsing 4 million listings, managing photos, reviews, and checkout flows.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the Airbnb Architecture tutorial. 4 million hosts, 150 million guests, 220 countries — and the challenge of building trust between strangers."
        ),
        msg(
          "The guest web client is where most users start — searching destinations, browsing photos, and initiating bookings. Every component in this architecture exists to serve that journey."
        ),
        msg('Press ⌘K and search for "Web" to add the primary client to the canvas.'),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Web Client added. Now the API Gateway.',
      errorMessage: 'Add a Web client node using ⌘K → search "Web".',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        'All requests from guest and host apps flow through an API Gateway. It handles authentication, routes search requests to the Search Service, booking requests to the Booking Service, and enforces rate limits that differ by subscription tier.',
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'all guest traffic entering through a single controlled entry point'),
      why: "Airbnb's API Gateway is the single entry point that routes the two very different traffic patterns — high-volume read-heavy search traffic and lower-volume transactional booking traffic.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'API Gateway',
        'receive every request from guests and hosts and route it to the correct backend service',
        "It separates the client from the complexity behind it — the client never needs to know where the Search Service or Booking Service lives.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "The API Gateway handles both search traffic (read-heavy, cacheable) and booking traffic (transactional, must hit the database) — routing each to a different service cluster.",
        'Load Balancer'
      ),
      messages: [
        msg(
          'All guest and host requests hit the API Gateway first. It routes search queries differently from booking transactions — two completely different traffic patterns.'
        ),
        msg(
          "Search traffic is read-heavy and can be served from cache. Booking traffic is transactional and must hit the database. The gateway routes them to different service clusters."
        ),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
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
        "Airbnb's API Gateway routes to a Load Balancer that distributes requests across application servers. Search traffic spikes during holidays and weekends — the load balancer enables auto-scaling so the system can handle 10x traffic surges without degradation.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'incoming traffic being distributed across multiple servers so no single server is overwhelmed'),
      why: "Airbnb sees 10x traffic spikes before major holidays. The load balancer enables horizontal scaling so the system can handle Black Friday travel searches without degradation.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Load Balancer',
        'distribute requests across application servers and enable horizontal scaling during traffic spikes',
        "10x traffic spikes before major holidays — Thanksgiving, Christmas, New Year's — are handled automatically by scaling out server capacity.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "Auto-scaling kicks in when CPU exceeds 70% — new servers spin up in under 2 minutes. The load balancer routes new traffic to them immediately so users never notice the scale-up.",
        'Auth Service'
      ),
      messages: [
        msg(
          "Airbnb's architecture must handle massive traffic surges. Before Thanksgiving, the Load Balancer routes traffic to hundreds of servers automatically."
        ),
        msg(
          'Auto-scaling kicks in when CPU exceeds 70% — new servers spin up in under 2 minutes. The load balancer routes new traffic to them immediately so users never notice the scale-up.'
        ),
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
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
        "Airbnb authenticates users via email, Google, or Facebook OAuth. The Auth Service also manages identity verification — government ID checks for hosts and guests — which is critical for trust in a two-sided marketplace.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'every request being authenticated and verification levels being checked before reaching any service'),
      why: "Trust is Airbnb's core product. The Auth Service manages not just login but verification levels — unverified, email verified, ID verified, Superhost. These levels affect search ranking and booking permissions.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Auth Service',
        'authenticate users and manage verification levels — unverified, email verified, ID verified, Superhost',
        "Trust is Airbnb's core product. Without it, no one would book a stranger's home.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "The Auth Service tracks verification status: email verified, phone verified, government ID verified. Hosts with higher verification get better search placement. Guests with ID verification can book premium listings.",
        'Search Service'
      ),
      messages: [
        msg(
          "Airbnb's auth is more complex than most — it manages verification levels, not just login. Government ID verification for hosts and guests is fundamental to Airbnb's trust model."
        ),
        msg(
          "The Auth Service tracks verification status: email verified, phone verified, government ID verified. Hosts with higher verification get better search placement. Guests with ID verification can book premium listings."
        ),
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth Service added and connected. Now the Search Service.',
      errorMessage: 'Add an Auth Service and connect Load Balancer → Auth Service.',
    }),
    step({
      id: 5,
      title: 'Add the Search Service',
      explanation:
        "Airbnb's Search Service indexes 7 million listings with geo-spatial search. It uses Elasticsearch with custom ranking that factors in host response rate, review score, price, and booking history — returning results in under 200ms.",
      action: buildAction('Microservice', 'Auth', 'Search Service', 'search queries for 7 million listings being processed with geo-spatial ranking'),
      why: "Geo-spatial search requires specialized indexing. Elasticsearch's geo_point field type enables radius searches — 'find all listings within 5km of this coordinate' — which SQL cannot do efficiently.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Search Service',
        'index 7 million listings with geo-spatial search and custom ranking using 50+ signals',
        "When you search 'Paris, July 4-10, 2 guests', the system searches 7 million listings in under 200ms using specialized geo-spatial indexing.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Search Service',
        'Auth Service',
        "The Search Service uses Elasticsearch with geo-spatial indexing. Listings are indexed by location, price, amenities, and availability. The ranking algorithm scores each result using 50+ signals including host response rate and review score.",
        'Availability Service'
      ),
      messages: [
        msg(
          "When you search 'Paris, July 4-10, 2 guests', Airbnb searches 7 million listings in under 200ms. How? Elasticsearch with geo-spatial indexing."
        ),
        msg(
          'The Search Service ranks results using 50+ signals: host response rate, review score, price competitiveness, booking frequency, and more. These signals are updated continuously as guests interact with the platform.'
        ),
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Search Service.'),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Search Service added and connected. Now the Availability Service.',
      errorMessage: 'Add a Microservice (Search Service) and connect Auth Service → Search Service.',
    }),
    step({
      id: 6,
      title: 'Add the Availability Service',
      explanation:
        'The Availability Service manages listing calendars and prevents double bookings. When a guest initiates checkout, the requested dates are locked for 10 minutes using pessimistic locking — preventing race conditions where two guests book the same dates simultaneously.',
      action: buildAction('Availability Service', 'Microservice', 'Availability Service', 'listing calendars being managed and double bookings being prevented through pessimistic locking'),
      why: "Double bookings are catastrophic for Airbnb's trust. Pessimistic locking during checkout ensures that when two guests try to book the same dates simultaneously, only one succeeds.",
      component: component('availability_service', 'Availability'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Availability Service',
        'manage listing calendars and prevent double bookings through pessimistic locking during checkout',
        "When two guests try to book the same listing for the same dates at the same time, only one succeeds — the other sees those dates become unavailable instantly.",
        'Availability Service'
      ),
      celebrationMessage: buildCelebration(
        'Availability Service',
        'Search Service',
        "The Availability Service uses pessimistic locking. When guest A starts checkout, the dates are locked for 10 minutes. Guest B sees those dates as unavailable. Only one booking can succeed — no double bookings.",
        'Pricing Engine'
      ),
      messages: [
        msg(
          "What happens when two guests try to book the same listing for the same dates at the same time? This is the Availability Service's job."
        ),
        msg(
          "It uses pessimistic locking: when guest A starts checkout, the dates are locked for 10 minutes. Guest B sees those dates as unavailable instantly. Only one booking can succeed — no double bookings."
        ),
        msg('Press ⌘K, search for "Availability Service", add it, then connect Search Service → Availability Service.'),
      ],
      requiredNodes: ['availability_service'],
      requiredEdges: [edge('microservice', 'availability_service')],
      successMessage: 'Availability Service added and connected. Now the Pricing Engine.',
      errorMessage: 'Add an Availability Service and connect Search Service → Availability Service.',
    }),
    step({
      id: 7,
      title: 'Add the Pricing Engine',
      explanation:
        "Airbnb's Smart Pricing uses ML trained on 100+ signals — local events, seasonality, competitor pricing, historical demand — to suggest nightly prices to hosts. 50% of hosts use it without modification.",
      action: buildAction('Pricing Engine', 'Microservice', 'Pricing Engine', 'dynamic nightly prices being suggested to hosts based on 100+ ML signals'),
      why: "Dynamic pricing maximizes host revenue and Airbnb's take rate. A listing priced too high sits empty; too low leaves money on the table. ML finds the optimal price for each night.",
      component: component('pricing_engine', 'Pricing'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Pricing Engine',
        'use ML trained on 100+ signals to suggest optimal nightly prices to hosts for each day',
        "50% of hosts accept Airbnb's pricing suggestion without changing it — the ML model is good enough that hosts trust it to maximize revenue.",
        'Pricing Engine'
      ),
      celebrationMessage: buildCelebration(
        'Pricing Engine',
        'Search Service',
        "Smart Pricing trains on 100+ signals: local events, competitor pricing, seasonality, historical booking rates, and demand forecasts. It updates suggestions daily for every active listing.",
        'Booking Service'
      ),
      messages: [
        msg(
          "Airbnb's Smart Pricing suggests nightly rates to hosts using ML. 50% of hosts accept the suggestion without changing it — the ML model is good enough that hosts trust it."
        ),
        msg(
          'The Pricing Engine trains on 100+ signals: local events, competitor pricing, seasonality, historical booking rates, and demand forecasts. It updates suggestions daily for every active listing on the platform.'
        ),
        msg('Press ⌘K, search for "Pricing Engine", add it, then connect Search Service → Pricing Engine.'),
      ],
      requiredNodes: ['pricing_engine'],
      requiredEdges: [edge('microservice', 'pricing_engine')],
      successMessage: 'Pricing Engine added and connected. Now the Booking Service.',
      errorMessage: 'Add a Pricing Engine and connect Search Service → Pricing Engine.',
    }),
    step({
      id: 8,
      title: 'Add the Booking Service',
      explanation:
        'The Booking Service orchestrates the reservation flow: validates availability, calculates total price (nightly rate + cleaning fee + service fee + taxes), processes payment, and notifies host and guest. It uses a saga pattern to handle partial failures.',
      action: buildAction('Microservice', 'Availability', 'Booking Service', 'the complete reservation saga — validating availability, charging the guest, and notifying the host'),
      why: "Booking is a multi-step transaction that must be atomic. If payment succeeds but host notification fails, the booking is still valid. The Booking Service uses a saga pattern to handle partial failures.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Booking Service',
        'orchestrate the complete reservation flow — availability check, price calculation, payment processing, and host notification',
        "The Booking Service uses a saga pattern: lock dates → charge guest → notify host → confirm booking. If any step fails, compensating transactions roll back the previous steps.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Booking Service',
        'Availability Service',
        "It uses a saga pattern: lock dates → charge guest → notify host → confirm booking. If any step fails, compensating transactions roll back the previous steps. This ensures atomicity even across multiple services.",
        'Payment Gateway'
      ),
      messages: [
        msg(
          'The Booking Service orchestrates the entire reservation flow — it is the most critical service in Airbnb architecture.'
        ),
        msg(
          "It uses a saga pattern: lock dates → charge guest → notify host → confirm booking. If any step fails, compensating transactions roll back the previous steps. This ensures atomicity even across multiple services."
        ),
        msg('Press ⌘K, search for "Microservice", add it, then connect Availability Service → Booking Service.'),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('availability_service', 'microservice')],
      successMessage: 'Booking Service added and connected. Now the Payment Gateway.',
      errorMessage: 'Add a Microservice (Booking Service) and connect Availability Service → Booking Service.',
    }),
    step({
      id: 9,
      title: 'Add the Payment Gateway',
      explanation:
        'Airbnb processes two-sided payments: charging guests upfront and paying hosts 24 hours after check-in. The Payment Gateway handles multi-currency, fraud detection, and the escrow-like holding period that protects both parties.',
      action: buildAction('Payment Gateway', 'Microservice', 'Payment Gateway', 'guests being charged upfront and hosts being paid 24 hours after check-in'),
      why: "The 24-hour holding period protects both parties — guests can report issues before the host is paid. This escrow model is fundamental to Airbnb's trust architecture.",
      component: component('payment_gateway', 'Payment'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Payment Gateway',
        'process two-sided payments — charging guests upfront and paying hosts 24 hours after check-in',
        "This 24-hour hold is an escrow mechanism. If a guest arrives and the listing doesn't match the description, they can report it before the host is paid. This single policy is responsible for much of Airbnb's trust.",
        'Payment Gateway'
      ),
      celebrationMessage: buildCelebration(
        'Payment Gateway',
        'Booking Service',
        "Airbnb processes payments in 135+ currencies. The 24-hour hold protects guests: if the listing doesn't match the description, guests can report issues before the host is paid.",
        'Trust & Safety Service'
      ),
      messages: [
        msg(
          "Airbnb's payment model is unique in the industry: guests pay upfront, hosts get paid 24 hours after check-in."
        ),
        msg(
          "The 24-hour hold is an escrow mechanism — if a guest arrives and the listing doesn't match the description, they can report it before the host is paid. This single policy is responsible for much of Airbnb's trust."
        ),
        msg('Press ⌘K, search for "Payment Gateway", add it, then connect Booking Service → Payment Gateway.'),
      ],
      requiredNodes: ['payment_gateway'],
      requiredEdges: [edge('microservice', 'payment_gateway')],
      successMessage: 'Payment Gateway added and connected. Now the Trust & Safety Service.',
      errorMessage: 'Add a Payment Gateway and connect Booking Service → Payment Gateway.',
    }),
    step({
      id: 10,
      title: 'Add the Trust & Safety Service',
      explanation:
        "Airbnb verifies government IDs for all users. The Trust & Safety Service computes a trust score based on verification level, review history, response rate, and booking completion rate — affecting search ranking and booking permissions.",
      action: buildAction('Trust Service', 'Microservice', 'Trust & Safety Service', 'a trust score being computed from verification level, review history, and booking behavior'),
      why: "Trust is Airbnb's core product. Without it, no one would sleep in a stranger's home. The trust score affects search ranking, booking permissions, and fraud detection.",
      component: component('trust_service', 'Trust'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Trust & Safety Service',
        'verify government IDs and compute a trust score that affects search ranking and booking permissions',
        "Would you sleep in a stranger's home? This service is what makes that feel safe enough for 150 million people to do it.",
        'Trust & Safety Service'
      ),
      celebrationMessage: buildCelebration(
        'Trust & Safety Service',
        'Booking Service',
        "It computes a trust score from: ID verification status, review history, response rate, and booking completion rate. Low-trust users can't book premium listings. Hosts with low trust scores get fewer booking inquiries.",
        'Review Service'
      ),
      messages: [
        msg(
          "Would you sleep in a stranger's home? Airbnb's Trust & Safety Service is what makes that feel safe enough for 150 million people to do it."
        ),
        msg(
          "It computes a trust score from: ID verification status, review history, response rate, and booking completion rate. Low-trust users can't book premium listings. Hosts with low trust scores get fewer booking inquiries."
        ),
        msg('Press ⌘K, search for "Trust & Safety Service", add it, then connect Booking Service → Trust & Safety Service.'),
      ],
      requiredNodes: ['trust_service'],
      requiredEdges: [edge('microservice', 'trust_service')],
      successMessage: 'Trust & Safety Service added and connected. Now the Review Service.',
      errorMessage: 'Add a Trust & Safety Service and connect Booking Service → Trust & Safety Service.',
    }),
    step({
      id: 11,
      title: 'Add the Review Service',
      explanation:
        "Airbnb uses a double-blind review system — neither host nor guest can see the other's review until both have submitted or the 14-day window expires. This prevents retaliatory reviews and produces more honest feedback.",
      action: buildAction('Review Service', 'Microservice', 'Review Service', "double-blind reviews being collected — neither party can see the other's feedback until both submit"),
      why: "The double-blind system is a clever mechanism design choice. If hosts could see guest reviews before writing their own, they'd write retaliatory reviews. Blind submission produces more honest feedback.",
      component: component('review_service', 'Review'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'Review Service',
        "implement a double-blind review system where neither party sees the other's feedback until both submit",
        "If hosts could see guest reviews before writing their own, they'd write retaliatory reviews. Blind submission produces more honest feedback — the foundation of trust on the platform.",
        'Review Service'
      ),
      celebrationMessage: buildCelebration(
        'Review Service',
        'Booking Service',
        "Neither host nor guest can see the other's review until both submit or 14 days pass. This prevents retaliation — a host who got a bad review can't write a bad guest review in response. The result is more honest, trustworthy reviews.",
        'NoSQL Database'
      ),
      messages: [
        msg(
          "Airbnb's review system uses a clever trick: double-blind submission. Neither host nor guest can see the other's review until both submit."
        ),
        msg(
          "This prevents retaliation — a host who got a bad review can't write a bad guest review in response. The 14-day window ensures reviews are still relevant even if one party forgets to submit."
        ),
        msg('Press ⌘K, search for "Review Service", add it, then connect Booking Service → Review Service.'),
      ],
      requiredNodes: ['review_service'],
      requiredEdges: [edge('microservice', 'review_service')],
      successMessage: 'Review Service added and connected. Now the data layer.',
      errorMessage: 'Add a Review Service and connect Booking Service → Review Service.',
    }),
    step({
      id: 12,
      title: 'Add the Data Layer',
      explanation:
        'Airbnb stores listing data, user profiles, and booking history in a NoSQL database. Frequently accessed listings and search results are cached in Redis — sub-millisecond reads for the most popular destination searches.',
      action: buildAction(
        'NoSQL Database',
        'Microservice',
        'NoSQL Database',
        'all listing data, user profiles, and booking history being persisted in a schema-flexible document store'
      ),
      why: "Listing data has a flexible schema — different property types have different amenities. NoSQL handles this without schema migrations. Redis caches search results so popular destination searches don't hit the database.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'Airbnb',
        'NoSQL Database and In-Memory Cache',
        'persist listing data with a flexible schema and cache popular search results in sub-millisecond Redis reads',
        "Listing data is flexible — a treehouse has different amenities than a city apartment. NoSQL's document model handles this without expensive schema migrations. Redis caches the most popular searches so they never hit the database.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'Data Layer',
        'Search Service',
        "Airbnb stores 7 million listings with flexible schemas — different property types have different amenities and metadata. NoSQL handles this without schema migrations. Popular destination searches are cached in Redis in under 1ms.",
        'nothing else — you have built Airbnb'
      ),
      connectingMessage:
        "NoSQL Database and In-Memory Cache are on the canvas. Connect Search Service → NoSQL Database and Search Service → In-Memory Cache. Listings are stored with flexible schemas — different property types have different metadata fields. Popular searches are cached so millions of identical queries never hit the database.",
      messages: [
        msg(
          "Final step — the data layer. Listing data has a flexible schema — a treehouse has different amenities than a city apartment. NoSQL's document model handles this without expensive schema migrations."
        ),
        msg(
          "Redis caches the top search results for popular destinations like 'Paris, next weekend'. These searches are queried millions of times — serving them from Redis takes under 1ms instead of 20-50ms from the database."
        ),
        msg(
          'Press ⌘K, search for "NoSQL Database", add it. Then search for "In-Memory Cache", add that too. Connect Search Service → NoSQL Database and Search Service → In-Memory Cache.'
        ),
      ],
      requiredNodes: ['nosql_db', 'in_memory_cache'],
      requiredEdges: [edge('microservice', 'nosql_db'), edge('microservice', 'in_memory_cache')],
      successMessage: 'Data layer complete. You have built Airbnb.',
      errorMessage: 'Add both NoSQL Database and In-Memory Cache and connect them from the Search Service.',
    }),
  ],
});

// ── Level 2 — Production Ready (9 steps) ─────────────────────────────────────

const l2 = level({
  level: 2,
  title: 'Production Ready',
  subtitle: 'Scale to millions of concurrent bookings',
  description:
    "Your marketplace foundation works. Now add what Airbnb actually ships: Kafka for booking events, notification workers, SQL for user data, CDC for analytics, structured logging, and SLO tracking.",
  estimatedTime: '~25 mins',
  unlocks: 'Expert Architecture',
  prerequisite: 'Builds on your Level 1 diagram',
  contextMessage:
    "Level 2: Production Ready. Your marketplace connects guests and hosts. Now add Kafka event streaming, notifications, SQL, CDC analytics, structured logging, and SLO tracking.",
  steps: [
    step({
      id: 1,
      title: 'Add Kafka Streaming',
      explanation:
        "Every booking, cancellation, review, and search is published to Kafka. The pricing ML pipeline consumes booking events to train dynamic pricing models. Analytics pipelines consume search data for demand forecasting.",
      action: buildAction(
        'Kafka / Streaming',
        'Load Balancer',
        'Kafka Streaming',
        'every booking, cancellation, and search being streamed to pricing and analytics consumers in real time'
      ),
      why: "Without Kafka, pricing ML models would require synchronous database queries. Kafka decouples event producers from consumers — the booking path stays fast regardless of downstream processing.",
      component: component('kafka_streaming', 'Kafka / Streaming', 'Kafka / Streaming'),
      openingMessage: buildOpeningL2(
        'Airbnb',
        'Kafka',
        'stream every booking and search to pricing and analytics consumers in real time',
        'Without Kafka, pricing ML models would require synchronous database queries.',
        'Kafka / Streaming'
      ),
      celebrationMessage: buildCelebration(
        'Kafka Streaming',
        'Load Balancer',
        "Airbnb publishes billions of booking events per day to Kafka. Dynamic pricing models train on this data. Analytics pipelines consume search data for demand forecasting across markets.",
        'Notification Worker'
      ),
      messages: [
        msg("Level 2 — Production Ready. Every booking, cancellation, and search is published to Kafka for downstream consumers."),
        msg("Dynamic pricing models train weekly on booking events. Analytics pipelines consume search data for demand forecasting across markets."),
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
        "Notification workers consume Kafka events to send push notifications — booking confirmations, host responses, review reminders, and price drop alerts for saved listings.",
      action: buildAction(
        'Worker',
        'Kafka',
        'Notification Worker',
        'booking confirmations and host responses being sent via push notifications asynchronously'
      ),
      why: "If Airbnb sent notifications synchronously, slow push delivery could delay the booking response. Background workers handle notification delivery asynchronously.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL2(
        'Airbnb',
        'Notification Worker',
        'deliver booking confirmations and host responses asynchronously via push notifications',
        'Synchronous notifications would delay booking responses — background workers handle delivery asynchronously.',
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Notification Worker',
        'Kafka Streaming',
        "Airbnb's notification workers deliver booking confirmations, host responses, and review reminders via push notifications. All delivery is asynchronous — booking responses are never delayed by notification delivery.",
        'CDC Connector'
      ),
      messages: [
        msg("Notification workers consume Kafka events to send booking confirmations and host responses."),
        msg("All notification delivery is asynchronous — booking responses are never delayed by slow push delivery."),
        msg('Press ⌘K, search for "Worker / Background Job", add it, then connect Kafka Streaming → Notification Worker.'),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('kafka_streaming', 'worker_job')],
      successMessage: 'Notifications added. Now CDC for analytics.',
      errorMessage: 'Add a Worker connected from Kafka Streaming.',
    }),
    step({
      id: 3,
      title: 'Add CDC Connector (Debezium)',
      explanation:
        "The CDC Connector captures row-level changes from Airbnb's NoSQL database and streams them to Kafka for analytics — listing updates, booking changes, and review submissions without adding load to the production database.",
      action: buildAction(
        'CDC Connector (Debezium)',
        'NoSQL Database',
        'CDC Connector',
        'listing and booking changes being captured from the NoSQL transaction log and streamed to Kafka for analytics'
      ),
      why: "Without CDC, analytics queries would require direct database reads that add load to the production database. CDC captures changes from the transaction log — zero production query overhead.",
      component: component('cdc_connector', 'CDC Connector (Debezium)'),
      openingMessage: buildOpeningL2(
        'Airbnb',
        'CDC Connector (Debezium)',
        'capture listing and booking changes from the NoSQL transaction log and stream to Kafka — zero production query overhead',
        'Without CDC, analytics queries add load to the production database — CDC captures changes from the transaction log.',
        'CDC Connector (Debezium)'
      ),
      celebrationMessage: buildCelebration(
        'CDC Connector',
        'NoSQL Database',
        "Airbnb's CDC Connector captures every listing update and booking change from the NoSQL transaction log — streaming to Kafka for analytics without adding load to the production database.",
        'SQL Database'
      ),
      messages: [
        msg("CDC Connector captures row-level changes from the NoSQL database and streams them to Kafka for analytics."),
        msg("Without CDC, analytics queries would add load to the production database. CDC captures changes from the transaction log — zero query overhead."),
        msg('Press ⌘K, search for "CDC Connector (Debezium)", add it, then connect NoSQL Database → CDC Connector.'),
      ],
      requiredNodes: ['cdc_connector'],
      requiredEdges: [edge('nosql_db', 'cdc_connector')],
      successMessage: 'CDC added. Now SQL for user data.',
      errorMessage: 'Add a CDC Connector connected from the NoSQL Database.',
    }),
    step({
      id: 4,
      title: 'Add SQL Database',
      explanation:
        "Airbnb stores user profiles, payout records, and host earnings in PostgreSQL. Financial data requires ACID transactions — host earnings calculations must be accurate and auditable.",
      action: buildAction(
        'SQL Database',
        'Auth Service',
        'SQL Database',
        'user profiles and host earnings being stored with ACID guarantees for financial compliance'
      ),
      why: "Host earnings and payout records require auditable, ACID-compliant records. A missing booking from a host's earnings is a legal issue.",
      component: component('sql_db', 'SQL Database'),
      openingMessage: buildOpeningL2(
        'Airbnb',
        'SQL Database',
        'store host earnings and payout records with ACID guarantees for financial compliance',
        'Host earnings require auditable, ACID-compliant records — eventual consistency is unacceptable.',
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Auth Service',
        "Airbnb stores host earnings and payout records in PostgreSQL with full ACID compliance. Every booking is recorded exactly once for the revenue calculation — auditable and legally compliant.",
        'Structured Logger'
      ),
      messages: [
        msg("User profiles, payout records, and host earnings need ACID compliance. PostgreSQL stores the authoritative financial records."),
        msg("Host earnings calculations must be accurate and auditable. ACID transactions ensure every booking is recorded exactly once."),
        msg('Press ⌘K, search for "SQL Database", add it, then connect Auth Service → SQL Database.'),
      ],
      requiredNodes: ['sql_db'],
      requiredEdges: [edge('auth_service', 'sql_db')],
      successMessage: 'SQL added. Now structured logging.',
      errorMessage: 'Add a SQL Database connected from the Auth Service.',
    }),
    step({
      id: 5,
      title: 'Add Structured Logger',
      explanation:
        "Airbnb's Structured Logger emits JSON-formatted logs with consistent field schemas — booking_id, guest_id, host_id, event_type, price. LogQL queries aggregate metrics across billions of logs per day.",
      action: buildAction(
        'Structured Logger',
        'Load Balancer',
        'Structured Logger',
        'JSON-formatted booking traces being emitted with consistent schemas for booking_id, guest_id, and event_type'
      ),
      why: "Text logs require regex parsing — slow and error-prone at scale. Structured JSON logs enable LogQL queries that aggregate metrics across billions of entries in seconds.",
      component: component('structured_logger', 'Structured Logger'),
      openingMessage: buildOpeningL2(
        'Airbnb',
        'Structured Logger',
        'emit JSON logs with consistent field schemas for booking_id, guest_id, and event_type across all services',
        'Text logs require regex parsing — structured JSON enables fast LogQL aggregation across billions of entries.',
        'Structured Logger'
      ),
      celebrationMessage: buildCelebration(
        'Structured Logger',
        'Load Balancer',
        "Airbnb's Structured Logger emits JSON with consistent schemas: booking_id, guest_id, host_id, event_type, price. LogQL queries aggregate booking metrics across billions of entries — enabling real-time demand detection.",
        'SLO/SLI Tracker'
      ),
      messages: [
        msg("Structured Logger emits JSON-formatted logs with consistent schemas — booking_id, guest_id, host_id, event_type, price."),
        msg("LogQL queries aggregate metrics across billions of logs per day in seconds. Demand forecasting and anomaly detection use structured log queries."),
        msg('Press ⌘K, search for "Structured Logger", add it, then connect Load Balancer → Structured Logger.'),
      ],
      requiredNodes: ['structured_logger'],
      requiredEdges: [edge('load_balancer', 'structured_logger')],
      successMessage: 'Structured logging added. Now SLO tracking.',
      errorMessage: 'Add a Structured Logger connected from the Load Balancer.',
    }),
    step({
      id: 6,
      title: 'Add SLO/SLI Tracker',
      explanation:
        "Airbnb's SLO/SLI Tracker monitors search latency, booking success rate, and payment processing time against defined Service Level Objectives. Search latency SLO: 99.9% of searches return results within 200ms.",
      action: buildAction(
        'SLO/SLI Tracker',
        'Metrics Collector',
        'SLO/SLI Tracker',
        'search latency and booking success rate being tracked against SLOs — alerting when error budgets burn'
      ),
      why: "Without SLOs, engineering teams argue about what 'good' means. With SLOs, there's a clear contractual target — search must return within 200ms for 99.9% of requests.",
      component: component('slo_tracker', 'SLO/SLI Tracker'),
      openingMessage: buildOpeningL2(
        'Airbnb',
        'SLO/SLI Tracker',
        'monitor search latency and booking success rate against defined SLO targets',
        'Without SLOs, engineering teams argue about what acceptable performance means.',
        'SLO/SLI Tracker'
      ),
      celebrationMessage: buildCelebration(
        'SLO/SLI Tracker',
        'Metrics Collector',
        "Airbnb's SLO: 99.9% of searches return results within 200ms. The SLO/SLI Tracker alerts when error budgets burn — pages on-call before guests notice slow searches.",
        'Error Budget Monitor'
      ),
      messages: [
        msg("The SLO/SLI Tracker monitors search latency, booking success rate, and payment processing time against defined Service Level Objectives."),
        msg("Airbnb's search latency SLO: 99.9% of searches return results within 200ms. When latency exceeds the error budget, on-call is paged."),
        msg('Press ⌘K, search for "SLO/SLI Tracker", add it, then connect Metrics Collector → SLO/SLI Tracker.'),
      ],
      requiredNodes: ['slo_tracker'],
      requiredEdges: [edge('metrics_collector', 'slo_tracker')],
      successMessage: 'SLO tracking added. Now error budgets.',
      errorMessage: 'Add an SLO/SLI Tracker connected from the Metrics Collector.',
    }),
    step({
      id: 7,
      title: 'Add Error Budget Monitor',
      explanation:
        "Airbnb's Error Budget Monitor tracks remaining reliability budget for search latency SLO. When the error budget burns faster than acceptable, feature launches pause until reliability improves.",
      action: buildAction(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        'Error Budget Monitor',
        'error budget burn rate being tracked — pausing feature launches when budget depletes faster than acceptable'
      ),
      why: "The error budget is the 'spare' reliability. When depleted, feature launches pause. For marketplaces, reliability is non-negotiable — a slow search means lost bookings.",
      component: component('error_budget_alert', 'Error Budget Monitor'),
      openingMessage: buildOpeningL2(
        'Airbnb',
        'Error Budget Monitor',
        'track error budget burn rate — pausing feature launches when budget depletes to protect reliability',
        'For marketplaces, reliability is non-negotiable — a slow search means lost bookings.',
        'Error Budget Monitor'
      ),
      celebrationMessage: buildCelebration(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        "Airbnb's error budget policy: when more than 10% of the monthly budget burns in a week, feature launches pause. Engineering prioritizes reliability until the budget recovers — protecting guest experience.",
        'Level 3'
      ),
      messages: [
        msg("The Error Budget Monitor tracks remaining reliability budget for search latency SLO."),
        msg("When the error budget burns faster than acceptable, feature launches pause until reliability improves. For marketplaces, a slow search means lost bookings."),
        msg('Press ⌘K, search for "Error Budget Monitor", add it, then connect SLO/SLI Tracker → Error Budget Monitor.'),
      ],
      requiredNodes: ['error_budget_alert'],
      requiredEdges: [edge('slo_tracker', 'error_budget_alert')],
      successMessage: 'Error budget monitoring added. Airbnb is now production-ready.',
      errorMessage: 'Add an Error Budget Monitor connected from the SLO/SLI Tracker.',
    }),
  ],
});

// ── Level 3 — Expert Architecture (11 steps) ───────────────────────────────────

const l3 = level({
  level: 3,
  title: 'Expert Architecture',
  subtitle: 'Design like an Airbnb senior engineer',
  description:
    "You have production Airbnb. Now add what separates senior engineers — service mesh, GraphQL Federation, token bucket rate limiting, distributed tracing with correlation IDs, mTLS for service authentication, cache stampede prevention, and event sourcing for bookings.",
  estimatedTime: '~30 mins',
  prerequisite: 'Builds on your Level 2 diagram',
  contextMessage:
    "Level 3: Expert Architecture. Add service mesh, GraphQL Federation, advanced rate limiting, distributed tracing, mTLS, cache stampede prevention, and event sourcing.",
  steps: [
    step({
      id: 1,
      title: 'Add Service Mesh (Istio)',
      explanation:
        "Airbnb's Service Mesh uses Istio to manage all east-west traffic between services — automatic mTLS encryption, circuit breaking, retries, and load balancing at the sidecar proxy level.",
      action: buildAction(
        'Service Mesh (Istio)',
        'Load Balancer',
        'Service Mesh',
        'automatic mTLS and traffic management being enforced at the sidecar proxy level for all service-to-service communication'
      ),
      why: "Without a service mesh, each service implements TLS, circuit breaking, and retries differently. Istio handles this transparently at the infrastructure layer.",
      component: component('service_mesh', 'Service Mesh (Istio)'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'Service Mesh (Istio)',
        'automatic mTLS, circuit breaking, and traffic policies enforced at the sidecar proxy level across all services',
        'Without a service mesh, each service implements TLS, retries, and circuit breaking differently.',
        'Service Mesh (Istio)'
      ),
      celebrationMessage: buildCelebration(
        'Service Mesh',
        'Load Balancer',
        "Airbnb's service mesh handles billions of service-to-service calls per day. Every call is encrypted with mTLS — no service code changes required. The Control Plane pushes traffic policies across the cluster instantly.",
        'GraphQL Federation Gateway'
      ),
      messages: [
        msg("Level 3 — Expert Architecture. The Service Mesh (Istio) adds sidecar proxies to every pod — handling mTLS, retries, circuit breaking, and load balancing transparently."),
        msg("Automatic mTLS encrypts every service-to-service call. The Control Plane distributes traffic policies across all sidecars instantly."),
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
        "Airbnb's GraphQL Federation Gateway combines listing, booking, and review schemas into a unified supergraph. Mobile clients query one endpoint — the gateway fans out to multiple subgraphs and composes the response.",
      action: buildAction(
        'GraphQL Federation Gateway',
        'API Gateway',
        'GraphQL Federation Gateway',
        'listing, booking, and review schemas being composed into a unified API from multiple subgraphs'
      ),
      why: "Without Federation, clients make multiple round trips to different REST endpoints. GraphQL Federation lets clients fetch all needed data in a single query.",
      component: component('graphql_federation', 'GraphQL Federation Gateway'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'GraphQL Federation Gateway',
        'compose listing, booking, and review schemas into a unified supergraph from multiple subgraphs',
        'Without Federation, clients make multiple round trips — GraphQL reduces this to one.',
        'GraphQL Federation Gateway'
      ),
      celebrationMessage: buildCelebration(
        'GraphQL Federation Gateway',
        'API Gateway',
        "Airbnb's GraphQL Federation Gateway serves the mobile app with a unified API — one query fetches listings, bookings, and reviews. Mobile API calls reduced by 60%, latency reduced by 40%.",
        'Token Bucket Rate Limiter'
      ),
      messages: [
        msg("GraphQL Federation combines listing, booking, and review schemas into a unified supergraph."),
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
        "Airbnb's Token Bucket Rate Limiter enforces API quotas using the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate. Hosts managing multiple listings get larger buckets.",
      action: buildAction(
        'Token Bucket Rate Limiter',
        'API Gateway',
        'Token Bucket Rate Limiter',
        'API quotas being enforced with burst allowance using the token bucket algorithm — hosts get larger buckets'
      ),
      why: "Fixed rate limiting cannot handle legitimate bursts. Hosts updating multiple listings need burst capacity — the token bucket allows this while maintaining average limits.",
      component: component('token_bucket_limiter', 'Token Bucket Rate Limiter'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'Token Bucket Rate Limiter',
        'enforce API quotas with burst allowance — hosts managing multiple listings get larger token buckets',
        'Fixed rate limiting cannot handle legitimate bursts — token bucket allows bursts while maintaining average limits.',
        'Token Bucket Rate Limiter'
      ),
      celebrationMessage: buildCelebration(
        'Token Bucket Rate Limiter',
        'API Gateway',
        "Airbnb's token bucket rate limiter allows hosts to burst listing update requests — a host updating 10 listings can use their full bucket. Casual users get smaller buckets. The steady average rate prevents abuse.",
        'OpenTelemetry Collector'
      ),
      messages: [
        msg("Token Bucket Rate Limiter uses the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate."),
        msg("Hosts managing multiple listings get larger buckets. The steady average rate prevents abuse while enabling legitimate bursts."),
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
        "Airbnb's OpenTelemetry Collector receives traces, metrics, and logs from all services — processing and exporting to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs.",
      action: buildAction(
        'OpenTelemetry Collector',
        'Structured Logger',
        'OpenTelemetry Collector',
        'traces, metrics, and logs being aggregated and exported to multiple backends from a single unified collector'
      ),
      why: "Without OTel, each service uses different tracing libraries. The OTel Collector normalizes everything — one instrumentation, multiple backends.",
      component: component('otel_collector', 'OpenTelemetry Collector'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'OpenTelemetry Collector',
        'unified telemetry pipeline for traces, metrics, and logs with multi-backend export',
        'Without OTel, each service uses different tracing libraries — the OTel Collector normalizes everything.',
        'OpenTelemetry Collector'
      ),
      celebrationMessage: buildCelebration(
        'OpenTelemetry Collector',
        'Structured Logger',
        "Airbnb's OTel Collector processes billions of spans per day. One instrumentation exports to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs — three backends, zero per-service configuration.",
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
        "The Correlation ID Injector assigns a unique trace ID to every request that propagates via HTTP headers across all service calls — enabling end-to-end request tracing from the mobile client through search, booking, and payment.",
      action: buildAction(
        'Correlation ID Injector',
        'otel_collector',
        'Correlation ID Injector',
        'unique trace IDs being propagated across all service calls for end-to-end request visibility'
      ),
      why: "Without correlation IDs, debugging a failed booking requires checking logs from the search service, availability service, pricing engine, and payment gateway separately. Correlation IDs link all logs under one trace.",
      component: component('correlation_id_handler', 'Correlation ID Injector'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'Correlation ID Injector',
        'propagate unique trace IDs across all service calls for instant cross-service log correlation',
        'Without correlation IDs, debugging failed bookings requires checking logs from 5+ services separately.',
        'Correlation ID Injector'
      ),
      celebrationMessage: buildCelebration(
        'Correlation ID Injector',
        'OpenTelemetry Collector',
        "Airbnb's correlation IDs flow through every service call: API Gateway → Search Service → Availability Service → Pricing Engine → Booking Service → Payment Gateway. All logs under one trace ID — instant debugging of failed bookings.",
        'mTLS Certificate Authority'
      ),
      messages: [
        msg("The Correlation ID Injector generates a unique trace ID at request entry and propagates it via HTTP headers through every service call."),
        msg("All logs for a booking request share one correlation ID — instant debugging across Search, Availability, Pricing, Booking, and Payment services."),
        msg('Press ⌘K, search for "Correlation ID Injector", add it, then connect OpenTelemetry Collector → Correlation ID Injector.'),
      ],
      requiredNodes: ['correlation_id_handler'],
      requiredEdges: [edge('otel_collector', 'correlation_id_handler')],
      successMessage: 'Correlation IDs added. Now mTLS.',
      errorMessage: 'Add a Correlation ID Injector connected from the OpenTelemetry Collector.',
    }),
    step({
      id: 6,
      title: 'Add mTLS Certificate Authority',
      explanation:
        "Airbnb's mTLS Certificate Authority issues and rotates TLS certificates for all service-to-service authentication — enabling mutual TLS where both client and server verify each other. Certificates rotate automatically every 24 hours.",
      action: buildAction(
        'mTLS Certificate Authority',
        'Service Mesh',
        'mTLS Certificate Authority',
        'TLS certificates being issued and rotated automatically every 24 hours for service-to-service authentication'
      ),
      why: "mTLS ensures that only authorized services can communicate with each other. Automatic certificate rotation prevents expired certificates from causing outages.",
      component: component('mtls_certificate_authority', 'mTLS Certificate Authority'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'mTLS Certificate Authority',
        'issue and rotate TLS certificates automatically every 24 hours for mutual service-to-service authentication',
        'mTLS ensures only authorized services communicate — automatic rotation prevents certificate expiration outages.',
        'mTLS Certificate Authority'
      ),
      celebrationMessage: buildCelebration(
        'mTLS Certificate Authority',
        'Service Mesh',
        "Airbnb's mTLS CA issues certificates that rotate every 24 hours automatically. Every service-to-service call verifies both client and server certificates — even if one service is compromised, it cannot impersonate another.",
        'Cache Stampede Prevention'
      ),
      messages: [
        msg("mTLS Certificate Authority issues and rotates TLS certificates for all service-to-service authentication."),
        msg("Mutual TLS ensures both client and server verify each other. Automatic rotation every 24 hours prevents expired certificates from causing outages."),
        msg('Press ⌘K, search for "mTLS Certificate Authority", add it, then connect Service Mesh → mTLS CA.'),
      ],
      requiredNodes: ['mtls_certificate_authority'],
      requiredEdges: [edge('service_mesh', 'mtls_certificate_authority')],
      successMessage: 'mTLS CA added. Now cache stampede prevention.',
      errorMessage: 'Add an mTLS Certificate Authority connected from the Service Mesh.',
    }),
    step({
      id: 7,
      title: 'Add Cache Stampede Prevention',
      explanation:
        "When a popular listing's cache expires during high demand, Airbnb's Cache Stampede Prevention uses probabilistic early expiration and distributed locking — ensuring only one request rebuilds the cache instead of thousands causing a thundering herd.",
      action: buildAction(
        'Cache Stampede Prevention',
        'In-Memory Cache',
        'Cache Stampede Prevention',
        'thundering herd being prevented when cache expires using probabilistic early expiration and distributed locking'
      ),
      why: "Without cache stampede prevention, when a popular listing's cache expires during peak booking season, thousands of concurrent requests hit the NoSQL database simultaneously — a thundering herd that can take down the database.",
      component: component('cache_stampede_guard', 'Cache Stampede Prevention'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'Cache Stampede Prevention',
        'prevent thundering herd when cache expires using probabilistic early expiration — only one request rebuilds cache',
        'Without stampede prevention, cache expiration causes thousands of concurrent database requests.',
        'Cache Stampede Prevention'
      ),
      celebrationMessage: buildCelebration(
        'Cache Stampede Prevention',
        'In-Memory Cache',
        "Airbnb's Cache Stampede Prevention uses probabilistic early expiration — popular listing cache expires with 10% probability before the TTL. When TTL hits, 10% of requests rebuild the cache instead of 100%. Thundering herd prevented.",
        'Change Data Cache'
      ),
      messages: [
        msg("Cache Stampede Prevention uses probabilistic early expiration — when TTL approaches, requests have a 10% chance of rebuilding the cache early."),
        msg("Instead of thousands of requests hitting NoSQL when cache expires, only ~10% rebuild — the thundering herd is prevented."),
        msg('Press ⌘K, search for "Cache Stampede Prevention", add it, then connect In-Memory Cache → Cache Stampede Prevention.'),
      ],
      requiredNodes: ['cache_stampede_guard'],
      requiredEdges: [edge('in_memory_cache', 'cache_stampede_guard')],
      successMessage: 'Cache stampede prevention added. Now CDC-driven cache.',
      errorMessage: 'Add a Cache Stampede Prevention connected from the In-Memory Cache.',
    }),
    step({
      id: 8,
      title: 'Add Change Data Cache',
      explanation:
        "Airbnb's Change Data Cache uses CDC from the NoSQL database to know exactly when listing data changes — invalidating cached entries precisely when source data changes instead of waiting for TTL expiration.",
      action: buildAction(
        'Change Data Cache',
        'NoSQL Database',
        'Change Data Cache',
        'cache entries being invalidated precisely when source data changes using CDC from the NoSQL transaction log'
      ),
      why: "Without CDC, cache invalidation relies on TTL — stale data persists until expiration. CDC captures every database write and invalidates the exact corresponding cache entry — zero staleness.",
      component: component('change_data_cache', 'Change Data Cache'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'Change Data Cache',
        'invalidate cache entries precisely when source data changes using CDC from the NoSQL transaction log',
        'Without CDC, cache relies on TTL — stale data persists. CDC invalidates exact entries when data changes.',
        'Change Data Cache'
      ),
      celebrationMessage: buildCelebration(
        'Change Data Cache',
        'NoSQL Database',
        "Airbnb's CDC connector captures every listing update from the NoSQL transaction log — immediately invalidating the corresponding cache entry. Price changes reflect instantly, no stale data.",
        'Data Warehouse'
      ),
      messages: [
        msg("Change Data Cache uses CDC from the NoSQL transaction log to know exactly when listing data changes."),
        msg("Instead of waiting for TTL expiration, CDC captures every database write and invalidates the exact corresponding cache entry — zero staleness."),
        msg('Press ⌘K, search for "Change Data Cache", add it, then connect NoSQL Database → Change Data Cache.'),
      ],
      requiredNodes: ['change_data_cache'],
      requiredEdges: [edge('nosql_db', 'change_data_cache')],
      successMessage: 'CDC-driven cache added. Now the analytics pipeline.',
      errorMessage: 'Add a Change Data Cache connected from the NoSQL Database.',
    }),
    step({
      id: 9,
      title: 'Add Data Warehouse',
      explanation:
        "Airbnb's Data Warehouse stores all historical booking data — demand patterns, pricing trends, host performance. It powers the business intelligence that guides market expansion and pricing strategy.",
      action: buildAction(
        'Data Warehouse',
        'CDC Connector',
        'Data Warehouse',
        'all historical booking and demand data being stored for business intelligence and pricing ML training'
      ),
      why: "The NoSQL database answers 'what is this listing's availability right now?' The Data Warehouse answers 'what are the booking trends in Barcelona over the past year?' — different query patterns requiring different storage.",
      component: component('data_warehouse', 'Data Warehouse'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'Data Warehouse',
        'columnar analytics storage for booking trends and pricing patterns across years of data',
        'The NoSQL database cannot answer multi-year trend questions — that needs a data warehouse.',
        'Data Warehouse'
      ),
      celebrationMessage: buildCelebration(
        'Data Warehouse',
        'CDC Connector',
        "Airbnb's data warehouse processes petabytes of booking data. Market expansion decisions, host incentive programs, and pricing ML training all use this data — guiding what 150M guests see.",
        'Saga Orchestrator'
      ),
      messages: [
        msg("Data Warehouse stores all historical booking data for business intelligence and pricing ML training."),
        msg("The NoSQL database cannot answer multi-year demand trend questions — columnar storage optimized for analytics is required."),
        msg('Press ⌘K, search for "Data Warehouse", add it, then connect CDC Connector → Data Warehouse.'),
      ],
      requiredNodes: ['data_warehouse'],
      requiredEdges: [edge('cdc_connector', 'data_warehouse')],
      successMessage: 'Analytics pipeline added. Now saga orchestration.',
      errorMessage: 'Add a Data Warehouse connected from the CDC Connector.',
    }),
    step({
      id: 10,
      title: 'Add Saga Orchestrator',
      explanation:
        "Airbnb's Saga Orchestrator coordinates the booking saga across availability locking, pricing calculation, payment processing, and host notification — using compensating actions when any step fails.",
      action: buildAction(
        'Saga Orchestrator',
        'Booking Service',
        'Saga Orchestrator',
        'booking saga being coordinated across availability, pricing, payment, and notifications using compensating actions'
      ),
      why: "Without saga orchestration, a failed payment after availability lock would leave stale locks. The saga coordinates rollback automatically across all services.",
      component: component('saga_orchestrator', 'Saga Orchestrator'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'Saga Orchestrator',
        'coordinate booking saga across availability, pricing, payment, and notifications using compensating actions',
        'Without saga orchestration, failed bookings leave stale availability locks — the saga coordinates rollback.',
        'Saga Orchestrator'
      ),
      celebrationMessage: buildCelebration(
        'Saga Orchestrator',
        'Booking Service',
        "Airbnb's Saga Orchestrator coordinates the booking saga: lock availability → calculate price → process payment → notify host. If payment fails, compensating actions release the availability lock automatically.",
        'Event Store'
      ),
      messages: [
        msg("Saga Orchestrator coordinates the booking saga across availability, pricing, payment, and notifications."),
        msg("If any step fails, compensating actions roll back the entire booking automatically. No stale availability locks left behind."),
        msg('Press ⌘K, search for "Saga Orchestrator", add it, then connect Booking Service → Saga Orchestrator.'),
      ],
      requiredNodes: ['saga_orchestrator'],
      requiredEdges: [edge('microservice', 'saga_orchestrator')],
      successMessage: 'Saga orchestration added. Now event sourcing.',
      errorMessage: 'Add a Saga Orchestrator connected from the Booking Service.',
    }),
    step({
      id: 11,
      title: 'Add Event Store',
      explanation:
        "Airbnb's Event Store (EventStoreDB) maintains an immutable log of all booking lifecycle events — created, modified, cancelled, refunded. The entire booking history can be reconstructed by replaying events for audit and dispute resolution.",
      action: buildAction(
        'Event Store (EventStoreDB)',
        'Booking Service',
        'Event Store',
        'immutable event log being maintained for booking lifecycle — enabling audit trails and state reconstruction by replay'
      ),
      why: "Booking disputes require a complete audit trail. The Event Store provides immutable evidence of every booking decision — critical for legal and regulatory compliance.",
      component: component('event_store', 'Event Store (EventStoreDB)'),
      openingMessage: buildOpeningL3(
        'Airbnb',
        'Event Store (EventStoreDB)',
        'immutable event log for booking lifecycle enabling audit trails and state reconstruction for dispute resolution',
        'Booking disputes require a complete audit trail — the Event Store provides immutable evidence.',
        'Event Store (EventStoreDB)'
      ),
      celebrationMessage: buildCelebration(
        'Event Store',
        'Booking Service',
        "Airbnb's Event Store maintains an immutable log of every booking lifecycle event — created, modified, cancelled, refunded. The entire booking history can be reconstructed by replaying events. This completes the expert architecture.",
        'completion'
      ),
      messages: [
        msg("Event Store (EventStoreDB) maintains an immutable log of all booking lifecycle events — created, modified, cancelled, refunded."),
        msg("The entire booking history can be reconstructed by replaying events. Booking disputes require a complete audit trail — the Event Store provides immutable evidence for legal and regulatory compliance."),
        msg('Press ⌘K, search for "Event Store (EventStoreDB)", add it, then connect Booking Service → Event Store. This completes the expert architecture!'),
      ],
      requiredNodes: ['event_store'],
      requiredEdges: [edge('microservice', 'event_store')],
      successMessage: "Expert architecture complete! You've designed Airbnb at the senior engineer level.",
      errorMessage: 'Add an Event Store connected from the Booking Service.',
    }),
  ],
});

export const airbnbTutorial: Tutorial = tutorial({
  id: 'airbnb-architecture',
  title: 'How to Design Airbnb Architecture',
  description:
    'Build a global home rental marketplace. Master availability calendars, search with geo-filtering, dynamic pricing, trust systems, and two-sided payment flows.',
  difficulty: 'Advanced',
  category: 'Marketplace',
  isLive: false,
  icon: 'Home',
  color: '#ff5a5f',
  tags: ['Search', 'Pricing', 'Booking', 'Trust', 'Payments'],
  estimatedTime: '~89 mins',
  levels: [l1, l2, l3],
});
