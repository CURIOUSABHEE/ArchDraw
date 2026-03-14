import { useState } from 'react';
import { Search } from 'lucide-react';
import componentsData from '@/data/components.json';
import { useDiagramStore } from '@/store/diagramStore';

/** Searchable component library sidebar */
export function ComponentSidebar() {
  const [search, setSearch] = useState('');
  const addNode = useDiagramStore((s) => s.addNode);

  const filtered = componentsData.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, typeof componentsData>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  return (
    <aside className="w-72 border-r border-border bg-sidebar flex flex-col h-full shrink-0">
      {/* Search */}
      <div className="p-4 border-b border-border bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search components..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted border-none rounded-md focus:ring-2 focus:ring-ring/20 transition-all outline-none placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Component list grouped by category */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {category}
            </h3>
            <div className="space-y-1">
              {items.map((comp) => (
                <button
                  key={comp.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/archdraw', JSON.stringify(comp));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => addNode(comp.id, comp.label, comp.category)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-secondary-foreground bg-card rounded-lg transition-all hover:bg-accent/10 hover:shadow-sm group cursor-grab active:cursor-grabbing"
                  style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: comp.color }}
                  />
                  <span className="flex-1 text-left">{comp.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No components found</p>
        )}
      </div>
    </aside>
  );
}
