class Upgrades {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.upgrades = {
            boots: {
                name: 'Speed Boots',
                description: 'Increases movement speed',
                baseCost: 100,
                costMultiplier: 1.5,
                speedBonus: 20,
                maxTier: 10
            },
            passiveIncome: {
                name: 'Passive Income',
                description: 'Increases coins per 5 seconds',
                baseCost: 200,
                costMultiplier: 2.0,
                incomeBonus: 1,
                maxTier: 10
            },
            activeIncome: {
                name: 'Chat Bonus',
                description: 'Increases coins per chat message',
                baseCost: 150,
                costMultiplier: 1.8,
                chatBonus: 5,
                maxTier: 10
            }
        };
        this.createInterface();
    }

    createInterface() {
        // Main background with rounded corners
        this.background = this.scene.add.graphics()
            .fillStyle(0x1a1a1a, 0.95)
            .fillRoundedRect(100, 80, 600, 440, 15)
            .lineStyle(2, 0x444444, 1)
            .strokeRoundedRect(100, 80, 600, 440, 15)
            .setVisible(false);
        
        // Header section
        this.headerBg = this.scene.add.graphics()
            .fillStyle(0x2c3e50, 1)
            .fillRoundedRect(100, 80, 600, 60, 15)
            .setVisible(false);
        
        // Title
        this.title = this.scene.add.text(400, 110, 'CHARACTER UPGRADES', {
            fontSize: '22px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Close button
        this.closeButton = this.scene.add.text(670, 110, '✕', {
            fontSize: '18px',
            fill: '#ff6b6b',
            backgroundColor: '#333333',
            padding: { x: 8, y: 6 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.closeButton.on('pointerdown', () => this.close());

        // Description
        this.description = this.scene.add.text(400, 160, 'Improve your character stats with permanent upgrades', {
            fontSize: '14px',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Upgrade cards
        this.bootsCard = this.createUpgradeCard(220, 280, 'boots');
        this.passiveCard = this.createUpgradeCard(400, 280, 'passiveIncome');
        this.activeCard = this.createUpgradeCard(580, 280, 'activeIncome');

        // Bottom info section
        this.infoBg = this.scene.add.graphics()
            .fillStyle(0x34495e, 1)
            .fillRoundedRect(120, 420, 560, 80, 10)
            .setVisible(false);

        // Money display
        this.moneyText = this.scene.add.text(400, 460, '', {
            fontSize: '16px',
            fill: '#f1c40f',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        this.elements = [this.background, this.headerBg, this.title, this.closeButton, this.description,
                        this.bootsCard.container, this.passiveCard.container, this.activeCard.container,
                        this.infoBg, this.moneyText];
        
        this.elements.forEach(element => element.setDepth(3000));
    }

    createUpgradeCard(x, y, upgradeType) {
        const container = this.scene.add.container(x, y).setVisible(false);
        const upgrade = this.upgrades[upgradeType];
        
        // Card background
        const cardBg = this.scene.add.graphics()
            .fillStyle(0x2c3e50, 1)
            .fillRoundedRect(-80, -90, 160, 180, 10)
            .lineStyle(2, 0x34495e, 1)
            .strokeRoundedRect(-80, -90, 160, 180, 10);
        
        // Icon placeholder
        const iconBg = this.scene.add.graphics()
            .fillStyle(0x34495e, 1)
            .fillRoundedRect(-60, -80, 120, 60, 5)
            .lineStyle(1, 0x7f8c8d, 1)
            .strokeRoundedRect(-60, -80, 120, 60, 5);
        
        const iconText = this.scene.add.text(0, -50, this.getUpgradeIcon(upgradeType), {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        // Upgrade name
        const nameText = this.scene.add.text(0, -15, upgrade.name, {
            fontSize: '10px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center',
            wordWrap: { width: 140 }
        }).setOrigin(0.5);
        
        // Description
        const descText = this.scene.add.text(0, 0, upgrade.description, {
            fontSize: '10px',
            fill: '#cccccc',
            align: 'center',
            wordWrap: { width: 130 }
        }).setOrigin(0.5);
        
        // Tier progress bar
        const progressBar = this.scene.add.graphics();
        
        // Current tier display
        const tierText = this.scene.add.text(0, 25, '', {
            fontSize: '10px',
            fill: '#4ecdc4',
            align: 'center'
        }).setOrigin(0.5);
        
        // Buy button
        const buyButton = this.scene.add.graphics();
        
        const buttonText = this.scene.add.text(0, 60, '', {
            fontSize: '10px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add([cardBg, iconBg, iconText, nameText, descText, progressBar, tierText, buyButton, buttonText]);
        
        return { container, upgradeType, buyButton, buttonText, nameText, tierText, progressBar };
    }

    getUpgradeCost(upgradeType, currentTier) {
        const upgrade = this.upgrades[upgradeType];
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentTier));
    }

    buyUpgrade(upgradeType) {
        const currentTier = gameData.upgrades[upgradeType] || 0;
        const upgrade = this.upgrades[upgradeType];
        
        if (currentTier >= upgrade.maxTier) {
            this.showPurchaseMessage('Already at max tier!', '#ff0000');
            return;
        }

        const cost = this.getUpgradeCost(upgradeType, currentTier);
        
        if (gameData.spendMoney(cost)) {
            // Update upgrade tier
            gameData.upgrades[upgradeType] = currentTier + 1;
            
            // Apply upgrade effects
            this.applyUpgradeEffect(upgradeType);
            
            // Save after upgrade purchase
            if (gameData?.save) gameData.save();
            this.showPurchaseMessage(`${upgrade.name} upgraded to tier ${currentTier + 1}!`);
            this.updateButtons();
        } else {
            this.showPurchaseMessage('Not enough money!', '#ff0000');
        }
    }

    applyUpgradeEffect(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        
        switch(upgradeType) {
            case 'boots':
                gameData.stats.moveSpeed += upgrade.speedBonus;
                break;
            case 'passiveIncome':
                gameData.passiveIncome = (gameData.passiveIncome || 1) + upgrade.incomeBonus;
                break;
            case 'activeIncome':
                gameData.chatBonus = (gameData.chatBonus || 10) + upgrade.chatBonus;
                break;
        }
    }

    getUpgradeIcon(upgradeType) {
        const icons = {
            boots: '👟',
            passiveIncome: '💰',
            activeIncome: '💬'
        };
        return icons[upgradeType] || '⚙️';
    }

    updateCards() {
        this.updateCard(this.bootsCard, 'boots');
        this.updateCard(this.passiveCard, 'passiveIncome');
        this.updateCard(this.activeCard, 'activeIncome');
        this.updateMoneyDisplay();
    }

    updateCard(card, upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        const currentTier = gameData.upgrades[upgradeType] || 0;
        const cost = this.getUpgradeCost(upgradeType, currentTier);
        const canBuy = currentTier < upgrade.maxTier;
        
        // Update progress bar
        card.progressBar.clear()
            .fillStyle(0x34495e, 1)
            .fillRoundedRect(-60, 15, 120, 6, 3)
            .fillStyle(0x3498db, 1)
            .fillRoundedRect(-60, 15, (120 * currentTier) / upgrade.maxTier, 6, 3);
        
        // Update tier text
        card.tierText.setText(`Tier ${currentTier}/${upgrade.maxTier}`);
        
        // Update button
        card.buyButton.clear();
        if (canBuy) {
            card.buyButton
                .fillStyle(0x27ae60, 1)
                .fillRoundedRect(-60, 45, 120, 30, 5)
                .lineStyle(1, 0x2ecc71, 1)
                .strokeRoundedRect(-60, 45, 120, 30, 5)
                .setInteractive(new Phaser.Geom.Rectangle(-60, 45, 120, 30), Phaser.Geom.Rectangle.Contains);
            
            card.buyButton.off('pointerdown').on('pointerdown', () => this.buyUpgrade(upgradeType));
            card.buttonText.setText(`$${cost}`);
        } else {
            card.buyButton
                .fillStyle(0x7f8c8d, 1)
                .fillRoundedRect(-60, 45, 120, 30, 5)
                .lineStyle(1, 0x95a5a6, 1)
                .strokeRoundedRect(-60, 45, 120, 30, 5);
            
            card.buttonText.setText('MAXED');
        }
    }

    updateMoneyDisplay() {
        this.moneyText.setText(`💰 ${gameData.money} COINS`);
    }

    showPurchaseMessage(message, color = '#00ff00') {
        if (this.purchaseMessage) {
            this.purchaseMessage.destroy();
        }
        
        this.purchaseMessage = this.scene.add.text(400, 450, message, {
            fontSize: '14px',
            fill: color,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(3001);

        this.scene.time.delayedCall(2000, () => {
            if (this.purchaseMessage) {
                this.purchaseMessage.destroy();
            }
        });
    }

    open() {
        this.isOpen = true;
        this.updateCards();
        this.elements.forEach(element => {
            element.setVisible(true);
            element.setDepth(3000);
        });
        this.scene.physics.pause();
        
        // Start real-time updates
        this.updateInterval = setInterval(() => {
            if (this.isOpen) {
                this.updateMoneyDisplay();
            }
        }, 100);
        
        if (gameData?.save) gameData.save();
    }

    close() {
        this.isOpen = false;
        
        // Stop real-time updates
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.elements.forEach(element => element.setVisible(false));
        if (this.purchaseMessage) {
            this.purchaseMessage.destroy();
        }
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