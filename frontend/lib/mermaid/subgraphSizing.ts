import type { RFNode } from './types'
import { NODE_WIDTH, NODE_HEIGHT, SUBGRAPH_PADDING } from './types'

export function sizeSubgraphs(nodes: RFNode[]): RFNode[] {
  return nodes.map(node => {
    if (node.parentNode) {
      const parent = nodes.find(p => p.id === node.parentNode)
      if (parent) {
        return {
          ...node,
          position: {
            x: node.position.x - parent.position.x,
            y: node.position.y - parent.position.y,
          }
        }
      }
    }
    return node
  })
}
