import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, ArchitectureNode } from '../types';
import { COMPONENT_AGENT_PROMPT } from '../constants';
import { validateComponentOutput } from '../utils/outputValidator';
import { extractUserPreferences, formatUserPreferencesForPrompt } from '../utils/userInputExtractor';
import logger from '@/lib/logger';

const MAX_COMPONENT_RETRIES = 3;

function getProviderForModel(modelId: string): 'groq' | 'openrouter' {
  return modelId.includes('/') ? 'openrouter' : 'groq';
}

const AWS_KEYWORDS = [
  'aws', 'amazon', 'lambda', 'ec2', 's3', 'rds', 'dynamodb', 'aurora',
  'cloudfront', 'api gateway', 'apigateway', 'alb', 'elb', 'load balancer',
  'ecs', 'eks', 'fargate', 'sns', 'sqs', 'kinesis', 'eventbridge',
  'elasticache', 'redis', 'cognito', 'iam', 'cloudwatch', 'xray',
  'cloudtrail', 'route53', 'waf', 'shield', 'secrets manager', 'ecr',
  'codepipeline', 'codebuild', 'step functions', 'sam', 'cloudformation',
  'serverless', 'lambda function', 'serverless architecture'
];

export function detectAWSInPrompt(description: string): boolean {
  const lower = description.toLowerCase();
  return AWS_KEYWORDS.some(keyword => lower.includes(keyword));
}

export function enrichNodes(nodes: ArchitectureNode[]): ArchitectureNode[] {
  const TIER_ORDER_LOCAL: Array<'client' | 'edge' | 'compute' | 'async' | 'data' | 'observe' | 'external'> = ['client', 'edge', 'compute', 'async', 'data', 'observe', 'external'];
  const TIER_COLORS_LOCAL: Record<string, string> = {
    client: '#a855f7',
    edge: '#8b5cf6',
    compute: '#14b8a6',
    async: '#f59e0b',
    data: '#3b82f6',
    observe: '#6b7280',
    external: '#64748b',
  };

  return nodes.map(node => {
    const enriched = { ...node };

    if (!enriched.tier && enriched.layer) {
      const tier = enriched.layer;
      if (TIER_ORDER_LOCAL.includes(tier as typeof TIER_ORDER_LOCAL[number])) {
        enriched.tier = tier as typeof TIER_ORDER_LOCAL[number];
      }
    }

    if (enriched.tier && !enriched.tierColor) {
      enriched.tierColor = TIER_COLORS_LOCAL[enriched.tier] || '#6366f1';
    }

    if (enriched.isGroup && !enriched.groupColor) {
      enriched.groupColor = enriched.tierColor || '#64748b';
    }

    if (!enriched.width) enriched.width = 180;
    if (!enriched.height) enriched.height = 70;

    return enriched;
  });
}

function isGhostNode(
  node: ArchitectureNode,
  userPrompt: string
): boolean {
  if (node.isGroup) return false;
  if (node.parentId) return false;
  
  const labelWords = node.label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const promptWords = userPrompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const overlap = labelWords.filter(w => promptWords.includes(w)).length;
  const overlapRatio = labelWords.length > 0 
    ? overlap / labelWords.length 
    : 0;
  
  if (overlapRatio >= 0.6) {
    logger.warn(
      `[ComponentAgent] Ghost node filtered: "${node.label}" ` +
      `(${Math.round(overlapRatio * 100)}% word overlap with prompt)`
    );
    return true;
  }
  
  return false;
}

