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
        // Background panel
        this.background = this.scene.add.graphics()
            .fillStyle(0x000000, 0.9)
            .fillRect(100, 80, 600, 440)
            .setVisible(false);
        
        // Title
        this.title = this.scene.add.text(400, 110, 'UPGRADES', {
            fontSize: '24px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Description
        this.description = this.scene.add.text(400, 140, 'Improve your character stats with permanent upgrades', {
            fontSize: '14px',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Close button
        this.closeButton = this.scene.add.text(670, 90, 'X', {
            fontSize: '20px',
            fill: '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.closeButton.on('pointerdown', () => this.close());

        // Upgrade buttons with better spacing
        this.bootsButton = this.createUpgradeButton(400, 180, 'boots');
        this.passiveButton = this.createUpgradeButton(400, 260, 'passiveIncome');
        this.activeButton = this.createUpgradeButton(400, 340, 'activeIncome');

        this.elements = [this.background, this.title, this.description, this.closeButton, 
                        this.bootsButton.container, this.passiveButton.container, this.activeButton.container];
        
        // Set highest depth for all elements to appear above everything
        this.elements.forEach(element => element.setDepth(3000));
    }

    createUpgradeButton(x, y, upgradeType) {
        const container = this.scene.add.container(x, y).setVisible(false);
        const upgrade = this.upgrades[upgradeType];
        
        const currentTier = gameData.upgrades[upgradeType] || 0;
        const cost = this.getUpgradeCost(upgradeType, currentTier);
        
        let text;
        if (currentTier >= upgrade.maxTier) {
            text = `${upgrade.name} (MAX)\n${upgrade.description}`;
        } else {
            text = `${upgrade.name} (Tier ${currentTier}/${upgrade.maxTier})\n${upgrade.description}\nCost: $${cost}`;
        }

        const button = this.scene.add.text(0, 0, text, {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 12 },
            align: 'center'
        }).setOrigin(0.5).setInteractive();

        button.on('pointerdown', () => this.buyUpgrade(upgradeType));
        
        container.add(button);
        return { container, button, upgradeType };
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

    updateButtons() {
        this.updateButton(this.bootsButton, 'boots');
        this.updateButton(this.passiveButton, 'passiveIncome');
        this.updateButton(this.activeButton, 'activeIncome');
    }

    updateButton(buttonObj, upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        const currentTier = gameData.upgrades[upgradeType] || 0;
        const cost = this.getUpgradeCost(upgradeType, currentTier);
        
        let text;
        if (currentTier >= upgrade.maxTier) {
            text = `${upgrade.name} (MAX)\n${upgrade.description}`;
        } else {
            text = `${upgrade.name} (Tier ${currentTier}/${upgrade.maxTier})\n${upgrade.description}\nCost: $${cost}`;
        }
        
        buttonObj.button.setText(text);
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
        this.updateButtons();
        this.elements.forEach(element => {
            element.setVisible(true);
            element.setDepth(3000);
        });
        this.scene.physics.pause();
        
        // Save when opening upgrades
        if (gameData?.save) gameData.save();
    }

    close() {
        this.isOpen = false;
        this.elements.forEach(element => element.setVisible(false));
        if (this.purchaseMessage) {
            this.purchaseMessage.destroy();
        }
        this.scene.physics.resume();
        
        // Add extended cooldown to all buildings after closing
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