const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        enum: ['GNF10', 'GNF1000', 'GNF10000']
    },
    contractAddress: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    totalSupply: {
        type: Number,
        required: true
    },
    soldAmount: {
        type: Number,
        default: 0
    },
    maxPerWallet: {
        type: Number
    },
    vestingPeriod: {
        type: Number, // in days
        default: 0
    }
});

module.exports = mongoose.model('Token', tokenSchema);
