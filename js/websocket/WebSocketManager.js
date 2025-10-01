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
                : 'https://mini-tycoon-production.up.railway.app'; // Your Railway WebSocket server
        }
        try {
            // Using Socket.IO client
            this.socket = io(serverUrl);
            console.log('🔌 WebSocket: Attempting connection to', serverUrl);
            
            this.socket.on('connect', () => {
                this.connected = true;
                console.log('✅ WebSocket: Connected to server', this.socket.id);
                this.showNotification('🌐 Conectado al servidor', 'success');
                
                // Request active events on every connection/reconnection
                console.log('📫 WebSocket: Requesting active events on connect');
                this.socket.emit('request_active_events');
            });

            this.socket.on('disconnect', () => {
                this.connected = false;
                console.log('❌ WebSocket: Disconnected from server');
                this.showNotification('❌ Desconectado del servidor', 'warning');
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket: Connection error', error);
            });
            
            this.socket.on('reconnect', (attemptNumber) => {
                console.log('🔄 WebSocket: Reconnected after', attemptNumber, 'attempts');
            });
            
            this.socket.on('reconnect_attempt', (attemptNumber) => {
                console.log('🔄 WebSocket: Reconnection attempt', attemptNumber);
            });

            // Event listeners with logging
            this.socket.on('server_vote', (data) => {
                console.log('🗳️ WebSocket: Received server_vote', data);
                this.handleServerVote(data);
            });
            this.socket.on('coin_rain', (data) => {
                console.log('🌧️ WebSocket: Received coin_rain', data);
                this.handleCoinRain(data);
            });
            this.socket.on('critical_madness', (data) => {
                console.log('⚡ WebSocket: Received critical_madness', data);
                this.handleCriticalMadness(data);
            });
            this.socket.on('speed_challenge', (data) => {
                console.log('🏃 WebSocket: Received speed_challenge', data);
                this.handleSpeedChallenge(data);
            });
            
            // Global event state listeners
            this.socket.on('active_events', (events) => {
                console.log('🌐 WebSocket: Received active_events', events);
                this.handleActiveEvents(events);
            });
            this.socket.on('vote_update', (data) => {
                console.log('📊 WebSocket: Received vote_update', data);
                this.handleGlobalVoteUpdate(data);
            });
            
            // Active events will be requested in connect handler
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
        }
    }

    setupEventHandlers() {
        // Event handlers setup
    }

    // GLOBAL EVENT STATE HANDLER
    handleActiveEvents(events) {
        console.log('🔍 WebSocket: Processing', events.length, 'active events');
        
        events.forEach(event => {
            const timeLeft = event.endTime - Date.now();
            console.log(`⏱️ WebSocket: Event ${event.type} has ${Math.ceil(timeLeft/1000)}s remaining`);
            
            // Only show events with at least 5 seconds left
            if (timeLeft >= 5000) {
                console.log(`✅ WebSocket: Showing event ${event.type} to late joiner`);
                switch (event.type) {
                    case 'server_vote':
                        this.handleServerVote({...event, duration: timeLeft});
                        break;
                    case 'coin_rain':
                        this.handleCoinRain({...event, duration: timeLeft});
                        break;
                    case 'critical_madness':
                        this.handleCriticalMadness({...event, duration: timeLeft});
                        break;
                    case 'speed_challenge':
                        this.handleSpeedChallenge({...event, duration: timeLeft});
                        break;
                }
            } else {
                console.log(`❌ WebSocket: Skipping event ${event.type} (less than 5s remaining)`);
            }
        });
    }
    
    // GLOBAL VOTE UPDATE HANDLER
    handleGlobalVoteUpdate(data) {
        const { eventId, results } = data;
        console.log(`📊 WebSocket: Updating vote results for ${eventId}:`, results);
        this.updateVoteResults(results);
    }

    // SERVER VOTE EVENT
    handleServerVote(data) {
        const { eventId, question, options, duration = 20000, results = [] } = data;
        
        this.createEventNotification(
            eventId,
            '🗳️ Votación del Servidor',
            question,
            duration,
            'vote'
        );
        this.createVoteUI(eventId, question, options, duration, results);
    }

    createVoteUI(eventId, question, options, duration, initialResults = []) {
        const voteContainer = document.createElement('div');
        voteContainer.id = 'vote-container';
        voteContainer.innerHTML = `
            <div class="vote-popup">
                <h3>🗳️ Votación del Servidor</h3>
                <p>${question}</p>
                <div class="vote-options">
                    ${options.map((option, index) => `
                        <button class="vote-btn" data-option="${index}">
                            ${option.name} <span class="vote-count">(${initialResults[index] || 0})</span>
                        </button>
                    `).join('')}
                </div>
                <div class="vote-timer">Tiempo restante: <span id="vote-countdown">${Math.ceil(duration / 1000)}</span>s</div>
            </div>
        `;
        
        document.body.appendChild(voteContainer);
        
        // Auto-minimize if in arena
        if (this.isInArena()) {
            setTimeout(() => {
                if (voteContainer && voteContainer.parentNode) {
                    voteContainer.style.display = 'none';
                }
            }, 2000); // Show for 2 seconds then hide
        }
        
        // Vote buttons
        voteContainer.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.submitVote(eventId, parseInt(btn.dataset.option));
                btn.classList.add('voted');
                voteContainer.querySelectorAll('.vote-btn').forEach(b => b.disabled = true);
            });
        });

        // Countdown timer
        let timeLeft = Math.ceil(duration / 1000);
        const countdown = setInterval(() => {
            timeLeft--;
            const countdownEl = document.getElementById('vote-countdown');
            if (countdownEl) countdownEl.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdown);
                this.closeVoteUI();
            }
        }, 1000);
    }

    submitVote(eventId, optionIndex) {
        const voteData = { eventId, option: optionIndex, playerId: gameData.playerName };
        console.log('📫 WebSocket: Submitting vote', voteData);
        this.socket.emit('submit_vote', voteData);
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
        const { eventId, duration = 10000, coinValue = 50, startTime } = data;
        
        // Calculate remaining duration if event already started
        const actualDuration = startTime ? Math.max(0, duration - (Date.now() - startTime)) : duration;
        
        if (actualDuration >= 5000) {
            this.createEventNotification(
                eventId,
                '🌧️ Lluvia de Monedas',
                `¡Recoge las monedas doradas! +${coinValue} monedas cada una`,
                actualDuration,
                'coin-rain'
            );
            this.startCoinRain(eventId, actualDuration, coinValue);
        }
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
        coin.blinkTimer = null;
        
        coin.on('pointerdown', () => {
            if (coin.active) {
                // Add money and show feedback
                if (window.stateManager) {
                    window.stateManager.addMoney(value);
                } else if (gameData) {
                    gameData.addMoney(value);
                }
                
                // Show floating text feedback
                this.showFloatingText(`+${value}`, coin.x, coin.y, '#FFD700');
                
                // Clean up
                if (coin.blinkTimer) {
                    coin.blinkTimer.destroy();
                }
                coin.destroy();
                coin.active = false;
            }
        });
        
        // Start blinking 5 seconds before disappearing (at 10s mark for 15s total)
        setTimeout(() => {
            if (coin.active) {
                this.startCoinBlinking(coin);
            }
        }, 10000);
        
        return coin;
    }
    
    startCoinBlinking(coin) {
        if (!coin.active) return;
        
        let blinkSpeed = 500; // Start slow
        let timeLeft = 5000; // 5 seconds until disappear
        
        const blink = () => {
            if (!coin.active) return;
            
            coin.setVisible(!coin.visible);
            
            // Increase blink speed as time runs out
            timeLeft -= blinkSpeed;
            if (timeLeft > 0) {
                blinkSpeed = Math.max(100, blinkSpeed - 50); // Get faster
                coin.blinkTimer = game.scene.scenes[0].time.delayedCall(blinkSpeed, blink);
            }
        };
        
        coin.blinkTimer = game.scene.scenes[0].time.delayedCall(blinkSpeed, blink);
    }
    
    showFloatingText(text, x, y, color) {
        const floatingText = game.scene.scenes[0].add.text(x, y, text, {
            fontSize: '16px',
            fill: color,
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Animate floating up and fade out
        game.scene.scenes[0].tweens.add({
            targets: floatingText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => floatingText.destroy()
        });
    }

    // CRITICAL MADNESS EVENT
    handleCriticalMadness(data) {
        const { eventId, duration = 300000, startTime } = data; // 5 minutes
        
        // Calculate remaining duration if event already started
        const actualDuration = startTime ? Math.max(0, duration - (Date.now() - startTime)) : duration;
        
        if (actualDuration >= 5000) {
            this.createEventNotification(
                eventId,
                '⚡ Critical Madness',
                'Entra al arena para obtener 100% probabilidad crítica',
                actualDuration,
                'critical'
            );
            this.startCriticalMadness(eventId, actualDuration);
        }
    }

    startCriticalMadness(eventId, duration) {
        this.activeEvents.set(eventId, { 
            type: 'critical_madness', 
            active: true, 
            used: false 
        });
        
        // Set global flag for arena to detect
        window.criticalMadnessActive = true;
        console.log('⚡ WebSocket: Critical Madness activated globally');
    }

    endCriticalMadness(eventId) {
        this.activeEvents.delete(eventId);
        window.criticalMadnessActive = false;
        console.log('⚡ WebSocket: Critical Madness deactivated globally');
        this.showNotification('⚡ Critical Madness terminado', 'info');
    }

    // SPEED CHALLENGE EVENT
    handleSpeedChallenge(data) {
        const { eventId, duration = 180000, speedMultiplier = 2, startTime } = data; // 3 minutes
        
        // Calculate remaining duration if event already started
        const actualDuration = startTime ? Math.max(0, duration - (Date.now() - startTime)) : duration;
        
        if (actualDuration >= 5000) {
            this.createEventNotification(
                eventId,
                '🏃 Speed Challenge',
                `Velocidad aumentada x${speedMultiplier}. ¡Muévete más rápido!`,
                actualDuration,
                'speed'
            );
            this.startSpeedChallenge(eventId, actualDuration, speedMultiplier);
        }
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
        
        // Auto-minimize if in arena
        if (this.isInArena()) {
            setTimeout(() => this.hideEventNotification(), 2000); // Show for 2 seconds then hide
        }
        
        // Start progress bar if duration provided
        if (duration) {
            this.startProgressBar(duration);
        }
        
        return container;
    }
    
    // Check if player is currently in arena
    isInArena() {
        // Check if arena UI is visible
        const arenaUI = document.getElementById('arena-ui');
        const combatLog = document.getElementById('combat-log');
        return (arenaUI && arenaUI.style.display !== 'none') || 
               (combatLog && combatLog.style.display !== 'none');
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
                window.criticalMadnessUsed = true;
                console.log('⚡ WebSocket: Critical Madness used in arena');
                this.showNotification('⚡ Critical Madness aplicado - 80% crítico en combate', 'success');
                
                // Update notification to show (used) and minimize
                this.updateCriticalMadnessNotification();
                
                return true;
            }
        }
        return false;
    }
    
    // Update critical madness notification to show used status
    updateCriticalMadnessNotification() {
        const notification = document.getElementById('event-notification');
        if (notification) {
            const titleElement = notification.querySelector('h3');
            const descriptionElement = notification.querySelector('p');
            
            if (titleElement) {
                titleElement.textContent = '⚡ Critical Madness (USED)';
            }
            if (descriptionElement) {
                descriptionElement.textContent = 'Efecto aplicado en el arena - 80% probabilidad crítica';
            }
            
            // Auto-minimize after showing used status
            setTimeout(() => {
                this.hideEventNotification();
            }, 2000);
        }
    }
    
    // Reset critical madness when leaving arena
    resetCriticalMadness() {
        window.criticalMadnessUsed = false;
        console.log('⚡ WebSocket: Critical Madness reset (left arena)');
    }
}

// Global instance
window.webSocketManager = new WebSocketManager();