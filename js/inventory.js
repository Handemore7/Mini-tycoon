class Inventory {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = true;
        this.placementMode = false;
        this.selectedItem = null;
        this.createInventoryUI();
    }

    createInventoryUI() {
        // Create fixed slot grid first to get proper dimensions
        this.createSlotGrid();
        
        // Background panel aligned with slots (centered vertically)
        this.background = this.scene.add.graphics()
            .fillStyle(0x000000, 0.8)
            .fillRect(675, 160, 100, 250)
            .lineStyle(2, 0x333333, 1)
            .strokeRect(675, 160, 100, 250)
            .setDepth(1500);

        // Title
        this.title = this.scene.add.text(725, 175, 'INVENTORY', {
            fontSize: '12px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(1500);
        
        // Setup C key to toggle inventory
        this.cKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.cKey.on('down', () => this.toggle());
        
        this.updateDisplay();
    }

    createSlotGrid() {
        this.slots = [];
        const startX = 705;
        const startY = 205;
        const slotSize = 32;
        const spacing = 35;
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 2; col++) {
                const x = startX + (col * spacing);
                const y = startY + (row * spacing);
                
                // Create empty slot background
                const slotBg = this.scene.add.graphics()
                    .fillStyle(0x333333, 1)
                    .fillRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize)
                    .lineStyle(1, 0x666666, 1)
                    .strokeRect(x - slotSize/2, y - slotSize/2, slotSize, slotSize)
                    .setDepth(1500);
                
                this.slots.push({ x, y, slotBg, content: null });
            }
        }
    }

    updateDisplay() {
        // Clear existing content from slots
        this.slots.forEach(slot => {
            if (slot.content) {
                slot.content.destroy();
                slot.content = null;
            }
        });
        
        let slotIndex = 0;

        // Add equipment to slots
        if (gameData.inventory.sword > 0) {
            this.addItemToSlot(slotIndex++, 'sword', gameData.inventory.sword);
        }
        if (gameData.inventory.shield > 0) {
            this.addItemToSlot(slotIndex++, 'shield', gameData.inventory.shield);
        }

        // Add decorative items to slots
        if (gameData.decorationInventory) {
            Object.keys(gameData.decorationInventory).forEach(itemType => {
                const count = gameData.decorationInventory[itemType];
                if (count > 0 && slotIndex < this.slots.length) {
                    this.addItemToSlot(slotIndex++, itemType, count);
                }
            });
        }

        // Add health potions to slots
        if (gameData.healthPotions && gameData.healthPotions > 0 && slotIndex < this.slots.length) {
            this.addItemToSlot(slotIndex++, 'potion', gameData.healthPotions);
        }
    }

    addItemToSlot(slotIndex, itemType, count) {
        if (slotIndex >= this.slots.length) return;
        
        const slot = this.slots[slotIndex];
        let icon, clickHandler;
        
        if (itemType === 'sword') {
            icon = '⚔️';
            clickHandler = () => this.handleEquipmentClick('sword');
        } else if (itemType === 'shield') {
            icon = '🛡️';
            clickHandler = () => this.handleEquipmentClick('shield');
        } else if (itemType === 'potion') {
            icon = '🧪';
            clickHandler = () => this.handlePotionClick();
        } else {
            // Decoration items
            const decorationItems = {
                table: '🪑',
                plant: '🌱',
                trophy: '🏆'
            };
            icon = decorationItems[itemType] || '❓';
            clickHandler = () => this.handleDecorationClick(itemType);
        }
        
        const container = this.scene.add.container(slot.x, slot.y).setDepth(1600);
        
        // Item icon
        const itemIcon = this.scene.add.text(0, -6, icon, {
            fontSize: '16px'
        }).setOrigin(0.5).setInteractive();
        
        // Count text (if more than 1)
        let countText = null;
        if (count > 1 || itemType === 'sword' || itemType === 'shield') {
            const displayText = (itemType === 'sword' || itemType === 'shield') ? `T${count}` : `x${count}`;
            countText = this.scene.add.text(0, 8, displayText, {
                fontSize: '8px',
                fill: '#ffffff'
            }).setOrigin(0.5);
        }
        
        itemIcon.on('pointerdown', clickHandler);
        
        container.add(itemIcon);
        if (countText) container.add(countText);
        
        slot.content = container;
    }



    handleEquipmentClick(type) {
        // Equipment swapping logic would go here
        // For now, just show a message
        this.showMessage(`${type} equipped`);
    }

    handleDecorationClick(itemType) {
        if (this.placementMode) return;
        
        this.selectedItem = itemType;
        this.placementMode = true;
        this.enterPlacementMode();
    }

    handlePotionClick() {
        if (gameData.healthPotions > 0 && gameData.stats.health < gameData.stats.maxHealth) {
            gameData.stats.health = Math.min(gameData.stats.maxHealth, gameData.stats.health + 50);
            gameData.healthPotions--;
            gameData.save();
            this.updateDisplay();
            this.showMessage('Health restored!');
        }
    }

    enterPlacementMode() {
        const decorationItems = {
            table: { size: { width: 32, height: 32 } },
            plant: { size: { width: 24, height: 24 } },
            trophy: { size: { width: 28, height: 28 } }
        };

        // Create preview sprite
        this.previewSprite = this.scene.add.graphics()
            .fillStyle(0x00ff00, 0.5)
            .fillRect(0, 0, decorationItems[this.selectedItem].size.width, 
                     decorationItems[this.selectedItem].size.height);

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
        
        // Delay adding click listener to prevent immediate placement
        this.scene.time.delayedCall(100, () => {
            this.scene.input.on('pointerdown', this.placeDecoration, this);
        });
        
        // ESC to cancel
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => this.cancelPlacement());
    }

    updatePreview(pointer) {
        if (this.previewSprite) {
            const decorationItems = {
                table: { size: { width: 32, height: 32 } },
                plant: { size: { width: 24, height: 24 } },
                trophy: { size: { width: 28, height: 28 } }
            };
            const size = decorationItems[this.selectedItem].size;
            this.previewSprite.setPosition(pointer.x - size.width/2, pointer.y - size.height/2);
        }
    }

    placeDecoration(pointer) {
        if (!this.placementMode) return;

        // Check UI boundaries - prevent placement in UI areas
        if (pointer.x < 150 && pointer.y < 100) { // Top-left coin area
            this.showMessage('Cannot place here - UI area', '#ff0000');
            return;
        }
        if (pointer.x > 650) { // Right side inventory area
            this.showMessage('Cannot place here - UI area', '#ff0000');
            return;
        }

        // Remove from inventory
        if (gameData.decorationInventory[this.selectedItem] > 0) {
            gameData.decorationInventory[this.selectedItem]--;
            if (gameData.decorationInventory[this.selectedItem] === 0) {
                delete gameData.decorationInventory[this.selectedItem];
            }
        }

        const decorationItems = {
            table: { size: { width: 32, height: 32 } },
            plant: { size: { width: 24, height: 24 } },
            trophy: { size: { width: 28, height: 28 } }
        };
        const size = decorationItems[this.selectedItem].size;
        
        const decoration = {
            type: this.selectedItem,
            x: pointer.x - size.width/2,
            y: pointer.y - size.height/2,
            id: Date.now()
        };

        // Add to game data
        gameData.decorations.push(decoration);
        gameData.save();

        // Create actual decoration sprite with collision
        this.createDecorationSprite(decoration);

        this.cancelPlacement();
        this.updateDisplay();
        this.showMessage('Decoration placed!');
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.setVisibility(this.isVisible);
    }

    setVisibility(visible) {
        this.background.setVisible(visible);
        this.title.setVisible(visible);
        this.slots.forEach(slot => {
            slot.slotBg.setVisible(visible);
            if (slot.content) {
                slot.content.setVisible(visible);
            }
        });
    }

    createDecorationSprite(decoration) {
        const decorationItems = {
            table: { icon: '🪑', size: { width: 32, height: 32 } },
            plant: { icon: '🌱', size: { width: 24, height: 24 } },
            trophy: { icon: '🏆', size: { width: 28, height: 28 } }
        };
        
        const item = decorationItems[decoration.type];
        
        // Create invisible rectangle for collision
        const sprite = this.scene.add.rectangle(decoration.x + item.size.width/2, decoration.y + item.size.height/2, 
                                               item.size.width, item.size.height, 0x000000, 0);

        // Add physics for collision
        this.scene.physics.add.existing(sprite, true); // true = static body (already immovable)
        
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
        // Implementation for moving decorations
        console.log('Moving decoration not implemented yet');
    }

    cancelPlacement() {
        this.placementMode = false;
        if (this.previewSprite) this.previewSprite.destroy();
        if (this.placementInstructions) this.placementInstructions.destroy();
        this.scene.input.off('pointermove', this.updatePreview, this);
        this.scene.input.off('pointerdown', this.placeDecoration, this);
    }

    addItem(type, itemType, quantity = 1) {
        if (type === 'decoration') {
            if (!gameData.decorationInventory) gameData.decorationInventory = {};
            gameData.decorationInventory[itemType] = (gameData.decorationInventory[itemType] || 0) + quantity;
        } else if (type === 'equipment') {
            gameData.inventory[itemType] = quantity;
        } else if (type === 'potion') {
            gameData.healthPotions = (gameData.healthPotions || 0) + quantity;
        }
        
        gameData.save();
        this.updateDisplay();
    }

    showMessage(message, color = '#00ff00') {
        if (this.message) this.message.destroy();
        
        this.message = this.scene.add.text(400, 500, message, {
            fontSize: '14px',
            fill: color,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        this.scene.time.delayedCall(2000, () => {
            if (this.message) this.message.destroy();
        });
    }
}