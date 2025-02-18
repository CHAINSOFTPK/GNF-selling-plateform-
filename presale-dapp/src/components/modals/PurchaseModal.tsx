import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaDollarSign } from 'react-icons/fa';
import { formatNumber } from '../../utils/formatters';
import { USDTIcon, BNBIcon, MaticIcon, AvaxIcon } from '../icons/PaymentIcons';
import { SUPPORTED_NETWORKS } from '../../config/networks';
import { useChainId } from 'wagmi';
import { HexagonPattern, WavePattern, DiagonalAccent, GlowEffect } from '../vectors/ModalVectors';
import VectorButton from '../VectorButton';
import { getTokenPrice } from '../../services/tokenService';

// Add CircuitPattern component
const CircuitPattern = ({ className = '' }) => (
    <svg className={className} viewBox="0 0 100 100" fill="none">
        <path d="M10,50 Q30,30 50,50 T90,50" stroke="currentColor" strokeWidth="0.5" fill="none"/>
        <circle cx="10" cy="50" r="2" fill="currentColor"/>
        <circle cx="50" cy="50" r="2" fill="currentColor"/>
        <circle cx="90" cy="50" r="2" fill="currentColor"/>
    </svg>
);

interface PurchaseModalProps {
    selectedToken: string | null;
    onClose: () => void;
    amount: string;
    onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    paymentToken: string;
    onPaymentTokenChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    usdValue: string;
    receivedAmount: string;
    loading: boolean;
    isApproving: boolean;
    hasAllowance: boolean;
    onApprove: () => void;
    onPurchaseConfirm: () => void;
    paymentOptions: Array<{
        type: string;
        symbol: string;
        icon: React.ReactNode;
    }>;
    maxAmount?: string;
}

const DiagonalCut: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`absolute w-full h-40 overflow-hidden ${className}`}>
        <div className="w-full h-full bg-gradient-to-r from-[#0194FC]/10 to-[#300855]/10 transform -skew-y-6" />
    </div>
);

