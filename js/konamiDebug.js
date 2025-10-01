class KonamiDebug {
    constructor(scene) {
        this.scene = scene;
        this.sequence = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'enter'];
        // Alternative sequence from README: WWSSADAD+Enter
        this.altSequence = ['w', 'w', 's', 's', 'a', 'd', 'a', 'd', 'enter'];
        this.altInput = [];
        this.userInput = [];
        this.resetTimer = null;
        this.setupListener();
    }

    setupListener() {
        document.addEventListener('keydown', (event) => {
            this.handleInput(event.code);
        });
    }

    handleInput(keyCode) {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }

        // Check for WWSSADAD+Enter sequence
        let altKey = null;
        if (keyCode === 'KeyW') altKey = 'w';
        else if (keyCode === 'KeyS') altKey = 's';
        else if (keyCode === 'KeyA') altKey = 'a';
        else if (keyCode === 'KeyD') altKey = 'd';
        else if (keyCode === 'Enter') altKey = 'enter';

        if (altKey && altKey === this.altSequence[this.altInput.length]) {
            this.altInput.push(altKey);
            
            if (this.altInput.length === this.altSequence.length) {
                this.activateDebug();
                this.altInput = [];
                return;
            }
            
            this.resetTimer = setTimeout(() => {
                this.altInput = [];
            }, 5000);
        } else if (altKey) {
            this.altInput = [];
        }

        // Original arrow key sequence
        let direction = null;
        if (keyCode === 'ArrowUp') direction = 'up';
        else if (keyCode === 'ArrowDown') direction = 'down';
        else if (keyCode === 'ArrowLeft') direction = 'left';
        else if (keyCode === 'ArrowRight') direction = 'right';
        else if (keyCode === 'Enter') direction = 'enter';

        if (direction && direction === this.sequence[this.userInput.length]) {
            this.userInput.push(direction);
            
            if (this.userInput.length === this.sequence.length) {
                this.activateDebug();
                this.userInput = [];
                return;
            }
            
            this.resetTimer = setTimeout(() => {
                this.userInput = [];
            }, 5000);
        } else if (direction) {
            this.userInput = [];
        }
    }

    activateDebug() {
        try {
            if (!this.scene.debugConsole) {
                this.scene.debugConsole = new DebugConsole(this.scene);
            }
            this.scene.debugConsole.toggle();
            console.log('🎮 Debug Console activated!');
        } catch (error) {
            console.error('❌ Debug Console error:', error);
            // Fallback: show simple alert
            alert('Debug Console Error. Check browser console (F12) for details.');
        }
    }
}