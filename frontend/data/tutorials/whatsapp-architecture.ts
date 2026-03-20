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
        msg('Press ⌘K and search for "Mobile" to add the client to the canvas.'),
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
        msg('Press ⌘K, search for "API Gateway", add it, then connect Mobile → API Gateway.'),
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
          'Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'
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
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
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
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Chat Service.'),
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
        msg('Press ⌘K, search for "Message Queue", add it, then connect Chat Service → Message Queue.'),
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
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Chat Service → NoSQL Database.'),
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
          'Press ⌘K, search for "Microservice", add another one for the Presence Service, then connect Chat Service → Presence Service.'
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
          'Press ⌘K, search for "Microservice", add another one for the Media Service, then connect Chat Service → Media Service.'
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
        msg('Press ⌘K, search for "Object Storage", add it, then connect Media Service → Object Storage.'),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('media_service', 'object_storage')],
      successMessage: 'Object Storage added and connected. You have built WhatsApp.',
      errorMessage: 'Add an Object Storage and connect Media Service → Object Storage.',
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
  estimatedTime: '~28 mins',
  levels: [l1],
});
