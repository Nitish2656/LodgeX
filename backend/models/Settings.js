const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    lodgeName: { type: String, default: 'Royal Lodge' },
    ownerName: { type: String, default: 'Admin' },
    phone: { type: String, default: '9876543210' },
    email: { type: String, default: 'admin@lodgex.com' },
    address: { type: String, default: '123 Main Street, City' },
    electricRate: { type: Number, default: 8 },
    autoBackup: { type: Boolean, default: true },
    emailNotifs: { type: Boolean, default: true },
    dueReminders: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', settingsSchema);