const PurchaseModal: React.FC<PurchaseModalProps> = ({
    selectedToken,
    onClose,
    amount,
    onAmountChange,
    paymentToken,
    onPaymentTokenChange,
    usdValue,
    receivedAmount,
    loading,
    isApproving,
    hasAllowance,
    onApprove,
    onPurchaseConfirm,
    paymentOptions,
    maxAmount
}) => {
    const chainId = useChainId();
    const supportedNetwork = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);

    const getPaymentIcon = (type: string) => {
        switch(type.toUpperCase()) {
            case 'USDT':
                return <USDTIcon />;
            case 'BNB':
            case 'NATIVE':
                if (chainId === 56) return <BNBIcon />;
                if (chainId === 137) return <MaticIcon />;
                if (chainId === 43114) return <AvaxIcon />;
                return <BNBIcon />;
            default:
                return <USDTIcon />;
        }
    };

    // Add dedicated handler for payment token selection
    const handlePaymentChange = (type: string) => {
        const event = { target: { value: type } } as React.ChangeEvent<HTMLSelectElement>;
        onPaymentTokenChange(event);
    };

    // Add dedicated handler for approval/purchase
    const handleAction = () => {
        if (paymentToken !== 'NATIVE' && !hasAllowance) {
            onApprove();
        } else {
            onPurchaseConfirm();
        }
    };

    // Updated input validation helper to allow decimal values
    const validateInput = (value: string) => {
        // Allow empty input, single dot, and "0."
        if (value === '' || value === '.' || value === '0.') return true;
        
        // Allow any number of leading zeros followed by decimal and up to 6 decimal places
        const regex = /^[0-9]*\.?[0-9]{0,6}$/;
        return regex.test(value);
    };

    // Updated amount handler with better decimal handling
    const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Allow backspace and empty input
        if (value === '') {
            onAmountChange(e);
            return;
        }

        // Allow initial "0." input
        if (value === '0' || value === '0.' || value === '.') {
            onAmountChange({ ...e, target: { ...e.target, value: value === '.' ? '0.' : value } });
            return;
        }

        // Validate input format
        if (!validateInput(value)) return;

        // Remove leading zeros unless it's a decimal (e.g., 0.01)
        let formattedValue = value;
        if (value.length > 1 && value[0] === '0' && value[1] !== '.') {
            formattedValue = value.replace(/^0+/, '');
        }

        onAmountChange({ ...e, target: { ...e.target, value: formattedValue } });
    };

    // Add token price calculation
    const calculateTokenAmount = (usdValue: string): string => {
        if (!selectedToken || !usdValue) return '0';
        const tokenPrice = getTokenPrice(selectedToken);
        if (!tokenPrice) return '0';
        const tokenAmount = parseFloat(usdValue) / tokenPrice;
        return tokenAmount.toFixed(4);
    };

    // Update preview section to use the new calculation
    const tokenPreview = calculateTokenAmount(usdValue);

    if (!selectedToken) return null;

    return (
        <motion.div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4 backdrop-blur-lg">
            <motion.div className="bg-[#0f172a] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-white/20 relative">
                {/* Move decorative elements even lower in z-index */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <DiagonalAccent />
                    <HexagonPattern className="absolute top-0 right-0 w-40 h-40 text-white/5 transform rotate-45" />
                    <HexagonPattern className="absolute bottom-0 left-0 w-40 h-40 text-white/5 transform -rotate-45" />
                    <WavePattern className="absolute top-1/2 left-0 w-full text-white/5" />
                    <GlowEffect />
                </div>

                {/* Increase z-index for all interactive elements */}
                <div className="relative z-20">
                    {/* Vector-styled Header */}
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0194FC] to-[#300855] transform -skew-y-3" />
                        <div className="relative px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        Buy GNF
                                    </h3>
                                </div>
                                <motion.button
                                    whileHover={{ rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20"
                                >
                                    <FaTimes className="text-white" size={16} />
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Updated Body with Vector Elements */}
                    <div className="p-6 space-y-4">
                        {/* Enhanced Amount Input */}
                        <div className="space-y-3 relative z-30">
                            <label className="block text-base font-medium text-white/90">
                                Amount
                            </label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0194FC] to-[#300855] rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur-md"></div>
                                <input
                                    type="text" // Changed from "number" to "text"
                                    value={amount}
                                    onChange={handleAmountInput}
                                    pattern="[0-9]*[.]?[0-9]*" // Add pattern for numeric input
                                    inputMode="decimal" // Better for mobile keyboards
                                    className="relative w-full px-4 py-4 bg-[#1e293b] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0194FC] text-white placeholder-white/40 text-lg"
                                    placeholder="0.000"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 flex items-center gap-2 pointer-events-none">
                                    <FaDollarSign size={18} />
                                    <span className="font-medium">USD</span>
                                </div>
                            </div>
                            <p className="text-xs text-white/60">
                                Min: $0.000001 USD
                            </p>
                            {maxAmount && (
                                <p className="text-sm text-white/60 flex items-center gap-2">
                                    <span className="text-[#0194FC]">ℹ</span>
                                    Max: {paymentToken === 'NATIVE' 
                                        ? `${maxAmount} ${supportedNetwork?.nativeCoin}` 
                                        : `$${maxAmount} USD`}
                                </p>
                            )}
                        </div>

                        {/* Updated Payment Method Selection */}
                        <div className="space-y-3 relative z-30">
                            <label className="block text-base font-medium text-white/90">
                                Select Payment Method
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {paymentOptions.map(option => (
                                    <motion.button
                                        key={option.type}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handlePaymentChange(option.type)}
                                        className={`relative flex items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                                            paymentToken === option.type
                                                ? 'bg-gradient-to-r from-[#0194FC] to-[#0182e0] border-transparent text-white shadow-lg'
                                                : 'bg-[#1e293b] border-white/10 text-white/80 hover:bg-[#1e293b]/80'
                                        }`}
                                    >
                                        {getPaymentIcon(option.type)}
                                        <span className="font-medium">{option.symbol}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Clear Preview Box */}
                        <div className="relative">
                            <div className="p-6 rounded-xl bg-[#1e293b] border border-white/10 relative z-10">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60">You will receive</span>
                                        <span className="text-white font-bold text-lg">
                                            {formatNumber(tokenPreview)} GNF
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60">Total in USD</span>
                                        <span className="text-white font-medium">
                                            ${parseFloat(usdValue || '0').toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative elements behind content */}
                            <div className="absolute inset-0 rounded-xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0194FC]/5 to-[#300855]/5" />
                                <CircuitPattern className="absolute bottom-0 right-0 w-32 h-32 text-white/5 transform rotate-90" />
                            </div>
                        </div>

                        {/* Updated Action Button */}
                        <div className="relative z-30">
                            <VectorButton
                                variant="primary"
                                showGlow
                                onClick={handleAction}
                                disabled={loading || !amount || (paymentToken !== 'NATIVE' && !hasAllowance && isApproving)}
                                className="w-full py-4 relative"
                            >
                                {loading || isApproving ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>{isApproving ? `Approving ${paymentToken}...` : 'Processing...'}</span>
                                    </div>
                                ) : (
                                    <span>{paymentToken !== 'NATIVE' && !hasAllowance ? `Approve ${paymentToken}` : 'Confirm Purchase'}</span>
                                )}
                            </VectorButton>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default PurchaseModal;
