import { ELK_CONFIG } from '@/lib/config';

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
    elkOptions: { ...ELK_CONFIG }
  },
  {
    id: 'layered-tb',
    label: 'Top → Bottom',
    description: 'Vertical flow, good for pipelines',
    icon: '↓',
    elkOptions: { ...ELK_CONFIG, 'elk.direction': 'DOWN' }
  },
  {
    id: 'force',
    label: 'Force Directed',
    description: 'Organic clustering by relationships',
    icon: '✦',
    elkOptions: { ...ELK_CONFIG, 'elk.algorithm': 'force', 'elk.force.iterations': '300' }
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
