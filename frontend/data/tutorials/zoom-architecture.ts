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

const zoomTutorial: TutorialDefinition = {
  id: 'zoom-architecture',
  title: 'How to Design Zoom Architecture',
  description: 'Build the video conferencing platform. Learn about WebRTC, SFU, and real-time communication at scale.',
  difficulty: 'intermediate',
  estimatedMinutes: 40,
  tags: ['video-conferencing', 'webrtc', 'real-time'],
  icon: 'Video',
  color: '#2D8CFF',

  levels: [
    {
      id: 'level-1',
      title: 'Video Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add Client',
          phases: {
            context: { heading: 'Welcome to Zoom Architecture', body: 'Building a video conferencing platform.' },
            intro: { heading: 'About Client', body: 'Clients join meetings.' },
            teaching: { heading: 'Deep dive: Client', body: 'The Client handles video calls.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Client'." },
            connecting: { heading: 'Connect it up', body: 'First step.' },
            celebration: { heading: 'Great job!', body: 'Client added.' },
          },
          validation: [nodeRule('client', 'Client')],
          hints: ['Search for "Client"'],
        },
        {
          id: 'step-2',
          title: 'Add WebRTC Gateway',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding WebRTC Gateway.' },
            intro: { heading: 'About WebRTC', body: 'WebRTC handles real-time video.' },
            teaching: { heading: 'Deep dive: WebRTC', body: 'WebRTC Gateway handles connections.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'WebRTC'." },
            connecting: { heading: 'Connect it up', body: 'Connect Client → Gateway.' },
            celebration: { heading: 'Level 1 Complete!', body: 'Foundation ready!' },
          },
          validation: [allOf(nodeRule('webrtc_gateway', 'WebRTC Gateway'), edgeRule('client', 'webrtc_gateway'))],
          hints: ['Search for "WebRTC"'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-3',
          title: 'Add Meeting Service',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding Meeting Service.' },
            intro: { heading: 'About Meeting', body: 'Meeting service manages meetings.' },
            teaching: { heading: 'Deep dive: Meeting', body: 'Meeting Service manages meetings.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Meeting Service'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Gateway.' },
            celebration: { heading: 'Level 2 Complete!', body: 'Production ready!' },
          },
          validation: [nodeRule('meeting_service', 'Meeting Service')],
          hints: ['Search for "Meeting Service"'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-4',
          title: 'Add Recording Service',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Recording Service.' },
            intro: { heading: 'About Recording', body: 'Recording captures meetings.' },
            teaching: { heading: 'Deep dive: Recording', body: 'Recording Service records meetings.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Recording'." },
            connecting: { heading: 'Connect it up', body: 'Connect to Meeting.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed Zoom!" },
          },
          validation: [nodeRule('recording_service', 'Recording Service')],
          hints: ['Search for "Recording"'],
        },
      ],
    },
  ],
};

export default zoomTutorial;