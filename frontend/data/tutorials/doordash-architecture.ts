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
  title: 'Food Delivery Platform',
  subtitle: 'Build a food delivery platform in 11 steps',
  description:
    'Build a food delivery platform completing 2 billion deliveries annually. Learn real-time order routing, dasher dispatch, ETA prediction, geofencing, and the three-sided marketplace problem.',
  estimatedTime: '~30 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build DoorDash from scratch. 2 billion deliveries annually, 27 countries, and a real-time system that must predict your delivery time accurately enough that you trust it. The hardest problem: predicting delivery time accurately at scale.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "DoorDash has three clients: the customer app (ordering), the Dasher app (delivery), and the merchant tablet (order management). All three are part of the same system. We start with the customer-facing web client.",
      action: buildFirstStepAction('Web'),
      why: "DoorDash is a three-sided marketplace: customers, dashers, and merchants. Each side has different real-time requirements. Customers need live order tracking. Dashers need turn-by-turn navigation. Merchants need instant order notifications.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'Web Client',
        'serve three client types: customers ordering, dashers delivering, and merchants managing',
        "DoorDash's hardest problem: predicting delivery time accurately. Too optimistic and customers are disappointed. Too pessimistic and they order from a competitor. The ETA model runs in real-time using ML, traffic data, restaurant prep times, and dasher location.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "DoorDash is a three-sided marketplace: customers, dashers, and merchants. Each side has different real-time requirements. Customers need live order tracking, dashers need turn-by-turn navigation, and merchants need instant order notifications.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the DoorDash Architecture tutorial. 2 billion deliveries annually, 27 countries, and a real-time system that must predict your delivery time accurately enough that you trust it."
        ),
        msg(
          "DoorDash's hardest problem: predicting delivery time accurately. Too optimistic and customers are disappointed. Too pessimistic and they order from a competitor. The ETA model runs in real-time using ML, traffic data, restaurant prep times, and dasher location."
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
        "DoorDash's API Gateway handles requests from all three clients — customer app, Dasher app, and merchant tablet. It routes to the correct microservice and handles authentication for each client type.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'requests from all three client types being routed with role-specific permissions'),
      why: "Three different client types with different auth requirements and different rate limits. The API Gateway enforces per-client-type policies — a Dasher app has different permissions than a customer app.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'API Gateway',
        'handle requests from all three client types with role-specific permissions and rate limits',
        "A customer app can browse restaurants and place orders. A Dasher app can accept deliveries and update location. A merchant tablet can accept/reject orders and update prep times. The gateway enforces these permissions — a customer can't update a restaurant's menu.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "DoorDash's API Gateway handles three different client types with different permissions and rate limits. A customer app can browse restaurants and place orders. A Dasher app can accept deliveries and update location. A merchant tablet can accept/reject orders.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "DoorDash's API Gateway handles three different client types with different permissions and rate limits."
        ),
        msg(
          "A customer app can browse restaurants and place orders. A Dasher app can accept deliveries and update location. A merchant tablet can accept/reject orders and update prep times. The gateway enforces these permissions — a customer can't update a restaurant's menu, even if they bypass the UI."
        ),
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now distribute the load.',
      errorMessage: 'Add an API Gateway and connect it from the Client.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "DoorDash's Load Balancer distributes traffic across service instances. Lunch and dinner rushes create predictable traffic spikes — DoorDash pre-scales at 11am and 5pm daily.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'traffic being distributed with pre-scaling for predictable meal rush spikes'),
      why: "Food delivery has predictable daily traffic patterns. Pre-scaling before lunch and dinner rushes is more efficient than reactive autoscaling, which has a 2-3 minute lag before new instances are ready.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'Load Balancer',
        'distribute traffic with proactive pre-scaling for lunch and dinner rush hours',
        "DoorDash pre-scales their order service at 11:30am and 5:30pm daily. By the time the rush hits, capacity is already available. Reactive autoscaling would mean the first 2-3 minutes of the rush hit under-provisioned servers — exactly when customers are most likely to abandon.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "DoorDash traffic spikes at lunch (12pm) and dinner (6pm) every day — completely predictable. DoorDash pre-scales before these rushes. Reactive autoscaling would leave the first 2-3 minutes of the rush under-provisioned — exactly when customers are most likely to abandon.",
        'Auth Service'
      ),
      messages: [
        msg(
          "DoorDash traffic spikes at lunch (12pm) and dinner (6pm) every day — completely predictable."
        ),
        msg(
          "DoorDash pre-scales their order service at 11:30am and 5:30pm daily. By the time the rush hits, capacity is already available. Reactive autoscaling would mean the first 2-3 minutes of the rush hit under-provisioned servers — exactly when customers are most likely to abandon."
        ),
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added and connected. Now authentication.',
      errorMessage: 'Add a Load Balancer and connect it from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add Auth Service',
      explanation:
        "DoorDash's Auth Service handles customer accounts, Dasher onboarding (with background checks), and merchant authentication. Dashers require identity verification — the Auth Service integrates with background check providers.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'user and dasher authentication with multi-step onboarding and background checks'),
      why: "Dasher onboarding is more complex than customer signup — it requires identity verification, background checks, and vehicle registration. The Auth Service manages the multi-step onboarding flow.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'Auth Service',
        'handle three account types with dasher-specific background check and identity verification',
        "Customer signup is instant — email and password. Dasher onboarding takes days: identity verification, background check via Checkr, vehicle registration, and insurance verification. The Auth Service tracks onboarding state and only activates Dasher accounts after all checks pass.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "DoorDash's auth handles three different account types. Dasher onboarding takes days: identity verification, background check, vehicle registration, and insurance verification. The Auth Service tracks onboarding state and only activates accounts after all checks pass.",
        'Order Service'
      ),
      messages: [
        msg(
          "DoorDash's auth handles three different account types with very different onboarding requirements."
        ),
        msg(
          "Customer signup is instant — email and password. Dasher onboarding takes days: identity verification, background check via Checkr, vehicle registration, and insurance verification. The Auth Service tracks onboarding state and only activates Dasher accounts after all checks pass."
        ),
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth Service added and connected. Now the order service.',
      errorMessage: 'Add an Auth Service and connect it from the Load Balancer.',
    }),
    step({
      id: 5,
      title: 'Add Order Service',
      explanation:
        "The Order Service manages the lifecycle of a delivery order: placed → accepted by restaurant → being prepared → picked up by Dasher → delivered. Each state transition triggers notifications and updates to all three parties.",
      action: buildAction('Order Service', 'Auth', 'Order Service', 'the order state machine coordinating three parties simultaneously'),
      why: "An order involves three parties who all need real-time updates. The Order Service is the state machine that coordinates between customer, restaurant, and Dasher — ensuring all three stay in sync.",
      component: component('order_service', 'Order'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'Order Service',
        'manage order lifecycle as a state machine coordinating customer, restaurant, and dasher',
        "Order states: PLACED → RESTAURANT_ACCEPTED → PREPARING → READY_FOR_PICKUP → DASHER_ASSIGNED → PICKED_UP → DELIVERED. Each transition notifies all three parties. If the restaurant rejects the order, the customer is refunded and the Dasher assignment is cancelled.",
        'Order Service'
      ),
      celebrationMessage: buildCelebration(
        'Order Service',
        'Auth Service',
        "The Order Service is a state machine coordinating three parties simultaneously. Order states: PLACED → ACCEPTED → PREPARING → READY_FOR_PICKUP → DASHER_ASSIGNED → PICKED_UP → DELIVERED. Each transition notifies all three parties. Failures trigger automatic refunds and reassignments.",
        'Dasher Service'
      ),
      messages: [
        msg(
          "The Order Service is a state machine coordinating three parties simultaneously."
        ),
        msg(
          "Order states: PLACED → RESTAURANT_ACCEPTED → PREPARING → READY_FOR_PICKUP → DASHER_ASSIGNED → PICKED_UP → DELIVERED. Each transition notifies all three parties. If the restaurant rejects the order, the customer is refunded and the Dasher assignment is cancelled. The Order Service orchestrates all of this."
        ),
        msg('Press ⌘K, search for "Order Service", add it, then connect Auth Service → Order Service.'),
      ],
      requiredNodes: ['order_service'],
      requiredEdges: [edge('auth_service', 'order_service')],
      successMessage: 'Order Service added and connected. Now the Dasher dispatch system.',
      errorMessage: 'Add an Order Service and connect it from the Auth Service.',
    }),
    step({
      id: 6,
      title: 'Add Dasher Service',
      explanation:
        "The Dasher Service manages Dasher availability, location tracking, and delivery assignment. It knows which Dashers are online, where they are, and how many deliveries they're currently handling.",
      action: buildAction('Dasher Service', 'Order', 'Dasher Service', 'dasher availability and location tracking with 250,000 updates per second'),
      why: "Dasher location updates every 4 seconds from the Dasher app. The Dasher Service must process millions of location updates per minute and maintain a real-time view of every active Dasher's position.",
      component: component('dasher_service', 'Dasher'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'Dasher Service',
        'track dasher location with 250,000 updates per second and real-time geospatial queries',
        "With 1 million active Dashers, that's 250,000 location updates per second. The Dasher Service stores current positions in Redis (not a database) for fast geospatial queries. When a new order comes in, the Routing Engine queries Redis to find nearby available Dashers.",
        'Dasher Service'
      ),
      celebrationMessage: buildCelebration(
        'Dasher Service',
        'Order Service',
        "The Dasher Service processes millions of location updates per minute — every active Dasher pings every 4 seconds. With 1 million active Dashers, that's 250,000 updates per second. Positions are stored in Redis for fast geospatial queries.",
        'Routing Engine'
      ),
      messages: [
        msg(
          "The Dasher Service processes millions of location updates per minute — every active Dasher pings every 4 seconds."
        ),
        msg(
          "With 1 million active Dashers, that's 250,000 location updates per second. The Dasher Service stores current positions in Redis (not a database) for fast geospatial queries. When a new order comes in, the Routing Engine queries Redis to find nearby available Dashers."
        ),
        msg('Press ⌘K, search for "Dasher Service", add it, then connect Order Service → Dasher Service.'),
      ],
      requiredNodes: ['dasher_service'],
      requiredEdges: [edge('order_service', 'dasher_service')],
      successMessage: 'Dasher Service added and connected. Now the routing engine.',
      errorMessage: 'Add a Dasher Service and connect it from the Order Service.',
    }),
    step({
      id: 7,
      title: 'Add Routing Engine',
      explanation:
        "The Routing Engine assigns Dashers to orders using an optimization algorithm. It considers: Dasher proximity to restaurant, Dasher current workload, estimated restaurant prep time, and traffic conditions.",
      action: buildAction('Routing Engine', 'Dasher', 'Routing Engine', 'dasher assignment being optimized considering proximity, workload, prep time, and traffic'),
      why: "Optimal Dasher assignment is an NP-hard optimization problem. DoorDash uses a heuristic algorithm that runs in milliseconds — not the mathematically optimal solution, but good enough to minimize delivery times at scale.",
      component: component('routing_engine', 'Routing'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'Routing Engine',
        'optimize dasher-to-order assignment in milliseconds considering proximity, workload, prep time, and traffic',
        "The algorithm considers: distance from Dasher to restaurant, whether the Dasher is already carrying another order (batching), restaurant prep time (no point sending a Dasher who'll arrive before the food is ready), and traffic. DoorDash batches orders — one Dasher can carry two orders from nearby restaurants.",
        'Routing Engine'
      ),
      celebrationMessage: buildCelebration(
        'Routing Engine',
        'Dasher Service',
        "The Routing Engine solves an optimization problem: which Dasher should pick up which order to minimize total delivery time? It considers proximity, batching (one Dasher carrying two orders), restaurant prep time, and traffic. This runs in milliseconds at scale.",
        'ETA Service'
      ),
      messages: [
        msg(
          "The Routing Engine solves an optimization problem: which Dasher should pick up which order to minimize total delivery time?"
        ),
        msg(
          "The algorithm considers: distance from Dasher to restaurant, whether the Dasher is already carrying another order (batching), restaurant prep time (no point sending a Dasher who'll arrive before the food is ready), and traffic. DoorDash batches orders — one Dasher can carry two orders from nearby restaurants to nearby customers."
        ),
        msg('Press ⌘K, search for "Routing Engine", add it, then connect Dasher Service → Routing Engine.'),
      ],
      requiredNodes: ['routing_engine'],
      requiredEdges: [edge('dasher_service', 'routing_engine')],
      successMessage: 'Routing Engine added and connected. Now ETA prediction.',
      errorMessage: 'Add a Routing Engine and connect it from the Dasher Service.',
    }),
    step({
      id: 8,
      title: 'Add ETA Service',
      explanation:
        "The ETA Service predicts delivery time using ML models trained on millions of historical deliveries. It considers: restaurant prep time (learned per restaurant), Dasher travel time (from real-time traffic), and handoff time.",
      action: buildAction('ETA Service', 'Routing', 'ETA Service', 'delivery time being predicted using ML models trained on historical data'),
      why: "ETA accuracy directly impacts customer satisfaction. DoorDash's ML model predicts prep time per restaurant (McDonald's is faster than a sit-down restaurant), travel time from live traffic, and adds buffer for parking and handoff.",
      component: component('eta_service', 'ETA'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'ETA Service',
        'predict delivery time using ML models trained on millions of historical deliveries',
        "The model has learned: this McDonald's location takes 4 minutes to prepare a Big Mac. This intersection has a 2-minute traffic delay at 6pm on Fridays. This apartment building takes 3 minutes to navigate to the right unit. All of this is learned from historical delivery data and updated in real-time.",
        'ETA Service'
      ),
      celebrationMessage: buildCelebration(
        'ETA Service',
        'Routing Engine',
        "The ETA Service is an ML model that predicts delivery time with enough accuracy that customers trust it. It has learned per-restaurant prep times, traffic patterns by location and time, and handoff buffers. This is what makes DoorDash's ETAs reliable.",
        'Geofence Service'
      ),
      messages: [
        msg(
          "The ETA Service is a ML model that predicts delivery time with enough accuracy that customers trust it."
        ),
        msg(
          "The model has learned: this McDonald's location takes 4 minutes to prepare a Big Mac. This intersection has a 2-minute traffic delay at 6pm on Fridays. This apartment building takes 3 minutes to navigate to the right unit. All of this is learned from historical delivery data and updated in real-time."
        ),
        msg('Press ⌘K, search for "ETA Service", add it, then connect Routing Engine → ETA Service.'),
      ],
      requiredNodes: ['eta_service'],
      requiredEdges: [edge('routing_engine', 'eta_service')],
      successMessage: 'ETA Service added and connected. Now geofencing.',
      errorMessage: 'Add an ETA Service and connect it from the Routing Engine.',
    }),
    step({
      id: 9,
      title: 'Add Geofence Service',
      explanation:
        "The Geofence Service defines delivery zones and detects when Dashers enter or exit key locations — restaurant pickup zones, customer delivery zones, and no-delivery areas. It triggers events when Dashers cross geofence boundaries.",
      action: buildAction('Geofence Service', 'Dasher', 'Geofence Service', 'automatic order status updates being triggered when dashers cross geofence boundaries'),
      why: "Geofencing enables automatic status updates: when a Dasher enters the restaurant's geofence, the customer is notified 'Your Dasher has arrived at the restaurant'. When they enter the customer's geofence, 'Your Dasher is nearby'.",
      component: component('geofence_service', 'Geofence'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'Geofence Service',
        'detect dasher location boundary crossings to trigger automatic order status updates',
        "Each restaurant has a 100-meter geofence. When a Dasher enters it, the Order Service transitions to DASHER_AT_RESTAURANT and notifies the customer. When the Dasher enters the customer's geofence, the customer gets 'Your Dasher is 2 minutes away'. These automatic triggers reduce manual status updates.",
        'Geofence Service'
      ),
      celebrationMessage: buildCelebration(
        'Geofence Service',
        'Dasher Service',
        "The Geofence Service triggers automatic status updates when Dashers cross location boundaries. When a Dasher enters the restaurant's geofence, the customer is notified. When they enter the customer's geofence, 'Your Dasher is 2 minutes away'. These automatic triggers reduce the need for manual updates.",
        'Message Queue'
      ),
      messages: [
        msg(
          "The Geofence Service triggers automatic status updates when Dashers cross location boundaries."
        ),
        msg(
          "Each restaurant has a 100-meter geofence. When a Dasher enters it, the Order Service transitions to DASHER_AT_RESTAURANT and notifies the customer. When the Dasher enters the customer's geofence, the customer gets 'Your Dasher is 2 minutes away'. These automatic triggers reduce the need for manual status updates."
        ),
        msg('Press ⌘K, search for "Geofence Service", add it, then connect Dasher Service → Geofence Service.'),
      ],
      requiredNodes: ['geofence_service'],
      requiredEdges: [edge('dasher_service', 'geofence_service')],
      successMessage: 'Geofence Service added and connected. Now the message queue.',
      errorMessage: 'Add a Geofence Service and connect it from the Dasher Service.',
    }),
    step({
      id: 10,
      title: 'Add Message Queue',
      explanation:
        "DoorDash's Message Queue (Kafka) handles async events: order placed, Dasher assigned, order picked up, delivery completed. These events fan out to notifications, analytics, and billing.",
      action: buildAction('Message Queue', 'Order', 'Message Queue', 'order events being published for multiple downstream consumers to process independently'),
      why: "When an order is delivered, 5 things happen simultaneously: customer gets a receipt, Dasher gets paid, merchant gets settlement, analytics records the delivery, and the ML model gets a training data point. Kafka decouples all of these.",
      component: component('message_queue', 'Message'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'Message Queue',
        'fan out order events to notifications, payments, analytics, and ML training',
        "A single 'ORDER_DELIVERED' event goes to Kafka. Five consumers process it independently: the notification service sends the receipt, the payment service pays the Dasher, the settlement service pays the merchant, the analytics pipeline records metrics, and the ML training pipeline adds a data point.",
        'Message Queue'
      ),
      celebrationMessage: buildCelebration(
        'Message Queue',
        'Order Service',
        "When a delivery completes, 5 systems need to react simultaneously. Kafka decouples them all: notification service sends the receipt, payment service pays the Dasher, settlement service pays the merchant, analytics records the delivery, and ML training gets a data point.",
        'In-Memory Cache'
      ),
      messages: [
        msg(
          "When a delivery completes, 5 systems need to react simultaneously. Kafka decouples them all."
        ),
        msg(
          "A single 'ORDER_DELIVERED' event goes to Kafka. Five consumers process it independently: the notification service sends the receipt, the payment service pays the Dasher, the settlement service pays the merchant, the analytics pipeline records metrics, and the ML training pipeline adds a data point to improve future ETA predictions."
        ),
        msg('Press ⌘K, search for "Message Queue", add it, then connect Order Service → Message Queue.'),
      ],
      requiredNodes: ['message_queue'],
      requiredEdges: [edge('order_service', 'message_queue')],
      successMessage: 'Message Queue added and connected. Final step — the data cache.',
      errorMessage: 'Add a Message Queue and connect it from the Order Service.',
    }),
    step({
      id: 11,
      title: 'Add In-Memory Cache',
      explanation:
        "DoorDash caches restaurant menus, Dasher locations, and active order states in an in-memory cache. Restaurant menus are read thousands of times per minute but change rarely — perfect for caching.",
      action: buildAction('In-Memory Cache', 'Order', 'In-Memory Cache', 'hot data including menus and order states being cached for sub-millisecond reads'),
      why: "Restaurant menus are the most-read data in DoorDash. Caching them in Redis means menu loads are sub-millisecond. Without caching, every menu view would hit the database — catastrophic at scale.",
      component: component('in_memory_cache', 'Cache'),
      openingMessage: buildOpeningL1(
        'DoorDash',
        'In-Memory Cache',
        'cache menus, dasher locations, and order states for sub-millisecond reads',
        "DoorDash caches menus in Redis with a 5-minute TTL. When a restaurant updates their menu, the cache is invalidated immediately. Dasher locations are also cached in Redis with a 4-second TTL (matching the location update frequency). Active order states are cached to avoid database reads on every status check.",
        'In-Memory Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'Order Service',
        "Restaurant menus are read millions of times per day but change rarely — ideal cache candidates. DoorDash caches menus in Redis with a 5-minute TTL. Dasher locations are cached with a 4-second TTL matching the location update frequency. You have built DoorDash.",
        'nothing — you have built DoorDash'
      ),
      messages: [
        msg(
          "Restaurant menus are read millions of times per day but change rarely — ideal cache candidates."
        ),
        msg(
          "DoorDash caches menus in Redis with a 5-minute TTL. When a restaurant updates their menu, the cache is invalidated immediately. Dasher locations are also cached in Redis with a 4-second TTL (matching the location update frequency). Active order states are cached to avoid database reads on every status check."
        ),
        msg('Press ⌘K, search for "In-Memory Cache", add it, then connect Order Service → In-Memory Cache.'),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('order_service', 'in_memory_cache')],
      successMessage: 'Tutorial complete! You have built DoorDash.',
      errorMessage: 'Add an In-Memory Cache and connect it from the Order Service.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "DoorDash at Scale",
  subtitle: "Stream order events with real-time tracking and ETA prediction",
  description:
    "Add Kafka event streaming, Redis live tracking, CDC pipelines, and ML-driven SLO tracking to DoorDash's architecture. Handle millions of orders and predict delivery times with ML models.",
  estimatedTime: "~28 mins",
  unlocks: undefined,
  contextMessage:
    "Let's scale DoorDash. 2 billion deliveries annually, real-time dasher tracking, and ML-driven ETA prediction. This requires Kafka for order event streaming, Redis for live tracking, and ML-grade observability.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "DoorDash's Event Bus streams order events: placed, accepted, picked up, delivered. During peak meal times, thousands of orders stream through Kafka — every event triggers downstream notifications and analytics.",
      action: buildAction(
        "Kafka / Streaming",
        "Order",
        "Kafka Streaming",
        "order events being streamed: placed, accepted, picked up, delivered — during peak hours thousands of orders flow through Kafka"
      ),
      why: "Without Kafka, order status updates would require synchronous calls to every downstream system. Kafka decouples producers from consumers — the order service stays fast regardless of how many systems need updates.",
      component: component("kafka_streaming", "Kafka / Streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "DoorDash",
        "Kafka Streaming",
        "stream order events: placed, accepted, picked up, delivered — during peak hours thousands of orders flow through Kafka",
        "Without Kafka, order status updates would require synchronous calls to every downstream system.",
        "Kafka / Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "Order Service",
        "DoorDash's Event Bus streams order events: placed, accepted, picked up, delivered. During peak meal times, thousands of orders stream through Kafka — every event triggers downstream notifications and analytics.",
        "Notification Worker"
      ),
      messages: [
        msg("DoorDash's Event Bus streams order events to multiple downstream consumers in real time."),
        msg(
          "During peak meal times, thousands of orders flow through Kafka every minute. Each event — placed, accepted, picked up, delivered — triggers notifications, analytics, and billing independently."
        ),
        msg("Press ⌘K, search for \"Kafka / Streaming\", add it, then connect Order Service → Kafka Streaming."),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("order_service", "kafka_streaming")],
      successMessage: "Kafka streaming added. Now notifications.",
      errorMessage: "Add Kafka Streaming connected from the Order Service.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "DoorDash's Notification Worker handles push notifications, SMS, and email for order updates. When a dasher picks up your order, you need to know immediately — notifications must be delivered in under 5 seconds.",
      action: buildAction(
        "Worker",
        "Kafka",
        "Notification Worker",
        "push notifications, SMS, and email being sent for order updates — delivered in under 5 seconds"
      ),
      why: "Customers expect instant updates when their order status changes. The Notification Worker consumes Kafka events and delivers updates through multiple channels — push, SMS, email — with <5 second latency.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "DoorDash",
        "Notification Worker",
        "deliver push notifications, SMS, and email in under 5 seconds when dasher picks up your order",
        "Customers expect instant updates when their order status changes.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "DoorDash's Notification Worker handles push notifications, SMS, and email for order updates. When a dasher picks up your order, you need to know immediately — notifications must be delivered in under 5 seconds.",
        "In-Memory Cache"
      ),
      messages: [
        msg("DoorDash's Notification Worker handles push notifications, SMS, and email for order updates."),
        msg(
          "When a dasher picks up your order, you need to know immediately. Notifications are delivered in under 5 seconds through the fastest available channel — push, SMS, or email."
        ),
        msg("Press ⌘K, search for \"Worker / Background Job\", add it, then connect Kafka Streaming → Notification Worker."),
      ],
      requiredNodes: ["worker_job"],
      requiredEdges: [edge("kafka_streaming", "worker_job")],
      successMessage: "Notifications added. Now live tracking.",
      errorMessage: "Add a Worker connected from Kafka Streaming.",
    }),
    step({
      id: 3,
      title: "Add In-Memory Cache",
      explanation:
        "DoorDash's Redis Cache stores active order state and dasher locations. Live tracking requires sub-second location updates from dashers and instant retrieval of order status.",
      action: buildAction(
        "In-Memory Cache",
        "Dasher Service",
        "In-Memory Cache",
        "active order state and dasher locations being cached for sub-second location updates and instant order status retrieval"
      ),
      why: "Live tracking requires real-time dasher locations — sub-second updates from the app and instant retrieval for the customer. Redis stores this hot data with millisecond latency.",
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "DoorDash",
        "Redis Cache",
        "store dasher locations and order state for sub-second live tracking updates",
        "Live tracking requires real-time dasher locations — sub-second updates from the app and instant retrieval.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "Dasher Service",
        "DoorDash's Redis Cache stores active order state and dasher locations. Live tracking requires sub-second location updates from dashers and instant retrieval of order status.",
        "CDC Connector"
      ),
      messages: [
        msg("DoorDash's Redis Cache stores active order state and dasher locations for live tracking."),
        msg(
          "Live tracking requires sub-second location updates from dashers and instant retrieval of order status. Redis handles this with millisecond latency — the customer sees their dasher move in real time."
        ),
        msg("Press ⌘K, search for \"In-Memory Cache\", add it, then connect Dasher Service → In-Memory Cache."),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("dasher_service", "in_memory_cache")],
      successMessage: "Live tracking cache added. Now CDC pipelines.",
      errorMessage: "Add an In-Memory Cache connected from the Dasher Service.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "DoorDash's CDC Connector mirrors order data to the analytics platform. Delivery times, dasher efficiency, and consumer behavior stream to the data warehouse for ML training.",
      action: buildAction(
        "CDC Connector",
        "Order",
        "CDC Connector",
        "order data being mirrored to the analytics platform for ML training on delivery times and dasher efficiency"
      ),
      why: "Change Data Capture streams database changes to the analytics platform in real time. This feeds the ML pipeline — delivery predictions improve when the model trains on fresh operational data.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "DoorDash",
        "CDC Connector",
        "mirror order data to the analytics platform for ML training on delivery times and dasher efficiency",
        "Change Data Capture streams database changes to the analytics platform in real time.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "Order Service",
        "DoorDash's CDC Connector mirrors order data to the analytics platform. Delivery times, dasher efficiency, and consumer behavior stream to the data warehouse for ML training.",
        "SQL Database"
      ),
      messages: [
        msg("DoorDash's CDC Connector mirrors order data to the analytics platform in real time."),
        msg(
          "Delivery times, dasher efficiency, and consumer behavior stream to the data warehouse. This data trains DoorDash's ML models for dispatch and ETA prediction."
        ),
        msg("Press ⌘K, search for \"CDC Connector\", add it, then connect Order Service → CDC Connector."),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("order_service", "cdc_connector")],
      successMessage: "CDC pipeline added. Now the SQL database.",
      errorMessage: "Add a CDC Connector connected from the Order Service.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "DoorDash's MySQL stores user accounts, merchant listings, and order history. Delivery orders have complex schemas — merchant fees, dasher pay, and consumer charges are stored together.",
      action: buildAction(
        "SQL Database",
        "Auth",
        "SQL Database",
        "user accounts, merchant listings, and order history being stored with ACID guarantees for financial compliance"
      ),
      why: "DoorDash's financial data — merchant fees, dasher pay, consumer charges — requires ACID transactions. Splitting this across systems would complicate reconciliation. MySQL stores the authoritative financial record.",
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "DoorDash",
        "MySQL",
        "store user accounts, merchant listings, and order history with ACID guarantees for financial compliance",
        "DoorDash's financial data requires ACID transactions — merchant fees, dasher pay, consumer charges.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "Auth Service",
        "DoorDash's MySQL stores user accounts, merchant listings, and order history. Delivery orders have complex schemas — merchant fees, dasher pay, and consumer charges are stored together.",
        "Structured Logger"
      ),
      messages: [
        msg("DoorDash's MySQL stores user accounts, merchant listings, and order history with ACID compliance."),
        msg(
          "Delivery orders have complex schemas — merchant fees, dasher pay, and consumer charges are stored together. Financial reconciliation requires consistent, auditable records."
        ),
        msg("Press ⌘K, search for \"SQL Database\", add it, then connect Auth Service → SQL Database."),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("auth_service", "sql_db")],
      successMessage: "Financial data secured. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the Auth Service.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "DoorDash's Structured Logger captures order placement, dasher dispatch, and delivery completion. Logs flow to the ML platform — DoorDash's ETA prediction model trains on delivery event logs.",
      action: buildAction(
        "Structured Logger",
        "Order",
        "Structured Logger",
        "order placement, dasher dispatch, and delivery completion being logged with consistent JSON schemas for ML training"
      ),
      why: "ML models need training data. Structured logs capture every order lifecycle event — these become training examples for ETA prediction and dispatch optimization.",
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "DoorDash",
        "Structured Logger",
        "capture order placement, dasher dispatch, and delivery completion with JSON schemas for ML training",
        "ML models need training data — structured logs capture every order lifecycle event.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "Order Service",
        "DoorDash's Structured Logger captures order placement, dasher dispatch, and delivery completion. Logs flow to the ML platform — DoorDash's ETA prediction model trains on delivery event logs.",
        "SLO Tracker"
      ),
      messages: [
        msg("DoorDash's Structured Logger captures order placement, dasher dispatch, and delivery completion."),
        msg(
          "Logs flow to the ML platform — DoorDash's ETA prediction model trains on delivery event logs. Every successful delivery improves prediction accuracy."
        ),
        msg("Press ⌘K, search for \"Structured Logger\", add it, then connect Order Service → Structured Logger."),
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("order_service", "structured_logger")],
      successMessage: "Structured logging added. Now SLO tracking.",
      errorMessage: "Add a Structured Logger connected from the Order Service.",
    }),
    step({
      id: 7,
      title: "Add SLO Tracker",
      explanation:
        "DoorDash's SLO Tracker monitors order acceptance time, dasher dispatch latency, and delivery ETA accuracy. Order acceptance must complete in <30 seconds — tracked as a critical SLO.",
      action: buildAction(
        "SLO/SLI Tracker",
        "Order",
        "SLO Tracker",
        "order acceptance time, dasher dispatch latency, and delivery ETA accuracy being tracked against defined SLO targets"
      ),
      why: "DoorDash's critical SLOs: order acceptance <30 seconds, dispatch latency <2 minutes, ETA accuracy within 5 minutes. These directly impact customer satisfaction and retention.",
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "DoorDash",
        "SLO Tracker",
        "monitor order acceptance time, dasher dispatch latency, and delivery ETA accuracy against defined SLOs",
        "DoorDash's critical SLOs: order acceptance <30 seconds, dispatch latency <2 minutes, ETA accuracy.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO Tracker",
        "Order Service",
        "DoorDash's SLO Tracker monitors order acceptance time, dasher dispatch latency, and delivery ETA accuracy. Order acceptance must complete in <30 seconds — tracked as a critical SLO.",
        "Error Budget Alert"
      ),
      messages: [
        msg("DoorDash's SLO Tracker monitors order acceptance time, dasher dispatch latency, and delivery ETA accuracy."),
        msg(
          "Order acceptance must complete in <30 seconds. Dispatch latency must be <2 minutes. ETA accuracy within 5 minutes. These are critical SLOs tracked in real time."
        ),
        msg("Press ⌘K, search for \"SLO/SLI Tracker\", add it, then connect Order Service → SLO Tracker."),
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("order_service", "slo_tracker")],
      successMessage: "SLO tracking added. Now error budgets.",
      errorMessage: "Add an SLO/SLI Tracker connected from the Order Service.",
    }),
    step({
      id: 8,
      title: "Add Error Budget Alert",
      explanation:
        "DoorDash's Error Budget Monitor tracks ETA accuracy SLO. When delivery predictions degrade during bad weather, on-call teams use the error budget to decide whether to adjust ETA models or add dasher capacity.",
      action: buildAction(
        "Error Budget Monitor",
        "SLO",
        "Error Budget Alert",
        "ETA accuracy error budget being tracked — on-call teams use it to decide whether to adjust models or add capacity"
      ),
      why: "The error budget tells on-call teams when to act. During bad weather, ETA predictions degrade — the error budget signals when to switch to simpler models or increase dasher supply.",
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "DoorDash",
        "Error Budget Monitor",
        "track ETA accuracy error budget — on-call teams use it to decide whether to adjust models or add dasher capacity",
        "The error budget tells on-call teams when to act during weather events or system degradation.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Alert",
        "SLO Tracker",
        "DoorDash's Error Budget Monitor tracks ETA accuracy SLO. When delivery predictions degrade during bad weather, on-call teams use the error budget to decide whether to adjust ETA models or add dasher capacity.",
        "DoorDash is now production-ready"
      ),
      messages: [
        msg("DoorDash's Error Budget Monitor tracks ETA accuracy SLO."),
        msg(
          "When delivery predictions degrade during bad weather, on-call teams use the error budget to decide whether to adjust ETA models or add dasher capacity."
        ),
        msg("Press ⌘K, search for \"Error Budget Monitor\", add it, then connect SLO Tracker → Error Budget Monitor."),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget monitoring added. DoorDash is now production-ready.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO Tracker.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "DoorDash Enterprise",
  subtitle: "Add zero-trust marketplace, dispatch tracing, and saga-based fulfillment",
  description:
    "Implement zero-trust networking for the three-sided marketplace, distributed tracing for dispatch, and saga-based order fulfillment. DoorDash Enterprise serves enterprise merchants with SLA requirements.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make DoorDash enterprise-grade. Zero-trust marketplace networking, dispatch distributed tracing, and saga-based order fulfillment. DoorDash Enterprise serves enterprise merchants with compliance and SLA requirements.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "DoorDash's Service Mesh (Envoy) handles mTLS between the consumer app, dasher app, and merchant systems. The three-sided marketplace requires secure communication across all three parties.",
      action: buildAction(
        "Service Mesh (Istio)",
        "API Gateway",
        "Service Mesh",
        "mTLS being enforced between consumer app, dasher app, and merchant systems across the three-sided marketplace"
      ),
      why: "The three-sided marketplace has three client types communicating with each other. mTLS ensures every service authenticates before accepting requests — compromised services cannot impersonate other parties.",
      component: component("service_mesh", "Service Mesh (Istio)"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "Service Mesh (Envoy)",
        "enforce mTLS between consumer app, dasher app, and merchant systems across the three-sided marketplace",
        "The three-sided marketplace requires secure communication across all three parties.",
        "Service Mesh (Istio)"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "API Gateway",
        "DoorDash's Service Mesh (Envoy) handles mTLS between the consumer app, dasher app, and merchant systems. The three-sided marketplace requires secure communication across all three parties.",
        "BFF Gateway"
      ),
      messages: [
        msg("Level 3 — DoorDash Enterprise. The Service Mesh (Envoy) adds mTLS between all three parties."),
        msg(
          "The three-sided marketplace has three client types: consumers, dashers, and merchants. Every service-to-service call is authenticated — compromised services cannot impersonate other parties."
        ),
        msg("Press ⌘K, search for \"Service Mesh (Istio)\", add it, then connect API Gateway → Service Mesh."),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("api_gateway", "service_mesh")],
      successMessage: "Service mesh added. Now the BFF Gateway.",
      errorMessage: "Add a Service Mesh connected from the API Gateway.",
    }),
    step({
      id: 2,
      title: "Add BFF Gateway",
      explanation:
        "DoorDash's BFF Gateway serves the consumer and dasher apps with optimized APIs. The BFF aggregates order state, dasher location, and merchant data for real-time tracking.",
      action: buildAction(
        "BFF Gateway",
        "Service Mesh",
        "BFF Gateway",
        "consumer and dasher apps being served with optimized APIs that aggregate order state, dasher location, and merchant data"
      ),
      why: "The consumer app and dasher app have different data needs. The BFF tailors responses for each — the consumer sees menu and order tracking; the dasher sees navigation and pickup details.",
      component: component("bff_gateway", "BFF Gateway"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "BFF Gateway",
        "serve consumer and dasher apps with optimized APIs aggregating order state, dasher location, and merchant data",
        "The consumer app and dasher app have different data needs — the BFF tailors responses for each.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "Service Mesh",
        "DoorDash's BFF Gateway serves the consumer and dasher apps with optimized APIs. The BFF aggregates order state, dasher location, and merchant data for real-time tracking.",
        "Token Bucket Limiter"
      ),
      messages: [
        msg("DoorDash's BFF Gateway serves the consumer and dasher apps with optimized APIs."),
        msg(
          "The BFF aggregates order state, dasher location, and merchant data for real-time tracking. The consumer sees menu and order tracking; the dasher sees navigation and pickup details."
        ),
        msg("Press ⌘K, search for \"BFF Gateway\", add it, then connect Service Mesh → BFF Gateway."),
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("service_mesh", "bff_gateway")],
      successMessage: "BFF Gateway added. Now rate limiting.",
      errorMessage: "Add a BFF Gateway connected from the Service Mesh.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "DoorDash's Rate Limiter uses token buckets per consumer: rate-limited at the API gateway to prevent order spam. Token buckets also protect the dispatch system from burst requests during peak hours.",
      action: buildAction(
        "Token Bucket Rate Limiter",
        "BFF Gateway",
        "Token Bucket Rate Limiter",
        "token buckets per consumer being used to prevent order spam and protect dispatch from burst requests during peak hours"
      ),
      why: "Token buckets prevent abuse while allowing legitimate burst traffic. During lunch rush, many customers place orders quickly — the rate limiter allows bursts up to the bucket size without blocking real users.",
      component: component("token_bucket_limiter", "Token Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "Token Bucket Rate Limiter",
        "prevent order spam with token buckets per consumer while allowing legitimate burst traffic during lunch and dinner rushes",
        "Token buckets prevent abuse while allowing legitimate bursts during peak hours.",
        "Token Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Rate Limiter",
        "BFF Gateway",
        "DoorDash's Rate Limiter uses token buckets per consumer: rate-limited at the API gateway to prevent order spam. Token buckets also protect the dispatch system from burst requests during peak hours.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg("DoorDash's Rate Limiter uses token buckets per consumer to prevent order spam."),
        msg(
          "Token buckets also protect the dispatch system from burst requests during peak hours. During lunch rush, the rate limiter allows bursts up to the bucket size without blocking real users."
        ),
        msg("Press ⌘K, search for \"Token Bucket Rate Limiter\", add it, then connect BFF Gateway → Token Bucket Rate Limiter."),
      ],
      requiredNodes: ["token_bucket_limiter"],
      requiredEdges: [edge("bff_gateway", "token_bucket_limiter")],
      successMessage: "Rate limiting added. Now distributed tracing.",
      errorMessage: "Add a Token Bucket Rate Limiter connected from the BFF Gateway.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "DoorDash's OTel Collector traces order placement through dispatch, dasher acceptance, and delivery. A single order touches 20+ services — distributed tracing is essential for debugging late deliveries.",
      action: buildAction(
        "OpenTelemetry Collector",
        "Order",
        "OpenTelemetry Collector",
        "order placement being traced through dispatch, dasher acceptance, and delivery across 20+ services"
      ),
      why: "Debugging a late delivery means tracing a single order across 20+ services. Without distributed tracing, finding the bottleneck is like finding a needle in a haystack.",
      component: component("otel_collector", "OpenTelemetry Collector"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "OTel Collector",
        "trace order placement through dispatch, dasher acceptance, and delivery across 20+ services",
        "A single order touches 20+ services — distributed tracing is essential for debugging late deliveries.",
        "OpenTelemetry Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "Order Service",
        "DoorDash's OTel Collector traces order placement through dispatch, dasher acceptance, and delivery. A single order touches 20+ services — distributed tracing is essential for debugging late deliveries.",
        "Correlation ID Handler"
      ),
      messages: [
        msg("DoorDash's OTel Collector traces order placement through dispatch, dasher acceptance, and delivery."),
        msg(
          "A single order touches 20+ services. Distributed tracing links spans across all services — debugging a late delivery means tracing a single order from placement to delivery."
        ),
        msg("Press ⌘K, search for \"OpenTelemetry Collector\", add it, then connect Order Service → OpenTelemetry Collector."),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("order_service", "otel_collector")],
      successMessage: "Distributed tracing added. Now correlation IDs.",
      errorMessage: "Add an OpenTelemetry Collector connected from the Order Service.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "DoorDash's Correlation ID links an order from placement to delivery: cart service, delivery estimation, merchant acceptance, dasher dispatch, and tracking. Debugging a late delivery requires tracing across all these steps.",
      action: buildAction(
        "Correlation ID Handler",
        "OpenTelemetry",
        "Correlation ID Handler",
        "correlation IDs linking orders across cart, delivery estimation, merchant acceptance, dasher dispatch, and tracking services"
      ),
      why: "Every service in the order lifecycle generates logs. Correlation IDs link them together — searching for a correlation ID returns the complete order journey.",
      component: component("correlation_id_handler", "Correlation ID Handler"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "Correlation ID Handler",
        "link orders across cart, delivery estimation, merchant acceptance, dasher dispatch, and tracking with correlation IDs",
        "Correlation IDs link logs across the entire order lifecycle for end-to-end debugging.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "OpenTelemetry Collector",
        "DoorDash's Correlation ID links an order from placement to delivery: cart service, delivery estimation, merchant acceptance, dasher dispatch, and tracking. Debugging a late delivery requires tracing across all these steps.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg("DoorDash's Correlation ID links an order from placement to delivery across all services."),
        msg(
          "Cart service, delivery estimation, merchant acceptance, dasher dispatch, and tracking all participate in the order lifecycle. Correlation IDs link logs across all these steps."
        ),
        msg("Press ⌘K, search for \"Correlation ID Handler\", add it, then connect OpenTelemetry Collector → Correlation ID Handler."),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("otel_collector", "correlation_id_handler")],
      successMessage: "Correlation IDs added. Now mTLS certificates.",
      errorMessage: "Add a Correlation ID Handler connected from the OpenTelemetry Collector.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "DoorDash's SPIFFE CA issues certificates to every delivery service, dispatch worker, and merchant integration. Compromised services must not be able to impersonate other parties in the marketplace.",
      action: buildAction(
        "mTLS Certificate Authority",
        "Service Mesh",
        "mTLS Certificate Authority",
        "SPIFFE CA issuing certificates to every delivery service, dispatch worker, and merchant integration for workload identity"
      ),
      why: "SPIFFE workload identity proves service identity without shared secrets. A compromised service cannot obtain certificates for other services — limiting blast radius of breaches.",
      component: component("mtls_certificate_authority", "mTLS Certificate Authority"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "SPIFFE CA",
        "issue certificates to every delivery service, dispatch worker, and merchant integration for workload identity",
        "SPIFFE workload identity proves service identity without shared secrets.",
        "mTLS Certificate Authority"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "DoorDash's SPIFFE CA issues certificates to every delivery service, dispatch worker, and merchant integration. Compromised services must not be able to impersonate other parties in the marketplace.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg("DoorDash's SPIFFE CA issues certificates to every delivery service, dispatch worker, and merchant integration."),
        msg(
          "Compromised services cannot obtain certificates for other services — limiting the blast radius of breaches. Every workload has cryptographic identity."
        ),
        msg("Press ⌘K, search for \"mTLS Certificate Authority\", add it, then connect Service Mesh → mTLS Certificate Authority."),
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "mTLS CA added. Now cache stampede protection.",
      errorMessage: "Add an mTLS Certificate Authority connected from the Service Mesh.",
    }),
    step({
      id: 7,
      title: "Add Cache Stampede Guard",
      explanation:
        "DoorDash's Cache Stampede Guard protects menu caches from stampedes when a popular restaurant updates its menu. Lock-assisted refresh ensures only one worker updates the menu cache.",
      action: buildAction(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Cache Stampede Guard",
        "menu caches being protected from stampedes with lock-assisted refresh — only one worker updates the cache during popular restaurant updates"
      ),
      why: "When a cache entry expires, many requests simultaneously miss the cache and hit the database. Lock-assisted refresh ensures only one worker refreshes while others wait.",
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "Cache Stampede Guard",
        "protect menu caches from stampedes when a popular restaurant updates its menu with lock-assisted refresh",
        "When a cache entry expires, many requests simultaneously miss the cache and hit the database.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "DoorDash's Cache Stampede Guard protects menu caches from stampedes when a popular restaurant updates its menu. Lock-assisted refresh ensures only one worker updates the menu cache.",
        "Change Data Cache"
      ),
      messages: [
        msg("DoorDash's Cache Stampede Guard protects menu caches from stampedes during popular restaurant updates."),
        msg(
          "When a cache entry expires, many requests simultaneously miss the cache and hit the database. Lock-assisted refresh ensures only one worker refreshes while others wait for the result."
        ),
        msg("Press ⌘K, search for \"Cache Stampede Guard\", add it, then connect In-Memory Cache → Cache Stampede Guard."),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache stampede protection added. Now ML inference caching.",
      errorMessage: "Add a Cache Stampede Guard connected from the In-Memory Cache.",
    }),
    step({
      id: 8,
      title: "Add Change Data Cache",
      explanation:
        "DoorDash's CDC pipeline precomputes delivery predictions and dasher assignment scores. ML inference results are cached in Redis for sub-10ms retrieval during dispatch.",
      action: buildAction(
        "Change Data Cache",
        "CDC Connector",
        "Change Data Cache",
        "delivery predictions and dasher assignment scores being precomputed and cached in Redis for sub-10ms ML inference during dispatch"
      ),
      why: "Dispatch decisions must happen in milliseconds. Precomputing ML inference results and caching them eliminates the latency of running the model during peak order volume.",
      component: component("change_data_cache", "Change Data Cache"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "CDC Cache",
        "precompute delivery predictions and dasher assignment scores cached in Redis for sub-10ms ML inference during dispatch",
        "Dispatch decisions must happen in milliseconds — precomputing ML results eliminates model latency.",
        "Change Data Cache"
      ),
      celebrationMessage: buildCelebration(
        "Change Data Cache",
        "CDC Connector",
        "DoorDash's CDC pipeline precomputes delivery predictions and dasher assignment scores. ML inference results are cached in Redis for sub-10ms retrieval during dispatch.",
        "Data Warehouse"
      ),
      messages: [
        msg("DoorDash's CDC pipeline precomputes delivery predictions and dasher assignment scores."),
        msg(
          "ML inference results are cached in Redis for sub-10ms retrieval during dispatch. This eliminates the latency of running the ML model during peak order volume."
        ),
        msg("Press ⌘K, search for \"Change Data Cache\", add it, then connect CDC Connector → Change Data Cache."),
      ],
      requiredNodes: ["change_data_cache"],
      requiredEdges: [edge("cdc_connector", "change_data_cache")],
      successMessage: "ML inference caching added. Now the data warehouse.",
      errorMessage: "Add a Change Data Cache connected from the CDC Connector.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "DoorDash's Data Warehouse stores delivery analytics: fulfillment rates, dasher efficiency, and demand forecasting. This data trains DoorDash's ML models for dispatch and ETA prediction.",
      action: buildAction(
        "Data Warehouse",
        "CDC Connector",
        "Data Warehouse",
        "delivery analytics — fulfillment rates, dasher efficiency, and demand forecasting — being stored for ML model training"
      ),
      why: "ML models improve with more training data. The data warehouse aggregates analytics from all delivery operations — this becomes the training set for dispatch and ETA models.",
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "Data Warehouse",
        "store delivery analytics for ML model training: fulfillment rates, dasher efficiency, and demand forecasting",
        "ML models improve with more training data — the data warehouse aggregates analytics from all delivery operations.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "CDC Connector",
        "DoorDash's Data Warehouse stores delivery analytics: fulfillment rates, dasher efficiency, and demand forecasting. This data trains DoorDash's ML models for dispatch and ETA prediction.",
        "Event Store"
      ),
      messages: [
        msg("DoorDash's Data Warehouse stores delivery analytics for ML model training."),
        msg(
          "Fulfillment rates, dasher efficiency, and demand forecasting data becomes the training set for dispatch and ETA models. Better data means more accurate predictions."
        ),
        msg("Press ⌘K, search for \"Data Warehouse\", add it, then connect CDC Connector → Data Warehouse."),
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("cdc_connector", "data_warehouse")],
      successMessage: "Data warehouse added. Now the event store.",
      errorMessage: "Add a Data Warehouse connected from the CDC Connector.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "DoorDash's Event Store stores every order lifecycle event: placed, accepted, picked up, delivered, cancelled. Event sourcing enables dispute resolution and fraud detection.",
      action: buildAction(
        "Event Store",
        "Order",
        "Event Store",
        "every order lifecycle event being stored: placed, accepted, picked up, delivered, cancelled — enabling dispute resolution and fraud detection"
      ),
      why: "Event sourcing provides an immutable audit trail. For dispute resolution, DoorDash can replay the exact sequence of events. For fraud detection, anomalies in the event sequence indicate suspicious activity.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "Event Store",
        "store every order lifecycle event for dispute resolution and fraud detection",
        "Event sourcing provides an immutable audit trail — replay the exact sequence for disputes.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "Order Service",
        "DoorDash's Event Store stores every order lifecycle event: placed, accepted, picked up, delivered, cancelled. Event sourcing enables dispute resolution and fraud detection.",
        "Saga Orchestrator"
      ),
      messages: [
        msg("DoorDash's Event Store stores every order lifecycle event for dispute resolution and fraud detection."),
        msg(
          "Event sourcing provides an immutable audit trail. For dispute resolution, DoorDash can replay the exact sequence. For fraud detection, anomalies in the event sequence indicate suspicious activity."
        ),
        msg("Press ⌘K, search for \"Event Store\", add it, then connect Order Service → Event Store."),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("order_service", "event_store")],
      successMessage: "Event store added. Now saga orchestration.",
      errorMessage: "Add an Event Store connected from the Order Service.",
    }),
    step({
      id: 11,
      title: "Add Saga Orchestrator",
      explanation:
        "DoorDash's Saga Orchestrator manages the order fulfillment saga: validate order, reserve dasher, notify merchant, charge consumer, update dasher earnings. Each step can fail and requires compensating transactions.",
      action: buildAction(
        "Saga Orchestrator",
        "Order",
        "Saga Orchestrator",
        "order fulfillment saga being orchestrated: validate order, reserve dasher, notify merchant, charge consumer, update dasher earnings"
      ),
      why: "The order fulfillment saga has 5 steps that can fail independently. If dasher reservation fails after merchant notification, the saga must roll back — compensating transactions undo the notification.",
      component: component("saga_orchestrator", "Saga Orchestrator"),
      openingMessage: buildOpeningL3(
        "DoorDash",
        "Saga Orchestrator",
        "manage order fulfillment saga: validate order, reserve dasher, notify merchant, charge consumer, update dasher earnings",
        "The order fulfillment saga has 5 steps that can fail independently — compensating transactions handle rollbacks.",
        "Saga Orchestrator"
      ),
      celebrationMessage: buildCelebration(
        "Saga Orchestrator",
        "Order Service",
        "DoorDash's Saga Orchestrator manages the order fulfillment saga: validate order, reserve dasher, notify merchant, charge consumer, update dasher earnings. Each step can fail and requires compensating transactions.",
        "You have built DoorDash Enterprise"
      ),
      messages: [
        msg("DoorDash's Saga Orchestrator manages the order fulfillment saga across 5 steps."),
        msg(
          "Validate order, reserve dasher, notify merchant, charge consumer, update dasher earnings. Each step can fail independently and requires compensating transactions for rollback."
        ),
        msg("Press ⌘K, search for \"Saga Orchestrator\", add it, then connect Order Service → Saga Orchestrator."),
      ],
      requiredNodes: ["saga_orchestrator"],
      requiredEdges: [edge("order_service", "saga_orchestrator")],
      successMessage: "Saga orchestration added. You have built DoorDash Enterprise.",
      errorMessage: "Add a Saga Orchestrator connected from the Order Service.",
    }),
  ],
});

export const doordashTutorial: Tutorial = tutorial({
  id: 'doordash-architecture',
  title: 'How to Design DoorDash Architecture',
  description:
    'Build a food delivery platform completing 2 billion deliveries annually. Learn real-time order routing, dasher dispatch, ETA prediction, geofencing, and the three-sided marketplace problem.',
  difficulty: 'Advanced',
  category: 'Delivery Platform',
  isLive: false,
  icon: 'Bike',
  color: '#ff3008',
  tags: ['Real-time Routing', 'ETA', 'Geofencing', 'Dispatch'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
