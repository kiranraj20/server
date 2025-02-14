const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const setupRoutes = require('./routes/setup');

const app = express();

// CORS configuration
app.use(cors({
    origin: true,
    credentials: true,
    exposedHeaders: ['x-auth-token'],
    allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        headers: req.headers
    });
    next();
});

// API Routes must come before static files
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setup', setupRoutes);

// Static files
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/api/admin/setup');
});

// Handle 404
app.use((req, res) => {
    res.status(404).send('Not Found');
});

module.exports = app; 