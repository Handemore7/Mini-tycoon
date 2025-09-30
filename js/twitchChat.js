class TwitchChat {
    constructor(scene) {
        this.scene = scene;
        this.socket = null;
        this.connected = false;
        this.streamer = gameData.twitchStreamer;
        this.playerName = gameData.playerName.toLowerCase();
        this.lastMessageTime = 0;
        this.messageCount = 0;
        
        if (this.streamer && this.streamer !== '') {
            this.connect();
        }
    }

    connect() {
        try {
            this.socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
            
            this.socket.onopen = () => {
                this.socket.send('PASS SCHMOOPIIE');
                this.socket.send('NICK justinfan12345');
                this.socket.send(`JOIN #${this.streamer.toLowerCase()}`);
                this.connected = true;
                this.showConnectionStatus('Connected to Twitch chat!', '#00ff00');
            };

            this.socket.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.socket.onclose = () => {
                this.connected = false;
                this.showConnectionStatus('Disconnected from Twitch', '#ff0000');
            };

            this.socket.onerror = () => {
                this.connected = false;
                this.showConnectionStatus('Failed to connect to Twitch', '#ff0000');
            };
        } catch (error) {
            this.showConnectionStatus('Twitch connection error', '#ff0000');
        }
    }

    handleMessage(data) {
        if (data.includes('PING')) {
            this.socket.send('PONG :tmi.twitch.tv');
            return;
        }

        // Parse chat message
        const messageMatch = data.match(/:(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG #\w+ :(.+)/);
        if (messageMatch) {
            const username = messageMatch[1].toLowerCase();
            const message = messageMatch[2];
            
            // Check if message is from our player
            if (username === this.playerName) {
                this.rewardPlayer();
            }
        }
    }

    rewardPlayer() {
        const now = Date.now();
        // Prevent spam (max 1 reward per 2 seconds)
        if (now - this.lastMessageTime < 2000) {
            this.showSpamWarning();
            return;
        }
        
        this.lastMessageTime = now;
        this.messageCount++;
        
        const reward = gameData.chatBonus || 10;
        gameData.addMoney(reward);
        this.showChatReward(reward);
    }

    showChatReward(amount = 10) {
        // Create floating text for chat reward
        const x = this.scene.player.x;
        const y = this.scene.player.y - 30;
        
        const rewardText = this.scene.add.text(x, y, `+${amount} coins (Chat)`, {
            fontSize: '14px',
            fill: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Animate the text
        this.scene.tweens.add({
            targets: rewardText,
            y: y - 40,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => rewardText.destroy()
        });
    }

    showSpamWarning() {
        // Create floating error text for spam attempt
        const x = this.scene.player.x;
        const y = this.scene.player.y - 30;
        
        const warningText = this.scene.add.text(x, y, 'Too fast! Wait 2s', {
            fontSize: '12px',
            fill: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        // Animate the warning text
        this.scene.tweens.add({
            targets: warningText,
            y: y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => warningText.destroy()
        });
    }

    showConnectionStatus(message, color) {
        if (this.scene.connectionStatus) {
            this.scene.connectionStatus.destroy();
        }
        
        this.scene.connectionStatus = this.scene.add.text(400, 50, message, {
            fontSize: '12px',
            fill: color,
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);

        // Auto-hide after 3 seconds
        this.scene.time.delayedCall(3000, () => {
            if (this.scene.connectionStatus) {
                this.scene.connectionStatus.destroy();
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    updateStreamer(newStreamer) {
        this.disconnect();
        this.streamer = newStreamer;
        if (this.streamer && this.streamer !== '') {
            this.connect();
        }
    }
}