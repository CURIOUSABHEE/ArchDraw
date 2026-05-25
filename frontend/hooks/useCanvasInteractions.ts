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
