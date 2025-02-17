import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';

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

export default router;