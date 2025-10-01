class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
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
        
        // Enhanced error handling
        this.load.on('loaderror', (file) => {
            window.errorLogger?.error('Failed to load asset:', file.src);
        });
        
        this.load.on('progress', (progress) => {
            window.errorLogger?.trackPerformance('assetLoadProgress', progress * 100);
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
        if (window.database && gameData.playerName) {
            console.log('🔄 Loading player data from database...');
            const loaded = await gameData.loadFromDatabase(gameData.playerName);
            if (loaded) {
                console.log('✅ Player data loaded from database');
            } else {
                console.log('ℹ️ No database data found, using local data');
            }
        }
        
        this.initializeGame();
    }

    showNamePrompt() {
        // Pause physics
        this.physics.pause();
        
        // Create prompt background
        this.namePromptBg = this.add.rectangle(400, 300, 450, 280, 0x000000, 0.9);
        
        // Title
        this.namePromptTitle = this.add.text(400, 220, 'Setup Your Profile', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Player name label
        this.nameLabel = this.add.text(400, 260, 'Player Name (Required):', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Player name input
        this.nameInput = '';
        this.nameInputText = this.add.text(400, 285, '|', {
            fontSize: '16px',
            fill: '#ffff00',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // Streamer label
        this.streamerLabel = this.add.text(400, 320, 'Twitch Streamer (Optional):', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Streamer input
        this.streamerInput = gameData.twitchStreamer || '';
        this.streamerInputText = this.add.text(400, 345, this.streamerInput + '|', {
            fontSize: '16px',
            fill: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // Instructions
        this.nameInstructions = this.add.text(400, 380, 'TAB: Switch fields | ENTER: Continue\n3-20 chars: letters, numbers, underscore only', {
            fontSize: '12px',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
        
        // Current active field (0 = name, 1 = streamer)
        this.activeField = 0;
        this.updateFieldHighlight();
        
        // Enable keyboard input
        this.input.keyboard.on('keydown', this.handleNameInput, this);
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
        this.nameInputText.setText(this.nameInput + (this.activeField === 0 ? '|' : ''));
        this.streamerInputText.setText(this.streamerInput + (this.activeField === 1 ? '|' : ''));
    }
    
    updateFieldHighlight() {
        if (this.activeField === 0) {
            this.nameInputText.setStyle({ fill: '#ffff00' });
            this.streamerInputText.setStyle({ fill: '#666666' });
        } else {
            this.nameInputText.setStyle({ fill: '#666666' });
            this.streamerInputText.setStyle({ fill: '#00ff00' });
        }
        this.updateInputDisplay();
    }
    
    showNameError(message) {
        if (this.nameError) this.nameError.destroy();
        
        this.nameError = this.add.text(400, 410, message, {
            fontSize: '12px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 },
            align: 'center'
        }).setOrigin(0.5);
        
        this.time.delayedCall(3000, () => {
            if (this.nameError) {
                this.nameError.destroy();
                this.nameError = null;
            }
        });
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
            this.loadPlayerData();
            
        } catch (error) {
            console.error('Error checking player name:', error);
            // If check fails, allow the name (fallback)
            gameData.playerName = playerName;
            gameData.twitchStreamer = this.streamerInput.trim() || 'Handemore7';
            
            // Try to create user in Firebase (fallback)
            if (window.database) {
                await window.database.createPlayer(playerName, gameData.twitchStreamer);
            }
            
            this.hideNamePrompt();
            this.loadPlayerData();
        }
    }

    hideNamePrompt() {
        this.input.keyboard.off('keydown', this.handleNameInput, this);
        this.namePromptBg.destroy();
        this.namePromptTitle.destroy();
        this.nameLabel.destroy();
        this.nameInputText.destroy();
        this.streamerLabel.destroy();
        this.streamerInputText.destroy();
        this.nameInstructions.destroy();
        if (this.nameError) this.nameError.destroy();
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
        
        // Initialize tutorial for new players
        this.tutorial = new Tutorial(this);
        window.Tutorial.instance = this.tutorial; // Global reference
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