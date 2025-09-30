class Inventory {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = true;
        this.placementMode = false;
        this.selectedItem = null;
        this.createInventoryUI();
    }

    createInventoryUI() {
        // Background panel
        this.background = this.scene.add.graphics()
            .fillStyle(0x000000, 0.8)
            .fillRect(700, 50, 90, 500)
            .lineStyle(2, 0x333333, 1)
            .strokeRect(700, 50, 90, 500);

        // Title
        this.title = this.scene.add.text(745, 70, 'INVENTORY', {
            fontSize: '10px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // Inventory slots container
        this.slotsContainer = this.scene.add.container(745, 100);
        
        this.updateDisplay();
    }

    updateDisplay() {
        this.slotsContainer.removeAll(true);
        
        let y = 0;
        const slotSize = 40;
        const spacing = 45;

        // Display equipment
        this.addEquipmentSlot('sword', y);
        y += spacing;
        this.addEquipmentSlot('shield', y);
        y += spacing;

        // Display decorative items
        if (gameData.decorationInventory) {
            Object.keys(gameData.decorationInventory).forEach(itemType => {
                const count = gameData.decorationInventory[itemType];
                if (count > 0) {
                    this.addDecorationSlot(itemType, count, y);
                    y += spacing;
                }
            });
        }

        // Display health potions
        if (gameData.healthPotions && gameData.healthPotions > 0) {
            this.addPotionSlot(gameData.healthPotions, y);
        }
    }

    addEquipmentSlot(type, y) {
        const currentTier = gameData.inventory[type] || 0;
        if (currentTier === 0) return;

        const slot = this.scene.add.graphics()
            .fillStyle(0x444444, 1)
            .fillRect(-18, -18, 36, 36)
            .setInteractive(new Phaser.Geom.Rectangle(-18, -18, 36, 36), Phaser.Geom.Rectangle.Contains);

        const icon = this.scene.add.text(0, 0, type === 'sword' ? '⚔️' : '🛡️', {
            fontSize: '16px'
        }).setOrigin(0.5);

        const tierText = this.scene.add.text(0, 12, `T${currentTier}`, {
            fontSize: '8px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const container = this.scene.add.container(0, y, [slot, icon, tierText]);
        
        slot.on('pointerdown', () => this.handleEquipmentClick(type));
        
        this.slotsContainer.add(container);
    }

    addDecorationSlot(itemType, count, y) {
        const decorationItems = {
            table: { icon: '🪑', name: 'Table' },
            plant: { icon: '🌱', name: 'Plant' },
            trophy: { icon: '🏆', name: 'Trophy' }
        };

        const item = decorationItems[itemType];
        if (!item) return;

        const slot = this.scene.add.graphics()
            .fillStyle(0x444444, 1)
            .fillRect(-18, -18, 36, 36)
            .setInteractive(new Phaser.Geom.Rectangle(-18, -18, 36, 36), Phaser.Geom.Rectangle.Contains);

        const icon = this.scene.add.text(0, 0, item.icon, {
            fontSize: '16px'
        }).setOrigin(0.5);

        const countText = this.scene.add.text(0, 12, `x${count}`, {
            fontSize: '8px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const container = this.scene.add.container(0, y, [slot, icon, countText]);
        
        slot.on('pointerdown', () => this.handleDecorationClick(itemType));
        
        this.slotsContainer.add(container);
    }

    addPotionSlot(count, y) {
        const slot = this.scene.add.graphics()
            .fillStyle(0x444444, 1)
            .fillRect(-18, -18, 36, 36)
            .setInteractive(new Phaser.Geom.Rectangle(-18, -18, 36, 36), Phaser.Geom.Rectangle.Contains);

        const icon = this.scene.add.text(0, 0, '🧪', {
            fontSize: '16px'
        }).setOrigin(0.5);

        const countText = this.scene.add.text(0, 12, `x${count}`, {
            fontSize: '8px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const container = this.scene.add.container(0, y, [slot, icon, countText]);
        
        slot.on('pointerdown', () => this.handlePotionClick());
        
        this.slotsContainer.add(container);
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