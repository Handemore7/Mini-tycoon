class Database {
  constructor() {
    this.isOnline = false;
    this.initFirebase();
  }

  async initFirebase() {
    try {
      // Get Firebase config from external file
      const firebaseConfig = window.CONFIG?.firebase;
      if (!firebaseConfig) {
        throw new Error('Firebase configuration not found');
      }

      // Importar Firebase dinámicamente
      const { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
      );
      const { getFirestore, doc, setDoc, getDoc, onSnapshot, deleteDoc, disableNetwork, enableNetwork } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
      );

      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      
      // Force online mode
      try {
        await enableNetwork(this.db);
        console.log('🌐 Forced Firebase online mode');
      } catch (error) {
        console.log('ℹ️ Network enable failed:', error.code);
      }
      this.doc = doc;
      this.setDoc = setDoc;
      this.getDoc = getDoc;
      this.onSnapshot = onSnapshot;
      this.deleteDoc = deleteDoc;
      this.enableNetwork = enableNetwork;
      this.disableNetwork = disableNetwork;

      this.isOnline = true;
      console.log("✅ Database connected");
      this.showConnectionStatus("✅ Connected to database", "#00ff00");
      
      // Test write permissions
      this.testConnection();
    } catch (error) {
      console.log("❌ Database offline, using localStorage");
      this.showConnectionStatus("❌ Database offline - using local storage", "#ff6600");
      this.isOnline = false;
    }
  }

  showConnectionStatus(message, color) {
    // Create temporary status message
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: ${color};
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      transition: opacity 0.3s;
    `;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      statusDiv.style.opacity = '0';
      setTimeout(() => statusDiv.remove(), 300);
    }, 3000);
  }

  validatePlayerName(playerName) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(playerName);
  }

  sanitizeData(data) {
    // Convert to JSON and back to remove functions and non-serializable objects
    return JSON.parse(JSON.stringify(data));
  }

  async savePlayer(playerName, gameData) {
    if (!this.validatePlayerName(playerName)) {
      console.error('❌ Invalid player name format');
      localStorage.setItem(`minitycoon_${playerName}`, JSON.stringify(gameData));
      return false;
    }

    if (this.isOnline) {
      try {
        // Clean and prepare data for Firebase
        const cleanData = this.sanitizeData(gameData);
        const dataToSave = {
          ...cleanData,
          playerName: playerName,
          lastSaved: new Date().toISOString(),
        };
        
        await this.setDoc(this.doc(this.db, "players", playerName), dataToSave);
        console.log(`💾 Saved ${playerName} to database`);
        return true;
      } catch (error) {
        // Network blocked or other Firebase error - continue silently
        console.log("ℹ️ Firebase save failed, using localStorage backup");
      }
    }

    // Fallback a localStorage
    localStorage.setItem(`minitycoon_${playerName}`, JSON.stringify(gameData));
    return false;
  }

  async checkPlayerExists(playerName) {
    if (!this.validatePlayerName(playerName)) {
      return false;
    }

    if (this.isOnline) {
      try {
        const docSnap = await this.getDoc(
          this.doc(this.db, "players", playerName)
        );
        return docSnap.exists();
      } catch (error) {
        console.error("❌ Firebase check error:", error);
      }
    }

    // Fallback to localStorage check
    const saved = localStorage.getItem(`minitycoon_${playerName}`);
    return saved !== null;
  }

  async loadPlayer(playerName) {
    if (!this.validatePlayerName(playerName)) {
      console.error('❌ Invalid player name for load');
      const saved = localStorage.getItem(`minitycoon_${playerName}`);
      return saved ? JSON.parse(saved) : null;
    }

    if (this.isOnline) {
      try {
        const docSnap = await this.getDoc(
          this.doc(this.db, "players", playerName)
        );
        if (docSnap.exists()) {
          console.log(`📁 Loaded ${playerName} from database`);
          return docSnap.data();
        } else {
          console.log(`ℹ️ No database record for ${playerName}`);
        }
      } catch (error) {
        console.error("❌ Firebase load error:", error);
        console.log("Load failed, trying localStorage");
      }
    }

    // Fallback a localStorage
    const saved = localStorage.getItem(`minitycoon_${playerName}`);
    return saved ? JSON.parse(saved) : null;
  }

  async testConnection() {
    try {
      const testDoc = this.doc(this.db, "test", "connection");
      await this.setDoc(testDoc, { test: true, timestamp: new Date().toISOString() });
      console.log("✅ Firebase write test successful");
    } catch (error) {
      console.error("❌ Firebase write test failed:", error);
      this.showConnectionStatus("❌ Write permissions denied", "#ff0000");
    }
  }

  async createPlayer(playerName, twitchStreamer) {
    if (!this.validatePlayerName(playerName)) {
      console.error('❌ Invalid player name for create');
      return false;
    }

    if (this.isOnline) {
      try {
        const defaultData = {
          playerName: playerName,
          twitchStreamer: twitchStreamer || 'your_streamer_name',
          volume: 0.5,
          money: 100,
          stats: { health: 100, maxHealth: 100, damage: 10, attackSpeed: 1, moveSpeed: 100, armor: 0, criticalChance: 10 },
          inventory: { sword: 0, shield: 0 },
          decorations: [],
          upgrades: { boots: 0, passiveIncome: 0, activeIncome: 0 },
          passiveIncome: 1,
          chatBonus: 10,
          chatStreak: 0,
          lastChatDate: null,
          arenaWins: 0,
          decorationInventory: {},
          healthPotions: 0,
          achievements: {},
          unlockedDecorations: {},
          createdAt: new Date().toISOString()
        };
        
        await this.setDoc(this.doc(this.db, "players", playerName), defaultData);
        console.log(`👤 Created new player ${playerName} in database`);
        return true;
      } catch (error) {
        console.error('❌ Firebase create failed:', error);
      }
    }
    return false;
  }

  async deletePlayer(playerName) {
    if (!this.validatePlayerName(playerName)) {
      console.error('❌ Invalid player name for delete');
      return false;
    }

    console.log(`🗑️ Attempting to delete ${playerName} from Firebase...`);
    
    // Delete from Firebase
    if (this.isOnline) {
      try {
        // Force online mode before delete
        await this.enableNetwork(this.db);
        console.log('🌐 Ensured online mode for delete');
        
        await this.deleteDoc(this.doc(this.db, "players", playerName));
        console.log(`✅ Delete command sent for ${playerName}`);
        
        // Immediate verification
        const docSnap = await this.getDoc(this.doc(this.db, "players", playerName));
        if (docSnap.exists()) {
          console.warn(`⚠️ Document ${playerName} still exists after delete`);
        } else {
          console.log(`✅ Confirmed: ${playerName} deleted from Firebase`);
        }
        
      } catch (error) {
        console.error(`❌ Firebase delete failed:`, error);
        console.error(`Error code: ${error.code}`);
        console.error(`Error message: ${error.message}`);
      }
    } else {
      console.log('ℹ️ Database offline, skipping Firebase delete');
    }

    // Delete from localStorage
    localStorage.removeItem(`minitycoon_${playerName}`);
    console.log(`📋 Cleared localStorage for ${playerName}`);
    return true;
  }

  // Sincronización en tiempo real (opcional)
  subscribeToPlayer(playerName, callback) {
    if (!this.isOnline) return null;

    return this.onSnapshot(this.doc(this.db, "players", playerName), (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  }
}

// Instancia global
window.database = new Database();
