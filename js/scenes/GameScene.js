class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Load directional player sprites
        const directions = ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'];
        directions.forEach(dir => {
            this.load.image(`player_${dir}`, `assets/sprites/player/rotations/${dir}.png`);
            
            // Load walking animation frames
            const frames = [];
            for (let i = 0; i < 8; i++) {
                frames.push({ key: `walk_${dir}_${i}`, url: `assets/sprites/player/animations/walking/${dir}/frame_00${i}.png` });
            }
            frames.forEach(frame => this.load.image(frame.key, frame.url));
        });
        
        // Load background
        this.load.image('background', 'assets/sprites/background.png');
        
        // Load building sprites
        this.load.image('store_building', 'assets/sprites/buildings/store.png');
        this.load.image('upgrades_building', 'assets/sprites/buildings/upgrades.png');
        this.load.image('decoration_building', 'assets/sprites/buildings/decoration.png');
        this.load.image('arena_building', 'assets/sprites/buildings/arena.png');
        
        // Debug loading
        this.load.on('loaderror', (file) => {
            console.log('Failed to load:', file.src);
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
            this.add.graphics()
                .fillStyle(0x2c3e50)
                .fillRect(0, 0, 800, 600)
                .generateTexture('bg_fallback', 800, 600);
            this.add.image(400, 300, 'bg_fallback');
        }
        
        // Create fallback textures
        this.add.graphics()
            .fillStyle(0x00ff00)
            .fillRect(0, 0, 48, 48)
            .generateTexture('player_fallback', 48, 48);

        this.add.graphics()
            .fillStyle(0x8b4513)
            .fillRect(0, 0, 64, 64)
            .generateTexture('building', 64, 64);
            
        // Check if player name is set, if not show prompt
        if (!gameData.playerName || gameData.playerName.trim() === '') {
            this.showNamePrompt();
            return;
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
        this.nameInstructions = this.add.text(400, 380, 'TAB: Switch fields | ENTER: Continue', {
            fontSize: '12px',
            fill: '#cccccc'
        }).setOrigin(0.5);
        
        // Current active field (0 = name, 1 = streamer)
        this.activeField = 0;
        this.updateFieldHighlight();
        
        // Enable keyboard input
        this.input.keyboard.on('keydown', this.handleNameInput, this);
    }
    
    handleNameInput(event) {
        if (event.key === 'Enter') {
            if (this.nameInput.trim() !== '') {
                gameData.playerName = this.nameInput.trim();
                gameData.twitchStreamer = this.streamerInput.trim() || 'Handemore7';
                gameData.save();
                this.hideNamePrompt();
                this.initializeGame();
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
    
    hideNamePrompt() {
        this.input.keyboard.off('keydown', this.handleNameInput, this);
        this.namePromptBg.destroy();
        this.namePromptTitle.destroy();
        this.nameLabel.destroy();
        this.nameInputText.destroy();
        this.streamerLabel.destroy();
        this.streamerInputText.destroy();
        this.nameInstructions.destroy();
    }
    
    initializeGame() {
        // Create player
        this.player = new Player(this, 400, 300);

        // Create buildings in corners
        this.storeBuilding = new Building(this, 100, 100, 'store', 'STORE');
        this.upgradesBuilding = new Building(this, 700, 100, 'upgrades', 'UPGRADES');
        this.decorationBuilding = new Building(this, 100, 500, 'decoration', 'DECORATION');
        this.fightsBuilding = new Building(this, 700, 500, 'fights', 'ARENA');

        // Create UI
        this.ui = new UI(this);

        // Create settings menu
        this.settingsMenu = new SettingsMenu(this);

        // ESC key for settings
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => this.settingsMenu.toggle());

        // Individual building collisions
        this.physics.add.collider(this.player, this.storeBuilding);
        this.physics.add.collider(this.player, this.upgradesBuilding);
        this.physics.add.collider(this.player, this.decorationBuilding);
        this.physics.add.collider(this.player, this.fightsBuilding);
        
        // Touch interaction zones (smaller overlap areas)
        this.createInteractionZone(this.storeBuilding);
        this.createInteractionZone(this.upgradesBuilding);
        this.createInteractionZone(this.decorationBuilding);
        this.createInteractionZone(this.fightsBuilding);
        
        // Initialize store system
        this.storeSystem = new Store(this);
        
        // Initialize upgrades system
        this.upgradesSystem = new Upgrades(this);
        
        // Initialize Twitch chat
        this.twitchChat = new TwitchChat(this);
        
        // Resume physics
        this.physics.resume();
    }

    createInteractionZone(building) {
        // Create invisible interaction zone around building
        const zone = this.add.zone(building.x, building.y, 80, 80);
        this.physics.add.existing(zone);
        zone.body.setImmovable(true);
        
        // Add overlap detection for interaction
        this.physics.add.overlap(this.player, zone, () => {
            // Don't open if any store is already open or building is on cooldown
            if (!building.interactionCooldown && !this.isAnyStoreOpen()) {
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
               (this.upgradesSystem && this.upgradesSystem.isOpen);
    }

    update() {
        if (this.player) {
            this.player.update();
        }
        if (this.ui) {
            this.ui.update();
        }
    }
}