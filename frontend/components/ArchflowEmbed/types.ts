export interface NodeDef {
  id: string;
  label: string;
  type?: 'database' | 'api' | 'service' | 'queue' | 'cache' | 'gateway' | 'client' | 'storage' | string;
  x?: number;
  y?: number;
  description?: string;
  highlight?: boolean;
}

export interface EdgeDef {
  id?: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface ArchflowEmbedProps {
  nodes: NodeDef[];
  edges?: EdgeDef[];
  title?: string;
  height?: number;
  width?: string;
  interactive?: boolean;
  showMinimap?: boolean;
  showChrome?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
  style?: React.CSSProperties;
  onNodeClick?: (nodeId: string) => void;
  onOpenInArchflow?: () => void;
}
