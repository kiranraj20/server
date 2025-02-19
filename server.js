import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import admin from 'firebase-admin';
import corsMiddleware from './middleware/cors.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import userAuthRoutes from './routes/user-auth.js';
import userRoutes from './routes/user.js';

dotenv.config();
// Check if required Firebase Admin variables are present
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('Missing required Firebase Admin environment variables');
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Private Key exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    process.exit(1);
}

// Initialize Firebase Admin with the correct credentials
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? 
            process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
            undefined
    })
});

const app = express();

// Apply CORS middleware
app.use(corsMiddleware);

// Middleware
app.use(express.json());
app.use(express.static('public'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import setupRoutes from './routes/setup.js';

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/setup', setupRoutes);

// User routes
app.use('/user/auth', userAuthRoutes);
app.use('/user', userRoutes);

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

app.get('/', (req, res) => {
    res.send('Hello World from server.js');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
});