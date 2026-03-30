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
  title: 'Video Conferencing Platform',
  subtitle: 'Build a video conferencing system in 11 steps',
  description:
    'Build a video conferencing system for 300 million daily meeting participants. Master WebRTC, media relay, adaptive bitrate, recording pipelines, and breakout rooms.',
  estimatedTime: '~32 mins',
  unlocks: 'Production Layer',
  contextMessage:
    "Let's build Zoom from scratch. 300 million daily meeting participants at peak — a 30x growth during the pandemic. The architecture must handle millions of simultaneous video streams, adapt to varying network conditions, and maintain quality even on 3G connections.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "Zoom's client is the desktop app, mobile app, and web browser. The desktop app uses a native media stack for the best quality. The browser client uses WebRTC. Both support adaptive bitrate video — dropping quality on slow connections.",
      action: buildFirstStepAction('Web'),
      why: "Zoom's client monitors your network every 100ms and adjusts video quality automatically. On a bad connection, it drops to 360p. If it gets worse, it drops video entirely and keeps audio — because audio requires only 32kbps vs 1Mbps+ for HD video.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'Web Client',
        'monitor network quality every 100ms and automatically drop video quality on slow connections',
        "On a bad connection, Zoom drops to 360p. If it gets worse, it drops video entirely and keeps audio — because audio requires only 32kbps vs 1Mbps+ for HD video. This is adaptive bitrate at work.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Zoom's client monitors network quality every 100ms and adjusts video quality automatically. The client-side intelligence is what makes Zoom work on both fiber and 3G connections.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Welcome to the Zoom Architecture tutorial. 300 million daily meeting participants at peak — a 30x growth in 3 months during the pandemic."
        ),
        msg(
          "Zoom's client monitors your network every 100ms and adjusts video quality automatically. On a bad connection, it drops to 360p. If it gets worse, it drops video entirely and keeps audio — because audio requires only 32kbps vs 1Mbps+ for HD video."
        ),
        msg("Press ⌘K and search for \"Web\" and press Enter to add the client to the canvas."),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Client added. Now the entry layer.',
      errorMessage: 'Add a Web Client node to the canvas first.',
    }),
    step({
      id: 2,
      title: 'Add the API Gateway',
      explanation:
        "All Zoom requests — joining meetings, scheduling, managing participants — flow through the API Gateway. It handles authentication, routes meeting management requests, and upgrades WebSocket connections for real-time signaling.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'all meeting management traffic and WebSocket upgrades for real-time signaling'),
      why: "Zoom's API Gateway separates meeting management traffic (REST) from real-time media signaling (WebSocket). These have very different scaling requirements — media signaling needs ultra-low latency while meeting management needs high throughput.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'API Gateway',
        'handle both REST requests for meeting management and WebSocket upgrades for real-time signaling',
        "The API Gateway routes REST requests for meeting management and upgrades connections to WebSocket for real-time signaling. It also handles Zoom's OAuth integration with calendar apps like Google Calendar and Outlook.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "Zoom's API Gateway separates meeting management traffic (REST) from real-time media signaling (WebSocket). These have very different scaling requirements — media signaling needs ultra-low latency while meeting management needs high throughput.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "Zoom handles two types of traffic: meeting management (scheduling, joining) and real-time media signaling."
        ),
        msg(
          "The API Gateway routes REST requests for meeting management and upgrades connections to WebSocket for real-time signaling. It also handles Zoom's OAuth integration with calendar apps like Google Calendar and Outlook."
        ),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added. Now distribute the traffic.',
      errorMessage: 'Add an API Gateway and connect it from the Client.',
    }),
    step({
      id: 3,
      title: 'Add Load Balancer',
      explanation:
        "Zoom's Load Balancer routes meeting join requests to the optimal media server based on geographic proximity and server load. A meeting in Tokyo should use a Tokyo media server, not one in Virginia.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'meeting join requests being routed to the nearest media server based on geographic proximity'),
      why: "Geographic routing is critical for video quality. Every 100ms of additional latency is noticeable in video calls. Routing to the nearest media server minimizes round-trip time and ensures good video quality.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'Load Balancer',
        'route meeting join requests to the nearest media server based on geographic proximity and server load',
        "When you join a meeting, the load balancer checks your IP, finds the nearest Zoom data center, and assigns you to a media server there. A Tokyo participant and a New York participant in the same meeting connect to different media servers that relay between each other.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "Geographic routing is critical for video quality. Every 100ms of additional latency is noticeable in video calls. Routing to the nearest media server minimizes round-trip time — a Tokyo user gets routed to Tokyo, not Virginia.",
        'Auth Service'
      ),
      messages: [
        msg(
          "Zoom's load balancer does geographic routing — it assigns you to the nearest media server based on your IP address."
        ),
        msg(
          "When you join a meeting, the load balancer checks your IP, finds the nearest Zoom data center, and assigns you to a media server there. A Tokyo participant and a New York participant in the same meeting connect to different media servers that relay between each other."
        ),
        msg("Press ⌘K and search for \"Load Balancer\" and press Enter to add it, then connect API Gateway → Load Balancer."),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added. Now the auth layer.',
      errorMessage: 'Add a Load Balancer and connect it from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add Auth Service',
      explanation:
        "Zoom authenticates users via email/password, SSO (SAML 2.0 for enterprise), or OAuth. The Auth Service also validates meeting passwords and waiting room permissions.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'every meeting join request being authenticated with support for SAML 2.0 enterprise SSO'),
      why: "Enterprise Zoom customers require SSO integration. The Auth Service must support SAML 2.0 so employees can join meetings with their corporate credentials without a separate Zoom account.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'Auth Service',
        'authenticate users with email/password, SSO for enterprise, and meeting password validation',
        "The Auth Service validates meeting passwords, manages waiting rooms (host must admit participants), and handles SSO for enterprise customers. A Fortune 500 company's employees join Zoom meetings with their corporate Active Directory credentials.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "Enterprise Zoom customers require SSO integration. The Auth Service supports SAML 2.0 so employees can join meetings with their corporate credentials — no separate Zoom account needed.",
        'Meeting Service'
      ),
      messages: [
        msg(
          "Zoom's auth handles both consumer accounts and enterprise SSO. Enterprise customers use SAML 2.0."
        ),
        msg(
          "The Auth Service validates meeting passwords, manages waiting rooms (host must admit participants), and handles SSO for enterprise customers. A Fortune 500 company's employees join Zoom meetings with their corporate Active Directory credentials."
        ),
        msg("Press ⌘K and search for \"Auth Service\" and press Enter to add it, then connect Load Balancer → Auth Service."),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth added. Now the meeting management service.',
      errorMessage: 'Add an Auth Service and connect it from the Load Balancer.',
    }),
    step({
      id: 5,
      title: 'Add Meeting Service',
      explanation:
        "The Meeting Service manages meeting lifecycle: creation, scheduling, participant management, and breakout rooms. Each breakout room is a separate meeting session with its own media server allocation.",
      action: buildAction('Microservice', 'Auth', 'Meeting Service', 'meeting state being managed including participant lists, mute states, and breakout room assignments'),
      why: "Meeting state (who's muted, who's presenting, breakout room assignments) must be consistent across all participants. The Meeting Service is the single source of truth for this state.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'Meeting Service',
        'manage meeting lifecycle including creation, scheduling, participant management, and breakout rooms',
        "Breakout rooms are implemented as separate meeting sessions. When the host creates 5 breakout rooms, the Meeting Service creates 5 new meeting sessions and moves participants between them. Moving a participant is a session transfer operation.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Meeting Service',
        'Auth Service',
        "Meeting state (who's muted, who's presenting, breakout room assignments) must be consistent across all participants. The Meeting Service is the single source of truth for this state — and breakout rooms are separate sessions with their own media server allocations.",
        'Signaling Server'
      ),
      messages: [
        msg(
          "The Meeting Service manages all meeting state — who's in the meeting, who's muted, who's presenting."
        ),
        msg(
          "Breakout rooms are implemented as separate meeting sessions. When the host creates 5 breakout rooms, the Meeting Service creates 5 new meeting sessions and moves participants between them. Moving a participant is a session transfer operation."
        ),
        msg("Press ⌘K and search for \"Microservice\" and press Enter to add it, then connect Auth Service → Meeting Service."),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Meeting Service added. Now the WebRTC signaling layer.',
      errorMessage: 'Add a Microservice (Meeting Service) and connect it from the Auth Service.',
    }),
    step({
      id: 6,
      title: 'Add Signaling Server',
      explanation:
        "Before video can flow, Zoom clients must negotiate connection parameters through the Signaling Server. It exchanges SDP offers — codec preferences, network addresses, encryption keys — between participants.",
      action: buildAction('Signaling Server', 'Microservice', 'Signaling Server', 'SDP offers being exchanged between participants to negotiate codecs, ports, and encryption keys'),
      why: "WebRTC signaling is the handshake before media flows. The Signaling Server is only involved during connection setup — once the media path is established, it steps aside and media flows directly.",
      component: component('signaling_server', 'Signaling'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'Signaling Server',
        'exchange SDP offers between clients to negotiate codecs, ports, and encryption keys before media flows',
        "The Signaling Server exchanges SDP offers: 'I support H.264 and VP8, my network address is X, my DTLS fingerprint is Y.' Once both sides agree, the Signaling Server's job is done. Media flows directly to the Media Server.",
        'Signaling Server'
      ),
      celebrationMessage: buildCelebration(
        'Signaling Server',
        'Meeting Service',
        "WebRTC signaling is the handshake before media flows. The Signaling Server exchanges SDP offers — once both clients agree on connection parameters, the Signaling Server steps aside and media flows directly peer-to-peer or through the relay.",
        'STUN Server'
      ),
      messages: [
        msg(
          "Before video flows, Zoom clients negotiate connection parameters through the Signaling Server."
        ),
        msg(
          "The Signaling Server exchanges SDP offers: 'I support H.264 and VP8, my network address is X, my DTLS fingerprint is Y.' Once both sides agree, the Signaling Server's job is done. Media flows directly to the Media Server."
        ),
        msg("Press ⌘K and search for \"Signaling Server\" and press Enter to add it, then connect Meeting Service → Signaling Server."),
      ],
      requiredNodes: ['signaling_server'],
      requiredEdges: [edge('microservice', 'signaling_server')],
      successMessage: 'Signaling Server added. Now the STUN layer.',
      errorMessage: 'Add a Signaling Server and connect it from the Meeting Service.',
    }),
    step({
      id: 7,
      title: 'Add STUN Server',
      explanation:
        "The STUN Server helps Zoom clients discover their public IP address when they're behind NAT. Most home routers use NAT — your device has a private IP (192.168.x.x) but the internet sees a different public IP.",
      action: buildAction('STUN Server', 'Signaling', 'STUN Server', 'public IP discovery for clients behind NAT as the first step in WebRTC connection establishment'),
      why: "Without STUN, clients behind NAT don't know their public IP address and can't tell other participants how to reach them. STUN is the first step in WebRTC's ICE (Interactive Connectivity Establishment) process.",
      component: component('stun_server', 'STUN'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'STUN Server',
        'discover public IP addresses for clients behind NAT as the first step in WebRTC ICE',
        "The STUN Server tells your client: 'Your public IP is 203.0.113.42, port 54321.' Your client includes this in the SDP offer so other participants know how to reach you directly.",
        'STUN Server'
      ),
      celebrationMessage: buildCelebration(
        'STUN Server',
        'Signaling Server',
        "Most Zoom users are behind NAT — their device has a private IP but the internet sees a different public IP. STUN discovers this public IP so participants know how to reach each other. If STUN fails, TURN relay takes over.",
        'TURN Server'
      ),
      messages: [
        msg(
          "Most Zoom users are behind NAT — their device has a private IP but the internet sees a different public IP. STUN solves this."
        ),
        msg(
          "The STUN Server tells your client: 'Your public IP is 203.0.113.42, port 54321.' Your client includes this in the SDP offer so other participants know how to reach you directly."
        ),
        msg("Press ⌘K and search for \"STUN Server\" and press Enter to add it, then connect Signaling Server → STUN Server."),
      ],
      requiredNodes: ['stun_server'],
      requiredEdges: [edge('signaling_server', 'stun_server')],
      successMessage: 'STUN Server added. Now the TURN relay.',
      errorMessage: 'Add a STUN Server and connect it from the Signaling Server.',
    }),
    step({
      id: 8,
      title: 'Add TURN Server',
      explanation:
        "When direct peer-to-peer connection fails (symmetric NAT, corporate firewalls), the TURN Server relays all media traffic. Zoom runs TURN servers in every major region to minimize relay latency.",
      action: buildAction('TURN Server', 'STUN', 'TURN Server', 'media traffic being relayed through Zoom servers when direct peer-to-peer connection fails'),
      why: "TURN is the fallback that guarantees connectivity. Without it, users behind strict firewalls couldn't join Zoom meetings at all — which would be unacceptable for enterprise customers.",
      component: component('turn_server', 'TURN'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'TURN Server',
        'relay all media traffic when direct peer-to-peer connection fails due to strict firewalls',
        "TURN adds latency (all media goes through Zoom's servers instead of directly) but guarantees connectivity. Enterprise customers often have strict firewalls that block direct connections — TURN ensures they can always join meetings.",
        'TURN Server'
      ),
      celebrationMessage: buildCelebration(
        'TURN Server',
        'STUN Server',
        "When STUN fails (symmetric NAT, corporate firewalls), TURN relays all media through Zoom's servers. This guarantees connectivity but adds ~20ms latency. Zoom runs TURN servers in every major region to minimize relay distance.",
        'Media Server'
      ),
      messages: [
        msg(
          "When STUN fails, TURN takes over. It relays all media through Zoom's servers instead of allowing direct peer-to-peer connections."
        ),
        msg(
          "TURN adds latency (all media goes through Zoom's servers instead of directly) but guarantees connectivity. Enterprise customers often have strict firewalls that block direct connections — TURN ensures they can always join meetings."
        ),
        msg("Press ⌘K and search for \"TURN Server\" and press Enter to add it, then connect STUN Server → TURN Server."),
      ],
      requiredNodes: ['turn_server'],
      requiredEdges: [edge('stun_server', 'turn_server')],
      successMessage: 'TURN Server added. Now the media processing layer.',
      errorMessage: 'Add a TURN Server and connect it from the STUN Server.',
    }),
    step({
      id: 9,
      title: 'Add Media Server',
      explanation:
        "Zoom's Media Server uses a routed media architecture — each participant sends video to the central Media Server, which routes it to all other participants. This enables host muting, recording, and selective forwarding.",
      action: buildAction('Media Server', 'TURN', 'Media Server', 'all participant video being mixed and routed through a central relay that enables host controls'),
      why: "Routed media (vs peer-to-peer) is what enables Zoom's host controls. The Media Server can selectively forward video — muting a participant means the server stops forwarding their stream. Peer-to-peer would make host controls impossible.",
      component: component('media_server', 'Media'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'Media Server',
        'route video from all participants through a central mixer that enables host muting, recording, and selective forwarding',
        "This is what enables host controls: muting a participant means the Media Server stops forwarding their audio. Recording means the server saves the streams. Spotlight means the server prioritizes one participant's video for everyone.",
        'Media Server'
      ),
      celebrationMessage: buildCelebration(
        'Media Server',
        'TURN Server',
        "Zoom uses routed media — all video goes through the Media Server, not peer-to-peer. This is what enables host controls: muting a participant means the server stops forwarding their stream. Peer-to-peer would make host controls impossible.",
        'Object Storage'
      ),
      messages: [
        msg(
          "Zoom uses routed media — all video goes through the Media Server, not peer-to-peer. This is what enables host controls."
        ),
        msg(
          "This is what enables host controls: muting a participant means the Media Server stops forwarding their audio. Recording means the server saves the streams. Spotlight means the server prioritizes one participant's video for everyone."
        ),
        msg("Press ⌘K and search for \"Media Server\" and press Enter to add it, then connect TURN Server → Media Server."),
      ],
      requiredNodes: ['media_server'],
      requiredEdges: [edge('turn_server', 'media_server')],
      successMessage: 'Media Server added. Now recording storage.',
      errorMessage: 'Add a Media Server and connect it from the TURN Server.',
    }),
    step({
      id: 10,
      title: 'Add Object Storage',
      explanation:
        "Zoom recordings are first stored locally on the Media Server during the meeting, then transcoded and uploaded to Object Storage asynchronously after the meeting ends. Cloud recordings are stored here.",
      action: buildAction('Object Storage', 'Media', 'Object Storage', 'recorded meeting streams being uploaded and stored for cloud access after meetings end'),
      why: "Storing recordings in Object Storage (S3-like) makes them infinitely scalable and accessible from anywhere. Zoom processes millions of meeting recordings per day — object storage is the only viable option at this scale.",
      component: component('object_storage', 'Object'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'Object Storage',
        'store cloud recordings with infinite scalability and worldwide accessibility',
        "During the meeting, the Media Server records raw streams locally. After the meeting, a transcoding worker converts them to MP4, generates a transcript, and uploads to Object Storage. The host gets an email with the download link.",
        'Object Storage'
      ),
      celebrationMessage: buildCelebration(
        'Object Storage',
        'Media Server',
        "Zoom cloud recordings are stored in Object Storage. The Media Server records raw streams locally during the meeting, then a transcoding worker uploads them to Object Storage after the meeting ends. Millions of recordings per day — infinitely scalable.",
        'Metrics Collector'
      ),
      messages: [
        msg(
          "Zoom cloud recordings are stored in Object Storage. The recording is processed after the meeting ends."
        ),
        msg(
          "During the meeting, the Media Server records raw streams locally. After the meeting, a transcoding worker converts them to MP4, generates a transcript, and uploads to Object Storage. The host gets an email with the download link."
        ),
        msg("Press ⌘K and search for \"Object Storage\" and press Enter to add it, then connect Media Server → Object Storage."),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('media_server', 'object_storage')],
      successMessage: 'Object Storage added. Final step — observability.',
      errorMessage: 'Add an Object Storage and connect it from the Media Server.',
    }),
    step({
      id: 11,
      title: 'Add Metrics Collector',
      explanation:
        "Zoom monitors call quality metrics in real-time: packet loss, jitter, latency, and video resolution per participant. A spike in packet loss triggers automatic quality degradation before users notice.",
      action: buildAction('Metrics Collector', 'Media', 'Metrics Collector', 'real-time call quality metrics being collected to drive adaptive bitrate adjustments'),
      why: "Call quality metrics are what enable Zoom's adaptive bitrate system. The Metrics Collector feeds real-time quality data back to the client so it can adjust encoding parameters proactively — before users notice degradation.",
      component: component('metrics_collector', 'Metrics'),
      openingMessage: buildOpeningL1(
        'Zoom',
        'Metrics Collector',
        'monitor call quality metrics in real-time to drive adaptive bitrate and prevent degradation',
        "The Metrics Collector tracks packet loss, jitter, and latency per participant. When packet loss exceeds 5%, the system automatically drops video resolution. This feedback loop is what makes Zoom resilient to network degradation.",
        'Metrics Collector'
      ),
      celebrationMessage: buildCelebration(
        'Metrics Collector',
        'Media Server',
        "Zoom monitors call quality metrics in real-time for every participant. When packet loss exceeds 5%, the system automatically drops video resolution. This feedback loop is what makes Zoom resilient to network degradation. You have built Zoom.",
        'nothing — you have built Zoom'
      ),
      messages: [
        msg(
          "Final step — observability. Zoom monitors call quality metrics in real-time for every participant."
        ),
        msg(
          "The Metrics Collector tracks packet loss, jitter, and latency per participant. When packet loss exceeds 5%, the system automatically drops video resolution. This feedback loop is what makes Zoom resilient to network degradation."
        ),
        msg("Press ⌘K and search for \"Metrics Collector\" and press Enter to add it, then connect Media Server → Metrics Collector."),
      ],
      requiredNodes: ['metrics_collector'],
      requiredEdges: [edge('media_server', 'metrics_collector')],
      successMessage: 'Tutorial complete! You have built Zoom.',
      errorMessage: 'Add a Metrics Collector and connect it from the Media Server.',
    }),
  ],
});

