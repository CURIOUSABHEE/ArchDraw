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

const youtubeTutorial: TutorialDefinition = {
  id: 'youtube-architecture',
  title: 'How to Design YouTube Architecture',
  description: 'Build the video platform serving 2 billion users. Learn about video encoding, CDN delivery, recommendations, and scalable architecture.',
  difficulty: 'advanced',
  estimatedMinutes: 75,
  tags: ['video', 'cdn', 'recommendations'],
  icon: 'Play',
  color: '#FF0000',

  levels: [
    {
      id: 'level-1',
      title: 'Video Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Client',
          phases: {
            context: { heading: 'Welcome to YouTube Architecture', body: 'Building a video platform for 2 billion users.' },
            intro: { heading: 'About Client', body: 'Clients view and upload videos.' },
            teaching: { heading: 'Deep dive: Client', body: 'The Client displays video and handles uploads.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Web'." },
            connecting: { heading: 'Connect it up', body: 'First step.' },
            celebration: { heading: 'Great job!', body: 'Client added.' },
          },
          validation: [nodeRule('client_web', 'Web')],
          hints: ['Search for "Web"'],
        },
        {
          id: 'step-2',
          title: 'Add CDN',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding CDN.' },
            intro: { heading: 'About CDN', body: 'CDN serves video content.' },
            teaching: { heading: 'Deep dive: CDN', body: 'The CDN delivers video from edge servers.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'CDN'." },
            connecting: { heading: 'Connect it up', body: 'Connect Client → CDN.' },
            celebration: { heading: 'Great job!', body: 'CDN added.' },
          },
          validation: [allOf(nodeRule('cdn', 'CDN'), edgeRule('client_web', 'cdn'))],
          hints: ['Search for "CDN"'],
        },
        {
          id: 'step-3',
          title: 'Add API Gateway',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding API Gateway.' },
            intro: { heading: 'About API Gateway', body: 'Gateway handles API requests.' },
            teaching: { heading: 'Deep dive: API Gateway', body: 'The API Gateway handles API requests.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'API Gateway'." },
            connecting: { heading: 'Connect it up', body: 'Connect CDN → Gateway.' },
            celebration: { heading: 'Great job!', body: 'Gateway added.' },
          },
          validation: [allOf(nodeRule('api_gateway', 'API Gateway'), edgeRule('cdn', 'api_gateway'))],
          hints: ['Search for "API Gateway"'],
        },
        {
          id: 'step-4',
          title: 'Add Video Service',
          phases: {
            context: { heading: 'Level 1: Step 4', body: 'Adding Video Service.' },
            intro: { heading: 'About Video Service', body: 'Video service processes video.' },
            teaching: { heading: 'Deep dive: Video Service', body: 'The Video Service handles video delivery.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Video Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect Gateway → Video.' },
            celebration: { heading: 'Great job!', body: 'Video Service added.' },
          },
          validation: [allOf(nodeRule('video_service', 'Video Service'), edgeRule('api_gateway', 'video_service'))],
          hints: ['Search for "Video Service"'],
        },
        {
          id: 'step-5',
          title: 'Add Storage',
          phases: {
            context: { heading: 'Level 1: Step 5', body: 'Adding Object Storage.' },
            intro: { heading: 'About Storage', body: 'Storage holds video files.' },
            teaching: { heading: 'Deep dive: Object Storage', body: 'Object Storage stores video files.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Object Storage'." },
            connecting: { heading: 'Connect it up', body: 'Connect Video → Storage.' },
            celebration: { heading: 'Level 1 Complete!', body: 'Video foundation ready!' },
          },
          validation: [allOf(nodeRule('object_storage', 'Object Storage'), edgeRule('video_service', 'object_storage'))],
          hints: ['Search for "Object Storage"'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-6',
          title: 'Add Transcoding',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding Transcoding.' },
            intro: { heading: 'About Transcoding', body: 'Transcoding converts video formats.' },
            teaching: { heading: 'Deep dive: Transcoding', body: 'Transcoding converts video for different devices.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Transcoding'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Storage.' },
            celebration: { heading: 'Level 2 Complete!', body: 'Production ready!' },
          },
          validation: [nodeRule('transcoding', 'Transcoding')],
          hints: ['Search for "Transcoding"'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-7',
          title: 'Add Recommendation',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Recommendation.' },
            intro: { heading: 'About Recommendations', body: 'Recommendations suggest content.' },
            teaching: { heading: 'Deep dive: Recommendation', body: 'Recommendation engine suggests videos.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Recommendation'." },
            connecting: { heading: 'Connect it up', body: 'Connect to API Gateway.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed YouTube!" },
          },
          validation: [nodeRule('recommendation', 'Recommendation')],
          hints: ['Search for "Recommendation"'],
        },
      ],
    },
  ],
};

export default youtubeTutorial;