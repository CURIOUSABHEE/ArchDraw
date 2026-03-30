import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getViewportCenter(): { x: number; y: number } {
  const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
  const bounds = document.querySelector('.react-flow__renderer')?.getBoundingClientRect();
  if (!el || !bounds) return { x: 400 + Math.random() * 40 - 20, y: 300 + Math.random() * 40 - 20 };
  
  const style = el.style.transform;
  const match = style.match(/translate\(([^,]+)px,\s*([^)]+)px\)\s*scale\(([^)]+)\)/);
  if (!match) return { x: 400 + Math.random() * 40 - 20, y: 300 + Math.random() * 40 - 20 };
  
  const vx = parseFloat(match[1]), vy = parseFloat(match[2]), zoom = parseFloat(match[3]);
  return {
    x: (bounds.width / 2 - vx) / zoom + Math.random() * 40 - 20,
    y: (bounds.height / 2 - vy) / zoom + Math.random() * 40 - 20,
  };
}
