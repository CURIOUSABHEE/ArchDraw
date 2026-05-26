# LocalStorage State Management Fixes

## Summary

Implemented three critical fixes to prevent state corruption and ensure isolated, predictable behavior across development ports and production environments.

## Changes Implemented

### FIX 1: Isolate LocalStorage Per Port in Development

**Location:** `store/diagramStore.ts`

**Implementation:**
```typescript
const STORAGE_KEY = typeof window !== 'undefined'
  ? `archdraw-state-${process.env.NODE_ENV}-${window.location.port}`
  : 'archdraw-state';
```

**Result:**
- `localhost:3000` → `"archdraw-state-development-3000"`
- `localhost:3001` → `"archdraw-state-development-3001"`
- Production → `"archdraw-state-production-"`

Each port gets its own isolated state. They can never bleed into each other.

---

### FIX 2: Add Schema Version + Migration

**Location:** `store/diagramStore.ts` (persist configuration)

**Implementation:**
```typescript
{
  name: STORAGE_KEY,
  version: 1, // Increment this whenever node.data, edge properties, or CanvasTab structure changes
  storage: createJSONStorage(() => serializedStorage),
  migrate: (persistedState: unknown, version: number) => {
    // If version is less than current, return undefined to force clean slate
    if (version < 1) {
      logger.log('[Store] Schema version outdated, resetting to initial state');
      return undefined;
    }
    return persistedState as DiagramState;
  },
  // ... rest of config
}
```

**Rule:** Whenever you change the shape of `node.data`, edge properties, or `CanvasTab` structure — bump `version` by 1. Old persisted state will be wiped and replaced with a clean initial state automatically.

---

### FIX 3: Single Source of Truth for initialState

**Location:** `store/diagramStore.ts` (before store creation)

**Implementation:**
```typescript
// ── Initial State (Single Source of Truth) ────────────────────────────────────
// This is the clean initial state used when no valid persisted state exists
// or when schema version changes force a reset
const initialState = {
  canvases: [{ ...INITIAL_CANVAS, isOpen: true, lastAccessedAt: Date.now() }],
  activeCanvasId: INITIAL_CANVAS.id,
  openCanvasIds: [INITIAL_CANVAS.id],
  nodes: [],
  edges: [],
  sequenceDiagrams: {},
  userProfile: null,
  savingState: 'idle' as const,
  selectedNodeId: null,
  selectedNodeIds: [],
  selectedEdgeId: null,
  guideLines: [],
  edgeAnimations: true,
  showGrid: true,
  darkMode: true,
  canvasDarkMode: false,
  sidebarOpen: true,
  canvasMode: 'empty' as const,
  activeLayoutPresetId: 'layered-lr',
  past: [],
  future: [],
  editingEdgeId: null,
  pendingEditEdgeId: null,
  pendingLabelEdgeId: null,
};
```

The migrate function returns `undefined` for old versions → Zustand falls back to this `initialState` automatically. No corrupted state ever reaches your components.

---

## Verification Steps

After implementing, test this sequence:

1. **Port Isolation Test:**
   - Open `localhost:3000` — add nodes, drag them around
   - Open `localhost:3001` — should start with clean initialState, NOT the nodes from port 3000
   - Verify: Check browser DevTools → Application → Local Storage
     - Should see `archdraw-state-development-3000` and `archdraw-state-development-3001` as separate keys

2. **Schema Migration Test:**
   - Change `node.data` shape in code (e.g., add a new required field)
   - Bump `version` to `2` in the persist configuration
   - Reload both ports — both should start clean, no schema errors
   - Verify: Check console for `[Store] Schema version outdated, resetting to initial state`

3. **Production Isolation Test:**
   - Deploy to production
   - Verify production key has no port suffix: `archdraw-state-production-`
   - Confirm production state is isolated from all dev state permanently

4. **Initial State Fallback Test:**
   - Manually corrupt localStorage (set invalid JSON)
   - Reload page — should fall back to `initialState` cleanly
   - No errors in console, canvas starts with default "Elephant" canvas

---

## Benefits

### Before:
- ❌ State bleeding between development ports
- ❌ Schema changes silently corrupted persisted state
- ❌ No clear initial state definition
- ❌ Unpredictable behavior after data structure changes

### After:
- ✅ Complete isolation between development ports
- ✅ Automatic state reset on schema version changes
- ✅ Single source of truth for initial state
- ✅ Predictable, deterministic behavior
- ✅ Production state isolated from development
- ✅ Safe schema evolution with version bumping

---

## Future Schema Changes

When you need to change the data structure:

1. **Identify the change:**
   - Adding/removing fields in `node.data`
   - Changing edge properties structure
   - Modifying `CanvasTab` interface

2. **Bump the version:**
   ```typescript
   version: 2, // Was 1, now 2
   ```

3. **Update migration logic (if needed):**
   ```typescript
   migrate: (persistedState: unknown, version: number) => {
     if (version < 2) {
       // Custom migration logic here if you want to preserve some data
       // Or return undefined to force clean slate
       return undefined;
     }
     return persistedState as DiagramState;
   },
   ```

4. **Test:**
   - Verify old state is handled gracefully
   - Confirm new state structure works correctly

---

## Technical Details

### Storage Key Format

```
archdraw-state-{NODE_ENV}-{PORT}
```

- **NODE_ENV:** `development` | `production` | `test`
- **PORT:** Browser window.location.port (empty string in production)

### Version Migration Flow

```
1. Zustand loads persisted state from localStorage
2. Checks version number
3. If version < current:
   - Calls migrate() function
   - migrate() returns undefined
   - Zustand uses initialState instead
4. If version === current:
   - Uses persisted state as-is
```

### Initial State Usage

The `initialState` object is used in two scenarios:
1. **No persisted state exists** (first visit, cleared storage)
2. **Migration returns undefined** (schema version mismatch)

---

## Build Verification

✅ Build completed successfully with no TypeScript errors
✅ All routes compiled correctly
✅ No runtime errors in store initialization

---

## Related Files

- `store/diagramStore.ts` - Main store with all three fixes
- `store/storage.ts` - Serialized storage adapter (unchanged)
- `store/tutorialStore.ts` - Tutorial store (could benefit from same fixes)
- `store/promptHistory.ts` - Prompt history store (could benefit from same fixes)
- `store/modalStore.ts` - Modal store (could benefit from same fixes)

---

## Recommendations

Consider applying the same pattern to other stores:
- `tutorialStore.ts`
- `promptHistory.ts`
- `modalStore.ts`

Each should have:
1. Port-isolated storage key
2. Schema versioning
3. Defined initial state
