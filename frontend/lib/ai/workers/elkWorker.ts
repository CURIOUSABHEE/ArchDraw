import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const FAST_ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.spacing.nodeNode': '150',
  'elk.spacing.edgeEdge': '60',
  'elk.spacing.edgeNode': '80',
  'elk.spacing.labelNode': '50',
  'elk.layered.spacing.nodeNodeBetweenLayers': '200',
  'elk.layered.spacing.edgeNodeBetweenLayers': '160',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '80',
  'elk.layered.compaction.onlyImprovePositions': 'true',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.cycleBreaking.strategy': 'GREEDY',
  'elk.layered.nodeSize.constraints': 'MINIMUM_SIZE',
  'elk.separateConnectedComponents': 'false',
  'elk.portConstraints': 'FIXED_SIDE',
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.edgeLabels.inline': 'false',
  'elk.edgeLabels.placement': 'CENTER',
  'elk.layered.unnecessaryBendpoints': 'true',
  'elk.layered.edgeRouting.selfLoopDistribution': 'EVEN',
  'elk.padding': '[top=80, left=60, bottom=80, right=60]',
  'elk.layered.layering.strategy': 'LONGEST_PATH',
  'elk.layered.initialization.strategy': 'MULTI_LEVEL',
};

self.onmessage = async (e: MessageEvent) => {
  const { graph, options, timeout = 10000 } = e.data;
  
  const timeoutId = setTimeout(() => {
    self.postMessage({ success: false, error: 'ELK timeout after ' + timeout + 'ms', timedOut: true });
  }, timeout);

  try {
    const layout = await elk.layout({
      ...graph,
      layoutOptions: {
        ...FAST_ELK_OPTIONS,
        ...(graph.layoutOptions || {}),
        ...(options || {}),
      },
    });
    
    clearTimeout(timeoutId);
    self.postMessage({ success: true, layout });
  } catch (err) {
    clearTimeout(timeoutId);
    self.postMessage({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
};
