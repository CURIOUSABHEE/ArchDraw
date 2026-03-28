"use client";

import React, { useCallback, useRef, useState } from "react";
import { EmbedNode } from "./EmbedNode";
import { EmbedEdges } from "./EmbedEdges";
import { EmbedChrome } from "./EmbedChrome";
import type { ArchflowEmbedProps, NodeDef, EdgeDef } from "./types";

const DEFAULT_NODE_WIDTH = 100;
const DEFAULT_NODE_HEIGHT = 70;

export function ArchflowEmbed({
  nodes: initialNodes,
  edges: initialEdges = [],
  height = 400,
  showChrome = true,
  onOpenInArchflow,
  className = "",
  style = {},
}: ArchflowEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState<NodeDef[]>(() => {
    return initialNodes.map((node) => ({
      ...node,
      x: node.x ?? Math.random() * 400 + 50,
      y: node.y ?? Math.random() * 200 + 50,
    }));
  });

  const nodePositions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    nodePositions.set(node.id, { x: node.x ?? 0, y: node.y ?? 0 });
  });

  const handleMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.preventDefault();
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDragOffset({
        x: e.clientX - rect.left - (node.x ?? 0),
        y: e.clientY - rect.top - (node.y ?? 0),
      });
      setDraggedNode(nodeId);
    },
    [nodes]
  );

  const handleTouchStart = useCallback(
    (nodeId: string, e: React.TouchEvent) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDragOffset({
        x: touch.clientX - rect.left - (node.x ?? 0),
        y: touch.clientY - rect.top - (node.y ?? 0),
      });
      setDraggedNode(nodeId);
    },
    [nodes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedNode) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - DEFAULT_NODE_WIDTH));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - DEFAULT_NODE_HEIGHT));

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggedNode ? { ...node, x: newX, y: newY } : node
        )
      );
    },
    [draggedNode, dragOffset]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!draggedNode) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(touch.clientX - rect.left - dragOffset.x, rect.width - DEFAULT_NODE_WIDTH));
      const newY = Math.max(0, Math.min(touch.clientY - rect.top - dragOffset.y, rect.height - DEFAULT_NODE_HEIGHT));

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggedNode ? { ...node, x: newX, y: newY } : node
        )
      );
    },
    [draggedNode, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleOpenInArchflow = useCallback(() => {
    if (onOpenInArchflow) {
      onOpenInArchflow();
    } else {
      const diagramData = JSON.stringify({ nodes, edges: initialEdges });
      const encoded = btoa(diagramData);
      window.open(`https://archdraw.app?embed=${encoded}`, "_blank");
    }
  }, [nodes, initialEdges, onOpenInArchflow]);

  const normalizedEdges = initialEdges.map((edge, index) => ({
    id: edge.id ?? `edge-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.animated,
  }));

  const content = (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        overflow: "hidden",
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {nodes.map((node) => (
        <EmbedNode
          key={node.id}
          node={node}
          x={node.x ?? 0}
          y={node.y ?? 0}
          isDragging={draggedNode === node.id}
          interactive={true}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(id) => {}}
        />
      ))}

      {nodes.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "rgba(255, 255, 255, 0.3)",
            fontSize: "14px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          No nodes defined
        </div>
      )}
    </div>
  );

  if (showChrome) {
    return (
      <EmbedChrome onOpenInArchflow={handleOpenInArchflow}>
        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          <EmbedEdges edges={normalizedEdges} nodePositions={nodePositions} />
          {content}
        </div>
      </EmbedChrome>
    );
  }

  return (
    <>
      <EmbedEdges edges={normalizedEdges} nodePositions={nodePositions} />
      {content}
    </>
  );
}

export { type ArchflowEmbedProps, type NodeDef, type EdgeDef };
