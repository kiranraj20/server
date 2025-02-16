import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, browserSessionPersistence, setPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

let auth;

async function initializeFirebase() {
  try {
    const response = await fetch('/auth/firebase-config');
    const firebaseConfig = await response.json();
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Set persistence to session
    await setPersistence(auth, browserSessionPersistence);
    
    return auth;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Initialize Firebase and export auth
await initializeFirebase();
export { auth };