class LoadingScreen {
    constructor() {
        this.isVisible = false;
        this.progress = 0;
        this.statusText = 'Initializing...';
        this.createLoadingScreen();
        // Hide by default
        this.hide();
    }

    createLoadingScreen() {
        // Create loading overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-screen';
        this.overlay.innerHTML = `
            <div class="loading-container">
                <div class="loading-logo">
                    <h1>🎮 Mini Tycoon</h1>
                    <p>Loading your adventure...</p>
                </div>
                
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="progress-text" id="progress-text">0%</div>
                </div>
                
                <div class="loading-status" id="loading-status">Initializing...</div>
                
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
    }

    show() {
        this.isVisible = true;
        this.overlay.style.display = 'flex';
    }

    hide() {
        this.isVisible = false;
        this.overlay.style.opacity = '0';
        this.overlay.style.display = 'none';
    }

    updateProgress(progress, status) {
        this.progress = Math.min(100, Math.max(0, progress));
        this.statusText = status || this.statusText;
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const statusElement = document.getElementById('loading-status');
        
        if (progressFill) progressFill.style.width = `${this.progress}%`;
        if (progressText) progressText.textContent = `${Math.round(this.progress)}%`;
        if (statusElement) statusElement.textContent = this.statusText;
    }

    showError(errorMessage) {
        const statusElement = document.getElementById('loading-status');
        const progressContainer = document.querySelector('.loading-progress');
        
        if (statusElement) {
            statusElement.textContent = `❌ Error: ${errorMessage}`;
            statusElement.style.color = '#ff6b6b';
        }
        
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
        
        // Add refresh button
        if (!document.getElementById('refresh-button')) {
            const refreshButton = document.createElement('button');
            refreshButton.id = 'refresh-button';
            refreshButton.innerHTML = '🔄 Refresh Game';
            refreshButton.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 20px;
                transition: background 0.3s;
            `;
            
            refreshButton.onmouseover = () => refreshButton.style.background = '#45a049';
            refreshButton.onmouseout = () => refreshButton.style.background = '#4CAF50';
            refreshButton.onclick = () => window.location.reload();
            
            const loadingContainer = document.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.appendChild(refreshButton);
            }
        }
    }

    setStatus(status) {
        this.statusText = status;
        const statusElement = document.getElementById('loading-status');
        if (statusElement) statusElement.textContent = this.statusText;
    }
}

// Global loading screen instance
window.loadingScreen = new LoadingScreen();