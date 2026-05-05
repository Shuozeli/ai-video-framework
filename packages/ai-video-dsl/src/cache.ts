// ============================================
// Cache Strategy Types
// ============================================

export enum CacheStrategy {
  LRU = 'lru',
  RAM_PRESSURE = 'ram_pressure',
  CLASSIC = 'classic',
  NONE = 'none',
}

// ============================================
// Cache Entry
// ============================================

export interface CacheEntry<T = Buffer> {
  key: string;
  value: T;
  size: number;
  createdAt: number;
  lastAccessedAt: number;
}

// ============================================
// Cache Manager Interface
// ============================================

export interface ICacheManager<T = Buffer> {
  get(key: string): T | null;
  set(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
}

// ============================================
// Memory Monitor (for RAM_PRESSURE strategy)
// ============================================

type MemoryPressureCallback = () => void;

class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryThreshold = 0.8; // 80% of heap limit
  private checkInterval: NodeJS.Timeout | null = null;
  private callbacks: Set<MemoryPressureCallback> = new Set();

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Register a callback for memory pressure events
   */
  onPressure(callback: MemoryPressureCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Remove a memory pressure callback
   */
  offPressure(callback: MemoryPressureCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Check current memory usage
   */
  getMemoryUsage(): { used: number; total: number; ratio: number } {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      const heapUsed = mem.heapUsed;
      const heapTotal = mem.heapTotal;
      return {
        used: heapUsed,
        total: heapTotal,
        ratio: heapUsed / heapTotal,
      };
    }
    return { used: 0, total: 0, ratio: 0 };
  }

  /**
   * Start monitoring memory
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage.ratio > this.memoryThreshold) {
        this.callbacks.forEach((cb) => cb());
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring memory
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// ============================================
// Base Cache Manager
// ============================================

abstract class BaseCacheManager<T = Buffer> implements ICacheManager<T> {
  protected cache: Map<string, CacheEntry<T>> = new Map();

  abstract get(key: string): T | null;
  abstract set(key: string, value: T): void;

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  protected updateAccessTime(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccessedAt = Date.now();
    }
  }
}

// ============================================
// LRU Cache Manager
// ============================================

export class LRUCacheManager<T = Buffer> extends BaseCacheManager<T> {
  private maxSize: number;

  constructor(maxSize: number = 100) {
    super();
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update access time (LRU tracking)
    entry.lastAccessedAt = Date.now();
    return entry.value;
  }

  set(key: string, value: T): void {
    // Calculate size (for Buffer, use byte length)
    const size = this.getSize(value);

    // If key exists, update
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.size = size;
      entry.lastAccessedAt = Date.now();
      return;
    }

    // Evict oldest if at capacity
    while (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    // Add new entry
    this.cache.set(key, {
      key,
      value,
      size,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    });
  }

  private getSize(value: T): number {
    if (value instanceof Buffer) {
      return value.length;
    }
    if (typeof value === 'string') {
      return value.length;
    }
    return 1;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache entries sorted by last access time (for debugging)
   */
  getLRUOrder(): string[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .map((e) => e.key);
  }
}

// ============================================
// RAM Pressure Cache Manager
// ============================================

export class RAMPressureCacheManager<T = Buffer> extends BaseCacheManager<T> {
  private memoryMonitor: MemoryMonitor;
  private maxMemoryMB: number;

  constructor(maxMemoryMB: number = 512) {
    super();
    this.memoryMonitor = MemoryMonitor.getInstance();
    this.maxMemoryMB = maxMemoryMB;

    // Register for memory pressure events
    this.memoryMonitor.onPressure(() => this.handleMemoryPressure());

    // Start monitoring
    this.memoryMonitor.startMonitoring();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update access time
    this.updateAccessTime(key);
    return entry.value;
  }

  set(key: string, value: T): void {
    const size = this.getSize(value);

    // If key exists, update
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.size = size;
      entry.lastAccessedAt = Date.now();
      return;
    }

    // Check if we need to free memory before adding
    while (this.getTotalSize() + size > this.maxMemoryMB * 1024 * 1024) {
      if (!this.evictOldest()) break; // No more entries to evict
    }

    // Add new entry
    this.cache.set(key, {
      key,
      value,
      size,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    });
  }

