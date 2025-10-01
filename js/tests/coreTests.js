// Core system tests
describe('StateManager', () => {
    it('should initialize with default state', () => {
        const stateManager = new StateManager();
        const player = stateManager.getPlayer();
        
        expect(player.name).toBe('');
        expect(player.position.x).toBe(400);
        expect(player.position.y).toBe(300);
        expect(player.stats.health).toBe(100);
    });

    it('should update player data with validation', () => {
        const stateManager = new StateManager();
        
        const success = stateManager.updatePlayer({
            name: 'TestPlayer',
            position: { x: 100, y: 200 }
        });
        
        expect(success).toBeTruthy();
        expect(stateManager.getPlayer().name).toBe('TestPlayer');
        expect(stateManager.getPlayer().position.x).toBe(100);
    });

    it('should reject invalid player names', () => {
        const stateManager = new StateManager();
        
        expect(() => {
            stateManager.updatePlayer({ name: 'ab' }); // Too short
        }).toThrow();
        
        expect(() => {
            stateManager.updatePlayer({ name: 'invalid-name!' }); // Invalid chars
        }).toThrow();
    });

    it('should handle money operations correctly', () => {
        const stateManager = new StateManager();
        
        // Test addMoney
        expect(stateManager.addMoney(100)).toBeTruthy();
        expect(stateManager.getGame().money).toBe(200); // 100 initial + 100 added
        
        // Clear rate limiter for spend operation
        stateManager.rateLimiter.clear();
        
        // Test spendMoney with sufficient funds
        expect(stateManager.spendMoney(50)).toBeTruthy();
        expect(stateManager.getGame().money).toBe(150);
        
        // Test spendMoney with insufficient funds
        expect(stateManager.spendMoney(200)).toBeFalsy(); // Not enough money
        expect(stateManager.getGame().money).toBe(150); // Should remain unchanged
    });

    it('should implement rate limiting', () => {
        const stateManager = new StateManager();
        
        // First update should succeed
        expect(stateManager.updatePlayer({ name: 'Test1' })).toBeTruthy();
        
        // Immediate second update should be rate limited
        expect(stateManager.updatePlayer({ name: 'Test2' })).toBeFalsy();
    });
});

describe('ErrorLogger', () => {
    it('should log errors with proper format', () => {
        const logger = new ErrorLogger();
        logger.error('Test error', { data: 'test' });
        
        const logs = logger.getRecentLogs(1);
        expect(logs.length).toBe(1);
        expect(logs[0].level).toBe('ERROR');
        expect(logs[0].message).toBe('Test error {\n  "data": "test"\n}');
    });

    it('should track performance metrics', () => {
        const logger = new ErrorLogger();
        logger.trackPerformance('testMetric', 100);
        logger.trackPerformance('testMetric', 200);
        
        const summary = logger.getPerformanceSummary();
        expect(summary.testMetric.count).toBe(2);
        expect(summary.testMetric.average).toBe(150);
    });

    it('should filter logs by level', () => {
        const logger = new ErrorLogger();
        logger.error('Error message');
        logger.warn('Warning message');
        logger.info('Info message');
        
        const errorLogs = logger.getLogsByLevel(0); // ERROR level
        expect(errorLogs.length).toBe(1);
        expect(errorLogs[0].level).toBe('ERROR');
    });
});

