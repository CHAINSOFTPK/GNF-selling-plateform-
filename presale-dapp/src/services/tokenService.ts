import axios from 'axios';
import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS } from '../config/networks';
import { getNativeTokenPrice, convertNativeTokenToUSD, convertUSDToNativeToken } from './priceService';

// Set API base URL manually
const API_BASE_URL = 'https://api.gnfstore.com/api';

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

export const getTokenPrice = (tokenSymbol: string): number => {
    const TOKEN_PRICES = {
        GNF10: 0.2,     // $0.20 per token
        GNF1000: 0.6,   // $0.60 per token
        GNF10000: 0.15  // $0.15 per token
    };
    return TOKEN_PRICES[tokenSymbol as keyof typeof TOKEN_PRICES] || 0;
};

export const purchaseToken = async (
    walletAddress: string,
    tokenSymbol: string,
    amount: number,
    paymentTxHash: string,
    paymentToken: string // Now includes 'NATIVE'
): Promise<{ success: boolean; message?: string; data?: any }> => {
    try {
        const tokenPrice = getTokenPrice(tokenSymbol);
        if (!tokenPrice) {
            throw new Error('Invalid token symbol');
        }

        // Calculate tokens differently based on payment method
        let usdAmount: number;
        if (paymentToken === 'NATIVE') {
            // Get real-time price and convert
            usdAmount = await convertNativeTokenToUSD(amount.toString(), 'MATIC');
            console.log('Native token conversion:', {
                nativeAmount: amount,
                currentPrice: await getNativeTokenPrice('MATIC'),
                usdValue: usdAmount
            });
        } else {
            // For USDT, amount is already in USD
            usdAmount = amount;
        }

        // Calculate tokens based on USD value
        const tokensToReceive = usdAmount / tokenPrice;

        console.log('Purchase calculation:', {
            paymentMethod: paymentToken,
            nativeAmount: paymentToken === 'NATIVE' ? amount : null,
            usdAmount,
            tokenPrice,
            tokensToReceive
        });

        // Convert tokens to wei (18 decimals)
        const tokenAmountInWei = ethers.utils.parseUnits(
            tokensToReceive.toFixed(8),
            18
        ).toString();

        // Convert USD amount to smallest unit (6 decimals)
        const usdAmountInSmallestUnit = Math.round(usdAmount * 1000000).toString();

        console.log('Purchase details:', {
            usdAmount,
            tokenPrice,
            tokensToReceive,
            tokenAmountInWei
        });

        const response = await axios.post(`${API_BASE_URL}/tokens/purchase`, {
            walletAddress,
            tokenSymbol,
            amount: usdAmountInSmallestUnit, // USD amount in smallest unit
            tokenAmount: tokenAmountInWei, // Actual token amount in wei
            paymentToken,
            paymentTxHash,
            referrer: null,
            bonusAmount: Math.round(usdAmount * 0.02 * 1000000).toString() // Convert bonus to smallest unit too
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
