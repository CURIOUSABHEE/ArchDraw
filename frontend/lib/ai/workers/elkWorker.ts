import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const FAST_ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '180',
  'elk.layered.compaction.onlyImprovePositions': 'true',
  'elk.layered.crossingMinimization.strategy': 'NONE',
  'elk.layered.nodePlacement.strategy': 'SIMPLE',
  'elk.separateConnectedComponents': 'false',
  'elk.portConstraints': 'FIXED_SIDE',
  'elk.edgeRouting': 'SPLINES',
  'elk.padding': '[top=50, left=30, bottom=50, right=30]',
};

self.onmessage = async (e: MessageEvent) => {
  const { graph, options, timeout = 500 } = e.data;
  
  const timeoutId = setTimeout(() => {
    self.postMessage({ success: false, error: 'ELK timeout', timedOut: true });
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
