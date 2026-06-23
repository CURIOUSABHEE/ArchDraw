import type { StyleConfig } from '@/lib/ai/pipeline/mermaid-pipeline/stage1-pregen'
import { runMermaidPipeline } from './pipeline'
import type { RFNode, RFEdge } from './types'

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function applyStyle(node: RFNode, styleConfig: StyleConfig, isSubgraph: boolean): Record<string, unknown> {
  if (isSubgraph) {
    return {
      ...node,
      type: 'frameNode',
      data: {
        ...node.data,
        groupColor: styleConfig.primaryColor,
        label: node.data.label,
        groupLabel: node.data.label,
        isGroup: true,
        style: {
          backgroundColor: hexToRgba(styleConfig.primaryColor, 0.08),
          borderColor: styleConfig.primaryColor,
          borderRadius: '12px',
        },
      },
    }
  }

  return {
    ...node,
    type: 'architectureNode',
    data: {
      ...node.data,
      style: {
        backgroundColor: styleConfig.primaryColor,
        color: '#FFFFFF',
        borderRadius: '8px',
        fontFamily: styleConfig.fontFamily,
      },
    },
  }
}

function applyEdgeStyle(edge: RFEdge, styleConfig: StyleConfig): Record<string, unknown> {
  return {
    ...edge,
    type: 'simpleFloating',
    markerEnd: { type: 'ArrowClosed', width: 24, height: 24 },
    style: {
      stroke: styleConfig.secondaryColor,
      strokeWidth: 2.5,
    },
    labelStyle: {
      fontSize: 12,
      fontFamily: styleConfig.fontFamily,
      fill: styleConfig.secondaryColor,
      fontWeight: 500,
    },
  }
}

export async function translateMermaidToReactFlowJSON(
  mermaidText: string,
  styleConfig: StyleConfig,
  _nodeTypeMap?: Record<string, string>
): Promise<{ nodes: any[]; edges: any[] }> {
  const result = runMermaidPipeline(mermaidText)

  if (!result.success) {
    return { nodes: [], edges: [] }
  }

  const subgraphIds = new Set(
    result.nodes.filter(n => n.type === 'groupNode').map(n => n.id)
  )

  const nodes = result.nodes.map(node => {
    const isSubgraph = subgraphIds.has(node.id) || node.type === 'groupNode'
    return applyStyle(node, styleConfig, isSubgraph)
  })

  const edges = result.edges.map(edge => applyEdgeStyle(edge, styleConfig))

  return { nodes, edges }
}
