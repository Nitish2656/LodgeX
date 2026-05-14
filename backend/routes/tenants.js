const express = require('express');
const Tenant = require('../models/Tenant');
const router = express.Router();

// Get all tenants (excluding heavy document fields for performance)
router.get('/', async (req, res) => {
    try {
        const tenants = await Tenant.find().select('-idProof -parentIdProof -coTenants.idProof -coTenants.parentIdProof');
        res.json(tenants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single tenant details (including heavy documents)
router.get('/:id', async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
        res.json(tenant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a new tenant
router.post('/', async (req, res) => {
    const tenant = new Tenant(req.body);
    try {
        const newTenant = await tenant.save();
        res.status(201).json(newTenant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a tenant
router.patch('/:id', async (req, res) => {
    try {
        const updatedTenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedTenant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a tenant
router.delete('/:id', async (req, res) => {
    try {
        await Tenant.findByIdAndDelete(req.params.id);
        res.json({ message: 'Tenant deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
