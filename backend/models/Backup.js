const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema({
    date: { 
        type: Date, 
        default: Date.now 
    },
    size: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['Automatic', 'Manual'], 
        default: 'Automatic' 
    },
    data: { 
        type: Object, 
        required: true 
    }
});

module.exports = mongoose.model('Backup', backupSchema);
