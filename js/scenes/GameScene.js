class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Don't show loading screen during initial preload
        // Loading screen will be shown only when user is logged in and tutorial is complete
        
        // Start asset preloading
        if (window.assetPreloader) {
            window.assetPreloader.preloadCriticalAssets();
            window.assetPreloader.preloadWalkingAnimations();
        }
        
        // Load directional player sprites with error handling
        const directions = ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'];
        directions.forEach(dir => {
            this.load.image(`player_${dir}`, `assets/sprites/player/rotations/${dir}.png`);
            
            // Load walking animation frames
            for (let i = 0; i < 8; i++) {
                this.load.image(`walk_${dir}_${i}`, `assets/sprites/player/animations/walking/${dir}/frame_00${i}.png`);
            }
        });
        
        // Load sword and shield images
        const tiers = ['wood', 'stone', 'gold', 'iron', 'diamond'];
        tiers.forEach(tier => {
            this.load.image(`sword_${tier}`, `assets/swords/${tier}.png`);
            this.load.image(`shield_${tier}`, `assets/shields/${tier}.png`);
        });
        
        // Load other assets
        this.load.image('background', 'assets/sprites/background.png');
        this.load.image('store_building', 'assets/sprites/buildings/store.png');
        this.load.image('upgrades_building', 'assets/sprites/buildings/upgrades.png');
        this.load.image('decoration_building', 'assets/sprites/buildings/decoration.png');
        this.load.image('arena_building', 'assets/sprites/buildings/arena.png');
        
        // Load audio
        this.load.audio('normalMusic', 'assets/music/normal.ogg');
        this.load.audio('arenaMusic', 'assets/music/arena.ogg');
        
        // Enhanced error handling
        this.load.on('loaderror', (file) => {
            window.errorLogger?.error('Failed to load asset:', file.src);
        });
        
        this.load.on('progress', (progress) => {
            window.errorLogger?.trackPerformance('assetLoadProgress', progress * 100);
            // Don't update loading screen during initial asset loading
        });
    }
    


    create() {
        // Create walking animations
        const directions = ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'];
        directions.forEach(dir => {
            const frames = [];
            for (let i = 0; i < 8; i++) {
                if (this.textures.exists(`walk_${dir}_${i}`)) {
                    frames.push({ key: `walk_${dir}_${i}` });
                }
            }
            if (frames.length > 0) {
                this.anims.create({
                    key: `walk_${dir}`,
                    frames: frames,
                    frameRate: 10,
                    repeat: -1
                });
            }
        });
        
        // Add background first
        if (this.textures.exists('background')) {
            this.add.image(400, 300, 'background').setDisplaySize(800, 600);
        } else {
            // Fallback background
            const bgGraphics = this.add.graphics();
            bgGraphics.fillStyle(0x2c3e50);
            bgGraphics.fillRect(0, 0, 800, 600);
            bgGraphics.generateTexture('bg_fallback', 800, 600);
            bgGraphics.destroy();
            this.add.image(400, 300, 'bg_fallback');
        }
        
        // Create fallback textures without visible graphics
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ff00);
        playerGraphics.fillRect(0, 0, 48, 48);
        playerGraphics.generateTexture('player_fallback', 48, 48);
        playerGraphics.destroy();

        const buildingGraphics = this.add.graphics();
        buildingGraphics.fillStyle(0x8b4513);
        buildingGraphics.fillRect(0, 0, 64, 64);
        buildingGraphics.generateTexture('building', 64, 64);
        buildingGraphics.destroy();
            
        // Check if player name is set, if not show prompt
        if (!gameData.playerName || gameData.playerName.trim() === '') {
            this.showNamePrompt();
            return;
        }
        
        // Try to load from database
        this.loadPlayerData();
    }
    
    async loadPlayerData() {
        // Only show loading screen if user is logged in and tutorial is complete
        const tutorialCompleted = localStorage.getItem('miniTycoon_tutorialCompleted') === 'true';
        const shouldShowLoading = gameData.playerName && tutorialCompleted;
        
        if (shouldShowLoading && window.loadingScreen) {
            window.loadingScreen.show();
            window.loadingScreen.updateProgress(60, 'Connecting to database...');
        }
        
        try {
            if (window.database && gameData.playerName) {
                console.log('🔄 Loading player data from database...');
                const loaded = await gameData.loadFromDatabase(gameData.playerName);
                if (loaded) {
                    console.log('✅ Player data loaded from database');
                } else {
                    console.log('ℹ️ No database data found, using local data');
                }
            }
            
            if (shouldShowLoading && window.loadingScreen) {
                window.loadingScreen.updateProgress(80, 'Initializing game systems...');
            }
            
            this.initializeGame();
        } catch (error) {
            console.error('Failed to load player data:', error);
            if (shouldShowLoading && window.loadingScreen) {
                window.loadingScreen.showError('Failed to connect to database. Check your internet connection.');
            } else {
                // Fallback for users without loading screen
                this.initializeGame();
            }
        }
    }

    showNamePrompt() {
        // Pause physics
        this.physics.pause();
        
        // Create animated background overlay with subtle pattern
        this.namePromptOverlay = this.add.graphics()
            .fillGradientStyle(0x000000, 0x1a1a2e, 0x16213e, 0x0f3460, 0.95)
            .fillRect(0, 0, 800, 600)
            .setAlpha(0)
            .setDepth(1000);
            
        // Floating particles background effect
        this.createFloatingParticles();
            
        // Main container with modern glass morphism effect
        this.namePromptBg = this.add.graphics()
            .fillGradientStyle(0x2c3e50, 0x34495e, 0x2c3e50, 0x34495e, 0.95)
            .fillRoundedRect(150, 120, 500, 360, 20)
            .lineStyle(2, 0x3498db, 0.8)
            .strokeRoundedRect(150, 120, 500, 360, 20)
            .setDepth(1001)
            .setScale(0.8)
            .setAlpha(0);
            
        // Add subtle inner glow
        this.namePromptGlow = this.add.graphics()
            .lineStyle(1, 0x74b9ff, 0.3)
            .strokeRoundedRect(152, 122, 496, 356, 18)
            .setDepth(1001)
            .setAlpha(0);
        
        // Animated welcome icon with rotation
        this.welcomeIcon = this.add.text(400, 170, '🎮', {
            fontSize: '40px'
        }).setOrigin(0.5).setDepth(1002).setAlpha(0).setRotation(-0.1);
        
        // Title with modern typography and gradient effect
        this.namePromptTitle = this.add.text(400, 220, 'Welcome to Mini Tycoon!', {
            fontSize: '28px',
            fill: '#74b9ff',
            fontWeight: 'bold',
            stroke: '#2d3436',
            strokeThickness: 1
        }).setOrigin(0.5).setDepth(1002).setAlpha(0);
        
        this.namePromptSubtitle = this.add.text(400, 250, 'Create your profile to begin your journey', {
            fontSize: '16px',
            fill: '#ddd',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(1002).setAlpha(0);
        
        // Player name section with enhanced styling
        this.nameLabel = this.add.text(220, 290, '👤 Player Name (Your Twitch Username)', {
            fontSize: '16px',
            fill: '#ecf0f1',
            fontWeight: 'bold'
        }).setOrigin(0, 0.5).setDepth(1002).setAlpha(0);
        
        this.nameInputBg = this.add.graphics()
            .fillGradientStyle(0x2d3436, 0x636e72, 0.9)
            .fillRoundedRect(220, 305, 360, 40, 12)
            .lineStyle(2, 0x74b9ff, 1)
            .strokeRoundedRect(220, 305, 360, 40, 12)
            .setDepth(1001).setAlpha(0);
        
        this.nameInput = '';
        this.nameInputText = this.add.text(240, 325, 'Enter your Twitch username...', {
            fontSize: '18px',
            fill: '#95a5a6',
            fontStyle: 'italic'
        }).setOrigin(0, 0.5).setDepth(1002).setAlpha(0);
        
        // Character counter
        this.nameCounter = this.add.text(570, 325, '0/20', {
            fontSize: '14px',
            fill: '#95a5a6'
        }).setOrigin(1, 0.5).setDepth(1002).setAlpha(0);
        
        // Streamer section with Twitch branding
        this.streamerLabel = this.add.text(220, 365, '📺 Twitch Streamer (Optional)', {
            fontSize: '16px',
            fill: '#ecf0f1',
            fontWeight: 'bold'
        }).setOrigin(0, 0.5).setDepth(1002).setAlpha(0);
        
        this.streamerInputBg = this.add.graphics()
            .fillGradientStyle(0x2d3436, 0x636e72, 0.9)
            .fillRoundedRect(220, 380, 360, 40, 12)
            .lineStyle(2, 0x00b894, 1)
            .strokeRoundedRect(220, 380, 360, 40, 12)
            .setDepth(1001).setAlpha(0);
        
        this.streamerInput = gameData.twitchStreamer === 'your_streamer_name' ? '' : gameData.twitchStreamer;
        this.streamerInputText = this.add.text(240, 400, this.streamerInput || 'Channel to monitor for rewards', {
            fontSize: '18px',
            fill: this.streamerInput ? '#ecf0f1' : '#95a5a6',
            fontStyle: this.streamerInput ? 'normal' : 'italic'
        }).setOrigin(0, 0.5).setDepth(1002).setAlpha(0);
        
        // Enhanced instructions with icons
        this.nameInstructions = this.add.text(400, 440, '⌨️ TAB: Switch fields  •  ⏎ ENTER: Continue', {
            fontSize: '14px',
            fill: '#74b9ff',
            align: 'center'
        }).setOrigin(0.5).setDepth(1002).setAlpha(0);
        
        this.nameRules = this.add.text(400, 460, 'Use your exact Twitch username to receive chat rewards\n3-20 characters: letters, numbers, underscore only', {
            fontSize: '12px',
            fill: '#95a5a6',
            align: 'center',
            lineSpacing: 3
        }).setOrigin(0.5).setDepth(1002).setAlpha(0);
        
        // Current active field (0 = name, 1 = streamer)
        this.activeField = 0;
        
        // Animate everything in
        this.animatePromptIn();
        
        // Enable keyboard input
        this.input.keyboard.on('keydown', this.handleNameInput, this);
    }
    
    createFloatingParticles() {
        this.particles = [];
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(2, 4),
                0x74b9ff,
                0.3
            ).setDepth(999).setAlpha(0);
            
            this.particles.push(particle);
            
            // Animate particles floating
            this.tweens.add({
                targets: particle,
                alpha: 0.6,
                duration: 2000,
                delay: i * 100,
                ease: 'Power2'
            });
            
            this.tweens.add({
                targets: particle,
                y: particle.y - 100,
                x: particle.x + Phaser.Math.Between(-50, 50),
                duration: 8000 + i * 200,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    animatePromptIn() {
        // Fade in overlay with wave effect
        this.tweens.add({
            targets: this.namePromptOverlay,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
        
        // Scale and fade in main container with bounce
        this.tweens.add({
            targets: [this.namePromptBg, this.namePromptGlow],
            scale: 1,
            alpha: 1,
            duration: 600,
            delay: 200,
            ease: 'Elastic.easeOut'
        });
        
        // Animate welcome icon with rotation and scale
        this.tweens.add({
            targets: this.welcomeIcon,
            alpha: 1,
            scale: 1.2,
            rotation: 0,
            duration: 800,
            delay: 400,
            ease: 'Back.easeOut'
        });
        
        // Add subtle floating animation to icon
        this.tweens.add({
            targets: this.welcomeIcon,
            y: this.welcomeIcon.y - 5,
            duration: 2000,
            delay: 1200,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
        
        // Stagger in text elements with slide effect
        const textElements = [
            this.namePromptTitle,
            this.namePromptSubtitle,
            this.nameLabel,
            this.streamerLabel,
            this.nameInstructions,
            this.nameRules
        ];
        
        textElements.forEach((element, index) => {
            element.setX(element.x + 50); // Start offset
            this.tweens.add({
                targets: element,
                alpha: 1,
                x: element.x - 50,
                duration: 400,
                delay: 600 + (index * 80),
                ease: 'Back.easeOut'
            });
        });
        
        // Animate input fields with scale effect
        const inputElements = [
            { bg: this.nameInputBg, text: this.nameInputText, counter: this.nameCounter },
            { bg: this.streamerInputBg, text: this.streamerInputText }
        ];
        
        inputElements.forEach((input, index) => {
            this.tweens.add({
                targets: [input.bg, input.text, input.counter].filter(Boolean),
                alpha: 1,
                scaleX: 1,
                duration: 500,
                delay: 800 + (index * 100),
                ease: 'Back.easeOut'
            });
        });
        
        this.time.delayedCall(1000, () => this.updateFieldHighlight());
    }
    
    handleNameInput(event) {
        if (event.key === 'Enter') {
            const playerName = this.nameInput.trim();
            if (playerName !== '') {
                // Validate player name format
                if (!/^[a-zA-Z0-9_]{3,20}$/.test(playerName)) {
                    this.showNameError('Name must be 3-20 characters (letters, numbers, underscore only)');
                    return;
                }
                
                // Check if name is already taken
                this.checkPlayerName(playerName);
            }
        } else if (event.key === 'Tab') {
            event.preventDefault();
            this.activeField = this.activeField === 0 ? 1 : 0;
            this.updateFieldHighlight();
        } else if (event.key === 'Backspace') {
            if (this.activeField === 0) {
                this.nameInput = this.nameInput.slice(0, -1);
            } else {
                this.streamerInput = this.streamerInput.slice(0, -1);
            }
            this.updateInputDisplay();
        } else if (event.key.length === 1) {
            if (this.activeField === 0 && this.nameInput.length < 20) {
                this.nameInput += event.key;
            } else if (this.activeField === 1 && this.streamerInput.length < 25) {
                this.streamerInput += event.key;
            }
            this.updateInputDisplay();
        }
    }
    
    updateInputDisplay() {
        // Update name input with enhanced styling
        if (this.nameInput === '' && this.activeField !== 0) {
            this.nameInputText.setText('Enter your Twitch username...').setStyle({ fill: '#95a5a6', fontStyle: 'italic' });
        } else {
            const cursor = this.activeField === 0 ? '|' : '';
            const nameText = this.nameInput + cursor;
            this.nameInputText.setText(nameText || (this.activeField === 0 ? '|' : 'Enter your Twitch username...'))
                .setStyle({ 
                    fill: this.nameInput || this.activeField === 0 ? '#ffffff' : '#95a5a6',
                    fontStyle: this.nameInput ? 'normal' : 'italic'
                }).setAlpha(1);
        }
        
        // Update character counter with color coding
        const nameLength = this.nameInput.length;
        let counterColor = '#95a5a6';
        if (nameLength >= 3 && nameLength <= 20) counterColor = '#00b894';
        else if (nameLength > 20) counterColor = '#e17055';
        
        this.nameCounter.setText(`${nameLength}/20`).setStyle({ fill: counterColor });
        
        // Update streamer input
        if (this.streamerInput === '' && this.activeField !== 1) {
            this.streamerInputText.setText('Channel to monitor for rewards').setStyle({ fill: '#95a5a6', fontStyle: 'italic' });
        } else {
            const cursor = this.activeField === 1 ? '|' : '';
            const streamerText = this.streamerInput + cursor;
            this.streamerInputText.setText(streamerText || (this.activeField === 1 ? '|' : 'Channel to monitor for rewards'))
                .setStyle({ 
                    fill: this.streamerInput || this.activeField === 1 ? '#ffffff' : '#95a5a6',
                    fontStyle: this.streamerInput ? 'normal' : 'italic'
                }).setAlpha(1);
        }
        
        // Stop any existing cursor animation to prevent visibility issues
        if (this.cursorTween) {
            this.cursorTween.stop();
            this.cursorTween = null;
        }
        
        // Ensure text is fully visible
        if (this.nameInputText) this.nameInputText.setAlpha(1);
        if (this.streamerInputText) this.streamerInputText.setAlpha(1);
    }
    
    updateFieldHighlight() {
        // Animate field transitions with glow effects
        if (this.activeField === 0) {
            // Highlight name field
            this.nameInputBg.clear()
                .fillGradientStyle(0x2d3436, 0x636e72, 0.9)
                .fillRoundedRect(220, 305, 360, 40, 12)
                .lineStyle(3, 0x74b9ff, 1)
                .strokeRoundedRect(220, 305, 360, 40, 12)
                .lineStyle(1, 0x74b9ff, 0.5)
                .strokeRoundedRect(218, 303, 364, 44, 14);
                
            // Dim streamer field
            this.streamerInputBg.clear()
                .fillGradientStyle(0x2d3436, 0x636e72, 0.9)
                .fillRoundedRect(220, 380, 360, 40, 12)
                .lineStyle(2, 0x636e72, 0.8)
                .strokeRoundedRect(220, 380, 360, 40, 12);
                
            // Animate label colors
            this.tweens.add({
                targets: this.nameLabel,
                alpha: 1,
                duration: 200
            });
            this.tweens.add({
                targets: this.streamerLabel,
                alpha: 0.7,
                duration: 200
            });
        } else {
            // Dim name field
            this.nameInputBg.clear()
                .fillGradientStyle(0x2d3436, 0x636e72, 0.9)
                .fillRoundedRect(220, 305, 360, 40, 12)
                .lineStyle(2, 0x636e72, 0.8)
                .strokeRoundedRect(220, 305, 360, 40, 12);
                
            // Highlight streamer field
            this.streamerInputBg.clear()
                .fillGradientStyle(0x2d3436, 0x636e72, 0.9)
                .fillRoundedRect(220, 380, 360, 40, 12)
                .lineStyle(3, 0x00b894, 1)
                .strokeRoundedRect(220, 380, 360, 40, 12)
                .lineStyle(1, 0x00b894, 0.5)
                .strokeRoundedRect(218, 378, 364, 44, 14);
                
            // Animate label colors
            this.tweens.add({
                targets: this.nameLabel,
                alpha: 0.7,
                duration: 200
            });
            this.tweens.add({
                targets: this.streamerLabel,
                alpha: 1,
                duration: 200
            });
        }
        this.updateInputDisplay();
    }
    
    showNameError(message, color = '#e17055') {
        if (this.nameError) this.nameError.destroy();
        
        // Create error container with modern styling
        this.nameErrorBg = this.add.graphics()
            .fillGradientStyle(0x2d3436, 0x636e72, 0.95)
            .fillRoundedRect(200, 470, 400, 50, 12)
            .lineStyle(2, color === '#e17055' ? 0xe17055 : (color === '#ffff00' ? 0xfdcb6e : 0x00b894), 1)
            .strokeRoundedRect(200, 470, 400, 50, 12)
            .setDepth(1003).setAlpha(0);
        
        const icon = color === '#e17055' ? '⚠️' : (color === '#ffff00' ? '⏳' : '✅');
        
        this.nameError = this.add.text(400, 495, `${icon} ${message}`, {
            fontSize: '14px',
            fill: color,
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5).setDepth(1004).setAlpha(0);
        
        // Animate in error message with bounce
        this.tweens.add({
            targets: [this.nameErrorBg, this.nameError],
            alpha: 1,
            y: '-=15',
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        // Add subtle pulse for errors
        if (color === '#e17055') {
            this.tweens.add({
                targets: this.nameError,
                scale: 1.05,
                duration: 300,
                repeat: 2,
                yoyo: true,
                ease: 'Power2'
            });
        }
        
        // Auto-hide after delay (except for loading messages)
        if (color !== '#ffff00') {
            this.time.delayedCall(4000, () => {
                if (this.nameError && this.nameErrorBg) {
                    this.tweens.add({
                        targets: [this.nameErrorBg, this.nameError],
                        alpha: 0,
                        y: '+=10',
                        duration: 300,
                        ease: 'Power2',
                        onComplete: () => {
                            if (this.nameError) {
                                this.nameError.destroy();
                                this.nameError = null;
                            }
                            if (this.nameErrorBg) {
                                this.nameErrorBg.destroy();
                                this.nameErrorBg = null;
                            }
                        }
                    });
                }
            });
        }
    }

    async checkPlayerName(playerName) {
        // Show loading message
        this.showNameError('Checking name availability...', '#ffff00');
        
        try {
            const exists = await window.database.checkPlayerExists(playerName);
            
            if (exists) {
                this.showNameError('Name already in use - choose another name');
                return;
            }
            
            // Name is available, create new user in Firebase
            gameData.playerName = playerName;
            gameData.twitchStreamer = this.streamerInput.trim() || 'Handemore7';
            
            // Create user in Firebase
            if (window.database) {
                await window.database.createPlayer(playerName, gameData.twitchStreamer);
            }
            
            this.hideNamePrompt();
            this.initializeGame(); // Skip loadPlayerData for new users
            
        } catch (error) {
            console.error('Error checking player name:', error);
            this.showNameError('Connection failed. Using offline mode - your progress will be saved locally.');
            
            // Fallback to offline mode
            gameData.playerName = playerName;
            gameData.twitchStreamer = this.streamerInput.trim() || 'Handemore7';
            
            setTimeout(() => {
                this.hideNamePrompt();
                this.initializeGame(); // Skip loadPlayerData for offline users
            }, 2000);
        }
    }

    hideNamePrompt() {
        this.input.keyboard.off('keydown', this.handleNameInput, this);
        
        // Stop cursor animation
        if (this.cursorTween) this.cursorTween.stop();
        
        // Success animation before hiding
        this.tweens.add({
            targets: this.namePromptBg,
            scaleX: 1.05,
            scaleY: 0.95,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                // Animate out with staggered effect
                const elements = [
                    this.namePromptOverlay,
                    this.namePromptBg,
                    this.namePromptGlow,
                    this.welcomeIcon,
                    this.namePromptTitle,
                    this.namePromptSubtitle,
                    this.nameLabel,
                    this.nameInputBg,
                    this.nameInputText,
                    this.nameCounter,
                    this.streamerLabel,
                    this.streamerInputBg,
                    this.streamerInputText,
                    this.nameInstructions,
                    this.nameRules
                ];
                
                elements.forEach((element, index) => {
                    if (element) {
                        this.tweens.add({
                            targets: element,
                            alpha: 0,
                            scale: element === this.namePromptBg ? 0.8 : 1,
                            y: element.y + 20,
                            duration: 300,
                            delay: index * 30,
                            ease: 'Back.easeIn',
                            onComplete: () => element.destroy()
                        });
                    }
                });
                
                // Clean up particles
                if (this.particles) {
                    this.particles.forEach(particle => {
                        this.tweens.add({
                            targets: particle,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => particle.destroy()
                        });
                    });
                }
            }
        });
        
        // Clean up error messages
        if (this.nameError) this.nameError.destroy();
        if (this.nameErrorBg) this.nameErrorBg.destroy();
    }
    
    initializeGame() {
        // Set global scene reference for achievements
        window.currentScene = this;
        
        // Check all achievements on game start
        if (typeof achievements !== 'undefined') {
            achievements.checkAllAchievements();
        }
        
        // Create player at saved position
        const spawnX = gameData.playerPosition?.x || 400;
        const spawnY = gameData.playerPosition?.y || 300;
        this.player = new Player(this, spawnX, spawnY);

        // Create buildings in corners
        this.storeBuilding = new Building(this, 100, 100, 'store', 'STORE');
        this.upgradesBuilding = new Building(this, 700, 100, 'upgrades', 'UPGRADES');
        this.decorationBuilding = new Building(this, 100, 500, 'decoration', 'DECORATION');
        this.fightsBuilding = new Building(this, 700, 500, 'fights', 'ARENA');
        
        // Show cleared status if arena was completed
        if (gameData.arenaCompleted) {
            this.arenaClearedText = this.add.text(
                this.fightsBuilding.x, 
                this.fightsBuilding.y - 50, 
                'CLEARED', 
                {
                    fontSize: '14px',
                    fill: '#00ff00',
                    backgroundColor: '#000000',
                    padding: { x: 8, y: 4 },
                    fontWeight: 'bold'
                }
            ).setOrigin(0.5).setDepth(1000);
        }

        // Create UI
        this.ui = new UI(this);

        // Create settings menu
        this.settingsMenu = new SettingsMenu(this);

        // ESC key for settings with memory management
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        if (window.memoryManager) {
            window.memoryManager.addListener(this.escKey, 'down', () => this.settingsMenu.toggle(), this);
        } else {
            this.escKey.on('down', () => this.settingsMenu.toggle());
        }

        // Individual building collisions
        this.physics.add.collider(this.player, this.storeBuilding);
        this.physics.add.collider(this.player, this.upgradesBuilding);
        this.physics.add.collider(this.player, this.decorationBuilding);
        this.physics.add.collider(this.player, this.fightsBuilding);
        
        // Require player movement before enabling interactions
        this.playerHasMoved = false;
        
        // Touch interaction zones (smaller overlap areas)
        this.createInteractionZone(this.storeBuilding);
        this.createInteractionZone(this.upgradesBuilding);
        this.createInteractionZone(this.decorationBuilding);
        this.createInteractionZone(this.fightsBuilding);
        
        // Initialize store system
        this.storeSystem = new Store(this);
        
        // Initialize upgrades system
        this.upgradesSystem = new Upgrades(this);
        
        // Initialize decoration system
        this.decorationSystem = new Decorations(this);
        
        // Initialize arena system
        this.arenaSystem = new Arena(this);
        
        // Initialize Twitch chat
        this.twitchChat = new TwitchChat(this);
        
        // Load existing decorations
        this.decorationSystem.loadExistingDecorations();
        
        // Initialize Konami code listener
        this.konamiDebug = new KonamiDebug(this);
        
        // Initialize inventory
        this.inventory = new Inventory(this);
        
        // Resume physics
        this.physics.resume();
        
        // Initialize state manager with current game data
        if (window.stateManager) {
            window.stateManager.importState({
                player: {
                    name: gameData.playerName,
                    position: gameData.playerPosition || { x: 400, y: 300 },
                    stats: gameData.stats
                },
                game: {
                    money: gameData.money,
                    volume: gameData.volume,
                    twitchStreamer: gameData.twitchStreamer,
                    passiveIncome: gameData.passiveIncome,
                    chatBonus: gameData.chatBonus,
                    chatStreak: gameData.chatStreak,
                    lastChatDate: gameData.lastChatDate,
                    arenaWins: gameData.arenaWins,
                    bestArenaWave: gameData.bestArenaWave,
                    healthPotions: gameData.healthPotions,
                    lastSaveTime: gameData.lastSaveTime
                },
                inventory: {
                    sword: gameData.inventory.sword,
                    shield: gameData.inventory.shield,
                    decorationInventory: gameData.decorationInventory
                },
                progression: {
                    upgrades: gameData.upgrades,
                    achievements: gameData.achievements,
                    decorations: gameData.decorations,
                    unlockedDecorations: gameData.unlockedDecorations
                }
            });
        }
        
        // Initialize audio manager
        if (!window.audioManager) {
            window.audioManager = new AudioManager(this);
        }
        window.audioManager.createAudioObjects();
        window.audioManager.playNormalMusic();
        
        // Initialize tutorial for new players
        this.tutorial = new Tutorial(this);
        window.Tutorial.instance = this.tutorial; // Global reference
        
        try {
            // Only hide loading screen if it was shown
            const tutorialCompleted = localStorage.getItem('miniTycoon_tutorialCompleted') === 'true';
            const shouldShowLoading = gameData.playerName && tutorialCompleted;
            
            if (shouldShowLoading && window.loadingScreen) {
                window.loadingScreen.updateProgress(100, 'Ready to play!');
                setTimeout(() => {
                    window.loadingScreen.hide();
                }, 500);
            }
        } catch (error) {
            console.error('Game initialization failed:', error);
            const tutorialCompleted = localStorage.getItem('miniTycoon_tutorialCompleted') === 'true';
            const shouldShowLoading = gameData.playerName && tutorialCompleted;
            
            if (shouldShowLoading && window.loadingScreen) {
                window.loadingScreen.showError('Game initialization failed. Please refresh to try again.');
            }
        }
        
        this.tutorial.start();
    }

    createInteractionZone(building) {
        // Create invisible interaction zone around building
        const zone = this.add.zone(building.x, building.y, 80, 80);
        this.physics.add.existing(zone);
        zone.body.setImmovable(true);
        
        // Add overlap detection for interaction
        this.physics.add.overlap(this.player, zone, () => {
            // Only interact if player has moved, no store is open, and building not on cooldown
            if (this.playerHasMoved && !building.interactionCooldown && !this.isAnyStoreOpen()) {
                building.interact(this);
                building.interactionCooldown = true;
                this.time.delayedCall(1000, () => {
                    building.interactionCooldown = false;
                });
            }
        });
    }

    isAnyStoreOpen() {
        return (this.storeSystem && this.storeSystem.isOpen) || 
               (this.upgradesSystem && this.upgradesSystem.isOpen) ||
               (this.decorationSystem && this.decorationSystem.isOpen) ||
               (this.arenaSystem && this.arenaSystem.isOpen);
    }

    update() {
        try {
            if (this.player) {
                this.player.update();
            }
            if (this.ui) {
                this.ui.update();
            }
        } catch (error) {
            window.errorLogger?.error('Update loop error:', error);
        }
    }
    
    toggleInventory() {
        if (this.inventory) {
            this.inventory.toggle();
        }
    }
    
    shutdown() {
        // Clean up scene resources
        if (window.memoryManager) {
            window.memoryManager.cleanupScene(this);
        }
        
        // Clean up event listeners
        if (this.escKey) {
            this.escKey.removeAllListeners();
        }
        
        window.errorLogger?.info('GameScene shutdown completed');
    }

    showMessage(text, color = '#00ff00') {
        if (this.messageText) this.messageText.destroy();
        
        this.messageText = this.add.text(400, 100, text, {
            fontSize: '16px',
            fill: color,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        
        this.time.delayedCall(3000, () => {
            if (this.messageText) {
                this.messageText.destroy();
                this.messageText = null;
            }
        });
    }
}