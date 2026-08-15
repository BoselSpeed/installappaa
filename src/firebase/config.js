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

// Returns true only when real Firebase credentials are present.
// When false, the app runs in demo mode backed by local (mock) data.
export const isFirebaseConfigured = () => {
  if (typeof window === 'undefined') return false;
  return !Object.values(firebaseConfig).some(
    (value) => typeof value === 'string' && value.startsWith('YOUR_')
  );
};

export default firebaseConfig;
