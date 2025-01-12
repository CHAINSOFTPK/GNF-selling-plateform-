import { API_BASE_URL } from '../config/constants';
import axios from 'axios';
import { ethers } from 'ethers';

export interface TokenStats {
    symbol: string;
    price: number;
    totalSupply: number;
    soldAmount: number;
    remaining: number;
    maxPerWallet?: number;
    vestingPeriod: number;
}

// Add token decimals mapping
export const TOKEN_DECIMALS: { [key: string]: number } = {
    USDT: 6,
    BUSD: 18,
    USDC: 6,
    // Add other tokens as needed
};

export const getTokenStats = async (): Promise<TokenStats[]> => {
    const response = await fetch(`${API_BASE_URL}/tokens/stats`);
    const data = await response.json();
    return data.data;
};

// Update the purchaseToken function to handle paymentToken parameter
export const purchaseToken = async (
    walletAddress: string,
    tokenSymbol: string,
    amount: number,
    paymentTxHash: string,
    paymentToken: string // Add this parameter
): Promise<{ success: boolean; message?: string; data?: any }> => {
    try {
        // Convert the USD amount to payment token amount considering decimals
        const decimals = TOKEN_DECIMALS[paymentToken] || 18;
        const parsedAmount = ethers.utils.parseUnits(amount.toString(), decimals);

        const response = await axios.post(`${API_BASE_URL}/tokens/purchase`, {
            walletAddress,
            tokenSymbol,
            amount: amount.toString(), // Original USD amount
            tokenAmount: parsedAmount.toString(), // Token amount with decimals
            paymentToken,
            paymentTxHash,
            referrer: null,
            bonusAmount: amount * 0.02 // 2% bonus
        });

        if (response.data.success) {
            return {
                success: true,
                data: response.data.data
            };
        } else {
            throw new Error(response.data.message || 'Purchase failed');
        }
    } catch (error: any) {
        console.error('Error purchasing token:', error);
        return {
            success: false,
            message: error.response?.data?.message || error.message || 'Purchase failed'
        };
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
