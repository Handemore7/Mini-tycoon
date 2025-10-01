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
        // Background panel
        this.background = this.scene.add.graphics()
            .fillStyle(0x000000, 0.9)
            .fillRect(100, 80, 600, 440)
            .setVisible(false);
        
        // Title
        this.title = this.scene.add.text(400, 110, 'DECORATIONS', {
            fontSize: '24px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Description
        this.description = this.scene.add.text(400, 140, 'Unlock and place decorative items by completing achievements', {
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

        // Decoration buttons
        this.tableButton = this.createDecorationButton(250, 200, 'table');
        this.plantButton = this.createDecorationButton(400, 200, 'plant');
        this.trophyButton = this.createDecorationButton(550, 200, 'trophy');

        // Inventory section
        this.inventoryTitle = this.scene.add.text(400, 320, 'INVENTORY', {
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setVisible(false);

        this.inventoryContainer = this.scene.add.container(400, 360).setVisible(false);

        // Instructions
        this.instructionsText = this.scene.add.text(400, 450, 
            'Buy items above • Click inventory items to place • Right-click placed items to move', {
            fontSize: '11px',
            fill: '#cccccc'
        }).setOrigin(0.5).setVisible(false);

        this.elements = [this.background, this.title, this.closeButton, 
                        this.tableButton.container, this.plantButton.container, this.trophyButton.container,
                        this.inventoryTitle, this.inventoryContainer, this.instructionsText];
    }

    createDecorationButton(x, y, itemType) {
        const container = this.scene.add.container(x, y).setVisible(false);
        const item = this.decorationItems[itemType];
        
        let statusText = '';
        let buttonColor = '#444444';
        let canUse = false;

        // Check unlock status
        const isUnlocked = achievements.isDecorationUnlocked(itemType);
        
        if (!isUnlocked) {
            const achievement = achievements.achievements[item.achievement];
            statusText = `${item.name}\n🔒 ${achievement.description}`;
            buttonColor = '#666666';
            canUse = false;
        } else {
            if (gameData.money >= item.cost) {
                statusText = `${item.name}\n$${item.cost}`;
                buttonColor = '#444444';
                canUse = true;
            } else {
                statusText = `${item.name}\n$${item.cost}\nNot enough money`;
                buttonColor = '#666666';
                canUse = false;
            }
        }

        const button = this.scene.add.text(0, 0, `${item.icon}\n${statusText}`, {
            fontSize: '12px',
            fill: canUse ? '#ffffff' : '#888888',
            backgroundColor: buttonColor,
            padding: { x: 15, y: 12 },
            align: 'center'
        }).setOrigin(0.5).setInteractive();

        if (canUse) {
            button.on('pointerdown', () => this.selectDecoration(itemType));
        }
        
        container.add(button);
        return { container, button, itemType };
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

    updateButtons() {
        // Recreate buttons with updated status
        if (this.tableButton && this.tableButton.container) {
            this.tableButton.container.destroy();
        }
        if (this.plantButton && this.plantButton.container) {
            this.plantButton.container.destroy();
        }
        if (this.trophyButton && this.trophyButton.container) {
            this.trophyButton.container.destroy();
        }
        
        this.tableButton = this.createDecorationButton(250, 200, 'table');
        this.plantButton = this.createDecorationButton(400, 200, 'plant');
        this.trophyButton = this.createDecorationButton(550, 200, 'trophy');
        
        // Update inventory display
        this.updateInventoryDisplay();
        
        // Update elements array
        this.elements = [this.background, this.title, this.description, this.closeButton, 
                        this.tableButton.container, this.plantButton.container, this.trophyButton.container,
                        this.inventoryTitle, this.inventoryContainer, this.instructionsText];
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
        this.updateButtons();
        this.elements.forEach(element => {
            element.setVisible(true);
            element.setDepth(3000);
        });
        this.scene.physics.pause();
        
        // Save when opening decorations
        if (gameData?.save) gameData.save();
    }

    close() {
        this.isOpen = false;
        this.elements.forEach(element => element.setVisible(false));
        if (this.message) this.message.destroy();
        this.scene.physics.resume();
        
        // Add cooldown to prevent immediate reopening
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