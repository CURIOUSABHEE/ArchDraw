import type { StyleConfig } from '@/lib/ai/pipeline/mermaid-pipeline/stage1-pregen'
import { runMermaidPipeline } from './pipeline'
import { hexToRgba } from '@/lib/utils'
import type { RFNode, RFEdge } from './types'

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
    type: node.type || 'shapeNode',
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
