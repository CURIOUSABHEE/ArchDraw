export const LAYOUT_PRESETS = [
  {
    id: 'layered-lr',
    label: 'Left → Right',
    description: 'Classic architecture flow',
    icon: '→',
    elkOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'SPLINES',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.spacing.nodeNode': '80',
      'elk.layered.spacing.nodeNodeBetweenLayers': '160',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=50,left=24,bottom=24,right=24]',
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
      'elk.edgeRouting': 'SPLINES',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.spacing.nodeNode': '60',
      'elk.layered.spacing.nodeNodeBetweenLayers': '120',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=50,left=24,bottom=24,right=24]',
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
      'elk.spacing.nodeNode': '80',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.padding': '[top=50,left=24,bottom=24,right=24]',
    }
  },
] as const;

export type LayoutPreset = typeof LAYOUT_PRESETS[number];

export const DEFAULT_PRESET_ID = 'layered-lr';
