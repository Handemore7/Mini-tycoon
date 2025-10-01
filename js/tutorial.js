class Tutorial {
    constructor(scene) {
        this.scene = scene;
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tutorialText = null;
        this.arrow = null;
        this.skipButton = null;
        
        this.steps = [
            {
                text: "Welcome to Mini Tycoon! Use WASD or arrow keys to move around.",
                target: null,
                action: 'move',
                highlight: 'player'
            },
            {
                text: "Walk into the Store (top-left) to buy equipment and potions.",
                target: { x: 200, y: 150 },
                action: 'visit_store',
                highlight: 'store'
            },
            {
                text: "Visit Upgrades (top-right) to improve your character stats.",
                target: { x: 600, y: 150 },
                action: 'visit_upgrades',
                highlight: 'upgrades'
            },
            {
                text: "Check out Decorations (bottom-left) to unlock and place items!",
                target: { x: 200, y: 450 },
                action: 'visit_decorations',
                highlight: 'decorations'
            },
            {
                text: "Try the Arena (bottom-right) for turn-based combat!",
                target: { x: 600, y: 450 },
                action: 'visit_arena',
                highlight: 'arena'
            },
            {
                text: "Press C to toggle your inventory. You earn 1 coin every 5 seconds!",
                target: null,
                action: 'inventory',
                highlight: 'ui'
            },
            {
                text: "Tutorial completed! Explore and have fun!",
                target: null,
                action: 'complete',
                highlight: null
            }
        ];
        
        this.currentHighlight = null;
        this.originalDepths = {};
    }

    start() {
        if (this.shouldShowTutorial()) {
            this.isActive = true;
            this.currentStep = 0;
            
            // Keep player above tutorial throughout
            if (this.scene.player) {
                this.originalDepths.player = this.scene.player.depth;
                this.scene.player.setDepth(2100);
            }
            
            this.createUI();
            this.showStep();
        }
    }

    shouldShowTutorial() {
        // Show tutorial for new players or if manually triggered
        return !localStorage.getItem('miniTycoon_tutorialCompleted') || 
               localStorage.getItem('miniTycoon_showTutorial') === 'true';
    }

    createUI() {
        // Semi-transparent overlay
        this.overlay = this.scene.add.graphics();
        this.overlay.fillStyle(0x000000, 0.7);
        this.overlay.fillRect(0, 0, 800, 600);
        this.overlay.setDepth(2000);

        // Tutorial text box background
        this.textBg = this.scene.add.graphics();
        this.textBg.fillStyle(0x2c3e50, 0.9);
        this.textBg.fillRoundedRect(150, 450, 500, 120, 10);
        this.textBg.setDepth(2001);

        this.tutorialText = this.scene.add.text(170, 470, '', {
            fontSize: '18px',
            fill: '#ffffff',
            wordWrap: { width: 350 }
        }).setDepth(2002);

        // Skip button (above top-right corner of text box)
        this.skipButton = this.scene.add.text(550, 420, 'Skip (ESC)', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        }).setDepth(2002).setInteractive();

        this.skipButton.on('pointerdown', () => this.skip());

        // Back button (bottom-left of text box)
        this.backButton = this.scene.add.text(170, 540, 'Back', {
            fontSize: '16px',
            fill: '#e74c3c'
        }).setDepth(2002).setInteractive();

        this.backButton.on('pointerdown', () => this.previousStep());

        // Next button (bottom-right of text box)
        this.nextButton = this.scene.add.text(580, 540, 'Next', {
            fontSize: '16px',
            fill: '#3498db'
        }).setDepth(2002).setInteractive();

        this.nextButton.on('pointerdown', () => this.nextStep());

        // ESC key to skip
        this.escHandler = () => this.skip();
        this.scene.input.keyboard.on('keydown-ESC', this.escHandler);
    }

    showStep() {
        if (this.currentStep >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[this.currentStep];
        this.tutorialText.setText(`Step ${this.currentStep + 1}/${this.steps.length}: ${step.text}`);

        // Show/hide back button (hide on first step)
        if (this.backButton) {
            this.backButton.setVisible(this.currentStep > 0);
        }

        // Remove previous arrow and highlight
        if (this.arrow) {
            this.arrow.destroy();
            this.arrow = null;
        }
        
        this.removeHighlight();
        this.addHighlight(step.highlight);

        // Show arrow pointing to target
        if (step.target) {
            this.arrow = this.scene.add.graphics();
            this.arrow.fillStyle(0xf39c12);
            this.arrow.fillTriangle(
                step.target.x - 10, step.target.y - 30,
                step.target.x + 10, step.target.y - 30,
                step.target.x, step.target.y - 10
            );
            this.arrow.setDepth(2001);

            // Pulsing animation
            this.scene.tweens.add({
                targets: this.arrow,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }

        // Auto-advance for certain steps
        this.checkAutoAdvance(step);
    }

    checkAutoAdvance(step) {
        // Clear any existing checkers first
        this.clearCheckers();
        
        switch (step.action) {
            case 'move':
                // Advance when player actually moves (not just position check)
                this.movementChecker = () => {
                    if (!this.isActive) return; // Stop if tutorial ended
                    if (this.scene.playerHasMoved) {
                        this.clearCheckers();
                        this.nextStep();
                    } else {
                        this.movementTimeout = setTimeout(this.movementChecker, 100);
                    }
                };
                this.movementTimeout = setTimeout(this.movementChecker, 500);
                break;
                
            case 'visit_store':
                // Advance when store opens
                this.storeChecker = () => {
                    if (!this.isActive) return;
                    if (this.scene.storeSystem && this.scene.storeSystem.isOpen) {
                        this.clearCheckers();
                        this.nextStep();
                    } else {
                        this.storeTimeout = setTimeout(this.storeChecker, 100);
                    }
                };
                this.storeTimeout = setTimeout(this.storeChecker, 100);
                break;
                
            case 'visit_upgrades':
                // Advance when upgrades opens
                this.upgradesChecker = () => {
                    if (!this.isActive) return;
                    if (this.scene.upgradesSystem && this.scene.upgradesSystem.isOpen) {
                        this.clearCheckers();
                        this.nextStep();
                    } else {
                        this.upgradesTimeout = setTimeout(this.upgradesChecker, 100);
                    }
                };
                this.upgradesTimeout = setTimeout(this.upgradesChecker, 100);
                break;
                
            case 'visit_decorations':
                // Advance when decorations opens
                this.decorationsChecker = () => {
                    if (!this.isActive) return;
                    if (this.scene.decorationSystem && this.scene.decorationSystem.isOpen) {
                        this.clearCheckers();
                        this.nextStep();
                    } else {
                        this.decorationsTimeout = setTimeout(this.decorationsChecker, 100);
                    }
                };
                this.decorationsTimeout = setTimeout(this.decorationsChecker, 100);
                break;
                
            case 'visit_arena':
                // Advance when arena opens
                this.arenaChecker = () => {
                    if (!this.isActive) return;
                    if (this.scene.arenaSystem && this.scene.arenaSystem.isOpen) {
                        this.clearCheckers();
                        this.nextStep();
                    } else {
                        this.arenaTimeout = setTimeout(this.arenaChecker, 100);
                    }
                };
                this.arenaTimeout = setTimeout(this.arenaChecker, 100);
                break;
                
            case 'inventory':
                // Advance when inventory is toggled via C key
                if (this.scene.inventory && !this.inventoryOverridden) {
                    const originalToggle = this.scene.inventory.toggle;
                    this.inventoryOverridden = true;
                    this.scene.inventory.toggle = () => {
                        originalToggle.call(this.scene.inventory);
                        if (this.isActive) {
                            this.clearCheckers();
                            this.nextStep();
                            this.scene.inventory.toggle = originalToggle;
                            this.inventoryOverridden = false;
                        }
                    };
                }
                break;
        }
    }
    
    clearCheckers() {
        if (this.movementTimeout) {
            clearTimeout(this.movementTimeout);
            this.movementTimeout = null;
        }
        if (this.storeTimeout) {
            clearTimeout(this.storeTimeout);
            this.storeTimeout = null;
        }
        if (this.upgradesTimeout) {
            clearTimeout(this.upgradesTimeout);
            this.upgradesTimeout = null;
        }
        if (this.decorationsTimeout) {
            clearTimeout(this.decorationsTimeout);
            this.decorationsTimeout = null;
        }
        if (this.arenaTimeout) {
            clearTimeout(this.arenaTimeout);
            this.arenaTimeout = null;
        }
    }

    nextStep() {
        this.currentStep++;
        this.showStep();
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            // Reset playerHasMoved flag when going back to step 1
            if (this.currentStep === 0) {
                this.scene.playerHasMoved = false;
            }
            this.showStep();
        }
    }
    
    addHighlight(type) {
        if (!type) return;
        
        switch (type) {
            case 'player':
                if (this.scene.player) {
                    // Player is already above tutorial, just make it extra highlighted
                    this.scene.player.setDepth(2500);
                    this.currentHighlight = this.scene.player;
                }
                break;
                
            case 'store':
                if (this.scene.storeBuilding) {
                    this.originalDepths.store = this.scene.storeBuilding.depth;
                    this.scene.storeBuilding.setDepth(2500);
                    this.currentHighlight = this.scene.storeBuilding;
                }
                break;
                
            case 'upgrades':
                if (this.scene.upgradesBuilding) {
                    this.originalDepths.upgrades = this.scene.upgradesBuilding.depth;
                    this.scene.upgradesBuilding.setDepth(2500);
                    this.currentHighlight = this.scene.upgradesBuilding;
                }
                break;
                
            case 'decorations':
                if (this.scene.decorationBuilding) {
                    this.originalDepths.decorations = this.scene.decorationBuilding.depth;
                    this.scene.decorationBuilding.setDepth(2500);
                    this.currentHighlight = this.scene.decorationBuilding;
                }
                break;
                
            case 'arena':
                if (this.scene.fightsBuilding) {
                    this.originalDepths.arena = this.scene.fightsBuilding.depth;
                    this.scene.fightsBuilding.setDepth(2500);
                    this.currentHighlight = this.scene.fightsBuilding;
                }
                break;
                
            case 'ui':
                if (this.scene.ui) {
                    // Bring UI elements above tutorial
                    if (this.scene.ui.moneyText) this.scene.ui.moneyText.setDepth(2500);
                    if (this.scene.ui.moneyIcon) this.scene.ui.moneyIcon.setDepth(2500);
                    if (this.scene.ui.playerNameText) this.scene.ui.playerNameText.setDepth(2500);
                    if (this.scene.ui.healthBar) this.scene.ui.healthBar.setDepth(2500);
                    if (this.scene.ui.healthBarBg) this.scene.ui.healthBarBg.setDepth(2500);
                    
                    // Add inventory hint centered above tutorial box
                    this.currentHighlight = this.scene.add.text(400, 420, 'Press C for Inventory', {
                        fontSize: '14px',
                        fill: '#00ffff',
                        backgroundColor: '#000000',
                        padding: { x: 8, y: 4 }
                    }).setOrigin(0.5).setDepth(2500);
                }
                break;
        }
    }
    
    removeHighlight() {
        // Keep player above tutorial during tutorial, only restore on complete
        if (this.scene.player && !this.isActive) {
            if (this.originalDepths.player !== undefined) {
                this.scene.player.setDepth(this.originalDepths.player);
            }
        } else if (this.scene.player) {
            // Keep player above tutorial but below highlighted elements
            this.scene.player.setDepth(2100);
        }
        if (this.scene.storeBuilding && this.originalDepths.store !== undefined) {
            this.scene.storeBuilding.setDepth(this.originalDepths.store);
        }
        if (this.scene.upgradesBuilding && this.originalDepths.upgrades !== undefined) {
            this.scene.upgradesBuilding.setDepth(this.originalDepths.upgrades);
        }
        if (this.scene.decorationBuilding && this.originalDepths.decorations !== undefined) {
            this.scene.decorationBuilding.setDepth(this.originalDepths.decorations);
        }
        if (this.scene.fightsBuilding && this.originalDepths.arena !== undefined) {
            this.scene.fightsBuilding.setDepth(this.originalDepths.arena);
        }
        
        // Clear stored depths
        this.originalDepths = {};
        
        // Destroy any created highlight elements (but not game objects)
        if (this.currentHighlight && this.currentHighlight.destroy && 
            this.currentHighlight !== this.scene.player &&
            this.currentHighlight !== this.scene.storeBuilding &&
            this.currentHighlight !== this.scene.upgradesBuilding &&
            this.currentHighlight !== this.scene.decorationBuilding &&
            this.currentHighlight !== this.scene.fightsBuilding) {
            this.currentHighlight.destroy();
        }
        this.currentHighlight = null;
    }

    skip() {
        this.complete();
    }

    complete() {
        this.isActive = false;
        this.clearCheckers();
        localStorage.setItem('miniTycoon_tutorialCompleted', 'true');
        localStorage.removeItem('miniTycoon_showTutorial');
        
        // Clean up UI elements and restore player depth
        this.removeHighlight();
        if (this.overlay) this.overlay.destroy();
        if (this.textBg) this.textBg.destroy();
        if (this.tutorialText) this.tutorialText.destroy();
        if (this.arrow) this.arrow.destroy();
        if (this.skipButton) this.skipButton.destroy();
        if (this.backButton) this.backButton.destroy();
        if (this.nextButton) this.nextButton.destroy();
        
        // Remove ESC key handler
        if (this.escHandler) {
            this.scene.input.keyboard.off('keydown-ESC', this.escHandler);
        }
        
        // Restore inventory toggle if overridden
        if (this.inventoryOverridden && this.scene.inventory) {
            // The original toggle should already be restored, just reset flag
            this.inventoryOverridden = false;
        }
        
        // Show completion message
        const completionText = this.scene.add.text(400, 300, 'Tutorial Complete!\nEnjoy the game!', {
            fontSize: '24px',
            fill: '#2ecc71',
            align: 'center'
        }).setOrigin(0.5).setDepth(2000);

        this.scene.tweens.add({
            targets: completionText,
            alpha: 0,
            duration: 3000,
            onComplete: () => completionText.destroy()
        });
    }

    // Manual tutorial restart
    static restart() {
        localStorage.setItem('miniTycoon_showTutorial', 'true');
        location.reload();
    }
}

window.Tutorial = Tutorial;