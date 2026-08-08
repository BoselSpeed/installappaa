// Firebase Configuration
// Replace these values with your Firebase project configuration
// Get these from: https://console.firebase.google.com/

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase only if we have valid configuration
let initialized = false;

export const initializeFirebase = () => {
  if (!initialized && typeof window !== 'undefined') {
    try {
      // Check if config values are placeholders
      const isConfigured = !Object.values(firebaseConfig).some(
        value => value.startsWith('YOUR_')
      );
      
      if (isConfigured) {
        import('firebase/app').then(({ initializeApp }) => {
          initializeApp(firebaseConfig);
          console.log('Firebase initialized successfully');
          initialized = true;
        }).catch(error => {
          console.error('Firebase initialization error:', error);
        });
      } else {
        console.warn('Firebase not configured. Please update src/firebase/config.js with your Firebase project details.');
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }
};

export default firebaseConfig;
