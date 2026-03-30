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
  title: 'Music Streaming Platform',
  subtitle: 'Build a music streaming platform in 11 steps',
  description:
    'Build a music streaming platform for 600 million users. Learn audio transcoding, CDN delivery, offline sync, recommendation algorithms, and real-time listening sessions.',
  estimatedTime: '~30 mins',
  unlocks: 'Production Layer',
  contextMessage:
    "Let's build Spotify from scratch. 600 million users, 100 million songs and podcasts, and a recommendation system that feels like it reads your mind. The architecture must handle millions of concurrent streams while delivering personalized playlists in real-time.",
  steps: [
    step({
      id: 1,
      title: 'Add the Web Client',
      explanation:
        "Spotify's client is the web app, desktop app, and mobile app. The client handles adaptive audio quality selection, local playback queue management, and offline playback from downloaded tracks.",
      action: buildFirstStepAction('Web'),
      why: "Spotify's client selects audio quality automatically: 24kbps on 2G, 96kbps on 3G, 160kbps on WiFi, 320kbps for Premium users. The client also manages the local playback queue and offline downloads.",
      component: component('client_web', 'Web'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Web Client',
        'select audio quality based on connection speed and manage local playback and offline downloads',
        "Spotify's client selects audio quality automatically: 24kbps on 2G, 96kbps on 3G, 160kbps on WiFi, 320kbps for Premium users. The client-side intelligence is what makes Spotify work on both WiFi and 2G.",
        'Web'
      ),
      celebrationMessage: buildCelebration(
        'Web Client',
        'nothing yet',
        "Spotify's client selects audio quality automatically based on connection speed. The client also manages the local playback queue and offline downloads for Premium subscribers.",
        'Audio CDN'
      ),
      messages: [
        msg(
          "Welcome to the Spotify Architecture tutorial. 600 million users, 100 million songs and podcasts, and a recommendation system that feels like it reads your mind."
        ),
        msg(
          "Spotify's client selects audio quality automatically: 24kbps on 2G, 96kbps on 3G, 160kbps on WiFi, 320kbps for Premium users. The client also manages the local playback queue and offline downloads."
        ),
        msg("Press ⌘K and search for \"Web\" and press Enter to add the client to the canvas."),
      ],
      requiredNodes: ['client_web'],
      requiredEdges: [],
      successMessage: 'Client added. Now the audio delivery layer.',
      errorMessage: 'Add a Web Client node to the canvas first.',
    }),
    step({
      id: 2,
      title: 'Add Audio CDN',
      explanation:
        "Spotify's Audio CDN delivers audio files from edge locations close to listeners. Every song is cached at hundreds of edge nodes worldwide. A popular song in Brazil is served from a São Paulo edge node, not a Stockholm origin server.",
      action: buildAction('Audio CDN', 'Web', 'Audio CDN', 'audio bytes being delivered from the nearest edge node for low-latency playback'),
      why: "Audio streaming requires low latency to prevent buffering. CDN edge nodes reduce the distance audio data travels, cutting latency from 200ms to under 20ms for most users.",
      component: component('audio_cdn', 'Audio'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Audio CDN',
        'deliver audio from edge locations close to listeners for buffer-free playback',
        "Spotify uses multiple CDN providers simultaneously — not just one. A song request goes to whichever CDN has the lowest latency for your location. The top 10,000 songs account for 80% of streams — these are pre-cached everywhere.",
        'Audio CDN'
      ),
      celebrationMessage: buildCelebration(
        'Audio CDN',
        'Web Client',
        "Audio streaming requires low latency to prevent buffering. CDN edge nodes reduce the distance audio data travels, cutting latency from 200ms to under 20ms. Spotify uses multiple CDN providers simultaneously for the best performance.",
        'API Gateway'
      ),
      messages: [
        msg(
          "Spotify uses multiple CDN providers simultaneously — not just one. A song request goes to whichever CDN has the lowest latency for your location."
        ),
        msg(
          "The Audio CDN caches the most popular songs at edge nodes. The top 10,000 songs account for 80% of streams — these are pre-cached everywhere. Long-tail songs are fetched from origin on first request and cached for subsequent ones."
        ),
        msg("Press ⌘K and search for \"Audio CDN\" and press Enter to add it, then connect Web → Audio CDN."),
      ],
      requiredNodes: ['audio_cdn'],
      requiredEdges: [edge('client_web', 'audio_cdn')],
      successMessage: 'Audio CDN added. Now the API layer.',
      errorMessage: 'Add an Audio CDN and connect it from the Client.',
    }),
    step({
      id: 3,
      title: 'Add API Gateway',
      explanation:
        "All non-audio requests — search, playlist management, social features, recommendations — flow through the API Gateway. Audio bytes go through the CDN; everything else goes through the gateway.",
      action: buildAction('API Gateway', 'Web', 'API Gateway', 'all non-audio requests including search, playlists, and recommendations'),
      why: "Separating audio delivery (CDN) from API traffic (gateway) allows each to scale independently. Audio traffic is 100x larger by volume but doesn't need the same processing as API requests.",
      component: component('api_gateway', 'API Gateway'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'API Gateway',
        'route non-audio requests to the correct microservice while audio flows through the CDN',
        "The API Gateway routes requests to the right microservice: search queries go to the search service, playlist updates go to the playlist service, recommendation requests go to the ML inference service. Audio bytes bypass this entirely.",
        'API Gateway'
      ),
      celebrationMessage: buildCelebration(
        'API Gateway',
        'Web Client',
        "Separating audio delivery (CDN) from API traffic (gateway) allows each to scale independently. Audio traffic is 100x larger by volume but doesn't need the same processing as API requests. Search, playlists, and recommendations all go through the gateway.",
        'Load Balancer'
      ),
      messages: [
        msg(
          "Audio bytes go through the CDN. Everything else — search, playlists, recommendations — goes through the API Gateway."
        ),
        msg(
          "The API Gateway routes requests to the right microservice: search queries go to the search service, playlist updates go to the playlist service, recommendation requests go to the ML inference service."
        ),
        msg("Press ⌘K and search for \"API Gateway\" and press Enter to add it, then connect Web → API Gateway."),
      ],
      requiredNodes: ['api_gateway'],
      requiredEdges: [edge('client_web', 'api_gateway')],
      successMessage: 'API Gateway added. Now distribute the traffic.',
      errorMessage: 'Add an API Gateway and connect it from the Client.',
    }),
    step({
      id: 4,
      title: 'Add Load Balancer',
      explanation:
        "Spotify's Load Balancer distributes API requests across thousands of microservice instances. Spotify uses a microservices architecture with 800+ services — the load balancer routes to the right cluster.",
      action: buildAction('Load Balancer', 'API Gateway', 'Load Balancer', 'API requests being distributed across thousands of microservice instances'),
      why: "Spotify has 800+ microservices. The load balancer must route requests to the correct service cluster while handling traffic spikes — like when a new album drops and millions of users search simultaneously.",
      component: component('load_balancer', 'Load Balancer'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Load Balancer',
        'distribute requests across 800+ microservices with intelligent routing to the right cluster',
        "When Taylor Swift drops a new album, millions of users search simultaneously. The load balancer auto-scales the search service cluster while other services remain unaffected. This is the power of microservices.",
        'Load Balancer'
      ),
      celebrationMessage: buildCelebration(
        'Load Balancer',
        'API Gateway',
        "Spotify has 800+ microservices. The load balancer routes each request to the right service cluster. When a new album drops and millions search simultaneously, the load balancer auto-scales the search cluster while other services stay unaffected.",
        'Auth Service'
      ),
      messages: [
        msg(
          "Spotify has 800+ microservices. The load balancer routes each request to the right service cluster."
        ),
        msg(
          "When Taylor Swift drops a new album, millions of users search simultaneously. The load balancer auto-scales the search service cluster while other services remain unaffected."
        ),
        msg("Press ⌘K and search for \"Load Balancer\" and press Enter to add it, then connect API Gateway → Load Balancer."),
      ],
      requiredNodes: ['load_balancer'],
      requiredEdges: [edge('api_gateway', 'load_balancer')],
      successMessage: 'Load Balancer added. Now the auth layer.',
      errorMessage: 'Add a Load Balancer and connect it from the API Gateway.',
    }),
    step({
      id: 5,
      title: 'Add Auth Service',
      explanation:
        "Spotify authenticates users via email/password or OAuth (Facebook, Google, Apple). The Auth Service also manages device authentication — a Premium account can be active on multiple devices simultaneously.",
      action: buildAction('Auth Service', 'Load Balancer', 'Auth Service', 'user and device authentication with support for multi-device Spotify Connect'),
      why: "Spotify's auth must handle the Spotify Connect feature — controlling playback on one device from another. This requires device-level authentication tokens, not just user tokens.",
      component: component('auth_service', 'Auth'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Auth Service',
        'authenticate users and devices with support for Spotify Connect across multiple devices',
        "Spotify Connect lets you control your TV's Spotify from your phone. The Auth Service issues device tokens so your phone can send commands to your TV's Spotify session. Both devices are authenticated independently.",
        'Auth Service'
      ),
      celebrationMessage: buildCelebration(
        'Auth Service',
        'Load Balancer',
        "Spotify Connect lets you control playback on one device from another. The Auth Service issues device tokens so your phone can send commands to your TV's Spotify session. This requires device-level authentication tokens, not just user tokens.",
        'Playlist Service'
      ),
      messages: [
        msg(
          "Spotify's auth handles both user authentication and device authentication for Spotify Connect."
        ),
        msg(
          "Spotify Connect lets you control your TV's Spotify from your phone. The Auth Service issues device tokens so your phone can send commands to your TV's Spotify session. Both devices are authenticated independently."
        ),
        msg("Press ⌘K and search for \"Auth Service\" and press Enter to add it, then connect Load Balancer → Auth Service."),
      ],
      requiredNodes: ['auth_service'],
      requiredEdges: [edge('load_balancer', 'auth_service')],
      successMessage: 'Auth added. Now the playlist service.',
      errorMessage: 'Add an Auth Service and connect it from the Load Balancer.',
    }),
    step({
      id: 6,
      title: 'Add Playlist Service',
      explanation:
        "The Playlist Service manages user playlists, collaborative playlists, and algorithmic playlists like Discover Weekly. It handles the complex logic of playlist ordering, collaborative editing, and playlist-to-track relationships.",
      action: buildAction('Playlist Service', 'Auth', 'Playlist Service', 'playlist management including collaborative editing and algorithmic playlist generation'),
      why: "Playlists are Spotify's core engagement mechanism. The Playlist Service must handle collaborative editing (multiple users adding tracks simultaneously) without conflicts.",
      component: component('playlist_service', 'Playlist'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Playlist Service',
        'manage user playlists, collaborative playlists, and algorithmic playlists like Discover Weekly',
        "Collaborative playlists use operational transforms — if two users add a track at the same position simultaneously, both tracks are added without conflict. Spotify also generates algorithmic playlists like Discover Weekly here.",
        'Playlist Service'
      ),
      celebrationMessage: buildCelebration(
        'Playlist Service',
        'Auth Service',
        "Playlists are Spotify's core engagement mechanism. The Playlist Service handles collaborative editing using operational transforms — if two users add a track at the same position simultaneously, both tracks are added without conflict.",
        'Audio Transcoder'
      ),
      messages: [
        msg(
          "Playlists are Spotify's core engagement feature. The Playlist Service manages everything from personal playlists to collaborative ones."
        ),
        msg(
          "Collaborative playlists use operational transforms — if two users add a track at the same position simultaneously, both tracks are added without conflict. Spotify also generates algorithmic playlists like Discover Weekly here."
        ),
        msg("Press ⌘K and search for \"Playlist Service\" and press Enter to add it, then connect Auth Service → Playlist Service."),
      ],
      requiredNodes: ['playlist_service'],
      requiredEdges: [edge('auth_service', 'playlist_service')],
      successMessage: 'Playlist Service added. Now the transcoding pipeline.',
      errorMessage: 'Add a Playlist Service and connect it from the Auth Service.',
    }),
    step({
      id: 7,
      title: 'Add Audio Transcoder',
      explanation:
        "Every song uploaded to Spotify is transcoded into 5 quality levels: 24kbps, 96kbps, 160kbps, 320kbps, and lossless. That's 500 million files for 100 million tracks. The transcoder runs as background workers.",
      action: buildAction('Audio Transcoder', 'Playlist', 'Audio Transcoder', 'audio files being transcoded into 5 quality levels from master recordings'),
      why: "Without transcoding, Spotify could only serve one quality level. The 5 quality levels are what enable Spotify to work on both 2G connections and audiophile setups.",
      component: component('audio_transcoder', 'Audio'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Audio Transcoder',
        'transcode each song into 5 quality levels: 24kbps, 96kbps, 160kbps, 320kbps, and lossless',
        "When a label uploads a master WAV file, the Audio Transcoder creates 5 versions: 24kbps (mobile data saver), 96kbps (normal), 160kbps (high), 320kbps (very high), and lossless FLAC. That's 500 million files total.",
        'Audio Transcoder'
      ),
      celebrationMessage: buildCelebration(
        'Audio Transcoder',
        'Playlist Service',
        "Every song on Spotify exists in 5 quality levels. The Audio Transcoder creates all of them from the master file: 24kbps for 2G, 96kbps for normal, 160kbps for high, 320kbps for very high, and lossless FLAC for audiophiles.",
        'Recommendation Service'
      ),
      messages: [
        msg(
          "Every song on Spotify exists in 5 quality levels. The Audio Transcoder creates all of them from the master file."
        ),
        msg(
          "When a label uploads a master WAV file, the Audio Transcoder creates 5 versions: 24kbps (mobile data saver), 96kbps (normal), 160kbps (high), 320kbps (very high), and lossless FLAC. That's 500 million files total."
        ),
        msg("Press ⌘K and search for \"Audio Transcoder\" and press Enter to add it, then connect Playlist Service → Audio Transcoder."),
      ],
      requiredNodes: ['audio_transcoder'],
      requiredEdges: [edge('playlist_service', 'audio_transcoder')],
      successMessage: 'Audio Transcoder added. Now the recommendation engine.',
      errorMessage: 'Add an Audio Transcoder and connect it from the Playlist Service.',
    }),
    step({
      id: 8,
      title: 'Add Recommendation Service',
      explanation:
        "Spotify's Discover Weekly uses collaborative filtering — finding users with similar taste, then recommending what they liked that you haven't heard. It runs every Monday morning as a batch ML job processing 30 billion listening events.",
      action: buildAction('Microservice', 'Auth', 'Recommendation Service', 'personalized recommendations being generated from collaborative filtering across 30 billion listening events'),
      why: "Recommendations drive engagement. Discover Weekly has a 40% save rate — users save 40% of recommended songs to their library. This is extraordinarily high for a recommendation system.",
      component: component('microservice', 'Microservice'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Recommendation Service',
        'generate personalized Discover Weekly playlists using collaborative filtering on 30 billion listening events',
        "The algorithm finds users with similar taste to you, then recommends songs they loved that you haven't heard. It runs every Monday morning as a batch job. The 40% save rate makes it one of the most accurate recommendation systems ever built.",
        'Microservice'
      ),
      celebrationMessage: buildCelebration(
        'Recommendation Service',
        'Auth Service',
        "Discover Weekly uses collaborative filtering across 30 billion listening events. It finds users with similar taste and recommends songs they loved that you haven't heard. The 40% save rate is extraordinarily high for a recommendation system.",
        'Offline Sync Service'
      ),
      messages: [
        msg(
          "Discover Weekly feels like Spotify reads your mind. It uses collaborative filtering across 30 billion listening events."
        ),
        msg(
          "The algorithm finds users with similar taste to you, then recommends songs they loved that you haven't heard. It runs every Monday morning as a batch job — not real-time. The 40% save rate makes it one of the most accurate recommendation systems ever built."
        ),
        msg("Press ⌘K and search for \"Microservice\" and press Enter to add it, then connect Auth Service → Recommendation Service."),
      ],
      requiredNodes: ['microservice'],
      requiredEdges: [edge('auth_service', 'microservice')],
      successMessage: 'Recommendation Service added. Now offline sync.',
      errorMessage: 'Add a Microservice (Recommendation Service) and connect it from the Auth Service.',
    }),
    step({
      id: 9,
      title: 'Add Offline Sync Service',
      explanation:
        "When you download a song, the encrypted audio file is stored on your device. The encryption key is stored server-side. When your subscription expires, the key is revoked and downloads become unplayable.",
      action: buildAction('Offline Sync Service', 'Auth', 'Offline Sync Service', 'offline download management with server-side encryption keys for DRM'),
      why: "Offline sync is a Premium feature that drives subscription revenue. The server-side key model ensures downloaded songs stop working when a subscription lapses — protecting label licensing agreements.",
      component: component('offline_sync', 'Offline'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Offline Sync Service',
        'manage offline downloads with server-side encryption keys for DRM protection',
        "The Offline Sync Service manages download state, syncs playlist changes to offline devices, and revokes decryption keys when subscriptions expire. This is how Spotify honors its licensing agreements with labels.",
        'Offline Sync Service'
      ),
      celebrationMessage: buildCelebration(
        'Offline Sync Service',
        'Auth Service',
        "Spotify's offline downloads use a clever DRM model: the audio file is on your device, but the decryption key is on Spotify's servers. When a subscription expires, the key is revoked and downloads become unplayable. This protects label licensing agreements.",
        'NoSQL Database'
      ),
      messages: [
        msg(
          "Spotify's offline downloads use a clever DRM model: the audio file is on your device, but the decryption key is on Spotify's servers."
        ),
        msg(
          "The Offline Sync Service manages download state, syncs playlist changes to offline devices, and revokes decryption keys when subscriptions expire. This is how Spotify honors its licensing agreements with labels."
        ),
        msg("Press ⌘K and search for \"Offline Sync Service\" and press Enter to add it, then connect Auth Service → Offline Sync Service."),
      ],
      requiredNodes: ['offline_sync'],
      requiredEdges: [edge('auth_service', 'offline_sync')],
      successMessage: 'Offline Sync Service added. Now the data layer.',
      errorMessage: 'Add an Offline Sync Service and connect it from the Auth Service.',
    }),
    step({
      id: 10,
      title: 'Add NoSQL Database',
      explanation:
        "Spotify stores user listening history, playlist data, and song metadata in a NoSQL database. Listening history is the training data for recommendations — billions of play events per day.",
      action: buildAction('NoSQL Database', 'Playlist', 'NoSQL Database', 'listening history, playlist data, and song metadata being persisted for recommendations'),
      why: "Listening history has a flexible schema — different event types (play, skip, save, share) have different fields. NoSQL handles this without schema migrations as Spotify adds new event types.",
      component: component('nosql_db', 'NoSQL'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'NoSQL Database',
        'store billions of listening events per day as training data for recommendations',
        "Every play, skip, save, and share is stored as an event. The Recommendation Service processes these events weekly to update Discover Weekly. NoSQL's flexible schema handles the different event types without migrations.",
        'NoSQL Database'
      ),
      celebrationMessage: buildCelebration(
        'NoSQL Database',
        'Playlist Service',
        "Spotify stores billions of listening events per day. This data is the foundation of the recommendation system. NoSQL's flexible schema handles play, skip, save, and share events without schema migrations.",
        'Object Storage'
      ),
      messages: [
        msg(
          "Spotify stores billions of listening events per day. This data is the foundation of the recommendation system."
        ),
        msg(
          "Every play, skip, save, and share is stored as an event. The Recommendation Service processes these events weekly to update Discover Weekly. NoSQL's flexible schema handles the different event types without migrations."
        ),
        msg("Press ⌘K and search for \"NoSQL Database\" and press Enter to add it, then connect Playlist Service → NoSQL Database."),
      ],
      requiredNodes: ['nosql_db'],
      requiredEdges: [edge('playlist_service', 'nosql_db')],
      successMessage: 'NoSQL Database added. Final step — master audio storage.',
      errorMessage: 'Add a NoSQL Database and connect it from the Playlist Service.',
    }),
    step({
      id: 11,
      title: 'Add Object Storage',
      explanation:
        "Master audio files and all transcoded versions are stored in Object Storage. Spotify stores 500 million audio files — the master WAV plus 5 quality versions for each of 100 million tracks.",
      action: buildAction('Object Storage', 'Audio', 'Object Storage', '500 million audio files being stored as master recordings and 5 quality versions each'),
      why: "Object storage is the only viable option for 500 million audio files. It's infinitely scalable, durable, and cheap per GB — the CDN pulls from here to serve listeners.",
      component: component('object_storage', 'Object'),
      openingMessage: buildOpeningL1(
        'Spotify',
        'Object Storage',
        'store 500 million audio files as master recordings and 5 quality versions each',
        "Object Storage holds the master WAV files and all 5 transcoded versions. The Audio CDN pulls from here to cache popular songs at edge nodes. The Offline Sync Service downloads encrypted versions to user devices.",
        'Object Storage'
      ),
      celebrationMessage: buildCelebration(
        'Object Storage',
        'Audio Transcoder',
        "Master audio files and all transcoded versions are stored in Object Storage. Spotify stores 500 million audio files — the master WAV plus 5 quality versions for each of 100 million tracks. The CDN pulls from here to serve listeners. You have built Spotify.",
        'nothing — you have built Spotify'
      ),
      messages: [
        msg(
          "Final step — where the actual audio files live. 500 million files in Object Storage."
        ),
        msg(
          "Object Storage holds the master WAV files and all 5 transcoded versions. The Audio CDN pulls from here to cache popular songs at edge nodes. The Offline Sync Service downloads encrypted versions to user devices."
        ),
        msg("Press ⌘K and search for \"Object Storage\" and press Enter to add it, then connect Audio Transcoder → Object Storage."),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('audio_transcoder', 'object_storage')],
      successMessage: 'Tutorial complete! You have built Spotify.',
      errorMessage: 'Add an Object Storage and connect it from the Audio Transcoder.',
    }),
  ],
});

