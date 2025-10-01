# Mini Tycoon Game

A 2D pixel art tycoon game designed to encourage Twitch chat engagement with modular architecture.

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
- **Modular Architecture**: Organized codebase with separated concerns

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
- **Profile Pictures**: Real Twitch avatars loaded via public APIs with fallback to generic avatars
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
- **Dungeon** (Bottom-right): D&D-style turn-based combat with 20 floors

## Current Status

✅ Basic game structure
✅ Player movement and stats
✅ Building system with collision detection
✅ Touch/walk interaction with buildings (no clicking)
✅ Settings menu with save/load
✅ Immersive UI with character-attached elements
✅ Mandatory player name setup with validation
✅ Twitch chat integration
✅ Real-time chat monitoring
✅ Anti-spam protection with visual feedback
✅ Store implementation with tiered equipment system
✅ Equipment progression (5 tiers for swords and shields)
✅ Health potion system
✅ Purchase feedback and inventory management
✅ Cloud save system with Firebase Firestore
✅ Automatic data synchronization across devices
✅ Twitch profile pictures with API integration
✅ Secure credential management for public deployment
✅ Input validation and data sanitization
✅ Cross-origin image loading with error handling
✅ Upgrades system with 10-tier progression
✅ Character upgrade mechanics (speed, income, chat bonus)
✅ Profile deletion functionality
✅ Decoration placement system with inventory integration
✅ Persistent inventory system with C key toggle
✅ Debug console with Konami Code activation
✅ Menu depth management (always on top)
✅ D&D-style turn-based dungeon system (20 floors)
✅ Boss fights with status effects (poison, wounded)
✅ Critical chance and dodge mechanics
✅ Strategic combat with potion management
✅ Smart boss AI (avoids duplicate status effects)
✅ Color-coded combat log with visual feedback system
✅ Achievement system with decoration unlocks
✅ Event-driven save system (replaces auto-save timer)
✅ Complete data deletion with Firebase integration

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
- **Individual Stat Maxing**: Separate buttons for each character stat
  - Max Health (9999 HP)
  - Max Damage (999 damage)
  - Max Armor (999 armor)
  - Max Speed (999 movement speed)
  - Max Critical Chance (100%)
  - Max Attack Speed (10x)
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
- **Twitch profile** with real profile pictures and streamer info (top-right)
- **Inventory panel** with C key toggle (right-side)
- **Minimal HUD** for clean gameplay experience
- **Dynamic elements** that follow player movement
- **Menu system** with proper depth management (always on top)
- **Touch-only building interaction** for immersive gameplay

## Database Security

**Firebase Security Rules:**
- **Player validation**: Names must be 3-20 alphanumeric characters only
- **Data consistency**: playerName must match document ID
- **Read permissions**: Players can read their own data
- **Write permissions**: Players can only write to their own documents
- **Secure by default**: No public access to sensitive data

## Twitch Profile System

**Multi-Method Profile Loading:**
- **Decapi.me API**: Primary public Twitch API proxy
- **Legacy Twitch APIs**: Kraken API fallback for older accounts
- **Direct CDN**: Twitch static CDN pattern matching
- **Generic Avatars**: Colorful letter-based avatars as final fallback
- **Cross-Origin Support**: Secure image loading with CORS handling
- **Error Resilience**: Graceful degradation if all methods fail

## Security Features

**Client-Side Security:**
- **Input validation**: Player names restricted to alphanumeric + underscore (3-20 chars)
- **Data sanitization**: All data cleaned before Firebase storage
- **XSS prevention**: No user-generated HTML content
- **API safety**: Only public APIs used, no sensitive tokens exposed

**Database Security:**
- **Firestore rules**: Server-side validation and access control
- **Player isolation**: Users can only access their own data
- **Name consistency**: playerName must match document ID
- **Rate limiting**: Natural protection via Firebase quotas

## Next Steps

