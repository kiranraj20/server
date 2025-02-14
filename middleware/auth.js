const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    console.log('🔒 Auth Middleware Called');
    console.log('📨 Request Headers:', JSON.stringify(req.headers, null, 2));

    // Get token from header
    const token = req.header('x-auth-token');
    console.log('🔑 Extracted Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        console.log('🔍 Attempting to verify token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret');
        console.log('✅ Token verified, decoded:', decoded);
        
        if (!decoded.admin) {
            console.log('❌ Not an admin token');
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        req.admin = decoded.admin;
        console.log('👤 Admin authorized:', req.admin);
        next();
    } catch (err) {
        console.error('❌ Token verification failed:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth; 