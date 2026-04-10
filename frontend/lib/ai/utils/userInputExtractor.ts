export interface UserPreferences {
  technologies: string[];
  flows: FlowDescription[];
  groups: GroupDescription[];
  style?: 'simple' | 'detailed' | 'enterprise';
  structure?: 'layered' | 'modular' | 'hierarchical' | 'mesh';
  focus?: string[];
  constraints?: string[];
}

export interface FlowDescription {
  name: string;
  steps: string[];
  type: 'sync' | 'async' | 'event' | 'stream';
  critical: boolean;
}

export interface GroupDescription {
  name: string;
  members: string[];
  boundary: 'trust' | 'deployment' | 'functional' | 'network';
  color?: string;
}

const TECHNOLOGY_PATTERNS: Record<string, string[]> = {
  // Databases
  'postgresql': ['postgresql', 'postgres', 'psql', 'pg'],
  'mysql': ['mysql', 'mariadb'],
  'mongodb': ['mongodb', 'mongo'],
  'dynamodb': ['dynamodb', 'dynamo'],
  'redis': ['redis', 'elasticache', 'memcached'],
  'elasticsearch': ['elasticsearch', 'elastic', 'elk', 'opensearch'],
  'cassandra': ['cassandra', 'scylladb'],
  'neo4j': ['neo4j', 'graph database', 'neo4j'],

  // Message Queues
  'kafka': ['kafka', 'apache kafka', 'confluent'],
  'rabbitmq': ['rabbitmq', 'rabbit'],
  'sqs': ['sqs', 'simple queue', 'aws sqs'],
  'sns': ['sns', 'simple notification', 'aws sns'],
  'redis_pubsub': ['redis pub/sub', 'redis pubsub'],

  // Cloud Services
  'aws': ['aws', 'amazon web services', 'ec2', 'lambda', 's3', 'cloudfront', 'route53', 'api gateway', 'ecs', 'eks', 'fargate', 'rds', 'dynamodb', 'sqs', 'sns', 'elb', 'alb', 'nlb', 'cloudwatch', 'cloudtrail'],
  'azure': ['azure', 'microsoft azure', 'azure functions', 'azure storage', 'azure sql', 'cosmos db', 'service bus'],
  'gcp': ['gcp', 'google cloud', 'cloud functions', 'bigquery', 'cloud storage', 'cloud pub/sub', 'firestore'],
  
  // API Gateway / Load Balancers
  'nginx': ['nginx', 'nginx plus'],
  'kong': ['kong', 'kong gateway'],
  'apigee': ['apigee', 'google apigee'],
  'traefik': ['traefik'],
  'haproxy': ['haproxy'],

  // Authentication
  'auth0': ['auth0'],
  'cognito': ['cognito', 'aws cognito'],
  'okta': ['okta'],
  'firebase_auth': ['firebase auth', 'firebase authentication'],
  'jwt': ['jwt', 'json web token', 'jws', 'jwe'],
  'oauth': ['oauth', 'oauth2', 'openid'],

  // Monitoring / Observability
  'datadog': ['datadog', 'dd-agent'],
  'prometheus': ['prometheus'],
  'grafana': ['grafana'],
  'cloudwatch': ['cloudwatch', 'aws cloudwatch'],
  'newrelic': ['new relic', 'newrelic', 'apm'],
  'sentry': ['sentry', 'error tracking'],
  'elk': ['elk stack', 'elasticsearch', 'logstash', 'kibana', 'logstash'],
  'jaeger': ['jaeger', 'distributed tracing', 'opentelemetry'],
  'zipkin': ['zipkin'],

  // CI/CD
  'jenkins': ['jenkins'],
  'github_actions': ['github actions', 'github workflows', 'gh actions'],
  'gitlab_ci': ['gitlab ci', 'gitlab pipeline'],
  'circleci': ['circleci', 'circle ci'],
  'argocd': ['argo cd', 'argocd', 'gitops'],
  'kubernetes': ['kubernetes', 'k8s', 'kubectl', 'helm'],
  'docker': ['docker', 'container', 'containerization', 'dockerfile'],
  
  // Security
  'waf': ['waf', 'web application firewall', 'aws waf', 'cloudflare waf'],
  'vpc': ['vpc', 'virtual private cloud', 'subnet'],
  'iam': ['iam', 'identity and access', 'policies', 'roles'],
  'vpn': ['vpn', 'virtual private network'],
  'tls': ['tls', 'ssl', 'https', 'certificate'],
  'encryption': ['encryption', 'kms', 'key management'],

  // Search
  'algolia': ['algolia'],
  'meilisearch': ['meilisearch', 'meili'],

  // Storage
  's3': ['s3', 'simple storage', 'object storage', 'blob storage'],
  'gcs': ['gcs', 'google cloud storage'],
  'azure_blob': ['azure blob', 'azure storage'],

  // CDN
  'cloudflare': ['cloudflare', 'cf'],
  'fastly': ['fastly'],
  'akamai': ['akamai'],
  
  // Payment
  'stripe': ['stripe', 'stripe payments'],
  'paypal': ['paypal'],
  'braintree': ['braintree', 'venmo'],
  'square': ['square payments'],

  // Specific Services
  'graphql': ['graphql', 'apollo', 'graphql api'],
  'grpc': ['grpc', 'grpc api'],
  'rest': ['rest api', 'restful', 'rest api'],
  'websocket': ['websocket', 'web socket', 'ws', 'socket.io', 'signalr'],
  'sse': ['sse', 'server sent events', 'server-sent events'],
  
  // Frameworks
  'express': ['express', 'express.js', 'node.js', 'nodejs', 'nestjs'],
  'django': ['django', 'flask', 'python web', 'fastapi'],
  'spring': ['spring', 'spring boot', 'java'],
  'rails': ['rails', 'ruby on rails'],
  'nextjs': ['nextjs', 'next.js', 'react server'],
  'nuxt': ['nuxt', 'nuxt.js', 'vue'],

  // ML/AI
  'tensorflow': ['tensorflow', 'tf'],
  'pytorch': ['pytorch', 'torch'],
  'sagemaker': ['sagemaker', 'aws ml'],
  'mlflow': ['mlflow', 'ml flow'],
  'kubeflow': ['kubeflow', 'kfp'],
};

