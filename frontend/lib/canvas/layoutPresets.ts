export const LAYOUT_PRESETS = [
  {
    id: 'freeform',
    label: 'Free-form',
    description: 'Keep nodes where they are',
    icon: '✋',
    elkOptions: null,
    isFreeform: true,
  },
  {
    id: 'layered-lr',
    label: 'Left → Right',
    description: 'Classic architecture flow',
    icon: '→',
    elkOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.spacing.nodeNode': '150',
      'elk.spacing.edgeEdge': '60',
      'elk.spacing.edgeNode': '80',
      'elk.layered.spacing.nodeNodeBetweenLayers': '200',
      'elk.layered.spacing.edgeNodeBetweenLayers': '160',
      'elk.layered.unnecessaryBendpoints': 'true',
      'elk.layered.edgeRouting.selfLoopDistribution': 'EVEN',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=80,left=60,bottom=80,right=60]',
      'elk.layered.layering.strategy': 'LONGEST_PATH',
      'elk.layered.initialization.strategy': 'MULTI_LEVEL',
    }
  },
  {
    id: 'layered-tb',
    label: 'Top → Bottom',
    description: 'Vertical flow, good for pipelines',
    icon: '↓',
    elkOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.spacing.nodeNode': '120',
      'elk.spacing.edgeEdge': '50',
      'elk.spacing.edgeNode': '70',
      'elk.layered.spacing.nodeNodeBetweenLayers': '180',
      'elk.layered.spacing.edgeNodeBetweenLayers': '140',
      'elk.layered.unnecessaryBendpoints': 'true',
      'elk.layered.edgeRouting.selfLoopDistribution': 'EVEN',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=80,left=60,bottom=80,right=60]',
      'elk.layered.layering.strategy': 'LONGEST_PATH',
      'elk.layered.initialization.strategy': 'MULTI_LEVEL',
    }
  },
  {
    id: 'force',
    label: 'Force Directed',
    description: 'Organic clustering by relationships',
    icon: '✦',
    elkOptions: {
      'elk.algorithm': 'force',
      'elk.force.iterations': '300',
      'elk.spacing.nodeNode': '150',
      'elk.spacing.edgeEdge': '60',
      'elk.spacing.edgeNode': '80',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=80,left=60,bottom=80,right=60]',
    }
  },
] as const;

export interface LayoutPreset {
  id: string;
  label: string;
  description: string;
  icon: string;
  elkOptions: Record<string, string> | null;
  isFreeform?: boolean;
}

export const DEFAULT_PRESET_ID = 'layered-lr';
