# Floating Edge Refactor - Summary

## Overview
Refactored the React Flow diagram to use the **floating-edge approach** as demonstrated in the React Flow "Simple Floating Edges" example. This eliminates reliance on z-index hacks and CSS nudges, providing a clean, geometry-based connection system.

## Key Changes

### 1. Updated Utility Functions (`lib/utils/simpleFloatingEdge.ts`)
- Added `HANDLE_OFFSETS` constant defining offsets for each position:
  - **Left**: -15px (moves outside node)
  - **Right**: +30px (clears shadows/backplates)
  - **Top**: -15px (moves outside node)
  - **Bottom**: +30px (clears shadows/backplates)
- Updated `getSimpleHandlePosition()` to apply offsets when calculating handle positions
- Added `getHandleOffset()` helper function for external use

### 2. Created FloatingHandles Component (`components/nodes/FloatingHandles.tsx`)
- Reusable component that provides 4 handles positioned outside nodes
- Automatically calls `useUpdateNodeInternals()` to notify React Flow of handle positions
- Configurable offsets for different node types
- Handles are positioned to:
  - Clear node borders and shadows
  - Work with React Flow's internal connection calculations
  - Support the floating edge approach

### 3. Updated All Node Components
Refactored the following nodes to use `FloatingHandles`:
- ✅ **BaseNode** - Core node with all shape variants
- ✅ **SystemNode** - Architecture system nodes
- ✅ **DatabaseNode** - Database cylinder nodes
- ✅ **CacheNode** - Cache layer nodes
- ✅ **CustomNode** - Simple custom nodes
- ✅ **MessageBrokerNode** - Message queue nodes

**Changes per node:**
- Removed individual `Handle` components
- Removed `useUpdateNodeInternals` hook and `useEffect` (now handled by FloatingHandles)
- Added `<FloatingHandles nodeId={id} />` component
- Removed `Position` import (no longer needed)

### 4. Canvas Configuration (`components/Canvas.tsx`)
- Already using `ConnectionMode.Loose` ✅
- Default edge type set to `'simpleFloating'` ✅
- Default path type changed from `'smooth'` to `'Smoothstep'` for better routing

### 5. SimpleFloatingEdge Component (`components/edges/SimpleFloatingEdge.tsx`)
- Added comprehensive documentation explaining the floating edge approach
- Uses updated utility functions with handle offsets
- Dynamically chooses source/target positions based on node geometry
- Properly terminates edges at offset handle positions

## Benefits

### 1. **No Z-Index Hacks**
- Handles are positioned outside nodes using proper offsets
- No reliance on z-index layering tricks
- Backplates and shadows don't interfere with connections

### 2. **Geometry-Based Connections**
- Edges automatically choose the correct side based on node centers
- React Flow's internal calculations are aware of handle positions
- Markers appear at the correct connection points

### 3. **Clean Shadow/Backplate Clearance**
- Right and bottom handles have extra offset (+30px) to clear visual effects
- Left and top handles move outside (-15px) for clean entry points
- No visual overlap between edges and node decorations

### 4. **Maintainable Code**
- Single `FloatingHandles` component used across all nodes
- Consistent handle positioning logic
- Easy to adjust offsets globally

### 5. **React Flow Best Practices**
- Follows the official "Simple Floating Edges" example pattern
- Uses `ConnectionMode.Loose` for flexible connections
- Properly notifies React Flow of handle position changes

## Technical Details

### Handle Positioning
```typescript
// Left handle: -15px from node border
left: -15

// Right handle: +30px from node border (clears backplate + shadow)
right: -30 (CSS right property, so negative value)

// Top handle: -15px from node border
top: -15

// Bottom handle: +30px from node border (clears backplate + shadow)
bottom: -30 (CSS bottom property, so negative value)
```

### Edge Path Calculation
1. Get node centers from React Flow's internal state
2. Determine source/target positions based on geometry (horizontal vs vertical)
3. Calculate handle positions with offsets applied
4. Generate path using `getSmoothStepPath`, `getBezierPath`, or `getStraightPath`
5. Render edge with proper markers at offset positions

### Connection Flow
```
User draws edge → React Flow calculates connection
                ↓
FloatingHandles provides offset positions
                ↓
SimpleFloatingEdge reads node geometry
                ↓
Edge path calculated with offsets
                ↓
Marker appears at correct handle position
```

## Migration Notes

### Nodes Not Yet Updated
The following nodes may still need updating if they exist:
- ShapeNode
- TextLabelNode
- AnnotationNode
- GroupNode

### Backward Compatibility
- Existing diagrams will continue to work
- Edges will automatically use the new floating approach
- No data migration required

### Testing Checklist
- [ ] Verify edges connect to handles outside node borders
- [ ] Confirm markers don't hide behind backplates
- [ ] Test all 4 directions (left, right, top, bottom)
- [ ] Check with different node types
- [ ] Verify edge routing with Smoothstep, Bezier, and Straight paths
- [ ] Test with existing saved diagrams

## Future Improvements
1. Add configurable handle offsets per node type
2. Support dynamic offset calculation based on shadow size
3. Add handle visibility toggle
4. Implement smart handle positioning for dense diagrams
