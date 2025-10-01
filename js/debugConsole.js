class DebugConsole {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.elements = []; // Initialize elements array first
        this.createConsole();
        this.createDebugButtons();
    }

    createConsole() {
        this.consoleBackground = this.scene.add.graphics()
            .fillStyle(0x000000, 0.95)
            .fillRect(50, 50, 700, 500)
            .lineStyle(2, 0x00ff00, 1)
            .strokeRect(50, 50, 700, 500)
            .setVisible(false)
            .setDepth(2000);

        this.consoleTitle = this.scene.add.text(400, 70, 'DEBUG CONSOLE', {
            fontSize: '20px',
            fill: '#00ff00',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false).setDepth(2001);

        this.instructions = this.scene.add.text(60, 100, 
            'Click buttons or use browser console commands:', {
            fontSize: '12px',
            fill: '#ffffff'
        }).setVisible(false).setDepth(2001);

        this.commandsText = this.scene.add.text(60, 400, 
            'CONSOLE COMMANDS (F12 → Console):\n' +
            'gameData.money = 999999          // Set money\n' +
            'gameData.stats.health = 100      // Set health\n' +
            'gameData.chatStreak = 5          // Set chat streak\n' +
            'gameData.arenaWins = 1           // Set arena wins\n' +
            'gameData.inventory.sword = 5     // Max sword\n' +
            'gameData.upgrades.boots = 10     // Max boots\n' +
            'gameData.save()                  // Save changes', {
            fontSize: '10px',
            fill: '#cccccc',
            fontFamily: 'monospace'
        }).setVisible(false).setDepth(2001);

        this.websocketText = this.scene.add.text(60, 350, 
            'WEBSOCKET EVENTS (Row 5):', {
            fontSize: '12px',
            fill: '#FFD700',
            fontWeight: 'bold'
        }).setVisible(false).setDepth(2001);
        
        this.statusText = this.scene.add.text(60, 370, 
            'Status: All systems operational', {
            fontSize: '11px',
            fill: '#00ff00'
        }).setVisible(false).setDepth(2001);
        this.elements.push(this.statusText);

        this.elements.push(this.websocketText);

        // Add console elements to array
        this.elements.push(this.consoleBackground, this.consoleTitle, this.instructions, this.commandsText);
    }

    createDebugButtons() {
        const buttonY = 130;
        const buttonSpacing = 8;
        const buttonWidth = 90;
        const buttonsPerRow = 6;
        
        // Error display area
        this.errorDisplay = this.scene.add.text(60, 110, '', {
            fontSize: '11px',
            fill: '#ff6666',
            backgroundColor: '#330000',
            padding: { x: 4, y: 2 },
            wordWrap: { width: 680 }
        }).setVisible(false).setDepth(2001);
        this.elements.push(this.errorDisplay);

        // Row 1: Money & Health
        this.addMoneyBtn = this.createButton(80, buttonY, '+10K Money', () => {
            this.executeWithErrorHandling(() => {
                gameData.addMoney(10000);
                this.showMessage('Added 10,000 coins!');
            });
        });

        this.maxMoneyBtn = this.createButton(180, buttonY, 'Max Money', () => {
            this.executeWithErrorHandling(() => {
                gameData.money = 999999;
                gameData.save();
                this.showMessage('Money set to 999,999!');
            });
        });

        this.healBtn = this.createButton(280, buttonY, 'Full Health', () => {
            this.executeWithErrorHandling(() => {
                gameData.stats.health = gameData.stats.maxHealth;
                gameData.save();
                this.showMessage('Health restored!');
            });
        });

        this.addPotionsBtn = this.createButton(380, buttonY, '+10 Potions', () => {
            this.executeWithErrorHandling(() => {
                gameData.healthPotions = (gameData.healthPotions || 0) + 10;
                gameData.save();
                this.showMessage('Added 10 health potions!');
            });
        });

        this.unlockAllBtn = this.createButton(480, buttonY, 'Unlock All', () => {
            this.executeWithErrorHandling(() => {
                gameData.chatStreak = 5;
                gameData.arenaWins = 1;
                if (typeof achievements !== 'undefined') {
                    achievements.checkAllAchievements();
                }
                gameData.save();
                this.showMessage('All decorations unlocked!');
            });
        });

        this.completeArenaBtn = this.createButton(580, buttonY, 'Complete Arena', () => {
            this.executeWithErrorHandling(() => {
                gameData.bestArenaWave = 20;
                gameData.arenaCompleted = true;
                gameData.arenaWins = 1;
                gameData.save();
                this.showMessage('Arena completed!');
            });
        });

        // Row 2: Equipment & Stats
        this.maxEquipBtn = this.createButton(80, buttonY + 40, 'Max Equipment', () => {
            this.executeWithErrorHandling(() => {
                gameData.inventory.sword = 5;
                gameData.inventory.shield = 5;
                gameData.stats.damage = 200;
                gameData.stats.armor = 150;
                gameData.save();
                this.showMessage('Equipment maxed out!');
            });
        });

        this.maxUpgradesBtn = this.createButton(180, buttonY + 40, 'Max Upgrades', () => {
            this.executeWithErrorHandling(() => {
                gameData.upgrades.boots = 10;
                gameData.upgrades.passiveIncome = 10;
                gameData.upgrades.activeIncome = 10;
                gameData.stats.moveSpeed = 300;
                gameData.passiveIncome = 11;
                gameData.chatBonus = 60;
                gameData.save();
                this.showMessage('All upgrades maxed!');
            });
        });

        this.maxHealthBtn = this.createButton(280, buttonY + 40, 'Max Health', () => {
            this.executeWithErrorHandling(() => {
                gameData.stats.health = 9999;
                gameData.stats.maxHealth = 9999;
                gameData.save();
                this.showMessage('Health maxed!');
            });
        });

        this.maxDamageBtn = this.createButton(380, buttonY + 40, 'Max Damage', () => {
            this.executeWithErrorHandling(() => {
                gameData.stats.damage = 999;
                gameData.save();
                this.showMessage('Damage maxed!');
            });
        });

        this.maxArmorBtn = this.createButton(480, buttonY + 40, 'Max Armor', () => {
            this.executeWithErrorHandling(() => {
                gameData.stats.armor = 999;
                gameData.save();
                this.showMessage('Armor maxed!');
            });
        });

        this.maxSpeedBtn = this.createButton(580, buttonY + 40, 'Max Speed', () => {
            this.executeWithErrorHandling(() => {
                gameData.stats.moveSpeed = 999;
                gameData.save();
                this.showMessage('Speed maxed!');
            });
        });

        // Row 3: Advanced Stats
        this.maxCritBtn = this.createButton(80, buttonY + 80, 'Max Crit', () => {
            this.executeWithErrorHandling(() => {
                gameData.stats.criticalChance = 100;
                gameData.save();
                this.showMessage('Critical chance maxed!');
            });
        });

        this.maxAttackSpeedBtn = this.createButton(180, buttonY + 80, 'Max Att.Speed', () => {
            this.executeWithErrorHandling(() => {
                gameData.stats.attackSpeed = 10;
                gameData.save();
                this.showMessage('Attack speed maxed!');
            });
        });

        this.testConnectionBtn = this.createButton(280, buttonY + 80, 'Test WebSocket', () => {
            this.executeWithErrorHandling(() => {
                if (window.webSocketManager) {
                    const status = window.webSocketManager.connected ? 'Connected' : 'Disconnected';
                    this.showMessage(`WebSocket: ${status}`);
                } else {
                    this.showMessage('WebSocket Manager not found!');
                }
            });
        });

        this.saveGameBtn = this.createButton(380, buttonY + 80, 'Force Save', () => {
            this.executeWithErrorHandling(() => {
                gameData.save();
                if (typeof saveSystem !== 'undefined') {
                    saveSystem.immediateSave();
                }
                this.showMessage('Game saved!');
            });
        });

        this.runTestsBtn = this.createButton(480, buttonY + 80, 'Run Tests', () => {
            this.executeWithErrorHandling(() => {
                if (window.testFramework) {
                    window.testFramework.runTests();
                    this.showMessage('Tests running in console!');
                } else {
                    this.showMessage('Test framework not available!');
                }
            });
        });

        this.clearDataBtn = this.createButton(580, buttonY + 80, 'Clear Data', () => {
            this.executeWithErrorHandling(() => {
                if (confirm('Clear all game data? This cannot be undone!')) {
                    localStorage.clear();
                    this.showMessage('Data cleared! Refresh page.');
                }
            });
        });

        // Row 4: System & Utility
        this.tutorialBtn = this.createButton(80, buttonY + 120, 'Restart Tutorial', () => {
            this.executeWithErrorHandling(() => {
                if (window.Tutorial) {
                    Tutorial.restart();
                } else {
                    this.showMessage('Tutorial system not available!');
                }
            });
        });

        this.resetBtn = this.createButton(180, buttonY + 120, 'Reset Stats', () => {
            this.executeWithErrorHandling(() => {
                gameData.money = 100;
                gameData.stats = {
                    health: 100,
                    maxHealth: 100,
                    damage: 10,
                    attackSpeed: 1,
                    moveSpeed: 100,
                    armor: 0,
                    criticalChance: 10
                };
                gameData.inventory = { sword: 0, shield: 0 };
                gameData.upgrades = { boots: 0, passiveIncome: 0, activeIncome: 0 };
                gameData.passiveIncome = 1;
                gameData.chatBonus = 10;
                gameData.save();
                this.showMessage('Stats reset to default!');
            });
        });

        this.monitorBtn = this.createButton(280, buttonY + 120, 'System Monitor', () => {
            this.executeWithErrorHandling(() => {
                this.showSystemMonitor();
            });
        });

        this.exportLogsBtn = this.createButton(380, buttonY + 120, 'Export Logs', () => {
            this.executeWithErrorHandling(() => {
                if (window.errorLogger) {
                    window.errorLogger.exportLogs();
                    this.showMessage('Logs exported!');
                } else {
                    this.showMessage('Error logger not available!');
                }
            });
        });

        this.memoryCleanupBtn = this.createButton(480, buttonY + 120, 'Memory Cleanup', () => {
            this.executeWithErrorHandling(() => {
                if (window.memoryManager) {
                    window.memoryManager.forceCleanup();
                    this.showMessage('Memory cleaned up!');
                } else {
                    this.showMessage('Memory manager not available!');
                }
            });
        });

        this.exitBtn = this.createButton(580, buttonY + 120, 'Exit', () => {
            this.toggle();
        });

        // Row 5: WebSocket Event Triggers
        this.coinRainBtn = this.createButton(80, buttonY + 160, 'Coin Rain', () => {
            this.executeWithErrorHandling(() => {
                this.triggerWebSocketEvent('coin_rain');
            });
        });

        this.speedChallengeBtn = this.createButton(180, buttonY + 160, 'Speed Challenge', () => {
            this.executeWithErrorHandling(() => {
                this.triggerWebSocketEvent('speed_challenge');
            });
        });

        this.criticalMadnessBtn = this.createButton(280, buttonY + 160, 'Critical Madness', () => {
            this.executeWithErrorHandling(() => {
                this.triggerWebSocketEvent('critical_madness');
            });
        });

        this.serverVoteBtn = this.createButton(380, buttonY + 160, 'Server Vote', () => {
            this.executeWithErrorHandling(() => {
                this.triggerWebSocketEvent('server_vote');
            });
        });

        this.reloadPageBtn = this.createButton(480, buttonY + 160, 'Reload Page', () => {
            this.executeWithErrorHandling(() => {
                if (confirm('Reload the page? Unsaved changes will be lost.')) {
                    window.location.reload();
                }
            });
        });

        this.togglePhysicsBtn = this.createButton(580, buttonY + 160, 'Toggle Physics', () => {
            this.executeWithErrorHandling(() => {
                if (this.scene.physics.world.isPaused) {
                    this.scene.physics.resume();
                    this.showMessage('Physics resumed!');
                } else {
                    this.scene.physics.pause();
                    this.showMessage('Physics paused!');
                }
            });
        });
    }

    createButton(x, y, text, callback) {
        const button = this.scene.add.text(x, y, text, {
            fontSize: '10px',
            fill: '#000000',
            backgroundColor: '#00ff00',
            padding: { x: 6, y: 3 },
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(2001);

        // Add hover effects
        button.on('pointerover', () => {
            button.setStyle({ backgroundColor: '#00cc00' });
        });
        
        button.on('pointerout', () => {
            button.setStyle({ backgroundColor: '#00ff00' });
        });

        button.on('pointerdown', callback);
        this.elements.push(button);
        return button;
    }
    
    executeWithErrorHandling(callback) {
        try {
            callback();
            this.clearError();
        } catch (error) {
            this.showError(error.message);
            console.error('Debug console error:', error);
        }
    }
    
    showError(message) {
        if (this.errorDisplay) {
            this.errorDisplay.setText(`ERROR: ${message}`);
            this.errorDisplay.setVisible(true);
            
            // Auto-hide error after 5 seconds
            this.scene.time.delayedCall(5000, () => {
                this.clearError();
            });
        }
    }
    
    clearError() {
        if (this.errorDisplay) {
            this.errorDisplay.setVisible(false);
        }
    }

    showMessage(text) {
        if (this.debugMessage) this.debugMessage.destroy();
        
        this.debugMessage = this.scene.add.text(400, 500, text, {
            fontSize: '14px',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(2002);

        this.scene.time.delayedCall(2000, () => {
            if (this.debugMessage) this.debugMessage.destroy();
        });
    }

    triggerWebSocketEvent(eventType) {
        if (!window.webSocketManager || !window.webSocketManager.connected) {
            this.showMessage('WebSocket not connected!');
            return;
        }

        // Auto-detect server URL
        const serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001'
            : 'https://mini-tycoon-production.up.railway.app';

        fetch(`${serverUrl}/trigger-event`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: eventType, data: {}})
        })
        .then(response => {
            if (response.status === 409) {
                return response.json().then(data => {
                    this.showMessage('Event overlap prevented!');
                    throw new Error(data.message);
                });
            }
            return response.json();
        })
        .then(data => {
            this.showMessage(`${eventType} triggered!`);
        })
        .catch(error => {
            console.error('Failed to trigger event:', error);
            if (!error.message.includes('overlap')) {
                this.showMessage('Failed to trigger event!');
            }
        });
    }

    showSystemMonitor() {
        const memoryStats = window.memoryManager?.getMemoryStats() || {};
        const errorStats = window.errorLogger?.getPerformanceSummary() || {};
        const assetStats = window.assetPreloader?.getCacheStats() || {};
        
        console.group('🔧 System Monitor');
        console.log('Memory Manager:', memoryStats);
        console.log('Performance Metrics:', errorStats);
        console.log('Asset Cache:', assetStats);
        
        if (window.stateManager) {
            console.log('State Manager:', {
                player: window.stateManager.getPlayer(),
                game: window.stateManager.getGame(),
                inventory: window.stateManager.getInventory(),
                progression: window.stateManager.getProgression()
            });
        }
        
        if (window.errorLogger) {
            console.log('Recent Errors:', window.errorLogger.getLogsByLevel(0));
            console.log('Export Logs:', 'window.errorLogger.exportLogs()');
        }
        
        if (window.testFramework) {
            console.log('Run Tests:', 'window.testFramework.runTests()');
        }
        
        console.groupEnd();
        
        this.showMessage('System info logged to console!');
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.elements.forEach(element => element.setVisible(this.isOpen));
    }
}