import { ReactNode } from 'react';

export interface TokenConfig {
    symbol: string;
    price: number;
    maxPerWallet?: number;
    totalSupply: number;
    requiresSocialVerification?: boolean;
    description: string;
    vestingPeriod?: number;
    bgColor: string;
    icon: ReactNode;
    benefits: string[];
}

export interface TokenStats extends TokenConfig {
    soldAmount: number;
    remaining: number;
}

export interface SocialVerificationResponse {
    success: boolean;
    data: {
        twitter: { isVerified: boolean };
        discord: { isVerified: boolean };
    };
}
