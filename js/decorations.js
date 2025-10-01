class Decorations {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.placementMode = false;
        this.selectedDecoration = null;
        this.decorationItems = {
            table: {
                name: 'Wooden Table',
                cost: 200,
                achievement: 'firstPurchase',
                icon: '🪑',
                size: { width: 32, height: 32 }
            },
            plant: {
                name: 'Decorative Plant',
                cost: 150,
                achievement: 'chatStreak3',
                icon: '🌱',
                size: { width: 24, height: 24 }
            },
            trophy: {
                name: 'Victory Trophy',
                cost: 300,
                achievement: 'arenaWin',
                icon: '🏆',
                size: { width: 28, height: 28 }
            },
            fountain: {
                name: 'Golden Fountain',
                cost: 1000,
                achievement: 'richPlayer',
                icon: '⛲',
                size: { width: 40, height: 40 }
            },
            statue: {
                name: 'Speed Statue',
                cost: 800,
                achievement: 'speedDemon',
                icon: '🗿',
                size: { width: 36, height: 36 }
            }
        };
        this.createInterface();
        this.initializeChatStreak();
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
        this.title = this.scene.add.text(400, 110, 'DECORATION SHOP', {
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
        this.description = this.scene.add.text(400, 160, 'Unlock and place decorative items by completing achievements', {
            fontSize: '14px',
            fill: '#cccccc',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Decoration cards
        this.tableCard = this.createDecorationCard(190, 260, 'table');
        this.plantCard = this.createDecorationCard(330, 260, 'plant');
        this.trophyCard = this.createDecorationCard(470, 260, 'trophy');
        this.fountainCard = this.createDecorationCard(610, 260, 'fountain');

        // Bottom info section
        this.infoBg = this.scene.add.graphics()
            .fillStyle(0x34495e, 1)
            .fillRoundedRect(120, 420, 560, 80, 10)
            .setVisible(false);

        // Money display
        this.moneyText = this.scene.add.text(400, 440, '', {
            fontSize: '16px',
            fill: '#f1c40f',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Instructions
        this.instructionsText = this.scene.add.text(400, 470, 
            'Complete achievements to unlock \u2022 Purchase to add to inventory \u2022 Use inventory to place', {
            fontSize: '11px',
            fill: '#cccccc',
            align: 'center',
            wordWrap: { width: 540 }
        }).setOrigin(0.5).setVisible(false);

        this.elements = [this.background, this.headerBg, this.title, this.closeButton, this.description,
                        this.tableCard.container, this.plantCard.container, this.trophyCard.container, this.fountainCard.container,
                        this.infoBg, this.moneyText, this.instructionsText];
    }

    createDecorationCard(x, y, itemType) {
        const container = this.scene.add.container(x, y).setVisible(false);
        const item = this.decorationItems[itemType];
        
        // Card background
        const cardBg = this.scene.add.graphics()
            .fillStyle(0x2c3e50, 1)
            .fillRoundedRect(-60, -70, 120, 140, 10)
            .lineStyle(2, 0x34495e, 1)
            .strokeRoundedRect(-60, -70, 120, 140, 10);
        
        // Icon background
        const iconBg = this.scene.add.graphics()
            .fillStyle(0x34495e, 1)
            .fillRoundedRect(-45, -60, 90, 50, 5)
            .lineStyle(1, 0x7f8c8d, 1)
            .strokeRoundedRect(-45, -60, 90, 50, 5);
        
        // Item icon
        const iconText = this.scene.add.text(0, -35, item.icon, {
            fontSize: '24px'
        }).setOrigin(0.5);
        
        // Item name
        const nameText = this.scene.add.text(0, -5, item.name, {
            fontSize: '10px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center',
            wordWrap: { width: 110 }
        }).setOrigin(0.5);
        
        // Status/price text
        const statusText = this.scene.add.text(0, 20, '', {
            fontSize: '10px',
            fill: '#cccccc',
            align: 'center',
            wordWrap: { width: 110 }
        }).setOrigin(0.5);
        
        // Buy button
        const buyButton = this.scene.add.graphics();
        
        const buttonText = this.scene.add.text(0, 50, '', {
            fontSize: '10px',
            fill: '#ffffff',
            fontWeight: 'bold',
            align: 'center'
        }).setOrigin(0.5);
        
        container.add([cardBg, iconBg, iconText, nameText, statusText, buyButton, buttonText]);
        
        return { container, itemType, buyButton, buttonText, statusText };
    }

    selectDecoration(itemType) {
        const item = this.decorationItems[itemType];
        
        if (!gameData.spendMoney(item.cost)) {
            this.showMessage('Not enough money!', '#ff0000');
            return;
        }
        
        // Add to inventory
        if (!gameData.decorationInventory) gameData.decorationInventory = {};
        gameData.decorationInventory[itemType] = (gameData.decorationInventory[itemType] || 0) + 1;
        
        // Save after decoration purchase
        if (gameData?.save) gameData.save();
        
        // Update inventory display
        if (this.scene.inventory) {
            this.scene.inventory.updateDisplay();
        }
        
        this.showMessage(`${item.name} added to inventory!`);
        this.updateButtons();
    }

    enterPlacementMode() {
        this.scene.physics.pause();
        
        // Create preview sprite
        this.previewSprite = this.scene.add.graphics()
            .fillStyle(0x00ff00, 0.5)
            .fillRect(0, 0, this.decorationItems[this.selectedDecoration].size.width, 
                     this.decorationItems[this.selectedDecoration].size.height);

        // Add placement instructions
        this.placementInstructions = this.scene.add.text(400, 50, 
            'Click to place decoration • ESC to cancel', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        // Mouse movement for preview
        this.scene.input.on('pointermove', this.updatePreview, this);
        this.scene.input.on('pointerdown', this.placeDecoration, this);
        
        // ESC to cancel
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => this.cancelPlacement());
    }

    updatePreview(pointer) {
        if (this.previewSprite) {
            this.previewSprite.setPosition(pointer.x, pointer.y);
        }
    }

    placeDecoration(pointer) {
        if (!this.placementMode) return;

        // Remove from inventory
        if (gameData.decorationInventory[this.selectedDecoration] > 0) {
            gameData.decorationInventory[this.selectedDecoration]--;
            if (gameData.decorationInventory[this.selectedDecoration] === 0) {
                delete gameData.decorationInventory[this.selectedDecoration];
            }
        }

        const decoration = {
            type: this.selectedDecoration,
            x: pointer.x,
            y: pointer.y,
            id: Date.now()
        };

        // Add to game data
        gameData.decorations.push(decoration);
        
        // Save after placing decoration
        if (gameData?.save) gameData.save();

        // Create actual decoration sprite
        this.createDecorationSprite(decoration);

        this.cancelPlacement();
        this.showMessage(`${this.decorationItems[this.selectedDecoration].name} placed!`);
    }

    createDecorationSprite(decoration) {
        const item = this.decorationItems[decoration.type];
        
        // Create invisible decoration sprite for collision
        const sprite = this.scene.add.rectangle(decoration.x + item.size.width/2, decoration.y + item.size.height/2, 
                                               item.size.width, item.size.height, 0x000000, 0);

        // Add physics for collision
        this.scene.physics.add.existing(sprite, true); // true = static body
        
        // Add icon text
        const iconText = this.scene.add.text(decoration.x + item.size.width/2, decoration.y + item.size.height/2, 
            item.icon, {
            fontSize: '24px'
        }).setOrigin(0.5);

        // Right-click to move
        sprite.setInteractive();
        sprite.on('pointerdown', (pointer, localX, localY, event) => {
            if (event.button === 2) { // Right click
                this.startMovingDecoration(decoration, sprite, iconText);
            }
        });

        // Add collision with player
        this.scene.physics.add.collider(this.scene.player, sprite);

        // Store references
        decoration.sprite = sprite;
        decoration.iconText = iconText;
    }

    startMovingDecoration(decoration, sprite, iconText) {
        this.movingDecoration = { decoration, sprite, iconText };
        this.scene.physics.pause();
        
        this.moveInstructions = this.scene.add.text(400, 50, 
            'Click new position • ESC to cancel', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        this.scene.input.on('pointerdown', this.moveDecoration, this);
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => this.cancelMove());
    }

    moveDecoration(pointer) {
        if (!this.movingDecoration) return;

        const { decoration, sprite, iconText } = this.movingDecoration;
        
        // Update positions
        decoration.x = pointer.x;
        decoration.y = pointer.y;
        sprite.setPosition(pointer.x, pointer.y);
        iconText.setPosition(pointer.x + this.decorationItems[decoration.type].size.width/2, 
                           pointer.y + this.decorationItems[decoration.type].size.height/2);

        gameData.save();
        this.cancelMove();
        this.showMessage('Decoration moved!');
    }

    cancelMove() {
        if (this.moveInstructions) this.moveInstructions.destroy();
        this.scene.input.off('pointerdown', this.moveDecoration, this);
        this.movingDecoration = null;
        this.scene.physics.resume();
    }

    cancelPlacement() {
        this.placementMode = false;
        if (this.previewSprite) this.previewSprite.destroy();
        if (this.placementInstructions) this.placementInstructions.destroy();
        this.scene.input.off('pointermove', this.updatePreview, this);
        this.scene.input.off('pointerdown', this.placeDecoration, this);
        this.scene.physics.resume();
    }

    initializeChatStreak() {
        // Initialize chat streak tracking
        if (!gameData.chatStreak) gameData.chatStreak = 0;
        if (!gameData.lastChatDate) gameData.lastChatDate = null;
    }

    updateChatStreak() {
        const today = new Date().toDateString();
        const lastDate = gameData.lastChatDate;
        
        if (lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate === yesterday.toDateString()) {
                // Consecutive day
                gameData.chatStreak = (gameData.chatStreak || 0) + 1;
            } else {
                // Streak broken
                gameData.chatStreak = 1;
            }
            
            gameData.lastChatDate = today;
            gameData.save();
        }
    }

    loadExistingDecorations() {
        gameData.decorations.forEach(decoration => {
            this.createDecorationSprite(decoration);
        });
    }

    updateCards() {
        this.updateCard(this.tableCard, 'table');
        this.updateCard(this.plantCard, 'plant');
        this.updateCard(this.trophyCard, 'trophy');
        this.updateCard(this.fountainCard, 'fountain');
        this.updateMoneyDisplay();
    }

    updateCard(card, itemType) {
        const item = this.decorationItems[itemType];
        const isUnlocked = achievements.isDecorationUnlocked(itemType);
        const canAfford = gameData.money >= item.cost;
        const canBuy = isUnlocked && canAfford;
        
        // Update status text
        if (!isUnlocked) {
            const achievement = achievements.achievements[item.achievement];
            card.statusText.setText(`🔒 ${achievement.description}`);
        } else {
            card.statusText.setText(`Cost: $${item.cost}`);
        }
        
        // Update button
        card.buyButton.clear();
        if (canBuy) {
            card.buyButton
                .fillStyle(0x27ae60, 1)
                .fillRoundedRect(-50, 35, 100, 25, 5)
                .lineStyle(1, 0x2ecc71, 1)
                .strokeRoundedRect(-50, 35, 100, 25, 5)
                .setInteractive(new Phaser.Geom.Rectangle(-50, 35, 100, 25), Phaser.Geom.Rectangle.Contains);
            
            card.buyButton.off('pointerdown').on('pointerdown', () => this.selectDecoration(itemType));
            card.buttonText.setText('BUY').setStyle({ fill: '#ffffff' });
        } else if (isUnlocked) {
            card.buyButton
                .fillStyle(0x7f8c8d, 1)
                .fillRoundedRect(-50, 35, 100, 25, 5)
                .lineStyle(1, 0x95a5a6, 1)
                .strokeRoundedRect(-50, 35, 100, 25, 5);
            
            card.buttonText.setText('NO MONEY').setStyle({ fill: '#cccccc' });
        } else {
            card.buyButton
                .fillStyle(0x555555, 1)
                .fillRoundedRect(-50, 35, 100, 25, 5)
                .lineStyle(1, 0x777777, 1)
                .strokeRoundedRect(-50, 35, 100, 25, 5);
            
            card.buttonText.setText('LOCKED').setStyle({ fill: '#888888' });
        }
    }

    updateMoneyDisplay() {
        this.moneyText.setText(`💰 ${gameData.money} COINS`);
    }

    updateInventoryDisplay() {
        this.inventoryContainer.removeAll(true);
        
        if (!gameData.decorationInventory) return;
        
        let x = -150;
        Object.keys(gameData.decorationInventory).forEach(itemType => {
            const count = gameData.decorationInventory[itemType];
            if (count > 0) {
                const item = this.decorationItems[itemType];
                const button = this.scene.add.text(x, 0, `${item.icon}\n${item.name}\nx${count}`, {
                    fontSize: '10px',
                    fill: '#ffffff',
                    backgroundColor: '#333333',
                    padding: { x: 8, y: 6 },
                    align: 'center'
                }).setOrigin(0.5).setInteractive();
                
                button.on('pointerdown', () => {
                    this.selectedDecoration = itemType;
                    this.placementMode = true;
                    this.close();
                    this.enterPlacementMode();
                });
                
                this.inventoryContainer.add(button);
                x += 100;
            }
        });
    }

    showMessage(message, color = '#00ff00') {
        if (this.message) this.message.destroy();
        
        this.message = this.scene.add.text(400, 450, message, {
            fontSize: '14px',
            fill: color,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        this.scene.time.delayedCall(2000, () => {
            if (this.message) this.message.destroy();
        });
    }

    open() {
        this.isOpen = true;
        this.updateCards();
        this.elements.forEach(element => {
            element.setVisible(true);
            element.setDepth(3000);
        });
        
        // Don't pause physics - allow movement
        this.decorationPosition = { x: this.scene.decorationBuilding.x, y: this.scene.decorationBuilding.y };
        
        // Start real-time updates and distance checking
        this.updateInterval = setInterval(() => {
            if (this.isOpen) {
                this.updateMoneyDisplay();
                this.checkPlayerDistance();
            }
        }, 100);
        
        if (gameData?.save) gameData.save();
    }
    
    checkPlayerDistance() {
        if (!this.scene.player || !this.decorationPosition) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x, this.scene.player.y,
            this.decorationPosition.x, this.decorationPosition.y
        );
        
        // Close decorations if player is more than 120 pixels away
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
        if (this.message) this.message.destroy();
        // Physics already running, no need to resume
        
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