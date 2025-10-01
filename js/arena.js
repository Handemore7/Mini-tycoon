class Arena {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.currentFloor = 1;
        this.maxFloors = 20;
        this.currentHealth = 0;
        this.totalCoinsEarned = 0;
        this.currentEnemy = null;
        this.turnState = 'waiting';
        this.attackTimer = null;
        this.defenseTimer = null;
        this.attackProgress = 0;
        this.attackClicked = false;
        
        this.createInterface();
        this.setupInputHandlers();
        
        // Initialize modules
        this.combatLog = new CombatLog(scene, this.combatLogContainer, this.logMask);
        this.combatSystem = new CombatSystem(this);
    }

    createInterface() {
        // Main background with rounded corners
        this.background = this.scene.add.graphics()
            .fillStyle(0x1a1a1a, 0.98)
            .fillRoundedRect(20, 20, 760, 560, 15)
            .lineStyle(3, 0x444444, 1)
            .strokeRoundedRect(20, 20, 760, 560, 15)
            .setVisible(false);
        
        // Header section
        this.headerBg = this.scene.add.graphics()
            .fillStyle(0x8b0000, 1)
            .fillRoundedRect(20, 20, 760, 60, 15)
            .setVisible(false);
        
        this.title = this.scene.add.text(400, 50, 'COMBAT ARENA', {
            fontSize: '24px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        this.closeButton = this.scene.add.text(750, 50, '✕', {
            fontSize: '18px',
            fill: '#ff6b6b',
            backgroundColor: '#333333',
            padding: { x: 8, y: 6 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.closeButton.on('pointerdown', () => this.close());

        // Description
        this.description = this.scene.add.text(400, 90, 'Battle through 20 floors of turn-based combat for coins and glory!', {
            fontSize: '14px',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        this.floorText = this.scene.add.text(400, 110, '', {
            fontSize: '18px',
            fill: '#ffaa00',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        this.combatLogContainer = this.scene.add.container(50, 140).setVisible(false);
        this.scrollOffset = 0;
        this.maxVisibleLines = 15;
        this.lineHeight = 18;
        
        this.logMask = this.scene.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(50, 140, 700, this.maxVisibleLines * this.lineHeight);
        this.logMask.setVisible(false);
        
        this.combatLogContainer.setMask(this.logMask.createGeometryMask());

        this.playerStats = this.scene.add.text(50, 420, '', {
            fontSize: '14px',
            fill: '#00ff00'
        }).setVisible(false);

        this.enemyStats = this.scene.add.text(400, 420, '', {
            fontSize: '14px',
            fill: '#ff6666'
        }).setVisible(false);

        this.actionPrompt = this.scene.add.text(400, 500, '', {
            fontSize: '16px',
            fill: '#ffff00',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        this.attackBar = this.scene.add.graphics().setVisible(false);
        this.defenseOverlay = this.scene.add.graphics().setVisible(false);

        this.attackButton = this.scene.add.text(200, 540, 'ATTACK', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#cc0000',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(3001);
        
        this.nextFloorButton = this.scene.add.text(600, 540, 'NEXT FLOOR', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#0066cc',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(3001);
        
        this.potionButton = this.scene.add.text(400, 540, 'USE POTION', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#00cc66',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(3001);

        // Start button for new runs
        this.startButton = this.scene.add.text(400, 540, 'START DUNGEON RUN', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(3001);
        this.startButton.on('pointerdown', () => this.start());

        this.elements = [this.background, this.headerBg, this.title, this.closeButton, this.description, this.floorText,
                       this.combatLogContainer, this.playerStats, this.enemyStats, this.actionPrompt,
                       this.attackBar, this.defenseOverlay, this.attackButton, this.nextFloorButton, this.potionButton,
                       this.startButton];
    }

    setupInputHandlers() {
        this.attackButton.on('pointerdown', () => {
            if (this.turnState === 'player_turn') {
                this.combatSystem.playerAttack();
            }
        });
        
        this.nextFloorButton.on('pointerdown', () => {
            if (this.turnState === 'waiting' && !this.currentEnemy) {
                if (this.currentFloor < this.maxFloors) {
                    this.currentFloor++;
                    this.enterFloor();
                } else {
                    this.completeDungeon();
                }
            }
        });
        
        this.potionButton.on('pointerdown', () => {
            if (this.turnState === 'player_turn') {
                this.usePotion();
            }
        });
        
        this.criticalInputHandler = (pointer) => {
            if (!this.isOpen || this.turnState !== 'critical_attack') return;
            this.combatSystem.handleCriticalInput();
        };
        
        this.dodgeInputHandler = () => {
            if (this.isOpen && this.turnState === 'dodge_event') {
                this.combatSystem.handleDodgeInput();
            }
        };
        
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    startDungeon() {
        this.currentFloor = 1;
        this.currentHealth = gameData?.stats?.health || 100;
        this.totalCoinsEarned = 0;
        
        // Check and activate critical madness if available
        if (window.criticalMadnessActive && !window.criticalMadnessUsed && window.webSocketManager) {
            window.webSocketManager.useCriticalMadness();
        }
        
        this.enterFloor();
    }

    enterFloor() {
        this.currentEnemy = EnemyGenerator.generateEnemy(this.currentFloor);
        this.turnState = 'waiting';
        this.combatLog.addLog(`\n=== FLOOR ${this.currentFloor} ===`, '#ffffff');
        
        if (this.currentEnemy.isBoss) {
            this.combatLog.addLog(`💀 BOSS FIGHT! ${this.currentEnemy.name} appears!`, '#ff6600');
        } else {
            this.combatLog.addColoredLog([
                { text: 'A ', color: '#ffffff' },
                { text: `${this.currentEnemy.name}`, color: '#ff9999' },
                { text: ' appears!', color: '#ffffff' }
            ]);
        }
        
        this.updateDisplay();
        this.scene.time.delayedCall(1500, () => this.startPlayerTurn());
    }

    startPlayerTurn() {
        if (!this.currentEnemy || this.currentEnemy.health <= 0) return;
        
        this.combatSystem.applyStatusEffects();
        this.turnState = 'player_turn';
        this.combatLog.addLog('Your turn! Choose your action.', '#ffffff');
        this.updateDisplay();
    }
    
    usePotion() {
        const potions = gameData?.healthPotions || 0;
        const currentHealth = this.currentHealth;
        const maxHealth = gameData?.stats?.maxHealth || 100;
        
        if (this.combatSystem.statusEffects.wounded > 0) {
            this.combatLog.addColoredLog([
                { text: '❌ Cannot use potions while ', color: '#ffffff' },
                { text: 'wounded!', color: '#ff6666' }
            ]);
            this.showTempFeedback(`❌ Wounded! Cannot Use Potions!\n${this.combatSystem.statusEffects.wounded} turns remaining`, '#ff6666');
            return;
        }
        
        if (potions <= 0) {
            this.combatLog.addColoredLog([
                { text: '❌ No ', color: '#ffffff' },
                { text: 'health potions', color: '#00ff00' },
                { text: ' available!', color: '#ffffff' }
            ]);
            this.showTempFeedback('❌ No Potions Available!\nBuy potions from the store', '#ff6666');
            return;
        }
        
        if (currentHealth >= maxHealth) {
            this.combatLog.addColoredLog([
                { text: '❌ Already at ', color: '#ffffff' },
                { text: 'full health!', color: '#00ff00' }
            ]);
            this.showTempFeedback('❌ Already at Full Health!\nNo need to use a potion', '#ffaa00');
            return;
        }
        
        gameData.healthPotions--;
        const healAmount = 50;
        const oldHealth = this.currentHealth;
        this.currentHealth = Math.min(maxHealth, this.currentHealth + healAmount);
        const actualHeal = this.currentHealth - oldHealth;
        
        this.combatLog.addColoredLog([
            { text: '✅ Used health potion! Healed ', color: '#00ff00' },
            { text: `${actualHeal} HP.`, color: '#ffffff' }
        ]);
        this.updateDisplay();
        
        if (gameData?.save) gameData.save();
        if (window.memoryManager) {
            window.memoryManager.createTimer(this.scene, {
                delay: 1000,
                callback: () => this.combatSystem.startEnemyTurn()
            });
        } else {
            this.scene.time.delayedCall(1000, () => this.combatSystem.startEnemyTurn());
        }
    }
    
    showTempFeedback(message, color) {
        if (this.actionPrompt) {
            this.actionPrompt.setText(message);
            this.actionPrompt.setStyle({ fill: color });
            this.actionPrompt.setVisible(true);
            
            this.scene.time.delayedCall(2000, () => {
                if (this.actionPrompt && this.turnState === 'player_turn') {
                    this.actionPrompt.setText('');
                    this.actionPrompt.setVisible(false);
                    this.actionPrompt.setStyle({ fill: '#ffff00' });
                }
            });
        }
    }

    completeDungeon() {
        this.combatLog.addLog('\n🎉 DUNGEON COMPLETED! 🎉', '#00ff00');
        this.combatLog.addColoredLog([
            { text: 'Total coins earned: ', color: '#ffffff' },
            { text: `${this.totalCoinsEarned}`, color: '#ffff00' }
        ]);
        
        if (gameData?.addMoney) {
            gameData.addMoney(this.totalCoinsEarned);
        }
        
        if (this.currentFloor > (gameData?.bestArenaWave || 0)) {
            gameData.bestArenaWave = this.currentFloor;
        }
        
        // Mark arena as completed
        gameData.arenaCompleted = true;
        
        if (gameData?.save) gameData.save();
        
        // Show cleared status on building
        this.showClearedStatus();
        
        if (window.memoryManager) {
            window.memoryManager.createTimer(this.scene, {
                delay: 3000,
                callback: () => this.forceClose()
            });
        } else {
            this.scene.time.delayedCall(3000, () => this.forceClose());
        }
    }
    
    showClearedStatus() {
        // Add "CLEARED" text above arena building
        if (this.scene.fightsBuilding && !this.scene.arenaClearedText) {
            this.scene.arenaClearedText = this.scene.add.text(
                this.scene.fightsBuilding.x, 
                this.scene.fightsBuilding.y - 50, 
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
    }

    gameOver() {
        // Reset critical madness on death
        if (window.webSocketManager) {
            window.webSocketManager.resetCriticalMadness();
        }
        
        // Force reset all combat states on death
        this.turnState = 'waiting';
        this.criticalSuccess = false;
        this.criticalBarPosition = 0;
        this.criticalBarDirection = 1;
        this.criticalInputEnabled = false;
        this.attackProgress = 0;
        this.attackClicked = false;
        this.defenseTimeLeft = 0;
        this.dodgeClicked = false;
        
        // Clean up timers
        if (this.attackTimer) {
            this.attackTimer.destroy();
            this.attackTimer = null;
        }
        if (this.defenseTimer) {
            this.defenseTimer.destroy();
            this.defenseTimer = null;
        }
        
        const coinsKept = Math.floor(this.totalCoinsEarned * 0.5);
        if (gameData?.addMoney) gameData.addMoney(coinsKept);
        
        this.combatLog.addLog('\n💀 YOU DIED! 💀', '#ff6666');
        this.combatLog.addColoredLog([
            { text: 'Reached Floor ', color: '#ffffff' },
            { text: `${this.currentFloor}`, color: '#ffaa00' }
        ]);
        this.combatLog.addColoredLog([
            { text: 'Kept ', color: '#ffffff' },
            { text: `${coinsKept} coins`, color: '#ffff00' },
            { text: ` (50% of ${this.totalCoinsEarned})`, color: '#cccccc' }
        ]);
        
        if (this.currentFloor > (gameData?.bestArenaWave || 0)) {
            gameData.bestArenaWave = this.currentFloor;
        }
        
        if (gameData?.save) gameData.save();
        this.hideAttackUI();
        this.hideDefenseUI();
        
        if (window.memoryManager) {
            window.memoryManager.createTimer(this.scene, {
                delay: 3000,
                callback: () => this.forceClose()
            });
        } else {
            this.scene.time.delayedCall(3000, () => this.forceClose());
        }
    }

    hideAttackUI() {
        if (this.attackBar) this.attackBar.setVisible(false);
        if (this.actionPrompt) {
            this.actionPrompt.setText('');
            this.actionPrompt.setVisible(false);
        }
    }

    hideDefenseUI() {
        if (this.defenseOverlay) this.defenseOverlay.setVisible(false);
        if (this.actionPrompt) {
            this.actionPrompt.setText('');
            this.actionPrompt.setVisible(false);
        }
    }

    handleScroll(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        if (!this.isOpen || !this.combatLogContainer.visible) return;
        this.combatLog.handleScroll(pointer, deltaY);
    }
    
    resetDungeon() {
        this.currentFloor = 1;
        this.currentHealth = 0;
        this.totalCoinsEarned = 0;
        this.currentEnemy = null;
        this.turnState = 'waiting';
        
        // Reset combat system status effects
        if (this.combatSystem) {
            this.combatSystem.statusEffects = { poisoned: 0, wounded: 0 };
        }
        
        // Clean up all timers and states
        if (this.attackTimer) {
            this.attackTimer.destroy();
            this.attackTimer = null;
        }
        if (this.defenseTimer) {
            this.defenseTimer.destroy();
            this.defenseTimer = null;
        }
        
        // Reset ALL critical attack and defense states
        this.criticalSuccess = false;
        this.criticalBarPosition = 0;
        this.criticalBarDirection = 1;
        this.criticalInputEnabled = false;
        this.attackProgress = 0;
        this.attackClicked = false;
        this.defenseTimeLeft = 0;
        this.dodgeClicked = false;
        
        this.hideAttackUI();
        this.hideDefenseUI();
        this.combatLog.reset();
        this.updateDisplay();
    }
    
    updateDisplay() {
        if (this.floorText) {
            this.floorText.setText(`Floor ${this.currentFloor}/${this.maxFloors} | Coins: ${this.totalCoinsEarned}`);
        }
        
        // Show/hide start button based on game state
        if (this.startButton) {
            const showStart = !this.currentEnemy && this.currentFloor === 1 && this.totalCoinsEarned === 0;
            this.startButton.setVisible(showStart);
        }
        
        const health = this.currentHealth || (gameData?.stats?.health || 100);
        const maxHealth = gameData?.stats?.maxHealth || 100;
        const damage = gameData?.stats?.damage || 10;
        const armor = gameData?.stats?.armor || 0;
        const critChance = Math.floor(this.combatSystem.getCriticalChance() * 100);
        const dodgeChance = Math.floor(this.combatSystem.getDodgeChance() * 100);
        const potions = gameData?.healthPotions || 0;
        
        let statusText = '';
        if (this.combatSystem.statusEffects.poisoned > 0) statusText += `🐍 Poisoned (${this.combatSystem.statusEffects.poisoned})\n`;
        if (this.combatSystem.statusEffects.wounded > 0) statusText += `🩸 Wounded (${this.combatSystem.statusEffects.wounded})\n`;
        
        if (this.playerStats) {
            this.playerStats.setText(
                `PLAYER\n` +
                `Health: ${health}/${maxHealth}\n` +
                `Damage: ${damage}\n` +
                `Armor: ${armor}\n` +
                `Crit: ${critChance}%\n` +
                `Dodge: ${dodgeChance}%\n` +
                `Potions: ${potions}\n` +
                statusText
            );
        }
        
        if (this.enemyStats) {
            if (this.currentEnemy) {
                this.enemyStats.setText(
                    `${this.currentEnemy.name.toUpperCase()}\n` +
                    `Health: ${this.currentEnemy.health}/${this.currentEnemy.maxHealth}\n` +
                    `Damage: ${this.currentEnemy.damage}\n` +
                    `Reward: ${this.currentEnemy.coins} coins`
                );
            } else {
                this.enemyStats.setText('No enemy');
            }
        }
        
        if (this.attackButton) {
            this.attackButton.setVisible(this.turnState === 'player_turn');
        }
        
        if (this.potionButton) {
            const showPotion = this.turnState === 'player_turn' && (gameData?.healthPotions || 0) > 0;
            this.potionButton.setVisible(showPotion);
            
            if (this.combatSystem.statusEffects.wounded > 0) {
                this.potionButton.setStyle({ backgroundColor: '#666666' });
            } else {
                this.potionButton.setStyle({ backgroundColor: '#00cc66' });
            }
        }
        
        if (this.nextFloorButton) {
            const showNext = this.turnState === 'waiting' && !this.currentEnemy && this.currentFloor <= this.maxFloors;
            this.nextFloorButton.setVisible(showNext);
            if (showNext) {
                this.nextFloorButton.setText(this.currentFloor >= this.maxFloors ? 'COMPLETE' : 'NEXT FLOOR');
            }
        }
    }

    open() {
        this.isOpen = true;
        this.combatLog.reset();
        
        this.scene.input.on('pointerdown', this.criticalInputHandler);
        this.spaceKey.on('down', this.dodgeInputHandler);
        this.scene.input.on('wheel', this.handleScroll, this);
        
        // Add beforeunload protection
        this.beforeUnloadHandler = (e) => {
            if (this.isInActiveCombat()) {
                e.preventDefault();
                e.returnValue = 'You are in active combat! All progress will be lost if you leave.';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', this.beforeUnloadHandler);
        
        this.updateDisplay();
        this.elements.forEach(element => {
            element.setVisible(true);
            element.setDepth(3000);
        });
        
        this.scene.physics.pause();
        
        // Save when opening arena
        if (gameData?.save) gameData.save();
    }

    close() {
        // Check if player is in active combat
        if (this.isInActiveCombat()) {
            this.showExitConfirmation();
            return;
        }
        
        this.forceClose();
    }
    
    isInActiveCombat() {
        return this.currentEnemy && this.currentEnemy.health > 0 && this.currentFloor > 1;
    }
    
    showExitConfirmation() {
        // Create confirmation dialog
        const confirmBg = this.scene.add.graphics()
            .fillStyle(0x000000, 0.8)
            .fillRect(0, 0, 800, 600)
            .setDepth(4000);
            
        const confirmBox = this.scene.add.graphics()
            .fillStyle(0x2c3e50, 0.95)
            .fillRoundedRect(200, 200, 400, 200, 10)
            .lineStyle(2, 0xe74c3c, 1)
            .strokeRoundedRect(200, 200, 400, 200, 10)
            .setDepth(4001);
            
        const confirmText = this.scene.add.text(400, 280, 'Leave Arena?\n\nAll progress will be lost!\nYou will restart from Floor 1.', {
            fontSize: '16px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(4002);
        
        const yesBtn = this.scene.add.text(320, 350, 'YES, LEAVE', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#e74c3c',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(4002).setInteractive();
        
        const noBtn = this.scene.add.text(480, 350, 'STAY', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#27ae60',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(4002).setInteractive();
        
        yesBtn.on('pointerdown', () => {
            confirmBg.destroy();
            confirmBox.destroy();
            confirmText.destroy();
            yesBtn.destroy();
            noBtn.destroy();
            this.forceClose();
        });
        
        noBtn.on('pointerdown', () => {
            confirmBg.destroy();
            confirmBox.destroy();
            confirmText.destroy();
            yesBtn.destroy();
            noBtn.destroy();
        });
    }
    
    forceClose() {
        this.isOpen = false;
        
        // Remove beforeunload protection
        if (this.beforeUnloadHandler) {
            window.removeEventListener('beforeunload', this.beforeUnloadHandler);
            this.beforeUnloadHandler = null;
        }
        
        // Reset critical madness when leaving arena
        if (window.webSocketManager) {
            window.webSocketManager.resetCriticalMadness();
        }
        
        this.scene.input.off('pointerdown', this.criticalInputHandler);
        this.spaceKey.off('down', this.dodgeInputHandler);
        this.scene.input.off('wheel', this.handleScroll, this);
        
        // Force cleanup all timers and combat states
        if (this.attackTimer) {
            this.attackTimer.destroy();
            this.attackTimer = null;
        }
        if (this.defenseTimer) {
            this.defenseTimer.destroy();
            this.defenseTimer = null;
        }
        
        // Reset ALL combat system states
        this.turnState = 'waiting';
        this.criticalSuccess = false;
        this.criticalBarPosition = 0;
        this.criticalBarDirection = 1;
        this.criticalInputEnabled = false;
        this.attackProgress = 0;
        this.attackClicked = false;
        this.defenseTimeLeft = 0;
        this.dodgeClicked = false;
        
        // Reset combat system status effects
        if (this.combatSystem) {
            this.combatSystem.statusEffects = { poisoned: 0, wounded: 0 };
        }
        
        // Hide all combat UI elements
        this.hideAttackUI();
        this.hideDefenseUI();
        
        this.resetDungeon();
        this.elements.forEach(element => element.setVisible(false));
        
        this.scene.physics.resume();
        this.addCloseCooldown();
    }

    addCloseCooldown() {
        const buildings = [this.scene.storeBuilding, this.scene.upgradesBuilding, 
                          this.scene.decorationBuilding, this.scene.fightsBuilding];
        
        buildings.forEach(building => {
            if (building) {
                building.interactionCooldown = true;
                if (window.memoryManager) {
                    window.memoryManager.createTimer(this.scene, {
                        delay: 2000,
                        callback: () => { building.interactionCooldown = false; }
                    });
                } else {
                    this.scene.time.delayedCall(2000, () => {
                        building.interactionCooldown = false;
                    });
                }
            }
        });
    }
    
    start() {
        if (!this.currentEnemy && this.currentFloor === 1 && this.totalCoinsEarned === 0) {
            this.startDungeon();
        }
    }
}