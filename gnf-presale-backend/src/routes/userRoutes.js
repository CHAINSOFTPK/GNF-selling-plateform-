const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');

// Initialize user
router.post('/initialize', async (req, res) => {
    try {
        const { walletAddress, referrer } = req.body;
        
        // Normalize addresses
        const normalizedAddress = walletAddress.toLowerCase();
        const normalizedReferrer = referrer ? referrer.toLowerCase() : null;

        // Find or create user
        let user = await User.findOne({ walletAddress: normalizedAddress });
        
        if (!user) {
            user = new User({
                walletAddress: normalizedAddress,
                referrer: normalizedReferrer
            });
            await user.save();

            // If there's a referrer, create the referral record
            if (normalizedReferrer && normalizedReferrer !== normalizedAddress) {
                const existingReferral = await Referral.findOne({
                    referrer: normalizedReferrer,
                    referred: normalizedAddress
                });

                if (!existingReferral) {
                    const referral = new Referral({
                        referrer: normalizedReferrer,
                        referred: normalizedAddress,
                        timestamp: new Date()
                    });
                    await referral.save();
                }
            }
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error initializing user:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create or get user
router.post('/create-or-get', async (req, res) => {
    try {
        const { walletAddress, referredBy } = req.body;
        console.log('Received request to create or get user:', req.body); // Add this line to log the request body
        
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        
        if (!user) {
            user = new User({
                walletAddress: walletAddress.toLowerCase(),
                referredBy: referredBy?.toLowerCase()
            });
            await user.save();
            console.log('User created:', user); // Add this line to log the created user
        } else {
            console.log('User found:', user); // Add this line to log the found user
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error in /create-or-get:', error); // Add this line to log the error
        res.status(500).json({ error: error.message });
    }
});

// Update user purchase
router.post('/update-purchase', async (req, res) => {
    try {
        const { walletAddress, purchaseAmount } = req.body;
        const user = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            { $inc: { totalPurchases: purchaseAmount } },
            { new: true }
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
