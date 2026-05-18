const express = require('express');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Electricity = require('../models/Electricity');
const Settings = require('../models/Settings');
const Backup = require('../models/Backup');
const router = express.Router();

// Helper to compile all data for backups
async function compileBackupData() {
    const rooms = await Room.find({});
    const tenants = await Tenant.find({});
    const payments = await Payment.find({});
    const expenses = await Expense.find({});
    const electricity = await Electricity.find({});
    const settings = await Settings.findOne({});

    return {
        rooms,
        tenants,
        payments,
        expenses,
        electricity,
        settings
    };
}

// Helper to perform database restoration from compile format
async function restoreFromData(data) {
    const { rooms, tenants, payments, expenses, electricity, settings } = data;

    // Clear existing data
    await Room.deleteMany({});
    await Tenant.deleteMany({});
    await Payment.deleteMany({});
    await Expense.deleteMany({});
    await Electricity.deleteMany({});
    await Settings.deleteMany({});

    // Insert new data
    if (rooms && rooms.length) await Room.insertMany(rooms);
    if (tenants && tenants.length) await Tenant.insertMany(tenants);
    if (payments && payments.length) await Payment.insertMany(payments);
    if (expenses && expenses.length) await Expense.insertMany(expenses);
    if (electricity && electricity.length) await Electricity.insertMany(electricity);
    if (settings) await Settings.create(settings);
}

// 1. Export backup directly as downloadable JSON file
router.get('/export', async (req, res) => {
    try {
        const data = await compileBackupData();
        const backupData = {
            timestamp: new Date().toISOString(),
            data
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=lodge_backup_${new Date().getTime()}.json`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
        res.status(500).json({ message: 'Backup failed', error: error.message });
    }
});

// 2. Import backup from uploaded JSON file
router.post('/import', async (req, res) => {
    try {
        await restoreFromData(req.body);
        res.json({ message: 'Data restored successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Restore failed', error: error.message });
    }
});

// 3. Get backup history from DB (exclude heavy 'data' field)
router.get('/history', async (req, res) => {
    try {
        const history = await Backup.find({}, { data: 0 }).sort({ date: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch backup history', error: error.message });
    }
});

// 4. Create and save a manual backup in the DB history
router.post('/save-backup', async (req, res) => {
    try {
        const data = await compileBackupData();
        const sizeStr = (Buffer.byteLength(JSON.stringify(data)) / 1024).toFixed(1) + ' KB';

        const newBackup = await Backup.create({
            size: sizeStr,
            type: 'Manual',
            data
        });

        // Keep only top 10 backups to prevent database size inflation
        const backupsCount = await Backup.countDocuments({});
        if (backupsCount > 10) {
            const oldestBackups = await Backup.find({}, { _id: 1 }).sort({ date: 1 }).limit(backupsCount - 10);
            const idsToDelete = oldestBackups.map(b => b._id);
            await Backup.deleteMany({ _id: { $in: idsToDelete } });
        }

        // Return backup info without heavy data
        res.json({
            _id: newBackup._id,
            date: newBackup.date,
            size: newBackup.size,
            type: newBackup.type
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save backup in history', error: error.message });
    }
});

// 5. Download a backup file by ID from history
router.get('/download/:id', async (req, res) => {
    try {
        const backup = await Backup.findById(req.params.id);
        if (!backup) return res.status(404).json({ message: 'Backup not found' });

        const backupData = {
            timestamp: backup.date,
            data: backup.data
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=lodge_backup_${backup.type.toLowerCase()}_${backup._id}.json`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
        res.status(500).json({ message: 'Download failed', error: error.message });
    }
});

// 6. Restore from a saved backup ID directly with 1 click
router.post('/restore/:id', async (req, res) => {
    try {
        const backup = await Backup.findById(req.params.id);
        if (!backup) return res.status(404).json({ message: 'Backup not found' });

        await restoreFromData(backup.data);
        res.json({ message: 'Data restored successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Restore failed', error: error.message });
    }
});

// 7. Delete a backup entry
router.delete('/:id', async (req, res) => {
    try {
        await Backup.findByIdAndDelete(req.params.id);
        res.json({ message: 'Backup deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Delete failed', error: error.message });
    }
});

module.exports = router;