const FLOW_MARKERS = [
  'then',
  'after that',
  'next',
  'finally',
  'before',
  'flows to',
  'goes to',
  'calls',
  'connects to',
  'proceeds to',
  'followed by',
  '→',
  '->',
  '=>',
  '/',
  '|',
];

const GROUP_MARKERS = [
  'group',
  'cluster',
  'zone',
  'environment',
  'network',
  'vpc',
  'namespace',
  'module',
  'layer',
  'tier',
  'boundary',
];

export function extractUserPreferences(description: string): UserPreferences {
  const lowerDesc = description.toLowerCase();
  
  return {
    technologies: extractTechnologies(description),
    flows: extractFlows(description),
    groups: extractGroups(description),
    style: inferStyle(description),
    structure: inferStructure(description),
    focus: extractFocusAreas(description),
    constraints: extractConstraints(description),
  };
}

function extractTechnologies(description: string): string[] {
  const technologies: string[] = [];
  const lowerDesc = description.toLowerCase();
  
  for (const [techName, patterns] of Object.entries(TECHNOLOGY_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerDesc.includes(pattern)) {
        technologies.push(techName);
        break;
      }
    }
  }
  
  return [...new Set(technologies)];
}

function extractFlows(description: string): FlowDescription[] {
  const flows: FlowDescription[] = [];
  const sentences = description.split(/[.!?\n]+/).filter(s => s.trim().length > 10);
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    
    let flowSteps: string[] = [];
    let currentStep = '';
    
    const words = sentence.split(/\s+/);
    let inFlow = false;
    
    for (const word of words) {
      const lowerWord = word.toLowerCase();
      
      if (FLOW_MARKERS.some(m => lowerWord.includes(m))) {
        if (currentStep.trim()) {
          flowSteps.push(currentStep.trim());
        }
        currentStep = '';
        inFlow = true;
      } else if (inFlow && ['to', 'from', 'via', 'through'].some(m => lowerWord === m)) {
        // Skip prepositions in flow
      } else if (inFlow) {
        currentStep += ' ' + word;
      }
      
      if (['→', '->', '=>'].some(m => word.includes(m))) {
        const parts = word.split(/[→\-=>]+/);
        if (parts[0]) {
          flowSteps.push(parts[0].trim());
        }
        if (parts[1]) {
          flowSteps.push(parts[1].trim());
        }
      }
    }
    
    if (currentStep.trim()) {
      flowSteps.push(currentStep.trim());
    }
    
    if (flowSteps.length >= 2) {
      flows.push({
        name: sentence.slice(0, 50) + (sentence.length > 50 ? '...' : ''),
        steps: flowSteps.map(s => s.replace(/[^\w\s-]/g, '').trim()).filter(s => s.length > 2),
        type: inferFlowType(lowerSentence),
        critical: lowerSentence.includes('critical') || 
                  lowerSentence.includes('main') || 
                  lowerSentence.includes('primary') ||
                  lowerSentence.includes('core'),
      });
    }
  }
  
  return flows;
}

function inferFlowType(sentence: string): 'sync' | 'async' | 'event' | 'stream' {
  if (sentence.includes('async') || sentence.includes('background') || sentence.includes('queue')) {
    return 'async';
  }
  if (sentence.includes('event') || sentence.includes('publish') || sentence.includes('subscribe')) {
    return 'event';
  }
  if (sentence.includes('stream') || sentence.includes('realtime') || sentence.includes('websocket') || sentence.includes('live')) {
    return 'stream';
  }
  return 'sync';
}

