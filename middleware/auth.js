const admin = require('firebase-admin');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Check if user exists in your database and is an admin
        const adminUser = await Admin.findOne({ firebaseUid: decodedToken.uid });
        
        if (!adminUser || !adminUser.isAdmin) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        req.user = decodedToken;
        req.adminUser = adminUser;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = auth; 