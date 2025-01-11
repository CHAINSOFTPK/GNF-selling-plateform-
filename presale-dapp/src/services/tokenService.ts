import { API_BASE_URL } from '../config/constants';
import axios from 'axios';

export interface TokenStats {
    symbol: string;
    price: number;
    totalSupply: number;
    soldAmount: number;
    remaining: number;
    maxPerWallet?: number;
    vestingPeriod: number;
}

export const getTokenStats = async (): Promise<TokenStats[]> => {
    const response = await fetch(`${API_BASE_URL}/tokens/stats`);
    const data = await response.json();
    return data.data;
};

// Update the purchaseToken function to include txHash
export const purchaseToken = async (
    address: string,
    tokenType: string,
    amount: number,
    paymentTxHash: string,
    options?: { referrer?: string | null }
) => {
    try {
        // Calculate 2% bonus amount
        const bonusAmount = amount * 0.02;

        const response = await axios.post(`${API_BASE_URL}/tokens/purchase`, {
            address,
            tokenType,
            amount,
            paymentTxHash,
            referrer: options?.referrer || null,
            bonusAmount // Include bonus amount in request
        });
        return response.data;
    } catch (error) {
        console.error('Error purchasing token:', error);
        throw error;
    }
};

export const getClaimableTokens = async (walletAddress: string) => {
    const response = await fetch(`${API_BASE_URL}/tokens/claimable/${walletAddress}`);
    return await response.json();
};

export const claimTokens = async (purchaseId: string, walletAddress: string) => {
    const response = await fetch(`${API_BASE_URL}/tokens/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, walletAddress })
    });
    return await response.json();
};

// Add this function to handle social media verification submission
export const submitSocialHandles = async (
    walletAddress: string,
    twitterHandle?: string,
    discordHandle?: string
) => {
    const response = await fetch(`${API_BASE_URL}/social/submit-handles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, twitterHandle, discordHandle })
    });
    return await response.json();
};