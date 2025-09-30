const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2c3e50',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene, SettingsScene]
};

const game = new Phaser.Game(config);