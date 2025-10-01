class GameData {
    constructor() {
        // Initialize with defaults
        this.playerName = '';
        this.twitchStreamer = 'your_streamer_name';
        this.volume = 0.5;
        this.money = 100;
        this.stats = {
            health: 100,
            maxHealth: 100,
            damage: 10,
            attackSpeed: 1,
            moveSpeed: 100,
            armor: 0
        };
        this.inventory = { sword: 0, shield: 0 };
        this.decorations = [];
        this.upgrades = { boots: 0, passiveIncome: 0, activeIncome: 0 };
        this.passiveIncome = 1;
        this.chatBonus = 10;
        this.chatStreak = 0;
        this.lastChatDate = null;
        this.arenaWins = 0;
        this.decorationInventory = {};
        this.healthPotions = 0;
        
        // Load saved data if available
        this.loadGame();
    }

    loadGame() {
        // Try to load from new save system first
        const mainSave = localStorage.getItem('miniTycoonSave');
        if (mainSave) {
            try {
                const saveData = JSON.parse(mainSave);
                this.applySaveData(saveData);
                return;
            } catch (error) {
                console.error('Failed to load main save:', error);
            }
        }
        
        // Try backups
        for (let i = 1; i <= 3; i++) {
            const backup = localStorage.getItem(`miniTycoonBackup${i}`);
            if (backup) {
                try {
                    const saveData = JSON.parse(backup);
                    this.applySaveData(saveData);
                    return;
                } catch (error) {
                    console.error(`Failed to load backup ${i}:`, error);
                }
            }
        }
        
        // Fallback to old localStorage method
        this.playerName = localStorage.getItem('playerName') || '';
        this.twitchStreamer = localStorage.getItem('twitchStreamer') || 'your_streamer_name';
        this.volume = parseFloat(localStorage.getItem('volume')) || 0.5;
        this.money = parseInt(localStorage.getItem('money')) || 100;
        this.stats = JSON.parse(localStorage.getItem('stats')) || this.stats;
        this.inventory = JSON.parse(localStorage.getItem('inventory')) || { sword: 0, shield: 0 };
        this.decorations = JSON.parse(localStorage.getItem('decorations')) || [];
        this.upgrades = JSON.parse(localStorage.getItem('upgrades')) || { boots: 0, passiveIncome: 0, activeIncome: 0 };
        this.passiveIncome = parseInt(localStorage.getItem('passiveIncome')) || 1;
        this.chatBonus = parseInt(localStorage.getItem('chatBonus')) || 10;
        this.chatStreak = parseInt(localStorage.getItem('chatStreak')) || 0;
        this.lastChatDate = localStorage.getItem('lastChatDate') || null;
        this.arenaWins = parseInt(localStorage.getItem('arenaWins')) || 0;
    }

    applySaveData(saveData) {
        this.playerName = saveData.playerName || '';
        this.twitchStreamer = saveData.twitchStreamer || 'your_streamer_name';
        this.volume = saveData.volume || 0.5;
        this.money = saveData.money || 100;
        this.stats = saveData.stats || this.stats;
        this.inventory = saveData.inventory || { sword: 0, shield: 0 };
        this.decorations = saveData.decorations || [];
        this.upgrades = saveData.upgrades || { boots: 0, passiveIncome: 0, activeIncome: 0 };
        this.passiveIncome = saveData.passiveIncome || 1;
        this.chatBonus = saveData.chatBonus || 10;
        this.chatStreak = saveData.chatStreak || 0;
        this.lastChatDate = saveData.lastChatDate || null;
        this.arenaWins = saveData.arenaWins || 0;
        this.decorationInventory = saveData.decorationInventory || {};
        this.healthPotions = saveData.healthPotions || 0;
    }

    async save() {
        if (window.database && this.playerName) {
            await window.database.savePlayer(this.playerName, this.getSaveData());
        } else if (typeof saveSystem !== 'undefined') {
            saveSystem.saveGame();
        } else {
            // Fallback to localStorage
            localStorage.setItem('playerName', this.playerName);
            localStorage.setItem('twitchStreamer', this.twitchStreamer);
            localStorage.setItem('volume', this.volume.toString());
            localStorage.setItem('money', this.money.toString());
            localStorage.setItem('stats', JSON.stringify(this.stats));
            localStorage.setItem('inventory', JSON.stringify(this.inventory));
            localStorage.setItem('decorations', JSON.stringify(this.decorations));
        }
    }

    getSaveData() {
        return {
            playerName: this.playerName || '',
            twitchStreamer: this.twitchStreamer || 'your_streamer_name',
            volume: this.volume || 0.5,
            money: this.money || 100,
            stats: this.stats || {},
            inventory: this.inventory || {},
            decorations: this.decorations || [],
            upgrades: this.upgrades || {},
            passiveIncome: this.passiveIncome || 1,
            chatBonus: this.chatBonus || 10,
            chatStreak: this.chatStreak || 0,
            lastChatDate: this.lastChatDate || null,
            arenaWins: this.arenaWins || 0,
            decorationInventory: this.decorationInventory || {},
            healthPotions: this.healthPotions || 0
        };
    }

    async loadFromDatabase(playerName) {
        if (window.database) {
            const saveData = await window.database.loadPlayer(playerName);
            if (saveData) {
                this.applySaveData(saveData);
                return true;
            }
        }
        return false;
    }

    addMoney(amount) {
        this.money += amount;
        if (typeof saveSystem !== 'undefined') {
            saveSystem.debouncedSave();
        }
    }

    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            if (typeof saveSystem !== 'undefined') {
                saveSystem.debouncedSave();
            }
            return true;
        }
        return false;
    }

    updateStats(newStats) {
        Object.assign(this.stats, newStats);
        if (typeof saveSystem !== 'undefined') {
            saveSystem.immediateSave();
        }
    }

    updateInventory(item, tier) {
        this.inventory[item] = tier;
        if (typeof saveSystem !== 'undefined') {
            saveSystem.immediateSave();
        }
    }

    updateSettings(settings) {
        Object.assign(this, settings);
        if (typeof saveSystem !== 'undefined') {
            saveSystem.immediateSave();
        }
    }
}

const gameData = new GameData();