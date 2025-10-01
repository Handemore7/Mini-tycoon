class StateManager {
    constructor() {
        this.state = {
            player: {
                name: '',
                position: { x: 400, y: 300 },
                stats: {
                    health: 100,
                    maxHealth: 100,
                    damage: 10,
                    attackSpeed: 1,
                    moveSpeed: 100,
                    armor: 0,
                    criticalChance: 10
                }
            },
            game: {
                money: 100,
                volume: 0.5,
                twitchStreamer: 'your_streamer_name',
                passiveIncome: 1,
                chatBonus: 10,
                chatStreak: 0,
                lastChatDate: null,
                arenaWins: 0,
                bestArenaWave: 0,
                healthPotions: 0,
                lastSaveTime: Date.now()
            },
            inventory: {
                sword: 0,
                shield: 0,
                decorationInventory: {}
            },
            progression: {
                upgrades: { boots: 0, passiveIncome: 0, activeIncome: 0 },
                achievements: {},
                decorations: [],
                unlockedDecorations: {}
            }
        };
        
        this.listeners = new Map();
        this.actionQueue = [];
        this.rateLimiter = new Map();
    }

    // State getters
    getPlayer() { return this.state.player; }
    getGame() { return this.state.game; }
    getInventory() { return this.state.inventory; }
    getProgression() { return this.state.progression; }

    // State setters with validation and rate limiting
    updatePlayer(updates) {
        if (this.isRateLimited('player_update')) return false;
        
        this.validatePlayerData(updates);
        Object.assign(this.state.player, updates);
        this.notifyListeners('player', this.state.player);
        this.queueSave();
        return true;
    }

    updateGame(updates) {
        if (this.isRateLimited('game_update')) return false;
        
        this.validateGameData(updates);
        Object.assign(this.state.game, updates);
        this.notifyListeners('game', this.state.game);
        this.queueSave();
        return true;
    }

    updateInventory(updates) {
        Object.assign(this.state.inventory, updates);
        this.notifyListeners('inventory', this.state.inventory);
        this.queueSave();
        return true;
    }

    updateProgression(updates) {
        Object.assign(this.state.progression, updates);
        this.notifyListeners('progression', this.state.progression);
        this.queueSave();
        return true;
    }

    // Rate limiting
    isRateLimited(action) {
        const now = Date.now();
        const lastAction = this.rateLimiter.get(action) || 0;
        const cooldown = this.getRateLimitCooldown(action);
        
        if (now - lastAction < cooldown) {
            window.errorLogger?.warn(`Rate limited: ${action}`);
            return true;
        }
        
        this.rateLimiter.set(action, now);
        return false;
    }

    getRateLimitCooldown(action) {
        const cooldowns = {
            'player_update': 100,
            'game_update': 50,
            'money_add': 10,
            'save_action': 1000
        };
        return cooldowns[action] || 100;
    }

    // Data validation
    validatePlayerData(data) {
        if (data.name && !/^[a-zA-Z0-9_]{3,20}$/.test(data.name)) {
            throw new Error('Invalid player name format');
        }
        if (data.position && (typeof data.position.x !== 'number' || typeof data.position.y !== 'number')) {
            throw new Error('Invalid position data');
        }
    }

    validateGameData(data) {
        if (data.money && (typeof data.money !== 'number' || data.money < 0)) {
            throw new Error('Invalid money value');
        }
        if (data.volume && (data.volume < 0 || data.volume > 1)) {
            throw new Error('Invalid volume value');
        }
    }

    // Event system
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        return () => this.listeners.get(event)?.delete(callback);
    }

    notifyListeners(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    window.errorLogger?.error(`Listener error for ${event}:`, error);
                }
            });
        }
    }

    // Action queue for batch operations
    queueAction(action) {
        this.actionQueue.push({
            action,
            timestamp: Date.now()
        });
        
        if (this.actionQueue.length > 100) {
            this.actionQueue = this.actionQueue.slice(-50);
        }
    }

    queueSave() {
        if (this.isRateLimited('save_action')) return;
        
        this.queueAction('save');
        if (typeof saveSystem !== 'undefined') {
            saveSystem.debouncedSave();
        }
    }

    // Memory management
    cleanup() {
        this.listeners.clear();
        this.actionQueue = [];
        this.rateLimiter.clear();
    }

    // Legacy compatibility methods
    addMoney(amount) {
        if (typeof amount !== 'number' || amount <= 0) return false;
        
        const currentMoney = this.state.game.money;
        this.updateGame({ money: currentMoney + amount });
        this.queueAction(`add_money:${amount}`);
        return true;
    }

    spendMoney(amount) {
        if (typeof amount !== 'number' || amount <= 0) return false;
        
        const currentMoney = this.state.game.money;
        if (currentMoney < amount) return false;
        
        this.updateGame({ money: currentMoney - amount });
        this.queueAction(`spend_money:${amount}`);
        return true;
    }

    updatePlayerPosition(x, y) {
        this.updatePlayer({ position: { x, y } });
    }

    // Export/Import for save system
    exportState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    importState(newState) {
        try {
            this.validateImportedState(newState);
            this.state = { ...this.state, ...newState };
            this.notifyListeners('state_imported', this.state);
            return true;
        } catch (error) {
            window.errorLogger?.error('State import failed:', error);
            return false;
        }
    }

    validateImportedState(state) {
        const required = ['player', 'game', 'inventory', 'progression'];
        for (const key of required) {
            if (!state[key]) {
                throw new Error(`Missing required state: ${key}`);
            }
        }
    }
}

// Create global instance
window.stateManager = new StateManager();