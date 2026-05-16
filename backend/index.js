const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Import Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const tenantRoutes = require('./routes/tenants');
const paymentRoutes = require('./routes/payments');
const expenseRoutes = require('./routes/expenses');
const electricityRoutes = require('./routes/electricity');
const backupRoutes = require('./routes/backup');
const settingsRoutes = require('./routes/settings');
const filesRoutes = require('./routes/files');

// Route Middlewares
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/electricity', electricityRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/files', filesRoutes);

// Root Route
app.get('/', (req, res) => {
    res.send('Lodge Rental Management API is running...');
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Keep Render free tier awake by pinging itself every 14 minutes
app.get('/api/ping', (req, res) => res.send('pong'));

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    
    // Auto-ping logic (runs every 14 minutes = 840000 ms)
    setInterval(() => {
        const targetUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        try {
            fetch(`${targetUrl}/api/ping`)
                .then(res => res.text())
                .then(text => console.log(`[Keep-Alive Ping] Status: ${text} at ${new Date().toISOString()}`))
                .catch(err => console.error('[Keep-Alive Ping] Fetch error:', err.message));
        } catch (error) {
            console.error('[Keep-Alive Ping] Error:', error.message);
        }
    }, 840000);
});
