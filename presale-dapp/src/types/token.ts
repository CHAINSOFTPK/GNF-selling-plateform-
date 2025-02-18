import { ReactNode } from 'react';

export interface TokenConfig {
    symbol: string;
    price: number;
    maxPerWallet?: number;
    totalSupply: number;
    vestingPeriod?: number;
    requiresSocialVerification?: boolean;
    description: string;
    bgColor: string;
    icon: ReactNode;
    benefits: string[];
}

export interface TokenWithDetails extends TokenConfig {
    key: string;
    symbol: string;
}

export type VerificationStatus = 'none' | 'pending' | 'verified';

export interface SocialVerificationProps {
    isOpen: boolean;
    onClose: () => void;
    account: string;
    hasSubmitted: boolean;
    setHasSubmitted: (value: boolean) => void;
    setVerificationStatus: (status: VerificationStatus) => void;
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
