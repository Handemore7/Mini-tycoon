class Building extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type, name) {
        // Map building types to sprite keys
        const spriteMap = {
            'store': 'store_building',
            'upgrades': 'upgrades_building', 
            'decoration': 'decoration_building',
            'fights': 'arena_building'
        };
        const spriteKey = scene.textures.exists(spriteMap[type]) ? spriteMap[type] : 'building';
        super(scene, x, y, spriteKey);
        
        this.buildingType = type;
        this.buildingName = name;
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setImmovable(true);
        this.body.setSize(64, 64);
        this.interactionCooldown = false;
        
        // Add text label
        this.label = scene.add.text(x, y - 40, name, {
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Ensure the label is always rendered above the building sprite and follows its position
        // Set initial depth and keep label one level above
        const baseDepth = 500;
        this.setDepth(baseDepth);
        this.label.setDepth(baseDepth + 1);

        // Wrap setDepth so external calls (tutorial highlighting) also update the label depth
        const originalSetDepth = this.setDepth.bind(this);
        this.setDepth = (d) => {
            originalSetDepth(d);
            if (this.label) this.label.setDepth(d + 1);
            return this;
        };
    }

    preUpdate(time, delta) {
        // Keep the label positioned above the building in case the building moves or depth changes
        if (this.label) {
            this.label.setPosition(this.x, this.y - 40);
        }
        // Call parent preUpdate if present
        if (super.preUpdate) super.preUpdate(time, delta);
    }

    interact(scene) {
        switch(this.buildingType) {
            case 'store':
                this.openStore(scene);
                break;
            case 'upgrades':
                this.openUpgrades(scene);
                break;
            case 'decoration':
                this.openDecoration(scene);
                break;
            case 'fights':
                this.openFights(scene);
                break;
        }
    }

    openStore(scene) {
        if (scene.storeSystem) {
            scene.storeSystem.open();
        }
    }

    openUpgrades(scene) {
        if (scene.upgradesSystem) {
            scene.upgradesSystem.open();
        }
    }

    openDecoration(scene) {
        if (scene.decorationSystem) {
            scene.decorationSystem.open();
        }
    }

    openFights(scene) {
        if (scene.arenaSystem) {
            scene.arenaSystem.open();
        }
    }
}