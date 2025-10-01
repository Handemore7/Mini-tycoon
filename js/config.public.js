// Public configuration - Safe for client-side use
// Firebase API keys are designed to be public (not secrets)
// Security is handled by Firestore rules, not API key secrecy
// See: https://firebase.google.com/docs/projects/api-keys
const CONFIG = {
  firebase: {
    apiKey: "AIzaSyDmHkfBnnQJ8FpZXoerd-7tRAZcid_XHEE", // Public Firebase identifier
    authDomain: "mini-tycoon.firebaseapp.com",
    projectId: "mini-tycoon",
    storageBucket: "mini-tycoon.firebasestorage.app",
    messagingSenderId: "708753179327",
    appId: "1:708753179327:web:13fdbc64b017debbd1fc0a",
    measurementId: "G-BF77CFJDYK"
  },
  twitch: {
    clientId: "gp762nuuoqcoxypju8c569th9wz7q5",
    // Access token removed for security - Twitch features disabled in public version
    accessToken: null
  }
};

window.CONFIG = CONFIG;