1. **Enhanced Dungeon**: More status effects and boss mechanics
2. **Dungeon Leaderboards**: Global floor completion rankings
3. **More Achievements**: Additional unlock conditions and rewards
4. **Enhanced Twitch**: OAuth integration for advanced features
5. **Visual Upgrades**: Enemy sprites and combat animations
6. **Sound System**: Combat effects and background music
7. **Multiplayer Features**: Real-time player interactions
8. **Advanced Combat**: Special abilities and equipment skills

## Cloud Save System

**Firebase Firestore Integration:**
- **Real-time sync**: Automatic cloud synchronization
- **Cross-device play**: Access your progress anywhere
- **Secure storage**: Player data protected with validation rules
- **Offline support**: localStorage fallback when offline
- **Data validation**: Player names must be 3-20 alphanumeric characters
- **Debounced saves**: Optimized saving to prevent spam

**Event-Driven Saves (Improved Performance):**
- **Debounced saves**: Only saves 2 seconds after last action
- **Immediate saves**: Critical actions save instantly
- **Before unload**: Saves when browser closes
- **Reduced writes**: 90%+ fewer database operations vs. auto-save

**Save Features:**
- **Smart saving**: Only saves when data actually changes
- **Automatic fallback**: Uses localStorage if Firebase unavailable
- **Data sanitization**: Clean data format for reliable storage
- **Connection status**: Visual indicators for online/offline state
- **Player validation**: Secure player name format enforcement
- **Complete deletion**: Remove data from both Firebase and localStorage

## Dungeon System (D&D-Style Turn-Based Combat)

**20-Floor Dungeon Crawler:**
- **Turn-Based Combat**: Strategic player vs enemy alternating turns
- **Text-Based Interface**: Clean combat log showing all actions and results
- **Progressive Difficulty**: Enemies scale in power every floor (15% increase)
- **Boss Fights**: Special encounters every 5th floor (5, 10, 15, 20)
- **Death Penalty**: Keep 50% of earned coins when defeated

**Player Turn Actions:**
- **Attack**: Basic damage with critical chance system
- **Critical Attacks**: Timing mini-game for 2x damage when triggered
- **Use Potion**: Heal 50 HP (consumes turn, blocked when wounded)

**Enemy Turn Mechanics:**
- **Normal Attacks**: Standard damage with dodge opportunities
- **Dodge Events**: Press spacebar to reduce damage by 50%
- **Boss Special Attacks**: Status effects with 1-turn preparation

**Boss Fight System:**
- **Mixed Combat**: Bosses use both normal and special attacks
- **Special Attack Preparation**: Bosses announce special attacks 1 turn ahead
- **Smart Targeting**: Bosses won't use status effects player already has
- **Status Effects**: Poison (3 damage/turn) and Wounded (blocks potions)

**Combat Stats:**
- **Critical Chance**: 10% base + 5% per sword tier (max 50%)
- **Dodge Chance**: Based on movement speed (max 70%)
- **Status Duration**: 1-3 turns randomly determined
- **Armor Reduction**: Reduces incoming damage

## Dungeon Enemies

**Regular Enemies (Floors 1-19):**
- **Goblin** → **Orc Warrior** → **Skeleton** → **Dark Mage** → **Troll** → **Minotaur** → **Dragon** → **Lich King**

**Boss Enemies (Floors 5, 10, 15, 20):**
- **Floor 5**: Poison Spider Queen
- **Floor 10**: Cursed Necromancer  
- **Floor 15**: Toxic Hydra
- **Floor 20**: Ancient Lich Lord

## Status Effects

**🐍 Poisoned:**
- **Effect**: Lose 3 HP at start of each turn
- **Duration**: 1-3 turns (random)
- **Source**: Boss poison breath attacks
- **Visual**: Green snake emoji in player stats

**🩸 Wounded:**
- **Effect**: Cannot use health potions
- **Duration**: 1-3 turns (random)  
- **Source**: Boss cursed strike attacks
- **Visual**: Red drop emoji in player stats, grayed potion button

