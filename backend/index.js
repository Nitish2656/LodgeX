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

// Export the app for Vercel
module.exports = app;

// Start Server (only if not running on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}