function extractGroups(description: string): GroupDescription[] {
  const groups: GroupDescription[] = [];
  const lowerDesc = description.toLowerCase();
  
  const groupPatterns = [
    /([\w\s]+?)\s+(?:in|inside|within|belonging to)\s+([\w\s]+?)(?:\s|$|,|\.)/gi,
    /(?:group|cluster|zone|env|environment)\s+(?:of\s+)?([\w\s]+?)(?:\s|$|,|\.)/gi,
    /([\w\s]+?)\s+(?:group|cluster|vpc|namespace|zone)\s+(?:with\s+)?([\w\s,]+?)(?:\s|$|\.)/gi,
  ];
  
  for (const pattern of groupPatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const groupName = match[1].trim() || match[2].trim();
      const members = match[2] ? match[2].split(/[,\s]+/).filter(s => s.length > 2) : [];
      
      if (groupName.length > 2 && members.length > 0) {
        groups.push({
          name: groupName,
          members,
          boundary: inferBoundaryType(lowerDesc),
        });
      }
    }
  }
  
  return groups;
}

function inferBoundaryType(description: string): 'trust' | 'deployment' | 'functional' | 'network' {
  if (description.includes('vpc') || description.includes('network') || description.includes('subnet')) {
    return 'network';
  }
  if (description.includes('env') || description.includes('environment') || description.includes('prod') || description.includes('staging')) {
    return 'deployment';
  }
  if (description.includes('trust') || description.includes('security') || description.includes('boundary')) {
    return 'trust';
  }
  return 'functional';
}

function inferStyle(description: string): 'simple' | 'detailed' | 'enterprise' {
  const lowerDesc = description.toLowerCase();
  const wordCount = description.split(/\s+/).length;
  
  const enterpriseKeywords = ['enterprise', 'corporate', 'fortune 500', 'saas', 'multi-tenant', 'compliance', 'hipaa', 'gdpr', 'soc2'];
  const detailedKeywords = ['microservices', 'distributed', 'event-driven', 'cqrs', 'domain-driven', 'hexagonal', 'clean architecture'];
  
  const enterpriseCount = enterpriseKeywords.filter(k => lowerDesc.includes(k)).length;
  const detailedCount = detailedKeywords.filter(k => lowerDesc.includes(k)).length;
  
  if (enterpriseCount >= 2 || (wordCount > 100 && detailedCount >= 2)) {
    return 'enterprise';
  }
  if (detailedCount >= 1 || wordCount > 50) {
    return 'detailed';
  }
  return 'simple';
}

function inferStructure(description: string): 'layered' | 'modular' | 'hierarchical' | 'mesh' {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('layered') || lowerDesc.includes('tier') || lowerDesc.includes('n-tier')) {
    return 'layered';
  }
  if (lowerDesc.includes('modular') || lowerDesc.includes('module') || lowerDesc.includes('bounded context')) {
    return 'modular';
  }
  if (lowerDesc.includes('hierarchical') || lowerDesc.includes('tree') || lowerDesc.includes('parent-child')) {
    return 'hierarchical';
  }
  if (lowerDesc.includes('mesh') || lowerDesc.includes('service mesh') || lowerDesc.includes('peer-to-peer') || lowerDesc.includes('p2p')) {
    return 'mesh';
  }
  
  return 'layered'; // Default
}

function extractFocusAreas(description: string): string[] {
  const lowerDesc = description.toLowerCase();
  const focusAreas: string[] = [];
  
  const focusPatterns = [
    { pattern: /focus\s+(?:on|upon)\s+([\w\s,]+?)(?:\s|$|\.|,)/gi, name: 'focus' },
    { pattern: /important(?:\s+that)?\s+([\w\s]+?)(?:\s|$|\.|,)/gi, name: 'important' },
    { pattern: /key(?:\s+is)?\s+([\w\s]+?)(?:\s|$|\.|,)/gi, name: 'key' },
    { pattern: /critical(?:\s+that)?\s+([\w\s]+?)(?:\s|$|\.|,)/gi, name: 'critical' },
    { pattern: /main(?:\s+concern)?\s+([\w\s]+?)(?:\s|$|\.|,)/gi, name: 'main' },
    { pattern: /centrally(?:\s+concerned)?\s+([\w\s]+?)(?:\s|$|\.|,)/gi, name: 'central' },
  ];
  
  for (const { pattern, name } of focusPatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      focusAreas.push(match[1].trim());
    }
  }
  
  return [...new Set(focusAreas)];
}

