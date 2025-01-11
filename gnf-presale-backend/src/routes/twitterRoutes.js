const express = require('express');
const router = express.Router();
const axios = require('axios');

// Cache for rate limit management
const cache = {
    lastRequestTime: 0,
    minimumInterval: 5000 // 5 seconds between requests
};

router.post('/verify-follow', async (req, res) => {
    try {
        // Rate limit check
        const now = Date.now();
        if (now - cache.lastRequestTime < cache.minimumInterval) {
            return res.status(429).json({
                success: false,
                message: 'Please wait a few seconds before trying again',
                retryAfter: Math.ceil((cache.lastRequestTime + cache.minimumInterval - now) / 1000)
            });
        }
        cache.lastRequestTime = now;

        const { username } = req.body;
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Twitter username is required'
            });
        }

        const bearerToken = process.env.TWITTER_BEARER_TOKEN;
        const targetUsername = process.env.TWITTER_USERNAME;

        // First get the target account ID (your account)
        const targetResponse = await axios.get(
            `https://api.twitter.com/2/users/by/username/${targetUsername}`,
            {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`
                }
            }
        );

        const targetId = targetResponse.data.data.id;

        // Then get the user's ID and check if they follow the target
        const userResponse = await axios.get(
            `https://api.twitter.com/2/users/by/username/${username.replace('@', '')}`,
            {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`
                }
            }
        );

        if (!userResponse.data.data) {
            return res.json({
                success: false,
                message: 'Twitter user not found'
            });
        }

        const userId = userResponse.data.data.id;

        // Check follow status
        const followResponse = await axios.get(
            `https://api.twitter.com/2/users/${userId}/following/${targetId}`,
            {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`
                }
            }
        ).then(() => true)
        .catch(error => {
            if (error.response && error.response.status === 404) {
                return false;
            }
            throw error;
        });

        return res.json({
            success: true,
            isFollowing: followResponse,
            username: username
        });

    } catch (error) {
        console.error('Twitter API Error:', {
            status: error?.response?.status,
            message: error?.response?.data?.detail,
            headers: error?.response?.headers
        });

        if (error?.response?.status === 429) {
            const resetTime = error?.response?.headers?.['x-rate-limit-reset'];
            const waitSeconds = resetTime ? Math.ceil((parseInt(resetTime) * 1000 - Date.now()) / 1000) : 60;
            
            return res.status(429).json({
                success: false,
                message: 'Twitter API rate limit reached. Please try again later.',
                retryAfter: waitSeconds,
                retryAt: new Date(Date.now() + (waitSeconds * 1000)).toISOString()
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Twitter verification failed',
            error: error?.response?.data?.detail || error.message
        });
    }
});

module.exports = router;
