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
  title: 'Messaging at Billion-User Scale',
  subtitle: 'Design a messaging system for 2 billion users in 10 steps',
  description:
    'Design a messaging system for 2 billion users. Understand message delivery guarantees, presence detection, offline queuing, and end-to-end encryption architecture.',
  estimatedTime: '~28 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build WhatsApp from scratch. 2 billion users, 100 billion messages per day, end-to-end encrypted. Every design decision is shaped by the unique constraint of client-side encryption — WhatsApp's servers never see plaintext messages.",
  steps: [
    step({
      id: 1,
      title: 'Start with the Client',
      explanation:
        "WhatsApp's client is the iOS and Android app. It maintains a persistent WebSocket connection to the server for real-time message delivery and handles local encryption/decryption of all messages.",
      action: buildFirstStepAction('Mobile'),
      why: "WhatsApp is mobile-first by design. The client handles end-to-end encryption locally — the server never sees plaintext messages. This shapes the entire architecture.",
      component: component('client_mobile', 'Mobile'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'WebSocket connections',
        'maintain persistent connections for real-time message delivery with client-side end-to-end encryption',
        "End-to-end encryption means WhatsApp's servers never see your message content — only the client-side app can decrypt messages using private keys stored on your device.",
        'Mobile'
      ),
      celebrationMessage: buildCelebration(
        'Mobile Client',
        'nothing yet',
        "WhatsApp is mobile-first by design. The client handles end-to-end encryption locally — the server never sees plaintext messages. This shapes the entire architecture.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the WhatsApp Architecture tutorial. 2 billion users, 100 billion messages per day, end-to-end encrypted."
        ),
        msg(
          "WhatsApp's client is the iOS/Android app. It maintains a persistent WebSocket connection and handles all encryption locally — the server never sees your message content."
        ),
        msg("Press ⌘K and search for \"Mobile\" and press Enter to add the client to the canvas."),
      ],
      requiredNodes: ['client_mobile'],
      requiredEdges: [],
      successMessage: 'Client added. Now the entry layer.',
      errorMessage: 'Add a Mobile Client node using ⌘K → search "Mobile".',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        "All connections from WhatsApp clients flow through an API Gateway. It handles initial connection routing, authentication, and directs clients to the correct chat server.",
      action: buildAction('API Gateway', 'Mobile', 'API Gateway', 'all client connections being authenticated and routed to the correct persistent WebSocket server'),
      why: "With 2 billion users, WhatsApp needs a single entry point that can route connections to thousands of chat servers. The API Gateway abstracts this routing complexity.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'API Gateway',
        'route 2 billion persistent WebSocket connections to the correct chat server based on user session',
        "The gateway authenticates each connection and directs it to the specific chat server that maintains the user's persistent WebSocket — distributing load across thousands of servers.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Mobile Client',
        "The API Gateway routes 2 billion connections across thousands of chat servers using connection affinity — once a client connects to a server, all their messages route through that same server for consistency.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "2 billion clients need to connect to the backend. They all go through the API Gateway first."
        ),
        msg(
          "The gateway authenticates the connection and routes it to the right chat server — the one that will maintain the persistent WebSocket for that user."
        ),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Mobile → API Gateway."),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_mobile', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now distribute the connections.',
      errorMessage: 'Add an API Gateway and connect Mobile → API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "WhatsApp uses persistent WebSocket connections. A single WhatsApp server handles 1 million concurrent connections — the highest connection density in the industry, made possible by Erlang's actor model.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'persistent WebSocket connections being distributed across thousands of Erlang-based chat servers with connection affinity'),
      why: "With 2 billion users, even at 10% concurrency that's 200 million simultaneous connections. The load balancer distributes these across thousands of Erlang-based chat servers.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'Load Balancer',
        'distribute 200 million concurrent WebSocket connections across thousands of Erlang-based chat servers',
        "WhatsApp's servers handle 1 million concurrent connections each using Erlang's lightweight process model — the load balancer maintains connection affinity so users stay on their assigned server.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "WhatsApp servers handle 1 million concurrent connections each using Erlang's actor model. The load balancer maintains connection affinity — once assigned to a server, all future messages from that user route to the same server.",
        'Auth Service'
      ),
      messages: [
        msg(
          "WhatsApp's load balancer has an unusual property — it routes persistent WebSocket connections, not stateless HTTP requests."
        ),
        msg(
          "Each WhatsApp server handles 1 million concurrent connections using Erlang's lightweight process model. The load balancer distributes users across these servers and must maintain connection affinity."
        ),
        msg(
          'Press ⌘K and search for "Load Balancer" and press Enter to add it, then connect API Gateway → Load Balancer.'
        ),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load balancer added. Now the auth layer.',
      errorMessage: 'Add a Load Balancer and connect API Gateway → Load Balancer.',
    }),
    step({
      id: 4,
      title: 'Add Auth Service',
      explanation:
        "WhatsApp authenticates users via phone number verification using SMS OTP. The Auth Service validates the OTP, issues a session token, and registers the device's public key for end-to-end encryption.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'phone number + SMS OTP verification issuing session tokens and registering device public keys for E2E encryption'),
      why: "Phone number auth is simpler than username/password but requires SMS delivery infrastructure. The Auth Service also manages the key exchange that enables end-to-end encryption between devices.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'Auth Service',
        'validate phone number + SMS OTP and register device public encryption keys for end-to-end encryption',
        "This key exchange is what enables end-to-end encryption — the Auth Service coordinates the initial handshake where devices exchange public keys, enabling clients to encrypt messages only the recipient can decrypt.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "WhatsApp uses phone number auth — no username or password. The Auth Service validates the OTP and registers the device's public encryption key, enabling end-to-end encryption between any two devices.",
        'Chat Service'
      ),
      messages: [
        msg(
          "WhatsApp authenticates via phone number — no username or password. You get an SMS OTP, enter it, and you're in."
        ),
        msg(
          "The Auth Service validates the OTP, creates a session, and registers your device's public encryption key. This key exchange is what enables end-to-end encryption between devices."
        ),
        msg("Press ⌘K and search for \"Auth Service\" and press Enter to add it, then connect Load Balancer → Auth Service."),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth added and connected. Now the core messaging service.',
      errorMessage: 'Add an Auth Service and connect Load Balancer → Auth Service.',
    }),
    step({
      id: 5,
      title: 'Add Chat Service',
      explanation:
        "The Chat Service routes messages between users. It follows a store-and-forward model: the message is stored on the server until the recipient's device confirms delivery, then deleted.",
      action: buildAction('Microservice', 'Auth', 'Chat Service', 'encrypted messages being received, stored temporarily, and delivered to recipient devices with delivery confirmation'),
      why: "The store-and-forward model is what enables delivery guarantees. The server holds the message until the recipient acknowledges it, then removes it — keeping storage minimal.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'Chat Service',
        'receive and route encrypted messages between users using store-and-forward with 30-day delivery guarantees',
        "Store-and-forward means the server holds your message until the recipient confirms receipt — then deletes it. WhatsApp's servers never hold messages long-term, keeping storage costs minimal at 100 billion messages per day.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Chat Service',
        'Auth Service',
        "The store-and-forward model enables WhatsApp's delivery guarantees. Messages wait up to 30 days for offline recipients. After 30 days, the sender gets a delivery failure notification. The server deletes messages after successful delivery.",
        'Message Queue'
      ),
      messages: [
        msg("The Chat Service is the core of WhatsApp — it routes encrypted messages between users."),
        msg(
          "It uses store-and-forward: your message is stored on the server until the recipient's device confirms receipt, then deleted. WhatsApp's servers never hold messages long-term."
        ),
        msg("Press ⌘K and search for \"Microservice\" and press Enter to add it, then connect Auth Service → Chat Service."),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Chat Service added. Now offline message storage.',
      errorMessage: 'Add a Microservice (Chat Service) and connect Auth Service → Chat Service.',
    }),
    step({
      id: 6,
      title: 'Add Message Queue',
      explanation:
        "WhatsApp uses a custom queue for offline users. Messages wait up to 30 days. After 30 days, the sender gets a delivery failure notification.",
      action: buildAction(
        'Message Queue',
        'Microservice',
        'Message Queue',
        'messages for offline recipients being buffered until they come online, with a 30-day retry window'
      ),
      why: "Without a queue, messages to offline users would be lost. The queue buffers them until the recipient comes online, enabling the delivery guarantee that makes WhatsApp reliable.",
      component: component('message_queue', 'Message'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'Message Queue',
        'buffer messages for offline recipients with a 30-day delivery window before returning failure',
        "Without a queue, a message to an offline user would be lost. The queue holds it until the recipient comes online — up to 30 days. After that, the sender gets a failure notification.",
        'Message Queue'
      ),
      celebrationMessage: buildCelebration(
        'Message Queue',
        'Chat Service',
        "Messages wait up to 30 days in the queue. When the recipient comes online, messages are delivered in order. After 30 days, the sender gets a delivery failure notification. This is what makes WhatsApp reliable even when recipients are offline.",
        'NoSQL Database'
      ),
      messages: [
        msg("What happens when you send a message to someone who's offline? It goes into a queue."),
        msg(
          "WhatsApp's queue holds messages for up to 30 days. When the recipient comes online, messages are delivered in order. After 30 days, the sender gets a failure notification."
        ),
        msg("Press ⌘K and search for \"Message Queue\" and press Enter to add it, then connect Chat Service → Message Queue."),
      ],
      requiredNodes: ['message_queue'],
      requiredEdges: [edge('microservice', 'message_queue')],
      successMessage: 'Message Queue added. Now persistent storage.',
      errorMessage: 'Add a Message Queue and connect Chat Service → Message Queue.',
    }),
    step({
      id: 7,
      title: 'Add NoSQL Database',
      explanation:
        "WhatsApp stores message metadata, user profiles, and group information in a NoSQL database. Message content itself is deleted after delivery — only metadata (timestamps, delivery status) is retained.",
      action: buildAction(
        'NoSQL Database',
        'Microservice',
        'NoSQL Database',
        'message metadata — not content — being persisted: delivery timestamps, read receipts, group membership, and user profiles'
      ),
      why: "Message metadata has a flexible schema and requires high write throughput. NoSQL handles billions of status updates (sent, delivered, read) per day without the overhead of SQL joins.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'NoSQL Database',
        'store message metadata — not content — for billions of daily messages: delivery timestamps, read receipts, group membership',
        "WhatsApp deletes message content after delivery. What persists is metadata: who messaged whom, when, delivery status, read receipts. At 100 billion messages per day, that's 100 billion status updates — NoSQL handles this where SQL would struggle.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Chat Service',
        "WhatsApp only stores metadata — never message content. The database holds delivery timestamps, read receipts, and group memberships. NoSQL handles billions of daily status updates without schema overhead.",
        'Presence Service'
      ),
      messages: [
        msg(
          "WhatsApp stores message metadata — not content — in a NoSQL database. Content is deleted after delivery."
        ),
        msg(
          "The database stores delivery timestamps, read receipts, group membership, and user profiles. At 100 billion messages per day, that's 100 billion status updates — NoSQL handles this throughput where SQL would struggle."
        ),
        msg("Press ⌘K and search for \"NoSQL Database\" and press Enter to add it, then connect Chat Service → NoSQL Database."),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('microservice', 'nosql_db')],
      successMessage: 'NoSQL Database added. Now presence detection.',
      errorMessage: 'Add a NoSQL Database and connect Chat Service → NoSQL Database.',
    }),
    step({
      id: 8,
      title: 'Add Presence Service',
      explanation:
        "'Last seen' data is one of WhatsApp's most queried pieces of data — billions of presence checks happen per hour. The Presence Service uses a distributed hash table to serve online/offline status at scale.",
      action: buildAction(
        'Presence Service',
        'Microservice',
        'Presence Service',
        'online/offline status being tracked for 2 billion users and updated in real-time as users come and go'
      ),
      why: "Presence is queried every time you open a chat. At 2 billion users, even 1% opening a chat simultaneously is 20 million presence queries per second. It needs its own dedicated service.",
      component: component('presence_service', 'Presence'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'Presence Service',
        'serve billions of last-seen queries per hour using a distributed hash table partitioned by user ID',
        "Every time you open a WhatsApp chat, you see 'last seen 2 minutes ago'. At 2 billion users, even 1% opening chats simultaneously is 20 million presence queries per second — it needs its own dedicated, highly available service.",
        'Presence Service'
      ),
      celebrationMessage: buildCelebration(
        'Presence Service',
        'Chat Service',
        "'Last seen' is one of the most queried data points in WhatsApp — billions of checks per hour. The Presence Service uses a distributed hash table to serve this at scale, partitioned by user ID for horizontal scalability.",
        'Media Service'
      ),
      messages: [
        msg(
          "Every time you open a WhatsApp chat, you see 'last seen 2 minutes ago'. That's the Presence Service."
        ),
        msg(
          "It's one of the most queried services in WhatsApp — billions of presence checks per hour. WhatsApp uses a distributed hash table to serve this at scale, partitioned by user ID."
        ),
        msg(
          'Press ⌘K and search for "Microservice" and press Enter to add another one for the Presence Service, then connect Chat Service → Presence Service.'
        ),
      ],
      requiredNodes: ['presence_service'],
      requiredEdges: [edge('microservice', 'presence_service')],
      successMessage: 'Presence Service added. Now media handling.',
      errorMessage: 'Add a second Microservice (Presence Service) and connect it from the Chat Service.',
    }),
    step({
      id: 9,
      title: 'Add Media Service',
      explanation:
        "Images, videos, and documents are handled by a dedicated Media Service. Media is compressed and encrypted on the client before upload, stored in object storage, and served via CDN.",
      action: buildAction(
        'Media Service',
        'Microservice',
        'Media Service',
        'media files being compressed and encrypted on the client before upload, then processed and handed off to storage'
      ),
      why: "Media files are large and expensive to transfer. Separating media handling into its own service allows independent scaling — media uploads are bursty and require different infrastructure than text messages.",
      component: component('media_service', 'Media'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'Media Service',
        'receive media uploads after client-side encryption, compress files, and coordinate storage and CDN delivery',
        "Media files are orders of magnitude larger than text messages. Separating media into its own service lets WhatsApp scale media infrastructure independently — uploads are bursty and require different bandwidth and processing than text.",
        'Media Service'
      ),
      celebrationMessage: buildCelebration(
        'Media Service',
        'Chat Service',
        "Media is encrypted on the client before upload — WhatsApp's servers store encrypted blobs they can never read. The Media Service coordinates compression, storage, and CDN delivery. Media is deleted from servers after 30 days.",
        'Object Storage'
      ),
      messages: [
        msg("Text messages are tiny. But photos and videos are large — they need their own service."),
        msg(
          "The Media Service handles upload, compression, and storage. Media is encrypted on the client before upload, so the server stores encrypted blobs it can never read."
        ),
        msg(
          'Press ⌘K and search for "Microservice" and press Enter to add another one for the Media Service, then connect Chat Service → Media Service.'
        ),
      ],
      requiredNodes: ['media_service'],
      requiredEdges: [edge('microservice', 'media_service')],
      successMessage: 'Media Service added. Now the storage layer.',
      errorMessage: 'Add a third Microservice (Media Service) and connect it from the Chat Service.',
    }),
    step({
      id: 10,
      title: 'Add Object Storage',
      explanation:
        "All encrypted media files are stored in object storage. WhatsApp stores media for 30 days — after that it's deleted from servers. Users must re-download from the sender if they need it again.",
      action: buildAction(
        'Object Storage',
        'Media Service',
        'Object Storage',
        'encrypted media files being stored with a 30-day retention policy before automatic deletion'
      ),
      why: "Object storage is infinitely scalable and cheap per GB — perfect for encrypted binary blobs. The 30-day retention policy keeps storage costs manageable at 2 billion user scale.",
      component: component('object_storage', 'Object'),
      openingMessage: buildOpeningL1(
        'WhatsApp',
        'Object Storage',
        'persist encrypted media files with a 30-day retention policy — after that they are permanently deleted',
        "At 2 billion users, even 1 photo per user per day is enormous storage. The 30-day retention policy keeps costs manageable — after 30 days, the media is gone from WhatsApp's servers. Users must re-download from the sender's device if they want it again.",
        'Object Storage'
      ),
      celebrationMessage: buildCelebration(
        'Object Storage',
        'Media Service',
        "Encrypted media files land in object storage — think S3. WhatsApp stores media for 30 days, then deletes it. The 30-day limit keeps storage costs manageable at 2 billion user scale. You have built WhatsApp.",
        'nothing — you have built WhatsApp'
      ),
      messages: [
        msg("Encrypted media files need a home. That's object storage — think S3."),
        msg(
          "WhatsApp stores media for 30 days. After that it's deleted from servers. The 30-day limit keeps storage costs manageable — at 2 billion users, even 1 photo per user per day is enormous."
        ),
        msg("Press ⌘K and search for \"Object Storage\" and press Enter to add it, then connect Media Service → Object Storage."),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('media_service', 'object_storage')],
      successMessage: 'Object Storage added and connected. You have built WhatsApp.',
      errorMessage: 'Add an Object Storage and connect Media Service → Object Storage.',
    }),
  ],
});

