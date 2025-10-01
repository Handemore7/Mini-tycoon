class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.normalMusic = null;
        this.arenaMusic = null;
        this.currentMusic = null;
        this.isPlaying = false;
    }

    preloadAudio() {
        // Load both music tracks
        this.scene.load.audio('normalMusic', 'assets/music/normal.ogg');
        this.scene.load.audio('arenaMusic', 'assets/music/arena.ogg');
    }

    createAudioObjects() {
        if (this.scene.sound) {
            this.normalMusic = this.scene.sound.add('normalMusic', {
                loop: true,
                volume: gameData.volume * 0.3
            });
            this.arenaMusic = this.scene.sound.add('arenaMusic', {
                loop: true,
                volume: gameData.volume * 0.3
            });
        }
    }

    playNormalMusic() {
        if (!this.normalMusic) this.createAudioObjects();
        
        if (this.currentMusic === this.normalMusic && this.isPlaying) return;
        
        this.stopCurrentMusic();
        if (this.normalMusic) {
            this.normalMusic.play();
            this.currentMusic = this.normalMusic;
            this.isPlaying = true;
        }
    }

    playArenaMusic() {
        if (!this.arenaMusic) this.createAudioObjects();
        
        if (this.currentMusic === this.arenaMusic && this.isPlaying) return;
        
        this.stopCurrentMusic();
        if (this.arenaMusic) {
            this.arenaMusic.play();
            this.currentMusic = this.arenaMusic;
            this.isPlaying = true;
        }
    }

    stopCurrentMusic() {
        if (this.currentMusic && this.isPlaying) {
            this.currentMusic.stop();
            this.isPlaying = false;
        }
    }

    updateVolume(volume) {
        const musicVolume = volume * 0.3;
        if (this.normalMusic) this.normalMusic.setVolume(musicVolume);
        if (this.arenaMusic) this.arenaMusic.setVolume(musicVolume);
    }

    destroy() {
        this.stopCurrentMusic();
        if (this.normalMusic) this.normalMusic.destroy();
        if (this.arenaMusic) this.arenaMusic.destroy();
    }
}

// Global audio manager instance
window.audioManager = null;