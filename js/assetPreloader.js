class AssetPreloader {
    constructor() {
        this.loadQueue = [];
        this.loadedAssets = new Map();
        this.loadingPromises = new Map();
        this.preloadConfig = {
            images: {
                priority: 1,
                maxConcurrent: 4
            },
            audio: {
                priority: 2,
                maxConcurrent: 2
            },
            data: {
                priority: 3,
                maxConcurrent: 2
            }
        };
        this.isPreloading = false;
        this.loadProgress = 0;
    }

    // Add assets to preload queue
    queueAsset(type, key, url, priority = 0) {
        if (this.loadedAssets.has(key)) {
            return Promise.resolve(this.loadedAssets.get(key));
        }

        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }

        const asset = {
            type,
            key,
            url,
            priority: priority || this.preloadConfig[type]?.priority || 0,
            size: 0,
            loaded: false
        };

        this.loadQueue.push(asset);
        this.loadQueue.sort((a, b) => b.priority - a.priority);

        const promise = new Promise((resolve, reject) => {
            asset.resolve = resolve;
            asset.reject = reject;
        });

        this.loadingPromises.set(key, promise);
        return promise;
    }

    // Preload critical assets
    preloadCriticalAssets() {
        const criticalAssets = [
            // Player sprites
            { type: 'image', key: 'player_south', url: 'assets/sprites/player/rotations/south.png', priority: 10 },
            { type: 'image', key: 'player_north', url: 'assets/sprites/player/rotations/north.png', priority: 10 },
            { type: 'image', key: 'player_east', url: 'assets/sprites/player/rotations/east.png', priority: 10 },
            { type: 'image', key: 'player_west', url: 'assets/sprites/player/rotations/west.png', priority: 10 },
            
            // Buildings
            { type: 'image', key: 'store_building', url: 'assets/sprites/buildings/store.png', priority: 9 },
            { type: 'image', key: 'upgrades_building', url: 'assets/sprites/buildings/upgrades.png', priority: 9 },
            { type: 'image', key: 'decoration_building', url: 'assets/sprites/buildings/decoration.png', priority: 9 },
            { type: 'image', key: 'arena_building', url: 'assets/sprites/buildings/arena.png', priority: 9 },
            
            // Background
            { type: 'image', key: 'background', url: 'assets/sprites/background.png', priority: 8 }
        ];

        criticalAssets.forEach(asset => {
            this.queueAsset(asset.type, asset.key, asset.url, asset.priority);
        });

        return this.startPreloading();
    }

    // Preload walking animations
    preloadWalkingAnimations() {
        const directions = ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'];
        
        directions.forEach(dir => {
            for (let i = 0; i < 8; i++) {
                this.queueAsset(
                    'image',
                    `walk_${dir}_${i}`,
                    `assets/sprites/player/animations/walking/${dir}/frame_00${i}.png`,
                    5
                );
            }
        });
    }

    // Start preloading process
    async startPreloading() {
        if (this.isPreloading) {
            return;
        }

        this.isPreloading = true;
        this.loadProgress = 0;

        window.errorLogger?.info(`Starting preload of ${this.loadQueue.length} assets`);

        const startTime = performance.now();
        const totalAssets = this.loadQueue.length;
        let loadedCount = 0;

        // Process queue with concurrency limits
        const workers = [];
        const maxWorkers = 6;

        for (let i = 0; i < Math.min(maxWorkers, this.loadQueue.length); i++) {
            workers.push(this.processLoadQueue());
        }

        // Wait for all workers to complete
        await Promise.all(workers);

        const endTime = performance.now();
        const loadTime = endTime - startTime;

        this.isPreloading = false;
        this.loadProgress = 100;

        window.errorLogger?.info(`Preloading completed: ${totalAssets} assets in ${loadTime.toFixed(2)}ms`);
        window.errorLogger?.trackPerformance('assetLoadTime', loadTime);

        // Dispatch completion event
        window.dispatchEvent(new CustomEvent('assetsPreloaded', {
            detail: { totalAssets, loadTime }
        }));
    }

    // Process load queue worker
    async processLoadQueue() {
        while (this.loadQueue.length > 0) {
            const asset = this.loadQueue.shift();
            if (!asset) break;

            try {
                await this.loadAsset(asset);
                this.updateProgress();
            } catch (error) {
                window.errorLogger?.error(`Failed to load asset ${asset.key}:`, error);
                asset.reject(error);
            }
        }
    }

    // Load individual asset
    async loadAsset(asset) {
        const startTime = performance.now();

        try {
            let loadedAsset;

            switch (asset.type) {
                case 'image':
                    loadedAsset = await this.loadImage(asset.url);
                    break;
                case 'audio':
                    loadedAsset = await this.loadAudio(asset.url);
                    break;
                case 'data':
                    loadedAsset = await this.loadData(asset.url);
                    break;
                default:
                    throw new Error(`Unknown asset type: ${asset.type}`);
            }

            const loadTime = performance.now() - startTime;
            asset.size = this.estimateAssetSize(loadedAsset);
            asset.loaded = true;

            this.loadedAssets.set(asset.key, loadedAsset);
            this.loadingPromises.delete(asset.key);

            window.errorLogger?.debug(`Loaded ${asset.key} in ${loadTime.toFixed(2)}ms`);
            asset.resolve(loadedAsset);

            return loadedAsset;
        } catch (error) {
            asset.reject(error);
            throw error;
        }
    }

    // Load image
    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Cache in memory manager if available
                if (window.memoryManager) {
                    window.memoryManager.cacheTexture(url, img);
                }
                resolve(img);
            };
            
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    // Load audio
    loadAudio(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
            
            audio.src = url;
            audio.load();
        });
    }

    // Load data (JSON, etc.)
    async loadData(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load data: ${url} (${response.status})`);
        }
        return await response.json();
    }

    // Estimate asset size
    estimateAssetSize(asset) {
        if (asset instanceof Image) {
            return asset.width * asset.height * 4; // RGBA
        } else if (asset instanceof Audio) {
            return asset.duration * 44100 * 2; // Rough estimate
        } else if (typeof asset === 'object') {
            return JSON.stringify(asset).length;
        }
        return 1000; // Default estimate
    }

    // Update progress
    updateProgress() {
        const totalAssets = this.loadedAssets.size + this.loadQueue.length + this.loadingPromises.size;
        const loadedAssets = this.loadedAssets.size;
        
        this.loadProgress = totalAssets > 0 ? (loadedAssets / totalAssets) * 100 : 0;
        
        // Dispatch progress event
        window.dispatchEvent(new CustomEvent('assetLoadProgress', {
            detail: { progress: this.loadProgress, loaded: loadedAssets, total: totalAssets }
        }));
    }

    // Get loaded asset
    getAsset(key) {
        return this.loadedAssets.get(key);
    }

    // Check if asset is loaded
    isAssetLoaded(key) {
        return this.loadedAssets.has(key);
    }

    // Get loading progress
    getProgress() {
        return this.loadProgress;
    }

    // Clear cache
    clearCache() {
        this.loadedAssets.clear();
        this.loadingPromises.clear();
        this.loadQueue = [];
        window.errorLogger?.info('Asset cache cleared');
    }

    // Get cache stats
    getCacheStats() {
        const totalSize = Array.from(this.loadedAssets.values())
            .reduce((sum, asset) => sum + this.estimateAssetSize(asset), 0);

        return {
            loadedAssets: this.loadedAssets.size,
            queuedAssets: this.loadQueue.length,
            loadingAssets: this.loadingPromises.size,
            totalSize: totalSize,
            progress: this.loadProgress
        };
    }
}

// Create global instance
window.assetPreloader = new AssetPreloader();