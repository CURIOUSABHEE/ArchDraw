import ELK from 'elkjs/lib/elk.bundled.js';
import { ELK_CONFIG } from '@/lib/config';

const elk = new ELK();

self.onmessage = async (e: MessageEvent) => {
  const { graph, options, timeout = 10000 } = e.data;
  
  const timeoutId = setTimeout(() => {
    self.postMessage({ success: false, error: 'ELK timeout after ' + timeout + 'ms', timedOut: true });
  }, timeout);

  try {
    const layout = await elk.layout({
      ...graph,
      layoutOptions: {
        ...ELK_CONFIG,
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
