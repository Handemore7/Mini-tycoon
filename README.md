# Mini Tycoon Game

A 2D pixel art tycoon game designed to encourage Twitch chat engagement.

## Features

- **Character Movement**: WASD/Arrow keys to move in all directions
- **Economy System**: Passive money generation (1 coin/5s) + Twitch chat earnings (10 coins/message)
- **4 Buildings**: Store, Upgrades, Decoration, Arena (each in corners)
- **Settings Menu**: ESC key to access volume, streamer settings, save game
- **Twitch Integration**: Real-time chat monitoring with anti-spam protection
- **Profile Setup**: Mandatory player name + optional streamer selection
- **Auto-Save System**: Enhanced save system with backups and export functionality

## How to Play

1. Open `index.html` in a web browser
2. Enter your player name (required) and Twitch streamer (optional)
3. Use WASD or arrow keys to move your character
4. Chat in the selected Twitch channel to earn 10 coins per message
5. Walk into buildings to interact with them (or click them)
6. Press ESC to open settings menu
7. Earn money passively (1 coin every 5 seconds)
8. Buy equipment and items from the store to improve your character

## Twitch Integration

- **Setup**: Enter your exact Twitch username as player name
- **Streamer**: Choose which Twitch channel to monitor (defaults to your_streamer_name)
- **Rewards**: Earn 10 coins for each chat message you send
- **Anti-Spam**: 2-second cooldown between rewards to prevent abuse
- **Feedback**: Visual notifications for successful rewards and spam attempts
- **Connection**: Real-time WebSocket connection to Twitch IRC

## Buildings

- **Store** (Top-left): Buy tiered equipment and health potions
  - Swords: Wooden → Stone → Gold → Iron → Diamond (5 tiers)
  - Shields: Wooden → Stone → Gold → Iron → Diamond (5 tiers) 
  - Health Potions: Instant healing for $25
- **Upgrades** (Top-right): Character improvements with 10 tiers each
  - Speed Boots: Increases movement speed (+20 per tier)
  - Passive Income: Increases coins per 5 seconds (+1 per tier)
  - Chat Bonus: Increases coins per chat message (+5 per tier)
- **Decoration** (Bottom-left): Buy and place furniture - Coming Soon
- **Arena** (Bottom-right): Fight other players - Coming Soon

## Current Status

✅ Basic game structure
✅ Player movement and stats
✅ Building system with collision detection
✅ Touch/walk interaction with buildings
✅ Settings menu with save/load
✅ Immersive UI with character-attached elements
✅ Mandatory player name setup
✅ Twitch chat integration
✅ Real-time chat monitoring
✅ Anti-spam protection with visual feedback
✅ Store implementation with tiered equipment system
✅ Equipment progression (5 tiers for swords and shields)
✅ Health potion system
✅ Purchase feedback and inventory management
✅ Enhanced auto-save system with backups
✅ Save export functionality
✅ Upgrades system with 10-tier progression
✅ Character upgrade mechanics (speed, income, chat bonus)
✅ Profile deletion functionality
⏳ Decoration placement
⏳ Arena/fighting system

## Store System

**Equipment Tiers & Pricing:**
- **Swords**: $50, $150, $400, $800, $1500 (Damage: +5, +12, +25, +40, +60)
- **Shields**: $40, $120, $350, $700, $1300 (Armor: +3, +8, +18, +30, +50)
- **Health Potions**: $25 (Restores 50 HP instantly)

**Features:**
- Progressive tier system with increasing stats and costs
- Visual feedback for purchases and insufficient funds
- Equipment display in UI showing current gear
- Persistent inventory saved to localStorage
- Anti-spam interaction system with cooldowns

## Upgrades System

**Three Upgrade Types (10 tiers each):**
- **Speed Boots**: $100 base cost, 1.5x multiplier (+20 movement speed per tier)
- **Passive Income**: $200 base cost, 2.0x multiplier (+1 coin per 5s per tier)
- **Chat Bonus**: $150 base cost, 1.8x multiplier (+5 coins per message per tier)

**Features:**
- Exponential pricing system with increasing costs
- Real-time stat application
- Visual tier progression display
- MAX tier indication when fully upgraded

## UI Design

**Immersive Character-Based Interface:**
- 🪙 **Coin icon** with money count (top-left)
- **Player name** displayed above character
- **Health bar** under character with color coding (green/yellow/red)
- **Twitch profile** with streamer info (top-right)
- **Minimal HUD** for clean gameplay experience
- **Dynamic elements** that follow player movement

## Next Steps

1. Create decoration placement and management system
2. Develop arena/fighting system with automated combat
3. Add real Twitch profile picture integration
4. Add more Twitch integration features (followers, subs, etc.)
5. Implement visual equipment sprites and animations

## Save System

**Auto-Save Features:**
- **Every 10 seconds**: Automatic background saving
- **On all actions**: Money changes, purchases, stat updates
- **Browser close**: Saves when closing tab/window
- **3 Backup slots**: Rotating backups prevent data loss
- **Export/Import**: Download save files for manual backup
- **Fallback loading**: Tries backups if main save fails

**Save Triggers:**
- Equipment purchases and upgrades
- Money earning and spending
- Settings and profile changes
- Health and stat modifications
- Periodic auto-save timer

## Technical Details

- **Frontend**: Phaser.js 3.70.0 for 2D game engine
- **Storage**: Enhanced localStorage with backup system
- **Twitch**: WebSocket connection to Twitch IRC (wss://irc-ws.chat.twitch.tv:443)
- **UI System**: Immersive character-attached interface elements
- **Assets**: Simple colored rectangles as placeholder sprites
- **Architecture**: Modular JavaScript classes for easy expansion
- **Save System**: Multi-layered persistence with error handling
- **Profile Pictures**: Framework ready for Twitch API integration
- **Sprites**: Generated using [PixelLab.ai](https://www.pixellab.ai/)