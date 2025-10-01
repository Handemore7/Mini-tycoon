// Configuration template - Copy to config.js and fill with your credentials
const CONFIG = {
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },
  twitch: {
    clientId: "YOUR_TWITCH_CLIENT_ID",
    accessToken: "YOUR_TWITCH_ACCESS_TOKEN"
  }
};

window.CONFIG = CONFIG;