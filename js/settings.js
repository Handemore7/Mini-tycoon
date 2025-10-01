class SettingsMenu {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.createMenu();
    }

    createMenu() {
        // Background
        this.background = this.scene.add.rectangle(400, 300, 400, 300, 0x000000, 0.8);
        this.background.setVisible(false);

        // Title
        this.title = this.scene.add.text(400, 200, 'SETTINGS', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setVisible(false);

        // Player name input (simulated)
        this.nameLabel = this.scene.add.text(400, 240, `Player Name: ${gameData.playerName}`, {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setVisible(false);

        // Twitch streamer
        this.streamerLabel = this.scene.add.text(400, 270, `Twitch Streamer: ${gameData.twitchStreamer}`, {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setVisible(false);

        // Volume
        this.volumeLabel = this.scene.add.text(400, 300, `Volume: ${Math.round(gameData.volume * 100)}%`, {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setVisible(false);

        // Save info
        this.saveInfo = this.scene.add.text(400, 330, this.getSaveInfoText(), {
            fontSize: '12px',
            fill: '#cccccc'
        }).setOrigin(0.5).setVisible(false);

        // Export button
        this.exportButton = this.scene.add.text(280, 370, 'EXPORT', {
            fontSize: '12px',
            fill: '#ffaa00',
            backgroundColor: '#333333',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.exportButton.on('pointerdown', () => this.exportSave());

        // Delete button
        this.deleteButton = this.scene.add.text(360, 370, 'DELETE DATA', {
            fontSize: '12px',
            fill: '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.deleteButton.on('pointerdown', () => this.confirmDelete());

        // Save & Close button
        this.saveButton = this.scene.add.text(480, 370, 'SAVE & CLOSE', {
            fontSize: '12px',
            fill: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.saveButton.on('pointerdown', () => this.close());

        this.elements = [this.background, this.title, this.nameLabel, this.streamerLabel, 
                        this.volumeLabel, this.saveInfo, this.exportButton, this.deleteButton, this.saveButton];
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.elements.forEach(element => {
            element.setVisible(this.isOpen);
            if (this.isOpen) {
                element.setDepth(2000);
            }
        });
        
        if (this.isOpen) {
            this.scene.physics.pause();
        } else {
            this.scene.physics.resume();
        }
    }

    close() {
        gameData.save();
        this.isOpen = false;
        this.elements.forEach(element => element.setVisible(false));
        this.scene.physics.resume();
    }

    getSaveInfoText() {
        if (typeof saveSystem !== 'undefined') {
            const info = saveSystem.getSaveInfo();
            if (info) {
                return `Last saved: ${info.lastSaved}\nBackups: ${info.hasBackups ? 'Available' : 'None'}`;
            }
        }
        return 'Auto-save: Every 10 seconds';
    }

    exportSave() {
        if (typeof saveSystem !== 'undefined') {
            if (saveSystem.exportSave()) {
                this.showMessage('Save exported successfully!', '#00ff00');
            }
        }
    }

    confirmDelete() {
        // Create confirmation dialog
        this.confirmBg = this.scene.add.rectangle(400, 300, 300, 150, 0x000000, 0.9);
        this.confirmBg.setDepth(3000);
        
        this.confirmText = this.scene.add.text(400, 270, 'Delete all game data?\nThis cannot be undone!', {
            fontSize: '14px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(3000);
        
        this.confirmYes = this.scene.add.text(350, 320, 'YES', {
            fontSize: '14px',
            fill: '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(3000).setInteractive();
        this.confirmYes.on('pointerdown', () => this.deleteData());
        
        this.confirmNo = this.scene.add.text(450, 320, 'NO', {
            fontSize: '14px',
            fill: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(3000).setInteractive();
        this.confirmNo.on('pointerdown', () => this.cancelDelete());
    }

    async deleteData() {
        this.cancelDelete();
        this.showMessage('Deleting data...', '#ff0000');
        
        // Delete from database
        if (window.database && gameData.playerName) {
            await window.database.deletePlayer(gameData.playerName);
        }
        
        // Clear ALL localStorage keys
        localStorage.clear();
        
        // Reset gameData object to defaults
        Object.assign(gameData, {
            playerName: '',
            twitchStreamer: 'your_streamer_name',
            volume: 0.5,
            money: 100,
            stats: { health: 100, maxHealth: 100, damage: 10, attackSpeed: 1, moveSpeed: 100, armor: 0 },
            inventory: { sword: 0, shield: 0 },
            decorations: [],
            upgrades: { boots: 0, passiveIncome: 0, activeIncome: 0 },
            passiveIncome: 1,
            chatBonus: 10,
            chatStreak: 0,
            lastChatDate: null,
            arenaWins: 0,
            decorationInventory: {},
            healthPotions: 0
        });
        
        this.showMessage('All data deleted! Restarting...', '#00ff00');
        
        // Auto-reload after successful deletion
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    cancelDelete() {
        if (this.confirmBg) this.confirmBg.destroy();
        if (this.confirmText) this.confirmText.destroy();
        if (this.confirmYes) this.confirmYes.destroy();
        if (this.confirmNo) this.confirmNo.destroy();
    }

    showMessage(text, color) {
        const message = this.scene.add.text(400, 420, text, {
            fontSize: '12px',
            fill: color,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(2500);
        
        this.scene.time.delayedCall(3000, () => message.destroy());
    }
}