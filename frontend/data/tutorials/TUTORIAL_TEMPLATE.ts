import type { TutorialDefinition } from '@/lib/tutorial/schema';

/**
 * Tutorial Template - Use this as the starting point for new tutorials
 * 
 * IMPORTANT: This file contains ONLY data. No functions, hooks, or logic.
 * All tutorial behavior is driven by the shared engine in lib/tutorial/engine.ts
 * 
 * For validation rules, see: lib/tutorial/schema.ts
 * For detection logic, see: lib/tutorial/detection.ts
 */

export const tutorialTemplate: TutorialDefinition = {
  id: 'your-tutorial-id',
  title: 'Your Tutorial Title',
  description: 'A brief description of what users will build in this tutorial.',
  thumbnail: '/tutorials/your-thumbnail.png', // optional
  difficulty: 'beginner', // 'beginner' | 'intermediate' | 'advanced'
  estimatedMinutes: 15,

  levels: [
    {
      id: 'level-1',
      title: 'Level Title',
      steps: [
        {
          id: 'step-1',
          title: 'Step Title',
          
          // Each phase has its own content shown to the user
          phases: {
            context: {
              heading: 'Introduction to this step',
              body: 'What the user needs to know before starting. Context about why this component matters.',
            },
            intro: {
              heading: 'Do you know about this?',
              body: 'Brief intro asking if user is familiar with the component.',
            },
            teaching: {
              heading: 'Deep dive',
              body: 'Detailed explanation of the component, its purpose, and how it works in real systems.',
            },
            action: {
              heading: 'Your turn!',
              body: 'Instructions for what user needs to do. Add the component to the canvas.',
              highlightNodeIds: ['component-id'], // optional: highlight specific nodes
            },
            connecting: {
              heading: 'Connect it up',
              body: 'Instructions for connecting components. What connections need to be made.',
            },
            celebration: {
              heading: 'Great job!',
              body: 'Success message and preview of what comes next.',
            },
          },

          // Validation rules - these determine when the step is complete
          // The engine automatically checks these during 'action' and 'connecting' phases
          validation: [
            // Example: Require a specific node type
            { type: 'node_exists', nodeType: 'client', label: 'Mobile' },
            
            // Example: Require specific connections
            // { type: 'edge_exists', source: 'mobile', target: 'api_gateway' },
            
            // Example: Require minimum count of nodes
            // { type: 'node_count', nodeType: 'service', min: 2 },
            
            // Example: Multiple rules (all must pass)
            // { 
            //   type: 'all_of', 
            //   rules: [
            //     { type: 'node_exists', nodeType: 'client' },
            //     { type: 'edge_exists', source: 'client', target: 'api' }
            //   ] 
            // },
            
            // Example: Alternative rules (at least one must pass)
            // {
            //   type: 'any_of',
            //   rules: [
            //     { type: 'node_exists', nodeType: 'api_gateway' },
            //     { type: 'node_exists', nodeType: 'load_balancer' }
            //   ]
            // },
          ],

          // Hints shown after 15 seconds of inactivity during action phase
          hints: [
            'Press ⌘K to open the component search',
            'Search for "Component Name"',
            'Click to add it to the canvas',
          ],

          // Escape hatch timeout (default: 45000ms = 45 seconds)
          // After this, "Continue anyway" button appears
          continueAfterMs: 45000,
        },
      ],
    },
  ],
};

export default tutorialTemplate;
