class SaveSystem {
    constructor() {
        this.maxBackups = 3;
        this.lastSaveTime = Date.now();
        this.saveDebounceTimer = null;
        this.saveDebounceDelay = 2000; // 2 seconds
        
        this.setupBeforeUnload();
    }

    // Main save function - saves all game data
    saveGame() {
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                playerName: gameData.playerName,
                twitchStreamer: gameData.twitchStreamer,
                volume: gameData.volume,
                money: gameData.money,
                stats: gameData.stats,
                inventory: gameData.inventory,
                decorations: gameData.decorations,
                upgrades: gameData.upgrades,
                passiveIncome: gameData.passiveIncome,
                chatBonus: gameData.chatBonus,
                chatStreak: gameData.chatStreak,
                lastChatDate: gameData.lastChatDate,
                arenaWins: gameData.arenaWins,
                decorationInventory: gameData.decorationInventory,
                healthPotions: gameData.healthPotions,
                bestArenaWave: gameData.bestArenaWave,
                playerPosition: gameData.playerPosition,
                achievements: gameData.achievements
            };

            // Save main game data
            localStorage.setItem('miniTycoonSave', JSON.stringify(saveData));
            
            // Create backup
            this.createBackup(saveData);
            
            this.lastSaveTime = Date.now();
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        }
    }

    // Load game data with fallback to backups
    loadGame() {
        try {
            // Try main save first
            let saveData = this.loadFromKey('miniTycoonSave');
            
            // If main save fails, try backups
            if (!saveData) {
                for (let i = 1; i <= this.maxBackups; i++) {
                    saveData = this.loadFromKey(`miniTycoonBackup${i}`);
                    if (saveData) break;
                }
            }

            if (saveData) {
                this.applySaveData(saveData);
                return true;
            }
        } catch (error) {
            console.error('Load failed:', error);
        }
        return false;
    }

    loadFromKey(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    applySaveData(saveData) {
        gameData.playerName = saveData.playerName || '';
        gameData.twitchStreamer = saveData.twitchStreamer || 'Handemore7';
        gameData.volume = saveData.volume || 0.5;
        gameData.money = saveData.money || 100;
        gameData.stats = saveData.stats || {
            health: 100,
            maxHealth: 100,
            damage: 10,
            attackSpeed: 1,
            moveSpeed: 100,
            armor: 0
        };
        gameData.inventory = saveData.inventory || { sword: 0, shield: 0 };
        gameData.decorations = saveData.decorations || [];
        gameData.upgrades = saveData.upgrades || { boots: 0, passiveIncome: 0, activeIncome: 0 };
        gameData.passiveIncome = saveData.passiveIncome || 1;
        gameData.chatBonus = saveData.chatBonus || 10;
        gameData.chatStreak = saveData.chatStreak || 0;
        gameData.lastChatDate = saveData.lastChatDate || null;
        gameData.arenaWins = saveData.arenaWins || 0;
        gameData.decorationInventory = saveData.decorationInventory || {};
        gameData.healthPotions = saveData.healthPotions || 0;
        gameData.bestArenaWave = saveData.bestArenaWave || 0;
        gameData.playerPosition = saveData.playerPosition || { x: 400, y: 300 };
        gameData.achievements = saveData.achievements || {};
    }

    // Create rotating backups
    createBackup(saveData) {
        try {
            // Shift existing backups
            for (let i = this.maxBackups; i > 1; i--) {
                const prevBackup = localStorage.getItem(`miniTycoonBackup${i-1}`);
                if (prevBackup) {
                    localStorage.setItem(`miniTycoonBackup${i}`, prevBackup);
                }
            }
            
            // Create new backup
            localStorage.setItem('miniTycoonBackup1', JSON.stringify(saveData));
        } catch (error) {
            console.error('Backup creation failed:', error);
        }
    }

    // Debounced save - only saves after 2 seconds of no activity
    debouncedSave() {
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
        
        this.saveDebounceTimer = setTimeout(() => {
            this.saveGame();
        }, this.saveDebounceDelay);
    }

    // Immediate save for critical actions
    immediateSave() {
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
        this.saveGame();
    }

    // Save when browser closes
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });
    }

    // Export save data as downloadable file
    exportSave() {
        try {
            const saveData = localStorage.getItem('miniTycoonSave');
            if (saveData) {
                // Sanitize save data before export
                const parsedData = JSON.parse(saveData);
                const sanitizedData = this.sanitizeSaveData(parsedData);
                const sanitizedJson = JSON.stringify(sanitizedData);
                
                const blob = new Blob([sanitizedJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mini-tycoon-save-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                return true;
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
        return false;
    }
    
    sanitizeSaveData(data) {
        const sanitized = JSON.parse(JSON.stringify(data));
        // Remove any potentially dangerous properties
        if (sanitized.playerName) {
            sanitized.playerName = sanitized.playerName.replace(/[<>"'&]/g, '');
        }
        if (sanitized.twitchStreamer) {
            sanitized.twitchStreamer = sanitized.twitchStreamer.replace(/[<>"'&]/g, '');
        }
        return sanitized;
    }

    // Import save data from file
    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    // Validate and sanitize imported data
                    const sanitizedData = this.validateImportData(saveData);
                    if (!sanitizedData) {
                        reject(new Error('Invalid save file format'));
                        return;
                    }
                    localStorage.setItem('miniTycoonSave', JSON.stringify(sanitizedData));
                    this.applySaveData(sanitizedData);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
    
    validateImportData(data) {
        // Basic validation of save file structure
        if (!data || typeof data !== 'object') return null;
        
        // Sanitize string fields
        const sanitized = {
            version: data.version || '1.0',
            timestamp: Date.now(),
            playerName: (data.playerName || '').replace(/[<>"'&]/g, '').substring(0, 20),
            twitchStreamer: (data.twitchStreamer || 'Handemore7').replace(/[<>"'&]/g, '').substring(0, 25),
            volume: Math.max(0, Math.min(1, parseFloat(data.volume) || 0.5)),
            money: Math.max(0, parseInt(data.money) || 100),
            stats: data.stats || {},
            inventory: data.inventory || {},
            decorations: Array.isArray(data.decorations) ? data.decorations : [],
            upgrades: data.upgrades || {},
            passiveIncome: Math.max(1, parseInt(data.passiveIncome) || 1),
            chatBonus: Math.max(10, parseInt(data.chatBonus) || 10),
            chatStreak: Math.max(0, parseInt(data.chatStreak) || 0),
            lastChatDate: data.lastChatDate || null,
            arenaWins: Math.max(0, parseInt(data.arenaWins) || 0),
            decorationInventory: data.decorationInventory || {},
            healthPotions: Math.max(0, parseInt(data.healthPotions) || 0),
            bestArenaWave: Math.max(0, parseInt(data.bestArenaWave) || 0),
            playerPosition: data.playerPosition || { x: 400, y: 300 },
            achievements: data.achievements || {}
        };
        
        return sanitized;
    }

    // Get save info for display
    getSaveInfo() {
        const saveData = this.loadFromKey('miniTycoonSave');
        if (saveData) {
            return {
                playerName: saveData.playerName,
                money: saveData.money,
                lastSaved: new Date(saveData.timestamp).toLocaleString(),
                hasBackups: !!this.loadFromKey('miniTycoonBackup1')
            };
        }
        return null;
    }
}

// Initialize save system
const saveSystem = new SaveSystem();