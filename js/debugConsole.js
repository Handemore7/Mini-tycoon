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

        this.commandsText = this.scene.add.text(60, 380, 
            'CONSOLE COMMANDS (F12 → Console):\n' +
            'gameData.money = 999999          // Set money\n' +
            'gameData.stats.health = 100      // Set health\n' +
            'gameData.chatStreak = 5          // Set chat streak\n' +
            'gameData.arenaWins = 1           // Set arena wins\n' +
            'gameData.inventory.sword = 5     // Max sword\n' +
            'gameData.upgrades.boots = 10     // Max boots\n' +
            'gameData.save()                  // Save changes', {
            fontSize: '11px',
            fill: '#cccccc',
            fontFamily: 'monospace'
        }).setVisible(false).setDepth(2001);

        this.websocketText = this.scene.add.text(60, 330, 
            'WEBSOCKET EVENTS:', {
            fontSize: '12px',
            fill: '#FFD700',
            fontWeight: 'bold'
        }).setVisible(false).setDepth(2001);

        this.elements.push(this.websocketText);

        // Add console elements to array
        this.elements.push(this.consoleBackground, this.consoleTitle, this.instructions, this.commandsText);
    }

    createDebugButtons() {
        const buttonY = 150;

        this.addMoneyBtn = this.createButton(120, buttonY, '+10K Money', () => {
            gameData.addMoney(10000);
            this.showMessage('Added 10,000 coins!');
        });

        this.maxMoneyBtn = this.createButton(220, buttonY, 'Max Money', () => {
            gameData.money = 999999;
            gameData.save();
            this.showMessage('Money set to 999,999!');
        });

        this.healBtn = this.createButton(320, buttonY, 'Full Health', () => {
            gameData.stats.health = gameData.stats.maxHealth;
            gameData.save();
            this.showMessage('Health restored!');
        });

        this.unlockAllBtn = this.createButton(420, buttonY, 'Unlock All', () => {
            gameData.chatStreak = 5;
            gameData.arenaWins = 1;
            gameData.save();
            this.showMessage('All decorations unlocked!');
        });

        this.maxEquipBtn = this.createButton(520, buttonY, 'Max Equipment', () => {
            gameData.inventory.sword = 5;
            gameData.inventory.shield = 5;
            gameData.stats.damage = 200;
            gameData.stats.armor = 150;
            gameData.save();
            this.showMessage('Equipment maxed out!');
        });

        this.maxUpgradesBtn = this.createButton(620, buttonY, 'Max Upgrades', () => {
            gameData.upgrades.boots = 10;
            gameData.upgrades.passiveIncome = 10;
            gameData.upgrades.activeIncome = 10;
            gameData.stats.moveSpeed = 300;
            gameData.passiveIncome = 11;
            gameData.chatBonus = 60;
            gameData.save();
            this.showMessage('All upgrades maxed!');
        });

        // Individual stat buttons
        this.maxHealthBtn = this.createButton(120, buttonY + 60, 'Max Health', () => {
            gameData.stats.health = 9999;
            gameData.stats.maxHealth = 9999;
            gameData.save();
            this.showMessage('Health maxed!');
        });

        this.maxDamageBtn = this.createButton(220, buttonY + 60, 'Max Damage', () => {
            gameData.stats.damage = 999;
            gameData.save();
            this.showMessage('Damage maxed!');
        });

        this.maxArmorBtn = this.createButton(320, buttonY + 60, 'Max Armor', () => {
            gameData.stats.armor = 999;
            gameData.save();
            this.showMessage('Armor maxed!');
        });

        this.maxSpeedBtn = this.createButton(420, buttonY + 60, 'Max Speed', () => {
            gameData.stats.moveSpeed = 999;
            gameData.save();
            this.showMessage('Speed maxed!');
        });

        this.maxCritBtn = this.createButton(520, buttonY + 60, 'Max Crit', () => {
            gameData.stats.criticalChance = 100;
            gameData.save();
            this.showMessage('Critical chance maxed!');
        });

        this.maxAttackSpeedBtn = this.createButton(620, buttonY + 60, 'Max Att.Speed', () => {
            gameData.stats.attackSpeed = 10;
            gameData.save();
            this.showMessage('Attack speed maxed!');
        });

        this.resetBtn = this.createButton(320, buttonY + 120, 'Reset Stats', () => {
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

        this.monitorBtn = this.createButton(420, buttonY + 120, 'System Monitor', () => {
            this.showSystemMonitor();
        });

        this.tutorialBtn = this.createButton(220, buttonY + 120, 'Restart Tutorial', () => {
            Tutorial.restart();
        });

        // WebSocket Event Triggers
        this.coinRainBtn = this.createButton(120, buttonY + 180, 'Coin Rain', () => {
            this.triggerWebSocketEvent('coin_rain');
        });

        this.speedChallengeBtn = this.createButton(220, buttonY + 180, 'Speed Challenge', () => {
            this.triggerWebSocketEvent('speed_challenge');
        });

        this.criticalMadnessBtn = this.createButton(320, buttonY + 180, 'Critical Madness', () => {
            this.triggerWebSocketEvent('critical_madness');
        });

        this.serverVoteBtn = this.createButton(420, buttonY + 180, 'Server Vote', () => {
            this.triggerWebSocketEvent('server_vote');
        });

        this.exitBtn = this.createButton(520, buttonY + 120, 'Exit', () => {
            this.toggle();
        });
    }

    createButton(x, y, text, callback) {
        const button = this.scene.add.text(x, y, text, {
            fontSize: '12px',
            fill: '#000000',
            backgroundColor: '#00ff00',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(2001);

        button.on('pointerdown', callback);
        this.elements.push(button);
        return button;
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

        fetch('http://localhost:3001/trigger-event', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({type: eventType, data: {}})
        })
        .then(response => response.json())
        .then(data => {
            this.showMessage(`${eventType} triggered!`);
        })
        .catch(error => {
            console.error('Failed to trigger event:', error);
            this.showMessage('Failed to trigger event!');
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