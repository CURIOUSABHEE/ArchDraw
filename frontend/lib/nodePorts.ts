export type PortCount = number | 'multiple';

export interface PortConfig {
  inputs: PortCount;
  outputs: PortCount;
  allowDynamic?: boolean;
  inputLabel?: string;
  outputLabel?: string;
  maxInputs?: number;
  maxOutputs?: number;
}

export interface PortDefinition {
  id: string;
  type: 'input' | 'output';
  position: 'left' | 'right' | 'top' | 'bottom';
  index: number;
  label?: string;
}

export const NODE_PORT_CONFIG: Record<string, PortConfig> = {
  // Client & Entry - Single output, no input
  'Client & Entry': {
    inputs: 0,
    outputs: 1,
    outputLabel: 'request',
    maxOutputs: 1,
  },
  'CDN & Edge': {
    inputs: 1,
    outputs: 1,
    inputLabel: 'origin',
    outputLabel: 'deliver',
  },
  'DNS & Network': {
    inputs: 1,
    outputs: 1,
  },
  
  // API Gateway - Fan-out to multiple services
  'API Gateway': {
    inputs: 1,
    outputs: 4,
    allowDynamic: true,
    inputLabel: 'incoming',
    outputLabel: 'routes',
    maxOutputs: 8,
  },
  'Load Balancer': {
    inputs: 1,
    outputs: 4,
    allowDynamic: true,
    inputLabel: 'traffic',
    outputLabel: 'instances',
    maxOutputs: 8,
  },

  // Compute - Multiple inputs and outputs for service communication
  'Compute': {
    inputs: 3,
    outputs: 3,
    allowDynamic: true,
    inputLabel: 'triggers',
    outputLabel: 'responses',
    maxInputs: 6,
    maxOutputs: 6,
  },
  'Serverless': {
    inputs: 1,
    outputs: 1,
  },

  // Data Storage - Multiple inputs from services, no outputs
  'Data Storage': {
    inputs: 4,
    outputs: 0,
    allowDynamic: true,
    inputLabel: 'writes',
    maxInputs: 8,
  },
  'Database': {
    inputs: 4,
    outputs: 0,
    allowDynamic: true,
    inputLabel: 'queries',
    maxInputs: 8,
  },

  // Caching - Bidirectional, single connection
  'Caching': {
    inputs: 1,
    outputs: 1,
    inputLabel: 'store',
    outputLabel: 'retrieve',
  },
  'Cache & Storage': {
    inputs: 1,
    outputs: 1,
  },

  // Messaging - Many-to-many connections
  'Messaging & Events': {
    inputs: 4,
    outputs: 4,
    allowDynamic: true,
    inputLabel: 'publishers',
    outputLabel: 'subscribers',
    maxInputs: 8,
    maxOutputs: 8,
  },

  // External Services - Single connection each way
  'External Services': {
    inputs: 1,
    outputs: 1,
    inputLabel: 'webhook',
    outputLabel: 'api',
  },

  // Auth & Security - Request-response pattern
  'Auth & Security': {
    inputs: 1,
    outputs: 1,
    inputLabel: 'verify',
    outputLabel: 'token',
  },
  'Authentication': {
    inputs: 1,
    outputs: 1,
  },

  // Observability - Passive monitoring, multiple inputs
  'Observability': {
    inputs: 4,
    outputs: 0,
    allowDynamic: true,
    inputLabel: 'metrics',
    maxInputs: 8,
  },

  // AI / ML - Pipeline: multiple inputs (data, prompt, model), single output
  'AI / ML': {
    inputs: 3,
    outputs: 1,
    allowDynamic: true,
    inputLabel: 'prompt',
    outputLabel: 'response',
    maxInputs: 4,
  },
  'AI & ML': {
    inputs: 3,
    outputs: 1,
    allowDynamic: true,
    maxInputs: 4,
  },

  // Worker - Consumes tasks, no direct output
  'Worker': {
    inputs: 1,
    outputs: 0,
    inputLabel: 'jobs',
  },
};

export const DEFAULT_PORT_CONFIG: PortConfig = {
  inputs: 1,
  outputs: 1,
};

export function getPortConfig(category: string): PortConfig {
  return NODE_PORT_CONFIG[category] || DEFAULT_PORT_CONFIG;
}

export function getInputCount(category: string): PortCount {
  return getPortConfig(category).inputs;
}

export function getOutputCount(category: string): PortCount {
  return getPortConfig(category).outputs;
}

export function canAddInputPort(category: string, currentInputs: number): boolean {
  const config = getPortConfig(category);
  if (config.allowDynamic && config.maxInputs) {
    return currentInputs < config.maxInputs;
  }
  if (config.allowDynamic) return true;
  return config.inputs === 'multiple';
}

export function canAddOutputPort(category: string, currentOutputs: number): boolean {
  const config = getPortConfig(category);
  if (config.allowDynamic && config.maxOutputs) {
    return currentOutputs < config.maxOutputs;
  }
  if (config.allowDynamic) return true;
  return config.outputs === 'multiple';
}

export function canAddInputPortSimple(category: string): boolean {
  const config = getPortConfig(category);
  return config.allowDynamic === true || config.inputs === 'multiple';
}

export function canAddOutputPortSimple(category: string): boolean {
  const config = getPortConfig(category);
  return config.allowDynamic === true || config.outputs === 'multiple';
}

export function getPortLabels(category: string): { inputLabel?: string; outputLabel?: string } {
  const config = getPortConfig(category);
  return {
    inputLabel: config.inputLabel,
    outputLabel: config.outputLabel,
  };
}

export function getMaxPorts(category: string): { maxInputs?: number; maxOutputs?: number } {
  const config = getPortConfig(category);
  return {
    maxInputs: config.maxInputs,
    maxOutputs: config.maxOutputs,
  };
}
