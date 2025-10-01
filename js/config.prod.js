// Production configuration using environment variables
const CONFIG = {
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || "demo-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.FIREBASE_APP_ID || "demo-app-id",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-DEMO"
  },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID || "demo-client-id",
    accessToken: process.env.TWITCH_ACCESS_TOKEN || "demo-token"
  }
};

window.CONFIG = CONFIG;