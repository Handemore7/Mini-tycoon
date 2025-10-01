class Achievements {
    constructor() {
        this.achievements = {
            firstPurchase: {
                id: 'firstPurchase',
                name: 'First Purchase',
                description: 'Buy your first item from the store',
                unlocks: ['table'],
                completed: false
            },
            chatStreak3: {
                id: 'chatStreak3',
                name: 'Chat Streak',
                description: 'Chat for 3 consecutive days',
                unlocks: ['plant'],
                completed: false
            },
            arenaWin: {
                id: 'arenaWin',
                name: 'Arena Champion',
                description: 'Win your first arena fight',
                unlocks: ['trophy'],
                completed: false
            },
            richPlayer: {
                id: 'richPlayer',
                name: 'Rich Player',
                description: 'Accumulate 5000 coins',
                unlocks: ['fountain'],
                completed: false
            },
            speedDemon: {
                id: 'speedDemon',
                name: 'Speed Demon',
                description: 'Max out speed boots upgrade',
                unlocks: ['statue'],
                completed: false
            }
        };
        
        this.loadAchievements();
    }

    loadAchievements() {
        if (gameData.achievements) {
            Object.keys(gameData.achievements).forEach(id => {
                if (this.achievements[id]) {
                    this.achievements[id].completed = gameData.achievements[id].completed;
                }
            });
        } else {
            gameData.achievements = {};
        }
    }

    checkAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.completed) return false;

        let completed = false;

        switch (achievementId) {
            case 'firstPurchase':
                completed = (gameData.inventory.sword > 0 || gameData.inventory.shield > 0);
                break;
            case 'chatStreak3':
                completed = (gameData.chatStreak >= 3);
                break;
            case 'arenaWin':
                completed = (gameData.arenaWins > 0);
                break;
            case 'richPlayer':
                completed = (gameData.money >= 5000);
                break;
            case 'speedDemon':
                completed = (gameData.upgrades.boots >= 10);
                break;
        }

        if (completed) {
            this.unlockAchievement(achievementId);
            return true;
        }
        return false;
    }

    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.completed) return;

        achievement.completed = true;
        gameData.achievements[achievementId] = { completed: true };
        
        // Unlock decorations
        achievement.unlocks.forEach(decorationType => {
            if (!gameData.unlockedDecorations) gameData.unlockedDecorations = {};
            gameData.unlockedDecorations[decorationType] = true;
        });

        gameData.save();
        this.showAchievementNotification(achievement);
    }

    showAchievementNotification(achievement) {
        // Create achievement popup (will be implemented in UI)
        console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
        
        // Show in-game notification if scene exists
        if (window.currentScene && window.currentScene.add) {
            const notification = window.currentScene.add.container(400, 100);
            
            const bg = window.currentScene.add.graphics()
                .fillStyle(0x000000, 0.9)
                .fillRect(-150, -30, 300, 60);
            
            const title = window.currentScene.add.text(0, -10, '🏆 Achievement Unlocked!', {
                fontSize: '14px',
                fill: '#ffff00',
                fontWeight: 'bold'
            }).setOrigin(0.5);
            
            const desc = window.currentScene.add.text(0, 10, achievement.name, {
                fontSize: '12px',
                fill: '#ffffff'
            }).setOrigin(0.5);
            
            notification.add([bg, title, desc]);
            notification.setDepth(3000);
            
            // Fade out after 3 seconds
            window.currentScene.time.delayedCall(3000, () => {
                notification.destroy();
            });
        }
    }

    checkAllAchievements() {
        Object.keys(this.achievements).forEach(id => {
            this.checkAchievement(id);
        });
    }

    isDecorationUnlocked(decorationType) {
        return gameData.unlockedDecorations && gameData.unlockedDecorations[decorationType];
    }
}

const achievements = new Achievements();