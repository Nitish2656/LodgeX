const express = require('express');
const Room = require('../models/Room');
const Tenant = require('../models/Tenant');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Electricity = require('../models/Electricity');
const Settings = require('../models/Settings');
const router = express.Router();

router.get('/export', async (req, res) => {
    try {
        const rooms = await Room.find({});
        const tenants = await Tenant.find({});
        const payments = await Payment.find({});
        const expenses = await Expense.find({});
        const electricity = await Electricity.find({});

        const backupData = {
            timestamp: new Date().toISOString(),
            data: {
                rooms,
                tenants,
                payments,
                expenses,
                electricity
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=lodge_backup_${new Date().getTime()}.json`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
        res.status(500).json({ message: 'Backup failed', error: error.message });
    }
});

router.post('/import', async (req, res) => {
    try {
        const { rooms, tenants, payments, expenses, electricity, settings } = req.body;

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

        res.json({ message: 'Data restored successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Restore failed', error: error.message });
    }
});

module.exports = router;
