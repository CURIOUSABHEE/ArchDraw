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
  title: 'E-Commerce Platform',
  subtitle: 'Build an e-commerce platform in 12 steps',
  description:
    'Build an e-commerce platform for 2 million merchants processing $235B in annual sales. Learn cart management, inventory locking, checkout flows, payment processing, and Black Friday traffic spikes.',
  estimatedTime: '~30 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build Shopify from scratch. 2 million merchants, $235 billion in annual sales, and a Black Friday peak of 4.2 million orders per hour. The hardest problem: a merchant with 10 orders/day and one with 10 million orders/day run on the same infrastructure.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "Shopify's web client is the storefront — the customer-facing shop. Each merchant has a custom storefront built on Shopify's theme system. The client handles product browsing, cart management, and checkout.",
      action: buildFirstStepAction('Web'),
      why: "Shopify powers 2 million storefronts, each with a unique domain and theme. The web client must be fast — a 1-second delay in page load reduces conversions by 7%. Shopify uses a CDN to serve storefronts from edge locations.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Web Client',
        'serve 2 million unique storefronts with fast page loads from edge locations',
        "Shopify powers 2 million storefronts, each with a unique domain and theme. A 1-second delay in page load reduces conversions by 7% — performance is critical for every merchant, from small businesses to enterprise.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Shopify powers 2 million storefronts, each with a unique domain and theme. The web client handles product browsing, cart management, and checkout for merchants of all sizes.",
        'CDN'
      ),
      messages: [
        msg(
          "Welcome to the Shopify Architecture tutorial. 2 million merchants, $235 billion in annual sales, and a Black Friday peak of 4.2 million orders per hour."
        ),
        msg(
          "Shopify's hardest problem: a merchant with 10 orders/day and one with 10 million orders/day run on the same infrastructure. The architecture must scale from zero to viral without any merchant-specific configuration."
        ),
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Web Client added. Now the CDN layer.',
      errorMessage: 'Add a Web Client node to the canvas first.',
    }),
    step({
      id: 2,
      title: 'Add CDN',
      explanation:
        "Shopify's CDN serves storefront assets — product images, CSS, JavaScript — from edge locations worldwide. Product images are the largest assets; the CDN resizes and optimizes them on-the-fly for different devices.",
      action: buildAction('CDN', 'Web', 'CDN', 'storefront assets being served from the nearest edge node with on-the-fly optimization'),
      why: "Product images can be 5MB+ in original resolution. The CDN serves optimized versions: 400px thumbnails for mobile, 1200px for desktop, WebP format for modern browsers. This reduces page load time by 60%.",
      component: component('cdn', 'CDN'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'CDN',
        'serve and optimize storefront assets from edge locations for fast page loads',
        "When a merchant uploads a 5MB product photo, Shopify stores the original and generates thumbnails lazily. The CDN serves the right size for each device: 400px for mobile, 1200px for desktop. It also converts to WebP automatically for browsers that support it.",
        'CDN'
      ),
      celebrationMessage: buildCelebration(
        'CDN',
        'Web Client',
        "Shopify's CDN does more than serve files — it resizes product images on-the-fly for different screen sizes. Product images can be 5MB+ in original resolution; optimized versions reduce page load time by 60%.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Shopify's CDN does more than serve files — it resizes product images on-the-fly for different screen sizes."
        ),
        msg(
          "When a merchant uploads a 5MB product photo, Shopify stores the original and generates thumbnails lazily. The CDN serves the right size for each device: 400px for mobile, 1200px for desktop. It also converts to WebP automatically for browsers that support it."
        ),
        msg('Press ⌘K, search for "CDN", add it, then connect Web → CDN.'),
      ],
      requiredNodes: ['cdn'],
      requiredEdges: [edge('client_web', 'cdn')],
      successMessage: 'CDN added and connected. Now the API layer.',
      errorMessage: 'Add a CDN and connect it from the Client.',
    }),
    step({
      id: 3,
      title: 'Add API Gateway',
      explanation:
        "Shopify's API Gateway handles storefront API requests, admin API calls, and webhook deliveries. It enforces API rate limits per merchant — a merchant's app can't hammer the API and affect other merchants.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'storefront API requests and webhook deliveries with per-merchant rate limiting'),
      why: "Shopify's API is used by 8,000+ apps in the App Store. The gateway enforces per-merchant rate limits so a poorly written app can't degrade the platform for other merchants.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'API Gateway',
        'handle storefront API requests with per-merchant rate limiting to prevent one bad app from affecting others',
        "Shopify uses a leaky bucket rate limiter: each merchant gets 40 API calls per second. If an app exceeds this, it gets a 429 response. The gateway tracks usage per merchant, not per IP, so a merchant with 100 app instances still shares the same bucket.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "Shopify's API Gateway enforces per-merchant rate limits — one merchant's bad app can't affect others. With 8,000+ apps in the App Store, this isolation is critical for platform stability.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "Shopify's API Gateway enforces per-merchant rate limits — one merchant's bad app can't affect others."
        ),
        msg(
          "Shopify uses a leaky bucket rate limiter: each merchant gets 40 API calls per second. If an app exceeds this, it gets a 429 response. The gateway tracks usage per merchant, not per IP, so a merchant with 100 app instances still shares the same bucket."
        ),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now distribute the load.',
      errorMessage: 'Add an API Gateway and connect it from the Client.',
    }),
    step({
      id: 4,
      title: 'Add Load Balancer',
      explanation:
        "Shopify's Load Balancer distributes requests across service instances. During Black Friday, Shopify pre-scales to 10x normal capacity. The load balancer routes traffic to the right service cluster based on the request type.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'requests being distributed across service instances with pre-scaling for traffic spikes'),
      why: "Black Friday is predictable — Shopify knows it's coming and pre-scales. The load balancer must handle 40x traffic spikes without dropping requests. Shopify uses autoscaling with pre-warming to avoid cold start latency.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Load Balancer',
        'distribute traffic with pre-scaling for predictable Black Friday traffic spikes',
        "Shopify's engineering team runs 'flash sale drills' throughout the year. They simulate Black Friday traffic to find bottlenecks before the real event. The load balancer is configured to auto-scale checkout services 10x starting at midnight on Thanksgiving.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "Shopify pre-scales for Black Friday — they don't wait for traffic to spike before adding capacity. Flash sale drills run throughout the year to find bottlenecks before the real event. The load balancer handles 40x traffic spikes without dropping requests.",
        'Cart Service'
      ),
      messages: [
        msg(
          "Shopify pre-scales for Black Friday — they don't wait for traffic to spike before adding capacity."
        ),
        msg(
          "Shopify's engineering team runs 'flash sale drills' throughout the year. They simulate Black Friday traffic to find bottlenecks before the real event. The load balancer is configured to auto-scale checkout services 10x starting at midnight on Thanksgiving."
        ),
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added and connected. Now the cart service.',
      errorMessage: 'Add a Load Balancer and connect it from the API Gateway.',
    }),
    step({
      id: 5,
      title: 'Add Cart Service',
      explanation:
        "The Cart Service manages shopping carts. Carts are stored in Redis (in-memory) for fast reads and writes. A cart is a temporary data structure — it only becomes permanent when the customer checks out.",
      action: buildAction('Cart Service', 'Load Balancer', 'Cart Service', 'shopping cart state being managed in Redis for sub-millisecond reads'),
      why: "Carts are read and written on every product page interaction. Storing them in a database would be too slow. Redis gives sub-millisecond cart reads, and carts expire automatically if abandoned.",
      component: component('cart_service', 'Cart'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Cart Service',
        'manage shopping cart state in Redis for sub-millisecond access on every page interaction',
        "Every time you add an item, change quantity, or apply a discount code, the Cart Service updates Redis. Carts expire after 30 days of inactivity. During checkout, the cart is validated against current inventory before payment is processed.",
        'Cart Service'
      ),
      celebrationMessage: buildCelebration(
        'Cart Service',
        'Load Balancer',
        "Shopping carts are stored in Redis — not a database. They're temporary and need sub-millisecond access. Every add-to-cart interaction updates Redis instantly, and carts expire after 30 days of inactivity.",
        'Inventory Service'
      ),
      messages: [
        msg(
          "Shopping carts are stored in Redis — not a database. They're temporary and need sub-millisecond access."
        ),
        msg(
          "Every time you add an item, change quantity, or apply a discount code, the Cart Service updates Redis. Carts expire after 30 days of inactivity. During checkout, the cart is validated against current inventory before payment is processed."
        ),
        msg('Press ⌘K, search for "Cart Service", add it, then connect Load Balancer → Cart Service.'),
      ],
      requiredNodes: ['cart_service'],
      requiredEdges: [edge('load_balancer', 'cart_service')],
      successMessage: 'Cart Service added and connected. Now inventory management.',
      errorMessage: 'Add a Cart Service and connect it from the Load Balancer.',
    }),
    step({
      id: 6,
      title: 'Add Inventory Service',
      explanation:
        "The Inventory Service tracks stock levels and handles inventory reservations. When a customer adds an item to their cart, inventory is soft-reserved. When they complete checkout, inventory is hard-decremented.",
      action: buildAction('Inventory Service', 'Cart', 'Inventory Service', 'stock levels being tracked with optimistic locking to prevent overselling'),
      why: "Inventory is the hardest problem in e-commerce. Two customers can't buy the last item simultaneously. The Inventory Service uses optimistic locking — it checks stock at checkout, not at add-to-cart, to avoid over-reserving.",
      component: component('inventory_service', 'Inventory'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Inventory Service',
        'track stock levels with optimistic locking to prevent two customers from buying the last item',
        "Shopify uses optimistic locking: inventory isn't reserved when you add to cart (that would block other customers). It's checked and decremented atomically at checkout. If two customers checkout simultaneously, one succeeds and one gets an 'out of stock' error.",
        'Inventory Service'
      ),
      celebrationMessage: buildCelebration(
        'Inventory Service',
        'Cart Service',
        "Inventory management is the hardest part of e-commerce. Two customers can't buy the last item. Shopify uses optimistic locking — inventory is checked and decremented atomically at checkout. If two customers checkout simultaneously, one succeeds and one gets an 'out of stock' error.",
        'Checkout Service'
      ),
      messages: [
        msg(
          "Inventory management is the hardest part of e-commerce. Two customers can't buy the last item."
        ),
        msg(
          "Shopify uses optimistic locking: inventory isn't reserved when you add to cart (that would block other customers). It's checked and decremented atomically at checkout. If two customers checkout simultaneously, one succeeds and one gets an 'out of stock' error. This is the right tradeoff — better to disappoint one customer than to over-reserve inventory."
        ),
        msg('Press ⌘K, search for "Inventory Service", add it, then connect Cart Service → Inventory Service.'),
      ],
      requiredNodes: ['inventory_service'],
      requiredEdges: [edge('cart_service', 'inventory_service')],
      successMessage: 'Inventory Service added and connected. Now the checkout flow.',
      errorMessage: 'Add an Inventory Service and connect it from the Cart Service.',
    }),
    step({
      id: 7,
      title: 'Add Checkout Service',
      explanation:
        "The Checkout Service orchestrates the checkout flow: validate cart, check inventory, calculate taxes, apply discounts, process payment, and create the order. It's a saga — if any step fails, previous steps are rolled back.",
      action: buildAction('Checkout Service', 'Inventory', 'Checkout Service', 'the multi-step checkout saga being orchestrated with rollback on failure'),
      why: "Checkout is a multi-step transaction across multiple services. The Checkout Service uses the Saga pattern to ensure consistency — if payment fails, inventory is released and the order is cancelled.",
      component: component('checkout_service', 'Checkout'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Checkout Service',
        'orchestrate the checkout saga with cart validation, tax calculation, payment processing, and order creation',
        "Checkout steps: 1) Validate cart items still exist. 2) Check inventory. 3) Calculate taxes. 4) Apply discount codes. 5) Process payment. 6) Decrement inventory. 7) Create order. If step 5 fails (payment declined), steps 1-4 are rolled back. If step 6 fails (inventory error), payment is refunded.",
        'Checkout Service'
      ),
      celebrationMessage: buildCelebration(
        'Checkout Service',
        'Inventory Service',
        "The Checkout Service is a saga — it coordinates multiple services and handles failures at each step. If payment fails, inventory is released. If inventory check fails, payment is refunded. This is distributed transaction management without locks.",
        'Payment Gateway'
      ),
      messages: [
        msg(
          "The Checkout Service is a saga — it coordinates multiple services and handles failures at each step."
        ),
        msg(
          "Checkout steps: 1) Validate cart items still exist. 2) Check inventory. 3) Calculate taxes. 4) Apply discount codes. 5) Process payment. 6) Decrement inventory. 7) Create order. If step 5 fails (payment declined), steps 1-4 are rolled back. If step 6 fails (inventory error), payment is refunded."
        ),
        msg('Press ⌘K, search for "Checkout Service", add it, then connect Inventory Service → Checkout Service.'),
      ],
      requiredNodes: ['checkout_service'],
      requiredEdges: [edge('inventory_service', 'checkout_service')],
      successMessage: 'Checkout Service added and connected. Now payment processing.',
      errorMessage: 'Add a Checkout Service and connect it from the Inventory Service.',
    }),
    step({
      id: 8,
      title: 'Add Payment Gateway',
      explanation:
        "Shopify Payments (powered by Stripe) processes credit cards, Apple Pay, Google Pay, and buy-now-pay-later. The Payment Gateway handles PCI compliance, fraud detection, and currency conversion for international merchants.",
      action: buildAction('Payment Gateway', 'Checkout', 'Payment Gateway', 'credit card processing with PCI compliance and fraud detection'),
      why: "Payment processing requires PCI DSS compliance — Shopify handles this so merchants don't have to. The Payment Gateway tokenizes card data so Shopify never stores raw card numbers.",
      component: component('payment_gateway', 'Payment'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Payment Gateway',
        'process payments with PCI compliance so merchants never touch raw card data',
        "When a customer enters their card, it's tokenized client-side before reaching Shopify's servers. The token is sent to the Payment Gateway, which exchanges it for a charge with the card network. Shopify stores the token, not the card number.",
        'Payment Gateway'
      ),
      celebrationMessage: buildCelebration(
        'Payment Gateway',
        'Checkout Service',
        "Shopify Payments handles PCI compliance so merchants never touch raw card data. Card numbers are tokenized client-side — the token is sent to the Payment Gateway, which exchanges it for a charge. Shopify stores the token, not the card number.",
        'Order Service'
      ),
      messages: [
        msg(
          "Shopify Payments handles PCI compliance so merchants never touch raw card data."
        ),
        msg(
          "When a customer enters their card, it's tokenized client-side before reaching Shopify's servers. The token is sent to the Payment Gateway, which exchanges it for a charge with the card network. Shopify stores the token, not the card number. This is how Shopify achieves PCI compliance without storing sensitive data."
        ),
        msg('Press ⌘K, search for "Payment Gateway", add it, then connect Checkout Service → Payment Gateway.'),
      ],
      requiredNodes: ['payment_gateway'],
      requiredEdges: [edge('checkout_service', 'payment_gateway')],
      successMessage: 'Payment Gateway added and connected. Now order management.',
      errorMessage: 'Add a Payment Gateway and connect it from the Checkout Service.',
    }),
    step({
      id: 9,
      title: 'Add Order Service',
      explanation:
        "The Order Service creates and manages orders after successful payment. It stores order details, triggers fulfillment, sends confirmation emails, and handles returns and refunds.",
      action: buildAction('Order Service', 'Payment', 'Order Service', 'immutable order records being created with ACID guarantees after successful payment'),
      why: "Orders are the permanent record of a transaction. Unlike carts (temporary), orders must be durable and auditable. The Order Service writes to a relational database with ACID guarantees.",
      component: component('order_service', 'Order'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Order Service',
        'create immutable order records with ACID guarantees that trigger fulfillment and notifications',
        "After payment succeeds, the Order Service creates an immutable order record. It triggers the fulfillment workflow, sends a confirmation email, and notifies the merchant. Orders can never be deleted — only cancelled or refunded. This audit trail is required for accounting and dispute resolution.",
        'Order Service'
      ),
      celebrationMessage: buildCelebration(
        'Order Service',
        'Payment Gateway',
        "Orders are permanent records — unlike carts, they're stored in a relational database with ACID guarantees. After payment succeeds, an immutable order record is created. Orders can never be deleted — only cancelled or refunded. This audit trail is required for accounting and dispute resolution.",
        'Fulfillment Service'
      ),
      messages: [
        msg(
          "Orders are permanent records — unlike carts, they're stored in a relational database with ACID guarantees."
        ),
        msg(
          "After payment succeeds, the Order Service creates an immutable order record. It triggers the fulfillment workflow, sends a confirmation email, and notifies the merchant. Orders can never be deleted — only cancelled or refunded. This audit trail is required for accounting and dispute resolution."
        ),
        msg('Press ⌘K, search for "Order Service", add it, then connect Payment Gateway → Order Service.'),
      ],
      requiredNodes: ['order_service'],
      requiredEdges: [edge('payment_gateway', 'order_service')],
      successMessage: 'Order Service added and connected. Now fulfillment.',
      errorMessage: 'Add an Order Service and connect it from the Payment Gateway.',
    }),
    step({
      id: 10,
      title: 'Add Fulfillment Service',
      explanation:
        "The Fulfillment Service routes orders to the right fulfillment center, generates shipping labels, and tracks packages. Shopify Fulfillment Network (SFN) competes with Amazon FBA — merchants store inventory in Shopify's warehouses.",
      action: buildAction('Fulfillment Service', 'Order', 'Fulfillment Service', 'orders being routed to the nearest warehouse with available stock for shipping'),
      why: "Fulfillment is where digital meets physical. The Fulfillment Service must route each order to the nearest warehouse with available stock, generate a shipping label, and update tracking in real-time.",
      component: component('fulfillment_service', 'Fulfillment'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Fulfillment Service',
        'route orders to warehouses and generate shipping labels with real-time tracking',
        "When an order is created, the Fulfillment Service checks which warehouse has the item in stock and is closest to the customer. It generates a shipping label via carrier APIs (UPS, FedEx, USPS), sends the label to the warehouse, and creates a tracking number.",
        'Fulfillment Service'
      ),
      celebrationMessage: buildCelebration(
        'Fulfillment Service',
        'Order Service',
        "The Fulfillment Service routes orders to the nearest warehouse with stock and generates shipping labels automatically. When an order is created, Shopify checks which warehouse is closest to the customer and generates a shipping label via carrier APIs (UPS, FedEx, USPS).",
        'Tax Service'
      ),
      messages: [
        msg(
          "The Fulfillment Service routes orders to warehouses and generates shipping labels automatically."
        ),
        msg(
          "When an order is created, the Fulfillment Service checks which warehouse has the item in stock and is closest to the customer. It generates a shipping label via carrier APIs (UPS, FedEx, USPS), sends the label to the warehouse, and creates a tracking number. The customer gets a tracking email automatically."
        ),
        msg('Press ⌘K, search for "Fulfillment Service", add it, then connect Order Service → Fulfillment Service.'),
      ],
      requiredNodes: ['fulfillment_service'],
      requiredEdges: [edge('order_service', 'fulfillment_service')],
      successMessage: 'Fulfillment Service added and connected. Now tax calculation.',
      errorMessage: 'Add a Fulfillment Service and connect it from the Order Service.',
    }),
    step({
      id: 11,
      title: 'Add Tax Service',
      explanation:
        "The Tax Service calculates sales tax for every order based on the customer's location and the merchant's nexus. US sales tax alone has 10,000+ tax jurisdictions — each with different rates and rules.",
      action: buildAction('Tax Service', 'Checkout', 'Tax Service', 'sales tax being calculated across 10,000+ tax jurisdictions for every order'),
      why: "Tax calculation is surprisingly complex. A merchant in California selling to a customer in New York must apply New York state tax, county tax, and city tax — all different rates. The Tax Service integrates with Avalara or TaxJar to handle this complexity.",
      component: component('tax_service', 'Tax'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'Tax Service',
        'calculate sales tax across 10,000+ jurisdictions with automatic nexus determination',
        "After the 2018 South Dakota v. Wayfair Supreme Court ruling, online merchants must collect sales tax in states where they have 'economic nexus' — even without a physical presence. Shopify's Tax Service automatically determines nexus, calculates the correct rate, and remits taxes on behalf of merchants.",
        'Tax Service'
      ),
      celebrationMessage: buildCelebration(
        'Tax Service',
        'Checkout Service',
        "US sales tax has 10,000+ jurisdictions. The Tax Service handles this complexity so merchants don't have to. After the Wayfair ruling, Shopify automatically determines economic nexus, calculates the correct rate, and remits taxes on behalf of merchants.",
        'NoSQL Database'
      ),
      messages: [
        msg(
          "US sales tax has 10,000+ jurisdictions. The Tax Service handles this complexity so merchants don't have to."
        ),
        msg(
          "After the 2018 South Dakota v. Wayfair Supreme Court ruling, online merchants must collect sales tax in states where they have 'economic nexus' — even without a physical presence. Shopify's Tax Service automatically determines nexus, calculates the correct rate, and remits taxes on behalf of merchants."
        ),
        msg('Press ⌘K, search for "Tax Service", add it, then connect Checkout Service → Tax Service.'),
      ],
      requiredNodes: ['tax_service'],
      requiredEdges: [edge('checkout_service', 'tax_service')],
      successMessage: 'Tax Service added and connected. Final step — the data layer.',
      errorMessage: 'Add a Tax Service and connect it from the Checkout Service.',
    }),
    step({
      id: 12,
      title: 'Add NoSQL Database',
      explanation:
        "Shopify stores product catalogs, merchant configurations, and analytics data in NoSQL databases. Product catalogs have flexible schemas — a clothing merchant has sizes and colors; an electronics merchant has specs and compatibility.",
      action: buildAction('NoSQL Database', 'Order', 'NoSQL Database', 'product catalogs and merchant configurations being stored with flexible schemas'),
      why: "Product data is highly variable across merchants. A NoSQL document store handles the flexible schema without requiring ALTER TABLE for every new product attribute type.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'Shopify',
        'NoSQL Database',
        'store product catalogs with flexible schemas that vary per merchant category',
        "A clothing merchant's product has: size, color, material, care instructions. An electronics merchant's product has: voltage, compatibility, warranty. A food merchant's product has: ingredients, allergens, expiry. NoSQL handles all of these without a shared schema.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Order Service',
        "Product catalogs are stored in NoSQL — each product is a document with merchant-specific attributes. A clothing merchant has sizes and colors; an electronics merchant has specs and compatibility. Shopify's metafields feature lets merchants add any custom attribute. You have built Shopify.",
        'nothing — you have built Shopify'
      ),
      messages: [
        msg(
          "Product catalogs are stored in NoSQL — each product is a document with merchant-specific attributes."
        ),
        msg(
          "A clothing merchant's product has: size, color, material, care instructions. An electronics merchant's product has: voltage, compatibility, warranty. A food merchant's product has: ingredients, allergens, expiry. NoSQL handles all of these without a shared schema. Shopify's metafields feature lets merchants add any custom attribute."
        ),
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Order Service → NoSQL Database.'),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('order_service', 'nosql_db')],
      successMessage: 'Tutorial complete! You have built Shopify.',
      errorMessage: 'Add a NoSQL Database and connect it from the Order Service.',
    }),
  ],
});

