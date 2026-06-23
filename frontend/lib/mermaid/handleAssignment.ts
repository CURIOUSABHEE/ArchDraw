import type { RFNode, RFEdge } from './types'
import { NODE_WIDTH, NODE_HEIGHT } from './types'

function getAbsolutePosition(node: RFNode, allNodes: RFNode[]): { x: number; y: number } {
  let x = node.position.x
  let y = node.position.y
  let current = node
  const visited = new Set<string>([node.id])
  while (current.parentNode) {
    const parent = allNodes.find(n => n.id === current.parentNode)
    if (!parent || visited.has(parent.id)) break
    visited.add(parent.id)
    x += parent.position.x
    y += parent.position.y
    current = parent
  }
  return { x, y }
}

function getNodeCenter(node: RFNode, allNodes: RFNode[]): { x: number; y: number } {
  const abs = getAbsolutePosition(node, allNodes)
  return { x: abs.x + NODE_WIDTH / 2, y: abs.y + NODE_HEIGHT / 2 }
}

export function assignHandles(nodes: RFNode[], edges: RFEdge[]): RFEdge[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  return edges.map(edge => {
    const srcNode = nodeMap.get(edge.source)
    const tgtNode = nodeMap.get(edge.target)
    if (!srcNode || !tgtNode) {
      return { ...edge, sourceHandle: 'right', targetHandle: 'left' }
    }

    const srcCenter = getNodeCenter(srcNode, nodes)
    const tgtCenter = getNodeCenter(tgtNode, nodes)
    const dx = tgtCenter.x - srcCenter.x
    const dy = tgtCenter.y - srcCenter.y

    let sourceHandle: string, targetHandle: string

    if (Math.abs(dy) >= Math.abs(dx)) {
      sourceHandle = dy > 0 ? 'bottom' : 'top'
      targetHandle = dy > 0 ? 'top' : 'bottom'
    } else {
      sourceHandle = dx > 0 ? 'right' : 'left'
      targetHandle = dx > 0 ? 'left' : 'right'
    }

    return {
      ...edge,
      sourceHandle,
      targetHandle,
    }
  })
}
