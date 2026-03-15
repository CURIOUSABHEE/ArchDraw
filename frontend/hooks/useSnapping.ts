'use client';

import { useCallback, useRef } from 'react';
import { Node, NodeDragHandler } from 'reactflow';
import { useDiagramStore, GuideLine } from '@/store/diagramStore';

const ALIGN_THRESHOLD = 8;
const NODE_WIDTH = 160;
const NODE_HEIGHT = 110;

function xAnchors(n: Node) {
    const x = n.position.x;
    return { left: x, centerX: x + NODE_WIDTH / 2, right: x + NODE_WIDTH };
}

function yAnchors(n: Node) {
    const y = n.position.y;
    return { top: y, centerY: y + NODE_HEIGHT / 2, bottom: y + NODE_HEIGHT };
}

/**
 * Only computes alignment guide lines — does NOT mutate node positions.
 * Grid snapping is handled by ReactFlow's built-in snapToGrid prop.
 */
export function useSnapping() {
    const setGuideLines = useDiagramStore((s) => s.setGuideLines);
    const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onNodeDrag: NodeDragHandler = useCallback(
        (_event, draggedNode) => {
            const allNodes = useDiagramStore.getState().nodes;
            const others = allNodes.filter((n) => n.id !== draggedNode.id);
            const guides: GuideLine[] = [];

            const { x, y } = draggedNode.position;
            const dragAnchorsX = { left: x, centerX: x + NODE_WIDTH / 2, right: x + NODE_WIDTH };
            const dragAnchorsY = { top: y, centerY: y + NODE_HEIGHT / 2, bottom: y + NODE_HEIGHT };

            for (const other of others) {
                const ox = xAnchors(other);
                const oy = yAnchors(other);

                // Vertical guide lines (x-axis alignment)
                for (const dv of Object.values(dragAnchorsX)) {
                    for (const ov of Object.values(ox)) {
                        if (Math.abs(dv - ov) < ALIGN_THRESHOLD) {
                            guides.push({ orientation: 'v', position: ov });
                        }
                    }
                }

                // Horizontal guide lines (y-axis alignment)
                for (const dv of Object.values(dragAnchorsY)) {
                    for (const ov of Object.values(oy)) {
                        if (Math.abs(dv - ov) < ALIGN_THRESHOLD) {
                            guides.push({ orientation: 'h', position: ov });
                        }
                    }
                }
            }

            // Deduplicate
            const seen = new Set<string>();
            const deduped = guides.filter((g) => {
                const key = `${g.orientation}-${g.position}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            setGuideLines(deduped);
        },
        [setGuideLines]
    );

    const onNodeDragStop: NodeDragHandler = useCallback(() => {
        if (clearTimer.current) clearTimeout(clearTimer.current);
        clearTimer.current = setTimeout(() => setGuideLines([]), 600);
    }, [setGuideLines]);

    return { onNodeDrag, onNodeDragStop };
}
