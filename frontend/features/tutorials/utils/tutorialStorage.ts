import type { TutorialProgressEntry, SanitizedNode, SanitizedEdge } from '@/store/tutorialStore';

export const TUTORIAL_STORAGE_KEY = 'archdraw_tutorial_v2';

export interface StoredTutorialProgress {
  richProgress: Record<string, TutorialProgressEntry>;
  tutorialProgress: Record<string, number>;
  tutorialPhase: Record<string, string>;
}

export function getStoredProgress(): StoredTutorialProgress | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredTutorialProgress;
  } catch {
    return null;
  }
}

export function getLocalProgress(tutorialId: string): TutorialProgressEntry | null {
  const stored = getStoredProgress();
  if (!stored?.richProgress) return null;
  return stored.richProgress[tutorialId] ?? null;
}

export function clearLocalProgress(tutorialId: string): void {
  try {
    const stored = getStoredProgress();
    if (!stored?.richProgress) return;
    
    const newRichProgress = { ...stored.richProgress };
    delete newRichProgress[tutorialId];
    
    localStorage.setItem(
      TUTORIAL_STORAGE_KEY, 
      JSON.stringify({ ...stored, richProgress: newRichProgress })
    );
  } catch (e) {
    console.error('[tutorialStorage] Clear failed:', e);
  }
}

export function clearAllLocalProgress(): void {
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch (e) {
    console.error('[tutorialStorage] Clear all failed:', e);
  }
}

export function sanitizeNode(node: { id: string; type?: string; position: { x: number; y: number }; data?: Record<string, unknown> }): SanitizedNode {
  return {
    id: node.id,
    type: node.type || 'default',
    position: { x: node.position.x, y: node.position.y },
    data: {
      label: (node.data?.label as string) || '',
      componentId: (node.data?.componentId as string) || '',
      category: node.data?.category as string | undefined,
      color: node.data?.color as string | undefined,
      icon: node.data?.icon as string | undefined,
    },
  };
}

export function sanitizeEdge(edge: { id: string; source: string; target: string; type?: string; animated?: boolean; style?: object; label?: string }): SanitizedEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'smooth',
    animated: edge.animated || false,
    style: edge.style,
    label: edge.label,
  };
}