const l2 = level({
  level: 2,
  title: "Zoom at Scale",
  subtitle: "Stream billions of meeting events with quality-of-experience tracking",
  description:
    "Add Kafka event streaming, real-time quality monitoring, and CDC pipelines to Zoom's architecture. Handle millions of concurrent meeting events and track SLA compliance for 300 million daily participants.",
  estimatedTime: "~28 mins",
  unlocks: 'Expert Architecture',
  contextMessage:
    "Let's scale Zoom. 300 million daily participants, millions of concurrent meetings, and 99.99% uptime guarantees. This requires event streaming, quality-of-experience monitoring, and real-time analytics.",
  steps: [
    step({
      id: 1,
      title: "Add Kafka Streaming",
      explanation:
        "Zoom's Event Bus streams meeting events: participant joins, screen shares, chat messages. Kafka handles millions of concurrent events — when a 1000-person webinar starts, all participant events stream to analytics.",
      action: buildAction(
        "Kafka / Streaming",
        "API Gateway",
        "Kafka Streaming",
        "meeting events being streamed to analytics: participant joins, screen shares, and chat messages"
      ),
      why: "Without Kafka, computing analytics would require synchronous database queries that slow down every meeting join. Kafka decouples event producers from consumers — the meeting path stays fast regardless of how many downstream systems consume events.",
      component: component("kafka_streaming", "Kafka / Streaming", "Kafka / Streaming"),
      openingMessage: buildOpeningL2(
        "Zoom",
        "Kafka Streaming",
        "stream meeting events: participant joins, screen shares, and chat messages to analytics pipelines",
        "Kafka handles millions of concurrent events — when a 1000-person webinar starts, all participant events stream to analytics.",
        "Kafka / Streaming"
      ),
      celebrationMessage: buildCelebration(
        "Kafka Streaming",
        "API Gateway",
        "Zoom's Event Bus streams meeting events: participant joins, screen shares, chat messages. Kafka handles millions of concurrent events — when a 1000-person webinar starts, all participant events stream to analytics.",
        "Notification Worker"
      ),
      messages: [
        msg(
          "Let's scale Zoom. 300 million daily participants, millions of concurrent meetings, and 99.99% uptime guarantees."
        ),
        msg(
          "Kafka streams meeting events: participant joins, screen shares, chat messages. When a 1000-person webinar starts, all participant events stream to analytics."
        ),
        msg("Press ⌘K and search for \"Kafka / Streaming\" and press Enter to add it, then connect API Gateway → Kafka Streaming."),
      ],
      requiredNodes: ["kafka_streaming"],
      requiredEdges: [edge("api_gateway", "kafka_streaming")],
      successMessage: "Kafka streaming added. Now notifications.",
      errorMessage: "Add Kafka Streaming connected from the API Gateway.",
    }),
    step({
      id: 2,
      title: "Add Notification Worker",
      explanation:
        "Zoom's Notification Worker sends meeting reminders, recording available alerts, and calendar sync notifications. It integrates with Google Calendar, Outlook, and iCal for seamless scheduling.",
      action: buildAction(
        "Worker",
        "Kafka",
        "Notification Worker",
        "meeting reminders and calendar sync notifications being sent via Google Calendar, Outlook, and iCal integration"
      ),
      why: "Without notification workers, Zoom would need to send notifications synchronously during meeting joins — slowing down the meeting experience. Async workers handle notifications without impacting meeting performance.",
      component: component("worker_job", "Worker"),
      openingMessage: buildOpeningL2(
        "Zoom",
        "Notification Worker",
        "send meeting reminders, recording alerts, and calendar sync notifications",
        "Integrates with Google Calendar, Outlook, and iCal for seamless scheduling.",
        "Worker"
      ),
      celebrationMessage: buildCelebration(
        "Notification Worker",
        "Kafka Streaming",
        "Zoom's Notification Worker sends meeting reminders, recording available alerts, and calendar sync notifications. It integrates with Google Calendar, Outlook, and iCal for seamless scheduling.",
        "In-Memory Cache"
      ),
      messages: [
        msg("Notification workers send meeting reminders, recording alerts, and calendar sync notifications."),
        msg("Integrates with Google Calendar, Outlook, and iCal for seamless scheduling across platforms."),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Kafka Streaming → Notification Worker."),
      ],
      requiredNodes: ["worker_job"],
      requiredEdges: [edge("kafka_streaming", "worker_job")],
      successMessage: "Notifications added. Now caching.",
      errorMessage: "Add a Worker connected from Kafka Streaming.",
    }),
    step({
      id: 3,
      title: "Add In-Memory Cache",
      explanation:
        "Zoom's Redis Cache serves active meeting state: participant lists, chat history, and polling results. In-meeting state is ephemeral — cached in Redis with TTL matching the meeting duration.",
      action: buildAction(
        "In-Memory Cache",
        "API Gateway",
        "In-Memory Cache",
        "active meeting state being cached: participant lists, chat history, and polling results with TTL matching meeting duration"
      ),
      why: "Querying the database for participant lists on every frame update would be slow and expensive. Redis caches ephemeral meeting state — reducing database load by 95% during peak meeting hours.",
      component: component("in_memory_cache", "In-Memory Cache"),
      openingMessage: buildOpeningL2(
        "Zoom",
        "Redis Cache",
        "serve active meeting state with TTL matching meeting duration: participant lists, chat history, and polling results",
        "In-meeting state is ephemeral — cached in Redis with TTL matching the meeting duration.",
        "In-Memory Cache"
      ),
      celebrationMessage: buildCelebration(
        "In-Memory Cache",
        "API Gateway",
        "Zoom's Redis Cache serves active meeting state: participant lists, chat history, and polling results. In-meeting state is ephemeral — cached in Redis with TTL matching the meeting duration.",
        "CDC Connector"
      ),
      messages: [
        msg("Redis Cache serves active meeting state: participant lists, chat history, and polling results."),
        msg("In-meeting state is ephemeral — cached in Redis with TTL matching the meeting duration."),
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect API Gateway → In-Memory Cache."),
      ],
      requiredNodes: ["in_memory_cache"],
      requiredEdges: [edge("api_gateway", "in_memory_cache")],
      successMessage: "Cache added. Now CDC pipelines.",
      errorMessage: "Add an In-Memory Cache connected from the API Gateway.",
    }),
    step({
      id: 4,
      title: "Add CDC Connector",
      explanation:
        "Zoom's CDC Connector mirrors meeting metadata to the analytics platform. Meeting quality metrics, participant engagement scores, and network quality data stream to ClickHouse for SLA reporting.",
      action: buildAction(
        "CDC Connector",
        "Meeting Service",
        "CDC Connector",
        "meeting metadata mirroring to analytics: quality metrics, engagement scores, and network quality data flowing to ClickHouse"
      ),
      why: "CDC captures meeting quality metrics without impacting the live meeting path. Meeting metadata streams to ClickHouse for SLA reporting without adding latency to the meeting experience.",
      component: component("cdc_connector", "CDC Connector"),
      openingMessage: buildOpeningL2(
        "Zoom",
        "CDC Connector",
        "mirror meeting metadata to the analytics platform: quality metrics, engagement scores, and network quality data",
        "Streaming to ClickHouse for SLA reporting.",
        "CDC Connector"
      ),
      celebrationMessage: buildCelebration(
        "CDC Connector",
        "Meeting Service",
        "Zoom's CDC Connector mirrors meeting metadata to the analytics platform. Meeting quality metrics, participant engagement scores, and network quality data stream to ClickHouse for SLA reporting.",
        "SQL Database"
      ),
      messages: [
        msg("CDC Connector mirrors meeting metadata to the analytics platform."),
        msg("Meeting quality metrics, participant engagement scores, and network quality data stream to ClickHouse for SLA reporting."),
        msg("Press ⌘K and search for \"CDC Connector\" and press Enter to add it, then connect Meeting Service → CDC Connector."),
      ],
      requiredNodes: ["cdc_connector"],
      requiredEdges: [edge("microservice", "cdc_connector")],
      successMessage: "CDC added. Now SQL database.",
      errorMessage: "Add a CDC Connector connected from the Meeting Service.",
    }),
    step({
      id: 5,
      title: "Add SQL Database",
      explanation:
        "Zoom's MySQL stores user accounts, meeting templates, and billing information. PostgreSQL handles reporting and analytics queries — separate from the real-time meeting data.",
      action: buildAction(
        "SQL Database",
        "Auth Service",
        "SQL Database",
        "user accounts, meeting templates, and billing information being stored with ACID compliance"
      ),
      why: "User accounts and billing require ACID transactions — eventual consistency is unacceptable for financial data. PostgreSQL stores the authoritative financial records with full compliance.",
      component: component("sql_db", "SQL Database"),
      openingMessage: buildOpeningL2(
        "Zoom",
        "SQL Database",
        "store user accounts, meeting templates, and billing information with ACID guarantees",
        "PostgreSQL handles reporting and analytics queries — separate from real-time meeting data.",
        "SQL Database"
      ),
      celebrationMessage: buildCelebration(
        "SQL Database",
        "Auth Service",
        "Zoom's MySQL stores user accounts, meeting templates, and billing information. PostgreSQL handles reporting and analytics queries — separate from the real-time meeting data.",
        "Structured Logger"
      ),
      messages: [
        msg("MySQL stores user accounts, meeting templates, and billing information."),
        msg("PostgreSQL handles reporting and analytics queries — separate from real-time meeting data."),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect Auth Service → SQL Database."),
      ],
      requiredNodes: ["sql_db"],
      requiredEdges: [edge("auth_service", "sql_db")],
      successMessage: "SQL database added. Now structured logging.",
      errorMessage: "Add a SQL Database connected from the Auth Service.",
    }),
    step({
      id: 6,
      title: "Add Structured Logger",
      explanation:
        "Zoom's Structured Logger captures meeting quality metrics: packet loss, jitter, latency per participant. These logs flow to the SLA reporting system — Zoom promises 99.99% meeting availability.",
      action: buildAction(
        "Structured Logger",
        "API Gateway",
        "Structured Logger",
        "meeting quality metrics being captured: packet loss, jitter, and latency per participant for SLA reporting"
      ),
      why: "Text logs require regex parsing — slow and error-prone at scale. Structured JSON logs enable fast queries that aggregate metrics across billions of entries for SLA reporting.",
      component: component("structured_logger", "Structured Logger"),
      openingMessage: buildOpeningL2(
        "Zoom",
        "Structured Logger",
        "capture meeting quality metrics: packet loss, jitter, latency per participant for SLA reporting",
        "Zoom promises 99.99% meeting availability — these logs track every quality metric.",
        "Structured Logger"
      ),
      celebrationMessage: buildCelebration(
        "Structured Logger",
        "API Gateway",
        "Zoom's Structured Logger captures meeting quality metrics: packet loss, jitter, latency per participant. These logs flow to the SLA reporting system — Zoom promises 99.99% meeting availability.",
        "SLO Tracker"
      ),
      messages: [
        msg("Structured Logger captures meeting quality metrics: packet loss, jitter, latency per participant."),
        msg("These logs flow to the SLA reporting system — Zoom promises 99.99% meeting availability."),
        msg("Press ⌘K and search for \"Structured Logger\" and press Enter to add it, then connect API Gateway → Structured Logger."),
      ],
      requiredNodes: ["structured_logger"],
      requiredEdges: [edge("api_gateway", "structured_logger")],
      successMessage: "Structured logging added. Now SLO tracking.",
      errorMessage: "Add a Structured Logger connected from the API Gateway.",
    }),
    step({
      id: 7,
      title: "Add SLO Tracker",
      explanation:
        "Zoom's SLO Tracker monitors meeting connection time, video quality, and audio clarity. Connection time SLO: <3 seconds for 99% of meetings. Video quality SLO: 720p minimum for 95% of participants.",
      action: buildAction(
        "SLO/SLI Tracker",
        "Metrics Collector",
        "SLO Tracker",
        "meeting connection time, video quality, and audio clarity being monitored against SLO targets"
      ),
      why: "Without SLOs, engineering teams argue about what 'good' means for meeting quality. With SLOs, there's a clear contractual target — connection time must be under 3 seconds for 99% of meetings.",
      component: component("slo_tracker", "SLO/SLI Tracker"),
      openingMessage: buildOpeningL2(
        "Zoom",
        "SLO Tracker",
        "monitor meeting connection time, video quality, and audio clarity against defined SLO targets",
        "Connection time SLO: <3 seconds for 99% of meetings. Video quality SLO: 720p minimum for 95% of participants.",
        "SLO/SLI Tracker"
      ),
      celebrationMessage: buildCelebration(
        "SLO Tracker",
        "Metrics Collector",
        "Zoom's SLO Tracker monitors meeting connection time, video quality, and audio clarity. Connection time SLO: <3 seconds for 99% of meetings. Video quality SLO: 720p minimum for 95% of participants.",
        "Error Budget Alert"
      ),
      messages: [
        msg("SLO Tracker monitors meeting connection time, video quality, and audio clarity against defined SLO targets."),
        msg("Connection time SLO: <3 seconds for 99% of meetings. Video quality SLO: 720p minimum for 95% of participants."),
        msg("Press ⌘K and search for \"SLO/SLI Tracker\" and press Enter to add it, then connect Metrics Collector → SLO Tracker."),
      ],
      requiredNodes: ["slo_tracker"],
      requiredEdges: [edge("metrics_collector", "slo_tracker")],
      successMessage: "SLO tracking added. Now error budgets.",
      errorMessage: "Add an SLO/SLI Tracker connected from the Metrics Collector.",
    }),
    step({
      id: 8,
      title: "Add Error Budget Alert",
      explanation:
        "Zoom's Error Budget Monitor tracks SLA consumption in real-time. When meeting quality degrades during a viral webinar, on-call engineers are paged before the budget is depleted.",
      action: buildAction(
        "Error Budget Monitor",
        "SLO/SLI Tracker",
        "Error Budget Alert",
        "SLA consumption being tracked in real-time with on-call alerts before budget depletion"
      ),
      why: "The error budget is the reliability buffer — when depleted, feature launches pause until reliability improves. This prevents reliability from being sacrificed for velocity during peak usage.",
      component: component("error_budget_alert", "Error Budget Monitor"),
      openingMessage: buildOpeningL2(
        "Zoom",
        "Error Budget Monitor",
        "track SLA consumption in real-time with on-call alerts before the budget is depleted",
        "When meeting quality degrades during a viral webinar, on-call engineers are paged before the budget is depleted.",
        "Error Budget Monitor"
      ),
      celebrationMessage: buildCelebration(
        "Error Budget Alert",
        "SLO Tracker",
        "Zoom's Error Budget Monitor tracks SLA consumption in real-time. When meeting quality degrades during a viral webinar, on-call engineers are paged before the budget is depleted.",
        "Level 3"
      ),
      messages: [
        msg("Error Budget Monitor tracks SLA consumption in real-time."),
        msg("When meeting quality degrades during a viral webinar, on-call engineers are paged before the budget is depleted."),
        msg("Press ⌘K and search for \"Error Budget Monitor\" and press Enter to add it, then connect SLO Tracker → Error Budget Alert."),
      ],
      requiredNodes: ["error_budget_alert"],
      requiredEdges: [edge("slo_tracker", "error_budget_alert")],
      successMessage: "Error budget monitoring added. Zoom is now at scale.",
      errorMessage: "Add an Error Budget Monitor connected from the SLO Tracker.",
    }),
  ],
});

