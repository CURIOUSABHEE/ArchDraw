import type { FormatConfig, StyleConfig, InventoryConfig, EdgeConfig } from '@/lib/ai/pipeline/mermaid-pipeline/stage1-pregen'
import { applyLayout } from './layout'
import { sizeSubgraphs } from './subgraphSizing'
import type { RFObjects, RFNode, RFEdge } from './types'
import { NODE_WIDTH, NODE_HEIGHT, SUBGRAPH_PADDING } from './types'
import { hexToRgba } from '@/lib/utils'
import type { Node, Edge } from 'reactflow'

function toNodeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'node'
}

function detectShape(name: string): string {
  const lower = name.toLowerCase()
  if (
    lower.includes('database') || lower.includes('db') ||
    lower.includes('cache') || lower.includes('redis') ||
    lower.includes('postgres') || lower.includes('mysql') ||
    lower.includes('mongodb') || lower.includes('dynamodb') ||
    lower.includes('cassandra') || lower.includes('data store') ||
    lower.includes('lake')
  ) return 'cylinder'
  if (
    lower.includes('load balancer') || lower.includes('lb') ||
    lower.includes('gateway') || lower.includes('api gateway') ||
    lower.includes('proxy') || lower.includes('ingress') ||
    lower.includes('traff')
  ) return 'diamond'
  if (
    lower.includes('queue') || lower.includes('broker') ||
    lower.includes('kafka') || lower.includes('rabbitmq') ||
    lower.includes('message bus') || lower.includes('event') ||
    lower.includes('pub/sub') || lower.includes('stream')
  ) return 'circle'
  if (
    lower.includes('external') || lower.includes('third party') ||
    lower.includes('saas') || lower.includes('cdn') ||
    lower.includes('cloud') || lower.includes('vpc')
  ) return 'hexagon'
  if (
    lower === 'user' || lower === 'client' ||
    lower.includes('browser') || lower.includes('mobile') ||
    lower.includes('desktop')
  ) return 'rounded'
  return 'rounded'
}

function detectServiceType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('database') || lower.includes('db') || lower.includes('cache') ||
      lower.includes('redis') || lower.includes('data store')) return 'database'
  if (lower.includes('load balancer') || lower.includes('gateway') ||
      lower.includes('proxy') || lower.includes('ingress')) return 'load-balancer'
  if (lower.includes('queue') || lower.includes('broker') || lower.includes('kafka') ||
      lower.includes('event')) return 'queue'
  if (lower.includes('external') || lower.includes('third') || lower.includes('cdn') ||
      lower.includes('saas')) return 'external-service'
  if (lower === 'user' || lower.includes('client') || lower.includes('browser') ||
      lower.includes('mobile')) return 'client'
  return 'service'
}

const SERVICE_TYPE_META: Record<string, { typeId: string; icon: string; category: string }> = {
  'database':        { typeId: 'database',        icon: 'Database',  category: 'data' },
  'load-balancer':   { typeId: 'load-balancer',   icon: 'GitBranch', category: 'networking' },
  'queue':           { typeId: 'queue',            icon: 'Inbox',     category: 'messaging' },
  'external-service':{ typeId: 'external-service', icon: 'Globe',     category: 'external' },
  'client':          { typeId: 'client',           icon: 'Monitor',   category: 'client' },
  'service':         { typeId: 'service',          icon: 'Box',       category: 'compute' },
}

