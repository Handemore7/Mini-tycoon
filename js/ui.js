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
        this.twitchContainer = this.scene.add.container(650, 30);
        
        // Twitch PFP - starts as purple circle, loads real image
        this.twitchPfp = this.scene.add.graphics()
            .fillStyle(0x9146ff)
            .fillCircle(0, 0, 20)
            .setVisible(true);
        
        this.twitchText = this.scene.add.text(25, 0, gameData.twitchStreamer, {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            backgroundColor: '#000000',
            padding: { x: 6, y: 3 }
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
        try {
            const username = gameData.twitchStreamer;
            if (!username) return;
            
            // Get Twitch credentials from config
            const CLIENT_ID = window.CONFIG?.twitch?.clientId;
            const ACCESS_TOKEN = window.CONFIG?.twitch?.accessToken;
            
            if (!CLIENT_ID || !ACCESS_TOKEN) {
                console.log('Twitch credentials not configured');
                return;
            }
            
            const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
                headers: {
                    'Client-ID': CLIENT_ID,
                    'Authorization': `Bearer ${ACCESS_TOKEN}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data[0]) {
                    const profileUrl = data.data[0].profile_image_url;
                    
                    // Método directo con Image object
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        // Crear textura desde imagen
                        this.scene.textures.addImage(`twitch_pfp_${username}`, img);
                        
                        // Remover del contenedor antes de destruir
                        this.twitchContainer.remove(this.twitchPfp);
                        this.twitchPfp.destroy();
                        
                        // Crear nueva imagen en la misma posición (0,0 relativo al contenedor)
                        this.twitchPfp = this.scene.add.image(0, 0, `twitch_pfp_${username}`)
                            .setDisplaySize(40, 40)
                            .setOrigin(0.5)
                            .setVisible(true);
                        
                        // Agregar al contenedor
                        this.twitchContainer.add(this.twitchPfp);
                    };
                    img.src = profileUrl;
                }
            }
        } catch (error) {
            console.log('Error loading Twitch profile:', error);
        }
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