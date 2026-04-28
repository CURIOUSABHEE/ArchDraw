'use client';

import { useMemo, useEffect, useState } from 'react';
import type { Node, Edge } from 'reactflow';
import { getBezierPath, getSmoothStepPath, getStraightPath, Position } from 'reactflow';

interface DiagramPreviewProps {
  nodes: Node[];
  edges: Edge[];
  width?: number;
  height?: number;
}

const DEFAULT_NODE_WIDTH = 140;
const DEFAULT_NODE_HEIGHT = 72;
const PADDING = 20;

export function DiagramPreview({ nodes, edges, width = 280, height = 160 }: DiagramPreviewProps) {
  const nodeCount = nodes?.length || 0;

  // Calculate bounding box INCLUDING full node dimensions
  const { minX, minY, maxX, maxY, diagramWidth, diagramHeight, scale, offsetX, offsetY } = useMemo(() => {
    if (nodeCount === 0) {
      return { minX: 0, minY: 0, maxX: 400, maxY: 300, diagramWidth: 400, diagramHeight: 300, scale: 1, offsetX: 0, offsetY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Bounding box should include the ENTIRE node, not just position
    nodes.forEach((node) => {
      const x = node.position.x;
      const y = node.position.y;
      const w = node.width || DEFAULT_NODE_WIDTH;
      const h = node.height || DEFAULT_NODE_HEIGHT;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    // Add some breathing room
    const paddingAdjustment = 50;
    minX -= paddingAdjustment;
    minY -= paddingAdjustment;
    maxX += paddingAdjustment;
    maxY += paddingAdjustment;

    const diagramWidth = maxX - minX;
    const diagramHeight = maxY - minY;

    // Calculate scale to fit in container
    const scaleX = width / diagramWidth;
    const scaleY = height / diagramHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate offsets to center the diagram in the container
    const scaledWidth = diagramWidth * scale;
    const scaledHeight = diagramHeight * scale;
    const offsetX = (width - scaledWidth) / 2 - minX * scale;
    const offsetY = (height - scaledHeight) / 2 - minY * scale;

    return { minX, minY, maxX, maxY, diagramWidth, diagramHeight, scale, offsetX, offsetY };
  }, [nodes, width, height, nodeCount]);

  // Transform function: converts canvas coordinates to SVG viewBox coordinates (centered)
  const transform = (x: number, y: number) => {
    return {
      x: x * scale + offsetX,
      y: y * scale + offsetY,
    };
  };

  // Transform dimensions
  const transformSize = (w: number, h: number) => {
    return {
      width: w * scale,
      height: h * scale,
    };
  };

  const getNodeColor = (node: Node): string => {
    if (node.data?.color) return node.data.color;
    if (node.data?.layer) {
      const layerColors: Record<string, string> = {
        client: '#6366f1',
        gateway: '#8B5CF6',
        service: '#3B82F6',
        queue: '#F59E0B',
        database: '#10B981',
        cache: '#EC4899',
        external: '#6B7280',
        devops: '#F97316',
      };
      return layerColors[node.data.layer as string] || '#3B82F6';
    }
    return '#3B82F6';
  };

  const getEdgeColor = (edge: Edge): string => {
    const edgeType = edge.data?.connectionType as string || edge.data?.edgeType as string;
    if (edgeType === 'async' || edgeType === 'error' || edgeType === 'success') {
      const colors: Record<string, string> = {
        async: '#F59E0B',
        error: '#EF4444',
        success: '#10B981',
      };
      return colors[edgeType] || '#94A3B8';
    }
    return '#94A3B8';
  };

  const getDashArray = (edge: Edge): string => {
    const edgeType = edge.data?.connectionType as string || edge.data?.edgeType as string;
    if (edgeType === 'async') return '8,4';
    return '';
  };

  // Generate edge path using React Flow's internal functions
  const generateEdgePath = (edge: Edge, sourceNode: Node, targetNode: Node): string => {
    if (!sourceNode || !targetNode) return '';

    const sourceHandle = edge.sourceHandle;
    const targetHandle = edge.targetHandle;

    // Determine handle positions
    const sourceWidth = sourceNode.width || DEFAULT_NODE_WIDTH;
    const sourceHeight = sourceNode.height || DEFAULT_NODE_HEIGHT;
    const targetWidth = targetNode.width || DEFAULT_NODE_WIDTH;
    const targetHeight = targetNode.height || DEFAULT_NODE_HEIGHT;

    // Calculate handle positions based on handles
    let sourceX = sourceNode.position.x;
    let sourceY = sourceNode.position.y;
    let targetX = targetNode.position.x;
    let targetY = targetNode.position.y;

    // Source handle position
    if (sourceHandle === 'left') {
      sourceX = sourceNode.position.x;
      sourceY = sourceNode.position.y + sourceHeight / 2;
    } else if (sourceHandle === 'right') {
      sourceX = sourceNode.position.x + sourceWidth;
      sourceY = sourceNode.position.y + sourceHeight / 2;
    } else if (sourceHandle === 'top') {
      sourceX = sourceNode.position.x + sourceWidth / 2;
      sourceY = sourceNode.position.y;
    } else if (sourceHandle === 'bottom') {
      sourceX = sourceNode.position.x + sourceWidth / 2;
      sourceY = sourceNode.position.y + sourceHeight;
    } else {
      // Default: center of source
      sourceX = sourceNode.position.x + sourceWidth / 2;
      sourceY = sourceNode.position.y + sourceHeight / 2;
    }

    // Target handle position
    if (targetHandle === 'left') {
      targetX = targetNode.position.x;
      targetY = targetNode.position.y + targetHeight / 2;
    } else if (targetHandle === 'right') {
      targetX = targetNode.position.x + targetWidth;
      targetY = targetNode.position.y + targetHeight / 2;
    } else if (targetHandle === 'top') {
      targetX = targetNode.position.x + targetWidth / 2;
      targetY = targetNode.position.y;
    } else if (targetHandle === 'bottom') {
      targetX = targetNode.position.x + targetWidth / 2;
      targetY = targetNode.position.y + targetHeight;
    } else {
      // Default: center of target
      targetX = targetNode.position.x + targetWidth / 2;
      targetY = targetNode.position.y + targetHeight / 2;
    }

    // Transform to viewBox coordinates
    const tSource = transform(sourceX, sourceY);
    const tTarget = transform(targetX, targetY);

    // Determine source/target positions for React Flow path functions
    const sourcePos = (sourceHandle as Position) || Position.Right;
    const targetPos = (targetHandle as Position) || Position.Left;

    const pathType = edge.data?.pathType as string || 'bezier';

    // Simple path generation for each type
    if (pathType === 'straight') {
      const dx = tTarget.x - tSource.x;
      const dy = tTarget.y - tSource.y;
      // For straight lines, just use direct line
      return `M ${tSource.x} ${tSource.y} L ${tTarget.x} ${tTarget.y}`;
    }

    if (pathType === 'smoothstep') {
      // Smoothstep: horizontal -> vertical -> horizontal
      const midX = (tSource.x + tTarget.x) / 2;
      return `M ${tSource.x} ${tSource.y} H ${midX} V ${tTarget.y} H ${tTarget.x}`;
    }

    // Default: bezier curve using React Flow's internal formula
    const [path] = getBezierPath({
      sourceX: tSource.x,
      sourceY: tSource.y,
      targetX: tTarget.x,
      targetY: tTarget.y,
    });
    return path;
  };

  if (nodeCount === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ background: '#FAFAFA' }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id={`preview-arrowhead-${scale}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill="#94A3B8" />
          </marker>
        </defs>

        {/* Render edges first (behind nodes) */}
        {edges.map((edge, index) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const path = generateEdgePath(edge, sourceNode, targetNode);
          if (!path) return null;

          return (
            <path
              key={`${edge.id || 'edge'}-${index}`}
              d={path}
              fill="none"
              stroke={getEdgeColor(edge)}
              strokeWidth={1.5 * scale}
              strokeDasharray={getDashArray(edge)}
              markerEnd={`url(#preview-arrowhead-${scale})`}
              opacity={0.7}
            />
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => {
          const { x, y } = transform(node.position.x, node.position.y);
          const { width: w, height: h } = transformSize(
            node.width || DEFAULT_NODE_WIDTH,
            node.height || DEFAULT_NODE_HEIGHT
          );

          // Skip if outside visible area
          if (x + w < -10 || x > width + 10 || y + h < -10 || y > height + 10) return null;

          const nodeColor = getNodeColor(node);
          const isGroup = node.type === 'group' || node.data?.isGroup;

          if (isGroup) {
            return (
              <g key={node.id}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={6 * scale}
                  fill={node.data?.groupColor || '#8B5CF6'}
                  fillOpacity={0.15}
                  stroke={node.data?.groupColor || '#8B5CF6'}
                  strokeWidth={1 * scale}
                  strokeDasharray="4,2"
                />
              </g>
            );
          }

          return (
            <g key={node.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={4 * scale}
                fill={nodeColor}
                fillOpacity={0.9}
              />
              {node.data?.label && w > 20 && h > 15 && (
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(6, Math.min(10, w * 0.15))}
                  fontWeight="600"
                  fill="white"
                >
                  {node.data.label.length > 8
                    ? node.data.label.slice(0, 8) + '..'
                    : node.data.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Lightweight React Flow wrapper for accurate preview
interface ReactFlowPreviewProps {
  nodes: Node[];
  edges: Edge[];
  width?: number;
  height?: number;
}

export function ReactFlowPreview({ nodes, edges, width = 280, height = 160 }: ReactFlowPreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse" style={{ background: '#FAFAFA' }} />
    );
  }

  // Use dynamic import to avoid SSR issues
  const { ReactFlow, Background, BackgroundVariant, ReactFlowProvider } = require('reactflow');

  return (
    <div className="w-full h-full" style={{ width, height }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panInteractive={false}
          zoomInteractive={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E5E7EB" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
