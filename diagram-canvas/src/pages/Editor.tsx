import { Toolbar } from '@/components/Toolbar';
import { ComponentSidebar } from '@/components/ComponentSidebar';
import { Canvas } from '@/components/Canvas';
import { CommandPalette } from '@/components/CommandPalette';

/** Primary editor page assembling toolbar, sidebar, canvas, and command palette */
export default function EditorPage() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <ComponentSidebar />
        <Canvas />
      </div>
      <CommandPalette />
    </div>
  );
}