// ── Level 2 — Production Ready (9 steps) ─────────────────────────────────────

const l2 = level({
  level: 2,
  title: 'Production Ready',
  subtitle: 'Scale to millions of concurrent checkouts',
  description:
    "Your e-commerce platform processes orders. Now add what Shopify actually ships: Kafka for order events, notification workers, SQL for financial data, CDC for analytics, structured logging, and SLO tracking.",
  estimatedTime: '~25 mins',
  unlocks: 'Expert Architecture',
  prerequisite: 'Builds on your Level 1 diagram',
  contextMessage:
    "Level 2: Production Ready. Your e-commerce platform processes orders. Now add Kafka event streaming, notifications, SQL, CDC analytics, structured logging, and SLO tracking.",
  steps: [
    step({
      id: 1,
      title: 'Add Kafka Streaming',
      explanation:
        "Every order, refund, and inventory update is published to Kafka. Analytics pipelines consume order events for real-time revenue dashboards. Fulfillment systems consume inventory updates to route orders.",
      action: buildAction(
        'Kafka / Streaming',
        'Load Balancer',
        'Kafka Streaming',
        'every order, refund, and inventory update being streamed to analytics and fulfillment consumers in real time'
      ),
      why: "Without Kafka, real-time revenue dashboards would require synchronous database queries. Kafka decouples event producers from consumers — the checkout path stays fast regardless of downstream processing.",
      component: component('kafka_streaming', 'Kafka / Streaming', 'Kafka / Streaming'),
      openingMessage: buildOpeningL2(
        'Shopify',
        'Kafka',
        'stream every order and inventory update to analytics and fulfillment consumers in real time',
        'Without Kafka, real-time revenue dashboards would require synchronous database queries.',
        'Kafka / Streaming'
      ),
      celebrationMessage: buildCelebration(
        'Kafka Streaming',
        'Load Balancer',
        "Shopify publishes billions of order events per day to Kafka. Real-time revenue dashboards update within seconds. Fulfillment systems consume inventory updates to route orders to warehouses.",
        'Notification Worker'
      ),
      messages: [
        msg("Level 2 — Production Ready. Every order, refund, and inventory update is published to Kafka for downstream consumers."),
        msg("Real-time revenue dashboards update within seconds. Fulfillment systems consume inventory updates to route orders."),
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
        "Notification workers consume Kafka events to send email, SMS, and push notifications — order confirmations, shipping updates, and low stock alerts for merchants.",
      action: buildAction(
        'Worker',
        'Kafka',
        'Notification Worker',
        'order confirmations and shipping updates being sent via email, SMS, and push notifications'
      ),
      why: "If Shopify sent notifications synchronously, slow email delivery could delay the checkout response. Background workers handle notification delivery asynchronously.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL2(
        'Shopify',
        'Notification Worker',
        'deliver order confirmations and shipping updates asynchronously via email, SMS, and push',
        'Synchronous notifications would delay checkout responses — background workers handle delivery asynchronously.',
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Notification Worker',
        'Kafka Streaming',
        "Shopify's notification workers deliver order confirmations, shipping updates, and low stock alerts. All delivery is asynchronous — checkout responses are never delayed by notification delivery.",
        'CDC Connector'
      ),
      messages: [
        msg("Notification workers consume Kafka events to send order confirmations and shipping updates."),
        msg("All notification delivery is asynchronous — checkout responses are never delayed by slow email or SMS delivery."),
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
        "The CDC Connector captures row-level changes from Shopify's NoSQL database and streams them to Kafka for analytics — inventory changes, order updates, and product catalog modifications without adding load to the production database.",
      action: buildAction(
        'CDC Connector (Debezium)',
        'NoSQL Database',
        'CDC Connector',
        'inventory and order changes being captured from the NoSQL transaction log and streamed to Kafka for analytics'
      ),
      why: "Without CDC, analytics queries would require direct database reads that add load to the production database. CDC captures changes from the transaction log — zero production query overhead.",
      component: component('cdc_connector', 'CDC Connector (Debezium)'),
      openingMessage: buildOpeningL2(
        'Shopify',
        'CDC Connector (Debezium)',
        'capture inventory and order changes from the NoSQL transaction log and stream to Kafka — zero production query overhead',
        'Without CDC, analytics queries add load to the production database — CDC captures changes from the transaction log.',
        'CDC Connector (Debezium)'
      ),
      celebrationMessage: buildCelebration(
        'CDC Connector',
        'NoSQL Database',
        "Shopify's CDC Connector captures every inventory update and order change from the NoSQL transaction log — streaming to Kafka for analytics without adding load to the production database.",
        'SQL Database'
      ),
      messages: [
        msg("CDC Connector captures row-level changes from the NoSQL database and streams them to Kafka for analytics."),
        msg("Without CDC, analytics queries would add load to the production database. CDC captures changes from the transaction log — zero query overhead."),
        msg('Press ⌘K, search for "CDC Connector (Debezium)", add it, then connect NoSQL Database → CDC Connector.'),
      ],
      requiredNodes: ['cdc_connector'],
      requiredEdges: [edge('nosql_db', 'cdc_connector')],
      successMessage: 'CDC added. Now SQL for financial data.',
      errorMessage: 'Add a CDC Connector connected from the NoSQL Database.',
    }),
    step({
      id: 4,
      title: 'Add SQL Database',
      explanation:
        "Shopify stores merchant financial records, payout data, and tax records in PostgreSQL. Financial data requires ACID transactions — merchant payouts must be accurate and auditable.",
      action: buildAction(
        'SQL Database',
        'Order Service',
        'SQL Database',
        'merchant financial records and payout data being stored with ACID guarantees for financial compliance'
      ),
      why: "Merchant payouts and tax records require auditable, ACID-compliant records. A missing order from a merchant's earnings report is a legal issue.",
      component: component('sql_db', 'SQL Database'),
      openingMessage: buildOpeningL2(
        'Shopify',
        'SQL Database',
        'store merchant payouts and tax records with ACID guarantees for financial compliance',
        'Merchant payouts require auditable, ACID-compliant records — eventual consistency is unacceptable.',
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Order Service',
        "Shopify stores merchant financial records and payout data in PostgreSQL with full ACID compliance. Every order is recorded exactly once for the payout calculation — auditable and legally compliant.",
        'Structured Logger'
      ),
      messages: [
        msg("Merchant financial records, payout data, and tax records need ACID compliance. PostgreSQL stores the authoritative financial records."),
        msg("Merchant payouts must be accurate and auditable. ACID transactions ensure every order is recorded exactly once."),
        msg('Press ⌘K, search for "SQL Database", add it, then connect Order Service → SQL Database.'),
      ],
      requiredNodes: ['sql_db'],
      requiredEdges: [edge('order_service', 'sql_db')],
      successMessage: 'SQL added. Now structured logging.',
      errorMessage: 'Add a SQL Database connected from the Order Service.',
    }),
    step({
      id: 5,
      title: 'Add Structured Logger',
      explanation:
        "Shopify's Structured Logger emits JSON-formatted logs with consistent field schemas — order_id, merchant_id, event_type, amount. LogQL queries aggregate metrics across billions of logs per day.",
      action: buildAction(
        'Structured Logger',
        'Load Balancer',
        'Structured Logger',
        'JSON-formatted order traces being emitted with consistent schemas for order_id, merchant_id, and event_type'
      ),
      why: "Text logs require regex parsing — slow and error-prone at scale. Structured JSON logs enable LogQL queries that aggregate metrics across billions of entries in seconds.",
      component: component('structured_logger', 'Structured Logger'),
      openingMessage: buildOpeningL2(
        'Shopify',
        'Structured Logger',
        'emit JSON logs with consistent field schemas for order_id, merchant_id, and event_type across all services',
        'Text logs require regex parsing — structured JSON enables fast LogQL aggregation across billions of entries.',
        'Structured Logger'
      ),
      celebrationMessage: buildCelebration(
        'Structured Logger',
        'Load Balancer',
        "Shopify's Structured Logger emits JSON with consistent schemas: order_id, merchant_id, event_type, amount. LogQL queries aggregate revenue across billions of orders — enabling real-time dashboards.",
        'SLO/SLI Tracker'
      ),
      messages: [
        msg("Structured Logger emits JSON-formatted logs with consistent schemas — order_id, merchant_id, event_type, amount."),
        msg("LogQL queries aggregate metrics across billions of logs per day in seconds. Revenue dashboards and anomaly detection use structured log queries."),
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
        "Shopify's SLO/SLI Tracker monitors checkout success rate, payment processing time, and cart abandonment rate against defined Service Level Objectives. Checkout success rate SLO: 99.9% — critical during Black Friday.",
      action: buildAction(
        'SLO/SLI Tracker',
        'Metrics Collector',
        'SLO/SLI Tracker',
        'checkout success rate and payment processing time being tracked against SLOs — alerting when error budgets burn'
      ),
      why: "Without SLOs, engineering teams argue about what 'good' means. With SLOs, there's a clear contractual target — checkout must succeed 99.9% of the time.",
      component: component('slo_tracker', 'SLO/SLI Tracker'),
      openingMessage: buildOpeningL2(
        'Shopify',
        'SLO/SLI Tracker',
        'monitor checkout success rate and payment processing time against 99.9% SLO targets',
        'Without SLOs, engineering teams argue about what acceptable performance means.',
        'SLO/SLI Tracker'
      ),
      celebrationMessage: buildCelebration(
        'SLO/SLI Tracker',
        'Metrics Collector',
        "Shopify's SLO: 99.9% checkout success rate — critical during Black Friday when every failed checkout is lost revenue. The SLO/SLI Tracker alerts when error budgets burn — pages on-call before merchants notice.",
        'Error Budget Monitor'
      ),
      messages: [
        msg("The SLO/SLI Tracker monitors checkout success rate, payment processing time, and cart abandonment rate against defined Service Level Objectives."),
        msg("Shopify's checkout success rate SLO: 99.9% — critical during Black Friday. When latency exceeds the error budget, on-call is paged."),
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
        "Shopify's Error Budget Monitor tracks remaining reliability budget for checkout success rate SLO. When the error budget burns faster than acceptable, feature launches pause until reliability improves.",
      action: buildAction(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        'Error Budget Monitor',
        'error budget burn rate being tracked — pausing feature launches when budget depletes faster than acceptable'
      ),
      why: "The error budget is the 'spare' reliability. When depleted, feature launches pause. For e-commerce, reliability is non-negotiable — a failed checkout is lost revenue.",
      component: component('error_budget_alert', 'Error Budget Monitor'),
      openingMessage: buildOpeningL2(
        'Shopify',
        'Error Budget Monitor',
        'track error budget burn rate — pausing feature launches when budget depletes to protect reliability',
        'For e-commerce, reliability is non-negotiable — a failed checkout is lost revenue.',
        'Error Budget Monitor'
      ),
      celebrationMessage: buildCelebration(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        "Shopify's error budget policy: when more than 10% of the monthly budget burns in a week, feature launches pause. Engineering prioritizes reliability until the budget recovers — protecting Black Friday revenue.",
        'Level 3'
      ),
      messages: [
        msg("The Error Budget Monitor tracks remaining reliability budget for checkout success rate SLO."),
        msg("When the error budget burns faster than acceptable, feature launches pause until reliability improves. For e-commerce, a failed checkout is lost revenue."),
        msg('Press ⌘K, search for "Error Budget Monitor", add it, then connect SLO/SLI Tracker → Error Budget Monitor.'),
      ],
      requiredNodes: ['error_budget_alert'],
      requiredEdges: [edge('slo_tracker', 'error_budget_alert')],
      successMessage: 'Error budget monitoring added. Shopify is now production-ready.',
      errorMessage: 'Add an Error Budget Monitor connected from the SLO/SLI Tracker.',
    }),
  ],
});

// ── Level 3 — Expert Architecture (11 steps) ───────────────────────────────────

const l3 = level({
  level: 3,
  title: 'Expert Architecture',
  subtitle: 'Design like a Shopify senior engineer',
  description:
    "You have production Shopify. Now add what separates senior engineers — service mesh, GraphQL Federation, token bucket rate limiting, distributed tracing with correlation IDs, mTLS for service authentication, cache stampede prevention, and event sourcing for orders.",
  estimatedTime: '~30 mins',
  prerequisite: 'Builds on your Level 2 diagram',
  contextMessage:
    "Level 3: Expert Architecture. Add service mesh, GraphQL Federation, advanced rate limiting, distributed tracing, mTLS, cache stampede prevention, and event sourcing.",
  steps: [
    step({
      id: 1,
      title: 'Add Service Mesh (Istio)',
      explanation:
        "Shopify's Service Mesh uses Istio to manage all east-west traffic between services — automatic mTLS encryption, circuit breaking, retries, and load balancing at the sidecar proxy level.",
      action: buildAction(
        'Service Mesh (Istio)',
        'Load Balancer',
        'Service Mesh',
        'automatic mTLS and traffic management being enforced at the sidecar proxy level for all service-to-service communication'
      ),
      why: "Without a service mesh, each service implements TLS, circuit breaking, and retries differently. Istio handles this transparently at the infrastructure layer.",
      component: component('service_mesh', 'Service Mesh (Istio)'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'Service Mesh (Istio)',
        'automatic mTLS, circuit breaking, and traffic policies enforced at the sidecar proxy level across all services',
        'Without a service mesh, each service implements TLS, retries, and circuit breaking differently.',
        'Service Mesh (Istio)'
      ),
      celebrationMessage: buildCelebration(
        'Service Mesh',
        'Load Balancer',
        "Shopify's service mesh handles billions of service-to-service calls per day. Every call is encrypted with mTLS — no service code changes required. The Control Plane pushes traffic policies across the cluster instantly.",
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
        "Shopify's GraphQL Federation Gateway combines product, order, and customer schemas into a unified supergraph. Admin dashboards query one endpoint — the gateway fans out to multiple subgraphs and composes the response.",
      action: buildAction(
        'GraphQL Federation Gateway',
        'API Gateway',
        'GraphQL Federation Gateway',
        'product, order, and customer schemas being composed into a unified API from multiple subgraphs'
      ),
      why: "Without Federation, admin dashboards make multiple round trips to different REST endpoints. GraphQL Federation lets dashboards fetch all needed data in a single query.",
      component: component('graphql_federation', 'GraphQL Federation Gateway'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'GraphQL Federation Gateway',
        'compose product, order, and customer schemas into a unified supergraph from multiple subgraphs',
        'Without Federation, admin dashboards make multiple round trips — GraphQL reduces this to one.',
        'GraphQL Federation Gateway'
      ),
      celebrationMessage: buildCelebration(
        'GraphQL Federation Gateway',
        'API Gateway',
        "Shopify's GraphQL Federation Gateway serves admin dashboards with a unified API — one query fetches products, orders, and customers. Dashboard API calls reduced by 60%, latency reduced by 40%.",
        'Token Bucket Rate Limiter'
      ),
      messages: [
        msg("GraphQL Federation combines product, order, and customer schemas into a unified supergraph."),
        msg("Admin dashboards query one endpoint — the gateway fans out to multiple subgraphs and composes the response. API calls reduced by 60%."),
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
        "Shopify's Token Bucket Rate Limiter enforces API quotas using the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate. Enterprise merchants get larger buckets for bulk operations.",
      action: buildAction(
        'Token Bucket Rate Limiter',
        'API Gateway',
        'Token Bucket Rate Limiter',
        'API quotas being enforced with burst allowance using the token bucket algorithm — enterprise merchants get larger buckets'
      ),
      why: "Fixed rate limiting cannot handle legitimate bursts. Enterprise merchants processing bulk orders need burst capacity — the token bucket allows this while maintaining average limits.",
      component: component('token_bucket_limiter', 'Token Bucket Rate Limiter'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'Token Bucket Rate Limiter',
        'enforce API quotas with burst allowance — enterprise bulk order merchants get larger token buckets',
        'Fixed rate limiting cannot handle legitimate bursts — token bucket allows bursts while maintaining average limits.',
        'Token Bucket Rate Limiter'
      ),
      celebrationMessage: buildCelebration(
        'Token Bucket Rate Limiter',
        'API Gateway',
        "Shopify's token bucket rate limiter allows enterprise merchants to burst bulk order requests — processing 10,000 orders can use the full bucket. Casual API users get smaller buckets. The steady average rate prevents abuse.",
        'OpenTelemetry Collector'
      ),
      messages: [
        msg("Token Bucket Rate Limiter uses the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate."),
        msg("Enterprise merchants processing bulk orders get larger buckets. The steady average rate prevents abuse while enabling legitimate bursts."),
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
        "Shopify's OpenTelemetry Collector receives traces, metrics, and logs from all services — processing and exporting to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs.",
      action: buildAction(
        'OpenTelemetry Collector',
        'Structured Logger',
        'OpenTelemetry Collector',
        'traces, metrics, and logs being aggregated and exported to multiple backends from a single unified collector'
      ),
      why: "Without OTel, each service uses different tracing libraries. The OTel Collector normalizes everything — one instrumentation, multiple backends.",
      component: component('otel_collector', 'OpenTelemetry Collector'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'OpenTelemetry Collector',
        'unified telemetry pipeline for traces, metrics, and logs with multi-backend export',
        'Without OTel, each service uses different tracing libraries — the OTel Collector normalizes everything.',
        'OpenTelemetry Collector'
      ),
      celebrationMessage: buildCelebration(
        'OpenTelemetry Collector',
        'Structured Logger',
        "Shopify's OTel Collector processes billions of spans per day. One instrumentation exports to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs — three backends, zero per-service configuration.",
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
        "The Correlation ID Injector assigns a unique trace ID to every request that propagates via HTTP headers across all service calls — enabling end-to-end request tracing from the storefront through cart, inventory, checkout, and payment.",
      action: buildAction(
        'Correlation ID Injector',
        'otel_collector',
        'Correlation ID Injector',
        'unique trace IDs being propagated across all service calls for end-to-end request visibility'
      ),
      why: "Without correlation IDs, debugging a failed checkout requires checking logs from the cart service, inventory service, checkout service, and payment gateway separately. Correlation IDs link all logs under one trace.",
      component: component('correlation_id_handler', 'Correlation ID Injector'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'Correlation ID Injector',
        'propagate unique trace IDs across all service calls for instant cross-service log correlation',
        'Without correlation IDs, debugging failed checkouts requires checking logs from 5+ services separately.',
        'Correlation ID Injector'
      ),
      celebrationMessage: buildCelebration(
        'Correlation ID Injector',
        'OpenTelemetry Collector',
        "Shopify's correlation IDs flow through every service call: API Gateway → Cart Service → Inventory Service → Checkout Service → Payment Gateway. All logs under one trace ID — instant debugging of failed checkouts.",
        'mTLS Certificate Authority'
      ),
      messages: [
        msg("The Correlation ID Injector generates a unique trace ID at request entry and propagates it via HTTP headers through every service call."),
        msg("All logs for a checkout request share one correlation ID — instant debugging across Cart, Inventory, Checkout, and Payment services."),
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
        "Shopify's mTLS Certificate Authority issues and rotates TLS certificates for all service-to-service authentication — enabling mutual TLS where both client and server verify each other. Certificates rotate automatically every 24 hours.",
      action: buildAction(
        'mTLS Certificate Authority',
        'Service Mesh',
        'mTLS Certificate Authority',
        'TLS certificates being issued and rotated automatically every 24 hours for service-to-service authentication'
      ),
      why: "mTLS ensures that only authorized services can communicate with each other. Automatic certificate rotation prevents expired certificates from causing outages.",
      component: component('mtls_certificate_authority', 'mTLS Certificate Authority'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'mTLS Certificate Authority',
        'issue and rotate TLS certificates automatically every 24 hours for mutual service-to-service authentication',
        'mTLS ensures only authorized services communicate — automatic rotation prevents certificate expiration outages.',
        'mTLS Certificate Authority'
      ),
      celebrationMessage: buildCelebration(
        'mTLS Certificate Authority',
        'Service Mesh',
        "Shopify's mTLS CA issues certificates that rotate every 24 hours automatically. Every service-to-service call verifies both client and server certificates — even if one service is compromised, it cannot impersonate another.",
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
        "When a popular product's cart cache expires during flash sales, Shopify's Cache Stampede Prevention uses probabilistic early expiration and distributed locking — ensuring only one request rebuilds the cache instead of thousands causing a thundering herd.",
      action: buildAction(
        'Cache Stampede Prevention',
        'Cart Service',
        'Cache Stampede Prevention',
        'thundering herd being prevented when cart cache expires using probabilistic early expiration and distributed locking'
      ),
      why: "Without cache stampede prevention, when a popular product's cache expires during a flash sale, thousands of concurrent requests hit the inventory database simultaneously — a thundering herd that can take down the checkout system.",
      component: component('cache_stampede_guard', 'Cache Stampede Prevention'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'Cache Stampede Prevention',
        'prevent thundering herd when cart cache expires using probabilistic early expiration — only one request rebuilds cache',
        'Without stampede prevention, cache expiration causes thousands of concurrent database requests during flash sales.',
        'Cache Stampede Prevention'
      ),
      celebrationMessage: buildCelebration(
        'Cache Stampede Prevention',
        'Cart Service',
        "Shopify's Cache Stampede Prevention uses probabilistic early expiration — popular product cart cache expires with 10% probability before the TTL. During flash sales, 10% of requests rebuild the cache instead of 100%. Thundering herd prevented.",
        'Change Data Cache'
      ),
      messages: [
        msg("Cache Stampede Prevention uses probabilistic early expiration — when TTL approaches, requests have a 10% chance of rebuilding the cache early."),
        msg("Instead of thousands of requests hitting the database when cart cache expires, only ~10% rebuild — the thundering herd is prevented."),
        msg('Press ⌘K, search for "Cache Stampede Prevention", add it, then connect Cart Service → Cache Stampede Prevention.'),
      ],
      requiredNodes: ['cache_stampede_guard'],
      requiredEdges: [edge('cart_service', 'cache_stampede_guard')],
      successMessage: 'Cache stampede prevention added. Now CDC-driven cache.',
      errorMessage: 'Add a Cache Stampede Prevention connected from the Cart Service.',
    }),
    step({
      id: 8,
      title: 'Add Change Data Cache',
      explanation:
        "Shopify's Change Data Cache uses CDC from the NoSQL database to know exactly when product data changes — invalidating cached entries precisely when source data changes instead of waiting for TTL expiration.",
      action: buildAction(
        'Change Data Cache',
        'NoSQL Database',
        'Change Data Cache',
        'cache entries being invalidated precisely when source data changes using CDC from the NoSQL transaction log'
      ),
      why: "Without CDC, cache invalidation relies on TTL — stale product data persists until expiration. CDC captures every database write and invalidates the exact corresponding cache entry — zero staleness.",
      component: component('change_data_cache', 'Change Data Cache'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'Change Data Cache',
        'invalidate cache entries precisely when source data changes using CDC from the NoSQL transaction log',
        'Without CDC, cache relies on TTL — stale data persists. CDC invalidates exact entries when data changes.',
        'Change Data Cache'
      ),
      celebrationMessage: buildCelebration(
        'Change Data Cache',
        'NoSQL Database',
        "Shopify's CDC connector captures every product update from the NoSQL transaction log — immediately invalidating the corresponding cache entry. Price changes reflect instantly, no stale product data.",
        'Data Warehouse'
      ),
      messages: [
        msg("Change Data Cache uses CDC from the NoSQL transaction log to know exactly when product data changes."),
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
        "Shopify's Data Warehouse stores all historical order data — revenue trends, merchant performance, fulfillment analytics. It powers the business intelligence that guides product decisions and merchant tools.",
      action: buildAction(
        'Data Warehouse',
        'CDC Connector',
        'Data Warehouse',
        'all historical order and revenue data being stored for business intelligence and merchant analytics'
      ),
      why: "The NoSQL database answers 'what is this order's status right now?' The Data Warehouse answers 'what are the revenue trends for electronics merchants over the past year?' — different query patterns requiring different storage.",
      component: component('data_warehouse', 'Data Warehouse'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'Data Warehouse',
        'columnar analytics storage for revenue trends and merchant performance across years of data',
        'The NoSQL database cannot answer multi-year trend questions — that needs a data warehouse.',
        'Data Warehouse'
      ),
      celebrationMessage: buildCelebration(
        'Data Warehouse',
        'CDC Connector',
        "Shopify's data warehouse processes petabytes of order data. Merchant analytics, product recommendations, and Black Friday capacity planning all use this data — guiding what 2M merchants see.",
        'Saga Orchestrator'
      ),
      messages: [
        msg("Data Warehouse stores all historical order data for business intelligence and merchant analytics."),
        msg("The NoSQL database cannot answer multi-year revenue trend questions — columnar storage optimized for analytics is required."),
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
        "Shopify's Saga Orchestrator coordinates the checkout saga across cart validation, inventory check, tax calculation, payment processing, and order creation — using compensating actions when any step fails.",
      action: buildAction(
        'Saga Orchestrator',
        'Checkout Service',
        'Saga Orchestrator',
        'checkout saga being coordinated across cart, inventory, tax, payment, and order creation using compensating actions'
      ),
      why: "Without saga orchestration, a failed payment after inventory reservation would leave stale reservations. The saga coordinates rollback automatically across all services.",
      component: component('saga_orchestrator', 'Saga Orchestrator'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'Saga Orchestrator',
        'coordinate checkout saga across cart, inventory, tax, payment, and order creation using compensating actions',
        'Without saga orchestration, failed checkouts leave stale inventory reservations — the saga coordinates rollback.',
        'Saga Orchestrator'
      ),
      celebrationMessage: buildCelebration(
        'Saga Orchestrator',
        'Checkout Service',
        "Shopify's Saga Orchestrator coordinates the checkout saga: validate cart → check inventory → calculate tax → process payment → create order. If payment fails, compensating actions release the inventory reservation automatically.",
        'Event Store'
      ),
      messages: [
        msg("Saga Orchestrator coordinates the checkout saga across cart, inventory, tax, payment, and order creation."),
        msg("If any step fails, compensating actions roll back the entire checkout automatically. No stale inventory reservations left behind."),
        msg('Press ⌘K, search for "Saga Orchestrator", add it, then connect Checkout Service → Saga Orchestrator.'),
      ],
      requiredNodes: ['saga_orchestrator'],
      requiredEdges: [edge('checkout_service', 'saga_orchestrator')],
      successMessage: 'Saga orchestration added. Now event sourcing.',
      errorMessage: 'Add a Saga Orchestrator connected from the Checkout Service.',
    }),
    step({
      id: 11,
      title: 'Add Event Store',
      explanation:
        "Shopify's Event Store (EventStoreDB) maintains an immutable log of all order lifecycle events — created, paid, fulfilled, refunded. The entire order history can be reconstructed by replaying events for audit and dispute resolution.",
      action: buildAction(
        'Event Store (EventStoreDB)',
        'Order Service',
        'Event Store',
        'immutable event log being maintained for order lifecycle — enabling audit trails and state reconstruction by replay'
      ),
      why: "Order disputes require a complete audit trail. The Event Store provides immutable evidence of every order decision — critical for chargeback disputes and regulatory compliance.",
      component: component('event_store', 'Event Store (EventStoreDB)'),
      openingMessage: buildOpeningL3(
        'Shopify',
        'Event Store (EventStoreDB)',
        'immutable event log for order lifecycle enabling audit trails and state reconstruction for dispute resolution',
        'Order disputes require a complete audit trail — the Event Store provides immutable evidence.',
        'Event Store (EventStoreDB)'
      ),
      celebrationMessage: buildCelebration(
        'Event Store',
        'Order Service',
        "Shopify's Event Store maintains an immutable log of every order lifecycle event — created, paid, fulfilled, refunded. The entire order history can be reconstructed by replaying events. This completes the expert architecture.",
        'completion'
      ),
      messages: [
        msg("Event Store (EventStoreDB) maintains an immutable log of all order lifecycle events — created, paid, fulfilled, refunded."),
        msg("The entire order history can be reconstructed by replaying events. Order disputes require a complete audit trail — the Event Store provides immutable evidence for chargeback disputes and regulatory compliance."),
        msg('Press ⌘K, search for "Event Store (EventStoreDB)", add it, then connect Order Service → Event Store. This completes the expert architecture!'),
      ],
      requiredNodes: ['event_store'],
      requiredEdges: [edge('order_service', 'event_store')],
      successMessage: "Expert architecture complete! You've designed Shopify at the senior engineer level.",
      errorMessage: 'Add an Event Store connected from the Order Service.',
    }),
  ],
});

export const shopifyTutorial: Tutorial = tutorial({
  id: 'shopify-architecture',
  title: 'How to Design Shopify Architecture',
  description:
    'Build an e-commerce platform for 2 million merchants processing $235B in annual sales. Learn cart management, inventory locking, checkout flows, payment processing, and Black Friday traffic spikes.',
  difficulty: 'Advanced',
  category: 'E-Commerce',
  isLive: false,
  icon: 'ShoppingBag',
  color: '#96bf48',
  tags: ['Checkout', 'Inventory', 'Payments', 'Flash Sales'],
  estimatedTime: '~85 mins',
  levels: [l1, l2, l3],
});
