# WebSocket Server Deployment Guide

## 🚀 Deploy to Heroku (Free)

### 1. Install Heroku CLI
```bash
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Prepare for Deployment
```bash
cd "d:\Personal\Mini tycoon"

# Create Procfile
echo "web: node server.js" > Procfile

# Initialize git (if not already)
git init
git add .
git commit -m "Initial WebSocket server"
```

### 3. Deploy to Heroku
```bash
# Login to Heroku
heroku login

# Create app
heroku create your-mini-tycoon-server

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### 4. Update WebSocket URL
Replace in `js/websocket/WebSocketManager.js`:
```javascript
: 'https://your-mini-tycoon-server.herokuapp.com';
```

## 🔧 Alternative: Railway

### 1. Go to railway.app
### 2. Connect GitHub repo
### 3. Deploy automatically
### 4. Get URL and update WebSocketManager.js

## 🔧 Alternative: Render

### 1. Go to render.com
### 2. New Web Service
### 3. Connect repo
### 4. Build: `npm install`
### 5. Start: `npm start`

## ⚠️ Important Notes

- **GitHub Pages**: Only static files, no Node.js server
- **CORS**: Server already configured for production
- **Environment**: Auto-detects localhost vs production
- **Fallback**: Game works without WebSocket (events just won't trigger)

## 🧪 Test Production

1. Deploy server to hosting service
2. Update WebSocket URL in code
3. Push to GitHub Pages
4. Test events in production