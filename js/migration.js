class DataMigration {
    static async migrateLocalToDatabase() {
        if (!window.database || !window.database.isOnline) {
            console.log('Database not available for migration');
            return false;
        }

        // Check if there's local data to migrate
        const localSave = localStorage.getItem('miniTycoonSave');
        if (!localSave) {
            console.log('No local data to migrate');
            return false;
        }

        try {
            const saveData = JSON.parse(localSave);
            if (saveData.playerName) {
                // Check if data already exists in database
                const existingData = await window.database.loadPlayer(saveData.playerName);
                
                if (!existingData) {
                    // Migrate to database
                    await window.database.savePlayer(saveData.playerName, saveData);
                    console.log(`✅ Migrated ${saveData.playerName} to database`);
                    
                    // Create backup of local data
                    localStorage.setItem('miniTycoonSave_backup', localSave);
                    
                    return true;
                } else {
                    console.log('Player data already exists in database');
                    return false;
                }
            }
        } catch (error) {
            console.error('Migration failed:', error);
            return false;
        }
    }

    static showMigrationPrompt(scene) {
        // Create migration prompt UI
        const bg = scene.add.rectangle(400, 300, 500, 200, 0x000000, 0.9);
        const title = scene.add.text(400, 250, 'Data Migration Available', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const message = scene.add.text(400, 280, 'Migrate your local save to cloud database?', {
            fontSize: '14px',
            fill: '#cccccc'
        }).setOrigin(0.5);
        
        const yesBtn = scene.add.text(350, 320, 'YES', {
            fontSize: '16px',
            fill: '#00ff00',
            backgroundColor: '#333333',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive();
        
        const noBtn = scene.add.text(450, 320, 'NO', {
            fontSize: '16px',
            fill: '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive();
        
        yesBtn.on('pointerdown', async () => {
            const success = await DataMigration.migrateLocalToDatabase();
            bg.destroy();
            title.destroy();
            message.destroy();
            yesBtn.destroy();
            noBtn.destroy();
            
            if (success) {
                scene.showMessage('✅ Data migrated to cloud!', '#00ff00');
            }
        });
        
        noBtn.on('pointerdown', () => {
            bg.destroy();
            title.destroy();
            message.destroy();
            yesBtn.destroy();
            noBtn.destroy();
        });
    }
}