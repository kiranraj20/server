import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, browserSessionPersistence, setPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyBHgzTurzEZ3sVZ7C5YLXPsrNExUeJNjDo",
  authDomain: "skblossom-af512.firebaseapp.com",
  projectId: "skblossom-af512",
  storageBucket: "skblossom-af512.appspot.com",
  messagingSenderId: "717048781387",
  appId: "1:717048781387:web:8ad5468db2455758910bce",
  measurementId: "G-MEASUREMENT_ID"  // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to session
setPersistence(auth, browserSessionPersistence)
    .catch((error) => {
        console.error("Auth persistence error:", error);
    });

export { auth }; 