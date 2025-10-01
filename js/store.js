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

        // Item cards (moved up)
        this.swordCard = this.createItemCard(220, 260, 'sword');
        this.shieldCard = this.createItemCard(400, 260, 'shield');
        this.potionCard = this.createItemCard(580, 260, 'potion');

        // Bottom info section background
        this.infoBg = this.scene.add.graphics()
            .fillStyle(0x34495e, 1)
            .fillRoundedRect(120, 420, 560, 80, 10)
            .setVisible(false);

        // Player stats display (moved to bottom)
        this.statsText = this.scene.add.text(150, 440, '', {
            fontSize: '12px',
            fill: '#4ecdc4',
            fontWeight: 'bold'
        }).setVisible(false);

        // Money display (moved to bottom center)
        this.moneyText = this.scene.add.text(400, 440, '', {
            fontSize: '14px',
            fill: '#f1c40f',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Inventory preview (moved to bottom right)
        this.inventoryText = this.scene.add.text(550, 440, '', {
            fontSize: '12px',
            fill: '#e67e22',
            fontWeight: 'bold'
        }).setVisible(false);

        this.elements = [this.background, this.headerBg, this.title, this.closeButton, this.description,
                        this.swordCard.container, this.shieldCard.container, this.potionCard.container,
                        this.infoBg, this.statsText, this.moneyText, this.inventoryText];
        
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
        
        // Item image or placeholder
        let itemImage, itemName, priceText, canBuy = true;
        
        if (itemType === 'potion') {
            // Potion placeholder for now
            const imagePlaceholder = this.scene.add.graphics()
                .fillStyle(0x34495e, 1)
                .fillRoundedRect(-50, -70, 100, 60, 5)
                .lineStyle(1, 0x7f8c8d, 1)
                .strokeRoundedRect(-50, -70, 100, 60, 5);
            itemImage = this.scene.add.text(0, -40, 'POTION\nIMAGE', {
                fontSize: '10px',
                fill: '#95a5a6',
                align: 'center'
            }).setOrigin(0.5);
            itemName = 'Health Potion';
            priceText = `$${this.items.potion.price}`;
        } else {
            const currentTier = gameData.inventory[itemType] || 0;
            if (currentTier >= 5) {
                // Show max tier sword
                const tierName = this.items[itemType].tiers[4].toLowerCase().replace('wooden', 'wood');
                if (this.scene.textures.exists(`${itemType}_${tierName}`)) {
                    itemImage = this.scene.add.image(0, -40, `${itemType}_${tierName}`).setDisplaySize(80, 50);
                } else {
                    itemImage = this.scene.add.text(0, -40, `${itemType.toUpperCase()}\nIMAGE`, {
                        fontSize: '10px',
                        fill: '#95a5a6',
                        align: 'center'
                    }).setOrigin(0.5);
                }
                itemName = `${this.items[itemType].name} (MAX)`;
                priceText = 'MAXED';
                canBuy = false;
            } else {
                const tierName = this.items[itemType].tiers[currentTier].toLowerCase().replace('wooden', 'wood');
                if (this.scene.textures.exists(`${itemType}_${tierName}`)) {
                    itemImage = this.scene.add.image(0, -40, `${itemType}_${tierName}`).setDisplaySize(80, 50);
                } else {
                    itemImage = this.scene.add.text(0, -40, `${tierName.toUpperCase()}\n${itemType.toUpperCase()}\nIMAGE`, {
                        fontSize: '10px',
                        fill: '#95a5a6',
                        align: 'center'
                    }).setOrigin(0.5);
                }
                itemName = `${this.items[itemType].tiers[currentTier]} ${this.items[itemType].name}`;
                priceText = `$${this.items[itemType].prices[currentTier]}`;
            }
        }
        
        // Item name
        const nameText = this.scene.add.text(0, -5, itemName, {
            fontSize: '10px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center',
            wordWrap: { width: 130 }
        }).setOrigin(0.5);
        
        // Tier progress bar for equipment
        let progressBar = null;
        if (itemType !== 'potion') {
            const currentTier = gameData.inventory[itemType] || 0;
            progressBar = this.scene.add.graphics()
                .fillStyle(0x34495e, 1)
                .fillRoundedRect(-40, 10, 80, 6, 3)
                .fillStyle(0x3498db, 1)
                .fillRoundedRect(-40, 10, (80 * currentTier) / 5, 6, 3);
        }
        
        // Stats display for equipment
        let statsText = null;
        if (itemType !== 'potion') {
            const currentTier = gameData.inventory[itemType] || 0;
            if (currentTier < 5) {
                const currentStat = itemType === 'sword' ? 
                    (currentTier > 0 ? this.items.sword.damage[currentTier - 1] : 0) : 
                    (currentTier > 0 ? this.items.shield.armor[currentTier - 1] : 0);
                const nextStat = itemType === 'sword' ? 
                    this.items.sword.damage[currentTier] : 
                    this.items.shield.armor[currentTier];
                const statName = itemType === 'sword' ? 'DMG' : 'ARM';
                statsText = this.scene.add.text(0, 25, `${currentStat} → ${nextStat} ${statName}`, {
                    fontSize: '10px',
                    fill: '#4ecdc4',
                    align: 'center',
                    wordWrap: { width: 120 }
                }).setOrigin(0.5);
            } else {
                const maxStat = itemType === 'sword' ? 
                    this.items.sword.damage[4] : 
                    this.items.shield.armor[4];
                const statName = itemType === 'sword' ? 'DMG' : 'ARM';
                statsText = this.scene.add.text(0, 25, `${maxStat} ${statName} (MAX)`, {
                    fontSize: '10px',
                    fill: '#95a5a6',
                    align: 'center',
                    wordWrap: { width: 120 }
                }).setOrigin(0.5);
            }
        } else {
            statsText = this.scene.add.text(0, 25, '+50 HP', {
                fontSize: '10px',
                fill: '#e74c3c',
                align: 'center'
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
        
        container.add([cardBg, itemImage, nameText, buyButton, buttonText]);
        if (progressBar) container.add(progressBar);
        if (statsText) container.add(statsText);
        
        return { container, itemType, buyButton, buttonText, nameText, statsText, itemImage, progressBar };
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
        
        // Update progress bar
        if (card.progressBar) {
            card.progressBar.clear()
                .fillStyle(0x34495e, 1)
                .fillRoundedRect(-40, 10, 80, 6, 3)
                .fillStyle(0x3498db, 1)
                .fillRoundedRect(-40, 10, (80 * currentTier) / 5, 6, 3);
        }
        
        if (canBuy) {
            const tierName = this.items[itemType].tiers[currentTier];
            const price = this.items[itemType].prices[currentTier];
            const currentStat = currentTier > 0 ? 
                (itemType === 'sword' ? this.items.sword.damage[currentTier - 1] : this.items.shield.armor[currentTier - 1]) : 0;
            const nextStat = itemType === 'sword' ? 
                this.items.sword.damage[currentTier] : 
                this.items.shield.armor[currentTier];
            const statName = itemType === 'sword' ? 'DMG' : 'ARM';
            
            card.nameText.setText(`${tierName} ${this.items[itemType].name}`);
            card.buttonText.setText(`$${price}`);
            if (card.statsText) card.statsText.setText(`${currentStat} → ${nextStat} ${statName}`);
            
            // Update image
            const imageKey = tierName.toLowerCase().replace('wooden', 'wood');
            if (this.scene.textures.exists(`${itemType}_${imageKey}`)) {
                if (card.itemImage.texture) {
                    card.itemImage.setTexture(`${itemType}_${imageKey}`).setDisplaySize(80, 50);
                }
            }
        } else {
            const maxStat = itemType === 'sword' ? this.items.sword.damage[4] : this.items.shield.armor[4];
            const statName = itemType === 'sword' ? 'DMG' : 'ARM';
            card.nameText.setText(`${this.items[itemType].name} (MAX)`);
            card.buttonText.setText('MAXED');
            if (card.statsText) card.statsText.setText(`${maxStat} ${statName} (MAX)`);
            
            // Update to max tier image
            if (this.scene.textures.exists(`${itemType}_diamond`)) {
                if (card.itemImage.texture) {
                    card.itemImage.setTexture(`${itemType}_diamond`).setDisplaySize(80, 50);
                }
            }
        }
    }
    
    updateDisplays() {
        const stats = gameData.stats;
        this.statsText.setText(`CURRENT STATS\nHP: ${stats.health}/${stats.maxHealth}\nDMG: ${stats.damage} | ARM: ${stats.armor}`);
        this.moneyText.setText(`💰 ${gameData.money}\nCOINS`);
        
        // Update inventory preview
        const swordTier = gameData.inventory.sword || 0;
        const shieldTier = gameData.inventory.shield || 0;
        const potions = gameData.healthPotions || 0;
        this.inventoryText.setText(`INVENTORY\nSword: T${swordTier}/5\nShield: T${shieldTier}/5\nPotions: ${potions}`);
    }

    showPurchaseMessage(message, color = '#00ff00') {
        if (this.purchaseMessage) {
            this.purchaseMessage.destroy();
        }
        
        this.purchaseMessage = this.scene.add.text(400, 380, message, {
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
        
        // Don't pause physics - allow movement
        this.storePosition = { x: this.scene.storeBuilding.x, y: this.scene.storeBuilding.y };
        
        // Start real-time updates and distance checking
        this.updateInterval = setInterval(() => {
            if (this.isOpen) {
                this.updateDisplays();
                this.checkPlayerDistance();
            }
        }, 100);
        
        if (gameData?.save) gameData.save();
    }
    
    checkPlayerDistance() {
        if (!this.scene.player || !this.storePosition) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x, this.scene.player.y,
            this.storePosition.x, this.storePosition.y
        );
        
        // Close store if player is more than 120 pixels away
        if (distance > 120) {
            this.close();
        }
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
        // Physics already running, no need to resume
        
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