class WebSocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.activeEvents = new Map();
        this.setupEventHandlers();
    }

    connect(serverUrl) {
        // Auto-detect environment
        if (!serverUrl) {
            serverUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3001'
                : 'https://your-websocket-server.herokuapp.com'; // Replace with your server URL
        }
        try {
            // Using Socket.IO client
            this.socket = io(serverUrl);
            
            this.socket.on('connect', () => {
                this.connected = true;
                this.showNotification('🌐 Conectado al servidor', 'success');
            });

            this.socket.on('disconnect', () => {
                this.connected = false;
                this.showNotification('❌ Desconectado del servidor', 'warning');
            });

            // Event listeners
            this.socket.on('server_vote', (data) => this.handleServerVote(data));
            this.socket.on('coin_rain', (data) => this.handleCoinRain(data));
            this.socket.on('critical_madness', (data) => this.handleCriticalMadness(data));
            this.socket.on('speed_challenge', (data) => this.handleSpeedChallenge(data));
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
        }
    }

    setupEventHandlers() {
        // Event handlers setup
    }

    // SERVER VOTE EVENT
    handleServerVote(data) {
        const { eventId, question, options, duration = 20000 } = data;
        
        this.createEventNotification(
            eventId,
            '🗳️ Votación del Servidor',
            question,
            duration,
            'vote'
        );
        this.createVoteUI(eventId, question, options, duration);
    }

    createVoteUI(eventId, question, options, duration) {
        const voteContainer = document.createElement('div');
        voteContainer.id = 'vote-container';
        voteContainer.innerHTML = `
            <div class="vote-popup">
                <h3>🗳️ Votación del Servidor</h3>
                <p>${question}</p>
                <div class="vote-options">
                    ${options.map((option, index) => `
                        <button class="vote-btn" data-option="${index}">
                            ${option.name} <span class="vote-count">(0)</span>
                        </button>
                    `).join('')}
                </div>
                <div class="vote-timer">Tiempo restante: <span id="vote-countdown">20</span>s</div>
            </div>
        `;
        
        document.body.appendChild(voteContainer);
        
        // Vote buttons
        voteContainer.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.submitVote(eventId, parseInt(btn.dataset.option));
                btn.classList.add('voted');
                voteContainer.querySelectorAll('.vote-btn').forEach(b => b.disabled = true);
            });
        });

        // Countdown timer
        let timeLeft = duration / 1000;
        const countdown = setInterval(() => {
            timeLeft--;
            document.getElementById('vote-countdown').textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdown);
                this.closeVoteUI();
            }
        }, 1000);

        // Listen for vote updates
        this.socket.on(`vote_update_${eventId}`, (results) => {
            this.updateVoteResults(results);
        });
    }

    submitVote(eventId, optionIndex) {
        this.socket.emit('submit_vote', { eventId, option: optionIndex, playerId: gameData.playerName });
    }

    updateVoteResults(results) {
        results.forEach((count, index) => {
            const countSpan = document.querySelector(`[data-option="${index}"] .vote-count`);
            if (countSpan) countSpan.textContent = `(${count})`;
        });
    }

    closeVoteUI() {
        const container = document.getElementById('vote-container');
        if (container) container.remove();
    }

    // COIN RAIN EVENT
    handleCoinRain(data) {
        const { eventId, duration = 10000, coinValue = 50 } = data;
        
        this.createEventNotification(
            eventId,
            '🌧️ Lluvia de Monedas',
            `¡Recoge las monedas doradas! +${coinValue} monedas cada una`,
            duration,
            'coin-rain'
        );
        this.startCoinRain(eventId, duration, coinValue);
    }

    startCoinRain(eventId, duration, coinValue) {
        this.activeEvents.set(eventId, { type: 'coin_rain', active: true });
        const coins = [];
        
        // Spawn coins every 500ms
        const spawnInterval = setInterval(() => {
            if (!this.activeEvents.get(eventId)?.active) {
                clearInterval(spawnInterval);
                return;
            }
            
            const coin = this.createCoin(coinValue);
            coins.push(coin);
        }, 500);

        // Stop spawning after duration
        setTimeout(() => {
            clearInterval(spawnInterval);
            this.activeEvents.delete(eventId);
            
            // Warning at 10 seconds
            setTimeout(() => {
                this.showNotification('⚠️ Las monedas desaparecerán en 5 segundos', 'warning');
            }, 10000);
            
            // Remove remaining coins after 15 seconds total
            setTimeout(() => {
                coins.forEach(coin => {
                    if (coin.active) {
                        coin.destroy();
                    }
                });
            }, 15000);
        }, duration);
    }

    createCoin(value) {
        const x = Phaser.Math.Between(50, game.config.width - 50);
        const y = Phaser.Math.Between(50, game.config.height - 50);
        
        const coin = game.scene.scenes[0].add.circle(x, y, 15, 0xFFD700);
        coin.setInteractive();
        coin.coinValue = value;
        coin.active = true;
        
        coin.on('pointerdown', () => {
            if (coin.active) {
                window.stateManager.addMoney(value);
                this.showNotification(`+${value} monedas`, 'success');
                coin.destroy();
                coin.active = false;
            }
        });
        
        return coin;
    }

    // CRITICAL MADNESS EVENT
    handleCriticalMadness(data) {
        const { eventId, duration = 300000 } = data; // 5 minutes
        
        this.createEventNotification(
            eventId,
            '⚡ Critical Madness',
            'Entra al arena para obtener 100% probabilidad crítica',
            duration,
            'critical'
        );
        this.startCriticalMadness(eventId, duration);
    }

    startCriticalMadness(eventId, duration) {
        this.activeEvents.set(eventId, { 
            type: 'critical_madness', 
            active: true, 
            used: false 
        });
    }

    endCriticalMadness(eventId) {
        this.activeEvents.delete(eventId);
        this.showNotification('⚡ Critical Madness terminado', 'info');
    }

    // SPEED CHALLENGE EVENT
    handleSpeedChallenge(data) {
        const { eventId, duration = 180000, speedMultiplier = 2 } = data; // 3 minutes
        
        this.createEventNotification(
            eventId,
            '🏃 Speed Challenge',
            `Velocidad aumentada x${speedMultiplier}. ¡Muévete más rápido!`,
            duration,
            'speed'
        );
        this.startSpeedChallenge(eventId, duration, speedMultiplier);
    }

    startSpeedChallenge(eventId, duration, speedMultiplier) {
        this.activeEvents.set(eventId, { 
            type: 'speed_challenge', 
            active: true,
            originalSpeed: gameData.stats.speed
        });
        
        // Apply speed boost
        gameData.stats.speed *= speedMultiplier;
    }

    endSpeedChallenge(eventId) {
        const event = this.activeEvents.get(eventId);
        if (event) {
            gameData.stats.speed = event.originalSpeed;
        }
        this.activeEvents.delete(eventId);
        this.showNotification('🏃 Speed Challenge terminado', 'info');
    }

    // UTILITY METHODS
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 4000);
    }

    // EVENT NOTIFICATION SYSTEM
    createEventNotification(eventId, title, description, duration = null, type = 'info') {
        // Remove existing notification
        this.removeEventNotification();
        
        const container = document.createElement('div');
        container.id = 'event-notification';
        container.className = `event-notification ${type}`;
        
        container.innerHTML = `
            <div class="event-content">
                <div class="event-header">
                    <h3>${title}</h3>
                    <button class="hide-btn" onclick="window.webSocketManager.hideEventNotification()">−</button>
                </div>
                <p>${description}</p>
                ${duration ? `<div class="progress-container">
                    <div class="progress-bar" id="event-progress"></div>
                    <span class="time-left" id="event-time"></span>
                </div>` : ''}
            </div>
        `;
        
        document.body.appendChild(container);
        
        // Start progress bar if duration provided
        if (duration) {
            this.startProgressBar(duration);
        }
        
        return container;
    }
    
    startProgressBar(duration) {
        const progressBar = document.getElementById('event-progress');
        const timeDisplay = document.getElementById('event-time');
        
        if (!progressBar || !timeDisplay) return;
        
        let timeLeft = duration / 1000;
        const totalTime = timeLeft;
        
        const updateProgress = () => {
            const percentage = (timeLeft / totalTime) * 100;
            progressBar.style.width = `${percentage}%`;
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = Math.floor(timeLeft % 60);
            timeDisplay.textContent = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
            
            timeLeft--;
            
            if (timeLeft < 0) {
                this.removeEventNotification();
            } else {
                setTimeout(updateProgress, 1000);
            }
        };
        
        updateProgress();
    }
    
    hideEventNotification() {
        const notification = document.getElementById('event-notification');
        if (notification) {
            notification.classList.add('hidden');
            
            // Create minimized arrow
            const arrow = document.createElement('div');
            arrow.id = 'event-arrow';
            arrow.className = 'event-arrow';
            arrow.innerHTML = '▼';
            arrow.onclick = () => this.showEventNotification();
            document.body.appendChild(arrow);
        }
    }
    
    showEventNotification() {
        const notification = document.getElementById('event-notification');
        const arrow = document.getElementById('event-arrow');
        
        if (notification) {
            notification.classList.remove('hidden');
        }
        if (arrow) {
            arrow.remove();
        }
    }
    
    removeEventNotification() {
        const notification = document.getElementById('event-notification');
        const arrow = document.getElementById('event-arrow');
        
        if (notification) notification.remove();
        if (arrow) arrow.remove();
    }

    // Check if event is active (for arena integration)
    isEventActive(eventType) {
        for (let [id, event] of this.activeEvents) {
            if (event.type === eventType && event.active) {
                return event;
            }
        }
        return null;
    }

    // Use critical madness (call from arena)
    useCriticalMadness() {
        for (let [id, event] of this.activeEvents) {
            if (event.type === 'critical_madness' && event.active && !event.used) {
                event.used = true;
                this.showNotification('⚡ Critical Madness aplicado - 100% crítico en combate', 'success');
                return true;
            }
        }
        return false;
    }
}

// Global instance
window.webSocketManager = new WebSocketManager();