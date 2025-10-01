class CombatSystem {
    constructor(arena) {
        this.arena = arena;
        this.statusEffects = { poisoned: 0, wounded: 0 };
    }
    
    getCriticalChance() {
        // Check if critical madness is active and used
        if (window.criticalMadnessActive && window.criticalMadnessUsed) {
            return 0.8; // 80% critical chance
        }
        
        const baseCrit = 0.1;
        const swordBonus = (gameData?.inventory?.sword || 0) * 0.05;
        return Math.min(baseCrit + swordBonus, 0.5);
    }
    
    getDodgeChance() {
        const baseSpeed = gameData?.stats?.moveSpeed || 100;
        return Math.min(baseSpeed / 200, 0.7);
    }
    
    playerAttack() {
        if (this.arena.turnState !== 'player_turn') return;
        
        const critChance = this.getCriticalChance();
        const willCrit = Math.random() < critChance;
        
        if (willCrit) {
            this.arena.combatLog.addColoredLog([
                { text: '⚡ Critical chance triggered! ', color: '#ff6600' },
                { text: 'Click when the bar is in the green zone!', color: '#0099ff' }
            ]);
            this.startCriticalAttack();
        } else {
            this.executeNormalAttack();
        }
    }
    
    startCriticalAttack() {
        this.arena.turnState = 'critical_attack';
        this.arena.criticalSuccess = false;
        this.criticalBarPosition = 0;
        this.criticalBarDirection = 1;
        this.criticalInputEnabled = false;
        
        if (this.arena.attackBar) {
            this.arena.attackBar.setVisible(true);
        }
        
        if (this.arena.actionPrompt) {
            this.arena.actionPrompt.setText('Click when the bar is in the green zone!');
            this.arena.actionPrompt.setStyle({ fill: '#00ff00' });
            this.arena.actionPrompt.setVisible(true);
        }
        
        // Start the moving bar timer
        this.arena.attackTimer = this.arena.scene.time.addEvent({
            delay: 50,
            callback: this.updateCriticalBar,
            callbackScope: this,
            loop: true
        });
        
        // Enable input after 50ms to prevent attack button click from triggering
        this.arena.scene.time.delayedCall(50, () => {
            this.criticalInputEnabled = true;
        });
        
        // Auto-resolve after 3 seconds
        this.arena.scene.time.delayedCall(3000, () => {
            if (this.arena.turnState === 'critical_attack') {
                this.resolveCriticalAttack(false);
            }
        });
    }
    
    updateCriticalBar() {
        if (this.arena.turnState !== 'critical_attack' || !this.arena.isOpen) {
            // Clean up if arena closed or state changed
            if (this.arena.attackTimer) {
                this.arena.attackTimer.destroy();
                this.arena.attackTimer = null;
            }
            return;
        }
        
        this.criticalBarPosition += this.criticalBarDirection * 4;
        
        if (this.criticalBarPosition >= 100) {
            this.criticalBarPosition = 100;
            this.criticalBarDirection = -1;
        } else if (this.criticalBarPosition <= 0) {
            this.criticalBarPosition = 0;
            this.criticalBarDirection = 1;
        }
        
        if (this.arena.attackBar) {
            this.arena.attackBar.clear();
            this.arena.attackBar.fillStyle(0x333333);
            this.arena.attackBar.fillRect(250, 290, 300, 20);
            
            // Green zone (60-80%)
            this.arena.attackBar.fillStyle(0x00ff00);
            this.arena.attackBar.fillRect(430, 290, 60, 20);
            
            // Moving indicator
            this.arena.attackBar.fillStyle(0xffffff);
            this.arena.attackBar.fillRect(250 + (this.criticalBarPosition / 100) * 300 - 2, 290, 4, 20);
        }
    }
    
    handleCriticalInput() {
        if (this.arena.turnState !== 'critical_attack' || !this.criticalInputEnabled) return;
        
        const inGreenZone = this.criticalBarPosition >= 60 && this.criticalBarPosition <= 80;
        this.resolveCriticalAttack(inGreenZone);
    }
    
    resolveCriticalAttack(success) {
        if (this.arena.attackTimer) {
            this.arena.attackTimer.destroy();
            this.arena.attackTimer = null;
        }
        
        this.arena.hideAttackUI();
        
        let damage = gameData?.stats?.damage || 10;
        
        if (success) {
            damage *= 2;
            this.arena.combatLog.addColoredLog([
                { text: 'CRITICAL HIT! You deal ', color: '#ff6600' },
                { text: `${damage} damage!`, color: '#ffffff' }
            ]);
        } else {
            this.arena.combatLog.addColoredLog([
                { text: 'Missed critical! You deal ', color: '#ffffff' },
                { text: `${damage} normal damage.`, color: '#ffffff' }
            ]);
        }
        
        this.executeDamage(damage);
    }
    
    executeNormalAttack() {
        const damage = gameData?.stats?.damage || 10;
        this.arena.combatLog.addColoredLog([
            { text: 'You attack for ', color: '#ffffff' },
            { text: `${damage} damage.`, color: '#ffffff' }
        ]);
        this.executeDamage(damage);
    }
    
    executeDamage(damage) {
        this.arena.currentEnemy.health -= damage;
        
        if (this.arena.currentEnemy.health <= 0) {
            this.arena.currentEnemy.health = 0;
            this.arena.combatLog.addColoredLog([
                { text: `${this.arena.currentEnemy.name}`, color: '#ff9999' },
                { text: ' is ', color: '#ffffff' },
                { text: 'defeated!', color: '#00ff00' }
            ]);
            this.arena.combatLog.addColoredLog([
                { text: 'You earned ', color: '#ffffff' },
                { text: `${this.arena.currentEnemy.coins} coins!`, color: '#ffff00' }
            ]);
            this.arena.totalCoinsEarned += this.arena.currentEnemy.coins;
            this.arena.currentEnemy = null;
            this.arena.turnState = 'waiting';
            
            // Save when clearing a floor
            if (gameData?.save) gameData.save();
        } else {
            this.arena.scene.time.delayedCall(1000, () => this.startEnemyTurn());
        }
        
        this.arena.updateDisplay();
    }
    
    startEnemyTurn() {
        if (!this.arena.currentEnemy || this.arena.currentEnemy.health <= 0) return;
        
        if (this.arena.currentEnemy.isBoss) {
            if (this.arena.currentEnemy.preparingSpecial) {
                this.executeBossSpecialAttack();
                return;
            } else if (Math.random() < 0.3) {
                const availableSpecials = this.getAvailableSpecialAttacks();
                if (availableSpecials.length > 0) {
                    this.prepareBossSpecialAttack();
                    return;
                }
            }
        }
        
        this.arena.combatLog.addColoredLog([
            { text: `${this.arena.currentEnemy.name}`, color: '#ff9999' },
            { text: ' attacks!', color: '#ffffff' }
        ]);
        
        const dodgeChance = this.getDodgeChance();
        const canDodge = Math.random() < dodgeChance;
        
        if (canDodge) {
            this.arena.combatLog.addColoredLog([
                { text: 'Quick! Press ', color: '#ffffff' },
                { text: 'SPACEBAR', color: '#0099ff' },
                { text: ' to dodge!', color: '#ffffff' }
            ]);
            this.startDodgeEvent();
        } else {
            this.executeEnemyDamage(false);
        }
    }
    
    startDodgeEvent() {
        this.arena.turnState = 'dodge_event';
        this.arena.defenseTimeLeft = 1.2;
        this.arena.dodgeClicked = false;
        
        this.arena.hideAttackUI();
        
        this.arena.actionPrompt.setText('🏃 DODGE! PRESS SPACEBAR!');
        this.arena.actionPrompt.setVisible(true);
        this.arena.defenseOverlay.clear().fillStyle(0xff0000, 0.3).fillRect(0, 0, 800, 600);
        this.arena.defenseOverlay.setVisible(true);
        
        if (this.arena.defenseTimer) {
            this.arena.defenseTimer.destroy();
            this.arena.defenseTimer = null;
        }
        
        this.arena.defenseTimer = this.arena.scene.time.addEvent({
            delay: 100,
            callback: () => {
                this.arena.defenseTimeLeft -= 0.1;
                if (this.arena.defenseTimeLeft <= 0) {
                    this.handleDodgeInput(false);
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    handleDodgeInput(clicked = true) {
        if (this.arena.dodgeClicked) return;
        this.arena.dodgeClicked = true;
        
        if (this.arena.defenseTimer) {
            this.arena.defenseTimer.destroy();
            this.arena.defenseTimer = null;
        }
        
        this.arena.hideDefenseUI();
        this.executeEnemyDamage(clicked);
    }
    
    executeEnemyDamage(dodged) {
        let damage = this.arena.currentEnemy.damage - (gameData?.stats?.armor || 0);
        damage = Math.max(1, damage);
        
        if (dodged) {
            damage = Math.floor(damage * 0.5);
            this.arena.combatLog.addColoredLog([
                { text: 'You dodge! Take only ', color: '#0099ff' },
                { text: `${damage} damage.`, color: '#ff6666' }
            ]);
        } else {
            this.arena.combatLog.addColoredLog([
                { text: 'You take ', color: '#ffffff' },
                { text: `${damage} damage!`, color: '#ff6666' }
            ]);
        }
        
        this.arena.currentHealth -= damage;
        
        if (this.arena.currentHealth <= 0) {
            this.arena.currentHealth = 0;
            this.arena.gameOver();
        } else {
            this.arena.scene.time.delayedCall(1000, () => this.arena.startPlayerTurn());
        }
        
        this.arena.updateDisplay();
    }
    
    applyStatusEffects() {
        if (this.statusEffects.poisoned > 0) {
            const poisonDamage = 3;
            this.arena.currentHealth -= poisonDamage;
            this.arena.combatLog.addColoredLog([
                { text: '🐍 Poison deals ', color: '#99ff99' },
                { text: `${poisonDamage} damage!`, color: '#ff6666' }
            ]);
            this.statusEffects.poisoned--;
            
            if (this.statusEffects.poisoned === 0) {
                this.arena.combatLog.addColoredLog([
                    { text: '✅ ', color: '#00ff00' },
                    { text: 'Poison effect', color: '#99ff99' },
                    { text: ' wears off.', color: '#ffffff' }
                ]);
            }
        }
        
        if (this.statusEffects.wounded > 0) {
            this.statusEffects.wounded--;
            if (this.statusEffects.wounded === 0) {
                this.arena.combatLog.addColoredLog([
                    { text: '✅ ', color: '#00ff00' },
                    { text: 'Wound heals', color: '#ff9999' },
                    { text: ', potions can be used again.', color: '#ffffff' }
                ]);
            }
        }
        
        if (this.arena.currentHealth <= 0) {
            this.arena.currentHealth = 0;
            this.arena.gameOver();
        }
    }
    
    getAvailableSpecialAttacks() {
        const available = [];
        if (this.statusEffects.poisoned === 0) available.push('poison');
        if (this.statusEffects.wounded === 0) available.push('wound');
        return available;
    }
    
    prepareBossSpecialAttack() {
        const availableSpecials = this.getAvailableSpecialAttacks();
        if (availableSpecials.length === 0) return;
        
        this.arena.currentEnemy.preparingSpecial = true;
        this.arena.currentEnemy.chosenSpecialAttack = availableSpecials[Math.floor(Math.random() * availableSpecials.length)];
        
        const attackType = this.arena.currentEnemy.chosenSpecialAttack === 'poison' ? 'Poison Breath' : 'Cursed Strike';
        this.arena.combatLog.addColoredLog([
            { text: '💀 ', color: '#ff6600' },
            { text: `${this.arena.currentEnemy.name}`, color: '#ff9999' },
            { text: ' is preparing ', color: '#ffffff' },
            { text: `${attackType}!`, color: '#ff6600' }
        ]);
        this.arena.combatLog.addColoredLog([
            { text: 'The boss will use a ', color: '#ffffff' },
            { text: 'special attack', color: '#ff6600' },
            { text: ' next turn!', color: '#ffffff' }
        ]);
        
        this.arena.scene.time.delayedCall(2000, () => this.arena.startPlayerTurn());
    }
    
    executeBossSpecialAttack() {
        this.arena.currentEnemy.preparingSpecial = false;
        const duration = Math.floor(Math.random() * 3) + 1;
        
        if (this.arena.currentEnemy.chosenSpecialAttack === 'poison') {
            this.arena.combatLog.addColoredLog([
                { text: '💀 ', color: '#ff6600' },
                { text: `${this.arena.currentEnemy.name}`, color: '#ff9999' },
                { text: ' uses ', color: '#ffffff' },
                { text: 'Poison Breath!', color: '#99ff99' }
            ]);
            this.statusEffects.poisoned = duration;
            this.arena.combatLog.addColoredLog([
                { text: '🐍 You are ', color: '#ffffff' },
                { text: 'poisoned', color: '#99ff99' },
                { text: ` for ${duration} turns!`, color: '#ffffff' }
            ]);
        } else if (this.arena.currentEnemy.chosenSpecialAttack === 'wound') {
            this.arena.combatLog.addColoredLog([
                { text: '💀 ', color: '#ff6600' },
                { text: `${this.arena.currentEnemy.name}`, color: '#ff9999' },
                { text: ' uses ', color: '#ffffff' },
                { text: 'Cursed Strike!', color: '#ff9999' }
            ]);
            this.statusEffects.wounded = duration;
            this.arena.combatLog.addColoredLog([
                { text: '🩸 You are ', color: '#ffffff' },
                { text: 'wounded', color: '#ff9999' },
                { text: ` for ${duration} turns! Cannot use `, color: '#ffffff' },
                { text: 'potions!', color: '#00ff00' }
            ]);
        }
        
        this.arena.scene.time.delayedCall(2000, () => this.arena.startPlayerTurn());
    }
}