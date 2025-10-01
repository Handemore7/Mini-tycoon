class CombatLog {
    constructor(scene, container, mask) {
        this.scene = scene;
        this.container = container;
        this.mask = mask;
        this.logLines = [];
        this.scrollOffset = 0;
        this.maxVisibleLines = 15;
        this.lineHeight = 18;
    }
    
    addColoredLog(segments) {
        this.logLines.push({ segments });
        this.trimHistory();
        this.updateDisplay(true);
    }
    
    addLog(text, color = '#ffffff') {
        const lines = text.split('\n');
        lines.forEach(line => {
            if (line.trim() === '') {
                this.logLines.push({ segments: [{ text: ' ', color: '#ffffff' }] });
            } else {
                this.logLines.push({ segments: [{ text: line, color }] });
            }
        });
        this.trimHistory();
        this.updateDisplay(true);
    }
    
    trimHistory() {
        if (this.logLines.length > 50) {
            this.logLines = this.logLines.slice(-50);
        }
    }
    
    updateDisplay(autoScroll = false) {
        if (!this.container) return;
        
        this.container.removeAll(true);
        
        if (autoScroll && this.logLines.length > this.maxVisibleLines) {
            this.scrollOffset = Math.max(0, this.logLines.length - this.maxVisibleLines);
        }
        
        const startIndex = this.scrollOffset;
        const endIndex = Math.min(startIndex + this.maxVisibleLines, this.logLines.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const line = this.logLines[i];
            const displayIndex = i - startIndex;
            const yPos = displayIndex * this.lineHeight;
            
            let xOffset = 0;
            if (line.segments) {
                line.segments.forEach(segment => {
                    const textObj = this.scene.add.text(xOffset, yPos, segment.text, {
                        fontSize: '14px',
                        fill: segment.color
                    });
                    this.container.add(textObj);
                    xOffset += textObj.width;
                });
            }
        }
    }
    
    handleScroll(pointer, deltaY) {
        const logArea = { x: 50, y: 120, width: 700, height: this.maxVisibleLines * this.lineHeight };
        if (pointer.x >= logArea.x && pointer.x <= logArea.x + logArea.width &&
            pointer.y >= logArea.y && pointer.y <= logArea.y + logArea.height) {
            
            const scrollSpeed = 3;
            this.scrollOffset += deltaY > 0 ? scrollSpeed : -scrollSpeed;
            
            const maxScroll = Math.max(0, this.logLines.length - this.maxVisibleLines);
            this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
            
            this.updateDisplay();
        }
    }
    
    reset() {
        this.logLines = [
            { segments: [{ text: 'Welcome to the Dungeon!', color: '#ffffff' }] },
            { segments: [{ text: 'Defeat enemies on 20 floors to win!', color: '#ffffff' }] }
        ];
        this.scrollOffset = 0;
        this.updateDisplay();
    }
}