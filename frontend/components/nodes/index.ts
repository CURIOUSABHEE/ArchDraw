export { BaseNode } from './BaseNode';
export { DatabaseNode } from './DatabaseNode';
export { CacheNode } from './CacheNode';
export { 
  NODE_SHAPES, 
  getNodeShape, 
  getShapeConfig,
  getNodeSize,
  getVisualWeight,
  DEFAULT_SHAPE_CONFIG, 
  type NodeShape,
  type NodeSize,
  type ShapeConfig 
} from '@/lib/nodeShapes';
export {
  COMPONENT_PORTS,
  STRICT_CONNECTION_RULES,
  getStrictPortConfig,
  validateStrictConnection,
  getAllComponentTypes,
  getComponentLabel,
  type StrictPortConfig,
} from '@/lib/componentPorts';
export { 
  NODE_PORT_CONFIG, 
  getPortConfig, 
  getInputCount, 
  getOutputCount, 
  canAddInputPort, 
  canAddOutputPort,
  type PortConfig, 
  type PortDefinition,
  type PortCount 
} from '@/lib/nodePorts';
export {
  validateConnection,
  getValidTargets,
  getInvalidTargets,
  CONNECTION_RULES,
  CATEGORY_GROUPS,
  type ConnectionRule,
  type CategoryConnectionRule,
} from '@/lib/edgeValidation';
