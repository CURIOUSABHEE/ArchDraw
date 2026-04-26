import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getViewportCenter(): { x: number; y: number } {
  const flow = document.querySelector('.react-flow');
  const bounds = flow?.getBoundingClientRect();
  const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null;
  
  if (!flow || !bounds || !viewport) return { x: 400, y: 300 };
  
  const style = viewport.style.transform;
  const match = style.match(/translate\(([^,]+)px,\s*([^)]+)px\)\s*scale\(([^)]+)\)/);
  
  let vx = 0, vy = 0, zoom = 1;
  if (match) {
    vx = parseFloat(match[1]);
    vy = parseFloat(match[2]);
    zoom = parseFloat(match[3]);
  }
  
  const x = (bounds.width / 2 - vx) / zoom;
  const y = (bounds.height / 2 - vy) / zoom;
  
  return { x, y };
}
