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
        console.log(decoded)
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

        // Set admin custom claim in Firebase
        try {
            await admin.auth().setCustomUserClaims(verifiedUid, { admin: true });
            console.log('Admin claim set for user:', verifiedUid);
        } catch (error) {
            console.error('Error setting admin claim:', error);
            // Delete the admin from MongoDB if Firebase claim fails
            await Admin.findByIdAndDelete(newAdmin._id);
            throw error;
        }

        console.log('Admin created successfully:', newAdmin);
        
        res.status(201).json({ 
            message: 'Admin created successfully. Please log out and log in again to apply admin privileges.',
            admin: {
                name: newAdmin.name,
                email: newAdmin.email
            }
        });
    } catch (error) {
        console.error('Admin Creation Error:', error);
        res.status(500).json({ 
            message: 'Error creating admin',
            error: error.message 
        });
    }
});

// Verify admin status
router.get('/verify-admin', async (req, res) => {
    try {
        // Log the incoming request
        console.log('Verify admin request received');
        console.log('Headers:', req.headers);
        console.log('Method:', req.method);
        console.log('Origin:', req.get('origin'));

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No valid authorization header found');
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        console.log('Token received:', token.substring(0, 20) + '...');
        
        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('Token verified, decoded:', decodedToken);

        // Check if user has admin claim
        if (decodedToken.admin !== true) {
            console.log('User is not an admin:', decodedToken.uid);
            return res.status(403).json({ error: 'Not authorized as admin'});
        }

        console.log('Admin verified successfully');
        // If everything is ok, send success response
        res.json({ 
            admin: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name || 'Admin'
            }
        });
    } catch (error) {
        console.error('Verify admin error:', error);
        res.status(403).json({ 
            error: 'Authentication failed',
            details: error.message
        });
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

// Set admin claim for existing admin
router.post('/set-admin-claim', async (req, res) => {
    try {
        const { uid } = req.body;
        
        // Check if admin exists in MongoDB
        const existingAdmin = await Admin.findOne({ firebaseUid: uid });
        
        if (!existingAdmin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Set admin custom claim in Firebase
        await admin.auth().setCustomUserClaims(uid, { admin: true });
        console.log('Admin claim set for user:', uid);

        res.json({ 
            message: 'Admin claim set successfully. Please log out and log in again to apply admin privileges.',
            uid
        });
    } catch (error) {
        console.error('Error setting admin claim:', error);
        res.status(500).json({ 
            message: 'Error setting admin claim',
            error: error.message 
        });
    }
});

// Add this temporary route to create admin document
router.post('/init-admin', async (req, res) => {
    try {
        const adminData = {
            name: 'Kiran Raj',
            email: 'kiranraj80555@gmail.com',
            firebaseUid: 'QfM49FUJ81Q9bc2EoIztRFGSFt12',
            isAdmin: true
        };

        // Check if admin already exists
        let admin = await Admin.findOne({ firebaseUid: adminData.firebaseUid });
        
        if (!admin) {
            admin = new Admin(adminData);
            await admin.save();
        }

        // Set admin claim in Firebase
        await admin.auth().setCustomUserClaims(adminData.firebaseUid, { admin: true });
        
        res.json({ 
            message: 'Admin initialized successfully. Please log out and log in again.',
            admin: adminData
        });
    } catch (error) {
        console.error('Init admin error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add this temporary route to check claims
router.get('/check-claims/:uid', async (req, res) => {
    try {
        const user = await admin.auth().getUser(req.params.uid);
        res.json({
            customClaims: user.customClaims,
            uid: user.uid,
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 