**Boss Intelligence:**
- Bosses won't use status attacks if player already has that effect
- Can alternate between normal attacks and available special attacks
- Special attacks require 1 turn preparation with warning message

## Color-Coded Combat Log

**Multi-Color Text System:**
- **White (#ffffff)**: Base text and descriptions
- **Yellow (#ffff00)**: Coin amounts and rewards
- **Red (#ff6666)**: Damage numbers and negative effects
- **Green (#00ff00)**: Health, healing, and positive effects
- **Blue (#0099ff)**: Interactive prompts and dodge instructions
- **Orange (#ff6600)**: Critical hits and boss attacks
- **Light Red (#ff9999)**: Enemy names and wound effects
- **Light Green (#99ff99)**: Poison effects

**Features:**
- **Keyword Highlighting**: Only important words are colored, rest stays white
- **Scrollable History**: Mouse wheel scrolling through combat log
- **Auto-scroll**: New messages automatically scroll to bottom
- **Segment-based**: Multiple colors within single message lines
- **Real-time Updates**: Immediate visual feedback for all combat events

## Achievement System

**Unlock-Based Decorations:**
- **First Purchase**: Buy any store item → Unlocks Table ($200)
- **Chat Streak**: Chat 3 consecutive days → Unlocks Plant ($150)
- **Arena Champion**: Win first arena fight → Unlocks Trophy ($300)
- **Rich Player**: Accumulate 5000 coins → Unlocks Fountain ($1000)
- **Speed Demon**: Max speed boots → Unlocks Statue ($800)

**Features:**
- **Achievement notifications**: Visual popups when unlocked
- **Decoration pricing**: Items cost money after first unlock
- **Progress tracking**: Automatic achievement checking
- **Persistent unlocks**: Achievements saved across sessions

## Controls

**Movement:**
- **WASD** or **Arrow Keys**: Move character in all directions

**Interface:**
- **C Key**: Toggle inventory visibility
- **ESC Key**: Open settings menu
- **Walk Into Buildings**: Only way to interact with buildings (no clicking)

**Dungeon Combat:**
- **Attack Button**: Initiate attack (may trigger critical timing event)
- **Use Potion Button**: Heal 50 HP (disabled when wounded)
- **Left Click**: During critical events, click in green zone for 2x damage
- **Spacebar**: During dodge events, press to reduce damage by 50%

**Debug:**
- **Konami Code** (WWSSADAD+Enter): Open debug console

## Technical Details

- **Frontend**: Phaser.js 3.70.0 for 2D game engine
- **Database**: Firebase Firestore with localStorage fallback
- **Twitch**: WebSocket connection to Twitch IRC (wss://irc-ws.chat.twitch.tv:443)
- **Profile System**: Multi-API Twitch avatar loading with smart fallbacks
- **UI System**: Immersive character-attached interface elements
- **Assets**: Simple colored rectangles as placeholder sprites
- **Architecture**: Modular JavaScript classes for easy expansion
- **Cloud Storage**: Firebase Firestore with real-time synchronization
- **Security**: Input validation, data sanitization, and secure API usage
- **Sprites**: Generated using [PixelLab.ai](https://www.pixellab.ai/)
- **Inventory**: Persistent 2x6 grid system with item management
- **Debug Tools**: Konami Code activation with comprehensive controls
- **Deployment**: GitHub Pages with secure credential management

## Modular Architecture

### Arena System Modules
- **`EnemyGenerator.js`**: Enemy and boss generation with floor-based scaling
- **`CombatLog.js`**: Multi-colored scrollable combat text display
- **`CombatSystem.js`**: Turn-based combat mechanics and status effects
- **`arena.js`**: Main arena coordinator and UI management

### Benefits
- **Maintainable**: Each module has single responsibility
- **Scalable**: Easy to add new features without affecting existing code
- **Readable**: Logical code organization and separation of concerns
- **Testable**: Isolated modules for easier debugging and testing