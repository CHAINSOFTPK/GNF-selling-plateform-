const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    walletAddress: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true
    },
    referrer: {
        type: String,
        lowercase: true,
        default: null
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    totalPurchases: {
        type: Number,  // This will now store USDT amount
        default: 0
    },
    gnf100Bonus: {  // New field for GNF100 bonus
        type: Number,
        default: 0
    },
    referredBy: {
        type: String,
        lowercase: true
    },
    twitterHandle: String,
    discordHandle: String,
    socialVerification: {
        twitter: {
            handle: String,
            isVerified: { type: Boolean, default: false },
            submittedAt: Date,
            verifiedAt: Date
        },
        discord: {
            handle: String,
            isVerified: { type: Boolean, default: false },
            submittedAt: Date,
            verifiedAt: Date
        }
    },
    submissionStatus: {
        hasSubmitted: { type: Boolean, default: false },
        submittedAt: Date,
        lastChecked: Date,
        attempts: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('User', userSchema);