// ── Level 2 — Production Ready (9 steps) ─────────────────────────────────────

const l2 = level({
  level: 2,
  title: 'Production Ready',
  subtitle: 'Scale to billions of concurrent messages',
  description:
    "Your messaging system delivers messages. Now add what WhatsApp actually ships: Kafka for message events, notification workers, SQL for user data, CDC for analytics, structured logging, and SLO tracking.",
  estimatedTime: '~25 mins',
  unlocks: 'Expert Architecture',
  prerequisite: 'Builds on your Level 1 diagram',
  contextMessage:
    "Level 2: Production Ready. Your messaging system delivers messages at scale. Now add Kafka event streaming, notifications, SQL, CDC analytics, structured logging, and SLO tracking.",
  steps: [
    step({
      id: 1,
      title: 'Add Kafka Streaming',
      explanation:
        "Every message, call, and status update is published to Kafka. Trending detection consumes message events in real time. Analytics pipelines consume engagement data for user growth modeling.",
      action: buildAction(
        'Kafka / Streaming',
        'Load Balancer',
        'Kafka Streaming',
        'every message, call, and status update being streamed to trending and analytics consumers in real time'
      ),
      why: "Without Kafka, trending detection would require synchronous database queries. Kafka decouples event producers from consumers — the message path stays fast regardless of downstream processing.",
      component: component('kafka_streaming', 'Kafka / Streaming', 'Kafka / Streaming'),
      openingMessage: buildOpeningL2(
        'WhatsApp',
        'Kafka',
        'stream every message and call to trending and analytics consumers in real time',
        'Without Kafka, trending detection would require synchronous database queries.',
        'Kafka / Streaming'
      ),
      celebrationMessage: buildCelebration(
        'Kafka Streaming',
        'Load Balancer',
        "WhatsApp publishes billions of message events per day to Kafka. Trending detection reacts within minutes. Analytics pipelines consume engagement data for user growth modeling.",
        'Notification Worker'
      ),
      messages: [
        msg("Level 2 — Production Ready. Every message, call, and status update is published to Kafka for downstream consumers."),
        msg("Trending detection consumes message events to compute trending topics. Analytics pipelines consume engagement for user growth modeling."),
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
        "Notification workers consume Kafka events to send push notifications — missed call alerts, voice message availability, and group invite notifications when users come back online.",
      action: buildAction(
        'Worker',
        'Kafka',
        'Notification Worker',
        'missed call alerts and voice message notifications being sent via push when users come back online'
      ),
      why: "If WhatsApp sent notifications synchronously, slow push delivery could delay message processing. Background workers handle notification delivery asynchronously.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL2(
        'WhatsApp',
        'Notification Worker',
        'deliver missed call alerts and voice message notifications asynchronously via push',
        'Synchronous notifications would delay message processing — background workers handle delivery asynchronously.',
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Notification Worker',
        'Kafka Streaming',
        "WhatsApp's notification workers deliver missed call alerts and voice message notifications. All delivery is asynchronous — message processing is never delayed by notification delivery.",
        'CDC Connector'
      ),
      messages: [
        msg("Notification workers consume Kafka events to send missed call alerts and voice message notifications."),
        msg("All notification delivery is asynchronous — message processing is never delayed by slow push delivery."),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Kafka Streaming → Notification Worker."),
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
        "The CDC Connector captures row-level changes from WhatsApp's NoSQL database and streams them to Kafka for analytics — user profile updates, group membership changes, and message metadata without adding load to the production database.",
      action: buildAction(
        'CDC Connector (Debezium)',
        'NoSQL Database',
        'CDC Connector',
        'user and group changes being captured from the NoSQL transaction log and streamed to Kafka for analytics'
      ),
      why: "Without CDC, analytics queries would require direct database reads that add load to the production database. CDC captures changes from the transaction log — zero production query overhead.",
      component: component('cdc_connector', 'CDC Connector (Debezium)'),
      openingMessage: buildOpeningL2(
        'WhatsApp',
        'CDC Connector (Debezium)',
        'capture user and group changes from the NoSQL transaction log and stream to Kafka — zero production query overhead',
        'Without CDC, analytics queries add load to the production database — CDC captures changes from the transaction log.',
        'CDC Connector (Debezium)'
      ),
      celebrationMessage: buildCelebration(
        'CDC Connector',
        'NoSQL Database',
        "WhatsApp's CDC Connector captures every user profile update and group membership change from the NoSQL transaction log — streaming to Kafka for analytics without adding load to the production database.",
        'SQL Database'
      ),
      messages: [
        msg("CDC Connector captures row-level changes from the NoSQL database and streams them to Kafka for analytics."),
        msg("Without CDC, analytics queries would add load to the production database. CDC captures changes from the transaction log — zero query overhead."),
        msg("Press ⌘K and search for \"CDC Connector (Debezium)\" and press Enter to add it, then connect NoSQL Database → CDC Connector."),
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
        "WhatsApp stores user accounts, payment records for WhatsApp Business, and advertising data in PostgreSQL. Business payment data requires ACID transactions — a missed transaction is a dispute.",
      action: buildAction(
        'SQL Database',
        'Auth Service',
        'SQL Database',
        'user accounts and business payment records being stored with ACID guarantees for financial compliance'
      ),
      why: "Business payment records require auditable, ACID-compliant records. A missed transaction is a dispute that must be detectable and correctable.",
      component: component('sql_db', 'SQL Database'),
      openingMessage: buildOpeningL2(
        'WhatsApp',
        'SQL Database',
        'store user accounts and business payment records with ACID guarantees for financial compliance',
        'Business payment records require auditable, ACID-compliant records — eventual consistency is unacceptable.',
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Auth Service',
        "WhatsApp stores business payment records in PostgreSQL with full ACID compliance. Every transaction is recorded exactly once — detectable and correctable for dispute resolution.",
        'Structured Logger'
      ),
      messages: [
        msg("User accounts, business payment records, and advertising data need ACID compliance. PostgreSQL stores the authoritative records."),
        msg("Business payment records require auditable records. A missed transaction is a dispute that must be detectable and correctable."),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect Auth Service → SQL Database."),
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
        "WhatsApp's Structured Logger emits JSON-formatted logs with consistent field schemas — user_id, message_id, event_type, delivery_status. LogQL queries aggregate metrics across billions of logs per day.",
      action: buildAction(
        'Structured Logger',
        'Load Balancer',
        'Structured Logger',
        'JSON-formatted message traces being emitted with consistent schemas for user_id, message_id, and event_type'
      ),
      why: "Text logs require regex parsing — slow and error-prone at scale. Structured JSON logs enable LogQL queries that aggregate metrics across billions of entries in seconds.",
      component: component('structured_logger', 'Structured Logger'),
      openingMessage: buildOpeningL2(
        'WhatsApp',
        'Structured Logger',
        'emit JSON logs with consistent field schemas for user_id, message_id, and event_type across all services',
        'Text logs require regex parsing — structured JSON enables fast LogQL aggregation across billions of entries.',
        'Structured Logger'
      ),
      celebrationMessage: buildCelebration(
        'Structured Logger',
        'Load Balancer',
        "WhatsApp's Structured Logger emits JSON with consistent schemas: user_id, message_id, event_type, delivery_status. LogQL queries aggregate delivery metrics across billions of messages — enabling real-time health monitoring.",
        'SLO/SLI Tracker'
      ),
      messages: [
        msg("Structured Logger emits JSON-formatted logs with consistent schemas — user_id, message_id, event_type, delivery_status."),
        msg("LogQL queries aggregate metrics across billions of logs per day in seconds. Delivery health monitoring and anomaly detection use structured log queries."),
        msg("Press ⌘K and search for \"Structured Logger\" and press Enter to add it, then connect Load Balancer → Structured Logger."),
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
        "WhatsApp's SLO/SLI Tracker monitors message delivery latency, presence update latency, and WebSocket connection stability against defined Service Level Objectives. Message delivery latency SLO: 99.9% of messages delivered within 5 seconds.",
      action: buildAction(
        'SLO/SLI Tracker',
        'Metrics Collector',
        'SLO/SLI Tracker',
        'message delivery latency and presence update latency being tracked against SLOs — alerting when error budgets burn'
      ),
      why: "Without SLOs, engineering teams argue about what 'good' means. With SLOs, there's a clear contractual target — messages must be delivered within 5 seconds for 99.9% of deliveries.",
      component: component('slo_tracker', 'SLO/SLI Tracker'),
      openingMessage: buildOpeningL2(
        'WhatsApp',
        'SLO/SLI Tracker',
        'monitor message delivery latency and presence update latency against defined SLO targets',
        'Without SLOs, engineering teams argue about what acceptable performance means.',
        'SLO/SLI Tracker'
      ),
      celebrationMessage: buildCelebration(
        'SLO/SLI Tracker',
        'Metrics Collector',
        "WhatsApp's SLO: 99.9% of messages delivered within 5 seconds. The SLO/SLI Tracker alerts when error budgets burn — pages on-call before users notice slow message delivery.",
        'Error Budget Monitor'
      ),
      messages: [
        msg("The SLO/SLI Tracker monitors message delivery latency, presence update latency, and WebSocket connection stability against defined Service Level Objectives."),
        msg("WhatsApp's message delivery latency SLO: 99.9% of messages delivered within 5 seconds. When latency exceeds the error budget, on-call is paged."),
        msg("Press ⌘K and search for \"SLO/SLI Tracker\" and press Enter to add it, then connect Metrics Collector → SLO/SLI Tracker."),
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
        "WhatsApp's Error Budget Monitor tracks remaining reliability budget for message delivery latency SLO. When the error budget burns faster than acceptable, feature launches pause until reliability improves.",
      action: buildAction(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        'Error Budget Monitor',
        'error budget burn rate being tracked — pausing feature launches when budget depletes faster than acceptable'
      ),
      why: "The error budget is the 'spare' reliability. When depleted, feature launches pause. For messaging, reliability is non-negotiable — slow messages drive users to competitors.",
      component: component('error_budget_alert', 'Error Budget Monitor'),
      openingMessage: buildOpeningL2(
        'WhatsApp',
        'Error Budget Monitor',
        'track error budget burn rate — pausing feature launches when budget depletes to protect reliability',
        'For messaging apps, reliability is non-negotiable — slow messages drive users to competitors.',
        'Error Budget Monitor'
      ),
      celebrationMessage: buildCelebration(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        "WhatsApp's error budget policy: when more than 10% of the monthly budget burns in a week, feature launches pause. Engineering prioritizes reliability until the budget recovers — protecting 2 billion users.",
        'Level 3'
      ),
      messages: [
        msg("The Error Budget Monitor tracks remaining reliability budget for message delivery latency SLO."),
        msg("When the error budget burns faster than acceptable, feature launches pause until reliability improves. For messaging, slow messages drive users to competitors."),
        msg("Press ⌘K and search for \"Error Budget Monitor\" and press Enter to add it, then connect SLO/SLI Tracker → Error Budget Monitor."),
      ],
      requiredNodes: ['error_budget_alert'],
      requiredEdges: [edge('slo_tracker', 'error_budget_alert')],
      successMessage: 'Error budget monitoring added. WhatsApp is now production-ready.',
      errorMessage: 'Add an Error Budget Monitor connected from the SLO/SLI Tracker.',
    }),
  ],
});

// ── Level 3 — Expert Architecture (11 steps) ───────────────────────────────────

const l3 = level({
  level: 3,
  title: 'Expert Architecture',
  subtitle: 'Design like a WhatsApp senior engineer',
  description:
    "You have production WhatsApp. Now add what separates senior engineers — service mesh, GraphQL Federation, token bucket rate limiting, distributed tracing with correlation IDs, mTLS for service authentication, leader election for presence, and event sourcing.",
  estimatedTime: '~30 mins',
  prerequisite: 'Builds on your Level 2 diagram',
  contextMessage:
    "Level 3: Expert Architecture. Add service mesh, GraphQL Federation, advanced rate limiting, distributed tracing, mTLS, leader election, and event sourcing.",
  steps: [
    step({
      id: 1,
      title: 'Add Service Mesh (Istio)',
      explanation:
        "WhatsApp's Service Mesh uses Istio to manage all east-west traffic between services — automatic mTLS encryption, circuit breaking, retries, and load balancing at the sidecar proxy level.",
      action: buildAction(
        'Service Mesh (Istio)',
        'Load Balancer',
        'Service Mesh',
        'automatic mTLS and traffic management being enforced at the sidecar proxy level for all service-to-service communication'
      ),
      why: "Without a service mesh, each service implements TLS, circuit breaking, and retries differently. Istio handles this transparently at the infrastructure layer.",
      component: component('service_mesh', 'Service Mesh (Istio)'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'Service Mesh (Istio)',
        'automatic mTLS, circuit breaking, and traffic policies enforced at the sidecar proxy level across all services',
        'Without a service mesh, each service implements TLS, retries, and circuit breaking differently.',
        'Service Mesh (Istio)'
      ),
      celebrationMessage: buildCelebration(
        'Service Mesh',
        'Load Balancer',
        "WhatsApp's service mesh handles billions of service-to-service calls per day. Every call is encrypted with mTLS — no service code changes required. The Control Plane pushes traffic policies across the cluster instantly.",
        'GraphQL Federation Gateway'
      ),
      messages: [
        msg("Level 3 — Expert Architecture. The Service Mesh (Istio) adds sidecar proxies to every pod — handling mTLS, retries, circuit breaking, and load balancing transparently."),
        msg("Automatic mTLS encrypts every service-to-service call. The Control Plane distributes traffic policies across all sidecars instantly."),
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
        "WhatsApp's GraphQL Federation Gateway combines message, user, and group schemas into a unified supergraph. Business API clients query one endpoint — the gateway fans out to multiple subgraphs and composes the response.",
      action: buildAction(
        'GraphQL Federation Gateway',
        'API Gateway',
        'GraphQL Federation Gateway',
        'message, user, and group schemas being composed into a unified API from multiple subgraphs'
      ),
      why: "Without Federation, business API clients make multiple round trips to different REST endpoints. GraphQL Federation lets clients fetch all needed data in a single query.",
      component: component('graphql_federation', 'GraphQL Federation Gateway'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'GraphQL Federation Gateway',
        'compose message, user, and group schemas into a unified supergraph from multiple subgraphs',
        'Without Federation, business API clients make multiple round trips — GraphQL reduces this to one.',
        'GraphQL Federation Gateway'
      ),
      celebrationMessage: buildCelebration(
        'GraphQL Federation Gateway',
        'API Gateway',
        "WhatsApp's GraphQL Federation Gateway serves business API clients with a unified API — one query fetches messages, user profiles, and group data. Business API calls reduced by 60%, latency reduced by 40%.",
        'Token Bucket Rate Limiter'
      ),
      messages: [
        msg("GraphQL Federation combines message, user, and group schemas into a unified supergraph."),
        msg("Business API clients query one endpoint — the gateway fans out to multiple subgraphs and composes the response. API calls reduced by 60%."),
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
        "WhatsApp's Token Bucket Rate Limiter enforces API quotas using the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate. Business API clients get larger buckets for bulk messaging.",
      action: buildAction(
        'Token Bucket Rate Limiter',
        'API Gateway',
        'Token Bucket Rate Limiter',
        'API quotas being enforced with burst allowance using the token bucket algorithm — business clients get larger buckets'
      ),
      why: "Fixed rate limiting cannot handle legitimate bursts. Business API clients sending bulk messages need burst capacity — the token bucket allows this while maintaining average limits.",
      component: component('token_bucket_limiter', 'Token Bucket Rate Limiter'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'Token Bucket Rate Limiter',
        'enforce API quotas with burst allowance — business bulk messaging clients get larger token buckets',
        'Fixed rate limiting cannot handle legitimate bursts — token bucket allows bursts while maintaining average limits.',
        'Token Bucket Rate Limiter'
      ),
      celebrationMessage: buildCelebration(
        'Token Bucket Rate Limiter',
        'API Gateway',
        "WhatsApp's token bucket rate limiter allows business API clients to burst bulk message requests — sending 10,000 messages can use the full bucket. Casual users get smaller buckets. The steady average rate prevents abuse.",
        'OpenTelemetry Collector'
      ),
      messages: [
        msg("Token Bucket Rate Limiter uses the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate."),
        msg("Business API clients sending bulk messages get larger buckets. The steady average rate prevents abuse while enabling legitimate bursts."),
        msg("Press ⌘K and search for \"Token Bucket Rate Limiter\" and press Enter to add it, then connect API Gateway → Token Bucket Rate Limiter."),
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
        "WhatsApp's OpenTelemetry Collector receives traces, metrics, and logs from all services — processing and exporting to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs.",
      action: buildAction(
        'OpenTelemetry Collector',
        'Structured Logger',
        'OpenTelemetry Collector',
        'traces, metrics, and logs being aggregated and exported to multiple backends from a single unified collector'
      ),
      why: "Without OTel, each service uses different tracing libraries. The OTel Collector normalizes everything — one instrumentation, multiple backends.",
      component: component('otel_collector', 'OpenTelemetry Collector'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'OpenTelemetry Collector',
        'unified telemetry pipeline for traces, metrics, and logs with multi-backend export',
        'Without OTel, each service uses different tracing libraries — the OTel Collector normalizes everything.',
        'OpenTelemetry Collector'
      ),
      celebrationMessage: buildCelebration(
        'OpenTelemetry Collector',
        'Structured Logger',
        "WhatsApp's OTel Collector processes billions of spans per day. One instrumentation exports to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs — three backends, zero per-service configuration.",
        'Correlation ID Injector'
      ),
      messages: [
        msg("The OpenTelemetry Collector is the unified observability pipeline — receiving spans, metrics, and logs from all services, normalizing the format, and exporting to multiple backends."),
        msg("Without OTel, adding a new tracing backend requires changing every service. With OTel, services instrument once and the collector routes to any backend."),
        msg("Press ⌘K and search for \"OpenTelemetry Collector\" and press Enter to add it, then connect Structured Logger → OpenTelemetry Collector."),
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
        "The Correlation ID Injector assigns a unique trace ID to every message that propagates via HTTP headers across all service calls — enabling end-to-end request tracing from the mobile client through chat service, queue, and delivery confirmation.",
      action: buildAction(
        'Correlation ID Injector',
        'otel_collector',
        'Correlation ID Injector',
        'unique trace IDs being propagated across all service calls for end-to-end request visibility'
      ),
      why: "Without correlation IDs, debugging a failed message delivery requires checking logs from the chat service, message queue, and delivery confirmation separately. Correlation IDs link all logs under one trace.",
      component: component('correlation_id_handler', 'Correlation ID Injector'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'Correlation ID Injector',
        'propagate unique trace IDs across all service calls for instant cross-service log correlation',
        'Without correlation IDs, debugging failed deliveries requires checking logs from 4+ services separately.',
        'Correlation ID Injector'
      ),
      celebrationMessage: buildCelebration(
        'Correlation ID Injector',
        'OpenTelemetry Collector',
        "WhatsApp's correlation IDs flow through every service call: API Gateway → Chat Service → Message Queue → Presence Service → Delivery Confirmation. All logs under one trace ID — instant debugging of failed deliveries.",
        'Leader Election'
      ),
      messages: [
        msg("The Correlation ID Injector generates a unique trace ID at message entry and propagates it via HTTP headers through every service call."),
        msg("All logs for a message delivery share one correlation ID — instant debugging across Chat, Queue, Presence, and Delivery services."),
        msg("Press ⌘K and search for \"Correlation ID Injector\" and press Enter to add it, then connect OpenTelemetry Collector → Correlation ID Injector."),
      ],
      requiredNodes: ['correlation_id_handler'],
      requiredEdges: [edge('otel_collector', 'correlation_id_handler')],
      successMessage: 'Correlation IDs added. Now leader election.',
      errorMessage: 'Add a Correlation ID Injector connected from the OpenTelemetry Collector.',
    }),
    step({
      id: 6,
      title: 'Add Leader Election',
      explanation:
        "WhatsApp's Leader Election ensures exactly one Presence Service instance processes presence updates — preventing split-brain scenarios where two instances show different online statuses for the same user.",
      action: buildAction(
        'Leader Election',
        'Presence Service',
        'Leader Election',
        'exactly one Presence Service instance being elected to process presence updates — preventing split-brain scenarios'
      ),
      why: "Without leader election, multiple Presence Service instances might process the same user status, leading to inconsistent online/offline states shown to other users.",
      component: component('leader_election', 'Leader Election'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'Leader Election',
        'elect exactly one Presence Service instance to process presence updates — preventing split-brain inconsistent status',
        'Without leader election, multiple instances process presence updates — inconsistent online/offline status.',
        'Leader Election'
      ),
      celebrationMessage: buildCelebration(
        'Leader Election',
        'Presence Service',
        "WhatsApp's Leader Election ensures exactly one Presence Service instance processes presence updates. If the leader fails, a new leader is elected within seconds — presence status never becomes inconsistent.",
        'mTLS Certificate Authority'
      ),
      messages: [
        msg("Leader Election ensures exactly one Presence Service instance processes presence updates."),
        msg("Without leader election, multiple instances might process the same user status, leading to inconsistent online/offline states shown to other users."),
        msg("Press ⌘K and search for \"Leader Election\" and press Enter to add it, then connect Presence Service → Leader Election."),
      ],
      requiredNodes: ['leader_election'],
      requiredEdges: [edge('presence_service', 'leader_election')],
      successMessage: 'Leader election added. Now mTLS.',
      errorMessage: 'Add a Leader Election connected from the Presence Service.',
    }),
    step({
      id: 7,
      title: 'Add mTLS Certificate Authority',
      explanation:
        "WhatsApp's mTLS Certificate Authority issues and rotates TLS certificates for all service-to-service authentication — enabling mutual TLS where both client and server verify each other. Certificates rotate automatically every 24 hours.",
      action: buildAction(
        'mTLS Certificate Authority',
        'Service Mesh',
        'mTLS Certificate Authority',
        'TLS certificates being issued and rotated automatically every 24 hours for service-to-service authentication'
      ),
      why: "mTLS ensures that only authorized services can communicate with each other. Automatic certificate rotation prevents expired certificates from causing outages.",
      component: component('mtls_certificate_authority', 'mTLS Certificate Authority'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'mTLS Certificate Authority',
        'issue and rotate TLS certificates automatically every 24 hours for mutual service-to-service authentication',
        'mTLS ensures only authorized services communicate — automatic rotation prevents certificate expiration outages.',
        'mTLS Certificate Authority'
      ),
      celebrationMessage: buildCelebration(
        'mTLS Certificate Authority',
        'Service Mesh',
        "WhatsApp's mTLS CA issues certificates that rotate every 24 hours automatically. Every service-to-service call verifies both client and server certificates — even if one service is compromised, it cannot impersonate another.",
        'Data Warehouse'
      ),
      messages: [
        msg("mTLS Certificate Authority issues and rotates TLS certificates for all service-to-service authentication."),
        msg("Mutual TLS ensures both client and server verify each other. Automatic rotation every 24 hours prevents expired certificates from causing outages."),
        msg("Press ⌘K and search for \"mTLS Certificate Authority\" and press Enter to add it, then connect Service Mesh → mTLS CA."),
      ],
      requiredNodes: ['mtls_certificate_authority'],
      requiredEdges: [edge('service_mesh', 'mtls_certificate_authority')],
      successMessage: 'mTLS CA added. Now analytics pipeline.',
      errorMessage: 'Add an mTLS Certificate Authority connected from the Service Mesh.',
    }),
    step({
      id: 8,
      title: 'Add Data Warehouse',
      explanation:
        "WhatsApp's Data Warehouse stores all historical message data — engagement trends, user growth, group activity patterns. It powers the business intelligence that guides product decisions and user growth strategies.",
      action: buildAction(
        'Data Warehouse',
        'CDC Connector',
        'Data Warehouse',
        'all historical message and engagement data being stored for business intelligence and user growth analytics'
      ),
      why: "The NoSQL database answers 'what is this user's status right now?' The Data Warehouse answers 'what are the messaging trends in India over the past year?' — different query patterns requiring different storage.",
      component: component('data_warehouse', 'Data Warehouse'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'Data Warehouse',
        'columnar analytics storage for messaging trends and user growth patterns across years of data',
        'The NoSQL database cannot answer multi-year trend questions — that needs a data warehouse.',
        'Data Warehouse'
      ),
      celebrationMessage: buildCelebration(
        'Data Warehouse',
        'CDC Connector',
        "WhatsApp's data warehouse processes petabytes of message data. User growth modeling, group activity analytics, and product decisions all use this data — guiding what 2 billion users experience.",
        'CQRS Command Handler'
      ),
      messages: [
        msg("Data Warehouse stores all historical message data for business intelligence and user growth analytics."),
        msg("The NoSQL database cannot answer multi-year messaging trend questions — columnar storage optimized for analytics is required."),
        msg("Press ⌘K and search for \"Data Warehouse\" and press Enter to add it, then connect CDC Connector → Data Warehouse."),
      ],
      requiredNodes: ['data_warehouse'],
      requiredEdges: [edge('cdc_connector', 'data_warehouse')],
      successMessage: 'Analytics pipeline added. Now CQRS pattern.',
      errorMessage: 'Add a Data Warehouse connected from the CDC Connector.',
    }),
    step({
      id: 9,
      title: 'Add CQRS Command Handler',
      explanation:
        "WhatsApp's CQRS Command Handler processes write operations — message sends, group creates, status updates. Commands are validated and persisted to the write model with strict consistency guarantees before acknowledgment.",
      action: buildAction(
        'CQRS Command Handler',
        'Auth Service',
        'CQRS Command Handler',
        'write operations being validated and persisted to the write model with strict consistency — message sends, group creates'
      ),
      why: "CQRS separates read and write models — writes go through strict validation and consistency checks, reads go through optimized query paths. This prevents stale reads from blocking writes.",
      component: component('cqrs_command_handler', 'CQRS Command Handler'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'CQRS Command Handler',
        'process write operations with strict consistency — message sends, group creates, status updates validated before persistence',
        'CQRS separates read and write models — writes go through strict validation, reads go through optimized paths.',
        'CQRS Command Handler'
      ),
      celebrationMessage: buildCelebration(
        'CQRS Command Handler',
        'Auth Service',
        "WhatsApp's CQRS Command Handler processes message sends, group creates, and status updates with strict consistency. Commands are validated and persisted to the write model before acknowledgment — no partial writes.",
        'CQRS Query Handler'
      ),
      messages: [
        msg("CQRS Command Handler processes write operations — message sends, group creates, status updates."),
        msg("Commands are validated and persisted to the write model with strict consistency before acknowledgment. Reads go through an optimized query path separately."),
        msg("Press ⌘K and search for \"CQRS Command Handler\" and press Enter to add it, then connect Auth Service → CQRS Command Handler."),
      ],
      requiredNodes: ['cqrs_command_handler'],
      requiredEdges: [edge('auth_service', 'cqrs_command_handler')],
      successMessage: 'CQRS Command Handler added. Now the query handler.',
      errorMessage: 'Add a CQRS Command Handler connected from the Auth Service.',
    }),
    step({
      id: 10,
      title: 'Add CQRS Query Handler',
      explanation:
        "WhatsApp's CQRS Query Handler serves read operations from a denormalized read model — optimized for fast message retrieval without the overhead of translating from a normalized write model. Inbox reads use this optimized path.",
      action: buildAction(
        'CQRS Query Handler',
        'Chat Service',
        'CQRS Query Handler',
        'read operations being served from a denormalized read model optimized for fast queries — inbox reads'
      ),
      why: "Without CQRS, every read requires translating from the normalized write model. The Query Handler serves reads from a pre-computed denormalized model — sub-millisecond inbox reads.",
      component: component('cqrs_query_handler', 'CQRS Query Handler'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'CQRS Query Handler',
        'serve read operations from a denormalized read model — sub-millisecond inbox reads without write model translation',
        'Without CQRS, every read requires translating from the normalized write model — slower queries.',
        'CQRS Query Handler'
      ),
      celebrationMessage: buildCelebration(
        'CQRS Query Handler',
        'Chat Service',
        "WhatsApp's CQRS Query Handler serves inbox reads from a denormalized read model — pre-computed message threads sorted by time. Inbox reads are sub-millisecond without any write model translation.",
        'Event Store'
      ),
      messages: [
        msg("CQRS Query Handler serves read operations from a denormalized read model."),
        msg("Inbox reads use the pre-computed denormalized model — sub-millisecond queries without translating from the normalized write model."),
        msg("Press ⌘K and search for \"CQRS Query Handler\" and press Enter to add it, then connect Chat Service → CQRS Query Handler."),
      ],
      requiredNodes: ['cqrs_query_handler'],
      requiredEdges: [edge('microservice', 'cqrs_query_handler')],
      successMessage: 'CQRS Query Handler added. Now event sourcing.',
      errorMessage: 'Add a CQRS Query Handler connected from the Chat Service.',
    }),
    step({
      id: 11,
      title: 'Add Event Store',
      explanation:
        "WhatsApp's Event Store (EventStoreDB) maintains an immutable log of all message lifecycle events — sent, delivered, read, deleted. The entire message history can be reconstructed by replaying events for legal compliance and audit.",
      action: buildAction(
        'Event Store (EventStoreDB)',
        'Chat Service',
        'Event Store',
        'immutable event log being maintained for message lifecycle — enabling audit trails and state reconstruction by replay'
      ),
      why: "Legal compliance requires a complete audit trail for messages. The Event Store provides immutable evidence of every message — critical for law enforcement requests and regulatory compliance.",
      component: component('event_store', 'Event Store (EventStoreDB)'),
      openingMessage: buildOpeningL3(
        'WhatsApp',
        'Event Store (EventStoreDB)',
        'immutable event log for message lifecycle enabling audit trails and state reconstruction for legal compliance',
        'Legal compliance requires a complete audit trail — the Event Store provides immutable evidence.',
        'Event Store (EventStoreDB)'
      ),
      celebrationMessage: buildCelebration(
        'Event Store',
        'Chat Service',
        "WhatsApp's Event Store maintains an immutable log of every message lifecycle event — sent, delivered, read, deleted. The entire message history can be reconstructed by replaying events. This completes the expert architecture.",
        'completion'
      ),
      messages: [
        msg("Event Store (EventStoreDB) maintains an immutable log of all message lifecycle events — sent, delivered, read, deleted."),
        msg("The entire message history can be reconstructed by replaying events. Legal compliance requires a complete audit trail — the Event Store provides immutable evidence for law enforcement requests."),
        msg("Press ⌘K and search for \"Event Store (EventStoreDB)\" and press Enter to add it, then connect Chat Service → Event Store. This completes the expert architecture!"),
      ],
      requiredNodes: ['event_store'],
      requiredEdges: [edge('microservice', 'event_store')],
      successMessage: "Expert architecture complete! You've designed WhatsApp at the senior engineer level.",
      errorMessage: 'Add an Event Store connected from the Chat Service.',
    }),
  ],
});

export const whatsappTutorial: Tutorial = tutorial({
  id: 'whatsapp-architecture',
  title: 'How to Design WhatsApp Architecture',
  description:
    'Design a messaging system for 2 billion users. Understand message delivery guarantees, presence detection, offline queuing, and end-to-end encryption architecture.',
  difficulty: 'Advanced',
  category: 'Messaging',
  isLive: false,
  icon: 'MessageCircle',
  color: '#25d366',
  tags: ['WebSockets', 'Encryption', 'Presence', 'Queue', 'Scale'],
  estimatedTime: '~83 mins',
  levels: [l1, l2, l3],
});
