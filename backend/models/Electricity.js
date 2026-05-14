const mongoose = require('mongoose');

const electricitySchema = new mongoose.Schema({
    tenantId: {
        type: String,
        required: true
    },
    tenantName: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },
    previousReading: {
        type: Number,
        required: true
    },
    currentReading: {
        type: Number,
        required: true
    },
    unitsConsumed: {
        type: Number,
        required: true
    },
    ratePerUnit: {
        type: Number,
        default: 8
    },
    totalAmount: {
        type: Number,
        required: true
    },
    month: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Electricity', electricitySchema);
