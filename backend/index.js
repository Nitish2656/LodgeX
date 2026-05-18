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
if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb')) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch((err) => console.error('❌ MongoDB connection error:', err));
} else {
    console.error('⚠️ MONGODB_URI is invalid or not set. Database not connected.');
}

// Keep Render free tier awake by pinging itself every 14 minutes
app.get('/api/ping', (req, res) => res.send('pong'));

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    
    // Auto-ping logic (runs every 14 minutes = 840000 ms)
    setInterval(() => {
        const targetUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        const httpLib = targetUrl.startsWith('https') ? require('https') : require('http');
        
        try {
            httpLib.get(`${targetUrl}/api/ping`, (res) => {
                console.log(`[Keep-Alive Ping] Status Code: ${res.statusCode} at ${new Date().toISOString()}`);
            }).on('error', (err) => {
                console.error('[Keep-Alive Ping] Request error:', err.message);
            });
        } catch (error) {
            console.error('[Keep-Alive Ping] Error:', error.message);
        }
    }, 840000);

    // Weekly Auto-Backup scheduler
    const Backup = require('./models/Backup');
    const Room = require('./models/Room');
    const Tenant = require('./models/Tenant');
    const Payment = require('./models/Payment');
    const Expense = require('./models/Expense');
    const Electricity = require('./models/Electricity');
    const Settings = require('./models/Settings');

    async function checkAndRunWeeklyBackup() {
        try {
            const now = new Date();
            const lastAutoBackup = await Backup.findOne({ type: 'Automatic' }).sort({ date: -1 });
            
            let shouldBackup = false;
            if (!lastAutoBackup) {
                // Seed the very first automatic backup on startup if none exist
                shouldBackup = true;
            } else {
                const diffTime = Math.abs(now - lastAutoBackup.date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Sunday at midnight (hour 0), and at least 6 days since the last auto backup
                if (now.getDay() === 0 && now.getHours() === 0 && diffDays >= 6) {
                    shouldBackup = true;
                }
            }

            if (shouldBackup) {
                console.log('[Auto-Backup] Running scheduled weekly automatic backup...');
                const rooms = await Room.find({});
                const tenants = await Tenant.find({});
                const payments = await Payment.find({});
                const expenses = await Expense.find({});
                const electricity = await Electricity.find({});
                const settings = await Settings.findOne({});

                const backupData = {
                    rooms,
                    tenants,
                    payments,
                    expenses,
                    electricity,
                    settings
                };

                const sizeStr = (Buffer.byteLength(JSON.stringify(backupData)) / 1024).toFixed(1) + ' KB';

                await Backup.create({
                    size: sizeStr,
                    type: 'Automatic',
                    data: backupData
                });

                // Keep only top 10 backups to prevent database size inflation
                const backupsCount = await Backup.countDocuments({ type: 'Automatic' });
                if (backupsCount > 10) {
                    const oldestBackups = await Backup.find({ type: 'Automatic' }, { _id: 1 }).sort({ date: 1 }).limit(backupsCount - 10);
                    const idsToDelete = oldestBackups.map(b => b._id);
                    await Backup.deleteMany({ _id: { $in: idsToDelete } });
                }

                console.log('[Auto-Backup] Weekly automatic backup successfully saved to MongoDB Atlas cloud!');
            }
        } catch (err) {
            console.error('[Auto-Backup] Error in automated backup scheduler:', err.message);
        }
    }

    // Run check 5 seconds after startup
    setTimeout(checkAndRunWeeklyBackup, 5000);

    // Run check every 1 hour (3600000 ms)
    setInterval(checkAndRunWeeklyBackup, 3600000);
});