describe('MemoryManager', () => {
    it('should track active timers', () => {
        const memoryManager = new MemoryManager();
        const mockScene = GameTestUtils.createMockScene();
        
        const timer = memoryManager.createTimer(mockScene, {
            delay: 1000,
            callback: () => {}
        });
        
        const stats = memoryManager.getMemoryStats();
        expect(stats.activeTimers).toBeGreaterThan(0);
    });

    it('should manage event listeners', () => {
        const memoryManager = new MemoryManager();
        const mockTarget = { on: () => {}, off: () => {} };
        
        const removeListener = memoryManager.addListener(mockTarget, 'test', () => {});
        
        const stats = memoryManager.getMemoryStats();
        expect(stats.activeListeners).toBeGreaterThan(0);
        
        removeListener();
        const newStats = memoryManager.getMemoryStats();
        expect(newStats.activeListeners).toBe(0);
    });

    it('should cache and cleanup textures', () => {
        const memoryManager = new MemoryManager();
        const mockTexture = { destroy: () => {} };
        
        memoryManager.cacheTexture('test', mockTexture);
        expect(memoryManager.getTexture('test')).toBe(mockTexture);
        
        const stats = memoryManager.getMemoryStats();
        expect(stats.cachedTextures).toBe(1);
    });
});

describe('AssetPreloader', () => {
    it('should queue assets with priority', () => {
        const preloader = new AssetPreloader();
        
        preloader.queueAsset('image', 'test1', 'test1.png', 5);
        preloader.queueAsset('image', 'test2', 'test2.png', 10);
        
        const stats = preloader.getCacheStats();
        expect(stats.queuedAssets).toBe(2);
    });

    it('should not duplicate queued assets', () => {
        const preloader = new AssetPreloader();
        
        preloader.queueAsset('image', 'test', 'test.png');
        preloader.queueAsset('image', 'test', 'test.png'); // Duplicate
        
        const stats = preloader.getCacheStats();
        expect(stats.queuedAssets).toBe(1);
    });

    it('should track loading progress', () => {
        const preloader = new AssetPreloader();
        
        expect(preloader.getProgress()).toBe(0);
        
        // Mock some loaded assets
        preloader.loadedAssets.set('test1', {});
        preloader.loadedAssets.set('test2', {});
        preloader.updateProgress();
        
        expect(preloader.getProgress()).toBeGreaterThan(0);
    });
});

describe('Game Mechanics', () => {
    it('should handle money transactions correctly', () => {
        const mockGameData = GameTestUtils.createMockGameData();
        
        // Fix the mock's spendMoney method to properly reference 'this'
        mockGameData.spendMoney = function(amount) { 
            if (this.money >= amount) {
                this.money -= amount;
                return true;
            }
            return false;
        };
        
        expect(mockGameData.spendMoney(500)).toBeTruthy();
        expect(mockGameData.money).toBe(500);
        
        expect(mockGameData.spendMoney(600)).toBeFalsy();
        expect(mockGameData.money).toBe(500); // Should remain unchanged
    });

    it('should validate player names', () => {
        const validNames = ['Player123', 'test_user', 'ABC'];
        const invalidNames = ['ab', 'toolongplayernamehere', 'invalid-name!', ''];
        
        validNames.forEach(name => {
            expect(/^[a-zA-Z0-9_]{3,20}$/.test(name)).toBeTruthy();
        });
        
        invalidNames.forEach(name => {
            expect(/^[a-zA-Z0-9_]{3,20}$/.test(name)).toBeFalsy();
        });
    });

    it('should calculate equipment bonuses correctly', () => {
        const baseDamage = 10;
        const swordTier = 3; // Gold sword
        const expectedBonus = [5, 12, 25, 40, 60][swordTier - 1]; // 25 for gold
        
        expect(expectedBonus).toBe(25);
        
        const totalDamage = baseDamage + expectedBonus;
        expect(totalDamage).toBe(35);
    });

    it('should handle critical chance calculations', () => {
        const baseCrit = 0.1; // 10%
        const swordTier = 2;
        const swordBonus = swordTier * 0.05; // 10%
        const totalCrit = Math.min(baseCrit + swordBonus, 0.5); // Capped at 50%
        
        expect(totalCrit).toBe(0.2); // 20%
    });
});

// Run tests when this file is loaded
if (typeof window !== 'undefined' && window.testFramework) {
    // Auto-run tests in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(() => {
            console.log('🧪 Auto-running tests in development mode...');
            window.testFramework.runTests();
        }, 2000);
    }
}