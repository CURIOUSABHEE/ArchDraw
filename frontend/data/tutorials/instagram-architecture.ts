import type { TutorialDefinition, ValidationRule } from '@/lib/tutorial/schema';

function nodeRule(nodeType: string, label?: string): ValidationRule {
  return { type: 'node_exists', nodeType, label };
}

function edgeRule(source: string, target: string): ValidationRule {
  return { type: 'edge_exists', source, target };
}

function allOf(...rules: ValidationRule[]): ValidationRule {
  return { type: 'all_of', rules };
}

const instagramTutorial: TutorialDefinition = {
  id: 'instagram-architecture',
  title: 'How to Design Instagram Architecture',
  description: 'Instagram serves 2B+ monthly active users sharing 100M+ photos daily. Learn how CDN, distributed storage, ML recommendations, and the follower graph work at global scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 60,
  tags: ['social-media', 'cdn', 'media-storage'],
  icon: 'Camera',
  color: '#E4405F',

  levels: [
    {
      id: 'level-1',
      title: 'The Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Mobile Client',
          phases: {
            context: { heading: 'Welcome to Instagram Architecture', body: "Let's build Instagram from scratch. Level 1 is the foundation — 8 components that handle photo uploads." },
            intro: { heading: 'Do you know about Mobile Clients?', body: 'The Mobile Client is the iOS or Android app where users upload photos.' },
            teaching: { heading: 'Deep dive: Mobile Client', body: 'The Mobile Client is the iOS or Android app where users upload photos, scroll their feed, and interact with content. 95% of Instagram usage is mobile.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Mobile' to add the client." },
            connecting: { heading: 'Connect it up', body: 'First step, no connections needed.' },
            celebration: { heading: 'Great job!', body: 'Mobile Client added. Now the Web Client.' },
          },
          validation: [nodeRule('client_mobile', 'Mobile')],
          hints: ['Search for "Mobile"', 'Add Mobile Client'],
        },
        {
          id: 'step-2',
          title: 'Add Web Client',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding the Web Client — browser-based version.' },
            intro: { heading: 'Do you know about Web Clients?', body: 'Web clients provide browser-based access.' },
            teaching: { heading: 'Deep dive: Web Client', body: "Instagram's Web Client is the browser-based version used primarily for browsing and messaging." },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Web' to add it." },
            connecting: { heading: 'Connect it up', body: 'Second client, no connections yet.' },
            celebration: { heading: 'Great job!', body: 'Web Client added. Now the CDN.' },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Search for "Web"', 'Add Web Client'],
        },
        {
          id: 'step-3',
          title: 'Add CDN',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding the CDN for media delivery.' },
            intro: { heading: 'Do you know about CDNs?', body: 'CDNs serve content from edge servers.' },
            teaching: { heading: 'Deep dive: CDN', body: 'The CDN serves photos, videos, and static assets from edge servers worldwide.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'CDN' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Mobile → CDN and Web → CDN.' },
            celebration: { heading: 'Great job!', body: 'CDN added. Now the API Gateway.' },
          },
          validation: [allOf(nodeRule('cdn', 'CDN'), edgeRule('client_mobile', 'cdn'), edgeRule('client_web', 'cdn'))],
          hints: ['Search for "CDN"', 'Connect both clients to CDN'],
        },
        {
          id: 'step-4',
          title: 'Add API Gateway',
          phases: {
            context: { heading: 'Level 1: Step 4', body: 'Adding API Gateway for API routing.' },
            intro: { heading: 'Do you know about API Gateways?', body: 'API Gateways route API requests.' },
            teaching: { heading: 'Deep dive: API Gateway', body: 'The API Gateway handles all non-media API requests — feed loading, post creation, likes, comments.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'API Gateway' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect clients to API Gateway.' },
            celebration: { heading: 'Great job!', body: 'API Gateway added. Now the Upload Pipeline.' },
          },
          validation: [allOf(nodeRule('api_gateway', 'API Gateway'), edgeRule('client_mobile', 'api_gateway'), edgeRule('client_web', 'api_gateway'))],
          hints: ['Search for "API Gateway"', 'Connect clients to it'],
        },
        {
          id: 'step-5',
          title: 'Add Upload Pipeline',
          phases: {
            context: { heading: 'Level 1: Step 5', body: 'Adding Upload Pipeline for media uploads.' },
            intro: { heading: 'Do you know about Upload Pipelines?', body: 'Upload pipelines handle file uploads.' },
            teaching: { heading: 'Deep dive: Upload Pipeline', body: 'The Upload Pipeline handles photo and video uploads, processing them for storage.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Upload Pipeline' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Upload Pipeline.' },
            celebration: { heading: 'Great job!', body: 'Upload Pipeline added. Now the Image Processing.' },
          },
          validation: [allOf(nodeRule('upload_pipeline', 'Upload Pipeline'), edgeRule('api_gateway', 'upload_pipeline'))],
          hints: ['Search for "Upload Pipeline"', 'Connect API Gateway to it'],
        },
        {
          id: 'step-6',
          title: 'Add Image Processing',
          phases: {
            context: { heading: 'Level 1: Step 6', body: 'Adding Image Processing for encoding.' },
            intro: { heading: 'Do you know about Image Processing?', body: 'Image processing converts and optimizes images.' },
            teaching: { heading: 'Deep dive: Image Processing', body: 'Image Processing resizes, compresses, and optimizes images for different resolutions.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Image Processing' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Upload Pipeline → Image Processing.' },
            celebration: { heading: 'Great job!', body: 'Image Processing added. Now the Media Storage.' },
          },
          validation: [allOf(nodeRule('image_processing', 'Image Processing'), edgeRule('upload_pipeline', 'image_processing'))],
          hints: ['Search for "Image Processing"', 'Connect Upload Pipeline to it'],
        },
        {
          id: 'step-7',
          title: 'Add Media Storage',
          phases: {
            context: { heading: 'Level 1: Step 7', body: 'Adding Media Storage for photos.' },
            intro: { heading: 'Do you know about Media Storage?', body: 'Media storage holds images and videos.' },
            teaching: { heading: 'Deep dive: Media Storage', body: 'Media Storage stores all photos and videos in object storage.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Media Storage' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Image Processing → Media Storage.' },
            celebration: { heading: 'Level 1 Complete!', body: 'You have a working Instagram foundation!' },
          },
          validation: [allOf(nodeRule('media_storage', 'Media Storage'), edgeRule('image_processing', 'media_storage'))],
          hints: ['Search for "Media Storage"', 'Connect Image Processing to it'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-8',
          title: 'Add Database',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding Database for user data.' },
            intro: { heading: 'Do you know about Databases?', body: 'Databases store structured data.' },
            teaching: { heading: 'Deep dive: Database', body: 'The Database stores user profiles, posts, likes, comments, and relationships.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'SQL Database' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Database.' },
            celebration: { heading: 'Great job!', body: 'Database added.' },
          },
          validation: [allOf(nodeRule('sql_db', 'SQL Database'), edgeRule('api_gateway', 'sql_db'))],
          hints: ['Search for "SQL Database"', 'Connect API Gateway to it'],
        },
        {
          id: 'step-9',
          title: 'Add Recommendation Engine',
          phases: {
            context: { heading: 'Level 2: Step 2', body: 'Adding Recommendation Engine.' },
            intro: { heading: 'Do you know about Recommendations?', body: 'Recommendation engines suggest content.' },
            teaching: { heading: 'Deep dive: Recommendation Engine', body: 'The Recommendation Engine uses ML to suggest content to users.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Recommendation Engine' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Database → Recommendation Engine.' },
            celebration: { heading: 'Level 2 Complete!', body: 'Production-ready Instagram!' },
          },
          validation: [allOf(nodeRule('recommendation_engine', 'Recommendation Engine'), edgeRule('sql_db', 'recommendation_engine'))],
          hints: ['Search for "Recommendation Engine"', 'Connect Database to it'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-10',
          title: 'Add Cache',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Cache for performance.' },
            intro: { heading: 'Do you know about Caches?', body: 'Caches improve performance.' },
            teaching: { heading: 'Deep dive: Cache', body: 'The Cache stores frequently accessed data for faster retrieval.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Cache' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Cache.' },
            celebration: { heading: 'Great job!', body: 'Cache added.' },
          },
          validation: [allOf(nodeRule('cache', 'Cache'), edgeRule('api_gateway', 'cache'))],
          hints: ['Search for "Cache"', 'Connect API Gateway to it'],
        },
        {
          id: 'step-11',
          title: 'Add Analytics',
          phases: {
            context: { heading: 'Level 3: Step 2', body: 'Adding Analytics service.' },
            intro: { heading: 'Do you know about Analytics?', body: 'Analytics track user behavior.' },
            teaching: { heading: 'Deep dive: Analytics', body: 'Analytics service tracks user engagement and behavior patterns.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Analytics' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Database → Analytics.' },
            celebration: { heading: 'Expert Architecture Complete!', body: "You've designed Instagram at senior level!" },
          },
          validation: [allOf(nodeRule('analytics', 'Analytics'), edgeRule('sql_db', 'analytics'))],
          hints: ['Search for "Analytics"', 'Connect Database to it'],
        },
      ],
    },
  ],
};

export default instagramTutorial;