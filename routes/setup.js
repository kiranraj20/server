const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

// Serve setup page
router.get('/', (req, res) => {
    res.sendFile('setup.html', { root: './public/admin' });
});

// Create initial admin account
router.post('/create-admin', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create admin
        const admin = new Admin({
            name,
            email,
            password_hash
        });

        await admin.save();
        res.json({ message: 'Admin created successfully' });
    } catch (error) {
        console.error('Setup Error:', error);
        res.status(500).json({ message: 'Error creating admin' });
    }
});

module.exports = router; 