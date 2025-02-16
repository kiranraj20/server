const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const admin = require('firebase-admin');
const corsMiddleware = require('./middleware/cors');
require('dotenv').config();

// Initialize Firebase Admin with the correct credentials
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
});

const app = express();

// Apply CORS middleware
app.use(corsMiddleware);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection with error handling
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected Successfully');
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1); // Exit if cannot connect to database
    });

// Log MongoDB queries in development
if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true);
}

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const setupRoutes = require('./routes/setup');

// Routes with API prefix for Vercel
const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '';

// Routes
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);
app.use(`${apiPrefix}/admin/setup`, setupRoutes);

// Serve static admin files
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Handle admin routes for SPA
app.get(['/admin/setup', '/admin/login', '/admin/dashboard'], (req, res) => {
    const page = req.path.split('/').pop();
    res.sendFile(path.join(__dirname, `public/admin/${page}.html`));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
});