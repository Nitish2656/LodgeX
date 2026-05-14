const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    tenantId: {
        type: String, // or mongoose.Schema.Types.ObjectId
        required: true
    },
    roomId: {
        type: String, // or mongoose.Schema.Types.ObjectId
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        required: true
    },
    dueAmount: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    month: {
        type: String,
        required: true
    },
    method: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer', 'Google Pay', 'PhonePe', 'Paytm', 'Card', 'Other'],
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed'],
        default: 'completed'
    },
    notes: {
        type: String
    },
    tenantName: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
