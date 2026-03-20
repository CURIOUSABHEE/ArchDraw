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
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
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
        msg('Press ⌘K, search for "CDN", add it, then connect Web → CDN.'),
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
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
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
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
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
        msg('Press ⌘K, search for "Microservice", add it, then connect Load Balancer → Upload Service.'),
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
        msg('Press ⌘K, search for "Worker / Background Job", add it, then connect Upload Service → Transcoding Worker.'),
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
        msg('Press ⌘K, search for "Object Storage", add it, then connect Transcoding Worker → Object Storage.'),
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
          'Press ⌘K, search for "Microservice", add another one for the Streaming Service, then connect Object Storage → Streaming Service.'
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
          'Press ⌘K, search for "Microservice", add another one for the Recommendation Service, then connect Load Balancer → Recommendation Service.'
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
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Upload Service → NoSQL Database.'),
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
          'Press ⌘K, search for "Metrics Collector", add it. Then search for "Logger" and add that too. Connect both from the Upload Service.'
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
  estimatedTime: '~32 mins',
  levels: [l1],
});
