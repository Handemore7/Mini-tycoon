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
    }

    save() {
        // Use new save system if available
        if (typeof saveSystem !== 'undefined') {
            saveSystem.saveGame();
        } else {
            // Fallback to old method
            localStorage.setItem('playerName', this.playerName);
            localStorage.setItem('twitchStreamer', this.twitchStreamer);
            localStorage.setItem('volume', this.volume.toString());
            localStorage.setItem('money', this.money.toString());
            localStorage.setItem('stats', JSON.stringify(this.stats));
            localStorage.setItem('inventory', JSON.stringify(this.inventory));
            localStorage.setItem('decorations', JSON.stringify(this.decorations));
        }
    }

    addMoney(amount) {
        this.money += amount;
        this.save();
    }

    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            this.save();
            return true;
        }
        return false;
    }

    updateStats(newStats) {
        Object.assign(this.stats, newStats);
        this.save();
    }

    updateInventory(item, tier) {
        this.inventory[item] = tier;
        this.save();
    }

    updateSettings(settings) {
        Object.assign(this, settings);
        this.save();
    }
}

const gameData = new GameData();