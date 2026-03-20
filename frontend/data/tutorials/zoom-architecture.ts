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
  title: 'Video Conferencing Platform',
  subtitle: 'Build a video conferencing system in 11 steps',
  description:
    'Build a video conferencing system for 300 million daily meeting participants. Master WebRTC, media relay, adaptive bitrate, recording pipelines, and breakout rooms.',
  estimatedTime: '~32 mins',
  unlocks: undefined,
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
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
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
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
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
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
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
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
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
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Meeting Service.'),
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
        msg('Press ⌘K, search for "Signaling Server", add it, then connect Meeting Service → Signaling Server.'),
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
        msg('Press ⌘K, search for "STUN Server", add it, then connect Signaling Server → STUN Server.'),
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
        msg('Press ⌘K, search for "TURN Server", add it, then connect STUN Server → TURN Server.'),
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
        msg('Press ⌘K, search for "Media Server", add it, then connect TURN Server → Media Server.'),
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
        msg('Press ⌘K, search for "Object Storage", add it, then connect Media Server → Object Storage.'),
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
        msg('Press ⌘K, search for "Metrics Collector", add it, then connect Media Server → Metrics Collector.'),
      ],
      requiredNodes: ['metrics_collector'],
      requiredEdges: [edge('media_server', 'metrics_collector')],
      successMessage: 'Tutorial complete! You have built Zoom.',
      errorMessage: 'Add a Metrics Collector and connect it from the Media Server.',
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
  estimatedTime: '~32 mins',
  levels: [l1],
});
