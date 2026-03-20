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
  title: 'Music Streaming Platform',
  subtitle: 'Build a music streaming platform in 11 steps',
  description:
    'Build a music streaming platform for 600 million users. Learn audio transcoding, CDN delivery, offline sync, recommendation algorithms, and real-time listening sessions.',
  estimatedTime: '~30 mins',
  unlocks: undefined,
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
        msg('Press ⌘K and search for "Web" to add the client to the canvas.'),
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
        msg('Press ⌘K, search for "Audio CDN", add it, then connect Web → Audio CDN.'),
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
        msg('Press ⌘K, search for "API Gateway", add it, then connect Web → API Gateway.'),
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
        msg('Press ⌘K, search for "Load Balancer", add it, then connect API Gateway → Load Balancer.'),
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
        msg('Press ⌘K, search for "Auth Service", add it, then connect Load Balancer → Auth Service.'),
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
        msg('Press ⌘K, search for "Playlist Service", add it, then connect Auth Service → Playlist Service.'),
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
        msg('Press ⌘K, search for "Audio Transcoder", add it, then connect Playlist Service → Audio Transcoder.'),
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
        msg('Press ⌘K, search for "Microservice", add it, then connect Auth Service → Recommendation Service.'),
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
        msg('Press ⌘K, search for "Offline Sync Service", add it, then connect Auth Service → Offline Sync Service.'),
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
        msg('Press ⌘K, search for "NoSQL Database", add it, then connect Playlist Service → NoSQL Database.'),
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
        msg('Press ⌘K, search for "Object Storage", add it, then connect Audio Transcoder → Object Storage.'),
      ],
      requiredNodes: ['object_storage'],
      requiredEdges: [edge('audio_transcoder', 'object_storage')],
      successMessage: 'Tutorial complete! You have built Spotify.',
      errorMessage: 'Add an Object Storage and connect it from the Audio Transcoder.',
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
  estimatedTime: '~30 mins',
  levels: [l1],
});
