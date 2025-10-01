class Store {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.items = {
            sword: {
                name: 'Sword',
                tiers: ['Wooden', 'Stone', 'Gold', 'Iron', 'Diamond'],
                prices: [50, 150, 400, 800, 1500],
                damage: [5, 12, 25, 40, 60]
            },
            shield: {
                name: 'Shield',
                tiers: ['Wooden', 'Stone', 'Gold', 'Iron', 'Diamond'],
                prices: [40, 120, 350, 700, 1300],
                armor: [3, 8, 18, 30, 50]
            },
            potion: {
                name: 'Health Potion',
                price: 25,
                healing: 50
            }
        };
        this.createInterface();
    }

    createInterface() {
        // Background panel
        this.background = this.scene.add.graphics()
            .fillStyle(0x000000, 0.9)
            .fillRect(150, 100, 500, 400)
            .setVisible(false);
        
        // Title
        this.title = this.scene.add.text(400, 130, 'STORE', {
            fontSize: '24px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Close button
        this.closeButton = this.scene.add.text(620, 110, 'X', {
            fontSize: '20px',
            fill: '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setVisible(false).setInteractive();
        this.closeButton.on('pointerdown', () => this.close());

        // Item buttons with better spacing
        this.swordButton = this.createItemButton(250, 220, 'sword');
        this.shieldButton = this.createItemButton(400, 220, 'shield');
        this.potionButton = this.createItemButton(550, 220, 'potion');

        this.elements = [this.background, this.title, this.closeButton, 
                        this.swordButton.container, this.shieldButton.container, this.potionButton.container];
        
        // Set highest depth for all elements to appear above everything
        this.elements.forEach(element => element.setDepth(2000));
    }

    createItemButton(x, y, itemType) {
        const container = this.scene.add.container(x, y).setVisible(false);
        
        let text, price;
        if (itemType === 'potion') {
            text = `${this.items.potion.name}\n$${this.items.potion.price}`;
            price = this.items.potion.price;
        } else {
            const currentTier = gameData.inventory[itemType] || 0;
            if (currentTier >= 5) {
                text = `${this.items[itemType].name}\nMAX TIER`;
                price = 0;
            } else {
                const tierName = this.items[itemType].tiers[currentTier];
                price = this.items[itemType].prices[currentTier];
                text = `${tierName} ${this.items[itemType].name}\n$${price}`;
            }
        }

        const button = this.scene.add.text(0, 0, text, {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 12 },
            align: 'center'
        }).setOrigin(0.5).setInteractive();

        button.on('pointerdown', () => this.buyItem(itemType));
        
        container.add(button);
        return { container, button, itemType };
    }

    buyItem(itemType) {
        if (itemType === 'potion') {
            if (gameData.spendMoney(this.items.potion.price)) {
                gameData.healthPotions = (gameData.healthPotions || 0) + 1;
                if (gameData?.save) gameData.save();
                
                // Update inventory display
                if (this.scene.inventory) {
                    this.scene.inventory.updateDisplay();
                }
                
                this.showPurchaseMessage(`Health Potion added to inventory!`);
            } else {
                this.showPurchaseMessage('Not enough money!', '#ff0000');
            }
        } else {
            const currentTier = gameData.inventory[itemType] || 0;
            if (currentTier >= 5) {
                this.showPurchaseMessage('Already at max tier!', '#ff0000');
                return;
            }

            const price = this.items[itemType].prices[currentTier];
            if (gameData.spendMoney(price)) {
                gameData.updateInventory(itemType, currentTier + 1);
                
                // Apply stat bonuses
                if (itemType === 'sword') {
                    gameData.stats.damage += this.items.sword.damage[currentTier];
                } else if (itemType === 'shield') {
                    gameData.stats.armor += this.items.shield.armor[currentTier];
                }
                
                gameData.updateStats(gameData.stats);
                
                // Save after purchase
                if (gameData?.save) gameData.save();
                
                // Check achievements
                achievements.checkAchievement('firstPurchase');
                
                // Update inventory display
                if (this.scene.inventory) {
                    this.scene.inventory.updateDisplay();
                }
                
                this.showPurchaseMessage(`Bought ${this.items[itemType].tiers[currentTier]} ${this.items[itemType].name}!`);
                this.updateButtons();
            } else {
                this.showPurchaseMessage('Not enough money!', '#ff0000');
            }
        }
    }

    updateButtons() {
        // Update sword button
        const swordTier = gameData.inventory.sword || 0;
        if (swordTier >= 5) {
            this.swordButton.button.setText(`${this.items.sword.name}\nMAX TIER`);
        } else {
            const tierName = this.items.sword.tiers[swordTier];
            const price = this.items.sword.prices[swordTier];
            this.swordButton.button.setText(`${tierName} ${this.items.sword.name}\n$${price}`);
        }

        // Update shield button
        const shieldTier = gameData.inventory.shield || 0;
        if (shieldTier >= 5) {
            this.shieldButton.button.setText(`${this.items.shield.name}\nMAX TIER`);
        } else {
            const tierName = this.items.shield.tiers[shieldTier];
            const price = this.items.shield.prices[shieldTier];
            this.shieldButton.button.setText(`${tierName} ${this.items.shield.name}\n$${price}`);
        }
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
        }).setOrigin(0.5);

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
            element.setDepth(2000);
        });
        this.scene.physics.pause();
        
        // Save when opening store
        if (gameData?.save) gameData.save();
    }

    close() {
        this.isOpen = false;
        this.elements.forEach(element => element.setVisible(false));
        if (this.purchaseMessage) {
            this.purchaseMessage.destroy();
        }
        this.scene.physics.resume();
        
        // Add extended cooldown to all buildings after closing store
        this.addCloseCooldown();
    }

    addCloseCooldown() {
        // Set cooldown on all buildings to prevent immediate reopening
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