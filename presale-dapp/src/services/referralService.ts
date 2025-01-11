import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

export interface ReferralStats {
    total: number;
    bonus: number;
    referrals: number;
}

export const saveReferral = async (referrer: string, referred: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/referrals/save`, { referrer, referred });
        return response.data;
    } catch (error) {
        console.error('Error saving referral:', error);
        throw error;
    }
};

export const updateBonus = async (referrer: string, purchaseAmount: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/referrals/updateBonus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ referrer, purchaseAmount })
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating bonus:', error);
        throw error;
    }
};

export const getReferralsByAddress = async (address: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/referrals/${address}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching referrals:', error);
        return [];
    }
};

export const getReferralStats = async (address: string): Promise<ReferralStats> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/referrals/stats/${address}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching referral stats:', error);
        return {
            total: 0,
            bonus: 0,
            referrals: 0
        };
    }
};
