const mongoose = require('mongoose');

const tokenBalanceSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    tokenSymbol: {
        type: String,
        required: true,
        enum: ['GNF10'] // We only track GNF10
    },
    balance: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient queries
tokenBalanceSchema.index({ walletAddress: 1, tokenSymbol: 1 }, { unique: true });

module.exports = mongoose.model('TokenBalance', tokenBalanceSchema);
