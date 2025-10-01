class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Start with south-facing sprite
        const spriteKey = scene.textures.exists('player_south') ? 'player_south' : 'player_fallback';
        super(scene, x, y, spriteKey);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setScale(1.5);
        this.body.setSize(16, 16);
        
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys('W,S,A,D');
        
        this.lastMoneyTime = Date.now();
        this.currentDirection = 'south';
        this.lastPositionSave = Date.now();
        this.lastX = x;
        this.lastY = y;
        
        // Track object for memory management
        if (window.memoryManager) {
            window.memoryManager.trackObject(this, 'Player');
        }
    }

    update() {
        // Movement
        this.body.setVelocity(0);
        
        const speed = gameData.stats.moveSpeed;
        let newDirection = this.currentDirection;
        
        const left = this.cursors.left.isDown || this.wasd.A.isDown;
        const right = this.cursors.right.isDown || this.wasd.D.isDown;
        const up = this.cursors.up.isDown || this.wasd.W.isDown;
        const down = this.cursors.down.isDown || this.wasd.S.isDown;
        
        // Determine direction and movement
        if (left && up) {
            this.body.setVelocity(-speed, -speed);
            newDirection = 'north-west';
        } else if (right && up) {
            this.body.setVelocity(speed, -speed);
            newDirection = 'north-east';
        } else if (left && down) {
            this.body.setVelocity(-speed, speed);
            newDirection = 'south-west';
        } else if (right && down) {
            this.body.setVelocity(speed, speed);
            newDirection = 'south-east';
        } else if (left) {
            this.body.setVelocityX(-speed);
            newDirection = 'west';
        } else if (right) {
            this.body.setVelocityX(speed);
            newDirection = 'east';
        } else if (up) {
            this.body.setVelocityY(-speed);
            newDirection = 'north';
        } else if (down) {
            this.body.setVelocityY(speed);
            newDirection = 'south';
        }
        
        // Update animation if direction changed or movement state changed
        const isMoving = this.body.velocity.x !== 0 || this.body.velocity.y !== 0;
        
        if (newDirection !== this.currentDirection) {
            this.currentDirection = newDirection;
        }
        
        if (isMoving) {
            if (this.scene.anims.exists(`walk_${this.currentDirection}`)) {
                this.play(`walk_${this.currentDirection}`, true);
            } else {
                console.log('Animation not found:', `walk_${this.currentDirection}`);
                const spriteKey = this.scene.textures.exists(`player_${this.currentDirection}`) ? `player_${this.currentDirection}` : 'player_fallback';
                this.setTexture(spriteKey);
            }
        } else {
            this.stop();
            const spriteKey = this.scene.textures.exists(`player_${this.currentDirection}`) ? `player_${this.currentDirection}` : 'player_fallback';
            this.setTexture(spriteKey);
            
            // Save position when stopping (if position changed)
            if (this.lastX !== this.x || this.lastY !== this.y) {
                gameData.updatePlayerPosition(this.x, this.y);
                this.lastX = this.x;
                this.lastY = this.y;
            }
        }

        // Passive money generation (every 5 seconds) with error handling
        const now = Date.now();
        if (now - this.lastMoneyTime > 5000) {
            try {
                gameData.addMoney(gameData.passiveIncome || 1);
                this.lastMoneyTime = now;
                window.errorLogger?.trackGameEvent('passive_income', { amount: gameData.passiveIncome || 1 });
            } catch (error) {
                window.errorLogger?.error('Passive income error:', error);
            }
        }
        
        // Save position every 2 seconds when moving with rate limiting
        if (isMoving && now - this.lastPositionSave > 2000) {
            try {
                gameData.updatePlayerPosition(this.x, this.y);
                this.lastPositionSave = now;
            } catch (error) {
                window.errorLogger?.error('Position save error:', error);
            }
        }
    }
}