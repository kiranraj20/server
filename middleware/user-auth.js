import admin from 'firebase-admin';
import User from '../models/User.js';

const userAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Check if user exists in your database
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        
        if (!user || !user.active) {
            return res.status(403).json({ message: 'Access denied' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('User Auth Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

export default userAuth; 