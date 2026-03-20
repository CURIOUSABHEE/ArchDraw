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
  estimatedTime: '~30 mins',
  levels: [l1],
});
