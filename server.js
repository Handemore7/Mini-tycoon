// Simple Socket.IO server for WebSocket events
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Store active votes
const activeVotes = new Map();
const connectedPlayers = new Set();

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    connectedPlayers.add(socket.id);

    // Handle vote submission
    socket.on('submit_vote', (data) => {
        const { eventId, option, playerId } = data;
        const vote = activeVotes.get(eventId);
        
        if (vote && !vote.voters.has(playerId)) {
            vote.voters.add(playerId);
            vote.results[option] = (vote.results[option] || 0) + 1;
            
            // Broadcast updated results
            io.emit(`vote_update_${eventId}`, vote.results);
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        connectedPlayers.delete(socket.id);
    });
});

// Event triggers (for testing)
app.post('/trigger-event', (req, res) => {
    const { type, data } = req.body;
    
    switch (type) {
        case 'server_vote':
            triggerServerVote(data);
            break;
        case 'coin_rain':
            triggerCoinRain(data);
            break;
        case 'critical_madness':
            triggerCriticalMadness(data);
            break;
        case 'speed_challenge':
            triggerSpeedChallenge(data);
            break;
        default:
            return res.status(400).json({ error: 'Unknown event type' });
    }
    
    res.json({ success: true, message: `${type} event triggered` });
});

function triggerServerVote(data = {}) {
    const eventId = `vote_${Date.now()}`;
    const voteData = {
        eventId,
        question: data.question || "¿Cuál debería ser el próximo evento?",
        options: data.options || [
            { name: "Coin Rain" },
            { name: "Speed Challenge" },
            { name: "Critical Madness" }
        ],
        duration: data.duration || 20000
    };
    
    // Store vote
    activeVotes.set(eventId, {
        ...voteData,
        voters: new Set(),
        results: new Array(voteData.options.length).fill(0)
    });
    
    // Broadcast to all clients
    io.emit('server_vote', voteData);
    
    // Clean up after vote ends
    setTimeout(() => {
        const vote = activeVotes.get(eventId);
        if (vote) {
            console.log(`Vote ${eventId} results:`, vote.results);
            activeVotes.delete(eventId);
        }
    }, voteData.duration + 1000);
}

function triggerCoinRain(data = {}) {
    const eventId = `coin_rain_${Date.now()}`;
    const coinRainData = {
        eventId,
        duration: data.duration || 10000,
        coinValue: data.coinValue || 50
    };
    
    io.emit('coin_rain', coinRainData);
}

function triggerCriticalMadness(data = {}) {
    const eventId = `critical_madness_${Date.now()}`;
    const criticalData = {
        eventId,
        duration: data.duration || 300000 // 5 minutes
    };
    
    io.emit('critical_madness', criticalData);
}

function triggerSpeedChallenge(data = {}) {
    const eventId = `speed_challenge_${Date.now()}`;
    const speedData = {
        eventId,
        duration: data.duration || 180000, // 3 minutes
        speedMultiplier: data.speedMultiplier || 2
    };
    
    io.emit('speed_challenge', speedData);
}

// Auto-trigger random events every 2 minutes (for demo)
setInterval(() => {
    const events = ['coin_rain', 'speed_challenge', 'critical_madness'];
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    console.log(`Auto-triggering: ${randomEvent}`);
    
    switch (randomEvent) {
        case 'coin_rain':
            triggerCoinRain();
            break;
        case 'speed_challenge':
            triggerSpeedChallenge();
            break;
        case 'critical_madness':
            triggerCriticalMadness();
            break;
    }
}, 120000); // 2 minutes

// Trigger vote every 5 minutes
setInterval(() => {
    console.log('Auto-triggering: server_vote');
    triggerServerVote();
}, 300000); // 5 minutes

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 WebSocket server running on port ${PORT}`);
    console.log(`📡 Socket.IO endpoint: http://localhost:${PORT}`);
    console.log(`🎮 Trigger events: POST http://localhost:${PORT}/trigger-event`);
});

module.exports = { app, server, io };