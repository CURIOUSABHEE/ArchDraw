"use client";

import React from "react";

interface EdgePoint {
  x: number;
  y: number;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

interface EmbedEdgesProps {
  edges: EdgeData[];
  nodePositions: Map<string, EdgePoint>;
}

export function EmbedEdges({ edges, nodePositions }: EmbedEdgesProps) {
  const getEdgePath = (source: EdgePoint, target: EdgePoint): string => {
    const midX = (source.x + target.x) / 2;
    const dx = target.x - source.x;
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);
    
    return `M ${source.x} ${source.y} C ${source.x + controlOffset} ${source.y}, ${target.x - controlOffset} ${target.y}, ${target.x} ${target.y}`;
  };

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="var(--edge-color, #6366f1)"
          />
        </marker>
        <marker
          id="arrowhead-animated"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="var(--edge-color, #6366f1)"
          />
        </marker>
      </defs>

      {edges.map((edge) => {
        const sourcePos = nodePositions.get(edge.source);
        const targetPos = nodePositions.get(edge.target);

        if (!sourcePos || !targetPos) return null;

        const path = getEdgePath(sourcePos, targetPos);

        return (
          <g key={edge.id}>
            <path
              d={path}
              fill="none"
              stroke="var(--edge-color, #6366f1)"
              strokeWidth={2}
              opacity={0.3}
            />
            <path
              d={path}
              fill="none"
              stroke="var(--edge-color, #6366f1)"
              strokeWidth={2}
              strokeDasharray="5 5"
              markerEnd="url(#arrowhead)"
              className={edge.animated ? "animate-flow" : ""}
            />
            {edge.label && (
              <text
                x={(sourcePos.x + targetPos.x) / 2}
                y={(sourcePos.y + targetPos.y) / 2 - 10}
                textAnchor="middle"
                fill="var(--edge-color, #6366f1)"
                fontSize="12"
                opacity={0.8}
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      <style jsx>{`
        @keyframes flow {
          from {
            stroke-dashoffset: 10;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-flow {
          animation: flow 1s linear infinite;
        }
      `}</style>
    </svg>
  );
}
