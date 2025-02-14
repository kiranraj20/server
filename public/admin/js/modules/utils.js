export async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/api/admin/setup';
        return;
    }

    const defaultOptions = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
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

    try {
        console.log('Fetching:', url);
        const response = await fetch(url, mergedOptions);
        if (!response.ok) {
            console.error('API Error:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            });
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response;
    } catch (error) {
        console.error('Fetch Error:', error);
        throw error;
    }
} 