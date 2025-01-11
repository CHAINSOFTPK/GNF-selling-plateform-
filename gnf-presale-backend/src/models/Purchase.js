const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true,
        index: true // Add index for better query performance
    },
    tokenSymbol: {
        type: String,
        required: true,
        enum: ['GNF10', 'GNF1000', 'GNF10000']
    },
    amount: {
        type: Number,
        required: true
    },
    paymentTxHash: {
        type: String,
        required: true
    },
    transferTxHash: {
        type: String,
        default: null
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
        index: true // Add index for better query performance
    },
    claimable: {
        type: Boolean,
        default: false
    },
    claimDate: {
        type: Date,
        default: null
    },
    claimed: {
        type: Boolean,
        default: false
    },
    referrer: {
        type: String,
        lowercase: true,
        sparse: true // Add sparse index
    }
});

module.exports = mongoose.model('Purchase', purchaseSchema);