  private getSize(value: T): number {
    if (value instanceof Buffer) {
      return value.length;
    }
    if (typeof value === 'string') {
      return value.length;
    }
    return 1;
  }

  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  private evictOldest(): boolean {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      return true;
    }
    return false;
  }

  /**
   * Handle memory pressure - aggressively evict entries
   */
  private handleMemoryPressure(): void {
    const targetSize = Math.floor(this.maxMemoryMB * 0.5); // Reduce to 50% of max
    while (this.getTotalSize() > targetSize && this.cache.size > 0) {
      if (!this.evictOldest()) break;
    }
  }

  /**
   * Get current memory usage stats
   */
  getStats(): { entries: number; sizeBytes: number; limitBytes: number } {
    return {
      entries: this.cache.size,
      sizeBytes: this.getTotalSize(),
      limitBytes: this.maxMemoryMB * 1024 * 1024,
    };
  }
}

// ============================================
// Classic Cache (no eviction, just clear on demand)
// ============================================

export class ClassicCacheManager<T = Buffer> extends BaseCacheManager<T> {
  get(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? entry.value : null;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      key,
      value,
      size: 1,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    });
  }
}

// ============================================
// No-op Cache (always misses)
// ============================================

export class NoCacheManager implements ICacheManager {
  get(_key: string): null {
    return null;
  }

  set(_key: string, _value: unknown): void {
    // No-op
  }

  has(_key: string): boolean {
    return false;
  }

  delete(_key: string): boolean {
    return false;
  }

  clear(): void {
    // No-op
  }

  size(): number {
    return 0;
  }
}

// ============================================
// Cache Manager Factory
// ============================================

export function createCacheManager<T = Buffer>(
  strategy: CacheStrategy,
  options?: { maxSize?: number; maxMemoryMB?: number }
): ICacheManager<T> {
  switch (strategy) {
    case CacheStrategy.LRU:
      return new LRUCacheManager<T>(options?.maxSize ?? 100);

    case CacheStrategy.RAM_PRESSURE:
      return new RAMPressureCacheManager<T>(options?.maxMemoryMB ?? 512);

    case CacheStrategy.CLASSIC:
      return new ClassicCacheManager<T>();

    case CacheStrategy.NONE:
      return new NoCacheManager();

    default:
      throw new Error(`Unknown cache strategy: ${strategy}`);
  }
}

// ============================================
// Disk Cache (for persistent caching)
// ============================================

export interface DiskCacheOptions {
  cacheDir: string;
  maxSizeMB?: number;
}

export class DiskCacheManager implements ICacheManager<Buffer> {
  private cacheDir: string;
  private index: Map<string, { size: number; mtime: number }> = new Map();
  private maxSizeBytes: number;

  constructor(options: DiskCacheOptions) {
    this.cacheDir = options.cacheDir;
    this.maxSizeBytes = (options.maxSizeMB ?? 1024) * 1024 * 1024;
  }

  private getPath(key: string): string {
    // Simple hash to avoid special characters in file names
    const hash = Buffer.from(key).toString('base64').replace(/[/+=]/g, '_');
    return `${this.cacheDir}/${hash}`;
  }

  get(key: string): Buffer | null {
    const path = this.getPath(key);
    try {
      const stat = require('fs').statSync(path);
      if (stat.isFile()) {
        // Update mtime on access
        require('fs').utimesSync(path, stat.atime, Date.now() / 1000);
        return require('fs').readFileSync(path);
      }
    } catch {
      // File doesn't exist or can't be read
    }
    return null;
  }

  set(key: string, value: Buffer): void {
    const path = this.getPath(key);
    const dir = require('path').dirname(path);

    // Ensure directory exists
    require('fs').mkdirSync(dir, { recursive: true });

    // Write file
    require('fs').writeFileSync(path, value);

    // Update index
    const size = value.length;
    this.index.set(key, { size, mtime: Date.now() });

    // Check size and evict if needed
    this.enforceMaxSize();
  }

  has(key: string): boolean {
    const path = this.getPath(key);
    try {
      return require('fs').statSync(path).isFile();
    } catch {
      return false;
    }
  }

  delete(key: string): boolean {
    const path = this.getPath(key);
    try {
      require('fs').unlinkSync(path);
      this.index.delete(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(): void {
    for (const key of this.index.keys()) {
      this.delete(key);
    }
    this.index.clear();
  }

  size(): number {
    return this.index.size;
  }

  private enforceMaxSize(): void {
    let totalSize = 0;
    for (const info of this.index.values()) {
      totalSize += info.size;
    }

    // If over limit, evict oldest files
    while (totalSize > this.maxSizeBytes && this.index.size > 0) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, info] of this.index) {
        if (info.mtime < oldestTime) {
          oldestTime = info.mtime;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        const info = this.index.get(oldestKey)!;
        totalSize -= info.size;
        this.delete(oldestKey);
      }
    }
  }
}
