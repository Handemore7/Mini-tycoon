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
                arenaWins: gameData.arenaWins
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
                const blob = new Blob([saveData], { type: 'application/json' });
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

    // Import save data from file
    importSave(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const saveData = JSON.parse(e.target.result);
                    localStorage.setItem('miniTycoonSave', JSON.stringify(saveData));
                    this.applySaveData(saveData);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
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