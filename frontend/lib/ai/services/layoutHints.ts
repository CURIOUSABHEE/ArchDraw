import type { ArchitectureNode, ArchitectureEdge, LayoutHints, PrimaryFlow, ComponentGroup, LayerType } from '../types';

const LAYER_ORDER: LayerType[] = ['client', 'edge', 'compute', 'async', 'data', 'observe', 'external', 'group'];

const GROUP_PATTERNS: Record<string, { keywords: string[]; color: string }> = {
  'RAG Pipeline': {
    keywords: ['rag', 'vector', 'embedding', 'pinecone', 'weaviate', 'chroma'],
    color: '#8b5cf6'
  },
  'Data Pipeline': {
    keywords: ['etl', 'pipeline', 'transform', 'processor', 'stream'],
    color: '#06b6d4'
  },
  'LLM Stack': {
    keywords: ['llm', 'openai', 'anthropic', 'gpt', 'claude', 'gemini'],
    color: '#f59e0b'
  },
  'Async Stack': {
    keywords: ['queue', 'kafka', 'rabbitmq', 'sqs', 'pubsub', 'worker'],
    color: '#ec4899'
  },
  'Data Store': {
    keywords: ['database', 'db', 'postgres', 'mysql', 'mongo', 'dynamodb'],
    color: '#10b981'
  },
  'Cache Stack': {
    keywords: ['cache', 'redis', 'memcached'],
    color: '#6366f1'
  },
  'Auth Stack': {
    keywords: ['auth', 'oauth', 'cognito', 'auth0', 'jwt', 'session'],
    color: '#14b8a6'
  },
  'CI/CD': {
    keywords: ['cicd', 'github', 'jenkins', 'deploy', 'pipeline'],
    color: '#64748b'
  },
  'Monitoring': {
    keywords: ['monitor', 'log', 'grafana', 'prometheus', 'datadog', 'sentry'],
    color: '#94a3b8'
  },
  'External APIs': {
    keywords: ['stripe', 'payment', 'twilio', 'sendgrid', 'external', 'third party'],
    color: '#f97316'
  }
};

function getNodeRole(node: ArchitectureNode): string {
  const label = node.label.toLowerCase();
  
  if (label.includes('client') || label.includes('browser') || label.includes('mobile') || label.includes('web')) {
    return 'client';
  }
  if (label.includes('gateway') || label.includes('load balancer') || label.includes('cdn') || label.includes('ingress')) {
    return 'gateway';
  }
  if (label.includes('websocket') || label.includes('socket') || label.includes('sse') || label.includes('stream')) {
    return 'response';
  }
  if (label.includes('queue') || label.includes('kafka') || label.includes('rabbitmq') || label.includes('sqs') || label.includes('pubsub') || label.includes('event bus')) {
    return 'async';
  }
  if (label.includes('worker') || label.includes('job')) {
    return 'worker';
  }
  if (label.includes('database') || label.includes('db') || label.includes('postgres') || label.includes('mysql') || label.includes('mongo') || label.includes('dynamodb')) {
    return 'data';
  }
  if (label.includes('cache') || label.includes('redis') || label.includes('memcached')) {
    return 'cache';
  }
  if (label.includes('llm') || label.includes('openai') || label.includes('anthropic') || label.includes('gpt')) {
    return 'llm';
  }
  if (label.includes('rag') || label.includes('vector') || label.includes('embedding')) {
    return 'rag';
  }
  if (label.includes('service') || label.includes('api') || label.includes('server') || label.includes('microservice')) {
    return 'processor';
  }
  if (label.includes('monitor') || label.includes('log') || label.includes('grafana') || label.includes('prometheus')) {
    return 'devops';
  }
  
  return 'processor';
}

function identifyFlowType(sourceRole: string, targetRole: string): 'request' | 'processing' | 'async' | 'response' | null {
  if ((sourceRole === 'client' || sourceRole === 'gateway') && (targetRole === 'gateway' || targetRole === 'processor')) {
    return 'request';
  }
  if (sourceRole === 'processor' && (targetRole === 'data' || targetRole === 'cache' || targetRole === 'rag' || targetRole === 'llm')) {
    return 'processing';
  }
  if (sourceRole === 'processor' && (targetRole === 'async' || targetRole === 'worker')) {
    return 'async';
  }
  if (sourceRole === 'llm' && targetRole === 'response') {
    return 'response';
  }
  if (sourceRole === 'async' && targetRole === 'worker') {
    return 'async';
  }
  if (sourceRole === 'worker' && targetRole === 'processor') {
    return 'async';
  }
  
  return null;
}

