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
      const { getFirestore, doc, setDoc, getDoc, onSnapshot } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
      );

      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.doc = doc;
      this.setDoc = setDoc;
      this.getDoc = getDoc;
      this.onSnapshot = onSnapshot;

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
        console.error("❌ Firebase save error:", error);
        console.log("Save failed, using localStorage backup");
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
