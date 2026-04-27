import { Node } from 'reactflow';
import { getStrictPortConfig, COMPONENT_PORTS, getComponentLabel } from './componentPorts';
import { getShapeConfig, SHAPE_CONFIGS, type NodeShape, type ShapeConfig } from './nodeShapes';
import type { NodeData } from '@/store/diagramStore';

export type NodeCreationSource = 'sidebar' | 'cmdk' | 'template' | 'drag' | 'unknown';

export interface CreateNodeOptions {
  componentId: string;
  label: string;
  category: string;
  color?: string;
  icon?: string;
  technology?: string;
  position?: { x: number; y: number };
}

export interface CreatedNodeResult {
  node: Node<NodeData>;
  portConfig: ReturnType<typeof getStrictPortConfig>;
  shapeConfig: ShapeConfig;
  source: NodeCreationSource;
}

function sanitizeComponentId(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function getComponentType(componentId: string, category: string): string {
  const sanitized = sanitizeComponentId(componentId);
  
  if (COMPONENT_PORTS[sanitized]) {
    return sanitized;
  }
  
  const categorySanitized = sanitizeComponentId(category);
  if (COMPONENT_PORTS[categorySanitized]) {
    return categorySanitized;
  }
  
  throw new Error(`INVALID COMPONENT: No port config found for "${componentId}" (tried: ${sanitized}, ${categorySanitized})`);
}

export function createNode(options: CreateNodeOptions, source: NodeCreationSource = 'unknown'): CreatedNodeResult {
  const { componentId, label, category, color, icon, technology, position } = options;
  
  // Get component type - if invalid, just use a generic type
  let componentType: string;
  try {
    componentType = getComponentType(componentId, category);
  } catch (error) {
    // If component not found in COMPONENT_PORTS, create generically without strict ports
    componentType = componentId.toLowerCase().replace(/[^a-z0-9]/g, '_');
    console.log(`[NODE FACTORY] Using generic component: ${componentType}`);
  }
  
  // Get port config - if invalid, create permissive defaults
  let portConfig: ReturnType<typeof getStrictPortConfig>;
  try {
    portConfig = getStrictPortConfig(componentType);
  } catch (error) {
    // Use permissive port config for unknown components
    portConfig = {
      inputs: 1,
      outputs: 1,
      label: 'Generic',
    };
    console.log(`[NODE FACTORY] Using permissive ports for: ${componentType}`);
  }
  
  const shapeConfig = getShapeConfig(category);
  
  const id = `${componentId}-${Date.now()}`;
  const pos = position ?? { x: 400 + Math.random() * 200 - 100, y: 300 + Math.random() * 200 - 100 };
  
  const node: Node<NodeData> = {
    id,
    type: 'customNode',
    position: pos,
    data: {
      label,
      category,
      componentType,
      color,
      icon,
      technology,
      shape: shapeConfig.shape,
    },
  };
  
  console.log(`[NODE CREATED]`, {
    id,
    componentType,
    category,
    label,
    inputs: portConfig.inputs,
    outputs: portConfig.outputs,
    shape: shapeConfig.shape,
    source,
  });
  
  return {
    node,
    portConfig,
    shapeConfig,
    source,
  };
}

export function validateNode(node: Node<NodeData>): void {
  const { componentType, category } = node.data;
  
  if (!componentType) {
    throw new Error(`NODE VALIDATION FAILED: Missing componentType for node ${node.id}`);
  }
  
  const portConfig = getStrictPortConfig(componentType);
  const shapeConfig = getShapeConfig(category);
  
  if (node.data.shape !== shapeConfig.shape) {
    console.warn(`NODE SHAPE MISMATCH: Expected ${shapeConfig.shape}, got ${node.data.shape}`);
  }
}

export function getNodeDefaults(componentId: string, category: string) {
  const componentType = sanitizeComponentId(componentId);
  const categorySanitized = sanitizeComponentId(category);
  
  const ports = COMPONENT_PORTS[componentType] || COMPONENT_PORTS[categorySanitized];
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
