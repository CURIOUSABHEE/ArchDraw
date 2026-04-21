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

const uberTutorial: TutorialDefinition = {
  id: 'uber-architecture',
  title: 'How to Design Uber Architecture',
  description: 'Build the two-sided ride-hailing platform that matches 25 million trips daily. Learn real-time geospatial matching, surge pricing, and distributed systems at global scale.',
  difficulty: 'advanced',
  estimatedMinutes: 65,
  tags: ['ride-hailing', 'geospatial', 'marketplace'],
  icon: 'Car',
  color: '#000000',

  levels: [
    {
      id: 'level-1',
      title: 'The Foundation',
      steps: [
        {
          id: 'step-1',
          title: 'Add the Rider App',
          phases: {
            context: { heading: 'Welcome to Uber Architecture', body: 'Uber is a two-sided marketplace — riders request trips, drivers fulfill them.' },
            intro: { heading: 'About Rider App', body: 'The Rider App is where passengers request rides.' },
            teaching: { heading: 'Deep dive: Rider App', body: 'The Rider App is where every Uber trip begins. Passengers request rides, track driver locations, and pay.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Mobile' to add the Rider App." },
            connecting: { heading: 'Connect it up', body: 'First step, no connections needed.' },
            celebration: { heading: 'Great job!', body: 'Rider App added. Now the Driver App.' },
          },
          validation: [nodeRule('client_mobile', 'Mobile')],
          hints: ['Search for "Mobile"'],
        },
        {
          id: 'step-2',
          title: 'Add the Driver App',
          phases: {
            context: { heading: 'Level 1: Step 2', body: 'Adding the Driver App — the two-sided marketplace.' },
            intro: { heading: 'About Driver App', body: 'The Driver App is used by drivers.' },
            teaching: { heading: 'Deep dive: Driver App', body: 'The Driver App receives ride requests and navigation directions.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Driver App' to add it." },
            connecting: { heading: 'Connect it up', body: 'Second app, no connections yet.' },
            celebration: { heading: 'Great job!', body: 'Driver App added. Now the API Gateway.' },
          },
          validation: [nodeRule('client_driver', 'Driver App')],
          hints: ['Search for "Driver App"'],
        },
        {
          id: 'step-3',
          title: 'Add API Gateway',
          phases: {
            context: { heading: 'Level 1: Step 3', body: 'Adding API Gateway for request routing.' },
            intro: { heading: 'About API Gateway', body: 'API Gateways route API requests.' },
            teaching: { heading: 'Deep dive: API Gateway', body: 'The API Gateway handles all rider and driver API requests.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'API Gateway' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect both apps to API Gateway.' },
            celebration: { heading: 'Great job!', body: 'API Gateway added.' },
          },
          validation: [allOf(nodeRule('api_gateway', 'API Gateway'), edgeRule('client_mobile', 'api_gateway'), edgeRule('client_driver', 'api_gateway'))],
          hints: ['Search for "API Gateway"', 'Connect both apps'],
        },
        {
          id: 'step-4',
          title: 'Add Matching Service',
          phases: {
            context: { heading: 'Level 1: Step 4', body: 'Adding Matching Service for rider-driver matching.' },
            intro: { heading: 'About Matching Services', body: 'Matching services pair riders with drivers.' },
            teaching: { heading: 'Deep dive: Matching Service', body: 'The Matching Service finds nearby drivers for rider requests.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Matching Service' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Matching Service.' },
            celebration: { heading: 'Great job!', body: 'Matching Service added.' },
          },
          validation: [allOf(nodeRule('matching_service', 'Matching Service'), edgeRule('api_gateway', 'matching_service'))],
          hints: ['Search for "Matching Service"', 'Connect to it'],
        },
        {
          id: 'step-5',
          title: 'Add Location Service',
          phases: {
            context: { heading: 'Level 1: Step 5', body: 'Adding Location Service for geospatial queries.' },
            intro: { heading: 'About Location Services', body: 'Location services handle geospatial data.' },
            teaching: { heading: 'Deep dive: Location Service', body: 'The Location Service tracks driver locations and finds nearby drivers.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Location Service' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Matching Service → Location Service.' },
            celebration: { heading: 'Great job!', body: 'Location Service added.' },
          },
          validation: [allOf(nodeRule('location_service', 'Location Service'), edgeRule('matching_service', 'location_service'))],
          hints: ['Search for "Location Service"', 'Connect Matching to it'],
        },
        {
          id: 'step-6',
          title: 'Add Maps API',
          phases: {
            context: { heading: 'Level 1: Step 6', body: 'Adding Maps API for routing.' },
            intro: { heading: 'About Maps APIs', body: 'Maps APIs provide routing directions.' },
            teaching: { heading: 'Deep dive: Maps API', body: 'The Maps API provides turn-by-turn directions.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Maps API' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Location Service → Maps API.' },
            celebration: { heading: 'Great job!', body: 'Maps API added.' },
          },
          validation: [allOf(nodeRule('maps_api', 'Maps API'), edgeRule('location_service', 'maps_api'))],
          hints: ['Search for "Maps API"', 'Connect to it'],
        },
        {
          id: 'step-7',
          title: 'Add Database',
          phases: {
            context: { heading: 'Level 1: Step 7', body: 'Adding Database for trip storage.' },
            intro: { heading: 'About Databases', body: 'Databases store data.' },
            teaching: { heading: 'Deep dive: Database', body: 'The Database stores trip history and user data.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'SQL Database' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect Matching Service → Database.' },
            celebration: { heading: 'Level 1 Complete!', body: 'You have the foundation!' },
          },
          validation: [allOf(nodeRule('sql_db', 'SQL Database'), edgeRule('matching_service', 'sql_db'))],
          hints: ['Search for "SQL Database"', 'Connect to it'],
        },
      ],
    },
    {
      id: 'level-2',
      title: 'Production Ready',
      steps: [
        {
          id: 'step-8',
          title: 'Add Load Balancer',
          phases: {
            context: { heading: 'Level 2: Step 1', body: 'Adding Load Balancer for scaling.' },
            intro: { heading: 'About Load Balancers', body: 'Load balancers distribute traffic.' },
            teaching: { heading: 'Deep dive: Load Balancer', body: 'The Load Balancer distributes traffic across services.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Load Balancer' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect API Gateway → Load Balancer.' },
            celebration: { heading: 'Level 2 Complete!', body: 'Production-ready Uber!' },
          },
          validation: [allOf(nodeRule('load_balancer', 'Load Balancer'), edgeRule('api_gateway', 'load_balancer'))],
          hints: ['Search for "Load Balancer"', 'Connect to it'],
        },
      ],
    },
    {
      id: 'level-3',
      title: 'Expert Architecture',
      steps: [
        {
          id: 'step-9',
          title: 'Add Surge Pricing Service',
          phases: {
            context: { heading: 'Level 3: Step 1', body: 'Adding Surge Pricing Service.' },
            intro: { heading: 'About Surge Pricing', body: 'Surge pricing adjusts prices based on demand.' },
            teaching: { heading: 'Deep dive: Surge Pricing', body: 'The Surge Pricing Service adjusts prices during high demand.' },
            action: { heading: 'Your turn!', body: "Press ⌘K and search for 'Surge Pricing' to add it." },
            connecting: { heading: 'Connect it up', body: 'Connect to Matching Service.' },
            celebration: { heading: 'Expert Complete!', body: "You've designed Uber at senior level!" },
          },
          validation: [nodeRule('surge_pricing', 'Surge Pricing')],
          hints: ['Search for "Surge Pricing"'],
        },
      ],
    },
  ],
};

export default uberTutorial;