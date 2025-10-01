class Arena {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.isInCombat = false;
        this.currentWave = 0;
        this.currentHealth = 0;
        this.totalCoinsEarned = 0;
        this.enemies = [];
        this.combatState = 'waiting'; // waiting, attacking, defending
        this.attackTimer = null;
        this.defenseTimer = null;
        this.attackProgress = 0;
        this.defenseTimeLeft = 0;
        this.combo = 0;
        this.createInterface();
        this.setupInputHandlers();
    }

    createInterface() {
        // Clean background
        this.background = this.scene.add.graphics()
            .fillStyle(0x000000, 0.95)
            .fillRect(0, 0, 800, 600)
            .setVisible(false);
        
        // Simple title
        this.title = this.scene.add.text(400, 50, 'ARENA', {
            fontSize: '32px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Close button
        this.closeButton = this.scene.add.text(750, 50, 'X', {
            fontSize: '24px',
            fill: '#ff0000',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.closeButton.on('pointerdown', () => this.close());

        // Main status (center)
        this.mainStatus = this.scene.add.text(400, 150, '', {
            fontSize: '20px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Health bar
        this.healthBarBg = this.scene.add.graphics().setVisible(false);
        this.healthBarFill = this.scene.add.graphics().setVisible(false);
        this.healthText = this.scene.add.text(400, 200, '', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5).setVisible(false);

        // Combat action area (center screen)
        this.actionPrompt = this.scene.add.text(400, 300, '', {
            fontSize: '24px',
            fill: '#ffff00',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Interactive elements
        this.attackBar = this.scene.add.graphics().setVisible(false);
        this.defenseOverlay = this.scene.add.graphics().setVisible(false);

        // Bottom buttons
        this.actionButton = this.scene.add.text(400, 500, '', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setVisible(false).setInteractive();

        this.elements = [this.background, this.title, this.closeButton, this.mainStatus,
                       this.healthBarBg, this.healthBarFill, this.healthText,
                       this.actionPrompt, this.attackBar, this.defenseOverlay, this.actionButton];
    }

    generateWave(waveNumber) {
        const enemyCount = Math.min(1 + Math.floor(waveNumber / 3), 5);
        const enemies = [];
        
        for (let i = 0; i < enemyCount; i++) {
            const enemy = this.createEnemy(waveNumber);
            enemies.push(enemy);
        }
        
        return enemies;
    }

    createEnemy(waveNumber) {
        const types = ['Slime', 'Goblin', 'Orc', 'Dragon', 'Demon'];
        const typeIndex = Math.min(Math.floor((waveNumber - 1) / 5), types.length - 1);
        const type = types[typeIndex];
        
        const baseHealth = [20, 40, 80, 150, 300][typeIndex];
        const baseDamage = [5, 10, 18, 30, 50][typeIndex];
        
        const healthMultiplier = 1 + (waveNumber - 1) * 0.1;
        const damageMultiplier = 1 + (waveNumber - 1) * 0.05;
        
        return {
            type: type,
            health: Math.floor(baseHealth * healthMultiplier),
            maxHealth: Math.floor(baseHealth * healthMultiplier),
            damage: Math.floor(baseDamage * damageMultiplier)
        };
    }

    startArena() {
        this.currentWave = 0;
        this.currentHealth = gameData.stats.health;
        this.totalCoinsEarned = 0;
        this.isInCombat = true;
        this.nextWave();
    }

    nextWave() {
        this.currentWave++;
        this.enemies = this.generateWave(this.currentWave);
        this.updateDisplay();
    }

    setupInputHandlers() {
        // Mouse input for attacks
        this.scene.input.on('pointerdown', (pointer) => {
            if (!this.isOpen || !this.isInCombat) return;
            
            if (pointer.leftButtonDown() && this.combatState === 'attacking') {
                this.handleAttackInput();
            }
        });
        
        // Keyboard input for defense
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', () => {
            if (this.isOpen && this.isInCombat && this.combatState === 'defending') {
                this.handleDefenseInput();
            }
        });
    }

    fightWave() {
        if (this.enemies.length === 0) {
            this.nextWave();
            return;
        }

        this.startInteractiveCombat();
    }

    startInteractiveCombat() {
        this.currentEnemyIndex = 0;
        this.fightCurrentEnemy();
    }

    fightCurrentEnemy() {
        if (this.currentEnemyIndex >= this.enemies.length) {
            this.completeWave();
            return;
        }

        const enemy = this.enemies[this.currentEnemyIndex];
        this.startPlayerAttack();
    }

    startPlayerAttack() {
        this.combatState = 'attacking';
        this.attackProgress = 0;
        
        if (this.actionPrompt) {
            this.actionPrompt.setText('⚔️ ATTACK!\nLEFT CLICK FOR CRITICAL');
            this.actionPrompt.setVisible(true);
        }
        
        // Simple attack bar
        this.attackBar.setVisible(true);
        
        // Animate attack bar
        this.attackTimer = this.scene.time.addEvent({
            delay: 50,
            callback: this.updateAttackBar,
            callbackScope: this,
            loop: true
        });
        
        // Progressive difficulty: shorter attack window each wave
        const baseTime = 2500;
        const timeReduction = Math.min(this.currentWave * 100, 1000); // Max -1 second
        const attackTime = Math.max(baseTime - timeReduction, 1500); // Min 1.5 seconds
        
        this.scene.time.delayedCall(attackTime, () => {
            if (this.combatState === 'attacking') {
                this.handleAttackInput();
            }
        });
    }

    updateAttackBar() {
        // Progressive difficulty: faster bar speed each wave
        const baseSpeed = 3;
        const speedIncrease = Math.min(this.currentWave * 0.3, 4); // Max +4 speed
        this.attackProgress += baseSpeed + speedIncrease;
        
        if (this.attackProgress > 100) this.attackProgress = 0;
        
        // Clean attack bar
        this.attackBar.clear();
        
        // Background
        this.attackBar.fillStyle(0x333333)
            .fillRect(200, 350, 400, 30);
        
        // Progressive difficulty: smaller perfect zone each wave
        const basePerfectZone = 10; // ±5 from center (50)
        const zoneReduction = Math.min(this.currentWave * 0.5, 6); // Max -6 zone size
        const perfectZone = Math.max(basePerfectZone - zoneReduction, 4); // Min 4 zone size
        
        const perfectStart = 50 - (perfectZone / 2);
        const perfectEnd = 50 + (perfectZone / 2);
        const goodZone = perfectZone + 10;
        const goodStart = 50 - (goodZone / 2);
        const goodEnd = 50 + (goodZone / 2);
        
        // Store for attack input handling
        this.currentPerfectStart = perfectStart;
        this.currentPerfectEnd = perfectEnd;
        this.currentGoodStart = goodStart;
        this.currentGoodEnd = goodEnd;
        
        // Progress fill
        const barWidth = (this.attackProgress / 100) * 400;
        let color = 0xff0000; // Red
        
        if (this.attackProgress >= perfectStart && this.attackProgress <= perfectEnd) {
            color = 0x00ff00; // Green (perfect)
        } else if (this.attackProgress >= goodStart && this.attackProgress <= goodEnd) {
            color = 0xffff00; // Yellow (good)
        }
        
        this.attackBar.fillStyle(color)
            .fillRect(200, 350, barWidth, 30);
        
        // Perfect zone indicator (shrinks with difficulty)
        const zonePixels = (perfectZone / 100) * 400;
        const zoneStart = 200 + (perfectStart / 100) * 400;
        this.attackBar.lineStyle(2, 0xffffff)
            .strokeRect(zoneStart - 2, 345, zonePixels + 4, 40);
    }

    handleAttackInput() {
        if (this.attackTimer) {
            this.attackTimer.destroy();
            this.attackTimer = null;
        }
        
        this.hideAttackUI();
        
        const enemy = this.enemies[this.currentEnemyIndex];
        let damage = gameData.stats.damage;
        let result = 'HIT';
        
        // Calculate damage based on dynamic timing zones
        if (this.attackProgress >= this.currentPerfectStart && this.attackProgress <= this.currentPerfectEnd) {
            damage = Math.floor(damage * 1.5); // Critical hit
            result = 'CRITICAL!';
            this.combo++;
        } else if (this.attackProgress >= this.currentGoodStart && this.attackProgress <= this.currentGoodEnd) {
            damage = Math.floor(damage * 1.2); // Good hit
            result = 'GOOD HIT';
            this.combo++;
        } else {
            this.combo = 0; // Reset combo on miss
        }
        
        // Apply combo bonus
        if (this.combo > 1) {
            const comboMultiplier = 1 + (this.combo - 1) * 0.1;
            damage = Math.floor(damage * comboMultiplier);
        }
        
        enemy.health -= damage;
        
        this.showDamageNumber(damage, result);
        this.updateDisplay();
        
        if (enemy.health <= 0) {
            this.currentEnemyIndex++;
            this.scene.time.delayedCall(1000, () => this.fightCurrentEnemy());
        } else {
            this.scene.time.delayedCall(1000, () => this.startEnemyAttack());
        }
    }

    startEnemyAttack() {
        this.combatState = 'defending';
        
        // Progressive difficulty: shorter defense window each wave
        const baseDefenseTime = 1.5;
        const timeReduction = Math.min(this.currentWave * 0.05, 0.7); // Max -0.7 seconds
        this.defenseTimeLeft = Math.max(baseDefenseTime - timeReduction, 0.8); // Min 0.8 seconds
        
        if (this.actionPrompt) {
            this.actionPrompt.setText('🛡️ DEFEND!\nPRESS SPACEBAR TO BLOCK');
            this.actionPrompt.setVisible(true);
        }
        
        // Red warning overlay
        this.defenseOverlay.clear()
            .fillStyle(0xff0000, 0.2)
            .fillRect(0, 0, 800, 600);
        this.defenseOverlay.setVisible(true);
        
        this.defenseTimer = this.scene.time.addEvent({
            delay: 100,
            callback: this.updateDefenseTimer,
            callbackScope: this,
            loop: true
        });
        
        // Auto-fail after dynamic time
        const defenseTimeMs = this.defenseTimeLeft * 1000;
        this.scene.time.delayedCall(defenseTimeMs, () => {
            if (this.combatState === 'defending') {
                this.handleDefenseInput(false);
            }
        });
    }

    updateDefenseTimer() {
        this.defenseTimeLeft -= 0.1;
        const timeText = Math.max(0, this.defenseTimeLeft).toFixed(1);
        if (this.actionPrompt) {
            this.actionPrompt.setText(`🛡️ DEFEND!\nPRESS SPACEBAR TO BLOCK\n${timeText}s`);
        }
    }

    handleDefenseInput(clicked = true) {
        if (this.defenseTimer) {
            this.defenseTimer.destroy();
            this.defenseTimer = null;
        }
        
        this.hideDefenseUI();
        
        const enemy = this.enemies[this.currentEnemyIndex];
        let damage = Math.max(1, enemy.damage - gameData.stats.armor);
        let result = '';
        
        if (clicked && this.defenseTimeLeft > 0) {
            damage = Math.floor(damage * 0.5); // Successful block
            result = 'BLOCKED!';
        } else {
            result = 'HIT!';
            this.combo = 0; // Reset combo on failed defense
        }
        
        this.currentHealth -= damage;
        this.showDamageNumber(damage, result, true);
        this.updateDisplay();
        
        if (this.currentHealth <= 0) {
            this.gameOver();
            return;
        }
        
        this.scene.time.delayedCall(1000, () => this.startPlayerAttack());
    }

    showDamageNumber(damage, result, isDefense = false) {
        const color = isDefense ? (result === 'BLOCKED!' ? '#00aaff' : '#ff6666') : 
                     (result === 'CRITICAL!' ? '#ffaa00' : '#ffffff');
        
        const text = this.scene.add.text(400, 180, `${damage} ${result}`, {
            fontSize: '20px',
            fill: color,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(3000);
        
        // Animate damage number
        this.scene.tweens.add({
            targets: text,
            y: 140,
            alpha: 0,
            duration: 1000,
            onComplete: () => text.destroy()
        });
    }

    hideAttackUI() {
        if (this.attackBar) this.attackBar.setVisible(false);
        if (this.actionPrompt) this.actionPrompt.setVisible(false);
    }

    hideDefenseUI() {
        if (this.defenseOverlay) this.defenseOverlay.setVisible(false);
        if (this.actionPrompt) this.actionPrompt.setVisible(false);
    }

    completeWave() {
        this.combatState = 'waiting';
        
        // Wave completed
        const waveReward = this.calculateWaveReward(this.currentWave);
        const comboBonus = Math.floor(waveReward * this.combo * 0.1);
        const totalReward = waveReward + comboBonus;
        
        this.totalCoinsEarned += totalReward;
        
        let logText = `🎉 Wave ${this.currentWave} completed!\n+${waveReward} coins`;
        if (comboBonus > 0) {
            logText += `\n🔥 Combo bonus: +${comboBonus} coins!`;
        }
        
        // Check for milestone bonus
        const milestone = this.getMilestoneBonus(this.currentWave);
        if (milestone.bonus > 0) {
            this.totalCoinsEarned += milestone.bonus;
            logText += `\n🏆 Milestone bonus: +${milestone.bonus} coins!`;
            if (milestone.item) {
                logText += `\n🎁 Bonus item: ${milestone.item}`;
                this.giveBonus(milestone.item);
            }
        }
        
        this.enemies = [];
        this.combo = 0;
        this.updateDisplay();
    }

    calculateWaveReward(wave) {
        if (wave <= 5) return 10;
        if (wave <= 10) return 25;
        if (wave <= 15) return 50;
        if (wave <= 20) return 100;
        return 200;
    }

    getMilestoneBonus(wave) {
        const milestones = {
            5: { bonus: 100, item: null },
            10: { bonus: 300, item: 'Health Potion' },
            15: { bonus: 500, item: 'Rare Decoration' },
            20: { bonus: 1000, item: 'Achievement' },
            25: { bonus: 2000, item: 'Legendary Title' }
        };
        return milestones[wave] || { bonus: 0, item: null };
    }

    giveBonus(item) {
        if (item === 'Health Potion') {
            gameData.healthPotions = (gameData.healthPotions || 0) + 1;
        } else if (item === 'Achievement') {
            gameData.arenaWins = (gameData.arenaWins || 0) + 1;
            if (typeof achievements !== 'undefined') {
                achievements.checkAchievement('arenaWin');
            }
        }
    }

    usePotion() {
        if (gameData.healthPotions > 0 && this.currentHealth < gameData.stats.maxHealth) {
            gameData.healthPotions--;
            this.currentHealth = Math.min(gameData.stats.maxHealth, this.currentHealth + 50);
            this.combatLog.setText('Used health potion! +50 HP');
            this.updateDisplay();
            gameData.save();
        }
    }

    cashOut() {
        if (this.totalCoinsEarned > 0) {
            gameData.addMoney(this.totalCoinsEarned);
            this.combatLog.setText(`Cashed out ${this.totalCoinsEarned} coins!\nBest run: Wave ${this.currentWave}`);
            
            // Update best wave record
            if (this.currentWave > (gameData.bestArenaWave || 0)) {
                gameData.bestArenaWave = this.currentWave;
            }
            
            gameData.save();
        }
        this.resetArena();
    }

    gameOver() {
        const coinsKept = Math.floor(this.totalCoinsEarned * 0.5);
        gameData.addMoney(coinsKept);
        
        this.combatLog.setText(`💀 GAME OVER! 💀\nReached Wave ${this.currentWave}\nKept ${coinsKept} coins (50% of ${this.totalCoinsEarned})`);
        
        // Update best wave record
        if (this.currentWave > (gameData.bestArenaWave || 0)) {
            gameData.bestArenaWave = this.currentWave;
        }
        
        gameData.save();
        this.resetArena();
    }

    resetArena() {
        this.isInCombat = false;
        this.currentWave = 0;
        this.currentHealth = 0;
        this.totalCoinsEarned = 0;
        this.enemies = [];
        this.updateDisplay();
    }

    updateDisplay() {
        // Main status
        if (this.mainStatus) {
            if (this.isInCombat) {
                let statusText = `Wave ${this.currentWave}\nCoins: ${this.totalCoinsEarned}`;
                if (this.combo > 1) {
                    statusText += `\n🔥 ${this.combo}x Combo!`;
                }
                this.mainStatus.setText(statusText);
            } else {
                this.mainStatus.setText(`Ready to Fight!\nBest Wave: ${gameData.bestArenaWave || 0}`);
            }
        }

        // Health bar
        const health = this.isInCombat ? this.currentHealth : gameData.stats.health;
        const maxHealth = gameData.stats.maxHealth;
        const healthPercent = health / maxHealth;
        
        if (this.healthBarBg) {
            this.healthBarBg.clear()
                .fillStyle(0x333333)
                .fillRect(250, 180, 300, 20);
        }
        
        let healthColor = 0x00ff00;
        if (healthPercent < 0.5) healthColor = 0xffff00;
        if (healthPercent < 0.25) healthColor = 0xff0000;
        
        if (this.healthBarFill) {
            this.healthBarFill.clear()
                .fillStyle(healthColor)
                .fillRect(250, 180, 300 * healthPercent, 20);
        }
        
        if (this.healthText) {
            this.healthText.setText(`Health: ${health}/${maxHealth}`);
        }
        
        // Action button
        if (this.actionButton) {
            if (!this.isInCombat) {
                this.actionButton.setText('START ARENA');
                this.actionButton.removeAllListeners('pointerdown');
                this.actionButton.on('pointerdown', () => this.startArena());
                this.actionButton.setVisible(true);
            } else if (this.combatState === 'waiting') {
                if (this.enemies.length === 0) {
                    this.actionButton.setText('NEXT WAVE');
                    this.actionButton.removeAllListeners('pointerdown');
                    this.actionButton.on('pointerdown', () => this.fightWave());
                } else {
                    this.actionButton.setText('FIGHT');
                    this.actionButton.removeAllListeners('pointerdown');
                    this.actionButton.on('pointerdown', () => this.fightWave());
                }
                this.actionButton.setVisible(true);
            } else {
                this.actionButton.setVisible(false);
            }
        }
    }

    open() {
        this.isOpen = true;
        this.updateDisplay();
        this.elements.forEach(element => {
            element.setVisible(true);
            element.setDepth(2000);
        });
        this.scene.physics.pause();
    }

    close() {
        this.isOpen = false;
        
        // Clean up timers
        if (this.attackTimer) {
            this.attackTimer.destroy();
            this.attackTimer = null;
        }
        if (this.defenseTimer) {
            this.defenseTimer.destroy();
            this.defenseTimer = null;
        }
        
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
                this.scene.time.delayedCall(2000, () => {
                    building.interactionCooldown = false;
                });
            }
        });
    }
}