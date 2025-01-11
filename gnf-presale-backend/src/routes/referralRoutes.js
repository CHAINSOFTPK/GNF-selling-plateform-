const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const User = require('../models/User');

// Save referral
router.post('/save', async (req, res) => {
    const { referrer, referred } = req.body;

    try {
        // Validate addresses
        if (!referrer || !referred) {
            return res.status(400).json({ 
                success: false, 
                message: 'Both referrer and referred addresses are required' 
            });
        }

        // Convert addresses to lowercase for consistency
        const normalizedReferrer = referrer.toLowerCase();
        const normalizedReferred = referred.toLowerCase();

        // Prevent self-referral
        if (normalizedReferrer === normalizedReferred) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot refer yourself' 
            });
        }

        // Check if referral already exists
        const existingReferral = await Referral.findOne({ 
            referrer: normalizedReferrer, 
            referred: normalizedReferred 
        });

        if (existingReferral) {
            return res.json({ 
                success: true, 
                referral: existingReferral,
                message: 'Referral already recorded'
            });
        }

        // Create new referral
        const referral = new Referral({ 
            referrer: normalizedReferrer, 
            referred: normalizedReferred,
            timestamp: new Date()
        });
        await referral.save();

        res.json({ 
            success: true, 
            referral,
            message: 'Referral recorded successfully'
        });
    } catch (error) {
        console.error('Error saving referral:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Get referrals by address
router.get('/:address', async (req, res) => {
    try {
        const referrals = await Referral.find({ referrer: req.params.address.toLowerCase() });
        res.json({ success: true, data: referrals });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get referral stats
router.get('/stats/:address', async (req, res) => {
    try {
        const referrals = await Referral.find({ referrer: req.params.address.toLowerCase() });
        const total = referrals.length;
        const bonus = referrals.reduce((sum, referral) => sum + referral.bonusAmount, 0);

        res.json({ success: true, total, bonus, referrals });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get referral earnings
router.get('/earnings/:address', async (req, res) => {
    try {
        const referrals = await Referral.find({ 
            referrer: req.params.address.toLowerCase() 
        });

        const earnings = {
            totalBonus: 0,
            recentPurchases: [],
            referralCount: referrals.length
        };

        referrals.forEach(referral => {
            earnings.totalBonus += referral.bonusAmount;
            // Get recent purchases (last 10)
            earnings.recentPurchases.push(...(referral.purchases || [])
                .slice(-10)
                .map(p => ({
                    ...p.toObject(),
                    referred: referral.referred
                }))
            );
        });

        // Sort recent purchases by timestamp
        earnings.recentPurchases.sort((a, b) => b.timestamp - a.timestamp);
        earnings.recentPurchases = earnings.recentPurchases.slice(0, 10);

        res.json({
            success: true,
            data: earnings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
