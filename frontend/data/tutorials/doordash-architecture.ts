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
  estimatedTime: '~30 mins',
  levels: [l1],
});
