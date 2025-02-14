const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

module.exports = router; 