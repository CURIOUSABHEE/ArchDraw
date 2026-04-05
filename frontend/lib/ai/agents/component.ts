import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, ArchitectureNode } from '../types';
import { COMPONENT_AGENT_PROMPT } from '../constants';
import { validateComponentOutput } from '../utils/outputValidator';
import { getSystemRequirements } from '../utils/systemRequirements';
import logger from '@/lib/logger';

const MAX_COMPONENT_RETRIES = 3;

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

export async function runComponentAgent(state: SharedState): Promise<ArchitectureNode[]> {
  const userIntent = state.userIntent;
  const systemType = userIntent.systemType ?? 'Microservices Architecture';
  const requirements = getSystemRequirements(systemType);

  const systemPromptSection = `

════════════════════════════════════════════════════════════════════════════
SYSTEM TYPE: ${systemType}
════════════════════════════════════════════════════════════════════════════

${requirements.description}

REQUIRED CONTAINERS (MUST CREATE):
${requirements.requiredGroups.map(g => `- ${g}`).join('\n')}

TARGET: Generate 10-20 DETAILED components specific to ${systemType}.
A rich architecture diagram needs variety across layers:
- Client/edge layer (CDN, load balancers, client apps)
- Gateway/API layer 
- Service layer (multiple business logic services)
- Data layer (databases, caches, object storage)
- Messaging/queue layer
- Analytics/observability layer

MUST-INCLUDE COMPONENTS (at least 12 of these, be specific):
${requirements.requiredLeafNodes.map(n => `- ${n}`).join('\n')}

OPTIONAL COMPONENTS (add for depth):
${requirements.optionalNodes.map(n => `- ${n}`).join('\n')}

CRITICAL REQUIREMENTS:
- Include MULTIPLE services in each layer (not just one)
- Include infrastructure: CDN, Load Balancer, Redis, Kafka/RabbitMQ
- Include data layer: databases, caches, object storage
- Include observability: logging, metrics, tracing
- For streaming: CDN → Transcoding → Object Storage → DRM → Recommendation
- For e-commerce: Catalog → Cart → Checkout → Payment → Order → Inventory
- For ride-sharing: Matching → Tracking → Pricing → Driver → Payment

DO NOT generate a flat chain with only 3-4 nodes.
`;

  const prompt = `${COMPONENT_AGENT_PROMPT}

${systemPromptSection}

User's System Description:
${userIntent.description}

System Type: ${systemType}
Complexity: ${userIntent.complexity}

Output the complete components/nodes array as JSON only.`;

  let lastError = '';

  for (let attempt = 1; attempt <= MAX_COMPONENT_RETRIES; attempt++) {
    try {
      const result = await apiKeyManager.executeWithRetry(async (groq) => {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a JSON-only output system. Always respond with valid JSON object with a "nodes" array. Do NOT wrap in markdown code blocks. Output ONLY raw JSON.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        });

        const content = completion.choices[0]?.message?.content ?? '';
        return content;
      });

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
          layer: node.layer ?? 'service',
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
        
        if (isGroupNode) {
          node.type = 'group';
        }
        
        return {
          id: node.id ?? `component-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: isGroupNode ? 'group' : 'architectureNode',
          label: node.label ?? 'Unknown',
          layer: node.layer ?? 'service',
          layerIndex: node.layerIndex,
          width: node.width ?? 160,
          height: node.height ?? 80,
          icon: node.icon ?? 'box',
          metadata: node.metadata ?? {},
          isGroup: node.isGroup,
          parentId: node.parentId,
          groupLabel: node.groupLabel,
          groupColor: node.groupColor,
          serviceType: node.serviceType,
        };
      });

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
  return generateDefaultComponents(userIntent);
}

function generateDefaultComponents(userIntent: SharedState['userIntent']): ArchitectureNode[] {
  const components: ArchitectureNode[] = [];

  const systemLower = userIntent.description.toLowerCase();
  const isUberLike = systemLower.includes('uber') || systemLower.includes('ride') || systemLower.includes('taxi') || systemLower.includes('hailing');
  const hasRealTime = systemLower.includes('realtime') || systemLower.includes('websocket') || systemLower.includes('socket.io') || systemLower.includes('stream');
  const hasAuth = systemLower.includes('auth') || systemLower.includes('jwt') || systemLower.includes('login') || systemLower.includes('user');
  const hasPayment = systemLower.includes('payment') || systemLower.includes('transaction') || systemLower.includes('pricing');
  const hasChat = systemLower.includes('chat') || systemLower.includes('message');
  const hasMonitoring = systemLower.includes('monitor') || systemLower.includes('devops') || systemLower.includes('logging') || systemLower.includes('metrics');

  // Client App
  components.push({
    id: 'client_app',
    type: 'architectureNode',
    label: 'Client App',
    layer: 'client',
    width: 200,
    height: 80,
    icon: 'monitor',
    metadata: {},
  });

  // Auth Service
  if (hasAuth) {
    components.push({
      id: 'auth_service',
      type: 'architectureNode',
      label: 'Authentication Service',
      layer: 'service',
      width: 200,
      height: 80,
      icon: 'lock',
      metadata: {},
    });
  }

  // Real-time Communication Service
  if (hasRealTime || isUberLike) {
    components.push({
      id: 'realtime_service',
      type: 'architectureNode',
      label: 'Real-time Communication Service',
      layer: 'service',
      width: 200,
      height: 80,
      icon: 'radio',
      metadata: {},
    });
  }

  // Ride Request and Matching Logic
  if (isUberLike) {
    components.push({
      id: 'ride_matching_service',
      type: 'architectureNode',
      label: 'Ride Request and Matching Logic',
      layer: 'service',
      width: 200,
      height: 80,
      icon: 'filter',
      metadata: {},
    });
  }

  // Live Trip Status Updates
  if (isUberLike) {
    components.push({
      id: 'trip_status_service',
      type: 'architectureNode',
      label: 'Live Trip Status Updates',
      layer: 'service',
      width: 200,
      height: 80,
      icon: 'activity',
      metadata: {},
    });
  }

  // Dynamic Pricing Engine
  if (hasPayment || isUberLike) {
    components.push({
      id: 'pricing_service',
      type: 'architectureNode',
      label: 'Dynamic Pricing Engine',
      layer: 'service',
      width: 200,
      height: 80,
      icon: 'zap',
      metadata: {},
    });
  }

  // In-app Chat Service
  if (hasChat || isUberLike) {
    components.push({
      id: 'chat_service',
      type: 'architectureNode',
      label: 'In-app Chat Service',
      layer: 'service',
      width: 200,
      height: 80,
      icon: 'send',
      metadata: {},
    });
  }

  // Payment Gateway (External)
  if (hasPayment || isUberLike) {
    components.push({
      id: 'payment_gateway',
      type: 'architectureNode',
      label: 'Payment Gateway',
      layer: 'external',
      width: 200,
      height: 80,
      icon: 'credit-card',
      metadata: {},
    });
  }

  // DevOps Monitoring
  if (hasMonitoring || isUberLike) {
    components.push({
      id: 'devops_monitoring',
      type: 'architectureNode',
      label: 'DevOps Monitoring',
      layer: 'devops',
      width: 200,
      height: 80,
      icon: 'activity',
      metadata: {},
    });
  }

  // If no specific components detected, add generic ones
  if (components.length <= 2) {
    components.push({
      id: 'api_gateway',
      type: 'architectureNode',
      label: 'API Gateway',
      layer: 'gateway',
      width: 200,
      height: 80,
      icon: 'shield',
      metadata: {},
    });

    components.push({
      id: 'main_service',
      type: 'architectureNode',
      label: 'Main Service',
      layer: 'service',
      width: 200,
      height: 80,
      icon: 'server',
      metadata: {},
    });
  }

  return components;
}
