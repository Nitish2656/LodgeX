const express = require('express');
const Electricity = require('../models/Electricity');
const router = express.Router();

// Get all electricity records
router.get('/', async (req, res) => {
    try {
        const records = await Electricity.find().sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add an electricity record
router.post('/', async (req, res) => {
    const record = new Electricity(req.body);
    try {
        const newRecord = await record.save();
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update an electricity record
router.patch('/:id', async (req, res) => {
    try {
        const updatedRecord = await Electricity.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedRecord);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an electricity record
router.delete('/:id', async (req, res) => {
    try {
        await Electricity.findByIdAndDelete(req.params.id);
        res.json({ message: 'Electricity record deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
