const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        type: String
    },
    roomId: {
        type: String, // Or mongoose.Schema.Types.ObjectId if linking to Room model
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    vacateDate: {
        type: Date
    },
    idProof: {
        type: String,
        default: 'Aadhaar Card'
    },
    rent: {
        type: Number,
        default: 0
    },
    deposit: {
        type: Number,
        default: 0
    },
    avatar: {
        type: String
    },
    pendingDues: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    parentName: {
        type: String
    },
    parentPhone: {
        type: String
    },
    parentIdProof: {
        type: String
    },
    avatar: {
        type: String
    },
    coTenants: [{
        name: String,
        phone: String,
        email: String,
        parentName: String,
        parentPhone: String,
        idProof: String,
        parentIdProof: String,
        avatar: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for faster queries
tenantSchema.index({ status: 1 });
tenantSchema.index({ status: 1, pendingDues: 1 });
tenantSchema.index({ roomId: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
