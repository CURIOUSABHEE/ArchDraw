// Resizable — stubbed (not used in this app)
import type { ReactNode } from 'react';

interface ResizableProps {
  children?: ReactNode;
}

export const ResizablePanelGroup = (props: ResizableProps) => props.children ?? null;
export const ResizablePanel = (props: ResizableProps) => props.children ?? null;
export const ResizableHandle = () => null;
