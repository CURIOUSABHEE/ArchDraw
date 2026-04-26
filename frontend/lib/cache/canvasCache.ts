export interface CachedCanvas {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  viewport?: { x: number; y: number; zoom: number };
  lastAccessed: number;
  loadedAt: number;
  size: number;
}

const MAX_CACHE_SIZE = 10;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class CanvasCache {
  private cache: Map<string, CachedCanvas> = new Map();
  private accessOrder: string[] = [];

  has(id: string): boolean {
    const entry = this.cache.get(id);
    if (!entry) return false;
    
    // Check TTL
    if (Date.now() - entry.loadedAt > CACHE_TTL) {
      this.evict(id);
      return false;
    }
    
    return true;
  }

  get(id: string): CachedCanvas | undefined {
    const entry = this.cache.get(id);
    if (!entry) return undefined;
    
    // Check TTL
    if (Date.now() - entry.loadedAt > CACHE_TTL) {
      this.evict(id);
      return undefined;
    }
    
    // Update access order for LRU
    this.updateAccessOrder(id);
    entry.lastAccessed = Date.now();
    
    return entry;
  }

  set(id: string, data: Omit<CachedCanvas, 'lastAccessed' | 'loadedAt' | 'size'>): void {
    // Calculate approximate size
    const size = JSON.stringify(data.nodes).length + JSON.stringify(data.edges).length;
    
    // Evict if cache full
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(id)) {
      this.evictLRU();
    }
    
    const entry: CachedCanvas = {
      ...data,
      id,
      lastAccessed: Date.now(),
      loadedAt: Date.now(),
      size,
    };
    
    this.cache.set(id, entry);
    this.updateAccessOrder(id);
  }

  getViewport(id: string): { x: number; y: number; zoom: number } | undefined {
    const entry = this.cache.get(id);
    return entry?.viewport;
  }

  setViewport(id: string, viewport: { x: number; y: number; zoom: number }): void {
    const entry = this.cache.get(id);
    if (entry) {
      entry.viewport = viewport;
      this.updateAccessOrder(id);
    }
  }

  invalidate(id: string): void {
    this.evict(id);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  private evict(id: string): void {
    this.cache.delete(id);
    this.accessOrder = this.accessOrder.filter(canvasId => canvasId !== id);
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    // Find least recently used (skip first one - likely current)
    let lruId: string | undefined;
    
    for (let i = this.accessOrder.length - 1; i >= 0; i--) {
      const id = this.accessOrder[i];
      if (!this.cache.has(id)) continue;
      
      // Don't evict recent ones
      const entry = this.cache.get(id)!;
      const timeSinceAccess = Date.now() - entry.lastAccessed;
      
      if (timeSinceAccess > 60000 && this.cache.size > 3) { // Older than 1 minute and more than 3 cached
        lruId = id;
        break;
      }
    }
    
    if (lruId) {
      this.evict(lruId);
    } else if (this.accessOrder.length > 0) {
      // Force evict oldest
      this.evict(this.accessOrder[0]);
    }
  }

  private updateAccessOrder(id: string): void {
    this.accessOrder = this.accessOrder.filter(canvasId => canvasId !== id);
    this.accessOrder.unshift(id);
  }

  getStats(): { size: number; count: number; ids: string[] } {
    return {
      size: Array.from(this.cache.values()).reduce((acc, e) => acc + e.size, 0),
      count: this.cache.size,
      ids: this.accessOrder.slice(0, 5),
    };
  }
}

export const canvasCache = new CanvasCache();