import { auth } from '../firebase-config.js';

export async function fetchWithAuth(url, options = {}) {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = '/admin/login';
            return;
        }

        const idToken = await user.getIdToken(true);
        const defaultOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        console.log('Fetching:', url); // Debug log
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Clear any stored auth data
                await auth.signOut();
                window.location.href = '/admin/login';
                return;
            }
            const errorData = await response.json();
            throw new Error(errorData.message || `API request failed: ${response.status} ${response.statusText}`);
        }
        return response;
    } catch (error) {
        console.error('Fetch Error:', error);
        // Show error to user
        alert(`Error: ${error.message}`);
        throw error;
    }
} 