function extractConstraints(description: string): string[] {
  const constraints: string[] = [];
  const lowerDesc = description.toLowerCase();
  
  const constraintPatterns = [
    { pattern: /must\s+(\w+(?:\s+\w+){0,3})/gi, extract: (m: RegExpExecArray) => m[1] },
    { pattern: /should\s+(\w+(?:\s+\w+){0,3})/gi, extract: (m: RegExpExecArray) => m[1] },
    { pattern: /cannot\s+(\w+(?:\s+\w+){0,3})/gi, extract: (m: RegExpExecArray) => 'not ' + m[1] },
    { pattern: /must not\s+(\w+(?:\s+\w+){0,3})/gi, extract: (m: RegExpExecArray) => 'not ' + m[1] },
    { pattern: /has to\s+(\w+(?:\s+\w+){0,3})/gi, extract: (m: RegExpExecArray) => m[1] },
    { pattern: /need(?:s)?\s+to\s+(\w+(?:\s+\w+){0,3})/gi, extract: (m: RegExpExecArray) => 'need ' + m[1] },
  ];
  
  for (const { pattern, extract } of constraintPatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const constraint = extract(match);
      if (constraint.length > 3) {
        constraints.push(constraint);
      }
    }
  }
  
  return [...new Set(constraints)];
}

export function formatUserPreferencesForPrompt(preferences: UserPreferences): string {
  let prompt = '';
  
  if (preferences.technologies.length > 0) {
    prompt += `\n═══════════════════════════════════════════════════════════════════════════\n`;
    prompt += `USER-SPECIFIED TECHNOLOGIES (MUST USE THESE EXACTLY):\n`;
    prompt += `───────────────────────────────────────────────────────────────────────────\n`;
    prompt += `The user explicitly mentioned these technologies. Include them as nodes:\n`;
    for (const tech of preferences.technologies) {
      prompt += `  - ${tech}\n`;
    }
    prompt += `Do NOT substitute or abstract these. They are explicitly requested.\n`;
  }
  
  if (preferences.flows.length > 0) {
    prompt += `\n═══════════════════════════════════════════════════════════════════════════\n`;
    prompt += `USER-SPECIFIED FLOWS (MUST PRESERVE):\n`;
    prompt += `───────────────────────────────────────────────────────────────────────────\n`;
    prompt += `The user described these specific flows. Generate edges that match:\n`;
    for (const flow of preferences.flows) {
      const stepsStr = flow.steps.join(' → ');
      const critical = flow.critical ? ' [CRITICAL - must be prominent]' : '';
      const type = `[${flow.type}]`;
      prompt += `  ${type} ${stepsStr}${critical}\n`;
    }
  }
  
  if (preferences.groups.length > 0) {
    prompt += `\n═══════════════════════════════════════════════════════════════════════════\n`;
    prompt += `USER-SPECIFIED GROUPS (MUST CREATE):\n`;
    prompt += `───────────────────────────────────────────────────────────────────────────\n`;
    prompt += `The user specified these groupings. Create container groups:\n`;
    for (const group of preferences.groups) {
      prompt += `  Group: "${group.name}"\n`;
      prompt += `    Members: ${group.members.join(', ')}\n`;
      prompt += `    Boundary type: ${group.boundary}\n`;
    }
  }
  
  if (preferences.style) {
    prompt += `\n═══════════════════════════════════════════════════════════════════════════\n`;
    prompt += `USER-SPECIFIED DIAGRAM STYLE:\n`;
    prompt += `───────────────────────────────────────────────────────────────────────────\n`;
    prompt += `Style: ${preferences.style.toUpperCase()}\n`;
    if (preferences.style === 'enterprise') {
      prompt += `Generate more comprehensive diagrams with full infrastructure, monitoring, and security layers.\n`;
    } else if (preferences.style === 'detailed') {
      prompt += `Include all major components with proper grouping and clear flows.\n`;
    } else {
      prompt += `Keep it concise but complete - essential components only.\n`;
    }
  }
  
  if (preferences.focus && preferences.focus.length > 0) {
    prompt += `\n═══════════════════════════════════════════════════════════════════════════\n`;
    prompt += `USER-SPECIFIED FOCUS AREAS (EMPHASIZE THESE):\n`;
    prompt += `───────────────────────────────────────────────────────────────────────────\n`;
    for (const focus of preferences.focus) {
      prompt += `  - ${focus}\n`;
    }
  }
  
  if (preferences.constraints && preferences.constraints.length > 0) {
    prompt += `\n═══════════════════════════════════════════════════════════════════════════\n`;
    prompt += `USER-SPECIFIED CONSTRAINTS (MUST RESPECT):\n`;
    prompt += `───────────────────────────────────────────────────────────────────────────\n`;
    for (const constraint of preferences.constraints) {
      prompt += `  - ${constraint}\n`;
    }
  }
  
  return prompt;
}
