# ArchDraw - Testing & Commands

## Build Commands

```bash
# TypeScript check (fast)
cd frontend && npx tsc --noEmit

# ESLint
cd frontend && npm run lint

# Full build
cd frontend && npm run build
```

## Project State

### Completed Features
- Simple floating edges migration (replaced old FloatingEdge)
- NodeToolbar on SystemNode and BaseNode
- Edge reconnection with validation
- Edge context menu (right-click) with connection/path type submenus

### Key Files
- `components/Canvas.tsx` - ReactFlow canvas, edge types registered
- `components/ContextMenu.tsx` - Context menu for nodes and edges
- `components/edges/SimpleFloatingEdge.tsx` - Current edge component
- `lib/utils/simpleFloatingEdge.ts` - Edge position utilities
- `store/diagramStore.ts` - State management (uses `deleteEdge`, not `removeEdge`)

### Known Issues
- ESLint warnings for unused imports in dashboard/tutorial pages (non-blocking)
- React Compiler warning in AnnotationNode.tsx (non-blocking)

## Database Cleanup
Old files deleted:
- `components/edges/FloatingEdge.tsx`
- `lib/utils/floatingEdgeUtils.ts`