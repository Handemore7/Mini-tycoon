class KonamiDebug {
    constructor(scene) {
        this.scene = scene;
        this.sequence = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'enter'];
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

        let direction = null;
        if (keyCode === 'ArrowUp' || keyCode === 'KeyW') direction = 'up';
        else if (keyCode === 'ArrowDown' || keyCode === 'KeyS') direction = 'down';
        else if (keyCode === 'ArrowLeft' || keyCode === 'KeyA') direction = 'left';
        else if (keyCode === 'ArrowRight' || keyCode === 'KeyD') direction = 'right';
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
        if (!this.scene.debugConsole) {
            this.scene.debugConsole = new DebugConsole(this.scene);
        }
        this.scene.debugConsole.toggle();
    }
}