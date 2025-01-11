const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    bonus: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const referralSchema = new mongoose.Schema({
    referrer: {
        type: String,
        required: true,
        lowercase: true
    },
    referred: {
        type: String,
        required: true,
        lowercase: true
    },
    bonusAmount: {
        type: Number,
        default: 0
    },
    purchases: [purchaseSchema],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Referral', referralSchema);
