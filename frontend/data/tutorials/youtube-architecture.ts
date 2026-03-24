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
  title: 'Video Streaming at Scale',
  subtitle: 'Design the world\'s largest video platform in 11 steps',
  description:
    "Design the world's largest video platform. Learn video upload pipelines, transcoding at scale, CDN distribution, and recommendation ML serving billions of views.",
  estimatedTime: '~32 mins',
  unlocks: undefined,
  contextMessage:
    "Let's build YouTube from scratch. 2.7 billion users, 500 hours of video uploaded every minute, 1 billion hours watched daily. Every design decision is shaped by three relentless constraints: enormous upload volumes, massive storage requirements, and the need for instant playback anywhere in the world.",
  steps: [
    step({
      id: 1,
      title: 'Start with the Client',
      explanation:
        "YouTube's client is the web browser and mobile app. It handles adaptive bitrate video playback, switching quality automatically based on your connection speed every 10 seconds.",
      action: buildFirstStepAction('Web'),
      why: "The client's adaptive bitrate player is what makes YouTube work on both 4K TVs and slow mobile connections. Understanding the client shapes every downstream architectural decision.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'Adaptive Bitrate Player',
        'switch video quality automatically every 10 seconds based on your bandwidth, from 360p to 4K',
        "Each quality switch is a new CDN request to a different video segment. The client monitors your bandwidth constantly and picks the highest quality that won't cause buffering. This is what makes YouTube work on both 4K TVs and 3G mobile.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "YouTube's client handles adaptive bitrate playback — it monitors your bandwidth every 10 seconds and switches video quality automatically. That quality switch is a new CDN request for a different video segment.",
        'CDN'
      ),
      messages: [
        msg(
          "Welcome to the YouTube Architecture tutorial. 2.7 billion users, 500 hours of video uploaded every minute."
        ),
        msg(
          "YouTube's client handles adaptive bitrate playback — it monitors your bandwidth every 10 seconds and switches video quality automatically. That quality switch is a new CDN request to a different file segment."
        ),
        msg("Press ⌘K and search for \"Web\" and press Enter to add the client to the canvas."),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Client added. Now the delivery layer.',
      errorMessage: 'Add a Web Client node using ⌘K → search "Web".',
    }),
    step({
      id: 2,
      title: 'Add CDN for Video Delivery',
      explanation:
        "YouTube's CDN serves video segments to viewers. It caches the most popular videos at edge locations worldwide. A video that goes viral is served from edge nodes, never hitting YouTube's origin servers.",
      action: buildAction(
        'CDN',
        'Web',
        'CDN',
        'video segments being cached at edge locations worldwide with 95%+ cache hit rates for popular content'
      ),
      why: "Without a CDN, every video request would travel to Google's data centers. At 1 billion hours of video watched daily, that would be impossible. CDNs make global video delivery economically viable.",
      component: component('cdn', 'CDN'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'CDN',
        'cache popular video segments at edge locations worldwide with 95%+ cache hit rates, reducing origin traffic to near zero',
        "When a video goes viral, it's served from the nearest CDN edge node — never hitting YouTube's origin servers. Cache hit rates for popular content exceed 95%. This is what makes 1 billion hours of daily video viewing economically viable.",
        'CDN'
      ),
      celebrationMessage: buildCelebration(
        'CDN',
        'Web Client',
        "YouTube's CDN caches popular videos at edge locations worldwide. Cache hit rates for popular content exceed 95% — most viewers get video from a CDN edge node within 50ms of their location, never touching YouTube's origin servers.",
        'API Gateway'
      ),
      messages: [
        msg("1 billion hours of video watched daily. How does YouTube serve all that without crushing their servers?"),
        msg(
          "The CDN caches popular videos at edge locations worldwide. When a video goes viral, it's served from the nearest edge node — never hitting YouTube's origin. Cache hit rates for popular content exceed 95%."
        ),
        msg("Press ⌘K and search for \"CDN\" and press Enter to add it, then connect Web → CDN."),
      ],
      requiredNodes: ['cdn'],
      requiredEdges: [edge('client_web', 'cdn')],
      successMessage: 'CDN added and connected. Now the API layer.',
      errorMessage: 'Add a CDN and connect Web → CDN.',
    }),
    step({
      id: 3,
      title: 'Add API Gateway',
      explanation:
        "All non-video requests — search, comments, likes, subscriptions, recommendations — flow through the API Gateway. It routes requests to the correct microservice and enforces rate limits.",
      action: buildAction(
        'API Gateway',
        'Web',
        'API Gateway',
        'all non-video requests — search, comments, likes, subscriptions, and recommendations — being routed to the correct microservice'
      ),
      why: "YouTube has dozens of microservices. The API Gateway is the single entry point that abstracts this complexity and provides a consistent interface for the client.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'API Gateway',
        'route search, comments, likes, and recommendation requests to the correct microservice while video bytes go through the CDN',
        "Video bytes go through the CDN. Everything else — search, comments, likes, recommendations — goes through the API Gateway. The gateway routes each request to the right service, hiding the complexity of dozens of microservices from the client.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "The API Gateway routes all non-video requests: search queries to the search service, comments to the comment service, recommendations to the ML service. It enforces rate limits and handles authentication for all these operations.",
        'Load Balancer'
      ),
      messages: [
        msg("Video bytes go through the CDN. Everything else — search, comments, likes — goes through the API Gateway."),
        msg(
          "The gateway routes requests to the right service: search queries go to the search service, comment posts go to the comment service, recommendation requests go to the ML service."
        ),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added and connected. Now distribute the traffic.',
      errorMessage: 'Add an API Gateway and connect Web → API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add Load Balancer',
      explanation:
        "YouTube's API Gateway routes to a Load Balancer that distributes requests across thousands of application servers. YouTube handles over 500 million API requests per day.",
      action: buildAction(
        'Load Balancer',
        'API Gateway',
        'Load Balancer',
        '500 million daily API requests being distributed across thousands of application servers using consistent hashing'
      ),
      why: "YouTube sees massive traffic spikes when popular videos are published. The load balancer enables horizontal scaling and ensures no single server becomes a bottleneck.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'Load Balancer',
        'distribute 500 million daily API requests across thousands of servers with consistent hashing for connection affinity',
        "When MrBeast posts a new video and millions of people click simultaneously, the load balancer spreads those requests across the fleet. YouTube uses consistent hashing so a user's requests always route to the same server cluster — helpful for connection state and caching.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "YouTube handles 500 million API requests per day. The Load Balancer uses consistent hashing — a user's requests always route to the same server cluster, maintaining connection state and cache affinity even as the fleet scales.",
        'Upload Service'
      ),
      messages: [
        msg("500 million API requests per day need to be distributed across thousands of servers."),
        msg(
          "The Load Balancer handles this distribution. When MrBeast posts a new video and millions of people click simultaneously, the load balancer spreads those requests across the fleet."
        ),
        msg("Press ⌘K and search for \"Load Balancer\" and press Enter to add it, then connect API Gateway → Load Balancer."),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load balancer added. Now the upload pipeline.',
      errorMessage: 'Add a Load Balancer and connect API Gateway → Load Balancer.',
    }),
    step({
      id: 5,
      title: 'Add Upload Service',
      explanation:
        "YouTube chunks large video files during upload. If your connection drops, the upload resumes from the last successful chunk. A 4K 1-hour video can be 50GB+ — chunked upload is essential.",
      action: buildAction(
        'Microservice',
        'Load Balancer',
        'Upload Service',
        'large video files being received as chunked uploads with resume capability — dropped connections pick up from the last successful chunk'
      ),
      why: "Resumable chunked uploads are critical for large video files. Without chunking, a dropped connection on a 50GB upload would require starting over. The Upload Service manages chunk tracking and assembly.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'Upload Service',
        'handle resumable chunked uploads for 50GB+ 4K videos where dropped connections resume from the last successful chunk',
        "A 4K 1-hour video can be 50GB. The Upload Service splits the video into chunks on the client side. If the connection drops, only the last chunk needs re-sending — not the entire 50GB. This is what makes uploading reliable for users on unstable connections.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Upload Service',
        'Load Balancer',
        "500 hours of video uploaded every minute. The Upload Service handles chunked uploads — if the connection drops, only the last chunk re-sends. The service tracks which chunks have been received. This makes 50GB uploads reliable for everyone.",
        'Transcoding Worker'
      ),
      messages: [
        msg("500 hours of video uploaded every minute. Each upload needs to be reliable — a 4K 1-hour video can be 50GB."),
        msg(
          "The Upload Service uses chunked uploads. The video is split into chunks on the client. If the connection drops, only the last chunk needs to be re-sent. The service tracks which chunks have been received."
        ),
        msg("Press ⌘K and search for \"Microservice\" and press Enter to add it, then connect Load Balancer → Upload Service."),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('load_balancer', 'microservice')],
      successMessage: 'Upload Service added. Now the transcoding pipeline.',
      errorMessage: 'Add a Microservice (Upload Service) and connect Load Balancer → Upload Service.',
    }),
    step({
      id: 6,
      title: 'Add Transcoding Worker',
      explanation:
        "Every video is transcoded into 360p, 480p, 720p, 1080p, 1440p, 4K — plus VP9, H.264, AV1 codecs — that's 20+ versions per video. YouTube's encoding pipeline (Archer) uses per-title encoding for optimal quality.",
      action: buildAction(
        'Worker',
        'Microservice',
        'Transcoding Worker',
        '20+ versions of each video being created in parallel — 360p through 4K in VP9, H.264, and AV1 codecs'
      ),
      why: "Without transcoding, YouTube could only serve one quality level. The 20+ versions per video is what enables adaptive bitrate streaming across every device and connection speed.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'Transcoding Worker',
        'create 20+ versions of each video in parallel — 360p through 4K in VP9, H.264, and AV1 codecs — using per-title encoding',
        "Per-title encoding analyzes each scene's complexity and allocates more bits to action sequences. This produces better visual quality at lower file sizes, saving hundreds of millions in CDN costs annually. Every uploaded video triggers a massive parallel encoding job.",
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Transcoding Worker',
        'Upload Service',
        "Every uploaded video is transcoded into 20+ formats: 360p through 4K in VP9, H.264, and AV1 codecs. YouTube's Archer pipeline uses per-title encoding — analyzing each scene's complexity for optimal quality at minimal file size, saving millions in CDN costs.",
        'Object Storage'
      ),
      messages: [
        msg("Every uploaded video needs to be transcoded into 20+ formats before it can be watched."),
        msg(
          "YouTube's Archer pipeline uses per-title encoding — it analyzes each scene's complexity and allocates more bits to action sequences. This produces better quality at lower file sizes, saving hundreds of millions in CDN costs annually."
        ),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Upload Service → Transcoding Worker."),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('microservice', 'worker_job')],
      successMessage: 'Transcoding Worker added. Now the storage layer.',
      errorMessage: 'Add a Worker / Background Job (Transcoding) and connect Upload Service → Transcoding Worker.',
    }),
    step({
      id: 7,
      title: 'Add Object Storage',
      explanation:
        "All raw and transcoded video files are stored in object storage. YouTube stores over 1 exabyte of video content — every title in every resolution, codec, and language combination.",
      action: buildAction(
        'Object Storage',
        'Worker',
        'Object Storage',
        'all 20+ versions of every video being persisted with 11 nines of durability — 1 exabyte of video content total'
      ),
      why: "Object storage is the only viable option for exabyte-scale video storage. It's infinitely scalable, durable, and cheap per GB — perfect for binary video files.",
      component: component('object_storage', 'Object'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'Object Storage',
        'persist 1 exabyte of video content with 11 nines of durability — every title in every resolution, codec, and language',
        "YouTube stores over 1 exabyte of video — that's 1 million terabytes. Object storage (like Google Cloud Storage) handles this at 11 nines of durability. The CDN pulls video segments from here to serve viewers worldwide.",
        'Object Storage'
      ),
      celebrationMessage: buildCelebration(
        'Object Storage',
        'Transcoding Worker',
        "After transcoding, all 20+ versions of every video land in object storage. YouTube stores 1 exabyte — 1 million terabytes of video. The CDN pulls from here to serve viewers. 11 nines of durability means you virtually never lose a video.",
        'Streaming Service'
      ),
      messages: [
        msg("After transcoding, all 20+ versions of every video need to be stored. That's object storage."),
        msg(
          "YouTube stores over 1 exabyte of video — that's 1 million terabytes. Object storage (like Google Cloud Storage) handles this at 11 nines of durability. The CDN pulls from here to serve viewers."
        ),
        msg("Press ⌘K and search for \"Object Storage\" and press Enter to add it, then connect Transcoding Worker → Object Storage."),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('worker_job', 'object_storage')],
      successMessage: 'Object Storage added. Now the streaming service.',
      errorMessage: 'Add an Object Storage and connect Transcoding Worker → Object Storage.',
    }),
    step({
      id: 8,
      title: 'Add Streaming Service',
      explanation:
        "The Streaming Service generates time-limited signed URLs for video segments. The CDN uses these URLs to fetch from Object Storage. Signed URLs expire after 60 seconds, preventing unauthorized sharing.",
      action: buildAction(
        'Microservice',
        'Object',
        'Streaming Service',
        'time-limited signed URLs being generated for video segments, expiring after 60 seconds to prevent unauthorized sharing'
      ),
      why: "Signed URLs are the elegant solution to video DRM — they grant temporary access to specific video segments without making files publicly accessible or proxying every byte through YouTube's servers.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'Streaming Service',
        'generate 60-second signed URLs for video segments — granting temporary access without public files or server-side proxying',
        "Signed URLs are YouTube's elegant DRM solution. The CDN requests a segment, YouTube signs a URL valid for 60 seconds. Long enough to watch, too short to share. The CDN fetches the segment directly from object storage using this signed URL.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Streaming Service',
        'Object Storage',
        "Signed URLs are YouTube's video DRM: 60-second access windows, CDN fetches directly from object storage. No public files, no server-side proxying. The Streaming Service's job is done after generating the signed URL — media flows directly from storage to CDN edge.",
        'Recommendation Service'
      ),
      messages: [
        msg("How does YouTube prevent people from downloading videos directly from storage? Signed URLs."),
        msg(
          "The Streaming Service generates time-limited URLs for each video segment. The URL expires in 60 seconds — long enough to watch, too short to share. The CDN fetches segments using these URLs."
        ),
        msg(
          'Press ⌘K and search for "Microservice" and press Enter to add another one for the Streaming Service, then connect Object Storage → Streaming Service.'
        ),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('object_storage', 'microservice')],
      successMessage: 'Streaming Service added. Now the recommendation engine.',
      errorMessage: 'Add a second Microservice (Streaming Service) and connect it from Object Storage.',
    }),
    step({
      id: 9,
      title: 'Add Recommendation Service',
      explanation:
        "YouTube's recommendation model is a two-stage system — first a candidate generation model narrows billions of videos to hundreds, then a ranking model scores those hundreds. 70% of watch time comes from recommendations.",
      action: buildAction(
        'Microservice',
        'Load Balancer',
        'Recommendation Service',
        'two-stage recommendation narrowing 800 million videos to ~500 candidates using deep learning ranking'
      ),
      why: "Recommendations drive 70% of YouTube's watch time. The two-stage architecture (candidate generation + ranking) is necessary because scoring all 800 million videos for every user would be computationally impossible.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'Recommendation Service',
        'narrow 800 million videos to ~500 candidates using a candidate generation model, then rank them with deep learning',
        "70% of what you watch comes from recommendations. The candidate generation model uses embeddings learned from watch history to find videos you might like from 800 million candidates. The ranking model then scores those 500 using deep learning. The top results become your homepage.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Recommendation Service',
        'Load Balancer',
        "YouTube's two-stage recommendation system drives 70% of watch time. Candidate generation narrows 800 million videos to ~500 using learned embeddings. The ranking model scores those 500 with deep learning. Every video you see on your homepage went through both stages.",
        'NoSQL Database'
      ),
      messages: [
        msg("70% of what you watch on YouTube comes from recommendations, not search. That's the Recommendation Service."),
        msg(
          "It's a two-stage system: first, a candidate generation model narrows 800 million videos to ~500 candidates for you. Then a ranking model scores those 500 using deep learning. The top results appear on your homepage."
        ),
        msg(
          'Press ⌘K and search for "Microservice" and press Enter to add another one for the Recommendation Service, then connect Load Balancer → Recommendation Service.'
        ),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('load_balancer', 'microservice')],
      successMessage: 'Recommendation Service added. Now the metadata database.',
      errorMessage: 'Add a third Microservice (Recommendation Service) and connect it from the Load Balancer.',
    }),
    step({
      id: 10,
      title: 'Add NoSQL Database',
      explanation:
        "YouTube stores video metadata (titles, descriptions, tags, view counts) and comments in a NoSQL database. View counts alone require billions of increments per day — NoSQL handles this write throughput.",
      action: buildAction(
        'NoSQL Database',
        'Microservice',
        'NoSQL Database',
        'video metadata — titles, descriptions, tags, view counts — being stored with billions of atomic increments per day'
      ),
      why: "Video metadata has a flexible schema — different video types have different fields. NoSQL's flexible document model handles this without requiring schema migrations every time YouTube adds a new video feature.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'NoSQL Database',
        'store video metadata with billions of atomic view count increments per day, handling all 50+ video types in a flexible document schema',
        "View counts alone require billions of atomic increments per day. YouTube uses a counter service backed by NoSQL — this write throughput would lock rows in a SQL table. NoSQL's flexible schema also handles all video types: standard videos, shorts, live streams, each with different metadata fields.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Upload Service',
        "Every video has metadata: title, description, tags, view count, likes. View counts alone require billions of atomic increments per day. NoSQL handles this write throughput without locking rows. Its flexible document schema handles all video types without migrations.",
        'Logger and Metrics'
      ),
      messages: [
        msg(
          "Every video has metadata — title, description, tags, view count, likes. That's stored in a NoSQL database."
        ),
        msg(
          "View counts alone require billions of atomic increments per day. YouTube uses a counter service backed by NoSQL to handle this write throughput without locking rows in a SQL table."
        ),
        msg("Press ⌘K and search for \"NoSQL Database\" and press Enter to add it, then connect Upload Service → NoSQL Database."),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('microservice', 'nosql_db')],
      successMessage: 'NoSQL Database added. Final step — observability.',
      errorMessage: 'Add a NoSQL Database and connect Upload Service → NoSQL Database.',
    }),
    step({
      id: 11,
      title: 'Add Observability',
      explanation:
        "YouTube monitors video start times, buffering rates, transcoding queue depth, and recommendation click-through rates in real time. A spike in buffering rate indicates CDN or transcoding issues.",
      action: buildAction(
        'Metrics Collector',
        'Microservice',
        'Metrics Collector',
        'video start times, buffering rates, and transcoding queue depth being tracked in real time to detect quality degradation'
      ),
      why: "Video quality metrics directly impact user retention. A 1-second increase in video start time reduces views by 5%. Observability lets YouTube detect and fix quality degradation before users notice.",
      component: component('metrics_collector', 'Metrics'),
      openingMessage: buildOpeningL1(
        'YouTube',
        'Metrics Collector',
        'track video start times, buffering rates, and transcoding queue depth in real time — a spike in buffering indicates CDN or transcoding issues',
        "A 1-second increase in video start time reduces views by 5%. The Metrics Collector tracks everything: video start times, buffering rates, transcoding queue depth, and recommendation click-through rates. When buffering spikes, YouTube pages the on-call engineer before users notice.",
        'Metrics Collector'
      ),
      celebrationMessage: buildCelebration(
        'Logger and Metrics',
        'Upload Service',
        "A 1-second video start delay reduces views by 5%. The Metrics Collector tracks buffering rates and transcoding queue depth. The Logger captures detailed playback traces. You have built YouTube.",
        'nothing — you have built YouTube'
      ),
      messages: [
        msg(
          "Final step — observability. A 1-second increase in video start time reduces views by 5% at YouTube's scale."
        ),
        msg(
          "The Metrics Collector tracks video start times, buffering rates, and transcoding queue depth. The Logger captures detailed traces for debugging specific playback failures."
        ),
        msg(
          'Press ⌘K and search for "Metrics Collector" and press Enter to add it. Then search for "Logger" and add that too. Connect both from the Upload Service.'
        ),
      ],
      requiredNodes: ['metrics_collector', 'logger'],
      requiredEdges: [
        edge('microservice', 'metrics_collector'),
        edge('microservice', 'logger'),
      ],
      successMessage: 'Observability added. You have built YouTube.',
      errorMessage: 'Add both Metrics Collector and Logger and connect them from the Upload Service.',
    }),
  ],
});

