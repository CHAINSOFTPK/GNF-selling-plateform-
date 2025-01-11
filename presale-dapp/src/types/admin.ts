export interface PlatformStats {
    totalUsers: number;
    totalTokensSold: {
        GNF10: number;
        GNF1000: number;
        GNF10000: number;
    };
    totalUSDTRaised: number;
    activeSocialVerifications: number;
    totalPurchases: number;
    recentTransactions: Array<{
        id: string;
        date: string;
        amount: number;
        tokenType: string;
        walletAddress: string;
    }>;
}

export interface Activity {
    type: 'purchase' | 'verification' | 'claim';
    timestamp: string;
    walletAddress: string;
    details: string;
    amount?: string;
    tokenType?: string;
}
