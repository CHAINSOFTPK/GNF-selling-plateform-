import React from 'react';
import { motion } from 'framer-motion';
import { formatNumber } from '../utils/formatters';
import { TokenWithDetails } from '../types/token';
import VectorButton from './VectorButton';
import { FaChevronRight } from 'react-icons/fa'; // Add this import

interface TokenCardProps {
    token: TokenWithDetails;
    onBuyClick: () => void;
    onVerifyClick: () => void;  // Add this prop
    isButtonDisabled: boolean;
    getButtonText: (token: TokenWithDetails) => string;
}

const TokenCard: React.FC<TokenCardProps> = ({
    token,
    onBuyClick,
    onVerifyClick,  // Add this prop
    isButtonDisabled,
    getButtonText
}) => {
    const handleClick = () => {
        const buttonText = getButtonText(token);
        
        // If button says "Verify Social Media", show verification modal
        if (buttonText === 'Verify Social Media') {
            onVerifyClick();
        } else if (buttonText === 'Buy Now') {
            // If button says "Buy Now", proceed with purchase
            onBuyClick();
        }
        // If "Verification Pending", the button should be disabled anyway
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/10 shadow-2xl"
        >
            {/* Card Header with Gradient */}
            <div 
                className="p-8"
                style={{
                    background: 'linear-gradient(135deg, #0194FC 0%, #300855 100%)',
                }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                            {token.icon}
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-white mb-2">
                                {token.symbol}
                            </h3>
                            <p className="text-white/80 text-sm">
                                {token.description}
                            </p>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        ${token.price}
                    </div>
                </div>
                
                {/* Token Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-white/80 text-sm mb-1">Total Supply</div>
                        <div className="text-white font-bold text-lg">
                            {formatNumber(token.totalSupply)}
                        </div>
                    </div>
                    {token.vestingPeriod && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-white/80 text-sm mb-1">Vesting Period</div>
                            <div className="text-white font-bold text-lg">
                                {token.vestingPeriod === 365 ? '1 Year' : '3 Years'}
                            </div>
                        </div>
                    )}
                    {token.maxPerWallet && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <div className="text-white/80 text-sm mb-1">Max Per Wallet</div>
                            <div className="text-white font-bold text-lg">
                                {token.maxPerWallet}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Updated Action Button with Vector Styling */}
            <VectorButton
                variant="primary"
                showGlow
                onClick={handleClick}  // Use the handleClick function
                disabled={isButtonDisabled}
                className="w-full py-4 px-6 text-lg group"
            >
                {getButtonText(token)}
                <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
            </VectorButton>
        </motion.div>
    );
};

export default TokenCard;
