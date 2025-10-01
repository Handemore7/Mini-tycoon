class EnemyGenerator {
    static generateEnemy(floor) {
        const isBoss = floor % 5 === 0;
        
        if (isBoss) {
            return this.generateBoss(floor);
        }
        
        return this.generateRegularEnemy(floor);
    }
    
    static generateBoss(floor) {
        const bosses = [
            { name: 'Poison Spider Queen', health: 80, damage: 15, coins: 100 },
            { name: 'Cursed Necromancer', health: 120, damage: 20, coins: 150 },
            { name: 'Toxic Hydra', health: 180, damage: 25, coins: 200 },
            { name: 'Ancient Lich Lord', health: 250, damage: 30, coins: 300 }
        ];
        
        const bossIndex = Math.min(Math.floor((floor - 5) / 5), bosses.length - 1);
        const baseBoss = bosses[bossIndex];
        const floorMultiplier = 1 + (floor - 1) * 0.1;
        
        return {
            name: baseBoss.name,
            health: Math.floor(baseBoss.health * floorMultiplier),
            maxHealth: Math.floor(baseBoss.health * floorMultiplier),
            damage: Math.floor(baseBoss.damage * floorMultiplier),
            coins: Math.floor(baseBoss.coins * floorMultiplier),
            isBoss: true,
            preparingSpecial: false,
            specialAttacks: ['poison', 'wound']
        };
    }
    
    static generateRegularEnemy(floor) {
        const enemies = [
            { name: 'Goblin', health: 25, damage: 8, coins: 15 },
            { name: 'Orc Warrior', health: 40, damage: 12, coins: 25 },
            { name: 'Skeleton', health: 30, damage: 10, coins: 20 },
            { name: 'Dark Mage', health: 35, damage: 15, coins: 30 },
            { name: 'Troll', health: 60, damage: 18, coins: 40 },
            { name: 'Minotaur', health: 80, damage: 22, coins: 60 },
            { name: 'Dragon', health: 120, damage: 30, coins: 100 },
            { name: 'Lich King', health: 150, damage: 35, coins: 150 }
        ];
        
        const enemyIndex = Math.min(Math.floor((floor - 1) / 3), enemies.length - 1);
        const baseEnemy = enemies[enemyIndex];
        const floorMultiplier = 1 + (floor - 1) * 0.15;
        
        return {
            name: baseEnemy.name,
            health: Math.floor(baseEnemy.health * floorMultiplier),
            maxHealth: Math.floor(baseEnemy.health * floorMultiplier),
            damage: Math.floor(baseEnemy.damage * floorMultiplier),
            coins: Math.floor(baseEnemy.coins * floorMultiplier),
            isBoss: false
        };
    }
}