class MemoryManager {
    constructor() {
        this.trackedObjects = new WeakMap();
        this.activeTimers = new Set();
        this.activeListeners = new Map();
        this.textureCache = new Map();
        this.cleanupTasks = [];
        this.memoryThreshold = 50 * 1024 * 1024; // 50MB
        
        this.startMemoryMonitoring();
    }

    // Timer management
    createTimer(scene, config) {
        const timer = scene.time.addEvent(config);
        this.activeTimers.add(timer);
        
        // Auto-cleanup when timer completes
        const originalCallback = config.callback;
        timer.callback = (...args) => {
            try {
                if (originalCallback) originalCallback(...args);
            } finally {
                if (!config.loop) {
                    this.activeTimers.delete(timer);
                }
            }
        };
        
        return timer;
    }

    destroyTimer(timer) {
        if (timer && timer.destroy) {
            timer.destroy();
            this.activeTimers.delete(timer);
        }
    }

    // Event listener management
    addListener(target, event, callback, context) {
        const key = `${target.constructor.name}_${event}`;
        
        if (!this.activeListeners.has(key)) {
            this.activeListeners.set(key, []);
        }
        
        const listener = { target, event, callback, context };
        this.activeListeners.get(key).push(listener);
        
        target.on(event, callback, context);
        
        return () => this.removeListener(target, event, callback, context);
    }

    removeListener(target, event, callback, context) {
        const key = `${target.constructor.name}_${event}`;
        const listeners = this.activeListeners.get(key);
        
        if (listeners) {
            const index = listeners.findIndex(l => 
                l.target === target && l.event === event && l.callback === callback
            );
            
            if (index !== -1) {
                listeners.splice(index, 1);
                if (listeners.length === 0) {
                    this.activeListeners.delete(key);
                }
            }
        }
        
        if (target && target.off) {
            target.off(event, callback, context);
        }
    }

    // Texture management
    cacheTexture(key, texture) {
        this.textureCache.set(key, {
            texture,
            lastUsed: Date.now(),
            useCount: 1
        });
    }

    getTexture(key) {
        const cached = this.textureCache.get(key);
        if (cached) {
            cached.lastUsed = Date.now();
            cached.useCount++;
            return cached.texture;
        }
        return null;
    }

    cleanupUnusedTextures() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        for (const [key, data] of this.textureCache.entries()) {
            if (now - data.lastUsed > maxAge && data.useCount < 5) {
                if (data.texture && data.texture.destroy) {
                    data.texture.destroy();
                }
                this.textureCache.delete(key);
                window.errorLogger?.debug(`Cleaned up unused texture: ${key}`);
            }
        }
    }

    // Object tracking
    trackObject(obj, type = 'unknown') {
        this.trackedObjects.set(obj, {
            type,
            created: Date.now(),
            size: this.estimateObjectSize(obj)
        });
    }

    estimateObjectSize(obj) {
        try {
            return JSON.stringify(obj).length * 2; // Rough estimate
        } catch {
            return 1000; // Default estimate for non-serializable objects
        }
    }

    // Memory monitoring
    startMemoryMonitoring() {
        setInterval(() => {
            this.checkMemoryUsage();
            this.cleanupUnusedTextures();
            this.runCleanupTasks();
        }, 30000); // Every 30 seconds
    }

    checkMemoryUsage() {
        if (!performance.memory) return;
        
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        
        window.errorLogger?.trackPerformance('memoryUsage', used);
        
        if (used > this.memoryThreshold) {
            window.errorLogger?.warn(`High memory usage: ${(used / 1024 / 1024).toFixed(2)}MB`);
            this.forceCleanup();
        }
        
        // Log memory stats
        window.errorLogger?.debug(`Memory: ${(used/1024/1024).toFixed(2)}MB / ${(total/1024/1024).toFixed(2)}MB (${(limit/1024/1024).toFixed(2)}MB limit)`);
    }

    // Cleanup management
    addCleanupTask(task, priority = 0) {
        this.cleanupTasks.push({ task, priority });
        this.cleanupTasks.sort((a, b) => b.priority - a.priority);
    }

    runCleanupTasks() {
        const tasksToRun = this.cleanupTasks.splice(0, 5); // Run max 5 tasks per cycle
        
        tasksToRun.forEach(({ task }) => {
            try {
                task();
            } catch (error) {
                window.errorLogger?.error('Cleanup task failed:', error);
            }
        });
    }

    forceCleanup() {
        window.errorLogger?.info('Running forced memory cleanup');
        
        // Clean up all timers
        this.activeTimers.forEach(timer => {
            if (timer && timer.destroy) {
                timer.destroy();
            }
        });
        this.activeTimers.clear();
        
        // Clean up all listeners
        this.activeListeners.forEach(listeners => {
            listeners.forEach(({ target, event, callback, context }) => {
                if (target && target.off) {
                    target.off(event, callback, context);
                }
            });
        });
        this.activeListeners.clear();
        
        // Clean up textures
        this.textureCache.forEach((data, key) => {
            if (data.texture && data.texture.destroy) {
                data.texture.destroy();
            }
        });
        this.textureCache.clear();
        
        // Run all cleanup tasks
        this.cleanupTasks.forEach(({ task }) => {
            try {
                task();
            } catch (error) {
                window.errorLogger?.error('Force cleanup task failed:', error);
            }
        });
        this.cleanupTasks = [];
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        window.errorLogger?.info('Forced cleanup completed');
    }

    // Scene cleanup helper
    cleanupScene(scene) {
        // Remove scene-specific timers
        this.activeTimers.forEach(timer => {
            if (timer.scene === scene) {
                timer.destroy();
                this.activeTimers.delete(timer);
            }
        });
        
        // Remove scene-specific listeners
        this.activeListeners.forEach((listeners, key) => {
            const sceneListeners = listeners.filter(l => l.target.scene === scene);
            sceneListeners.forEach(({ target, event, callback, context }) => {
                this.removeListener(target, event, callback, context);
            });
        });
        
        window.errorLogger?.debug(`Cleaned up scene: ${scene.scene.key}`);
    }

    // Get memory stats
    getMemoryStats() {
        return {
            activeTimers: this.activeTimers.size,
            activeListeners: Array.from(this.activeListeners.values()).reduce((sum, arr) => sum + arr.length, 0),
            cachedTextures: this.textureCache.size,
            cleanupTasks: this.cleanupTasks.length,
            memoryUsage: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    // Destroy manager
    destroy() {
        this.forceCleanup();
        this.trackedObjects = new WeakMap();
    }
}

// Create global instance
window.memoryManager = new MemoryManager();