import { MarkerType } from 'reactflow';

export const DIAGRAM_CONSTANTS = {
  node: {
    width: 220,
    minHeight: 72,
    padding: 16,
    borderRadius: 12,
    iconSize: 10,
  },
  edge: {
    stroke: '#94a3b8',
    strokeWidth: 1.5,
    dashArray: '5,4',
    arrowWidth: 8,
    arrowHeight: 8,
    labelFontSize: 10,
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
  },
  elk: {
    nodeSpacing: 80,
    layerSpacing: 120,
    edgeNodeSpacing: 40,
  },
};

export const EDGE_MARKER = {
  type: MarkerType.ArrowClosed,
  width: DIAGRAM_CONSTANTS.edge.arrowWidth,
  height: DIAGRAM_CONSTANTS.edge.arrowHeight,
  color: DIAGRAM_CONSTANTS.edge.stroke,
};
