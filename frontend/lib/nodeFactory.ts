import { Node } from 'reactflow';
import { getStrictPortConfig, COMPONENT_PORTS, getComponentLabel } from './componentPorts';
import { getShapeConfig, SHAPE_CONFIGS, type ShapeConfig } from './nodeShapes';
import type { NodeData } from '@/store/diagramStore';
import logger from '@/lib/logger';

export interface NodeFactoryResult {
  node: Node<NodeData>;
}

export interface NodeFactoryOptions {
  componentId: string;
  label?: string;
  category?: string;
  color?: string;
  icon?: string;
  technology?: string;
  position?: { x: number; y: number };
  parentId?: string;
  description?: string;
}

const DEFAULT_WIDTH = 160;
const DEFAULT_HEIGHT = 80;

/**
 * Node Factory - Unified way to create nodes with correct metadata and configuration.
 */
export function createNode(
  options: NodeFactoryOptions,
  source: 'drag' | 'cmdk' | 'ai' | 'template' = 'cmdk'
): NodeFactoryResult {
  const { 
    componentId, label, category, color, icon, 
    technology, position, parentId 
  } = options;

  let componentType = componentId;
  let shapeConfig: ShapeConfig | undefined;

  try {
    getStrictPortConfig(componentId);
    shapeConfig = getShapeConfig(category || 'Compute');
  } catch {
    // If specific component not found, try finding by category or use generic
    const lowerId = componentId.toLowerCase();
    if (lowerId.includes('service')) componentType = 'service';
    else if (lowerId.includes('db') || lowerId.includes('database')) componentType = 'database';
    else if (lowerId.includes('cache')) componentType = 'cache';
    else if (lowerId.includes('queue')) componentType = 'queue';
    else componentType = 'service';

    logger.log(`[NODE FACTORY] Using generic component: ${componentType}`);
    
    try {
      getStrictPortConfig(componentType);
      shapeConfig = getShapeConfig(category || 'Compute');
    } catch {
      logger.log(`[NODE FACTORY] Using default config for: ${componentType}`);
    }
  }

  const id = `${componentId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  
  const node: Node<NodeData> = {
    id,
    type: 'systemNode',
    position: position || { x: 0, y: 0 },
    parentId,
    data: {
      label: label || getComponentLabel(componentId),
      category: category || 'Compute',
      color: color || '#3b82f6',
      icon: icon || 'box',
      technology: technology || 'unknown',
      description: options.description || '',
      componentType,
      shape: shapeConfig?.shape || 'rounded-square',
    },
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  };

  logger.log(`[NODE CREATED]`, {
    id: node.id,
    label: node.data.label,
    source
  });

  return { node };
}

/**
 * Validate that a node matches its intended category configuration.
 */
export function validateNodeConfig(node: Node<NodeData>): boolean {
  const { category, componentType } = node.data;
  if (!category || !componentType) return false;

  try {
    const ports = COMPONENT_PORTS[componentType];
    const shapeConfig = SHAPE_CONFIGS[category];
    
    if (shapeConfig && node.data.shape !== shapeConfig.shape) {
      logger.warn(`NODE SHAPE MISMATCH: Expected ${shapeConfig.shape}, got ${node.data.shape}`);
    }

    return !!ports;
  } catch {
    return false;
  }
}

/**
 * Resolve the layout metadata for a component.
 */
export function getComponentLayoutMetadata(componentId: string, category: string) {
  const ports = COMPONENT_PORTS[componentId] || COMPONENT_PORTS[category.toLowerCase()];
  const shape = SHAPE_CONFIGS[category];
  
  if (!ports) {
    throw new Error(`No configuration found for component: ${componentId}`);
  }
  
  return {
    inputs: ports.inputs,
    outputs: ports.outputs,
    shape: shape?.shape,
    label: ports.label,
  };
}
