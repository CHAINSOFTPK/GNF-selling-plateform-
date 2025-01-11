import React from 'react';
import { TokenStats } from '../services/tokenService';
import { formatNumber } from '../utils/formatters';

interface TokenPurchaseCardProps {
    token: TokenStats;
    onPurchase: (symbol: string, amount: number) => void;
    disabled?: boolean;
}

const TokenPurchaseCard: React.FC<TokenPurchaseCardProps> = ({ token, onPurchase, disabled }) => {
    return (
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-[#08B4A6]/20">
            <h3 className="text-2xl font-bold mb-4">{token.symbol}</h3>
            <div className="space-y-2">
                <p>Price: ${token.price}</p>
                <p>Available: {formatNumber(token.remaining)}</p>
                {token.maxPerWallet && (
                    <p>Max per wallet: {token.maxPerWallet}</p>
                )}
                {token.vestingPeriod > 0 && (
                    <p>Vesting: {token.vestingPeriod} days</p>
                )}
                <button
                    onClick={() => onPurchase(token.symbol, 0)}
                    disabled={disabled}
                    style={{ backgroundColor: '#08B4A6' }}
                    className="w-full mt-4 text-white py-2 rounded-lg disabled:opacity-50"
                >
                    Purchase
                </button>
            </div>
        </div>
    );
};

export default TokenPurchaseCard;
