# Mini Tycoon Game

A 2D pixel art tycoon game designed to encourage Twitch chat engagement.

## Features

- **Character Movement**: WASD/Arrow keys to move in all directions
- **Economy System**: Passive money generation (1 coin/5s) + Twitch chat earnings (10 coins/message)
- **4 Buildings**: Store, Upgrades, Decoration, Arena (each in corners)
- **Settings Menu**: ESC key to access volume, streamer settings, save game
- **Twitch Integration**: Real-time chat monitoring with anti-spam protection
- **Profile Setup**: Mandatory player name + optional streamer selection
- **Cloud Save System**: Firebase Firestore database with localStorage fallback
- **Inventory System**: Persistent right-side inventory with C key toggle
- **Debug Console**: Konami Code (WWSSADAD+Enter) for comprehensive debugging

## Setup

1. **Copy configuration file**: `cp js/config.template.js js/config.js`
2. **Edit config.js** with your Firebase and Twitch credentials
3. **Never commit config.js** to version control (already in .gitignore)

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
✅ Cloud save system with Firebase Firestore
✅ Automatic data synchronization across devices
✅ Upgrades system with 10-tier progression
✅ Character upgrade mechanics (speed, income, chat bonus)
✅ Profile deletion functionality
✅ Decoration placement system with inventory integration
✅ Persistent inventory system with C key toggle
✅ Debug console with Konami Code activation
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
- Persistent inventory saved to cloud database
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

## Inventory System

**Persistent Right-Side Inventory:**
- **2x6 Grid Layout**: 12 slots for equipment and decorations
- **C Key Toggle**: Show/hide inventory with C key
- **Equipment Display**: Swords (⚔️) and shields (🛡️) with tier indicators
- **Decoration Items**: Tables (🪑), plants (🌱), trophies (🏆)
- **Health Potions**: Instant use potions (🧪) with click consumption
- **Placement Mode**: Click decorations to enter placement mode
- **Visual Feedback**: Item counts and tier levels displayed
- **Cloud Storage**: Inventory state synchronized across devices

## Debug Console

**Konami Code Activation (WWSSADAD+Enter):**
- **Stat Modification**: Buttons for money, health, equipment tiers
- **Inventory Management**: Add/remove decorations and potions
- **Upgrade Controls**: Modify all upgrade tiers instantly
- **Browser Console**: Direct access to gameData object
- **Visual Interface**: Clean button layout with organized sections
- **Development Tool**: Hidden from normal gameplay

## UI Design

**Immersive Character-Based Interface:**
- 🪙 **Coin icon** with money count (top-left)
- **Player name** displayed above character
- **Health bar** under character with color coding (green/yellow/red)
- **Twitch profile** with streamer info (top-right)
- **Inventory panel** with C key toggle (right-side)
- **Minimal HUD** for clean gameplay experience
- **Dynamic elements** that follow player movement

## Database Security

**Firebase Security Rules:**
- **Player validation**: Names must be 3-20 alphanumeric characters only
- **Data consistency**: playerName must match document ID
- **Read permissions**: Players can read their own data
- **Write permissions**: Players can only write to their own documents
- **Secure by default**: No public access to sensitive data

## Next Steps

1. Develop arena/fighting system with automated combat
2. Add user authentication for enhanced security
3. Add more Twitch integration features (followers, subs, etc.)
4. Implement visual equipment sprites and animations
5. Add more decoration types and furniture options
6. Create achievement system with unlock rewards
7. Add multiplayer features with real-time synchronization

## Cloud Save System

**Firebase Firestore Integration:**
- **Real-time sync**: Automatic cloud synchronization
- **Cross-device play**: Access your progress anywhere
- **Secure storage**: Player data protected with validation rules
- **Offline support**: localStorage fallback when offline
- **Data validation**: Player names must be 3-20 alphanumeric characters
- **Debounced saves**: Optimized saving to prevent spam

**Save Features:**
- **Instant sync**: Changes saved to cloud within 1 second
- **Automatic fallback**: Uses localStorage if Firebase unavailable
- **Data sanitization**: Clean data format for reliable storage
- **Connection status**: Visual indicators for online/offline state
- **Player validation**: Secure player name format enforcement

**Save Triggers:**
- Equipment purchases and upgrades
- Money earning and spending
- Settings and profile changes
- Health and stat modifications
- Inventory and decoration changes

## Controls

**Movement:**
- **WASD** or **Arrow Keys**: Move character in all directions

**Interface:**
- **C Key**: Toggle inventory visibility
- **ESC Key**: Open settings menu
- **Mouse Click**: Interact with buildings and UI elements
- **Walk Into Buildings**: Alternative interaction method

**Debug:**
- **Konami Code** (WWSSADAD+Enter): Open debug console

## Technical Details

- **Frontend**: Phaser.js 3.70.0 for 2D game engine
- **Database**: Firebase Firestore with localStorage fallback
- **Twitch**: WebSocket connection to Twitch IRC (wss://irc-ws.chat.twitch.tv:443)
- **UI System**: Immersive character-attached interface elements
- **Assets**: Simple colored rectangles as placeholder sprites
- **Architecture**: Modular JavaScript classes for easy expansion
- **Cloud Storage**: Firebase Firestore with real-time synchronization
- **Profile Pictures**: Framework ready for Twitch API integration
- **Sprites**: Generated using [PixelLab.ai](https://www.pixellab.ai/)
- **Inventory**: Persistent 2x6 grid system with item management
- **Debug Tools**: Konami Code activation with comprehensive controls