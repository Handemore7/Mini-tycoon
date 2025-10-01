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
        this.title = this.scene.add.text(400, 110, 'EQUIPMENT STORE', {
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
        this.description = this.scene.add.text(400, 160, 'Upgrade your combat gear and stock up on healing potions', {
            fontSize: '14px',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Player stats display
        this.statsText = this.scene.add.text(130, 190, '', {
            fontSize: '12px',
            fill: '#4ecdc4',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 8 }
        }).setVisible(false);

        // Money display
        this.moneyText = this.scene.add.text(570, 190, '', {
            fontSize: '14px',
            fill: '#f1c40f',
            fontWeight: 'bold',
            backgroundColor: '#2c3e50',
            padding: { x: 10, y: 8 }
        }).setOrigin(0.5).setVisible(false);

        // Item cards
        this.swordCard = this.createItemCard(220, 300, 'sword');
        this.shieldCard = this.createItemCard(400, 300, 'shield');
        this.potionCard = this.createItemCard(580, 300, 'potion');

        this.elements = [this.background, this.headerBg, this.title, this.closeButton, this.description,
                        this.statsText, this.moneyText,
                        this.swordCard.container, this.shieldCard.container, this.potionCard.container];
        
        this.elements.forEach(element => element.setDepth(3000));
    }

    createItemCard(x, y, itemType) {
        const container = this.scene.add.container(x, y).setVisible(false);
        
        // Card background
        const cardBg = this.scene.add.graphics()
            .fillStyle(0x2c3e50, 1)
            .fillRoundedRect(-70, -80, 140, 160, 10)
            .lineStyle(2, 0x34495e, 1)
            .strokeRoundedRect(-70, -80, 140, 160, 10);
        
        // Image placeholder
        const imagePlaceholder = this.scene.add.graphics()
            .fillStyle(0x34495e, 1)
            .fillRoundedRect(-50, -70, 100, 60, 5)
            .lineStyle(1, 0x7f8c8d, 1)
            .strokeRoundedRect(-50, -70, 100, 60, 5);
        
        let imageText, itemName, priceText, canBuy = true;
        
        if (itemType === 'potion') {
            imageText = 'POTION\nIMAGE';
            itemName = 'Health Potion';
            priceText = `$${this.items.potion.price}`;
        } else {
            const currentTier = gameData.inventory[itemType] || 0;
            if (currentTier >= 5) {
                imageText = `${itemType.toUpperCase()}\nIMAGE`;
                itemName = `${this.items[itemType].name} (MAX)`;
                priceText = 'MAXED';
                canBuy = false;
            } else {
                const tierName = this.items[itemType].tiers[currentTier];
                imageText = `${tierName.toUpperCase()}\n${itemType.toUpperCase()}\nIMAGE`;
                itemName = `${tierName} ${this.items[itemType].name}`;
                priceText = `$${this.items[itemType].prices[currentTier]}`;
            }
        }
        
        // Image placeholder text
        const imageLabel = this.scene.add.text(0, -40, imageText, {
            fontSize: '10px',
            fill: '#95a5a6',
            align: 'center'
        }).setOrigin(0.5);
        
        // Item name
        const nameText = this.scene.add.text(0, -5, itemName, {
            fontSize: '12px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        // Stats display for equipment
        let statsText = null;
        if (itemType !== 'potion') {
            const currentTier = gameData.inventory[itemType] || 0;
            if (currentTier < 5) {
                const statValue = itemType === 'sword' ? 
                    this.items.sword.damage[currentTier] : 
                    this.items.shield.armor[currentTier];
                const statName = itemType === 'sword' ? 'DMG' : 'ARM';
                statsText = this.scene.add.text(0, 15, `+${statValue} ${statName}`, {
                    fontSize: '10px',
                    fill: '#4ecdc4'
                }).setOrigin(0.5);
            }
        } else {
            statsText = this.scene.add.text(0, 15, '+50 HP', {
                fontSize: '10px',
                fill: '#e74c3c'
            }).setOrigin(0.5);
        }
        
        // Buy button
        const buyButton = this.scene.add.graphics()
            .fillStyle(canBuy ? 0x27ae60 : 0x7f8c8d, 1)
            .fillRoundedRect(-50, 35, 100, 30, 5)
            .lineStyle(1, canBuy ? 0x2ecc71 : 0x95a5a6, 1)
            .strokeRoundedRect(-50, 35, 100, 30, 5);
        
        const buttonText = this.scene.add.text(0, 50, canBuy ? priceText : 'MAXED', {
            fontSize: '12px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        if (canBuy) {
            buyButton.setInteractive(new Phaser.Geom.Rectangle(-50, 35, 100, 30), Phaser.Geom.Rectangle.Contains);
            buyButton.on('pointerdown', () => this.buyItem(itemType));
            buyButton.on('pointerover', () => {
                buyButton.clear()
                    .fillStyle(0x2ecc71, 1)
                    .fillRoundedRect(-50, 35, 100, 30, 5)
                    .lineStyle(1, 0x27ae60, 1)
                    .strokeRoundedRect(-50, 35, 100, 30, 5);
            });
            buyButton.on('pointerout', () => {
                buyButton.clear()
                    .fillStyle(0x27ae60, 1)
                    .fillRoundedRect(-50, 35, 100, 30, 5)
                    .lineStyle(1, 0x2ecc71, 1)
                    .strokeRoundedRect(-50, 35, 100, 30, 5);
            });
        }
        
        container.add([cardBg, imagePlaceholder, imageLabel, nameText, buyButton, buttonText]);
        if (statsText) container.add(statsText);
        
        return { container, itemType, buyButton, buttonText, nameText, statsText, imageLabel };
    }

    buyItem(itemType) {
        if (itemType === 'potion') {
            if (gameData.spendMoney(this.items.potion.price)) {
                gameData.healthPotions = (gameData.healthPotions || 0) + 1;
                if (gameData?.save) gameData.save();
                
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
                
                if (itemType === 'sword') {
                    gameData.stats.damage += this.items.sword.damage[currentTier];
                } else if (itemType === 'shield') {
                    gameData.stats.armor += this.items.shield.armor[currentTier];
                }
                
                gameData.updateStats(gameData.stats);
                
                if (gameData?.save) gameData.save();
                
                achievements.checkAchievement('firstPurchase');
                
                if (this.scene.inventory) {
                    this.scene.inventory.updateDisplay();
                }
                
                this.showPurchaseMessage(`Bought ${this.items[itemType].tiers[currentTier]} ${this.items[itemType].name}!`);
                this.updateCards();
                this.updateDisplays();
            } else {
                this.showPurchaseMessage('Not enough money!', '#ff0000');
            }
        }
    }

    updateCards() {
        this.updateCard(this.swordCard, 'sword');
        this.updateCard(this.shieldCard, 'shield');
        this.updateCard(this.potionCard, 'potion');
    }
    
    updateCard(card, itemType) {
        if (itemType === 'potion') return;
        
        const currentTier = gameData.inventory[itemType] || 0;
        const canBuy = currentTier < 5;
        
        if (canBuy) {
            const tierName = this.items[itemType].tiers[currentTier];
            const price = this.items[itemType].prices[currentTier];
            const statValue = itemType === 'sword' ? 
                this.items.sword.damage[currentTier] : 
                this.items.shield.armor[currentTier];
            const statName = itemType === 'sword' ? 'DMG' : 'ARM';
            
            card.nameText.setText(`${tierName} ${this.items[itemType].name}`);
            card.buttonText.setText(`$${price}`);
            if (card.statsText) card.statsText.setText(`+${statValue} ${statName}`);
            card.imageLabel.setText(`${tierName.toUpperCase()}\n${itemType.toUpperCase()}\nIMAGE`);
        } else {
            card.nameText.setText(`${this.items[itemType].name} (MAX)`);
            card.buttonText.setText('MAXED');
            if (card.statsText) card.statsText.setText('MAXED');
        }
    }
    
    updateDisplays() {
        const stats = gameData.stats;
        this.statsText.setText(`HP: ${stats.health}/${stats.maxHealth}\nDMG: ${stats.damage}\nARM: ${stats.armor}`);
        this.moneyText.setText(`💰 ${gameData.money} coins`);
    }

    showPurchaseMessage(message, color = '#00ff00') {
        if (this.purchaseMessage) {
            this.purchaseMessage.destroy();
        }
        
        this.purchaseMessage = this.scene.add.text(400, 480, message, {
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
        this.updateDisplays();
        this.elements.forEach(element => {
            element.setVisible(true);
            element.setDepth(3000);
        });
        this.scene.physics.pause();
        
        if (gameData?.save) gameData.save();
    }

    close() {
        this.isOpen = false;
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