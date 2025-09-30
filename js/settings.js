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
        this.exportButton = this.scene.add.text(320, 370, 'EXPORT SAVE', {
            fontSize: '14px',
            fill: '#ffaa00',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.exportButton.on('pointerdown', () => this.exportSave());

        // Save & Close button
        this.saveButton = this.scene.add.text(480, 370, 'SAVE & CLOSE', {
            fontSize: '14px',
            fill: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.saveButton.on('pointerdown', () => this.close());

        this.elements = [this.background, this.title, this.nameLabel, this.streamerLabel, 
                        this.volumeLabel, this.saveInfo, this.exportButton, this.saveButton];
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.elements.forEach(element => element.setVisible(this.isOpen));
        
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
                // Show success message
                const message = this.scene.add.text(400, 420, 'Save exported successfully!', {
                    fontSize: '12px',
                    fill: '#00ff00',
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 }
                }).setOrigin(0.5);
                
                this.scene.time.delayedCall(2000, () => message.destroy());
            }
        }
    }
}