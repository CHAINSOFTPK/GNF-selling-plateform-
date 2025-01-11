const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Submit handles for verification
router.post('/submit-handles', async (req, res) => {
    try {
        const { walletAddress, twitterHandle, discordHandle } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Wallet address is required'
            });
        }

        // Check if user has already submitted
        const existingUser = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (existingUser && existingUser.submissionStatus.hasSubmitted) {
            return res.status(400).json({
                success: false,
                message: 'Already submitted',
                submissionStatus: existingUser.submissionStatus
            });
        }

        const updateData = {
            $set: {
                'socialVerification.twitter.handle': twitterHandle,
                'socialVerification.twitter.submittedAt': new Date(),
                'socialVerification.discord.handle': discordHandle,
                'socialVerification.discord.submittedAt': new Date(),
                'submissionStatus.hasSubmitted': true,
                'submissionStatus.submittedAt': new Date(),
                'submissionStatus.attempts': 1
            }
        };

        const user = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            updateData,
            { new: true, upsert: true }
        );

        return res.json({
            success: true,
            message: 'Social handles submitted successfully',
            data: {
                submissionStatus: user.submissionStatus,
                socialVerification: user.socialVerification
            }
        });
    } catch (error) {
        console.error('Handle submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit handles',
            error: error.message
        });
    }
});

// Check submission status
router.get('/status/:walletAddress', async (req, res) => {
    try {
        const user = await User.findOne({
            walletAddress: req.params.walletAddress.toLowerCase()
        });

        if (!user) {
            return res.json({
                success: true,
                hasSubmitted: false,
                isVerified: false
            });
        }

        // Update lastChecked timestamp
        if (user.submissionStatus.hasSubmitted) {
            await User.updateOne(
                { walletAddress: req.params.walletAddress.toLowerCase() },
                { $set: { 'submissionStatus.lastChecked': new Date() } }
            );
        }

        return res.json({
            success: true,
            hasSubmitted: user.submissionStatus.hasSubmitted,
            submittedAt: user.submissionStatus.submittedAt,
            isVerified: user.socialVerification.twitter.isVerified && 
                       user.socialVerification.discord.isVerified,
            twitter: {
                handle: user.socialVerification.twitter.handle,
                isVerified: user.socialVerification.twitter.isVerified,
                verifiedAt: user.socialVerification.twitter.verifiedAt
            },
            discord: {
                handle: user.socialVerification.discord.handle,
                isVerified: user.socialVerification.discord.isVerified,
                verifiedAt: user.socialVerification.discord.verifiedAt
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to check status',
            error: error.message
        });
    }
});

// Get all pending verifications (Admin route)
router.get('/admin/pending', async (req, res) => {
    try {
        const pendingVerifications = await User.find({
            'submissionStatus.hasSubmitted': true,
            $or: [
                { 'socialVerification.twitter.isVerified': false },
                { 'socialVerification.discord.isVerified': false }
            ]
        }).select('-__v');

        return res.json({
            success: true,
            data: pendingVerifications
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pending verifications',
            error: error.message
        });
    }
});

// Update verification status (Admin route)
router.post('/admin/verify', async (req, res) => {
    try {
        const { walletAddress, platform, isVerified } = req.body;
        
        if (!['twitter', 'discord'].includes(platform)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid platform specified'
            });
        }

        const updateField = `socialVerification.${platform}`;
        const user = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            {
                $set: {
                    [`${updateField}.isVerified`]: isVerified,
                    [`${updateField}.verifiedAt`]: isVerified ? new Date() : null
                }
            },
            { new: true }
        );

        return res.json({
            success: true,
            message: `${platform} verification updated successfully`,
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update verification status',
            error: error.message
        });
    }
});

module.exports = router;