function normalizeTechField(tech: string | undefined, serviceType: string | undefined): string {
  if (!tech) {
    if (serviceType === 'database') return 'database';
    if (serviceType === 'queue' || serviceType === 'async') return 'queue';
    if (serviceType === 'cache') return 'cache';
    if (serviceType === 'auth') return 'auth';
    if (serviceType === 'loadbalancer') return 'loadbalancer';
    if (serviceType === 'monitor' || serviceType === 'monitoring') return 'monitoring';
    return 'service';
  }
  
  const normalized = tech.toLowerCase().trim().replace(/[\s-]+/g, '');
  
  const techMap: Record<string, string> = {
    'postgresql': 'postgres',
    'postgressql': 'postgres',
    'mysql': 'mysql',
    'mongodb': 'mongodb',
    'mongo': 'mongodb',
    'redis': 'redis',
    'elasticsearch': 'elasticsearch',
    'elastic': 'elasticsearch',
    'dynamodb': 'dynamodb',
    'kafka': 'kafka',
    'rabbitmq': 'rabbitmq',
    'rabbit': 'rabbitmq',
    'sqs': 'sqs',
    'sns': 'sns',
    'nats': 'nats',
    'react': 'react',
    'nextjs': 'nextjs',
    'next': 'nextjs',
    'vuejs': 'vue',
    'vue': 'vue',
    'angular': 'angular',
    'nodejs': 'nodejs',
    'node': 'nodejs',
    'typescript': 'typescript',
    'ts': 'typescript',
    'javascript': 'javascript',
    'js': 'javascript',
    'python': 'python',
    'py': 'python',
    'golang': 'golang',
    'go': 'golang',
    'django': 'django',
    'fastapi': 'fastapi',
    'fast': 'fastapi',
    'spring': 'spring',
    'docker': 'docker',
    'kubernetes': 'kubernetes',
    'k8s': 'kubernetes',
    'aws': 'aws',
    'gcp': 'gcp',
    'azure': 'azure',
    'nginx': 'nginx',
    'grafana': 'grafana',
    'prometheus': 'prometheus',
    'datadog': 'datadog',
    'lambda': 'lambda',
    'awslambda': 'lambda',
    'database': 'database',
    'db': 'database',
    'rds': 'rds',
    'aurora': 'aurora',
    'queue': 'queue',
    'cache': 'cache',
    'worker': 'worker',
    'gateway': 'gateway',
    'api': 'service',
    'service': 'service',
    'function': 'service',
    'loadbalancer': 'loadbalancer',
    'lb': 'loadbalancer',
    'auth': 'auth',
    'oauth': 'auth',
    'jwt': 'auth',
    'firewall': 'firewall',
    'waf': 'firewall',
    'monitoring': 'monitoring',
    'monitor': 'monitoring',
    'external': 'external',
    'thirdparty': 'external',
    'saas': 'external',
  };
  
  return techMap[normalized] || 'service';
}