export function translatePlanToReactFlow(
  formatConfig: FormatConfig,
  styleConfig: StyleConfig,
  inventoryConfig: InventoryConfig,
  edgeConfig: EdgeConfig,
  groupAssignments: Record<string, string>,
): { nodes: Node[]; edges: Edge[] } {
  const { nodes: nodeNames, groups } = inventoryConfig
  const { edges: rawEdges } = edgeConfig
  const diagramType = formatConfig.diagramType
  const direction = diagramType === 'graph LR' ? 'LR' as const : 'TD' as const

  const groupNodes: Record<string, string[]> = {}
  for (const nodeName of nodeNames) {
    const group = groupAssignments[nodeName] || 'Default Layer'
    if (!groupNodes[group]) groupNodes[group] = []
    groupNodes[group].push(nodeName)
  }

  // Build RFObjects for dagre layout
  const rfNodes: RFNode[] = []
  const rfEdges: RFEdge[] = []

  // Create group nodes first (subgraphs)
  const nodeToGroupMap = new Map<string, string>()
  for (const [groupName, members] of Object.entries(groupNodes)) {
    const groupId = toNodeId(groupName)
    for (const member of members) {
      nodeToGroupMap.set(member, groupId)
    }

    rfNodes.push({
      id: groupId,
      type: 'groupNode',
      position: { x: 0, y: 0 },
      data: {
        label: groupName,
        groupLabel: groupName,
        isGroup: true,
        typeId: 'group',
        color: styleConfig.primaryColor,
        category: 'group',
        icon: 'Box',
      },
      style: {
        width: NODE_WIDTH + SUBGRAPH_PADDING * 2,
        height: NODE_HEIGHT + 64 + SUBGRAPH_PADDING,
      },
      zIndex: -1,
    })
  }

  // Create leaf nodes
  for (const nodeName of nodeNames) {
    const id = toNodeId(nodeName)
    const shape = detectShape(nodeName)
    const serviceType = detectServiceType(nodeName)
    const parentGroupId = nodeToGroupMap.get(nodeName)
    const config = {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }

    const meta = SERVICE_TYPE_META[serviceType] || SERVICE_TYPE_META['service']
    const rfNode: RFNode = {
      id,
      type: 'shapeNode',
      position: { x: 0, y: 0 },
      data: {
        label: nodeName,
        shape: shape === 'rounded' ? 'rounded-rectangle' : shape,
        serviceType,
        nodeWidth: config.width,
        nodeHeight: config.height,
        typeId: meta.typeId,
        color: styleConfig.primaryColor,
        category: meta.category,
        icon: meta.icon,
      },
      width: config.width,
      height: config.height,
    }

    if (parentGroupId) {
      rfNode.parentNode = parentGroupId
      rfNode.extent = 'parent'
    }

    rfNodes.push(rfNode)
  }

  // Create edges
  for (const edge of rawEdges) {
    const fromId = toNodeId(edge.from)
    const toId = toNodeId(edge.to)
    if (fromId === toId) continue

    const edgeId = `${fromId}-${toId}`
    rfEdges.push({
      id: edgeId,
      source: fromId,
      target: toId,
      sourceHandle: null,
      targetHandle: null,
      type: 'simpleFloating',
      label: edge.label || undefined,
      data: {
        label: edge.label || undefined,
        connectionType: 'sync',
        edgeVariant: 'solid',
      },
    })
  }

  // Apply dagre layout (reuses existing layout engine)
  const rfObjects: RFObjects = { nodes: rfNodes, edges: rfEdges }
  const layouted = applyLayout(rfObjects, direction)

  // Size subgraph containers
  const sized = sizeSubgraphs(layouted.nodes)

  // Apply styling
  const subgraphIds = new Set(Object.keys(groupNodes).map(toNodeId))

  const styledNodes: Node[] = sized.map(node => {
    const isSubgraph = subgraphIds.has(node.id) || node.type === 'groupNode'
    if (isSubgraph) {
      return {
        ...node,
        type: 'frameNode',
        data: {
          ...node.data,
          groupColor: styleConfig.primaryColor,
          isGroup: true,
          style: {
            backgroundColor: hexToRgba(styleConfig.primaryColor, 0.08),
            borderColor: styleConfig.primaryColor,
            borderRadius: '12px',
          },
        },
      } as Node
    }
    return {
      ...node,
      type: 'shapeNode',
      data: {
        ...node.data,
        style: {
          backgroundColor: styleConfig.primaryColor,
          color: '#FFFFFF',
          borderRadius: '8px',
          fontFamily: styleConfig.fontFamily,
        },
      },
    } as Node
  })

  const styledEdges: Edge[] = layouted.edges.map(edge => ({
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
  })) as unknown as Edge[]

  return { nodes: styledNodes, edges: styledEdges }
}
