import { auth } from '../firebase-config.js';

export async function fetchWithAuth(url, options = {}) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        const token = await user.getIdToken(true); // Force token refresh
        
        const baseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000'
            : 'https://skblossom.vercel.app';

        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
        
        console.log('Fetching URL:', fullUrl); // Debug log

        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error('fetchWithAuth error:', error);
        throw error;    
    }
} 