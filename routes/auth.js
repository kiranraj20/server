const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const Admin = require('../models/Admin');

// Admin Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('👉 Login attempt:', { email });
        
        // Find admin
        const admin = await Admin.findOne({ email });
        if (!admin) {
            console.log('❌ Admin not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            console.log('❌ Invalid password for:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('✅ Password verified for:', email);

        // Create JWT payload
        const payload = {
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: 'admin'
            }
        };

        // Sign token
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your-default-secret',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('❌ JWT Sign Error:', err);
                    return res.status(500).json({ message: 'Error generating token' });
                }
                console.log('✅ Token generated successfully');
                console.log('🔑 Token:', token);
                res.json({ 
                    token,
                    admin: payload.admin
                });
            }
        );
    } catch (err) {
        console.error('❌ Login Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret');
        if (!decoded.admin) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        const admin = await Admin.findById(decoded.admin.id).select('-password_hash');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({ valid: true, admin });
    } catch (err) {
        console.error('Token Verification Error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
});

// Create admin account
router.post('/create-admin', async (req, res) => {
    try {
        const { name, email, firebaseUid } = req.body;
        
        // Verify the Firebase token if provided
        let verifiedUid = firebaseUid;
        const token = req.headers.authorization?.split('Bearer ')[1];
        
        if (token) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                verifiedUid = decodedToken.uid;
            } catch (error) {
                console.error('Token verification error:', error);
            }
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ 
            $or: [{ email }, { firebaseUid: verifiedUid }] 
        });
        
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create admin in MongoDB
        const newAdmin = new Admin({
            name,
            email,
            firebaseUid: verifiedUid,
            isAdmin: true
        });

        await newAdmin.save();
        console.log('Admin created successfully:', newAdmin);
        
        res.status(201).json({ 
            message: 'Admin created successfully',
            admin: {
                name: newAdmin.name,
                email: newAdmin.email
            }
        });
    } catch (error) {
        console.error('Admin Creation Error:', error);
        res.status(500).json({ message: 'Error creating admin' });
    }
});

// Verify admin status
router.get('/verify-admin', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        console.log(token)
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const adminUser = await Admin.findOne({ firebaseUid: decodedToken.uid });

        if (!adminUser) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        res.json({ 
            valid: true, 
            admin: {
                name: adminUser.name,
                email: adminUser.email
            }
        });
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Update the route to match the API path
router.get('/firebase-config', (req, res) => {
  const firebaseConfig = { 
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
  res.json(firebaseConfig);
});

module.exports = router; 