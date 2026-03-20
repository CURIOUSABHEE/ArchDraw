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
  estimatedTime: '~34 mins',
  levels: [l1],
});
