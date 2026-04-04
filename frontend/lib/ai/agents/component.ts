import { apiKeyManager } from '../utils/apiKeyManager';
import type { SharedState, ArchitectureNode } from '../types';
import { COMPONENT_AGENT_PROMPT } from '../constants';
import logger from '@/lib/logger';

export async function runComponentAgent(state: SharedState): Promise<ArchitectureNode[]> {
  const userIntent = state.userIntent;
  const prompt = `${COMPONENT_AGENT_PROMPT}

User's System Description:
${userIntent.description}

System Type: ${userIntent.systemType}
Complexity: ${userIntent.complexity}

Output the complete components/nodes array as JSON only.`;

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

    // Strip markdown code blocks if present
    const cleanedResult = result
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    const parsed = JSON.parse(cleanedResult);
    const nodes: ArchitectureNode[] = parsed.nodes ?? [];

    return nodes.map((node: Partial<ArchitectureNode>) => ({
      id: node.id ?? `component-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'architectureNode',
      label: node.label ?? 'Unknown',
      layer: node.layer ?? 'service',
      width: node.width ?? 160,
      height: node.height ?? 80,
      icon: node.icon ?? 'box',
      metadata: node.metadata ?? {},
    }));
  } catch (error) {
    logger.error('Component Agent error:', error);
    return generateDefaultComponents(userIntent);
  }
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