export async function runComponentAgent(state: SharedState, model?: string): Promise<ArchitectureNode[]> {
  const userIntent = state.userIntent;
  const selectedModel = model || 'llama-3.3-70b-versatile';
  const provider = getProviderForModel(selectedModel);
  const useAWS = detectAWSInPrompt(userIntent.description);
  
  const userPreferences = extractUserPreferences(userIntent.description);
  const userPrefPrompt = formatUserPreferencesForPrompt(userPreferences);

  if (useAWS) {
    logger.log('[ComponentAgent] AWS services detected in prompt');
  } else {
    logger.log('[ComponentAgent] No AWS detected - using generic components');
  }

  const prompt = `${COMPONENT_AGENT_PROMPT}

${userPrefPrompt}

═══════════════════════════════════════════════════════════════════════════
USER'S ORIGINAL DESCRIPTION (USE AS THE SOLE AUTHORITY):
═══════════════════════════════════════════════════════════════════════════
${userIntent.description}

Complexity Level: ${userIntent.complexity || 'medium'}

Generate components that EXACTLY match what the user described.
Every technology mentioned MUST appear as a node.
Every flow described MUST be represented.
Every grouping specified MUST be created.

Output the complete components/nodes array as JSON only.`;

  let lastError = '';

  for (let attempt = 1; attempt <= MAX_COMPONENT_RETRIES; attempt++) {
    try {
      const result = await apiKeyManager.executeWithRetry(async (groq) => {
        const completion = await groq.chat.completions.create({
          model: selectedModel,
          messages: [
            { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON object with a "nodes" array. Do NOT wrap in markdown code blocks. Output ONLY raw JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        });

        const content = completion.choices[0]?.message?.content ?? '';
        return content;
      }, { provider });

      const cleanedResult = result
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

      const parsed = JSON.parse(cleanedResult);
      let nodes: ArchitectureNode[] = parsed.nodes ?? [];
      
      // Filter out ghost nodes before any other processing
      const originalCount = nodes.length;
      nodes = nodes.filter((node: Partial<ArchitectureNode>) => {
        const nodeWithLabel: ArchitectureNode = {
          id: node.id ?? '',
          type: node.type ?? 'architectureNode',
          label: node.label ?? '',
          layer: node.layer ?? 'compute',
          width: node.width ?? 160,
          height: node.height ?? 80,
          icon: node.icon ?? 'box',
          metadata: node.metadata ?? {},
          isGroup: node.isGroup,
          parentId: node.parentId,
          serviceType: node.serviceType,
        };
        return !isGhostNode(nodeWithLabel, userIntent.description);
      });
      
      if (nodes.length < originalCount) {
        logger.log(`[ComponentAgent] Filtered ${originalCount - nodes.length} ghost nodes`);
      }
      
      nodes = nodes.filter((node: Partial<ArchitectureNode>) => {
        return node.id && node.label && (node.layerIndex !== undefined || node.layer !== undefined || node.serviceType !== undefined || node.isGroup === true);
      });

      nodes = nodes.map((node: Partial<ArchitectureNode>) => {
        const isGroupNode = node.isGroup === true;
        const technology = node.metadata?.technology as string | undefined;
        
        if (isGroupNode) {
          node.type = 'group';
        }
        
        const rawTech = (node as Partial<ArchitectureNode> & { tech?: string }).tech || technology;
        const tech = normalizeTechField(rawTech, node.serviceType);
        
        return {
          id: node.id ?? `component-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: isGroupNode ? 'group' : 'architectureNode',
          label: node.label ?? 'Unknown',
          layer: node.layer ?? 'compute',
          layerIndex: node.layerIndex,
          width: node.width ?? 180,
          height: node.height ?? 70,
          icon: node.icon ?? 'box',
          metadata: {
            ...node.metadata,
            technology,
          },
          isGroup: node.isGroup,
          parentId: node.parentId,
          groupLabel: node.groupLabel,
          groupColor: node.groupColor,
          serviceType: node.serviceType,
          tech,
        };
      });

      // Ensure minimum node count - always use generic components
      if (nodes.length < 12) {
        logger.warn(`[ComponentAgent] Only ${nodes.length} nodes generated, adding fallback services...`);
        const fallback = getFallbackGenericComponents();
        nodes = [...nodes, ...fallback.slice(0, 12 - nodes.length)];
      }

      const validation = validateComponentOutput(nodes);
      if (!validation.valid) {
        lastError = validation.failures.join('\n');
        logger.warn(`[ComponentAgent] Validation failed (attempt ${attempt}/${MAX_COMPONENT_RETRIES}):`, lastError);
        
        if (attempt < MAX_COMPONENT_RETRIES) {
          continue; // Retry with same prompt - validator gates will catch again
        }
      } else {
        return nodes;
      }
    } catch (error) {
      lastError = String(error);
      logger.error(`[ComponentAgent] Error (attempt ${attempt}/${MAX_COMPONENT_RETRIES}):`, error);
      
      if (attempt === MAX_COMPONENT_RETRIES) {
        break;
      }
    }
  }

  logger.error('[ComponentAgent] All retries failed, using defaults after validation failure:', lastError);
  return getFallbackGenericComponents();
}

function getFallbackGenericComponents(): ArchitectureNode[] {
  const components: ArchitectureNode[] = [];
  
  components.push({
    id: 'client-app',
    type: 'architectureNode',
    label: 'Client App',
    subtitle: 'web browser',
    layer: 'client',
    tier: 'client',
    tierColor: '#a855f7',
    width: 180,
    height: 70,
    icon: 'monitor',
    serviceType: 'client',
    metadata: { technology: 'generic-client' },
  });

  components.push({
    id: 'cdn',
    type: 'architectureNode',
    label: 'CDN',
    subtitle: 'content delivery',
    layer: 'edge',
    tier: 'edge',
    tierColor: '#8b5cf6',
    width: 160,
    height: 70,
    icon: 'globe',
    serviceType: 'cdn',
    metadata: { technology: 'generic-cdn' },
  });

  components.push({
    id: 'load-balancer',
    type: 'architectureNode',
    label: 'Load Balancer',
    subtitle: 'traffic routing',
    layer: 'edge',
    tier: 'edge',
    tierColor: '#8b5cf6',
    width: 180,
    height: 70,
    icon: 'scale',
    serviceType: 'loadbalancer',
    metadata: { technology: 'generic-lb' },
  });

  components.push({
    id: 'api-gateway',
    type: 'architectureNode',
    label: 'API Gateway',
    subtitle: 'REST API entry',
    layer: 'edge',
    tier: 'edge',
    tierColor: '#8b5cf6',
    width: 180,
    height: 70,
    icon: 'webhook',
    serviceType: 'gateway',
    metadata: { technology: 'generic-api-gateway' },
  });

  components.push({
    id: 'auth-service',
    type: 'architectureNode',
    label: 'Auth Service',
    subtitle: 'authentication',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 180,
    height: 70,
    icon: 'lock',
    serviceType: 'auth',
    metadata: { technology: 'generic-auth' },
  });

  components.push({
    id: 'user-service',
    type: 'architectureNode',
    label: 'User Service',
    subtitle: 'user management',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 180,
    height: 70,
    icon: 'users',
    serviceType: 'api',
    metadata: { technology: 'generic-service' },
  });

  components.push({
    id: 'order-service',
    type: 'architectureNode',
    label: 'Order Service',
    subtitle: 'order processing',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 180,
    height: 70,
    icon: 'package',
    serviceType: 'api',
    metadata: { technology: 'generic-service' },
  });

  components.push({
    id: 'notification-service',
    type: 'architectureNode',
    label: 'Notification Service',
    subtitle: 'alerts & emails',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 180,
    height: 70,
    icon: 'bell',
    serviceType: 'api',
    metadata: { technology: 'generic-service' },
  });

  components.push({
    id: 'message-queue',
    type: 'architectureNode',
    label: 'Message Queue',
    subtitle: 'async messaging',
    layer: 'async',
    tier: 'async',
    tierColor: '#f59e0b',
    width: 180,
    height: 70,
    icon: 'message-square',
    serviceType: 'queue',
    metadata: { technology: 'generic-queue' },
  });

  components.push({
    id: 'event-bus',
    type: 'architectureNode',
    label: 'Event Bus',
    subtitle: 'event streaming',
    layer: 'async',
    tier: 'async',
    tierColor: '#f59e0b',
    width: 180,
    height: 70,
    icon: 'radio',
    serviceType: 'queue',
    metadata: { technology: 'generic-event-bus' },
  });

  components.push({
    id: 'primary-db',
    type: 'architectureNode',
    label: 'Primary Database',
    subtitle: 'main data store',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 180,
    height: 70,
    icon: 'database',
    serviceType: 'database',
    metadata: { technology: 'generic-sql' },
  });

  components.push({
    id: 'cache',
    type: 'architectureNode',
    label: 'Cache',
    subtitle: 'Redis cache',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 160,
    height: 70,
    icon: 'gauge',
    serviceType: 'cache',
    metadata: { technology: 'generic-cache' },
  });

  components.push({
    id: 'object-storage',
    type: 'architectureNode',
    label: 'Object Storage',
    subtitle: 'file storage',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 180,
    height: 70,
    icon: 'hard-drive',
    serviceType: 'storage',
    metadata: { technology: 'generic-storage' },
  });

  components.push({
    id: 'monitoring',
    type: 'architectureNode',
    label: 'Monitoring',
    subtitle: 'logs & metrics',
    layer: 'observe',
    tier: 'observe',
    tierColor: '#6b7280',
    width: 180,
    height: 70,
    icon: 'activity',
    serviceType: 'monitor',
    metadata: { technology: 'generic-monitoring' },
  });

  return components;
}

function getFallbackAWSComponents(): ArchitectureNode[] {
  return getFallbackAWSComponentsWithContext({ description: '', systemType: 'Microservices', complexity: 'medium' });
}

function getFallbackAWSComponentsWithContext(userIntent: SharedState['userIntent']): ArchitectureNode[] {
  const components: ArchitectureNode[] = [];
  const systemLower = userIntent.description.toLowerCase();

  // Always add these foundational AWS components
  components.push({
    id: 'aws-vpc',
    type: 'group',
    isGroup: true,
    groupLabel: 'AWS VPC',
    groupColor: '#FF9900',
    layer: 'group',
    label: 'AWS VPC',
    width: 900,
    height: 600,
    icon: 'network',
    metadata: {},
  });

  components.push({
    id: 'client-app',
    type: 'architectureNode',
    label: 'Client App',
    subtitle: 'web browser',
    layer: 'client',
    tier: 'client',
    tierColor: '#a855f7',
    width: 180,
    height: 70,
    icon: 'monitor',
    serviceType: 'client',
    metadata: { technology: 'generic-client' },
  });

  components.push({
    id: 'aws-cloudfront',
    type: 'architectureNode',
    label: 'Amazon CloudFront',
    subtitle: 'global CDN',
    layer: 'edge',
    tier: 'edge',
    tierColor: '#8b5cf6',
    width: 200,
    height: 70,
    icon: 'radio',
    serviceType: 'cdn',
    metadata: { technology: 'aws-cloudfront' },
  });

  components.push({
    id: 'aws-api-gateway',
    type: 'architectureNode',
    label: 'Amazon API Gateway',
    subtitle: 'REST API entry',
    layer: 'edge',
    tier: 'edge',
    tierColor: '#8b5cf6',
    width: 200,
    height: 70,
    icon: 'webhook',
    serviceType: 'gateway',
    metadata: { technology: 'aws-api-gateway' },
  });

  components.push({
    id: 'aws-alb',
    type: 'architectureNode',
    label: 'Application Load Balancer',
    subtitle: 'traffic routing',
    layer: 'edge',
    tier: 'edge',
    tierColor: '#8b5cf6',
    width: 200,
    height: 70,
    icon: 'scale',
    serviceType: 'loadbalancer',
    metadata: { technology: 'aws-alb' },
  });

  components.push({
    id: 'aws-lambda',
    type: 'architectureNode',
    label: 'AWS Lambda',
    subtitle: 'API handler',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 200,
    height: 70,
    icon: 'zap',
    serviceType: 'compute',
    parentId: 'aws-vpc',
    metadata: { technology: 'aws-lambda' },
  });

  components.push({
    id: 'aws-ecs',
    type: 'architectureNode',
    label: 'Amazon ECS',
    subtitle: 'container runtime',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 200,
    height: 70,
    icon: 'box',
    serviceType: 'compute',
    parentId: 'aws-vpc',
    metadata: { technology: 'aws-ecs' },
  });

  components.push({
    id: 'aws-rds',
    type: 'architectureNode',
    label: 'Amazon RDS',
    subtitle: 'user data',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 200,
    height: 70,
    icon: 'database',
    serviceType: 'database',
    parentId: 'aws-vpc',
    metadata: { technology: 'aws-rds' },
  });

  components.push({
    id: 'aws-dynamodb',
    type: 'architectureNode',
    label: 'Amazon DynamoDB',
    subtitle: 'session data',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 200,
    height: 70,
    icon: 'layers',
    serviceType: 'database',
    parentId: 'aws-vpc',
    metadata: { technology: 'aws-dynamodb' },
  });

  components.push({
    id: 'aws-elasticache',
    type: 'architectureNode',
    label: 'Amazon ElastiCache',
    subtitle: 'Redis cache',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 200,
    height: 70,
    icon: 'gauge',
    serviceType: 'cache',
    parentId: 'aws-vpc',
    metadata: { technology: 'aws-elasticache' },
  });

  components.push({
    id: 'aws-sqs',
    type: 'architectureNode',
    label: 'Amazon SQS',
    subtitle: 'order events',
    layer: 'async',
    tier: 'async',
    tierColor: '#f59e0b',
    width: 200,
    height: 70,
    icon: 'message-square',
    serviceType: 'queue',
    metadata: { technology: 'aws-sqs' },
  });

  components.push({
    id: 'aws-sns',
    type: 'architectureNode',
    label: 'Amazon SNS',
    subtitle: 'notifications',
    layer: 'async',
    tier: 'async',
    tierColor: '#f59e0b',
    width: 200,
    height: 70,
    icon: 'bell',
    serviceType: 'queue',
    metadata: { technology: 'aws-sns' },
  });

  components.push({
    id: 'aws-s3',
    type: 'architectureNode',
    label: 'Amazon S3',
    subtitle: 'static assets',
    layer: 'data',
    tier: 'data',
    tierColor: '#3b82f6',
    width: 200,
    height: 70,
    icon: 'hard-drive',
    serviceType: 'storage',
    parentId: 'aws-vpc',
    metadata: { technology: 'aws-s3' },
  });

  components.push({
    id: 'aws-cognito',
    type: 'architectureNode',
    label: 'Amazon Cognito',
    subtitle: 'user auth',
    layer: 'compute',
    tier: 'compute',
    tierColor: '#14b8a6',
    width: 200,
    height: 70,
    icon: 'users',
    serviceType: 'auth',
    parentId: 'aws-vpc',
    metadata: { technology: 'aws-cognito' },
  });

  components.push({
    id: 'aws-cloudwatch',
    type: 'architectureNode',
    label: 'Amazon CloudWatch',
    subtitle: 'monitoring',
    layer: 'observe',
    tier: 'observe',
    tierColor: '#6b7280',
    width: 200,
    height: 70,
    icon: 'layout-dashboard',
    serviceType: 'monitor',
    metadata: { technology: 'aws-cloudwatch' },
  });

  // Add specific services based on keywords
  if (systemLower.includes('payment') || systemLower.includes('transaction')) {
    components.push({
      id: 'aws-eventbridge',
      type: 'architectureNode',
      label: 'Amazon EventBridge',
      subtitle: 'event bus',
      layer: 'async',
      tier: 'async',
      tierColor: '#f59e0b',
      width: 200,
      height: 70,
      icon: 'radio',
      serviceType: 'queue',
      metadata: { technology: 'aws-eventbridge' },
    });
  }

  if (systemLower.includes('kafka') || systemLower.includes('stream') || systemLower.includes('real-time')) {
    components.push({
      id: 'aws-kinesis',
      type: 'architectureNode',
      label: 'Amazon Kinesis',
      subtitle: 'data streaming',
      layer: 'async',
      tier: 'async',
      tierColor: '#f59e0b',
      width: 200,
      height: 70,
      icon: 'activity',
      serviceType: 'queue',
      metadata: { technology: 'aws-kinesis' },
    });
  }

  if (systemLower.includes('kubernetes') || systemLower.includes('k8s')) {
    components.push({
      id: 'aws-eks',
      type: 'architectureNode',
      label: 'Amazon EKS',
      subtitle: 'Kubernetes cluster',
      layer: 'compute',
      tier: 'compute',
      tierColor: '#14b8a6',
      width: 200,
      height: 70,
      icon: 'circle-dot',
      serviceType: 'compute',
      parentId: 'aws-vpc',
      metadata: { technology: 'aws-eks' },
    });
  }

  return components;
}
