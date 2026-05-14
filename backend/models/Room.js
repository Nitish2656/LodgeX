const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true
    },
    floor: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Single', 'Double', 'Flat']
    },
    status: {
        type: String,
        required: true,
        enum: ['available', 'occupied', 'reserved', 'maintenance'],
        default: 'available'
    },
    rent: {
        type: Number,
        required: true
    },
    tenantId: {
        type: String, // Or mongoose.Schema.Types.ObjectId if we link to a Tenant model
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Room', roomSchema);
