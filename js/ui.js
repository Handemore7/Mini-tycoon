class UI {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
        this.loadTwitchPfp();
    }

    createUI() {
        // Money display with coin icon (top-left)
        this.moneyIcon = this.scene.add.text(20, 20, '🪙', { fontSize: '24px' });
        this.moneyText = this.scene.add.text(50, 25, gameData.money.toString(), {
            fontSize: '18px',
            fill: '#ffff00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0, 0.5);

        // Twitch connection status (top-right)
        this.twitchContainer = this.scene.add.container(750, 30);
        
        // Placeholder for Twitch PFP
        this.twitchPfp = this.scene.add.graphics()
            .fillStyle(0x9146ff)
            .fillCircle(0, 0, 20)
            .setVisible(true);
        
        this.twitchText = this.scene.add.text(25, 0, gameData.twitchStreamer, {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0, 0.5);
        
        this.twitchContainer.add([this.twitchPfp, this.twitchText]);

        // Instructions (bottom)
        this.instructionsText = this.scene.add.text(400, 570, 
            'WASD: Move • Walk into buildings • ESC: Settings • Chat in Twitch for coins!', {
            fontSize: '12px',
            fill: '#cccccc',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
    }

    createPlayerUI() {
        if (!this.scene.player) return;
        
        // Player name above character
        this.playerNameText = this.scene.add.text(this.scene.player.x, this.scene.player.y - 30, gameData.playerName || 'Unnamed', {
            fontSize: '12px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Health bar background
        this.healthBarBg = this.scene.add.graphics()
            .fillStyle(0x000000, 0.8)
            .fillRect(this.scene.player.x - 25, this.scene.player.y + 25, 50, 8);

        // Health bar fill
        this.healthBarFill = this.scene.add.graphics();
        this.updateHealthBar();
    }

    updateHealthBar() {
        if (!this.healthBarFill || !this.scene.player) return;
        
        this.healthBarFill.clear();
        const healthPercent = gameData.stats.health / gameData.stats.maxHealth;
        const barWidth = 50 * healthPercent;
        
        // Color based on health percentage
        let color = 0x00ff00; // Green
        if (healthPercent < 0.5) color = 0xffff00; // Yellow
        if (healthPercent < 0.25) color = 0xff0000; // Red
        
        this.healthBarFill
            .fillStyle(color, 0.9)
            .fillRect(this.scene.player.x - 25, this.scene.player.y + 25, barWidth, 8);
    }

    async loadTwitchPfp() {
        // For now, just show the placeholder circle
        // To get real Twitch PFPs, you'd need to register a Twitch app and get API keys
        console.log('Twitch PFP loading would require API keys');
    }

    update() {
        // Update money display
        this.moneyText.setText(gameData.money.toString());
        
        // Update player name and health bar positions
        if (this.scene.player && this.playerNameText) {
            this.playerNameText.setPosition(this.scene.player.x, this.scene.player.y - 30);
            this.healthBarBg.setPosition(this.scene.player.x - 25, this.scene.player.y + 25);
            this.updateHealthBar();
        } else if (this.scene.player && !this.playerNameText) {
            this.createPlayerUI();
        }
        
        // Update Twitch streamer if changed
        this.twitchText.setText(gameData.twitchStreamer);
    }
}