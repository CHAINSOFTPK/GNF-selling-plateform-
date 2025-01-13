import axios from 'axios';
import type { PlatformStats } from '../types/admin';

// Add API base URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.gnfstore.com/api';

// Add error type
interface ApiError {
    message: string;
    status?: number;
}

export const getPendingVerifications = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/pending-verifications`);
        return response.data;
    } catch (error: any) {
        const apiError: ApiError = {
            message: error.response?.data?.message || 'Failed to fetch verifications',
            status: error.response?.status
        };
        console.error('Error fetching pending verifications:', apiError);
        throw apiError;
    }
};

export const approveVerification = async (userId: string, platform: 'twitter' | 'discord') => {
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/approve-verification`, {
            userId,
            platform
        });
        return response.data;
    } catch (error: any) {
        const apiError: ApiError = {
            message: error.response?.data?.message || 'Failed to approve verification',
            status: error.response?.status
        };
        console.error('Error approving verification:', apiError);
        throw apiError;
    }
};

export const getPlatformStats = async (): Promise<PlatformStats> => {
    try {
        // Using the correct endpoint path
        const response = await axios.get<PlatformStats>(`${API_BASE_URL}/admin/platform-stats`);
        if (!response.data) {
            throw new Error('No data received from server');
        }
        return response.data;
    } catch (error: any) {
        const apiError: ApiError = {
            message: error.response?.data?.message || 'Failed to fetch platform stats',
            status: error.response?.status
        };
        console.error('Error fetching platform stats:', apiError);
        throw apiError;
    }
};
