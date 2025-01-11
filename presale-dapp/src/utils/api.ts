import { API_BASE_URL } from '../config/constants';

interface TransferResponse {
    status: 'success' | 'error';
    message: string;
    data?: {
        transactionHash: string;
        from: string;
        to: string;
        amount: string;
        blockNumber: number;
        gasUsed: number;
    };
}

interface ReferralData {
    referralUrl: string;
    referrals: Referral[];
}

interface Referral {
    id: string;
    email: string;
    status: string;
    address: string;
    gnfBought: number;
}

interface ReferralStats {
    total: number;
    bonus: number;
    referrals: number;
}

interface TokenPurchase {
    amount: string;
    date: string;
    transactionHash: string;
}

export const transferTokens = async (
    to: string, 
    amount: string, 
    tokenType: string,
    referrer?: string | null
): Promise<TransferResponse> => {
    try {
        const response = await fetch(`${API_BASE_URL}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                to, 
                amount, 
                tokenType,
                referrer 
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in transferTokens:', error);
        throw error;
    }
};

// Update getReferralData to use wallet address
export const getReferralData = async (walletAddress: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/referrals/${walletAddress}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
            ...data,
            referralUrl: `${window.location.origin}?ref=${walletAddress}`
        };
    } catch (error) {
        console.error('Error fetching referral data:', error);
        throw error;
    }
};

export const getReferralStats = async (address: string): Promise<ReferralStats> => {
    try {
        const response = await fetch(`${API_BASE_URL}/referrals/stats/${address}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching referral stats:', error);
        throw error;
    }
};


export const getTokenPurchases = async (address: string): Promise<TokenPurchase[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/purchases/${address}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching token purchases:', error);
        throw error;
    }
};

export const saveReferral = async (referrer: string, referred: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/referrals/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ referrer, referred }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error saving referral:', error);
        throw error;
    }
};

export const updateReferralBonus = async (referrer: string, purchaseAmount: string) => {
    try {
        const response = await fetch(`${API_BASE_URL}/referrals/bonus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                referrer, 
                purchaseAmount,
                bonusPercentage: 0.02 // 2%
            }),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating referral bonus:', error);
        throw error;
    }
};

// Remove duplicate getTokenPurchases function and unnecessary export