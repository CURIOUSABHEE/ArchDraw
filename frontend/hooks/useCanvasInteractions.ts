'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import type { Node, Edge } from 'reactflow';

const MOVE_STEP = 1;
const MOVE_STEP_LARGE = 10;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2;

export interface CanvasInteractionState {
  isPanning: boolean;
  isSpacePressed: boolean;
  isSelecting: boolean;
  selectionBox: { startX: number; startY: number; endX: number; endY: number } | null;
}

interface ClipboardData {
  nodes: Node[];
  edges: Edge[];
}

export function useCanvasInteractions() {
  const reactFlow = useReactFlow();
  const [interactionState, setInteractionState] = useState<CanvasInteractionState>({
    isPanning: false,
    isSpacePressed: false,
    isSelecting: false,
    selectionBox: null,
  });
  
  const clipboardRef = useRef<ClipboardData | null>(null);
  const moveStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewportStartRef = useRef({ x: 0, y: 0 });

  const {
    nodes,
    edges,
    selectedNodeIds,
    selectedEdgeId,
    setSelectedNodeId,
    setSelectedNodeIds,
    setSelectedEdgeId,
    deleteSelected,
    selectAll: storeSelectAll,
    pushHistory,
    removeNode,
    deleteEdge,
    importDiagram,
    onConnect,
  } = useDiagramStore();

  // Copy selected nodes to clipboard
  const copySelection = useCallback(() => {
    if (selectedNodeIds.length === 0 && !selectedEdgeId) return;
    
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const selectedEdges = selectedEdgeId 
      ? edges.filter(e => e.id === selectedEdgeId || e.source === selectedEdgeId || e.target === selectedEdgeId)
      : [];
    
    // Filter edges that connect selected nodes
    const relevantEdges = selectedEdgeId
      ? []
      : edges.filter(e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target));
    
    clipboardRef.current = {
      nodes: selectedNodes.map(n => ({ ...n })),
      edges: relevantEdges.map(e => ({ ...e })),
    };
  }, [nodes, edges, selectedNodeIds, selectedEdgeId]);

  // Paste from clipboard
  const pasteSelection = useCallback(() => {
    if (!clipboardRef.current) return;
    
    const { nodes: clipboardNodes, edges: clipboardEdges } = clipboardRef.current;
    if (clipboardNodes.length === 0) return;
    
    pushHistory();
    
    // Calculate offset for paste (slight offset so it doesn't overlap)
    const offsetX = 40;
    const offsetY = 40;
    
    // Create ID mapping for edges
    const idMapping = new Map<string, string>();
    
    // Duplicate nodes with new IDs
    const newNodes = clipboardNodes.map(node => {
      const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      idMapping.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
        selected: true,
        data: { ...node.data },
      };
    });
    
    // Duplicate edges with new IDs and mapped source/target
    const newEdges = clipboardEdges.map(edge => ({
      ...edge,
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: idMapping.get(edge.source) || edge.source,
      target: idMapping.get(edge.target) || edge.target,
    }));
    
    // Deselect old selection
    const deselectedOld = nodes.map(n => 
      selectedNodeIds.includes(n.id) ? { ...n, selected: false } : n
    );
    
    // Import the new nodes and edges
    importDiagram([...deselectedOld, ...newNodes], [...edges, ...newEdges]);
    
    // Select the new nodes
    setSelectedNodeIds(newNodes.map(n => n.id));
  }, [nodes, edges, selectedNodeIds, pushHistory, importDiagram, setSelectedNodeIds]);

  // Cut selection (copy + delete)
  const cutSelection = useCallback(() => {
    copySelection();
    deleteSelected();
  }, [copySelection, deleteSelected]);

  // Move selected nodes with arrow keys
  const moveSelection = useCallback((dx: number, dy: number) => {
    if (selectedNodeIds.length === 0) return;
    
    const updatedNodes = nodes.map(node => {
      if (selectedNodeIds.includes(node.id)) {
        return {
          ...node,
          position: {
            x: node.position.x + dx,
            y: node.position.y + dy,
          },
        };
      }
      return node;
    });
    
    importDiagram(updatedNodes, edges);
  }, [nodes, edges, selectedNodeIds, importDiagram]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    const currentZoom = reactFlow.getZoom();
    const newZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    reactFlow.zoomTo(newZoom);
  }, [reactFlow]);

  const zoomOut = useCallback(() => {
    const currentZoom = reactFlow.getZoom();
    const newZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    reactFlow.zoomTo(newZoom);
  }, [reactFlow]);

  const resetZoom = useCallback(() => {
    reactFlow.zoomTo(1);
  }, [reactFlow]);

  // Select all nodes
  const selectAll = useCallback(() => {
    const allIds = nodes.filter(n => n.type !== 'groupNode').map(n => n.id);
    setSelectedNodeIds(allIds);
    setSelectedEdgeId(null);
  }, [nodes, setSelectedNodeIds, setSelectedEdgeId]);

  // Delete selected nodes and edges
  const deleteSelection = useCallback(() => {
    pushHistory();
    
    // Delete selected nodes
    if (selectedNodeIds.length > 0) {
      selectedNodeIds.forEach(id => {
        const newNodes = nodes.filter(n => n.id !== id);
        const newEdges = edges.filter(e => e.source !== id && e.target !== id);
        useDiagramStore.setState({ nodes: newNodes, edges: newEdges });
      });
    }
    
    // Delete selected edge
    if (selectedEdgeId) {
      const newEdges = edges.filter(e => e.id !== selectedEdgeId);
      useDiagramStore.setState({ edges: newEdges, selectedEdgeId: null });
    }
    
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
  }, [selectedNodeIds, selectedEdgeId, nodes, edges, pushHistory, setSelectedNodeIds, setSelectedEdgeId]);

  // Duplicate selection (Cmd+D)
  const duplicateSelection = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    
    pushHistory();
    
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const offsetX = 40;
    const offsetY = 40;
    
    // Create ID mapping
    const idMapping = new Map<string, string>();
    
    const newNodes = selectedNodes.map(node => {
      const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      idMapping.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
        selected: true,
        data: { ...node.data },
      };
    });
    
    // Copy edges between selected nodes
    const edgesToCopy = edges.filter(
      e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
    );
    
    const newEdges = edgesToCopy.map(edge => ({
      ...edge,
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: idMapping.get(edge.source) || edge.source,
      target: idMapping.get(edge.target) || edge.target,
    }));
    
    // Deselect original nodes
    const deselectedOld = nodes.map(n => 
      selectedNodeIds.includes(n.id) ? { ...n, selected: false } : n
    );
    
    importDiagram([...deselectedOld, ...newNodes], [...edges, ...newEdges]);
    setSelectedNodeIds(newNodes.map(n => n.id));
  }, [selectedNodeIds, nodes, edges, pushHistory, importDiagram, setSelectedNodeIds]);

  // Global keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Space bar for pan mode (only when not in input)
      if (e.code === 'Space' && !isInput && !e.repeat) {
        e.preventDefault();
        setInteractionState(prev => ({ ...prev, isSpacePressed: true }));
        document.body.style.cursor = 'grab';
        return;
      }
      
      // Don't process other shortcuts if in input
      if (isInput) return;
      
      const isMeta = e.metaKey || e.ctrlKey;
      
      // Escape - clear selection
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setSelectedNodeIds([]);
        clipboardRef.current = null;
        return;
      }
      
      // Delete/Backspace - delete selection
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection();
        return;
      }
      
      // Arrow keys - move selection
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? MOVE_STEP_LARGE : MOVE_STEP;
        const movements: Record<string, [number, number]> = {
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
        };
        const [dx, dy] = movements[e.key];
        moveSelection(dx, dy);
        return;
      }
      
      // Cmd/Ctrl shortcuts
      if (isMeta) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            copySelection();
            break;
          case 'v':
            e.preventDefault();
            pasteSelection();
            break;
          case 'x':
            e.preventDefault();
            cutSelection();
            break;
          case 'd':
            e.preventDefault();
            duplicateSelection();
            break;
          case 'a':
            e.preventDefault();
            selectAll();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              useDiagramStore.getState().redo();
            } else {
              useDiagramStore.getState().undo();
            }
            break;
          case 'y':
            e.preventDefault();
            useDiagramStore.getState().redo();
            break;
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            resetZoom();
            break;
        }
      }
    };
    
    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setInteractionState(prev => ({ ...prev, isSpacePressed: false }));
        document.body.style.cursor = '';
      }
    };
    
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', keyUpHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, [
    copySelection,
    pasteSelection,
    cutSelection,
    duplicateSelection,
    selectAll,
    deleteSelection,
    moveSelection,
    zoomIn,
    zoomOut,
    resetZoom,
    setSelectedNodeId,
    setSelectedEdgeId,
    setSelectedNodeIds,
  ]);

  return {
    interactionState,
    setInteractionState,
    copySelection,
    pasteSelection,
    cutSelection,
    duplicateSelection,
    selectAll,
    deleteSelection,
    moveSelection,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}

// Hook for middle mouse pan
export function useMiddleMousePan() {
  const [isMiddlePan, setIsMiddlePan] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const startViewport = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
        setIsMiddlePan(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
        if (viewport) {
          const transform = viewport.style.transform;
          const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)\s*scale\(([^)]+)\)/);
          if (match) {
            startViewport.current = { 
              x: parseFloat(match[1]), 
              y: parseFloat(match[2]) 
            };
          }
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMiddlePan) return;
      
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
      if (viewport) {
        const transform = viewport.style.transform;
        const match = transform.match(/scale\(([^)]+)\)/);
        const zoom = match ? parseFloat(match[1]) : 1;
        
        viewport.style.transform = `translate(${startViewport.current.x + dx}px, ${startViewport.current.y + dy}px) scale(${zoom})`;
      }
    };

    const handleMouseUp = () => {
      if (isMiddlePan) {
        setIsMiddlePan(false);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMiddlePan]);

  return isMiddlePan;
}
