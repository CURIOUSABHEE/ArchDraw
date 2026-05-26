/**
 * ARCHDRAW FEATURE REGISTRY
 * 
 * List of protected features. Do not remove entries from this file.
 * Each entry documents what the feature does and which files implement it.
 * 
 * Before modifying any listed file, check if it is marked @protected.
 */

export const FEATURES = {
  DYNAMIC_HANDLES: {
    name: 'Dynamic Handle Selection',
    status: 'active',
    protected: true,
    files: [
      'lib/features/dynamicHandles.ts',
      'components/edges/SimpleFloatingEdge.ts',
    ],
    description: 'Edge handles auto-select based on relative node position. Recalculates on drag.',
  },
} as const;
