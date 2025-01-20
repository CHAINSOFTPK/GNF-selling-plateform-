/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { FaDollarSign, FaTimes } from 'react-icons/fa';
import { useWallet } from '../context/Web3Context';
import { formatNumber } from '../utils/formatters';
import { getTokenStats, purchaseToken, submitSocialHandles } from '../services/tokenService';
import { checkSocialStatus } from '../services/socialVerificationService';
import { TokenConfig } from '../types/token';
import { motion, AnimatePresence } from 'framer-motion';
import { checkAllowance, approveToken, transferToken, getTokenBalance, transferNativeToken, TokenType } from '../services/paymentService';
import axios from 'axios';
import { usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { validateAmount, safeParseFloat } from '../utils/validation';
import { SUPPORTED_NETWORKS } from '../config/networks';
import { convertNativeTokenToUSD } from '../services/priceService';
import ConnectWallet from './ConnectWallet';
import { useTokenBalance } from '../hooks/useTokenBalance';
import HowToBuy from './HowToBuy';
import Faqs from './Faqs';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.gnfstore.com/api';
const TOKEN_CONFIGS: Record<string, TokenConfig> = {
    GNF10: {
        symbol: 'GNF10',
        price: 0.2,
        maxPerWallet: 200,
        totalSupply: 500000,
        requiresSocialVerification: true,
        description: 'For verified social media followers',
        bgColor: 'bg-[#0194FC]',
        icon: <FaDollarSign className="text-3xl" />,
        benefits: ['Max Per Wallet: 200', 'Total Supply: 500,000']
    },
    GNF1000: {
        symbol: 'GNF1000',
        price: 0.6,
        totalSupply: 2000000,
        vestingPeriod: 365,
        description: '1 year vesting period',
        bgColor: 'bg-[#2563eb]',
        icon: <FaDollarSign className="text-3xl" />,
        benefits: ['Total Supply: 2,000,000', 'Vesting: 1 Year']
    },
    GNF10000: {
        symbol: 'GNF10000',
        price: 0.15,
        totalSupply: 3000000,
        vestingPeriod: 1095,
        description: '3 years vesting period',
        bgColor: 'bg-[#7c3aed]',
        icon: <FaDollarSign className="text-3xl" />,
        benefits: ['Total Supply: 3,000,000', 'Vesting: 3 Years']
    }
};

interface TokenWithDetails extends TokenConfig {
    key: string;
    symbol: string;
}

const TelegramBuy: React.FC = () => {
    const { account, connectWallet, currentNetwork } = useWallet();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const chainId = useChainId();
    const supportedNetwork = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);
    const { balance, tokenSymbol } = useTokenBalance();

    const isConnected = !!account;

    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [paymentToken, setPaymentToken] = useState<string>('USDT');
    const [selectedToken, setSelectedToken] = useState<string>('GNF10');
    const [socialVerified, setSocialVerified] = useState(false);
    const [tokens, setTokens] = useState<any[]>([]);
    const [receivedAmount, setReceivedAmount] = useState<string>('0');
    const [showSocialModal, setShowSocialModal] = useState(false);
    const [twitterHandle, setTwitterHandle] = useState('');
    const [discordHandle, setDiscordHandle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified'>('none');
    const [isApproving, setIsApproving] = useState(false);
    const [hasAllowance, setHasAllowance] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [currentGNF10Balance, setCurrentGNF10Balance] = useState<number>(0);
    const [remainingAllowance, setRemainingAllowance] = useState<number>(200);
    const [usdValue, setUsdValue] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'buy' | 'howtobuy' | 'faqs'>('buy');
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const PAYMENT_TOKEN_DECIMALS: Record<string, number> = {
        USDT: 6,
        BUSD: 18,
        GNF: 18,
    };

    const paymentOptions = supportedNetwork ? [
        {
            type: 'NATIVE',
            symbol: supportedNetwork.nativeCoin,
            icon: supportedNetwork.icon
        },
        {
            type: 'USDT',
            symbol: 'USDT',
            icon: '🟡'
        }
    ] : [];

    const updateGNF10Balance = async () => {
        if (!account) return;
        try {
            const balanceResponse = await axios.get(`${API_BASE_URL}/tokens/balance/${account}/GNF10`);
            setCurrentGNF10Balance(balanceResponse.data.balance || 0);
            setRemainingAllowance(200 - (balanceResponse.data.balance || 0));
        } catch (error) {
            console.error('Error updating GNF10 balance:', error);
        }
    };

    useEffect(() => {
        const calculateReceivedAmount = async () => {
            if (!amount || !selectedToken) return;

            const tokenConfig = TOKEN_CONFIGS[selectedToken as keyof typeof TOKEN_CONFIGS];
            let usdAmount = 0;

            if (paymentToken === 'NATIVE' && supportedNetwork) {
                usdAmount = await convertNativeTokenToUSD(amount, supportedNetwork.nativeCoin);
                setUsdValue(usdAmount.toFixed(2));
            } else {
                usdAmount = parseFloat(amount);
                setUsdValue(amount);
            }

            const calculated = usdAmount / tokenConfig.price;
            setReceivedAmount(calculated.toString());
        };

        calculateReceivedAmount();
    }, [amount, selectedToken, paymentToken, supportedNetwork]);

    useEffect(() => {
        const checkSocial = async () => {
            if (account) {
                try {
                    const response = await checkSocialStatus(account);
                    setSocialVerified(
                        response.data.twitter.isVerified && 
                        response.data.discord.isVerified
                    );
                } catch (error) {
                    console.error('Error checking social status:', error);
                    setSocialVerified(false);
                }
            }
        };

        checkSocial();
    }, [account]);

    useEffect(() => {
        const fetchTokenStats = async () => {
            try {
                const stats = await getTokenStats();
                setTokens(stats);
            } catch (error) {
                console.error('Error fetching token stats:', error);
            }
        };

        fetchTokenStats();
    }, []);

    useEffect(() => {
        const checkTokenAllowance = async () => {
            if (!account || !amount || !paymentToken || !chainId) return;
            
            if (paymentToken === 'NATIVE') {
                setHasAllowance(true);
                return;
            }

            try {
                const allowed = await checkAllowance(
                    paymentToken as TokenType,
                    account,
                    chainId
                );
                setHasAllowance(allowed);
            } catch (error) {
                console.error('Error checking allowance:', error);
                setHasAllowance(false);
            }
        };

        checkTokenAllowance();
    }, [account, amount, paymentToken, chainId]);

    useEffect(() => {
        const initializeTokens = async () => {
            try {
                const checkResponse = await axios.get(`${API_BASE_URL}/tokens/check-initialization`);
                if (!checkResponse.data.success) {
                    await axios.post(`${API_BASE_URL}/tokens/init-tokens`);
                }
                const stats = await getTokenStats();
                setTokens(stats);
            } catch (error) {
                console.error('Error initializing tokens:', error);
            }
        };

        initializeTokens();
    }, []);

    useEffect(() => {
        const checkSubmissionStatus = async () => {
            if (account) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/social/status/${account}`);
                    setHasSubmitted(response.data.hasSubmitted);
                    if (response.data.hasSubmitted) {
                        setVerificationStatus('pending');
                    }
                } catch (error) {
                    console.error('Error checking submission status:', error);
                }
            }
        };

        checkSubmissionStatus();
    }, [account]);

    useEffect(() => {
        const checkVerificationStatus = async () => {
            if (account) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/social/status/${account}`);
                    if (response.data.success) {
                        setHasSubmitted(response.data.hasSubmitted);
                        setSocialVerified(
                            response.data.twitter?.isVerified && 
                            response.data.discord?.isVerified
                        );
                        
                        if (response.data.hasSubmitted) {
                            if (response.data.twitter?.isVerified && response.data.discord?.isVerified) {
                                setVerificationStatus('verified');
                            } else {
                                setVerificationStatus('pending');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error checking verification status:', error);
                }
            }
        };

        checkVerificationStatus();
        
        const intervalId = setInterval(checkVerificationStatus, 30000);

        return () => clearInterval(intervalId);
    }, [account]);

    useEffect(() => {
        const fetchGNF10Balance = async () => {
            if (selectedToken === 'GNF10' && account) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/tokens/balance/${account}/GNF10`);
                    setCurrentGNF10Balance(response.data.balance || 0);
                    setRemainingAllowance(200 - (response.data.balance || 0));
                } catch (error) {
                    console.error('Error fetching GNF10 balance:', error);
                }
            }
        };

        fetchGNF10Balance();
    }, [selectedToken, account]);

    useEffect(() => {
        if (supportedNetwork) {
            setPaymentToken('NATIVE');
            setHasAllowance(true);
        }
    }, [supportedNetwork]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInitialLoading(false);
        }, 2000); // 2 seconds loading screen

        return () => clearTimeout(timer);
    }, []);

    const handleConnectWallet = async () => {
        if (!isConnected) {
            try {
                await connectWallet();
            } catch (error) {
                console.error('Failed to connect wallet:', error);
                toast.error('Failed to connect wallet');
            }
        }
    };

    const handleTokenButtonClick = (tokenKey: string) => {
        if (!isConnected) {
            handleConnectWallet();
            return;
        }
        setSelectedToken(tokenKey); // Directly set the token without conditions
    };

    const handleApprove = async () => {
        if (!amount || !account || !chainId) return;
        
        if (paymentToken === 'NATIVE') {
            setHasAllowance(true);
            return;
        }
        
        setIsApproving(true);
        try {
            if (!validateAmount(amount, selectedToken || '')) {
                throw new Error('Invalid amount');
            }

            await approveToken(paymentToken as TokenType, amount, chainId);
            setHasAllowance(true);
            toast.success(`${paymentToken} approved successfully`);
        } catch (error: any) {
            console.error('Approval error:', error);
            toast.error(error.message || 'Failed to approve token');
            setHasAllowance(false);
        } finally {
            setIsApproving(false);
        }
    };

    const handlePurchaseConfirm = async () => {
        if (!selectedToken || !amount || !account || !chainId) return;

        setLoading(true);
        let transferToastId = null;
        
        try {
            if (!validateAmount(amount, selectedToken)) {
                throw new Error('Invalid amount');
            }

            let usdAmount = parseFloat(usdValue);
            if (usdAmount <= 0) {
                throw new Error('Invalid amount');
            }

            if (selectedToken === 'GNF10') {
                const tokenAmount = usdAmount / TOKEN_CONFIGS.GNF10.price;
                if (tokenAmount > remainingAllowance) {
                    throw new Error(`Purchase would exceed maximum limit of 200 GNF10 tokens.`);
                }
            }

            const balance = await getTokenBalance(
                paymentToken as TokenType,
                account,
                chainId
            );
            const decimals = PAYMENT_TOKEN_DECIMALS[paymentToken] || 18;
            const parsedAmount = ethers.utils.parseUnits(amount, decimals);
            const parsedBalance = ethers.utils.parseUnits(balance, decimals);

            if (parsedBalance.lt(parsedAmount)) {
                throw new Error(`Insufficient ${paymentToken} balance`);
            }

            if (paymentToken !== 'NATIVE') {
                const hasAllowance = await checkAllowance(
                    paymentToken as TokenType,
                    account,
                    chainId
                );
                if (!hasAllowance) {
                    throw new Error(`Please approve ${paymentToken} spending first`);
                }
            }

            transferToastId = toast.info('Transferring payment...', { 
                autoClose: false, 
                toastId: 'transfer' 
            });

            const currentChainId = chainId;
            if (!currentChainId) throw new Error('Network not detected');

            let txHash: string;

            if (paymentToken === 'NATIVE') {
                txHash = await transferNativeToken(amount, chainId);
            } else {
                txHash = await transferToken(paymentToken as TokenType, amount, chainId);
            }

            toast.update(transferToastId, { 
                render: 'Payment confirmed! Processing purchase...', 
                type: 'info' 
            });

            const purchaseResult = await purchaseToken(
                account,
                selectedToken,
                safeParseFloat(amount),
                txHash,
                paymentToken
            );

            if (purchaseResult.success) {
                await handlePurchaseSuccess(selectedToken);
            } else {
                throw new Error(purchaseResult.message || 'Purchase failed');
            }

        } catch (error: any) {
            handlePurchaseError(error, transferToastId);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchaseSuccess = async (tokenSymbol: string) => {
        toast.success(
            tokenSymbol === 'GNF10' 
                ? 'Tokens transferred successfully!' 
                : 'Purchase successful! Tokens will be available after vesting period.'
        );
        
        setSelectedToken('GNF10'); // Reset to default token instead of null
        setAmount('');
        
        const stats = await getTokenStats();
        setTokens(stats);
        
        if (tokenSymbol === 'GNF10') {
            updateGNF10Balance();
        }
    };

    const handlePurchaseError = (error: any, toastId: string | number | null) => {
        if (toastId) toast.dismiss(toastId);
        toast.error(error.message || 'Purchase failed');
        console.error('Purchase error:', error);
    };

    const handleSocialVerification = async () => {
        if (!account) return;
        
        if (hasSubmitted) {
            toast.error('You have already submitted your handles. Verification is pending.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await submitSocialHandles(account, twitterHandle, discordHandle);
            if (response.success) {
                setVerificationStatus('pending');
                setHasSubmitted(true);
                toast.success('Social handles submitted for verification');
                setShowSocialModal(false);
            }
        } catch (error: any) {
            if (error.response && error.response.data.message === 'Already submitted') {
                toast.error('You have already submitted your handles. Verification is pending.');
                setHasSubmitted(true);
            } else {
                toast.error('Failed to submit social handles');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || value === '0') {
            setAmount('');
            return;
        }

        const numericValue = safeParseFloat(value);
        if (numericValue <= 0) {
            return;
        }
        
        if (selectedToken === 'GNF10') {
            const tokenAmount = numericValue / TOKEN_CONFIGS.GNF10.price;
            if (tokenAmount > remainingAllowance) {
                toast.error(`Maximum remaining purchase allowed: ${remainingAllowance} GNF10 tokens`);
                const maxAmount = remainingAllowance * TOKEN_CONFIGS.GNF10.price;
                setAmount(maxAmount.toString());
                return;
            }
        }
        
        setAmount(value);
    };

    const handlePaymentTokenChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newPaymentToken = e.target.value as TokenType;
        setPaymentToken(newPaymentToken);
        setHasAllowance(newPaymentToken === 'NATIVE');
    };

    const tokenEntries = Object.entries(TOKEN_CONFIGS).map(([key, token]) => ({
        ...token,
        key
    })) as TokenWithDetails[];

    const getButtonText = (token: TokenWithDetails) => {
        if (!isConnected) return 'Connect Wallet';
        if (token.requiresSocialVerification) {
            if (socialVerified) return 'Buy Now';
            if (hasSubmitted) return 'Verification Pending';
            return 'Verify Social Media';
        }
        return 'Buy Now';
    };

    const isButtonDisabled = (token: TokenWithDetails) => {
        if (!isConnected) return true;
        if (token.requiresSocialVerification && !socialVerified && hasSubmitted) return true;
        return false;
    };

    if (isInitialLoading) {
        return (
            <div 
                className="fixed inset-0 flex items-center justify-center w-full h-full"
                style={{ background: 'linear-gradient(135deg, #2F0D5B 0%, #0194FC 100%)' }}
            >
                <div className="animate-pulse">
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        className="w-32 h-32 object-contain"
                        style={{ animation: 'bounce 2s infinite' }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Top Bar - same width as card */}
            <div className="max-w-md mx-auto px-4 sm:px-6" style={{marginTop: '180px'}}>
            <div className="flex justify-between items-center p-4 bg-gray-900 rounded-t-md">
                {/* Left side: remove text logo */}
                <div></div>
                {/* Right side: ConnectWallet, Balance, Switch Network */}
                <div className="flex items-center space-x-4">
                <span className="text-white text-sm">
                    {parseFloat(balance).toFixed(4)} {tokenSymbol}
                </span>
                <span className="text-white text-sm">
                    {currentNetwork?.name || 'Unknown'}
                </span>
                <ConnectWallet />
                </div>
            </div>
            </div>

            {/* Main card */}
            <div className="min-h-screen relative overflow-hidden"style={{marginTop: '-80px'}} >
                {/* ...existing code for background and card... */}

                <div className="relative z-10 max-w-md mx-auto px-4 sm:px-6 py-12 mt-12">
                    {activeTab === 'buy' && (
                        <>
                            {/* Token Selection Tabs - Updated styles */}
                            <div className="flex justify-between gap-3 mb-6 bg-[#0f172a] p-1 rounded-xl">
                                {tokenEntries.map((token) => (
                                    <button
                                        key={token.key}
                                        onClick={() => handleTokenButtonClick(token.key)}
                                        style={{ backgroundColor: selectedToken === token.key ? '#0194FC' : '#030341' }}
                                        className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                                            selectedToken === token.key 
                                                ? 'text-white shadow-lg' 
                                                : 'text-white hover:bg-[#2d3748]'
                                        }`}
                                    >
                                        {token.symbol}
                                    </button>
                                ))}
                            </div>

                            {/* Token Card - Updated styles with solid background */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, type: "spring" }}
                                className="rounded-2xl overflow-hidden shadow-xl border border-[#1e293b]"
                                style={{
                                    background: 'linear-gradient(135deg, #2F0D5B 0%, #0194FC 100%)'
                                }}
                            >
                                {/* Card Header - Updated with solid background */}
                                <div className={`p-6 ${TOKEN_CONFIGS[selectedToken].bgColor}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-white rounded-lg">
                                                {TOKEN_CONFIGS[selectedToken].icon}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">
                                                    {TOKEN_CONFIGS[selectedToken].symbol}
                                                </h3>
                                                <p className="text-white text-sm">
                                                    {TOKEN_CONFIGS[selectedToken].description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-white text-2xl font-bold">
                                            ${TOKEN_CONFIGS[selectedToken].price}
                                        </div>
                                    </div>
                                    
                                    {/* Token Info */}
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="bg-white/10 rounded-lg p-3">
                                            <div className="text-white text-sm">Total Supply</div>
                                            <div className="text-white font-bold">
                                                {formatNumber(TOKEN_CONFIGS[selectedToken].totalSupply)}
                                            </div>
                                        </div>
                                        {TOKEN_CONFIGS[selectedToken].vestingPeriod && (
                                            <div className="bg-white/10 rounded-lg p-3">
                                                <div className="text-white text-sm">Vesting Period</div>
                                                <div className="text-white font-bold">
                                                    {TOKEN_CONFIGS[selectedToken].vestingPeriod === 365 ? '1 Year' : '3 Years'}
                                                </div>
                                            </div>
                                        )}
                                        {TOKEN_CONFIGS[selectedToken].maxPerWallet && (
                                            <div className="bg-white/10 rounded-lg p-3">
                                                <div className="text-white text-sm">Max Per Wallet</div>
                                                <div className="text-white font-bold">
                                                    {TOKEN_CONFIGS[selectedToken].maxPerWallet}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body - Updated styles */}
                                <div className="p-6 bg-[#0f172a] space-y-6">
                                    {/* Amount Input - Updated styles */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-white">
                                            Enter Amount
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={handleAmountChange}
                                                className="w-full bg-[#1e293b] border border-[#2d3748] rounded-lg px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0194FC] focus:border-transparent"
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white">
                                                USD
                                            </div>
                                        </div>
                                        {/* Token Amount Preview - Updated styles */}
                                        {amount && (
                                            <div className="bg-[#1e293b] rounded-lg p-4 mt-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white">You will receive:</span>
                                                    <span className="text-white font-bold">
                                                        {formatNumber(receivedAmount)} {selectedToken}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Selection - Updated styles */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-white">
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentToken}
                                            onChange={handlePaymentTokenChange}
                                            className="w-full bg-[#1e293b] border border-[#2d3748] rounded-lg px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-[#0194FC] focus:border-transparent"
                                        >
                                            {paymentOptions.map((option) => (
                                                <option 
                                                    key={option.type} 
                                                    value={option.type}
                                                    className="bg-[#1e293b] text-black"
                                                >
                                                    {option.symbol}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4">
                                        {!isConnected ? (
                                            <button
                                                onClick={handleConnectWallet}
                                                className="w-full bg-[#0194FC] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#0182e0] transition-colors"
                                            >
                                                Connect Wallet
                                            </button>
                                        ) : (
                                            <>
                                                {paymentToken !== 'NATIVE' && !hasAllowance && (
                                                    <button
                                                        onClick={handleApprove}
                                                        disabled={isApproving || !amount}
                                                        className="flex-1 bg-[#0194FC] text-white py-4 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0182e0] transition-colors"
                                                    >
                                                        {isApproving ? 'Approving...' : 'Approve'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handlePurchaseConfirm}
                                                    disabled={loading || !hasAllowance || !amount}
                                                    style={{ backgroundColor: '#0194FC' }}
                                                    className="flex-1 text-white py-4 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0182e0] transition-colors"
                                                >
                                                    {loading ? 'Processing...' : 'Buy Now'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                    {activeTab === 'howtobuy' && <HowToBuy />}
                    {activeTab === 'faqs' && <Faqs />}
                </div>

                {/* Nav Bar - now placed below the card */}
                <div className="max-w-md mx-auto px-4 sm:px-6 mt-6" style={{marginTop: '-20px'}}>
                    <div className="flex items-center justify-center bg-gray-800 p-2 space-x-8 rounded-md">
                        <button
                            onClick={() => setActiveTab('howtobuy')}
                            className="text-white hover:text-blue-300"
                        >
                              Guide
                        </button>
                        <button
                            onClick={() => setActiveTab('buy')}
                            className="rounded-full bg-blue-500 px-6 py-2 text-white font-semibold hover:bg-blue-600"
                        >
                            Buy
                        </button>
                        <button
                            onClick={() => setActiveTab('faqs')}
                            className="text-white hover:text-blue-300"
                        >
                            Faqs
                        </button>
                    </div>
                </div>

                {/* ...existing modals... */}
            </div>
        </div>
    );
};

export default TelegramBuy;