// ── Level 2 — Production Ready (9 steps) ─────────────────────────────────────

const l2 = level({
  level: 2,
  title: 'Production Ready',
  subtitle: 'Scale to billions of daily users',
  description:
    "Your video streaming foundation works. Now add what YouTube actually ships: authentication, Redis caching, Kafka event streaming, notification workers, SQL for user data, and structured logging.",
  estimatedTime: '~25 mins',
  unlocks: 'Expert Architecture',
  prerequisite: 'Builds on your Level 1 diagram',
  contextMessage:
    "Level 2: Production Ready. Your foundation streams videos at scale. Now add auth, caching, event streaming, notifications, SQL, and structured logging to make YouTube production-grade.",
  steps: [
    step({
      id: 1,
      title: 'Add Auth Service',
      explanation:
        "YouTube's Auth Service validates user sessions and manages channel ownership. It issues JWT tokens that encode user ID, channel permissions, and subscription tier — all verified on every API request.",
      action: buildAction(
        'Auth Service (JWT)',
        'Load Balancer',
        'Auth Service',
        'user sessions being validated with JWT tokens encoding permissions, subscription tier, and channel ownership'
      ),
      why: "Without centralized auth, every service would implement its own authentication logic — inconsistent and a security risk. The Auth Service is the single enforcement point for identity and permissions.",
      component: component('auth_service', 'Auth Service (JWT)', 'Auth Service (JWT)'),
      openingMessage: buildOpeningL2(
        'YouTube',
        'Auth Service (JWT)',
        'issue JWT tokens encoding user ID, channel permissions, and subscription tier — verified on every API request',
        'Without centralized auth, every service implements its own authentication — inconsistent and a security risk.',
        'Auth Service (JWT)'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "YouTube's Auth Service issues JWT tokens encoding user ID, channel permissions, and subscription tier. Premium users get different API quotas and feature access — all enforced by the JWT claims.",
        'In-Memory Cache'
      ),
      messages: [
        msg("Level 2 — Production Ready. YouTube's Auth Service validates user sessions and manages channel ownership."),
        msg("JWT tokens encode user ID, channel permissions, and subscription tier. Every API request is verified against these claims — premium users get different quotas and features."),
        msg("Press ⌘K and search for \"Auth Service (JWT)\" and press Enter to add it, then connect Load Balancer → Auth Service."),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth added. Now Redis caching.',
      errorMessage: 'Add an Auth Service connected from the Load Balancer.',
    }),
    step({
      id: 2,
      title: 'Add In-Memory Cache',
      explanation:
        "YouTube caches video metadata, trending lists, and recommendation results in Redis. Video metadata for popular videos is cached for 30 seconds — reducing NoSQL reads by 90% during viral video spikes.",
      action: buildAction(
        'In-Memory Cache',
        'Load Balancer',
        'In-Memory Cache',
        'video metadata and trending lists being cached for sub-millisecond reads, reducing NoSQL load by 90%'
      ),
      why: "Querying NoSQL for every video metadata request is slow and expensive. Redis caches popular video metadata — 90% of reads hit the cache, leaving NoSQL for writes and less-common queries.",
      component: component('in_memory_cache', 'In-Memory Cache'),
      openingMessage: buildOpeningL2(
        'YouTube',
        'Redis (In-Memory Cache)',
        'cache video metadata and trending lists for sub-millisecond reads, reducing NoSQL load by 90%',
        'Querying NoSQL for every video metadata request is slow and expensive — Redis caches popular content.',
        'In-Memory Cache'
      ),
      celebrationMessage: buildCelebration(
        'In-Memory Cache',
        'Load Balancer',
        "YouTube's Redis cache holds video metadata with 30-second TTL for popular videos. When a video goes viral, 90% of metadata reads hit Redis — the NoSQL database handles only 10% of traffic.",
        'Kafka Streaming'
      ),
      messages: [
        msg("Video metadata for popular videos is cached in Redis for 30 seconds — reducing NoSQL reads by 90% during viral spikes."),
        msg("Redis GEOSEARCH returns results in under 1ms vs 5-20ms for a NoSQL read. At YouTube's scale, that difference is the entire latency budget."),
        msg("Press ⌘K and search for \"In-Memory Cache\" and press Enter to add it, then connect Load Balancer → In-Memory Cache."),
      ],
      requiredNodes: ['in_memory_cache'],
      requiredEdges: [edge('load_balancer', 'in_memory_cache')],
      successMessage: 'Cache added. Now Kafka for events.',
      errorMessage: 'Add an In-Memory Cache connected from the Load Balancer.',
    }),
    step({
      id: 3,
      title: 'Add Kafka Streaming',
      explanation:
        "Every view, like, comment, and share is published to Kafka. The trending algorithm consumes view events in real time to compute trending lists within minutes. Analytics pipelines consume watch time data to train the recommendation model.",
      action: buildAction(
        'Kafka / Streaming',
        'Load Balancer',
        'Kafka Streaming',
        'every view, like, comment, and share being streamed to trending and analytics consumers in real time'
      ),
      why: "Without Kafka, computing trending lists would require synchronous database queries that slow down every view. Kafka decouples event producers from consumers — the view path stays fast regardless of how many downstream systems consume events.",
      component: component('kafka_streaming', 'Kafka / Streaming', 'Kafka / Streaming'),
      openingMessage: buildOpeningL2(
        'YouTube',
        'Kafka',
        'stream every view, like, and comment to trending and analytics consumers in real time',
        'Without Kafka, trending computation would require synchronous calls — slowing down every view.',
        'Kafka / Streaming'
      ),
      celebrationMessage: buildCelebration(
        'Kafka Streaming',
        'Load Balancer',
        "YouTube publishes billions of events per day to Kafka — every view, like, comment, and share. The trending algorithm reacts within minutes. Analytics pipelines consume watch time data to retrain recommendation models daily.",
        'Notification Worker'
      ),
      messages: [
        msg("Every view, like, comment, and share is published to Kafka. The trending algorithm consumes view events to compute trending lists within minutes."),
        msg("Analytics pipelines consume watch time data to retrain the recommendation model daily — this is how YouTube learns what content performs well."),
        msg("Press ⌘K and search for \"Kafka / Streaming\" and press Enter to add it, then connect Load Balancer → Kafka Streaming."),
      ],
      requiredNodes: ['kafka_streaming'],
      requiredEdges: [edge('load_balancer', 'kafka_streaming')],
      successMessage: 'Events streaming. Now notifications.',
      errorMessage: 'Add Kafka Streaming connected from the Load Balancer.',
    }),
    step({
      id: 4,
      title: 'Add Notification Worker',
      explanation:
        "Notification workers consume Kafka events to send push notifications — new subscriber alerts, comment replies, and live stream starts. They batch notifications to avoid notification storms when a video goes viral.",
      action: buildAction(
        'Worker',
        'Kafka',
        'Notification Worker',
        'push notifications being sent for new subscribers, comment replies, and live stream starts — batched to prevent notification storms'
      ),
      why: "If YouTube sent a notification to 10 million subscribers the instant a video uploaded, it would overwhelm devices. Notification batching prevents notification storms while keeping users informed.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL2(
        'YouTube',
        'Notification Worker',
        'batch push notifications for viral videos to prevent device overwhelm while keeping subscribers informed',
        'If YouTube notified 10 million subscribers instantly when a creator posts, devices would crash.',
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Notification Worker',
        'Kafka Streaming',
        "YouTube's notification workers batch alerts for viral videos — sending in waves to prevent device overwhelm. When a creator with 10M subscribers posts, notifications go out in batches over 30 minutes.",
        'SQL Database'
      ),
      messages: [
        msg("Notification workers consume Kafka events to send push notifications — new subscriber alerts, comment replies, live stream starts."),
        msg("Notifications are batched to prevent notification storms. When MrBeast posts to 10 million subscribers, notifications go out in waves over 30 minutes."),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Kafka Streaming → Notification Worker."),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('kafka_streaming', 'worker_job')],
      successMessage: 'Notifications added. Now SQL for users.',
      errorMessage: 'Add a Worker connected from Kafka Streaming.',
    }),
    step({
      id: 5,
      title: 'Add SQL Database',
      explanation:
        "YouTube stores user profiles, channel settings, monetization data, and subscription records in PostgreSQL. Payments and ad revenue require ACID transactions — a missing view from an earnings report is a legal issue.",
      action: buildAction(
        'SQL Database',
        'Auth Service',
        'SQL Database',
        'user profiles, channel settings, and monetization data being stored with ACID guarantees for financial compliance'
      ),
      why: "Channel earnings and ad revenue are financial data. YouTube pays creators based on watch time — these calculations must be accurate and auditable. ACID transactions ensure every view is recorded exactly once.",
      component: component('sql_db', 'SQL Database'),
      openingMessage: buildOpeningL2(
        'YouTube',
        'SQL Database',
        'store creator earnings and channel settings with ACID guarantees for financial compliance',
        'Channel earnings require auditable, ACID-compliant records — eventual consistency is unacceptable.',
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Auth Service',
        "YouTube pays creators based on watch time — these calculations must be accurate and auditable. PostgreSQL stores creator earnings and channel settings with full ACID compliance.",
        'Structured Logger'
      ),
      messages: [
        msg("User profiles, channel settings, and monetization data need ACID compliance. PostgreSQL stores the authoritative financial records."),
        msg("Creator earnings are legally required to be accurate and auditable. ACID transactions ensure every view is recorded exactly once for the revenue calculation."),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect Auth Service → SQL Database."),
      ],
      requiredNodes: ['sql_db'],
      requiredEdges: [edge('auth_service', 'sql_db')],
      successMessage: 'Financial data secured. Now structured logging.',
      errorMessage: 'Add a SQL Database connected from the Auth Service.',
    }),
    step({
      id: 6,
      title: 'Add Structured Logger',
      explanation:
        "YouTube's Structured Logger emits JSON-formatted logs with consistent field schemas — video_id, user_id, event_type, watch_duration. LogQL queries aggregate metrics across billions of logs per day.",
      action: buildAction(
        'Structured Logger',
        'Load Balancer',
        'Structured Logger',
        'JSON-formatted logs being emitted with consistent schemas for video_id, user_id, and event_type across all services'
      ),
      why: "Text logs require regex parsing — slow and error-prone at scale. Structured JSON logs enable LogQL queries that aggregate metrics across billions of entries in seconds.",
      component: component('structured_logger', 'Structured Logger'),
      openingMessage: buildOpeningL2(
        'YouTube',
        'Structured Logger',
        'emit JSON logs with consistent field schemas for video_id, user_id, and event_type across all services',
        'Text logs require regex parsing — structured JSON enables fast LogQL aggregation across billions of entries.',
        'Structured Logger'
      ),
      celebrationMessage: buildCelebration(
        'Structured Logger',
        'Load Balancer',
        "YouTube's Structured Logger emits JSON with consistent schemas: video_id, user_id, event_type, watch_duration. LogQL queries aggregate watch time across billions of entries — enabling real-time trending detection.",
        'SLO/SLI Tracker'
      ),
      messages: [
        msg("Structured Logger emits JSON-formatted logs with consistent schemas — video_id, user_id, event_type, watch_duration."),
        msg("LogQL queries aggregate metrics across billions of logs per day in seconds. Trending detection runs queries against structured logs, not raw text."),
        msg("Press ⌘K and search for \"Structured Logger\" and press Enter to add it, then connect Load Balancer → Structured Logger."),
      ],
      requiredNodes: ['structured_logger'],
      requiredEdges: [edge('load_balancer', 'structured_logger')],
      successMessage: 'Structured logging added. Now SLO tracking.',
      errorMessage: 'Add a Structured Logger connected from the Load Balancer.',
    }),
    step({
      id: 7,
      title: 'Add SLO/SLI Tracker',
      explanation:
        "YouTube's SLO/SLI Tracker monitors video start time, buffering rate, and transcoding queue depth against defined Service Level Objectives. Video start time SLO: 99.5% of videos start within 2 seconds.",
      action: buildAction(
        'SLO/SLI Tracker',
        'Metrics Collector',
        'SLO/SLI Tracker',
        'video start time and buffering rate being tracked against SLOs — alerting when error budgets burn'
      ),
      why: "Without SLOs, engineering teams argue about what 'good' means. With SLOs, there's a clear contractual target — video start time must be under 2 seconds for 99.5% of views.",
      component: component('slo_tracker', 'SLO/SLI Tracker'),
      openingMessage: buildOpeningL2(
        'YouTube',
        'SLO/SLI Tracker',
        'monitor video start time, buffering rate, and transcoding queue depth against defined SLO targets',
        'Without SLOs, engineering teams argue about what acceptable performance means.',
        'SLO/SLI Tracker'
      ),
      celebrationMessage: buildCelebration(
        'SLO/SLI Tracker',
        'Metrics Collector',
        "YouTube's SLO: 99.5% of videos start within 2 seconds. The SLO/SLI Tracker alerts when buffering rates exceed the error budget — pages on-call before users notice degradation.",
        'Error Budget Monitor'
      ),
      messages: [
        msg("The SLO/SLI Tracker monitors video start time, buffering rate, and transcoding queue depth against defined Service Level Objectives."),
        msg("YouTube's video start time SLO: 99.5% of videos start within 2 seconds. When buffering rates exceed the error budget, on-call is paged."),
        msg("Press ⌘K and search for \"SLO/SLI Tracker\" and press Enter to add it, then connect Metrics Collector → SLO/SLI Tracker."),
      ],
      requiredNodes: ['slo_tracker'],
      requiredEdges: [edge('metrics_collector', 'slo_tracker')],
      successMessage: 'SLO tracking added. Now error budgets.',
      errorMessage: 'Add an SLO/SLI Tracker connected from the Metrics Collector.',
    }),
    step({
      id: 8,
      title: 'Add Error Budget Monitor',
      explanation:
        "YouTube's Error Budget Monitor tracks remaining reliability budget for video start time SLO. When the error budget burns faster than acceptable, it prompts reliability engineering work instead of feature development.",
      action: buildAction(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        'Error Budget Monitor',
        'error budget burn rate being tracked — prompting reliability work when budget depletes faster than acceptable'
      ),
      why: "The error budget is the 'spare' reliability — the difference between the SLO target and 100%. When it's depleted, feature launches pause until reliability improves. This prevents reliability from being sacrificed for velocity.",
      component: component('error_budget_alert', 'Error Budget Monitor'),
      openingMessage: buildOpeningL2(
        'YouTube',
        'Error Budget Monitor',
        'track error budget burn rate — pausing feature launches when budget depletes to protect reliability',
        'The error budget is the reliability buffer — when depleted, feature launches pause for reliability work.',
        'Error Budget Monitor'
      ),
      celebrationMessage: buildCelebration(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        "YouTube's error budget policy: when more than 10% of the monthly budget burns in a week, feature launches pause. Engineering prioritizes reliability until the budget recovers — protecting user experience.",
        'Level 3'
      ),
      messages: [
        msg("The Error Budget Monitor tracks remaining reliability budget for the video start time SLO."),
        msg("When the error budget burns faster than acceptable, feature launches pause until reliability improves. This prevents reliability from being sacrificed for velocity."),
        msg("Press ⌘K and search for \"Error Budget Monitor\" and press Enter to add it, then connect SLO/SLI Tracker → Error Budget Monitor."),
      ],
      requiredNodes: ['error_budget_alert'],
      requiredEdges: [edge('slo_tracker', 'error_budget_alert')],
      successMessage: 'Error budget monitoring added. YouTube is now production-ready.',
      errorMessage: 'Add an Error Budget Monitor connected from the SLO/SLI Tracker.',
    }),
  ],
});

// ── Level 3 — Expert Architecture (11 steps) ───────────────────────────────────

const l3 = level({
  level: 3,
  title: 'Expert Architecture',
  subtitle: 'Design like a YouTube senior engineer',
  description:
    "You have production YouTube. Now add what separates senior engineers — service mesh, GraphQL Federation, token bucket rate limiting, distributed tracing with correlation IDs, CDN anycast routing, cache stampede prevention, and CDC-driven cache invalidation.",
  estimatedTime: '~30 mins',
  prerequisite: 'Builds on your Level 2 diagram',
  contextMessage:
    "Level 3: Expert Architecture. Add service mesh, GraphQL Federation, advanced rate limiting, distributed tracing, CDN anycast routing, cache stampede prevention, and CDC-driven cache invalidation.",
  steps: [
    step({
      id: 1,
      title: 'Add Service Mesh (Istio)',
      explanation:
        "YouTube's Service Mesh uses Istio to manage all east-west traffic between services — automatic mTLS encryption, circuit breaking, retries, and load balancing at the sidecar proxy level. The Control Plane enforces security policies across the entire Kubernetes cluster.",
      action: buildAction(
        'Service Mesh (Istio)',
        'Load Balancer',
        'Service Mesh',
        'automatic mTLS and traffic management being enforced at the sidecar proxy level for all service-to-service communication'
      ),
      why: "Without a service mesh, each service implements TLS, circuit breaking, and retries differently — inconsistent and hard to maintain. Istio handles this transparently at the infrastructure layer.",
      component: component('service_mesh', 'Service Mesh (Istio)'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'Service Mesh (Istio)',
        'automatic mTLS, circuit breaking, and traffic policies enforced at the sidecar proxy level across all services',
        'Without a service mesh, each service implements TLS, retries, and circuit breaking differently.',
        'Service Mesh (Istio)'
      ),
      celebrationMessage: buildCelebration(
        'Service Mesh',
        'Load Balancer',
        "YouTube's service mesh handles billions of service-to-service calls per day. Every call is encrypted with mTLS — no service code changes required. The Control Plane pushes traffic policies across the cluster instantly.",
        'GraphQL Federation Gateway'
      ),
      messages: [
        msg("Level 3 — Expert Architecture. The Service Mesh (Istio) adds sidecar proxies to every pod — handling mTLS, retries, circuit breaking, and load balancing transparently."),
        msg("With automatic mTLS, every service-to-service call is encrypted. The Control Plane distributes traffic policies across all sidecars instantly."),
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
        "YouTube's GraphQL Federation Gateway combines video metadata, recommendation, and subscription schemas into a unified supergraph. Mobile clients query one endpoint — the gateway fans out to multiple subgraphs and composes the response.",
      action: buildAction(
        'GraphQL Federation Gateway',
        'API Gateway',
        'GraphQL Federation Gateway',
        'video metadata, recommendations, and subscriptions being composed into a unified API from multiple subgraphs'
      ),
      why: "Without Federation, clients make multiple round trips to different REST endpoints. GraphQL Federation lets clients fetch all needed data in a single query — reducing mobile API calls by 60%.",
      component: component('graphql_federation', 'GraphQL Federation Gateway'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'GraphQL Federation Gateway',
        'compose video metadata, recommendations, and subscriptions into a unified supergraph from multiple subgraphs',
        'Without Federation, clients make multiple round trips to different REST endpoints — GraphQL reduces mobile API calls by 60%.',
        'GraphQL Federation Gateway'
      ),
      celebrationMessage: buildCelebration(
        'GraphQL Federation Gateway',
        'API Gateway',
        "YouTube's GraphQL Federation Gateway serves the mobile app with a unified API — one query fetches video metadata, recommendations, and subscription status. Mobile API calls reduced by 60%, latency reduced by 40%.",
        'Token Bucket Rate Limiter'
      ),
      messages: [
        msg("GraphQL Federation combines video metadata, recommendation, and subscription schemas into a unified supergraph."),
        msg("Mobile clients query one endpoint — the gateway fans out to multiple subgraphs and composes the response. Mobile API calls reduced by 60%."),
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
        "YouTube's Token Bucket Rate Limiter enforces API quotas using the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate. Creators uploading videos get larger buckets than casual viewers.",
      action: buildAction(
        'Token Bucket Rate Limiter',
        'API Gateway',
        'Token Bucket Rate Limiter',
        'API quotas being enforced with burst allowance using the token bucket algorithm — creators get larger buckets'
      ),
      why: "Fixed rate limiting can't handle legitimate bursts. Creators uploading 4K videos need burst capacity — the token bucket allows this while maintaining long-term average limits.",
      component: component('token_bucket_limiter', 'Token Bucket Rate Limiter'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'Token Bucket Rate Limiter',
        'enforce API quotas with burst allowance — creators uploading 4K videos get larger token buckets than casual viewers',
        'Fixed rate limiting cannot handle legitimate bursts — token bucket allows bursts while maintaining average limits.',
        'Token Bucket Rate Limiter'
      ),
      celebrationMessage: buildCelebration(
        'Token Bucket Rate Limiter',
        'API Gateway',
        "YouTube's token bucket rate limiter allows creators to burst upload requests — a creator uploading a 4K video can use their full bucket. Casual viewers get smaller buckets. The steady average rate prevents abuse while enabling legitimate bursts.",
        'OpenTelemetry Collector'
      ),
      messages: [
        msg("Token Bucket Rate Limiter uses the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate."),
        msg("Creators uploading 4K videos get larger buckets than casual viewers. The steady average rate prevents abuse while enabling legitimate upload bursts."),
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
        "YouTube's OpenTelemetry Collector receives traces, metrics, and logs from all services — processing and exporting to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs. One pipeline, multiple backends.",
      action: buildAction(
        'OpenTelemetry Collector',
        'Structured Logger',
        'OpenTelemetry Collector',
        'traces, metrics, and logs being aggregated and exported to multiple backends from a single unified collector'
      ),
      why: "Without OTel, each service uses different tracing libraries (Jaeger, Zipkin, X-Ray). The OTel Collector normalizes everything — one instrumentation, multiple backends.",
      component: component('otel_collector', 'OpenTelemetry Collector'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'OpenTelemetry Collector',
        'unified telemetry pipeline for traces, metrics, and logs with multi-backend export to Jaeger, Prometheus, and Elasticsearch',
        'Without OTel, each service uses different tracing libraries — the OTel Collector normalizes everything.',
        'OpenTelemetry Collector'
      ),
      celebrationMessage: buildCelebration(
        'OpenTelemetry Collector',
        'Structured Logger',
        "YouTube's OTel Collector processes billions of spans per day. One instrumentation exports to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs — three backends, zero per-service configuration.",
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
        "The Correlation ID Injector assigns a unique trace ID to every request that propagates via HTTP headers across all service calls — enabling end-to-end request tracing from the mobile client through transcoding and recommendation services.",
      action: buildAction(
        'Correlation ID Injector',
        'otel_collector',
        'Correlation ID Injector',
        'unique trace IDs being propagated across all service calls for end-to-end request visibility'
      ),
      why: "Without correlation IDs, debugging a slow video upload requires checking logs from the API gateway, upload service, transcoding workers, and storage service separately. Correlation IDs link all logs under one trace.",
      component: component('correlation_id_handler', 'Correlation ID Injector'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'Correlation ID Injector',
        'propagate unique trace IDs across all service calls for instant cross-service log correlation',
        'Without correlation IDs, debugging slow uploads requires checking logs from 5+ services separately.',
        'Correlation ID Injector'
      ),
      celebrationMessage: buildCelebration(
        'Correlation ID Injector',
        'OpenTelemetry Collector',
        "YouTube's correlation IDs flow through every service call: API Gateway → Upload Service → Transcoding Workers → Object Storage. All logs under one trace ID — instant debugging.",
        'Anycast DNS Router'
      ),
      messages: [
        msg("The Correlation ID Injector generates a unique trace ID at request entry and propagates it via HTTP headers through every service call."),
        msg("All logs for a request share one correlation ID — instant debugging across API Gateway, Upload Service, Transcoding Workers, and Object Storage."),
        msg("Press ⌘K and search for \"Correlation ID Injector\" and press Enter to add it, then connect OpenTelemetry Collector → Correlation ID Injector."),
      ],
      requiredNodes: ['correlation_id_handler'],
      requiredEdges: [edge('otel_collector', 'correlation_id_handler')],
      successMessage: 'Correlation IDs added. Now CDN anycast routing.',
      errorMessage: 'Add a Correlation ID Injector connected from the OpenTelemetry Collector.',
    }),
    step({
      id: 6,
      title: 'Add Anycast DNS Router',
      explanation:
        "YouTube's Anycast DNS Router routes viewers to the nearest CDN PoP using BGP anycast — the same IP announces from hundreds of locations and viewers reach the geographically closest one. Latency to CDN edge reduced by 30%.",
      action: buildAction(
        'Anycast DNS Router',
        'Web',
        'Anycast DNS Router',
        'viewers being routed to the nearest CDN PoP using BGP anycast — the same IP announces from hundreds of locations'
      ),
      why: "Unicast DNS routes all traffic to one IP — viewers in Sydney hit servers in Virginia. Anycast announces the same IP from all PoPs — viewers automatically reach the nearest edge location.",
      component: component('cdn_anycast', 'Anycast DNS Router'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'Anycast DNS Router',
        'route viewers to the nearest CDN PoP using BGP anycast — reducing latency to CDN edge by 30%',
        'Unicast DNS routes all traffic to one IP — Anycast automatically routes to the nearest edge.',
        'Anycast DNS Router'
      ),
      celebrationMessage: buildCelebration(
        'Anycast DNS Router',
        'Web Client',
        "YouTube's Anycast DNS Router announces the same IP from 200+ CDN PoPs worldwide. A viewer in Tokyo automatically resolves to the Tokyo PoP — latency to edge reduced by 30% vs unicast routing.",
        'DDoS Mitigation Layer'
      ),
      messages: [
        msg("Anycast DNS Router routes viewers to the nearest CDN PoP using BGP anycast — the same IP announces from hundreds of locations worldwide."),
        msg("Unicast DNS routes all traffic to one IP — viewers in Tokyo hit servers in Virginia. Anycast automatically routes viewers to the nearest edge location."),
        msg("Press ⌘K and search for \"Anycast DNS Router\" and press Enter to add it, then connect Web → Anycast DNS Router."),
      ],
      requiredNodes: ['cdn_anycast'],
      requiredEdges: [edge('client_web', 'cdn_anycast')],
      successMessage: 'Anycast routing added. Now DDoS protection.',
      errorMessage: 'Add an Anycast DNS Router connected from the Web Client.',
    }),
    step({
      id: 7,
      title: 'Add DDoS Mitigation Layer',
      explanation:
        "YouTube's DDoS Mitigation Layer scrubs malicious traffic at the network edge using anycast distribution and rate limiting. During hacktivist attacks, volumetric DDoS traffic is absorbed at the edge before reaching origin.",
      action: buildAction(
        'DDoS Mitigation Layer',
        'Anycast DNS Router',
        'DDoS Mitigation',
        'malicious traffic being scrubbed at the network edge before reaching YouTube origin servers'
      ),
      why: "Without DDoS mitigation, volumetric attacks overwhelm origin servers. Anycast distribution spreads attack traffic across 200+ PoPs — no single location is overwhelmed.",
      component: component('ddos_mitigation', 'DDoS Mitigation Layer'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'DDoS Mitigation Layer',
        'scrub malicious traffic at the network edge using anycast distribution and rate limiting',
        'Without DDoS mitigation, volumetric attacks overwhelm origin servers — anycast spreads traffic across 200+ PoPs.',
        'DDoS Mitigation Layer'
      ),
      celebrationMessage: buildCelebration(
        'DDoS Mitigation Layer',
        'Anycast DNS Router',
        "YouTube's DDoS mitigation absorbs 500+ Gbps attacks at the edge using anycast distribution. Attack traffic is spread across 200+ PoPs — no single location is overwhelmed. Legitimate traffic routes around attack traffic.",
        'Cache Stampede Prevention'
      ),
      messages: [
        msg("DDoS Mitigation Layer scrubs malicious traffic at the network edge using anycast distribution and rate limiting."),
        msg("During hacktivist attacks, volumetric DDoS traffic is absorbed at the edge before reaching YouTube origin servers. Anycast distribution spreads attack traffic across 200+ PoPs."),
        msg("Press ⌘K and search for \"DDoS Mitigation Layer\" and press Enter to add it, then connect Anycast DNS Router → DDoS Mitigation Layer."),
      ],
      requiredNodes: ['ddos_mitigation'],
      requiredEdges: [edge('cdn_anycast', 'ddos_mitigation')],
      successMessage: 'DDoS protection added. Now cache stampede prevention.',
      errorMessage: 'Add a DDoS Mitigation Layer connected from the Anycast DNS Router.',
    }),
    step({
      id: 8,
      title: 'Add Cache Stampede Prevention',
      explanation:
        "When a viral video's cache expires, YouTube's Cache Stampede Prevention uses probabilistic early expiration and distributed locking — ensuring only one request rebuilds the cache instead of thousands of concurrent requests causing a thundering herd.",
      action: buildAction(
        'Cache Stampede Prevention',
        'In-Memory Cache',
        'Cache Stampede Prevention',
        'thundering herd being prevented when cache expires using probabilistic early expiration and distributed locking'
      ),
      why: "Without cache stampede prevention, when a popular video's cache expires, thousands of concurrent requests hit the NoSQL database simultaneously — a thundering herd that can take down the database.",
      component: component('cache_stampede_guard', 'Cache Stampede Prevention'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'Cache Stampede Prevention',
        'prevent thundering herd when cache expires using probabilistic early expiration — only one request rebuilds cache',
        'Without stampede prevention, cache expiration causes thousands of concurrent database requests.',
        'Cache Stampede Prevention'
      ),
      celebrationMessage: buildCelebration(
        'Cache Stampede Prevention',
        'In-Memory Cache',
        "YouTube's Cache Stampede Prevention uses probabilistic early expiration — popular video cache expires with 10% probability before the TTL. When TTL hits, 10% of requests rebuild the cache instead of 100%. Thundering herd prevented.",
        'Change Data Cache'
      ),
      messages: [
        msg("Cache Stampede Prevention uses probabilistic early expiration — when TTL approaches, requests have a 10% chance of rebuilding the cache early."),
        msg("Instead of thousands of requests hitting NoSQL when cache expires, only ~10% rebuild — the thundering herd is prevented."),
        msg("Press ⌘K and search for \"Cache Stampede Prevention\" and press Enter to add it, then connect In-Memory Cache → Cache Stampede Prevention."),
      ],
      requiredNodes: ['cache_stampede_guard'],
      requiredEdges: [edge('in_memory_cache', 'cache_stampede_guard')],
      successMessage: 'Cache stampede prevention added. Now CDC-driven cache.',
      errorMessage: 'Add a Cache Stampede Prevention connected from the In-Memory Cache.',
    }),
    step({
      id: 9,
      title: 'Add Change Data Cache',
      explanation:
        "YouTube's Change Data Cache uses CDC (Change Data Capture) from the NoSQL database to know exactly when video metadata changes — invalidating cached entries precisely when source data changes instead of waiting for TTL expiration.",
      action: buildAction(
        'Change Data Cache',
        'NoSQL Database',
        'Change Data Cache',
        'cache entries being invalidated precisely when source data changes using CDC from the NoSQL transaction log'
      ),
      why: "Without CDC, cache invalidation relies on TTL — stale data persists until expiration. CDC captures every database write and invalidates the exact corresponding cache entry — zero staleness.",
      component: component('change_data_cache', 'Change Data Cache'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'Change Data Cache',
        'invalidate cache entries precisely when source data changes using CDC from the NoSQL transaction log',
        'Without CDC, cache relies on TTL — stale data persists. CDC invalidates exact entries when data changes.',
        'Change Data Cache'
      ),
      celebrationMessage: buildCelebration(
        'Change Data Cache',
        'NoSQL Database',
        "YouTube's CDC connector captures every video metadata write from the NoSQL transaction log — immediately invalidating the corresponding cache entry. Video title changes reflect instantly, no stale data.",
        'Data Warehouse'
      ),
      messages: [
        msg("Change Data Cache uses CDC (Change Data Capture) from the NoSQL transaction log to know exactly when video metadata changes."),
        msg("Instead of waiting for TTL expiration, CDC captures every database write and invalidates the exact corresponding cache entry — zero staleness."),
        msg("Press ⌘K and search for \"Change Data Cache\" and press Enter to add it, then connect NoSQL Database → Change Data Cache."),
      ],
      requiredNodes: ['change_data_cache'],
      requiredEdges: [edge('nosql_db', 'change_data_cache')],
      successMessage: 'CDC-driven cache added. Now the analytics pipeline.',
      errorMessage: 'Add a Change Data Cache connected from the NoSQL Database.',
    }),
    step({
      id: 10,
      title: 'Add Data Warehouse',
      explanation:
        "YouTube's Data Warehouse stores all historical watch time, engagement, and creator analytics data — powering the business intelligence that guides content policy, creator monetization, and recommendation model training.",
      action: buildAction(
        'Data Warehouse',
        'Kafka Streaming',
        'Data Warehouse',
        'all historical watch time, engagement, and creator analytics data being stored for business intelligence and ML training'
      ),
      why: "The NoSQL database answers 'what is the view count for this video right now?' The Data Warehouse answers 'what are the watch time trends for gaming content in Southeast Asia over the past year?' — different query patterns requiring different storage.",
      component: component('data_warehouse', 'Data Warehouse'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'Data Warehouse',
        'columnar analytics storage for watch time trends and creator monetization patterns across years of data',
        "The NoSQL database cannot answer multi-year trend questions — that needs a data warehouse.",
        'Data Warehouse'
      ),
      celebrationMessage: buildCelebration(
        'Data Warehouse',
        'Kafka Streaming',
        "YouTube's data warehouse processes petabytes of watch time data. Content policy decisions, creator monetization models, and recommendation training all use this data — guiding what 2.7 billion users watch.",
        'Event Store'
      ),
      messages: [
        msg("Data Warehouse stores all historical watch time, engagement, and creator analytics data for business intelligence and ML model training."),
        msg("The NoSQL database cannot answer multi-year trend questions — watch time patterns over years require columnar storage optimized for analytics."),
        msg("Press ⌘K and search for \"Data Warehouse\" and press Enter to add it, then connect Kafka Streaming → Data Warehouse."),
      ],
      requiredNodes: ['data_warehouse'],
      requiredEdges: [edge('kafka_streaming', 'data_warehouse')],
      successMessage: 'Analytics pipeline added. Now event sourcing.',
      errorMessage: 'Add a Data Warehouse connected from Kafka Streaming.',
    }),
    step({
      id: 11,
      title: 'Add Event Store',
      explanation:
        "YouTube's Event Store (EventStoreDB) maintains an immutable log of all video lifecycle events — uploaded, transcoded, published, removed, monetized. The entire system state can be reconstructed by replaying events for audit and compliance.",
      action: buildAction(
        'Event Store (EventStoreDB)',
        'Upload Service',
        'Event Store',
        'immutable event log being maintained for video lifecycle — enabling audit trails and state reconstruction by replay'
      ),
      why: "Video takedowns require a complete audit trail — who requested the takedown, when, why. The Event Store provides immutable evidence for legal and compliance requirements.",
      component: component('event_store', 'Event Store (EventStoreDB)'),
      openingMessage: buildOpeningL3(
        'YouTube',
        'Event Store (EventStoreDB)',
        'immutable event log for video lifecycle enabling audit trails and state reconstruction for legal compliance',
        'Video takedowns require a complete audit trail — the Event Store provides immutable evidence.',
        'Event Store (EventStoreDB)'
      ),
      celebrationMessage: buildCelebration(
        'Event Store',
        'Upload Service',
        "YouTube's Event Store maintains an immutable log of every video lifecycle event — uploaded, transcoded, published, removed, monetized. Legal teams can reconstruct exactly what happened and when. This completes the expert architecture.",
        'completion'
      ),
      messages: [
        msg("Event Store (EventStoreDB) maintains an immutable log of all video lifecycle events — uploaded, transcoded, published, removed, monetized."),
        msg("The entire system state can be reconstructed by replaying events. Video takedowns require a complete audit trail — the Event Store provides immutable evidence for legal and compliance."),
        msg("Press ⌘K and search for \"Event Store (EventStoreDB)\" and press Enter to add it, then connect Upload Service → Event Store. This completes the expert architecture!"),
      ],
      requiredNodes: ['event_store'],
      requiredEdges: [edge('microservice', 'event_store')],
      successMessage: "Expert architecture complete! You've designed YouTube at the senior engineer level.",
      errorMessage: 'Add an Event Store connected from the Upload Service.',
    }),
  ],
});

export const youtubeTutorial: Tutorial = tutorial({
  id: 'youtube-architecture',
  title: 'How to Design YouTube Architecture',
  description:
    "Design the world's largest video platform. Learn video upload pipelines, transcoding at scale, CDN distribution, and recommendation ML serving billions of views.",
  difficulty: 'Advanced',
  category: 'Video Streaming',
  isLive: false,
  icon: 'Video',
  color: '#ff0000',
  tags: ['Transcoding', 'CDN', 'Pipeline', 'ML', 'Storage'],
  estimatedTime: '~87 mins',
  levels: [l1, l2, l3],
});
