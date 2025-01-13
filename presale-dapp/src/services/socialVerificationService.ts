import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.gnfstore.com/api';

export interface SocialVerificationStatus {
    twitter: {
        isVerified: boolean;
        username?: string;
    };
    discord: {
        isVerified: boolean;
        username?: string;
    };
    status: 'none' | 'pending' | 'verified';
}

export const checkSocialStatus = async (walletAddress: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/social/status/${walletAddress}`);
        console.log('Social status response:', response.data); // Debug log
        
        // Ensure consistent response structure
        return {
            success: true,
            data: {
                twitter: {
                    isVerified: response.data.twitter?.isVerified || false,
                    username: response.data.twitter?.handle
                },
                discord: {
                    isVerified: response.data.discord?.isVerified || false,
                    username: response.data.discord?.handle
                },
                hasSubmitted: response.data.hasSubmitted || false,
                status: response.data.status || 'none'
            },
            message: getStatusMessage(response.data)
        };
    } catch (error) {
        console.error('Error checking social status:', error);
        return {
            success: false,
            data: {
                twitter: { isVerified: false },
                discord: { isVerified: false },
                hasSubmitted: false,
                status: 'none'
            },
            message: 'Failed to check verification status'
        };
    }
};

const getStatusMessage = (data: any) => {
    if (data.twitter.isVerified && data.discord.isVerified) {
        return 'Your social media accounts are verified!';
    }
    if (data.hasSubmitted) {
        return 'Your verification is pending. Please wait.';
    }
    return 'Please verify your social media accounts.';
};

export const submitSocialHandles = async (
    walletAddress: string,
    twitterHandle: string,
    discordHandle: string
) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/social/submit-handles`, {
            walletAddress,
            twitterHandle,
            discordHandle
        });
        return response.data;
    } catch (error) {
        console.error('Error submitting handles:', error);
        throw error;
    }
};
