import express from "express";
const router = express.Router();
import admin from "firebase-admin";
import User from "../models/User.js";
import bcrypt from 'bcrypt';

// User Registration
router.post("/create-user", async (req, res) => {
    try {
        const { name, email, firebaseUid, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        // Verify the Firebase token if provided
        let verifiedUid = firebaseUid;
        const token = req.headers.authorization?.split("Bearer ")[1];

        if (token) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                verifiedUid = decodedToken.uid;
            } catch (error) {
                console.error("Token verification error:", error);
                return res.status(401).json({ message: "Invalid or expired token" });
            }
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in MongoDB
        const newUser = new User({
            name,
            email,
            firebaseUid: verifiedUid,
            password_hash: hashedPassword,
            isAdmin: false,
        });

        await newUser.save();

        // Set user custom claim in Firebase
        try {
            await admin.auth().setCustomUserClaims(verifiedUid, { admin: false });
        } catch (error) {
            console.error("Error setting admin claim:", error);
            // Rollback: Delete the user from MongoDB if Firebase claim fails
            await User.findByIdAndDelete(newUser._id);
            return res.status(500).json({
                message: "Error setting user privileges in Firebase",
                error: error.message,
            });
        }

        console.log("User created successfully:", newUser);

        // Respond with success
        res.status(201).json({
            message:
                "User created successfully. Please log out and log in again to apply user privileges.",
            user: {
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error("User Creation Error:", error);
        res.status(500).json({
            message: "Error creating user",
            error: error.message,
        });
    }
});

// Verify user status
router.get("/login", async (req, res) => {
    try {
        const { email, password, firebaseUid } = req.body;
        console.log('👉 Login attempt:', { email });

        // Find admin
        const user = await User.findOne({ email });
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch || firebaseUid != user.firebaseUid ) {
            console.log('❌ Invalid password for:', email);
            return res.status(400).json({ message: 'Invalid credentials' }); 
        }

        console.log('✅ Password verified for:', email);

        res.status(201).json({
            message:
                "User logged successfully.",
            user,
        });
    } catch (err) {
        console.error('❌ Login Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put("/profile", async (req, res) => {
    try {
        const token = req.headers.authorization?.split("Bearer ")[1];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = await User.findOne({ firebaseUid: decodedToken.uid });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { name, phone, address } = req.body;

        // Update allowed fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;

        await user.save();

        res.json({
            message: "Profile updated successfully",
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
});

export default router;
