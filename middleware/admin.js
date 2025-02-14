const admin = require('firebase-admin');
const Admin = require('../models/Admin');

const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Check if user exists in your admin collection
        const adminUser = await Admin.findOne({ firebaseUid: decodedToken.uid });
        
        if (!adminUser) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        // Add admin user to request object
        req.admin = adminUser;
        next();
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = adminMiddleware; 