const l3 = level({
  level: 3,
  title: "Zoom Enterprise",
  subtitle: "Add zero-trust media routing, WebRTC tracing, and SLA-grade analytics",
  description:
    "Implement zero-trust networking for WebRTC media, distributed tracing across signaling and media servers, and SLA-grade analytics. Zoom Enterprise requires SPIFFE certificates, OTel for WebRTC debugging, and event sourcing for recording replay.",
  estimatedTime: "~29 mins",
  unlocks: undefined,
  contextMessage:
    "Let's make Zoom enterprise-grade. Zero-trust media routing, WebRTC distributed tracing, and SLA-grade quality monitoring. Zoom Enterprise serves Fortune 500 companies with compliance requirements that drive every architectural decision.",
  steps: [
    step({
      id: 1,
      title: "Add Service Mesh",
      explanation:
        "Zoom's Service Mesh (Envoy) handles mTLS between media servers and signaling services. WebRTC media streams traverse SFUs (Selective Forwarding Units) that are independently scaled and meshed for redundancy.",
      action: buildAction(
        "Service Mesh (Istio)",
        "Load Balancer",
        "Service Mesh",
        "mTLS between media servers and signaling services with SFUs independently scaled and meshed for redundancy"
      ),
      why: "Without a service mesh, each service implements TLS, circuit breaking, and retries differently — inconsistent and hard to maintain. Envoy handles this transparently at the infrastructure layer for enterprise-grade security.",
      component: component("service_mesh", "Service Mesh (Istio)"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "Service Mesh",
        "handle mTLS between media servers and signaling services with SFUs independently scaled and meshed for redundancy",
        "WebRTC media streams traverse SFUs (Selective Forwarding Units) that are independently scaled.",
        "Service Mesh (Istio)"
      ),
      celebrationMessage: buildCelebration(
        "Service Mesh",
        "Load Balancer",
        "Zoom's Service Mesh (Envoy) handles mTLS between media servers and signaling services. WebRTC media streams traverse SFUs (Selective Forwarding Units) that are independently scaled and meshed for redundancy.",
        "BFF Gateway"
      ),
      messages: [
        msg("Let's make Zoom enterprise-grade. Zero-trust media routing, WebRTC distributed tracing, and SLA-grade quality monitoring."),
        msg("Service Mesh handles mTLS between media servers and signaling services. WebRTC media streams traverse SFUs independently scaled."),
        msg("Press ⌘K and search for \"Service Mesh (Istio)\" and press Enter to add it, then connect Load Balancer → Service Mesh."),
      ],
      requiredNodes: ["service_mesh"],
      requiredEdges: [edge("load_balancer", "service_mesh")],
      successMessage: "Service mesh added. Now BFF gateway.",
      errorMessage: "Add a Service Mesh connected from the Load Balancer.",
    }),
    step({
      id: 2,
      title: "Add BFF Gateway",
      explanation:
        "Zoom's BFF Gateway serves the mobile and web clients with optimized signaling APIs. The BFF aggregates meeting state, handles WebSocket connections, and manages participant lists for the client.",
      action: buildAction(
        "BFF Gateway",
        "API Gateway",
        "BFF Gateway",
        "mobile and web clients being served with optimized signaling APIs aggregating meeting state and managing WebSocket connections"
      ),
      why: "Without a BFF, mobile clients would need to aggregate data from multiple services — slower and more complex. The BFF optimizes for each client platform independently.",
      component: component("bff_gateway", "BFF Gateway"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "BFF Gateway",
        "serve mobile and web clients with optimized signaling APIs aggregating meeting state and managing participant lists",
        "The BFF aggregates meeting state, handles WebSocket connections, and manages participant lists for the client.",
        "BFF Gateway"
      ),
      celebrationMessage: buildCelebration(
        "BFF Gateway",
        "API Gateway",
        "Zoom's BFF Gateway serves the mobile and web clients with optimized signaling APIs. The BFF aggregates meeting state, handles WebSocket connections, and manages participant lists for the client.",
        "Token Bucket Rate Limiter"
      ),
      messages: [
        msg("BFF Gateway serves mobile and web clients with optimized signaling APIs."),
        msg("The BFF aggregates meeting state, handles WebSocket connections, and manages participant lists for the client."),
        msg("Press ⌘K and search for \"BFF Gateway\" and press Enter to add it, then connect API Gateway → BFF Gateway."),
      ],
      requiredNodes: ["bff_gateway"],
      requiredEdges: [edge("api_gateway", "bff_gateway")],
      successMessage: "BFF gateway added. Now rate limiting.",
      errorMessage: "Add a BFF Gateway connected from the API Gateway.",
    }),
    step({
      id: 3,
      title: "Add Token Bucket Rate Limiter",
      explanation:
        "Zoom's Rate Limiter enforces meeting participant limits per plan: Free (100), Pro (300), Business (1000). Token buckets prevent meeting bombing by rate-limiting join requests per IP.",
      action: buildAction(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "Token Bucket Rate Limiter",
        "meeting participant limits being enforced per plan: Free (100), Pro (300), Business (1000) with IP-based join rate limiting"
      ),
      why: "Token buckets burst allow temporary traffic spikes while enforcing long-term rate limits — perfect for meeting joins that spike when a webinar starts.",
      component: component("token_bucket_limiter", "Token Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "Token Bucket Rate Limiter",
        "enforce meeting participant limits per plan: Free (100), Pro (300), Business (1000) with IP-based rate limiting",
        "Token buckets prevent meeting bombing by rate-limiting join requests per IP.",
        "Token Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Token Bucket Rate Limiter",
        "API Gateway",
        "Zoom's Rate Limiter enforces meeting participant limits per plan: Free (100), Pro (300), Business (1000). Token buckets prevent meeting bombing by rate-limiting join requests per IP.",
        "OpenTelemetry Collector"
      ),
      messages: [
        msg("Token Bucket Rate Limiter enforces meeting participant limits per plan: Free (100), Pro (300), Business (1000)."),
        msg("Token buckets prevent meeting bombing by rate-limiting join requests per IP."),
        msg("Press ⌘K and search for \"Token Bucket Rate Limiter\" and press Enter to add it, then connect API Gateway → Token Bucket Rate Limiter."),
      ],
      requiredNodes: ["token_bucket_limiter"],
      requiredEdges: [edge("api_gateway", "token_bucket_limiter")],
      successMessage: "Rate limiting added. Now tracing.",
      errorMessage: "Add a Token Bucket Rate Limiter connected from the API Gateway.",
    }),
    step({
      id: 4,
      title: "Add OpenTelemetry Collector",
      explanation:
        "Zoom's OTel Collector traces meeting connection flows: SIP signaling, TURN relay allocation, and SFU subscription. WebRTC is notoriously hard to debug — tracing is essential.",
      action: buildAction(
        "OpenTelemetry Collector",
        "Metrics Collector",
        "OpenTelemetry Collector",
        "meeting connection flows being traced: SIP signaling, TURN relay allocation, and SFU subscription for WebRTC debugging"
      ),
      why: "WebRTC is notoriously hard to debug — distributed tracing across SIP, TURN, and SFU services is essential for diagnosing meeting quality issues at enterprise scale.",
      component: component("otel_collector", "OpenTelemetry Collector"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "OTel Collector",
        "trace meeting connection flows: SIP signaling, TURN relay allocation, and SFU subscription for WebRTC debugging",
        "WebRTC is notoriously hard to debug — tracing is essential.",
        "OpenTelemetry Collector"
      ),
      celebrationMessage: buildCelebration(
        "OpenTelemetry Collector",
        "Metrics Collector",
        "Zoom's OTel Collector traces meeting connection flows: SIP signaling, TURN relay allocation, and SFU subscription. WebRTC is notoriously hard to debug — tracing is essential.",
        "Correlation ID Handler"
      ),
      messages: [
        msg("OTel Collector traces meeting connection flows: SIP signaling, TURN relay allocation, and SFU subscription."),
        msg("WebRTC is notoriously hard to debug — tracing is essential for enterprise-grade reliability."),
        msg("Press ⌘K and search for \"OpenTelemetry Collector\" and press Enter to add it, then connect Metrics Collector → OpenTelemetry Collector."),
      ],
      requiredNodes: ["otel_collector"],
      requiredEdges: [edge("metrics_collector", "otel_collector")],
      successMessage: "Tracing added. Now correlation IDs.",
      errorMessage: "Add an OpenTelemetry Collector connected from the Metrics Collector.",
    }),
    step({
      id: 5,
      title: "Add Correlation ID Handler",
      explanation:
        "Zoom's Correlation ID links a meeting join to every service it touches: calendar integration, waiting room, breakout rooms, recording. Debugging a failed join requires tracing across all these services.",
      action: buildAction(
        "Correlation ID Handler",
        "API Gateway",
        "Correlation ID Handler",
        "meeting join events being correlated across all services: calendar integration, waiting room, breakout rooms, and recording"
      ),
      why: "Without correlation IDs, debugging a failed meeting join requires piecing together logs from a dozen services manually — correlation IDs link the entire journey in one trace.",
      component: component("correlation_id_handler", "Correlation ID Handler"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "Correlation ID Handler",
        "link meeting joins to every service they touch: calendar integration, waiting room, breakout rooms, recording",
        "Debugging a failed join requires tracing across all these services with a single correlation ID.",
        "Correlation ID Handler"
      ),
      celebrationMessage: buildCelebration(
        "Correlation ID Handler",
        "API Gateway",
        "Zoom's Correlation ID links a meeting join to every service it touches: calendar integration, waiting room, breakout rooms, recording. Debugging a failed join requires tracing across all these services.",
        "mTLS Certificate Authority"
      ),
      messages: [
        msg("Correlation ID links a meeting join to every service it touches: calendar integration, waiting room, breakout rooms, recording."),
        msg("Debugging a failed join requires tracing across all these services with a single correlation ID."),
        msg("Press ⌘K and search for \"Correlation ID Handler\" and press Enter to add it, then connect API Gateway → Correlation ID Handler."),
      ],
      requiredNodes: ["correlation_id_handler"],
      requiredEdges: [edge("api_gateway", "correlation_id_handler")],
      successMessage: "Correlation IDs added. Now certificate authority.",
      errorMessage: "Add a Correlation ID Handler connected from the API Gateway.",
    }),
    step({
      id: 6,
      title: "Add mTLS Certificate Authority",
      explanation:
        "Zoom's SPIFFE CA issues certificates to every media server and signaling node. Zoom's scale requires automated certificate management — thousands of certificates rotate daily.",
      action: buildAction(
        "mTLS Certificate Authority",
        "Service Mesh",
        "mTLS Certificate Authority",
        "SPIFFE CA issuing certificates to every media server and signaling node with automated daily rotation"
      ),
      why: "At Zoom's scale, manual certificate management is impossible. SPIFFE automates certificate issuance and rotation — thousands of certificates rotate daily without human intervention.",
      component: component("mtls_certificate_authority", "mTLS Certificate Authority"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "SPIFFE CA",
        "issue certificates to every media server and signaling node with automated daily rotation",
        "Zoom's scale requires automated certificate management — thousands of certificates rotate daily.",
        "mTLS Certificate Authority"
      ),
      celebrationMessage: buildCelebration(
        "mTLS Certificate Authority",
        "Service Mesh",
        "Zoom's SPIFFE CA issues certificates to every media server and signaling node. Zoom's scale requires automated certificate management — thousands of certificates rotate daily.",
        "Leaky Bucket Rate Limiter"
      ),
      messages: [
        msg("SPIFFE CA issues certificates to every media server and signaling node."),
        msg("Zoom's scale requires automated certificate management — thousands of certificates rotate daily."),
        msg("Press ⌘K and search for \"mTLS Certificate Authority\" and press Enter to add it, then connect Service Mesh → mTLS Certificate Authority."),
      ],
      requiredNodes: ["mtls_certificate_authority"],
      requiredEdges: [edge("service_mesh", "mtls_certificate_authority")],
      successMessage: "Certificate authority added. Now leaky bucket rate limiting.",
      errorMessage: "Add an mTLS Certificate Authority connected from the Service Mesh.",
    }),
    step({
      id: 7,
      title: "Add Leaky Bucket Rate Limiter",
      explanation:
        "Zoom's Leaky Bucket Rate Limiter smooths API burst traffic from meeting analytics. API calls are rate-limited to prevent thundering-herd analytics queries during peak meeting hours.",
      action: buildAction(
        "Leaky Bucket Rate Limiter",
        "API Gateway",
        "Leaky Bucket Rate Limiter",
        "API burst traffic from meeting analytics being smoothed to prevent thundering-herd queries during peak hours"
      ),
      why: "Leaky buckets smooth burst traffic by releasing requests at a constant rate — preventing thundering-herd analytics queries from overwhelming the data warehouse.",
      component: component("leaky_bucket_limiter", "Leaky Bucket Rate Limiter"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "Leaky Bucket Rate Limiter",
        "smooth API burst traffic from meeting analytics to prevent thundering-herd queries during peak hours",
        "API calls are rate-limited to prevent thundering-herd analytics queries during peak meeting hours.",
        "Leaky Bucket Rate Limiter"
      ),
      celebrationMessage: buildCelebration(
        "Leaky Bucket Rate Limiter",
        "API Gateway",
        "Zoom's Leaky Bucket Rate Limiter smooths API burst traffic from meeting analytics. API calls are rate-limited to prevent thundering-herd analytics queries during peak meeting hours.",
        "Cache Stampede Guard"
      ),
      messages: [
        msg("Leaky Bucket Rate Limiter smooths API burst traffic from meeting analytics."),
        msg("API calls are rate-limited to prevent thundering-herd analytics queries during peak meeting hours."),
        msg("Press ⌘K and search for \"Leaky Bucket Rate Limiter\" and press Enter to add it, then connect API Gateway → Leaky Bucket Rate Limiter."),
      ],
      requiredNodes: ["leaky_bucket_limiter"],
      requiredEdges: [edge("api_gateway", "leaky_bucket_limiter")],
      successMessage: "Leaky bucket rate limiting added. Now cache stampede protection.",
      errorMessage: "Add a Leaky Bucket Rate Limiter connected from the API Gateway.",
    }),
    step({
      id: 8,
      title: "Add Cache Stampede Guard",
      explanation:
        "Zoom's Cache Stampede Guard protects meeting roster caches from stampedes when a large meeting starts. Lock-assisted refresh ensures only one worker fetches the participant list.",
      action: buildAction(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Cache Stampede Guard",
        "meeting roster caches being protected from stampedes when large meetings start with lock-assisted refresh"
      ),
      why: "When a 1000-person webinar starts, thousands of requests hit the cache simultaneously. Without stampede protection, the cache expires and thousands of requests flood the database simultaneously.",
      component: component("cache_stampede_guard", "Cache Stampede Guard"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "Cache Stampede Guard",
        "protect meeting roster caches from stampedes when large meetings start with lock-assisted refresh",
        "Lock-assisted refresh ensures only one worker fetches the participant list.",
        "Cache Stampede Guard"
      ),
      celebrationMessage: buildCelebration(
        "Cache Stampede Guard",
        "In-Memory Cache",
        "Zoom's Cache Stampede Guard protects meeting roster caches from stampedes when a large meeting starts. Lock-assisted refresh ensures only one worker fetches the participant list.",
        "Data Warehouse"
      ),
      messages: [
        msg("Cache Stampede Guard protects meeting roster caches from stampedes when a large meeting starts."),
        msg("Lock-assisted refresh ensures only one worker fetches the participant list."),
        msg("Press ⌘K and search for \"Cache Stampede Guard\" and press Enter to add it, then connect In-Memory Cache → Cache Stampede Guard."),
      ],
      requiredNodes: ["cache_stampede_guard"],
      requiredEdges: [edge("in_memory_cache", "cache_stampede_guard")],
      successMessage: "Cache stampede protection added. Now data warehouse.",
      errorMessage: "Add a Cache Stampede Guard connected from the In-Memory Cache.",
    }),
    step({
      id: 9,
      title: "Add Data Warehouse",
      explanation:
        "Zoom's Data Warehouse (ClickHouse) stores meeting quality telemetry: MOS scores, packet loss rates, and jitter per meeting. This data drives Zoom's SLA reporting and product decisions.",
      action: buildAction(
        "Data Warehouse",
        "CDC Connector",
        "Data Warehouse",
        "meeting quality telemetry being stored: MOS scores, packet loss rates, and jitter per meeting for SLA reporting"
      ),
      why: "Meeting quality telemetry requires analytical queries on billions of rows — ClickHouse handles this at scale, enabling Zoom to report SLA compliance to enterprise customers.",
      component: component("data_warehouse", "Data Warehouse"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "Data Warehouse (ClickHouse)",
        "store meeting quality telemetry: MOS scores, packet loss rates, and jitter per meeting for SLA reporting",
        "This data drives Zoom's SLA reporting and product decisions.",
        "Data Warehouse"
      ),
      celebrationMessage: buildCelebration(
        "Data Warehouse",
        "CDC Connector",
        "Zoom's Data Warehouse (ClickHouse) stores meeting quality telemetry: MOS scores, packet loss rates, and jitter per meeting. This data drives Zoom's SLA reporting and product decisions.",
        "Event Store"
      ),
      messages: [
        msg("Data Warehouse stores meeting quality telemetry: MOS scores, packet loss rates, and jitter per meeting."),
        msg("This data drives Zoom's SLA reporting and product decisions."),
        msg("Press ⌘K and search for \"Data Warehouse\" and press Enter to add it, then connect CDC Connector → Data Warehouse."),
      ],
      requiredNodes: ["data_warehouse"],
      requiredEdges: [edge("cdc_connector", "data_warehouse")],
      successMessage: "Data warehouse added. Now event store.",
      errorMessage: "Add a Data Warehouse connected from the CDC Connector.",
    }),
    step({
      id: 10,
      title: "Add Event Store",
      explanation:
        "Zoom's Event Store stores every meeting lifecycle event: scheduled, started, ended, recording available. Event sourcing enables replay — recordings can be regenerated from event logs.",
      action: buildAction(
        "Event Store",
        "CDC Connector",
        "Event Store",
        "every meeting lifecycle event being stored: scheduled, started, ended, recording available for event sourcing replay"
      ),
      why: "Event sourcing enables meeting replay and audit trails. If a recording is corrupted, Zoom can regenerate it from the event logs — critical for compliance requirements.",
      component: component("event_store", "Event Store"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "Event Store",
        "store every meeting lifecycle event: scheduled, started, ended, recording available for event sourcing replay",
        "Event sourcing enables replay — recordings can be regenerated from event logs.",
        "Event Store"
      ),
      celebrationMessage: buildCelebration(
        "Event Store",
        "CDC Connector",
        "Zoom's Event Store stores every meeting lifecycle event: scheduled, started, ended, recording available. Event sourcing enables replay — recordings can be regenerated from event logs.",
        "Prefetch Cache"
      ),
      messages: [
        msg("Event Store stores every meeting lifecycle event: scheduled, started, ended, recording available."),
        msg("Event sourcing enables replay — recordings can be regenerated from event logs."),
        msg("Press ⌘K and search for \"Event Store\" and press Enter to add it, then connect CDC Connector → Event Store."),
      ],
      requiredNodes: ["event_store"],
      requiredEdges: [edge("cdc_connector", "event_store")],
      successMessage: "Event store added. Now prefetch cache.",
      errorMessage: "Add an Event Store connected from the CDC Connector.",
    }),
    step({
      id: 11,
      title: "Add Prefetch Cache",
      explanation:
        "Zoom's Prefetch Cache preloads recording thumbnails and chat history for upcoming meetings. When a meeting ends, the next meeting's data is preloaded into cache.",
      action: buildAction(
        "Prefetch Cache",
        "In-Memory Cache",
        "Prefetch Cache",
        "recording thumbnails and chat history being preloaded for upcoming meetings when current meeting ends"
      ),
      why: "Prefetching reduces perceived latency — when a meeting ends, the next meeting's data is already cached. This makes meeting transitions seamless for users.",
      component: component("prefetch_cache", "Prefetch Cache"),
      openingMessage: buildOpeningL3(
        "Zoom",
        "Prefetch Cache",
        "preload recording thumbnails and chat history for upcoming meetings when current meeting ends",
        "When a meeting ends, the next meeting's data is preloaded into cache for instant access.",
        "Prefetch Cache"
      ),
      celebrationMessage: buildCelebration(
        "Prefetch Cache",
        "In-Memory Cache",
        "Zoom's Prefetch Cache preloads recording thumbnails and chat history for upcoming meetings. When a meeting ends, the next meeting's data is preloaded into cache.",
        "nothing — you have built Zoom Enterprise"
      ),
      messages: [
        msg("Prefetch Cache preloads recording thumbnails and chat history for upcoming meetings."),
        msg("When a meeting ends, the next meeting's data is preloaded into cache for instant access."),
        msg("Press ⌘K and search for \"Prefetch Cache\" and press Enter to add it, then connect In-Memory Cache → Prefetch Cache."),
      ],
      requiredNodes: ["prefetch_cache"],
      requiredEdges: [edge("in_memory_cache", "prefetch_cache")],
      successMessage: "Prefetch cache added. You have built Zoom Enterprise.",
      errorMessage: "Add a Prefetch Cache connected from the In-Memory Cache.",
    }),
  ],
});

export const zoomTutorial: Tutorial = tutorial({
  id: 'zoom-architecture',
  title: 'How to Design Zoom Architecture',
  description:
    'Build a video conferencing system for 300 million daily meeting participants. Master WebRTC, media relay, adaptive bitrate, recording pipelines, and breakout rooms.',
  difficulty: 'Advanced',
  category: 'Video Conferencing',
  isLive: false,
  icon: 'Video',
  color: '#2d8cff',
  tags: ['WebRTC', 'TURN/STUN', 'Recording', 'Adaptive', 'Media'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
