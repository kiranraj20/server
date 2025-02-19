import express from 'express';
const router = express.Router();
import admin from 'firebase-admin';
import User from '../models/User.js';

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, address, firebaseUid } = req.body;
        
        // Verify Firebase token if provided
        let verifiedUid = firebaseUid;
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (token) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                verifiedUid = decodedToken.uid;
            } catch (error) {
                console.error('Token verification error:', error);
                return res.status(401).json({ message: 'Invalid token' });
            }
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { firebaseUid: verifiedUid }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user in MongoDB
        const newUser = new User({
            name,
            email,
            phone,
            address,
            firebaseUid: verifiedUid,
            role: 'customer'
        });

        await newUser.save();
        
        res.status(201).json({ 
            message: 'User registered successfully',
            user: {
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('User Registration Error:', error);
        res.status(500).json({ 
            message: 'Error registering user',
            error: error.message 
        });
    }
});

// Verify user status
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Get user from database
        const user = await User.findOne({ firebaseUid: decodedToken.uid })
            .select('-password_hash');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.active) {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        res.json({ 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(403).json({ 
            error: 'Authentication failed',
            details: error.message
        });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { name, phone, address } = req.body;

        // Update allowed fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

export default router; 