export function generateLayoutHints(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[]
): LayoutHints {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  const primaryFlow: PrimaryFlow[] = [];
  const processedEdges = new Set<string>();
  
  const requestEdges = edges.filter(e => {
    const sourceRole = getNodeRole(nodeMap.get(e.source) || { label: '' } as ArchitectureNode);
    const targetRole = getNodeRole(nodeMap.get(e.target) || { label: '' } as ArchitectureNode);
    return identifyFlowType(sourceRole, targetRole) === 'request';
  });
  
  const processingEdges = edges.filter(e => {
    const sourceRole = getNodeRole(nodeMap.get(e.source) || { label: '' } as ArchitectureNode);
    const targetRole = getNodeRole(nodeMap.get(e.target) || { label: '' } as ArchitectureNode);
    return identifyFlowType(sourceRole, targetRole) === 'processing';
  });
  
  const asyncEdges = edges.filter(e => {
    const sourceRole = getNodeRole(nodeMap.get(e.source) || { label: '' } as ArchitectureNode);
    const targetRole = getNodeRole(nodeMap.get(e.target) || { label: '' } as ArchitectureNode);
    return identifyFlowType(sourceRole, targetRole) === 'async';
  });
  
  const responseEdges = edges.filter(e => {
    const sourceRole = getNodeRole(nodeMap.get(e.source) || { label: '' } as ArchitectureNode);
    const targetRole = getNodeRole(nodeMap.get(e.target) || { label: '' } as ArchitectureNode);
    return identifyFlowType(sourceRole, targetRole) === 'response';
  });
  
  if (requestEdges.length > 0) {
    const requestFlowNodes: string[] = [];
    
    const clientNode = nodes.find(n => getNodeRole(n) === 'client');
    const gatewayNode = nodes.find(n => getNodeRole(n) === 'gateway');
    const firstService = nodes.find(n => getNodeRole(n) === 'processor');
    
    if (clientNode) requestFlowNodes.push(clientNode.id);
    if (gatewayNode) requestFlowNodes.push(gatewayNode.id);
    if (firstService) requestFlowNodes.push(firstService.id);
    
    if (requestFlowNodes.length >= 2) {
      primaryFlow.push({
        id: 'primary-request',
        nodeIds: requestFlowNodes,
        flowType: 'request'
      });
    }
  }
  
  if (processingEdges.length > 0) {
    const processingNodes = new Set<string>();
    for (const edge of processingEdges) {
      processingNodes.add(edge.source);
      processingNodes.add(edge.target);
    }
    
    primaryFlow.push({
      id: 'processing',
      nodeIds: Array.from(processingNodes),
      flowType: 'processing'
    });
  }
  
  if (asyncEdges.length > 0) {
    const asyncNodes = new Set<string>();
    for (const edge of asyncEdges) {
      asyncNodes.add(edge.source);
      asyncNodes.add(edge.target);
    }
    
    primaryFlow.push({
      id: 'async-processing',
      nodeIds: Array.from(asyncNodes),
      flowType: 'async'
    });
  }
  
  if (responseEdges.length > 0) {
    const responseNodes = new Set<string>();
    for (const edge of responseEdges) {
      responseNodes.add(edge.source);
      responseNodes.add(edge.target);
    }
    
    primaryFlow.push({
      id: 'response-flow',
      nodeIds: Array.from(responseNodes),
      flowType: 'response'
    });
  }
  
  const groups: ComponentGroup[] = [];
  const assignedNodes = new Set<string>();
  
  for (const [groupName, config] of Object.entries(GROUP_PATTERNS)) {
    const groupNodes = nodes.filter(n => {
      const label = n.label.toLowerCase();
      return config.keywords.some(keyword => label.includes(keyword));
    });
    
    if (groupNodes.length >= 1) {
      groups.push({
        id: `group-${groupName.toLowerCase().replace(/\s+/g, '-')}`,
        label: groupName,
        nodeIds: groupNodes.map(n => n.id),
        color: config.color
      });
      
      for (const node of groupNodes) {
        assignedNodes.add(node.id);
      }
    }
  }
  
  const serviceNodes = nodes.filter(n => {
    const role = getNodeRole(n);
    return role === 'processor' && !assignedNodes.has(n.id);
  });
  
  if (serviceNodes.length >= 2) {
    groups.push({
      id: 'group-services',
      label: 'Core Services',
      nodeIds: serviceNodes.map(n => n.id),
      color: '#6366f1'
    });
  }
  
  const externalNodes = nodes.filter(n => {
    const role = getNodeRole(nodeMap.get(n.id) || { label: '' } as ArchitectureNode);
    return n.label.toLowerCase().includes('external') || n.label.toLowerCase().includes('api') || role === 'llm';
  });
  
  if (externalNodes.length >= 1) {
    const unassignedExternal = externalNodes.filter(n => !assignedNodes.has(n.id));
    if (unassignedExternal.length >= 1) {
      groups.push({
        id: 'group-external',
        label: 'External Services',
        nodeIds: unassignedExternal.map(n => n.id),
        color: '#f97316'
      });
    }
  }
  
  const layerPositions: Record<LayerType, { x: number; y: number }> = {
    client: { x: 0, y: 200 },
    presentation: { x: 0, y: 200 },
    edge: { x: 200, y: 200 },
    gateway: { x: 200, y: 200 },
    compute: { x: 400, y: 200 },
    application: { x: 400, y: 200 },
    async: { x: 600, y: 200 },
    data: { x: 800, y: 200 },
    observe: { x: 600, y: 400 },
    observability: { x: 600, y: 400 },
    external: { x: 1000, y: 200 },
    group: { x: 100, y: 100 },
  };
  
  return {
    primaryFlow,
    groups,
    layers: layerPositions
  };
}
