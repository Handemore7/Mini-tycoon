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
            
            if (!CLIENT_ID) {
                console.log('Twitch client ID not configured');
                return;
            }
            
            // Try multiple methods to get Twitch profile picture
            const profileUrl = await this.getTwitchProfileUrl(username);
            
            if (profileUrl) {
                this.loadProfileImage(username, profileUrl);
            } else {
                this.setGenericTwitchAvatar(username);
            }
        } catch (error) {
            console.log('Error loading Twitch profile:', error);
            this.setGenericTwitchAvatar(username);
        }
    }

    async getTwitchProfileUrl(username) {
        // Method 1: Try public Twitch API services
        const methods = [
            // Decapi.me - Public Twitch API proxy
            `https://decapi.me/twitch/avatar/${username}`,
            // Twitch Insights API (sometimes works)
            `https://api.twitch.tv/kraken/users/${username}`,
            // Alternative services
            `https://twitchtracker.com/api/channels/${username}`
        ];
        
        for (const url of methods) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.text();
                    
                    // Decapi returns direct image URL
                    if (url.includes('decapi.me') && data.startsWith('https://')) {
                        return data.trim();
                    }
                    
                    // Try parsing as JSON for other APIs
                    try {
                        const jsonData = JSON.parse(data);
                        if (jsonData.logo) return jsonData.logo;
                        if (jsonData.avatar_url) return jsonData.avatar_url;
                        if (jsonData.profile_image_url) return jsonData.profile_image_url;
                    } catch (e) {
                        // Not JSON, continue
                    }
                }
            } catch (error) {
                console.log(`Failed method: ${url}`);
            }
        }
        
        // Method 2: Try direct Twitch CDN pattern (sometimes works)
        const possibleUrls = [
            `https://static-cdn.jtvnw.net/jtv_user_pictures/${username}-profile_image-300x300.png`,
            `https://static-cdn.jtvnw.net/jtv_user_pictures/${username}-profile_image-150x150.png`
        ];
        
        for (const url of possibleUrls) {
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    return url;
                }
            } catch (error) {
                // Continue to next URL
            }
        }
        
        return null;
    }
    
    loadProfileImage(username, profileUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            // Create texture from image
            this.scene.textures.addImage(`twitch_pfp_${username}`, img);
            
            // Remove existing pfp
            this.twitchContainer.remove(this.twitchPfp);
            this.twitchPfp.destroy();
            
            // Create new image
            this.twitchPfp = this.scene.add.image(0, 0, `twitch_pfp_${username}`)
                .setDisplaySize(40, 40)
                .setOrigin(0.5)
                .setVisible(true);
            
            // Add to container
            this.twitchContainer.add(this.twitchPfp);
            
            console.log(`✅ Loaded Twitch profile for ${username}`);
        };
        
        img.onerror = () => {
            console.log(`❌ Failed to load image for ${username}`);
            this.setGenericTwitchAvatar(username);
        };
        
        img.src = profileUrl;
    }

    setGenericTwitchAvatar(username) {
        // Create a colored circle with first letter of username
        const firstLetter = username.charAt(0).toUpperCase();
        const colors = [0x9146ff, 0x00ff88, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24];
        const color = colors[username.length % colors.length];
        
        // Remove existing pfp
        this.twitchContainer.remove(this.twitchPfp);
        this.twitchPfp.destroy();
        
        // Create new avatar with letter
        const graphics = this.scene.add.graphics()
            .fillStyle(color)
            .fillCircle(0, 0, 20)
            .lineStyle(2, 0xffffff)
            .strokeCircle(0, 0, 20);
            
        const letterText = this.scene.add.text(0, 0, firstLetter, {
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Create container for avatar
        this.twitchPfp = this.scene.add.container(0, 0, [graphics, letterText]);
        this.twitchContainer.add(this.twitchPfp);
        
        console.log(`✅ Generic avatar created for ${username}`);
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