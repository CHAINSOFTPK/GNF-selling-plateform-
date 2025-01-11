import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export const createOrGetUser = async (walletAddress: string, referredBy?: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/create-or-get`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress, referredBy })
        });
        const data = await response.json();
        console.log('Response from createOrGetUser:', data); // Add this line to log the response
        return data;
    } catch (error) {
        console.error('Error in createOrGetUser:', error);
        throw error;
    }
};

export const updateUserPurchase = async (walletAddress: string, purchaseAmount: number) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/update-purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ walletAddress, purchaseAmount })
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating user purchase:', error);
        throw error;
    }
};

export const getUserStats = async (walletAddress: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/stats?walletAddress=${walletAddress}`);
        return await response.json();
    } catch (error) {
        console.error('Error getting user stats:', error);
        throw error;
    }
};

export const getUsersByReferrer = async (referrerAddress: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/users/by-referrer?referrerAddress=${referrerAddress}`);
        return await response.json();
    } catch (error) {
        console.error('Error getting referred users:', error);
        throw error;
    }
};

export const getUserPurchases = async (walletAddress: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tokens/purchases/${walletAddress}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user purchases:', error);
        return { data: [] };
    }
};

export const getUserTotalPurchases = async (walletAddress: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tokens/total-purchases/${walletAddress}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching total purchases:', error);
        return { totalAmount: 0 };
    }
};
