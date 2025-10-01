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

// Store active events and votes
const activeEvents = new Map();
const activeVotes = new Map();
const connectedPlayers = new Set();

io.on('connection', (socket) => {
    console.log('👥 Player connected:', socket.id, '| Total players:', connectedPlayers.size + 1);
    connectedPlayers.add(socket.id);
    
    // Send current active events to new player
    socket.on('request_active_events', () => {
        console.log('🔍 Server: Active events request from', socket.id);
        console.log('🔍 Server: Total stored events:', activeEvents.size);
        
        const currentEvents = Array.from(activeEvents.values());
        const validEvents = currentEvents.filter(event => {
            const timeLeft = event.endTime - Date.now();
            const isValid = timeLeft > 5000; // At least 5 seconds left
            console.log(`  - ${event.type} (${event.eventId}): ${Math.ceil(timeLeft/1000)}s remaining - ${isValid ? 'VALID' : 'EXPIRED'}`);
            return isValid;
        });
        
        console.log('📫 Server: Sending', validEvents.length, 'valid events to', socket.id);
        socket.emit('active_events', validEvents);
    });

    // Handle vote submission
    socket.on('submit_vote', (data) => {
        const { eventId, option, playerId } = data;
        
        // Validate input
        if (!eventId || typeof option !== 'number' || !playerId || typeof playerId !== 'string') {
            console.log('❌ Server: Invalid vote data received');
            return;
        }
        
        // Sanitize playerId
        const sanitizedPlayerId = playerId.replace(/[<>"'&]/g, '');
        
        console.log('🗳️ Server: Vote received from', sanitizedPlayerId, 'for option', option, 'in event', eventId);
        
        const vote = activeVotes.get(eventId);
        
        if (vote && !vote.voters.has(sanitizedPlayerId)) {
            vote.voters.add(sanitizedPlayerId);
            vote.results[option] = (vote.results[option] || 0) + 1;
            
            console.log('✅ Server: Vote counted. New results:', vote.results);
            
            // Broadcast updated results to all players
            io.emit('vote_update', { eventId, results: vote.results });
            console.log('📊 Server: Broadcasting vote update to all players');
        } else if (vote && vote.voters.has(sanitizedPlayerId)) {
            console.log('❌ Server: Player', sanitizedPlayerId, 'already voted in', eventId);
        } else {
            console.log('❌ Server: Vote not found:', eventId);
        }
    });

    socket.on('disconnect', () => {
        console.log('👥 Player disconnected:', socket.id, '| Total players:', connectedPlayers.size - 1);
        connectedPlayers.delete(socket.id);
    });
});

// Event triggers (for testing)
app.post('/trigger-event', (req, res) => {
    // Basic CSRF protection - check origin
    const origin = req.get('Origin');
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:8080', 'https://yourdomain.com'];
    
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Forbidden origin' });
    }
    
    const { type, data } = req.body;
    
    // Validate input
    if (!type || typeof type !== 'string') {
        return res.status(400).json({ error: 'Invalid event type' });
    }
    
    // Check for overlapping events (except for manual debug triggers)
    if (hasActiveEvents()) {
        return res.status(409).json({ 
            error: 'Event overlap prevented', 
            message: 'Another event is currently active' 
        });
    }
    
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
    const duration = data.duration || 60000; // 1 minute
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    console.log('🗳️ Server: Triggering server vote', eventId, 'for', duration/1000, 'seconds');
    
    const voteData = {
        eventId,
        type: 'server_vote',
        question: data.question || "¿Cuál debería ser el próximo evento?",
        options: data.options || [
            { name: "Coin Rain" },
            { name: "Speed Challenge" },
            { name: "Critical Madness" }
        ],
        duration,
        startTime,
        endTime,
        results: new Array(3).fill(0)
    };
    
    // Store in both maps
    activeEvents.set(eventId, voteData);
    activeVotes.set(eventId, {
        ...voteData,
        voters: new Set(),
        results: new Array(voteData.options.length).fill(0)
    });
    console.log('✅ Server: Stored vote event. Active events now:', activeEvents.size);
    
    // Broadcast to all clients
    console.log('📫 Server: Broadcasting server_vote to', connectedPlayers.size, 'players');
    io.emit('server_vote', voteData);
    
    // Clean up after vote ends
    setTimeout(() => {
        const vote = activeVotes.get(eventId);
        if (vote) {
            console.log(`Vote ${eventId} results:`, vote.results);
            activeVotes.delete(eventId);
            activeEvents.delete(eventId);
        }
    }, duration + 1000);
}

function triggerCoinRain(data = {}) {
    const eventId = `coin_rain_${Date.now()}`;
    const duration = data.duration || 10000;
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    console.log('🌧️ Server: Triggering coin rain', eventId, 'for', duration/1000, 'seconds');
    
    const coinRainData = {
        eventId,
        type: 'coin_rain',
        duration,
        coinValue: data.coinValue || 50,
        startTime,
        endTime
    };
    
    // Store active event
    activeEvents.set(eventId, coinRainData);
    console.log('✅ Server: Stored coin rain event. Active events now:', activeEvents.size);
    
    console.log('📫 Server: Broadcasting coin_rain to', connectedPlayers.size, 'players');
    io.emit('coin_rain', coinRainData);
    
    // Clean up after event ends
    setTimeout(() => {
        activeEvents.delete(eventId);
    }, duration + 5000); // Extra 5s for coin cleanup
}

function triggerCriticalMadness(data = {}) {
    const eventId = `critical_madness_${Date.now()}`;
    const duration = data.duration || 120000; // 2 minutes
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    console.log('⚡ Server: Triggering critical madness', eventId, 'for', duration/60000, 'minutes');
    
    const criticalData = {
        eventId,
        type: 'critical_madness',
        duration,
        startTime,
        endTime
    };
    
    // Store active event
    activeEvents.set(eventId, criticalData);
    console.log('✅ Server: Stored critical madness event. Active events now:', activeEvents.size);
    
    console.log('📫 Server: Broadcasting critical_madness to', connectedPlayers.size, 'players');
    io.emit('critical_madness', criticalData);
    
    // Clean up after event ends
    setTimeout(() => {
        activeEvents.delete(eventId);
    }, duration + 1000);
}

function triggerSpeedChallenge(data = {}) {
    const eventId = `speed_challenge_${Date.now()}`;
    const duration = data.duration || 180000; // 3 minutes
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    console.log('🏃 Server: Triggering speed challenge', eventId, 'for', duration/60000, 'minutes');
    
    const speedData = {
        eventId,
        type: 'speed_challenge',
        duration,
        speedMultiplier: data.speedMultiplier || 2,
        startTime,
        endTime
    };
    
    // Store active event
    activeEvents.set(eventId, speedData);
    console.log('✅ Server: Stored speed challenge event. Active events now:', activeEvents.size);
    
    console.log('📫 Server: Broadcasting speed_challenge to', connectedPlayers.size, 'players');
    io.emit('speed_challenge', speedData);
    
    // Clean up after event ends
    setTimeout(() => {
        activeEvents.delete(eventId);
    }, duration + 1000);
}

// Check if any events are currently active
function hasActiveEvents() {
    const now = Date.now();
    for (let event of activeEvents.values()) {
        if (event.endTime > now) {
            console.log(`🚫 Event overlap prevented: ${event.type} still active`);
            return true;
        }
    }
    return false;
}

// Weighted random event selection
function selectRandomEvent() {
    const eventWeights = [
        { type: 'server_vote', weight: 40 },
        { type: 'coin_rain', weight: 20 },
        { type: 'speed_challenge', weight: 20 },
        { type: 'critical_madness', weight: 20 }
    ];
    
    const totalWeight = eventWeights.reduce((sum, event) => sum + event.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (let event of eventWeights) {
        currentWeight += event.weight;
        if (random <= currentWeight) {
            return event.type;
        }
    }
    
    return 'server_vote'; // fallback
}

// Auto-trigger events every 3 minutes with overlap prevention
setInterval(() => {
    // Don't trigger if events are already active
    if (hasActiveEvents()) {
        console.log('⏳ Skipping event trigger - events still active');
        return;
    }
    
    const selectedEvent = selectRandomEvent();
    console.log(`🎲 Auto-triggering: ${selectedEvent}`);
    
    switch (selectedEvent) {
        case 'server_vote':
            triggerServerVote();
            break;
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
}, 180000); // 3 minutes

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 WebSocket server running on port ${PORT}`);
    console.log(`📡 Socket.IO endpoint: http://localhost:${PORT}`);
    console.log(`🎮 Trigger events: POST http://localhost:${PORT}/trigger-event`);
});

module.exports = { app, server, io };