// ── Level 2 — Production Ready (9 steps) ─────────────────────────────────────

const l2 = level({
  level: 2,
  title: 'Production Ready',
  subtitle: 'Scale to millions of concurrent streams',
  description:
    "Your music streaming foundation works. Now add what Spotify actually ships: Kafka for listening events, notification workers, SQL for user data, cache-aside pattern, structured logging, and SLO tracking.",
  estimatedTime: '~25 mins',
  unlocks: 'Expert Architecture',
  prerequisite: 'Builds on your Level 1 diagram',
  contextMessage:
    "Level 2: Production Ready. Your streaming platform plays music at scale. Now add Kafka event streaming, notifications, SQL, caching patterns, structured logging, and SLO tracking.",
  steps: [
    step({
      id: 1,
      title: 'Add Kafka Streaming',
      explanation:
        "Every play, skip, search, and playlist update is published to Kafka. The recommendation ML pipeline consumes listening events to train Discover Weekly. Analytics pipelines consume engagement data for artist insights.",
      action: buildAction(
        'Kafka / Streaming',
        'Load Balancer',
        'Kafka Streaming',
        'every play, skip, and search being streamed to recommendation and analytics consumers in real time'
      ),
      why: "Without Kafka, the recommendation ML pipeline would require synchronous database queries. Kafka decouples event producers from consumers — the play path stays fast regardless of downstream processing.",
      component: component('kafka_streaming', 'Kafka / Streaming', 'Kafka / Streaming'),
      openingMessage: buildOpeningL2(
        'Spotify',
        'Kafka',
        'stream every play, skip, and search to recommendation and analytics consumers in real time',
        'Without Kafka, the recommendation ML pipeline would require synchronous database queries.',
        'Kafka / Streaming'
      ),
      celebrationMessage: buildCelebration(
        'Kafka Streaming',
        'Load Balancer',
        "Spotify publishes billions of listening events per day to Kafka. The Discover Weekly ML pipeline trains weekly on this data. Analytics pipelines consume engagement for artist insights and content policy.",
        'Notification Worker'
      ),
      messages: [
        msg("Level 2 — Production Ready. Every play, skip, and search is published to Kafka for downstream consumers."),
        msg("The Discover Weekly ML pipeline trains weekly on listening events. Analytics pipelines consume engagement for artist insights."),
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
        "Notification workers consume Kafka events to send push notifications — new releases from followed artists, collaborative playlist updates, and podcast episode alerts.",
      action: buildAction(
        'Worker',
        'Kafka',
        'Notification Worker',
        'new release alerts, playlist updates, and podcast episode notifications being sent via push'
      ),
      why: "If Spotify sent notifications synchronously, slow push delivery could delay the playback response. Background workers handle notification delivery asynchronously.",
      component: component('worker_job', 'Worker'),
      openingMessage: buildOpeningL2(
        'Spotify',
        'Notification Worker',
        'deliver new release alerts and playlist updates asynchronously via push notifications',
        'Synchronous notifications would delay playback responses — background workers handle delivery asynchronously.',
        'Worker'
      ),
      celebrationMessage: buildCelebration(
        'Notification Worker',
        'Kafka Streaming',
        "Spotify's notification workers deliver new release alerts, collaborative playlist updates, and podcast episode notifications. All delivery is asynchronous — playback responses are never delayed by notification delivery.",
        'Cache-Aside Pattern'
      ),
      messages: [
        msg("Notification workers consume Kafka events to send new release alerts and playlist updates."),
        msg("All notification delivery is asynchronous — playback responses are never delayed by slow push delivery."),
        msg("Press ⌘K and search for \"Worker / Background Job\" and press Enter to add it, then connect Kafka Streaming → Notification Worker."),
      ],
      requiredNodes: ['worker_job'],
      requiredEdges: [edge('kafka_streaming', 'worker_job')],
      successMessage: 'Notifications added. Now cache-aside pattern.',
      errorMessage: 'Add a Worker connected from Kafka Streaming.',
    }),
    step({
      id: 3,
      title: 'Add Cache-Aside Pattern',
      explanation:
        "Spotify's Cache-Aside Pattern manages the recommendation cache explicitly — checking Redis first on read, populating on miss, and updating cache on write alongside the NoSQL database.",
      action: buildAction(
        'Cache-Aside Pattern',
        'Auth Service',
        'Cache-Aside Pattern',
        'recommendation cache being managed explicitly — checked first on read, populated on miss, updated on write'
      ),
      why: "Cache-aside gives explicit control over cache invalidation. When a user's recommendations are regenerated, the cache is updated immediately — no stale recommendations.",
      component: component('cache_aside', 'Cache-Aside Pattern'),
      openingMessage: buildOpeningL2(
        'Spotify',
        'Cache-Aside Pattern',
        'manage recommendation cache explicitly — checked first on read, populated on miss, updated on write',
        'Cache-aside gives explicit control over cache invalidation — no stale recommendations.',
        'Cache-Aside Pattern'
      ),
      celebrationMessage: buildCelebration(
        'Cache-Aside Pattern',
        'Auth Service',
        "Spotify's Cache-Aside Pattern explicitly manages the recommendation cache. When Discover Weekly is regenerated, the cache is updated immediately — users see fresh recommendations, no staleness.",
        'CDC Connector'
      ),
      messages: [
        msg("Cache-Aside Pattern manages the recommendation cache explicitly — checked first on read, populated on miss."),
        msg("When recommendations are regenerated, the cache is updated immediately — no stale recommendations shown to users."),
        msg("Press ⌘K and search for \"Cache-Aside Pattern\" and press Enter to add it, then connect Auth Service → Cache-Aside Pattern."),
      ],
      requiredNodes: ['cache_aside'],
      requiredEdges: [edge('auth_service', 'cache_aside')],
      successMessage: 'Cache-aside added. Now CDC for analytics.',
      errorMessage: 'Add a Cache-Aside Pattern connected from the Auth Service.',
    }),
    step({
      id: 4,
      title: 'Add CDC Connector (Debezium)',
      explanation:
        "The CDC Connector captures row-level changes from Spotify's NoSQL database and streams them to Kafka for analytics — playlist changes, user profile updates, and listening history modifications without adding load to the production database.",
      action: buildAction(
        'CDC Connector (Debezium)',
        'NoSQL Database',
        'CDC Connector',
        'playlist changes and user updates being captured from the NoSQL transaction log and streamed to Kafka'
      ),
      why: "Without CDC, analytics queries would require direct database reads that add load to the production database. CDC captures changes from the transaction log — zero production query overhead.",
      component: component('cdc_connector', 'CDC Connector (Debezium)'),
      openingMessage: buildOpeningL2(
        'Spotify',
        'CDC Connector (Debezium)',
        'capture playlist and user changes from the NoSQL transaction log and stream to Kafka — zero production query overhead',
        'Without CDC, analytics queries add load to the production database — CDC captures changes from the transaction log.',
        'CDC Connector (Debezium)'
      ),
      celebrationMessage: buildCelebration(
        'CDC Connector',
        'NoSQL Database',
        "Spotify's CDC Connector captures every playlist change and user update from the NoSQL transaction log — streaming to Kafka for analytics without adding load to the production database.",
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
      id: 5,
      title: 'Add SQL Database',
      explanation:
        "Spotify stores user profiles, subscription data, and payment records in PostgreSQL. Subscription billing requires ACID transactions — a missed billing event is a revenue leak.",
      action: buildAction(
        'SQL Database',
        'Auth Service',
        'SQL Database',
        'user profiles and subscription billing data being stored with ACID guarantees for financial compliance'
      ),
      why: "Subscription billing requires auditable, ACID-compliant records. A missed billing event is a revenue leak that must be detectable and correctable.",
      component: component('sql_db', 'SQL Database'),
      openingMessage: buildOpeningL2(
        'Spotify',
        'SQL Database',
        'store user profiles and subscription billing data with ACID guarantees for revenue compliance',
        'Subscription billing requires auditable, ACID-compliant records — a missed billing event is a revenue leak.',
        'SQL Database'
      ),
      celebrationMessage: buildCelebration(
        'SQL Database',
        'Auth Service',
        "Spotify stores subscription billing records in PostgreSQL with full ACID compliance. Every billing event is recorded exactly once — a missed payment is detectable and correctable.",
        'Structured Logger'
      ),
      messages: [
        msg("User profiles, subscription data, and payment records need ACID compliance. PostgreSQL stores the authoritative records."),
        msg("Subscription billing requires auditable records. A missed billing event is a revenue leak that must be detectable and correctable."),
        msg("Press ⌘K and search for \"SQL Database\" and press Enter to add it, then connect Auth Service → SQL Database."),
      ],
      requiredNodes: ['sql_db'],
      requiredEdges: [edge('auth_service', 'sql_db')],
      successMessage: 'SQL added. Now structured logging.',
      errorMessage: 'Add a SQL Database connected from the Auth Service.',
    }),
    step({
      id: 6,
      title: 'Add Structured Logger',
      explanation:
        "Spotify's Structured Logger emits JSON-formatted logs with consistent field schemas — user_id, track_id, event_type, listen_duration. LogQL queries aggregate metrics across billions of listening events per day.",
      action: buildAction(
        'Structured Logger',
        'Load Balancer',
        'Structured Logger',
        'JSON-formatted listening traces being emitted with consistent schemas for user_id, track_id, and event_type'
      ),
      why: "Text logs require regex parsing — slow and error-prone at scale. Structured JSON logs enable LogQL queries that aggregate metrics across billions of entries in seconds.",
      component: component('structured_logger', 'Structured Logger'),
      openingMessage: buildOpeningL2(
        'Spotify',
        'Structured Logger',
        'emit JSON logs with consistent field schemas for user_id, track_id, and event_type across all services',
        'Text logs require regex parsing — structured JSON enables fast LogQL aggregation across billions of entries.',
        'Structured Logger'
      ),
      celebrationMessage: buildCelebration(
        'Structured Logger',
        'Load Balancer',
        "Spotify's Structured Logger emits JSON with consistent schemas: user_id, track_id, event_type, listen_duration. LogQL queries aggregate streaming metrics across billions of events — enabling real-time artist analytics.",
        'SLO/SLI Tracker'
      ),
      messages: [
        msg("Structured Logger emits JSON-formatted logs with consistent schemas — user_id, track_id, event_type, listen_duration."),
        msg("LogQL queries aggregate metrics across billions of listening events per day in seconds. Artist analytics use structured log queries."),
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
        "Spotify's SLO/SLI Tracker monitors stream start time, audio quality selection, and recommendation latency against defined Service Level Objectives. Stream start time SLO: 99.9% of streams start within 500ms.",
      action: buildAction(
        'SLO/SLI Tracker',
        'Metrics Collector',
        'SLO/SLI Tracker',
        'stream start time and recommendation latency being tracked against SLOs — alerting when error budgets burn'
      ),
      why: "Without SLOs, engineering teams argue about what 'good' means. With SLOs, there's a clear contractual target — stream start must be under 500ms for 99.9% of plays.",
      component: component('slo_tracker', 'SLO/SLI Tracker'),
      openingMessage: buildOpeningL2(
        'Spotify',
        'SLO/SLI Tracker',
        'monitor stream start time and recommendation latency against defined SLO targets',
        'Without SLOs, engineering teams argue about what acceptable performance means.',
        'SLO/SLI Tracker'
      ),
      celebrationMessage: buildCelebration(
        'SLO/SLI Tracker',
        'Metrics Collector',
        "Spotify's SLO: 99.9% of streams start within 500ms. The SLO/SLI Tracker alerts when error budgets burn — pages on-call before users notice buffering or slow recommendations.",
        'Error Budget Monitor'
      ),
      messages: [
        msg("The SLO/SLI Tracker monitors stream start time, audio quality, and recommendation latency against defined Service Level Objectives."),
        msg("Spotify's stream start time SLO: 99.9% of streams start within 500ms. When latency exceeds the error budget, on-call is paged."),
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
        "Spotify's Error Budget Monitor tracks remaining reliability budget for stream start time SLO. When the error budget burns faster than acceptable, feature launches pause until reliability improves.",
      action: buildAction(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        'Error Budget Monitor',
        'error budget burn rate being tracked — pausing feature launches when budget depletes faster than acceptable'
      ),
      why: "The error budget is the 'spare' reliability. When depleted, feature launches pause. For streaming, reliability is non-negotiable — buffering drives users to cancel subscriptions.",
      component: component('error_budget_alert', 'Error Budget Monitor'),
      openingMessage: buildOpeningL2(
        'Spotify',
        'Error Budget Monitor',
        'track error budget burn rate — pausing feature launches when budget depletes to protect reliability',
        'For streaming services, reliability is non-negotiable — buffering drives users to cancel subscriptions.',
        'Error Budget Monitor'
      ),
      celebrationMessage: buildCelebration(
        'Error Budget Monitor',
        'SLO/SLI Tracker',
        "Spotify's error budget policy: when more than 10% of the monthly budget burns in a week, feature launches pause. Engineering prioritizes reliability until the budget recovers — protecting user experience.",
        'Level 3'
      ),
      messages: [
        msg("The Error Budget Monitor tracks remaining reliability budget for stream start time SLO."),
        msg("When the error budget burns faster than acceptable, feature launches pause until reliability improves. For streaming, buffering drives subscription cancellations."),
        msg("Press ⌘K and search for \"Error Budget Monitor\" and press Enter to add it, then connect SLO/SLI Tracker → Error Budget Monitor."),
      ],
      requiredNodes: ['error_budget_alert'],
      requiredEdges: [edge('slo_tracker', 'error_budget_alert')],
      successMessage: 'Error budget monitoring added. Spotify is now production-ready.',
      errorMessage: 'Add an Error Budget Monitor connected from the SLO/SLI Tracker.',
    }),
  ],
});

// ── Level 3 — Expert Architecture (11 steps) ───────────────────────────────────

const l3 = level({
  level: 3,
  title: 'Expert Architecture',
  subtitle: 'Design like a Spotify senior engineer',
  description:
    "You have production Spotify. Now add what separates senior engineers — service mesh, GraphQL Federation, token bucket rate limiting, distributed tracing with correlation IDs, prefetch cache for audio, CDC analytics, and event sourcing for playlists.",
  estimatedTime: '~30 mins',
  prerequisite: 'Builds on your Level 2 diagram',
  contextMessage:
    "Level 3: Expert Architecture. Add service mesh, GraphQL Federation, advanced rate limiting, distributed tracing, prefetch caching, CDC analytics, and event sourcing.",
  steps: [
    step({
      id: 1,
      title: 'Add Service Mesh (Istio)',
      explanation:
        "Spotify's Service Mesh uses Istio to manage all east-west traffic between services — automatic mTLS encryption, circuit breaking, retries, and load balancing at the sidecar proxy level across all 800+ microservices.",
      action: buildAction(
        'Service Mesh (Istio)',
        'Load Balancer',
        'Service Mesh',
        'automatic mTLS and traffic management being enforced at the sidecar proxy level for all 800+ services'
      ),
      why: "Without a service mesh, each of Spotify's 800+ microservices implements TLS, circuit breaking, and retries differently. Istio handles this transparently at the infrastructure layer.",
      component: component('service_mesh', 'Service Mesh (Istio)'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'Service Mesh (Istio)',
        'automatic mTLS, circuit breaking, and traffic policies enforced at the sidecar proxy level across all 800+ services',
        'Without a service mesh, 800+ services implement TLS, retries, and circuit breaking differently.',
        'Service Mesh (Istio)'
      ),
      celebrationMessage: buildCelebration(
        'Service Mesh',
        'Load Balancer',
        "Spotify's service mesh handles billions of service-to-service calls per day across 800+ microservices. Every call is encrypted with mTLS — no service code changes required. The Control Plane pushes traffic policies across the entire cluster instantly.",
        'BFF Gateway'
      ),
      messages: [
        msg("Level 3 — Expert Architecture. The Service Mesh (Istio) adds sidecar proxies to every pod — handling mTLS, retries, circuit breaking, and load balancing transparently."),
        msg("With automatic mTLS, every service-to-service call is encrypted across all 800+ microservices. The Control Plane distributes traffic policies across all sidecars instantly."),
        msg("Press ⌘K and search for \"Service Mesh (Istio)\" and press Enter to add it, then connect Load Balancer → Service Mesh."),
      ],
      requiredNodes: ['service_mesh'],
      requiredEdges: [edge('load_balancer', 'service_mesh')],
      successMessage: 'Service mesh added. Now BFF Gateway.',
      errorMessage: 'Add a Service Mesh connected from the Load Balancer.',
    }),
    step({
      id: 2,
      title: 'Add BFF Gateway',
      explanation:
        "Spotify's BFF Gateway provides a dedicated API layer per client type — one for web, one for mobile, one for TV, each aggregating data shaped specifically for that interface. Web gets richer metadata, mobile gets compressed payloads.",
      action: buildAction(
        'BFF Gateway',
        'API Gateway',
        'BFF Gateway',
        'dedicated API aggregation per client type — web, mobile, and TV each get data shaped specifically for their interface'
      ),
      why: "Without BFF, all clients consume the same API. Web needs rich metadata, mobile needs compact payloads, TV needs different formats. BFF lets each client optimize its API contract.",
      component: component('bff_gateway', 'BFF Gateway'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'BFF Gateway',
        'dedicated API layer per client type — web, mobile, and TV each get optimized data shapes',
        'Without BFF, all clients consume the same API — web needs metadata, mobile needs compact payloads.',
        'BFF Gateway'
      ),
      celebrationMessage: buildCelebration(
        'BFF Gateway',
        'API Gateway',
        "Spotify's BFF Gateway serves web, mobile, and TV clients with optimized API contracts. Web gets rich metadata, mobile gets compressed payloads, TV gets simplified navigation. Each client loads 40% faster with its dedicated BFF.",
        'GraphQL Federation Gateway'
      ),
      messages: [
        msg("BFF Gateway provides a dedicated API layer per client type — web, mobile, TV."),
        msg("Web gets rich metadata, mobile gets compressed payloads, TV gets simplified navigation. Each client loads 40% faster with its dedicated BFF."),
        msg("Press ⌘K and search for \"BFF Gateway\" and press Enter to add it, then connect API Gateway → BFF Gateway."),
      ],
      requiredNodes: ['bff_gateway'],
      requiredEdges: [edge('api_gateway', 'bff_gateway')],
      successMessage: 'BFF Gateway added. Now GraphQL Federation.',
      errorMessage: 'Add a BFF Gateway connected from the API Gateway.',
    }),
    step({
      id: 3,
      title: 'Add GraphQL Federation Gateway',
      explanation:
        "Spotify's GraphQL Federation Gateway combines playlist, track, and user schemas into a unified supergraph. Partner apps query one endpoint — the gateway fans out to multiple subgraphs and composes the response.",
      action: buildAction(
        'GraphQL Federation Gateway',
        'API Gateway',
        'GraphQL Federation Gateway',
        'playlist, track, and user schemas being composed into a unified API from multiple subgraphs'
      ),
      why: "Without Federation, partner apps make multiple round trips to different REST endpoints. GraphQL Federation lets apps fetch all needed data in a single query.",
      component: component('graphql_federation', 'GraphQL Federation Gateway'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'GraphQL Federation Gateway',
        'compose playlist, track, and user schemas into a unified supergraph from multiple subgraphs',
        'Without Federation, partner apps make multiple round trips — GraphQL reduces this to one.',
        'GraphQL Federation Gateway'
      ),
      celebrationMessage: buildCelebration(
        'GraphQL Federation Gateway',
        'API Gateway',
        "Spotify's GraphQL Federation Gateway serves partner apps with a unified API — one query fetches playlists, tracks, and user data. Partner API calls reduced by 60%, latency reduced by 40%.",
        'Token Bucket Rate Limiter'
      ),
      messages: [
        msg("GraphQL Federation combines playlist, track, and user schemas into a unified supergraph."),
        msg("Partner apps query one endpoint — the gateway fans out to multiple subgraphs and composes the response. API calls reduced by 60%."),
        msg("Press ⌘K and search for \"GraphQL Federation Gateway\" and press Enter to add it, then connect API Gateway → GraphQL Federation Gateway."),
      ],
      requiredNodes: ['graphql_federation'],
      requiredEdges: [edge('api_gateway', 'graphql_federation')],
      successMessage: 'GraphQL Federation added. Now rate limiting.',
      errorMessage: 'Add a GraphQL Federation Gateway connected from the API Gateway.',
    }),
    step({
      id: 4,
      title: 'Add Token Bucket Rate Limiter',
      explanation:
        "Spotify's Token Bucket Rate Limiter enforces API quotas using the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate. Premium users get larger buckets for playlist management.",
      action: buildAction(
        'Token Bucket Rate Limiter',
        'API Gateway',
        'Token Bucket Rate Limiter',
        'API quotas being enforced with burst allowance using the token bucket algorithm — Premium users get larger buckets'
      ),
      why: "Fixed rate limiting cannot handle legitimate bursts. Premium users managing large playlists need burst capacity — the token bucket allows this while maintaining average limits.",
      component: component('token_bucket_limiter', 'Token Bucket Rate Limiter'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'Token Bucket Rate Limiter',
        'enforce API quotas with burst allowance — Premium users get larger token buckets for playlist management',
        'Fixed rate limiting cannot handle legitimate bursts — token bucket allows bursts while maintaining average limits.',
        'Token Bucket Rate Limiter'
      ),
      celebrationMessage: buildCelebration(
        'Token Bucket Rate Limiter',
        'API Gateway',
        "Spotify's token bucket rate limiter allows Premium users to burst playlist management requests — adding 100 songs to a playlist can use the full bucket. Free users get smaller buckets. The steady average rate prevents abuse.",
        'Prefetch Cache'
      ),
      messages: [
        msg("Token Bucket Rate Limiter uses the token bucket algorithm — allowing burst traffic up to a bucket size while maintaining a steady average rate."),
        msg("Premium users managing large playlists get larger buckets. The steady average rate prevents abuse while enabling legitimate bursts."),
        msg("Press ⌘K and search for \"Token Bucket Rate Limiter\" and press Enter to add it, then connect API Gateway → Token Bucket Rate Limiter."),
      ],
      requiredNodes: ['token_bucket_limiter'],
      requiredEdges: [edge('api_gateway', 'token_bucket_limiter')],
      successMessage: 'Rate limiting added. Now prefetch cache.',
      errorMessage: 'Add a Token Bucket Rate Limiter connected from the API Gateway.',
    }),
    step({
      id: 5,
      title: 'Add Prefetch Cache',
      explanation:
        "Spotify's Prefetch Cache proactively caches audio segments before users request them based on prediction algorithms — when you finish a song, the next song is already cached. This reduces audio latency to near zero.",
      action: buildAction(
        'Prefetch Cache',
        'Audio CDN',
        'Prefetch Cache',
        'audio segments being proactively cached based on prediction algorithms — next song already cached when current song ends'
      ),
      why: "Without prefetching, users experience brief pauses between songs while the next track buffers. Prefetch cache eliminates these pauses entirely for predicted tracks.",
      component: component('prefetch_cache', 'Prefetch Cache'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'Prefetch Cache',
        'proactively cache audio segments based on prediction algorithms — next song already cached when current song ends',
        'Without prefetching, brief pauses between songs while the next track buffers — prefetch eliminates these pauses.',
        'Prefetch Cache'
      ),
      celebrationMessage: buildCelebration(
        'Prefetch Cache',
        'Audio CDN',
        "Spotify's Prefetch Cache predicts what you'll listen to next based on your listening history. When you finish a song, the next track is already cached — zero latency gap between songs. Seamless listening experience.",
        'OpenTelemetry Collector'
      ),
      messages: [
        msg("Prefetch Cache proactively caches audio segments before users request them based on prediction algorithms."),
        msg("When you finish a song, the next track is already cached — zero latency gap between songs. Seamless listening experience."),
        msg("Press ⌘K and search for \"Prefetch Cache\" and press Enter to add it, then connect Audio CDN → Prefetch Cache."),
      ],
      requiredNodes: ['prefetch_cache'],
      requiredEdges: [edge('audio_cdn', 'prefetch_cache')],
      successMessage: 'Prefetch cache added. Now distributed tracing.',
      errorMessage: 'Add a Prefetch Cache connected from the Audio CDN.',
    }),
    step({
      id: 6,
      title: 'Add OpenTelemetry Collector',
      explanation:
        "Spotify's OpenTelemetry Collector receives traces, metrics, and logs from all 800+ services — processing and exporting to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs.",
      action: buildAction(
        'OpenTelemetry Collector',
        'Structured Logger',
        'OpenTelemetry Collector',
        'traces, metrics, and logs being aggregated and exported to multiple backends from a single unified collector'
      ),
      why: "Without OTel, each of Spotify's 800+ services uses different tracing libraries. The OTel Collector normalizes everything — one instrumentation, multiple backends.",
      component: component('otel_collector', 'OpenTelemetry Collector'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'OpenTelemetry Collector',
        'unified telemetry pipeline for traces, metrics, and logs with multi-backend export across 800+ services',
        'Without OTel, 800+ services use different tracing libraries — the OTel Collector normalizes everything.',
        'OpenTelemetry Collector'
      ),
      celebrationMessage: buildCelebration(
        'OpenTelemetry Collector',
        'Structured Logger',
        "Spotify's OTel Collector processes billions of spans per day across 800+ services. One instrumentation exports to Jaeger for tracing, Prometheus for metrics, and Elasticsearch for logs — three backends, zero per-service configuration.",
        'Correlation ID Injector'
      ),
      messages: [
        msg("The OpenTelemetry Collector is the unified observability pipeline — receiving spans, metrics, and logs from all services, normalizing the format, and exporting to multiple backends."),
        msg("Without OTel, adding a new tracing backend requires changing every service. With OTel across 800+ services, services instrument once and the collector routes to any backend."),
        msg("Press ⌘K and search for \"OpenTelemetry Collector\" and press Enter to add it, then connect Structured Logger → OpenTelemetry Collector."),
      ],
      requiredNodes: ['otel_collector'],
      requiredEdges: [edge('structured_logger', 'otel_collector')],
      successMessage: 'OTel Collector added. Now correlation IDs.',
      errorMessage: 'Add an OpenTelemetry Collector connected from the Structured Logger.',
    }),
    step({
      id: 7,
      title: 'Add Correlation ID Injector',
      explanation:
        "The Correlation ID Injector assigns a unique trace ID to every request that propagates via HTTP headers across all service calls — enabling end-to-end request tracing from the mobile client through playlist assembly, recommendation, and audio delivery.",
      action: buildAction(
        'Correlation ID Injector',
        'otel_collector',
        'Correlation ID Injector',
        'unique trace IDs being propagated across all service calls for end-to-end request visibility'
      ),
      why: "Without correlation IDs, debugging a slow playlist load requires checking logs from the API gateway, playlist service, recommendation service, and audio CDN separately. Correlation IDs link all logs under one trace.",
      component: component('correlation_id_handler', 'Correlation ID Injector'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'Correlation ID Injector',
        'propagate unique trace IDs across all service calls for instant cross-service log correlation',
        'Without correlation IDs, debugging slow playlists requires checking logs from 5+ services separately.',
        'Correlation ID Injector'
      ),
      celebrationMessage: buildCelebration(
        'Correlation ID Injector',
        'OpenTelemetry Collector',
        "Spotify's correlation IDs flow through every service call: API Gateway → Playlist Service → Recommendation Service → Audio CDN. All logs under one trace ID — instant debugging of slow playlist loads.",
        'Data Warehouse'
      ),
      messages: [
        msg("The Correlation ID Injector generates a unique trace ID at request entry and propagates it via HTTP headers through every service call."),
        msg("All logs for a request share one correlation ID — instant debugging across Playlist, Recommendation, and Audio services."),
        msg("Press ⌘K and search for \"Correlation ID Injector\" and press Enter to add it, then connect OpenTelemetry Collector → Correlation ID Injector."),
      ],
      requiredNodes: ['correlation_id_handler'],
      requiredEdges: [edge('otel_collector', 'correlation_id_handler')],
      successMessage: 'Correlation IDs added. Now analytics pipeline.',
      errorMessage: 'Add a Correlation ID Injector connected from the OpenTelemetry Collector.',
    }),
    step({
      id: 8,
      title: 'Add Data Warehouse',
      explanation:
        "Spotify's Data Warehouse stores all historical listening data — streams, skips, saves, search queries. It powers the business intelligence that guides artist promotion, content licensing, and recommendation model training.",
      action: buildAction(
        'Data Warehouse',
        'CDC Connector',
        'Data Warehouse',
        'all historical listening data being stored for business intelligence and recommendation ML training'
      ),
      why: "The NoSQL database answers 'what is this user's listening history right now?' The Data Warehouse answers 'what are the streaming trends for indie artists over the past year?' — different query patterns requiring different storage.",
      component: component('data_warehouse', 'Data Warehouse'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'Data Warehouse',
        'columnar analytics storage for streaming trends and artist performance across years of listening data',
        'The NoSQL database cannot answer multi-year trend questions — that needs a data warehouse.',
        'Data Warehouse'
      ),
      celebrationMessage: buildCelebration(
        'Data Warehouse',
        'CDC Connector',
        "Spotify's data warehouse processes petabytes of listening data. Artist promotion decisions, content licensing investments, and recommendation model training all use this data — guiding what 600M users discover.",
        'CQRS Command Handler'
      ),
      messages: [
        msg("Data Warehouse stores all historical listening data for business intelligence and ML model training."),
        msg("The NoSQL database cannot answer multi-year streaming trend questions — columnar storage optimized for analytics is required."),
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
        "Spotify's CQRS Command Handler processes write operations — playlist updates, track saves, follow actions. Commands are validated and persisted to the write model with strict consistency guarantees before acknowledgment.",
      action: buildAction(
        'CQRS Command Handler',
        'Auth Service',
        'CQRS Command Handler',
        'write operations being validated and persisted to the write model with strict consistency — playlist updates, track saves'
      ),
      why: "CQRS separates read and write models — writes go through strict validation and consistency checks, reads go through optimized query paths. This prevents stale reads from blocking writes.",
      component: component('cqrs_command_handler', 'CQRS Command Handler'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'CQRS Command Handler',
        'process write operations with strict consistency — playlist updates, track saves validated before persistence',
        'CQRS separates read and write models — writes go through strict validation, reads go through optimized paths.',
        'CQRS Command Handler'
      ),
      celebrationMessage: buildCelebration(
        'CQRS Command Handler',
        'Auth Service',
        "Spotify's CQRS Command Handler processes playlist updates, track saves, and follow actions with strict consistency. Commands are validated and persisted to the write model before acknowledgment — no partial writes.",
        'CQRS Query Handler'
      ),
      messages: [
        msg("CQRS Command Handler processes write operations — playlist updates, track saves, follow actions."),
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
        "Spotify's CQRS Query Handler serves read operations from a denormalized read model — optimized for fast queries without the overhead of translating from a normalized write model. Playlist reads use this optimized path.",
      action: buildAction(
        'CQRS Query Handler',
        'Playlist Service',
        'CQRS Query Handler',
        'read operations being served from a denormalized read model optimized for fast queries — playlist reads'
      ),
      why: "Without CQRS, every read requires translating from the normalized write model. The Query Handler serves reads from a pre-computed denormalized model — sub-millisecond playlist reads.",
      component: component('cqrs_query_handler', 'CQRS Query Handler'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'CQRS Query Handler',
        'serve read operations from a denormalized read model — sub-millisecond playlist reads without write model translation',
        'Without CQRS, every read requires translating from the normalized write model — slower queries.',
        'CQRS Query Handler'
      ),
      celebrationMessage: buildCelebration(
        'CQRS Query Handler',
        'Playlist Service',
        "Spotify's CQRS Query Handler serves playlist reads from a denormalized read model — pre-computed track lists sorted by position. Playlist reads are sub-millisecond without any write model translation.",
        'Event Store'
      ),
      messages: [
        msg("CQRS Query Handler serves read operations from a denormalized read model."),
        msg("Playlist reads use the pre-computed denormalized model — sub-millisecond queries without translating from the normalized write model."),
        msg("Press ⌘K and search for \"CQRS Query Handler\" and press Enter to add it, then connect Playlist Service → CQRS Query Handler."),
      ],
      requiredNodes: ['cqrs_query_handler'],
      requiredEdges: [edge('playlist_service', 'cqrs_query_handler')],
      successMessage: 'CQRS Query Handler added. Now event sourcing.',
      errorMessage: 'Add a CQRS Query Handler connected from the Playlist Service.',
    }),
    step({
      id: 11,
      title: 'Add Event Store',
      explanation:
        "Spotify's Event Store (EventStoreDB) maintains an immutable log of all playlist lifecycle events — created, tracks added, tracks removed, collaborative edits, deleted. The entire playlist history can be reconstructed by replaying events for audit and collaboration history.",
      action: buildAction(
        'Event Store (EventStoreDB)',
        'Playlist Service',
        'Event Store',
        'immutable event log being maintained for playlist lifecycle — enabling audit trails and state reconstruction by replay'
      ),
      why: "Collaborative playlists require a complete edit history — who added what, when. The Event Store provides immutable evidence of every playlist change for collaboration and compliance.",
      component: component('event_store', 'Event Store (EventStoreDB)'),
      openingMessage: buildOpeningL3(
        'Spotify',
        'Event Store (EventStoreDB)',
        'immutable event log for playlist lifecycle enabling audit trails and collaboration history reconstruction',
        'Collaborative playlists require a complete edit history — the Event Store provides immutable evidence.',
        'Event Store (EventStoreDB)'
      ),
      celebrationMessage: buildCelebration(
        'Event Store',
        'Playlist Service',
        "Spotify's Event Store maintains an immutable log of every playlist lifecycle event — created, tracks added, tracks removed, collaborative edits. The entire playlist history can be reconstructed by replaying events. This completes the expert architecture.",
        'completion'
      ),
      messages: [
        msg("Event Store (EventStoreDB) maintains an immutable log of all playlist lifecycle events — created, tracks added, tracks removed, collaborative edits."),
        msg("The entire playlist history can be reconstructed by replaying events. Collaborative playlists require a complete edit history — the Event Store provides immutable evidence for collaboration and compliance."),
        msg("Press ⌘K and search for \"Event Store (EventStoreDB)\" and press Enter to add it, then connect Playlist Service → Event Store. This completes the expert architecture!"),
      ],
      requiredNodes: ['event_store'],
      requiredEdges: [edge('playlist_service', 'event_store')],
      successMessage: "Expert architecture complete! You've designed Spotify at the senior engineer level.",
      errorMessage: 'Add an Event Store connected from the Playlist Service.',
    }),
  ],
});

export const spotifyTutorial: Tutorial = tutorial({
  id: 'spotify-architecture',
  title: 'How to Design Spotify Architecture',
  description:
    'Build a music streaming platform for 600 million users. Learn audio transcoding, CDN delivery, offline sync, recommendation algorithms, and real-time listening sessions.',
  difficulty: 'Advanced',
  category: 'Audio Streaming',
  isLive: false,
  icon: 'Music',
  color: '#1db954',
  tags: ['Audio CDN', 'Offline', 'Recommendations', 'Transcoding'],
  estimatedTime: '~85 mins',
  levels: [l1, l2, l3],
});
