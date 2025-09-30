// Asset configuration for Mini Tycoon Game
const AssetConfig = {
    // Player assets
    player: {
        idle: 'assets/sprites/player/player.png',
        walk: 'assets/sprites/player/player_walk.png',
        size: { width: 16, height: 16 }
    },
    
    // Building assets
    buildings: {
        store: {
            sprite: 'assets/sprites/buildings/store.png',
            size: { width: 64, height: 64 }
        },
        upgrades: {
            sprite: 'assets/sprites/buildings/upgrades.png',
            size: { width: 64, height: 64 }
        },
        decoration: {
            sprite: 'assets/sprites/buildings/decoration.png',
            size: { width: 64, height: 64 }
        },
        arena: {
            sprite: 'assets/sprites/buildings/arena.png',
            size: { width: 64, height: 64 }
        }
    },
    
    // Equipment assets
    equipment: {
        swords: {
            wooden: { sprite: 'assets/sprites/items/sword_wooden.png', size: { width: 32, height: 32 } },
            stone: { sprite: 'assets/sprites/items/sword_stone.png', size: { width: 32, height: 32 } },
            gold: { sprite: 'assets/sprites/items/sword_gold.png', size: { width: 32, height: 32 } },
            iron: { sprite: 'assets/sprites/items/sword_iron.png', size: { width: 32, height: 32 } },
            diamond: { sprite: 'assets/sprites/items/sword_diamond.png', size: { width: 32, height: 32 } }
        },
        shields: {
            wooden: { sprite: 'assets/sprites/items/shield_wooden.png', size: { width: 32, height: 32 } },
            stone: { sprite: 'assets/sprites/items/shield_stone.png', size: { width: 32, height: 32 } },
            gold: { sprite: 'assets/sprites/items/shield_gold.png', size: { width: 32, height: 32 } },
            iron: { sprite: 'assets/sprites/items/shield_iron.png', size: { width: 32, height: 32 } },
            diamond: { sprite: 'assets/sprites/items/shield_diamond.png', size: { width: 32, height: 32 } }
        }
    },
    
    // Item assets
    items: {
        healthPotion: {
            sprite: 'assets/sprites/items/health_potion.png',
            size: { width: 24, height: 24 }
        }
    },
    
    // UI assets
    ui: {
        coin: {
            sprite: 'assets/sprites/ui/coin.png',
            size: { width: 16, height: 16 }
        },
        heart: {
            sprite: 'assets/sprites/ui/heart.png',
            size: { width: 16, height: 16 }
        }
    },
    
    // Recommended sprite sizes for pixel art
    recommendedSizes: {
        player: '16x16 pixels',
        buildings: '64x64 pixels',
        equipment: '32x32 pixels',
        items: '24x24 pixels',
        ui: '16x16 pixels'
    }
};