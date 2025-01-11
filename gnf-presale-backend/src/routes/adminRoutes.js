const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Token = require('../models/Token');

// Add detailed logging middleware
router.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Request Body:', req.body);

    const originalJson = res.json;
    res.json = function(data) {
        console.log('Response:', data);
        return originalJson.call(this, data);
    };
    
    next();
});

// Platform stats endpoint
router.get('/platform-stats', async (req, res) => {
    try {
        // Get total users
        const totalUsers = await User.countDocuments();

        // Get token sales stats
        const tokens = await Token.find({});
        const tokenSales = tokens.reduce((acc, token) => {
            acc[token.symbol] = token.soldAmount || 0;
            return acc;
        }, {});

        // Get total USDT raised
        const purchases = await Purchase.find();
        const totalUSDTRaised = purchases.reduce((sum, purchase) => {
            return sum + (purchase.amount || 0);
        }, 0);

        // Get active social verifications
        const pendingVerifications = await User.countDocuments({
            $or: [
                { 'socialVerification.twitter.isVerified': false },
                { 'socialVerification.discord.isVerified': false }
            ]
        });

        // Get recent transactions
        const recentTransactions = await Purchase.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('walletAddress amount tokenSymbol createdAt')
            .lean();

        const stats = {
            totalUsers,
            totalTokensSold: {
                GNF10: tokenSales.GNF10 || 0,
                GNF1000: tokenSales.GNF1000 || 0,
                GNF10000: tokenSales.GNF10000 || 0
            },
            totalUSDTRaised,
            activeSocialVerifications: pendingVerifications,
            totalPurchases: purchases.length,
            recentTransactions: recentTransactions.map(tx => ({
                id: tx._id.toString(),
                date: tx.createdAt,
                amount: tx.amount,
                tokenType: tx.tokenSymbol,
                walletAddress: tx.walletAddress
            }))
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching platform stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform stats',
            error: error.message
        });
    }
});

// Pending verifications endpoint
router.get('/pending-verifications', async (req, res) => {
    try {
        const users = await User.find({
            $or: [
                { 'socialVerification.twitter.handle': { $exists: true, $ne: '' } },
                { 'socialVerification.discord.handle': { $exists: true, $ne: '' } }
            ]
        }).select('walletAddress socialVerification');

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending verifications',
            error: error.message
        });
    }
});

// Approve verification endpoint
router.post('/approve-verification', async (req, res) => {
    try {
        const { userId, platform } = req.body;
        
        if (!['twitter', 'discord'].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid platform specified'
            });
        }

        const updateField = `socialVerification.${platform}.isVerified`;
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                $set: { 
                    [updateField]: true,
                    [`socialVerification.${platform}.verifiedAt`]: new Date()
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `${platform} verification approved`,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to approve verification',
            error: error.message
        });
    }
});

module.exports = router;
