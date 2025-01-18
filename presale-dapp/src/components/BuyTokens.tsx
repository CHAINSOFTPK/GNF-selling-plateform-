/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, ChangeEvent, HTMLAttributes } from 'react';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { useParams, useNavigate } from 'react-router-dom';
import { BiWallet } from 'react-icons/bi';
import { FaDollarSign, FaArrowRight, FaTimes, FaExclamationCircle, FaTwitter, FaDiscord, FaCheckCircle } from 'react-icons/fa';
import { useWallet } from '../context/Web3Context';
import { formatNumber } from '../utils/formatters';
import { getTokenStats, purchaseToken, submitSocialHandles } from '../services/tokenService';
import { checkSocialStatus } from '../services/socialVerificationService';
import { TokenConfig } from '../types/token';
import { motion, AnimatePresence } from 'framer-motion';
import { checkAllowance, approveToken, transferToken, getTokenBalance } from '../services/paymentService';
import axios from 'axios';
import { RiCoinFill, RiLockLine, RiTimeLine, RiUserFollowLine } from 'react-icons/ri';
import { HiSparkles } from 'react-icons/hi';
import { ImStatsBars } from 'react-icons/im';
import { BsLightningCharge, BsShieldCheck, BsGraphUp } from 'react-icons/bs';
import { AiOutlineFieldTime } from 'react-icons/ai';
import AnimatedBackground from './AnimatedBackground';
import { RiShieldLine } from 'react-icons/ri';
import { usePublicClient, useWalletClient } from 'wagmi';
import { validateAmount, safeParseFloat } from '../utils/validation';
import FAQ from './FAQ';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.gnfstore.com/api';
const TOKEN_CONFIGS: Record<string, TokenConfig> = {
    GNF10: {
        symbol: 'GNF10',
        price: 0.2,
        maxPerWallet: 200,
        totalSupply: 500000,
        requiresSocialVerification: true,
        description: 'For verified social media followers',
        bgColor: 'bg-[#0194FC]', // Simplified color
        icon: <RiUserFollowLine className="text-3xl" />,
        benefits: [
            'Early Access to Platform',
            'Community Voting Rights',
            'Exclusive Events Access'
        ]
    },
    GNF1000: {
        symbol: 'GNF1000',
        price: 0.6,
        totalSupply: 2000000,
        vestingPeriod: 365,
        description: '1 year vesting period',
        bgColor: 'bg-[#2563eb]', // Simplified color
        icon: <RiTimeLine className="text-3xl" />,
        benefits: [
            'Higher Staking Rewards',
            'Premium Features Access',
            'Priority Support'
        ]
    },
    GNF10000: {
        symbol: 'GNF10000',
        price: 0.15,
        totalSupply: 3000000,
        vestingPeriod: 1095,
        description: '3 years vesting period',
        bgColor: 'bg-[#7c3aed]', // Simplified color
        icon: <RiLockLine className="text-3xl" />,
        benefits: [
            'Governance Rights',
            'Maximum Staking Benefits',
            'VIP Platform Status'
        ]
    }
};

interface TokenWithDetails extends TokenConfig {
    key: string;
    symbol: string;
}

// Set Primary Color
const PRIMARY_COLOR = '#36D4C7';

const shimmerEffect = {
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)',
        transform: 'rotate(30deg)',
        animation: 'shimmer 3s infinite'
    }
};

// Update the quotes array styling
const quotes = [
    {
        text: '"If you don\'t believe it or don\'t get it, I don\'t have the time to try to convince you, sorry."',
        author: '- Satoshi Nakamoto',
        className: 'font-serif italic'
    },
    {
        text: 'The Future of Finance is Decentralized',
        author: '',
        className: 'font-sans tracking-wide'
    },
    {
        text: 'Welcome to GNF Ecosystem',
        author: '',
        className: 'font-sans font-bold tracking-wider'
    }
];

const BuyTokens: React.FC = () => {
    const { referrerAddress } = useParams();
    const navigate = useNavigate();
    const { account, connectWallet } = useWallet();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    
    // Replace provider references with publicClient or walletClient
    const isConnected = !!account;
    
    // State declarations
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [paymentToken, setPaymentToken] = useState<string>('USDT');
    const [selectedToken, setSelectedToken] = useState<string | null>(null);
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
    const [currentQuote, setCurrentQuote] = useState(0);

    // 1) Define a mapping of token decimals
    const PAYMENT_TOKEN_DECIMALS: Record<string, number> = {
        USDT: 6,
        BUSD: 18,
        GNF: 18,
        // ...add others as needed...
    };

    // Add this function for GNF10 balance updates
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

    // Calculate received amount when amount changes
    useEffect(() => {
        if (amount && selectedToken) {
            const tokenConfig = TOKEN_CONFIGS[selectedToken as keyof typeof TOKEN_CONFIGS];
            const calculated = parseFloat(amount) / tokenConfig.price;
            setReceivedAmount(calculated.toString());
        }
    }, [amount, selectedToken]);

    // Check social verification status
    useEffect(() => {
        const checkSocial = async () => {
            if (account) { // Changed from walletAddress
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
    }, [account]); // Changed from walletAddress

    // Fetch token stats
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

    // Check allowance when payment token or amount changes
    useEffect(() => {
        const checkTokenAllowance = async () => {
            if (account && amount && paymentToken) {
                const allowed = await checkAllowance(paymentToken, account);
                setHasAllowance(allowed);
            }
        };
        checkTokenAllowance();
    }, [account, amount, paymentToken]);

    useEffect(() => {
        const initializeTokens = async () => {
            try {
                // First check if tokens are initialized
                const checkResponse = await axios.get(`${API_BASE_URL}/tokens/check-initialization`);
                if (!checkResponse.data.success) {
                    // If not initialized, initialize them
                    await axios.post(`${API_BASE_URL}/tokens/init-tokens`);
                }
                // Then fetch token stats
                const stats = await getTokenStats();
                setTokens(stats);
            } catch (error) {
                console.error('Error initializing tokens:', error);
            }
        };

        initializeTokens();
    }, []);

    // Update the checkSubmissionStatus useEffect
    useEffect(() => {
        const checkSubmissionStatus = async () => {
            if (account) {
                try {
                    // Change from /social-verification/status/ to /social/status/
                    const response = await axios.get(`${API_BASE_URL}/social/status/${account}`);
                    console.log('Submission status response:', response.data); // Debug log
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

    // Update the verification status check useEffect
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
                        
                        // Update verification status based on the response
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
        
        // Set up an interval to check status periodically
        const intervalId = setInterval(checkVerificationStatus, 30000);

        return () => clearInterval(intervalId);
    }, [account]);

    // Add new useEffect to fetch GNF10 balance when modal opens
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

    // Update the handleTokenButtonClick function
    const handleTokenButtonClick = (token: TokenWithDetails) => {
        if (!isConnected) {
            connectWallet();
            return;
        }
    
        if (token.requiresSocialVerification) {
            if (socialVerified) {
                // If verified, directly set selected token and open purchase modal
                setSelectedToken(token.key);
            } else {
                // If not verified, show social verification modal
                setShowSocialModal(true);
            }
        } else {
            setSelectedToken(token.key);
        }
    };

    const handleBuyClick = async (tokenSymbol: string) => {
        if (!isConnected) {
            try {
                await connectWallet();
            } catch (error) {
                console.error('Failed to connect wallet:', error);
                toast.error('Failed to connect wallet');
            }
            return;
        }

        // Change this part to handle social verification click
        if (tokenSymbol === 'GNF10' && !socialVerified) {
            if (verificationStatus === 'pending') {
                toast.info('Your verification is in progress. Please wait.');
                return;
            }
            // Show the social verification modal
            setShowSocialModal(true);
            return;
        }

        // If not GNF10 or already verified, proceed with purchase
        setSelectedToken(tokenSymbol);
    };

    const handleApprove = async () => {
        if (!amount || !account) return;
        
        setIsApproving(true);
        try {
            // Validate amount first
            if (!validateAmount(amount, selectedToken || '')) {
                throw new Error('Invalid amount');
            }

            const decimals = PAYMENT_TOKEN_DECIMALS[paymentToken] || 18;
            await approveToken(paymentToken, amount);
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
        if (!selectedToken || !amount || !account) return;

        setLoading(true);
        let transferToastId = null;
        
        try {
            // Validate amount
            if (!validateAmount(amount, selectedToken)) {
                throw new Error('Invalid amount');
            }

            // GNF10 limit check
            if (selectedToken === 'GNF10') {
                const limitCheck = await axios.post(`${API_BASE_URL}/tokens/check-purchase-limit`, {
                    walletAddress: account,
                    amount: receivedAmount
                });

                if (!limitCheck.data.allowed) {
                    throw new Error(`Purchase would exceed maximum limit of 200 GNF10 tokens.`);
                }
            }

            // Check balance with proper decimal handling
            const balance = await getTokenBalance(paymentToken, account);
            const decimals = PAYMENT_TOKEN_DECIMALS[paymentToken] || 18;
            const parsedAmount = ethers.utils.parseUnits(amount, decimals);
            const parsedBalance = ethers.utils.parseUnits(balance, decimals);

            if (parsedBalance.lt(parsedAmount)) {
                throw new Error(`Insufficient ${paymentToken} balance`);
            }

            // Verify allowance
            const hasAllowance = await checkAllowance(paymentToken, account);
            if (!hasAllowance) {
                throw new Error(`Please approve ${paymentToken} spending first`);
            }

            transferToastId = toast.info('Transferring payment...', { 
                autoClose: false, 
                toastId: 'transfer' 
            });

            // Transfer tokens with proper decimal handling
            const txHash = await transferToken(paymentToken, amount);

            toast.update(transferToastId, { 
                render: 'Payment confirmed! Processing purchase...', 
                type: 'info' 
            });

            // Process purchase
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

    const handlePurchaseSuccess = async (selectedToken: string) => {
        toast.success(
            selectedToken === 'GNF10' 
                ? 'Tokens transferred successfully!' 
                : 'Purchase successful! Tokens will be available after vesting period.'
        );
        
        setSelectedToken(null);
        setAmount('');
        
        const stats = await getTokenStats();
        setTokens(stats);
        
        if (selectedToken === 'GNF10') {
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

    // Modify the amount change handler to validate GNF10 limits
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

    const tokenEntries = Object.entries(TOKEN_CONFIGS).map(([key, token]) => ({
        ...token,
        key
    })) as TokenWithDetails[];

    // Update token button display logic
    const getButtonText = (token: TokenWithDetails) => {
        if (!isConnected) return 'Connect Wallet';
        if (token.requiresSocialVerification) {
            if (socialVerified) return 'Buy Now';
            if (hasSubmitted) return 'Verification Pending';
            return 'Verify Social Media';
        }
        return 'Buy Now';
    };

    // Update button disabled state logic
    const isButtonDisabled = (token: TokenWithDetails) => {
        if (!isConnected) return true;
        if (token.requiresSocialVerification && !socialVerified && hasSubmitted) return true;
        return false;
    };

    // Add effect for quote rotation
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % quotes.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden">
                        <div 
                            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: 'url("https://i.postimg.cc/90SQQwCX/bg.png")' }}
                        />

                        {/* Main Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 mt-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tokenEntries.map((token, index) => (
                        <motion.div
                            key={token.key}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                                duration: 0.5, 
                                delay: index * 0.2,
                                type: "spring",
                                stiffness: 100 
                            }}
                            whileHover={{ 
                                scale: 1.03,
                                boxShadow: '0 0 30px rgba(54, 212, 199, 0.3)',
                                transition: { duration: 0.2 } 
                            }}
                            className="relative group rounded-2xl overflow-hidden"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                boxShadow: '0 8px 32px 0 rgba(54, 212, 199, 0.15)',
                                transition: 'all 0.3s ease-in-out',
                                transform: 'scale(0.85)' // Made cards even smaller
                            }}
                        >
                            {/* Enhanced Card Header */}
                            <div className="p-6" style={{ background: 'linear-gradient(to right, #0194FC, #300855)' }}> {/* Fixed background color */}
                                <div className="flex items-center justify-between mb-4"> {/* Reduced margin */}
                                    <h3 className="text-2xl font-bold text-white">{token.symbol}</h3> {/* Smaller text */}
                                    <div className="bg-white/30 p-3 rounded-lg text-white"> {/* Added text-white */}
                                        {React.isValidElement(TOKEN_CONFIGS[token.key].icon) && 
                                            React.cloneElement(TOKEN_CONFIGS[token.key].icon as React.ReactElement<any>, { 
                                                className: 'text-white text-3xl' 
                                            })
                                        }
                                    </div>
                                </div>
                                <div className="flex items-baseline mb-4"> {/* Reduced margin */}
                                    <span className="text-4xl font-extrabold text-white">${token.price}</span> {/* Smaller text */}
                                    <span className="ml-2 text-white text-sm">{/* Changed text-white/80 to text-white */}per token</span> {/* Smaller text */}
                                </div>
                            </div>

                            {/* Enhanced Card Body */}
                            <div className="bg-white/95 p-6 space-y-4"> {/* Reduced padding and spacing */}
                                <div className="space-y-3"> {/* Reduced spacing */}
                                    {/* Supply Info */}
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"> {/* Adjusted styling */}
                                        <span className="text-gray-600 text-sm font-medium">Supply</span>
                                        <span className="text-teal-600 font-bold text-sm">{formatNumber(token.totalSupply)}</span>
                                    </div>
                                    
                                    {/* Max per Wallet Info */}
                                    {token.maxPerWallet && (
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="text-gray-600 text-sm font-medium">Max per wallet</span>
                                            <span className="text-teal-600 font-bold text-sm">{token.maxPerWallet}</span>
                                        </div>
                                    )}
                                    
                                    {/* Vesting Period Info */}
                                    {token.vestingPeriod && (
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="text-gray-600 text-sm font-medium">Vesting</span>
                                            <span className="text-teal-600 font-bold text-sm">
                                                {token.vestingPeriod === 365 ? '1 Year' : '3 Years'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Action Button */}
                                <button
                                    onClick={() => handleTokenButtonClick(token)}
                                    disabled={isButtonDisabled(token)}
                                    className={`
                                        w-full py-3 px-4 rounded-lg font-bold text-sm
                                        transition-all duration-300 ease-in-out transform
                                        ${isButtonDisabled(token)
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'hover:bg-[#358F88] active:scale-95 shadow-lg hover:shadow-xl'
                                        }
                                    `}
                                    style={{ 
                                        backgroundColor: isButtonDisabled(token) ? '#D1D5DB' : '#0194FC',
                                        color: isButtonDisabled(token) ? '#6B7280' : 'white'
                                    }}
                                >
                                    {getButtonText(token)}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

          


            {/* Enhanced Purchase Modal */}
            <AnimatePresence>
                {selectedToken && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-w-md w-full overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-8" style={{ backgroundColor: '#0194FC' }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-4xl font-bold text-white mb-2">
                                            {selectedToken}
                                        </h3>
                                       
                                    </div>
                                    <motion.button
                                        whileHover={{ rotate: 90 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => setSelectedToken(null)}
                                        className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        <FaTimes size={24} />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 space-y-6 bg-white">
                                {/* Amount Input */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Amount (USD)
                                        {selectedToken === 'GNF10' && (
                                            <span className="text-sm text-gray-400 ml-2">
                                                (Max: {(remainingAllowance * TOKEN_CONFIGS.GNF10.price).toFixed(2)} USD)
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg transition-all duration-200"
                                            placeholder="Enter amount"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <FaDollarSign size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Token Selection */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Payment Token(ERC20) 
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={paymentToken}
                                            onChange={(e) => setPaymentToken(e.target.value)}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg appearance-none cursor-pointer transition-all duration-200"
                                        >
                                            <option value="USDT">USDT</option>
                                            <option value="BUSD">BUSD</option>
                                            <option value="USDC">USDC</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Token Receipt Preview */}
                                <div className="p-6 rounded-2xl shadow-lg" style={{ backgroundColor: '#0194FC' }}>
                                    <p className="text-white text-sm font-medium mb-2">You will receive:</p>
                                    <div className="flex items-baseline space-x-2">
                                        <p className="text-4xl font-bold text-white">
                                            {formatNumber(receivedAmount)}
                                        </p>
                                        <p className="text-xl text-white font-semibold">
                                            {selectedToken}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setSelectedToken(null)}
                                        className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all duration-200"
                                    >
                                        Cancel
                                    </motion.button>
                                    
                                    {!hasAllowance ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleApprove}
                                            disabled={isApproving || !amount}
                                            style={{ backgroundColor: '#0194FC' }}
                                            className="flex-1 py-4 px-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                        >
                                            {isApproving ? (
                                                <span className="flex items-center justify-center space-x-2">
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span>Approving...</span>
                                                </span>
                                            ) : (
                                                `Approve ${paymentToken}`
                                            )}
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handlePurchaseConfirm}
                                            disabled={loading || !amount}
                                            style={{ backgroundColor: '#0194FC' }}
                                            className="flex-1 py-4 px-6 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center space-x-2">
                                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span>Processing...</span>
                                                </span>
                                            ) : (
                                                'Confirm Purchase'
                                            )}
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Updated Social Verification Modal to match other popups */}
            <AnimatePresence>
                {showSocialModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-w-md w-full overflow-hidden transform scale-90" // Added scale-90
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-8" style={{ backgroundColor: '#300855' }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-4xl font-bold text-white mb-2">
                                            Social Verification
                                        </h3>
                                       
                                    </div>
                                    <motion.button
                                        whileHover={{ rotate: 90 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => setShowSocialModal(false)}
                                        className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                                    >
                                        <FaTimes size={24} />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 space-y-6 bg-white">
                                {/* Social Media Buttons */}
                                <div className="grid grid-cols-2 gap-4">
                                    <motion.a
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        href="https://twitter.com/megapayer"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ backgroundColor: '#300855' }}
                                        className="py-4 px-6 text-white rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        <FaTwitter size={20} />
                                        <span className="font-semibold">Twitter</span>
                                    </motion.a>
                                    <motion.a
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        href="https://discord.gg/NVqRsTnQ"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ backgroundColor: '#300855' }}
                                        className="py-4 px-6 text-white rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        <FaDiscord size={20} />
                                        <span className="font-semibold">Discord</span>
                                    </motion.a>
                                </div>

                                {/* Input Fields */}
                                <div className="space-y-4">
                                    {/* Twitter Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Twitter Handle
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={twitterHandle}
                                                onChange={(e) => setTwitterHandle(e.target.value)}
                                                placeholder="@yourusername"
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg transition-all duration-200"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                <FaTwitter size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Discord Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Discord Handle
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={discordHandle}
                                                onChange={(e) => setDiscordHandle(e.target.value)}
                                                placeholder="username#0000"
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-lg transition-all duration-200"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                <FaDiscord size={20} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                {hasSubmitted ? (
                                    <div className="p-6 rounded-xl bg-yellow-50 border border-yellow-200">
                                        <div className="flex items-start gap-4">
                                            <div className="text-yellow-500 mt-1">
                                                <AiOutlineFieldTime size={24} className="animate-spin" />
                                            </div>
                                            <p className="text-yellow-800 font-medium">
                                                Verification in progress. Please wait while we verify your accounts.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSocialVerification}
                                        disabled={isSubmitting || !twitterHandle || !discordHandle}
                                        style={{ backgroundColor: '#300855' }}
                                        className="w-full py-4 px-6 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Submitting...</span>
                                            </span>
                                        ) : (
                                            'Submit for Verification'
                                        )}
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BuyTokens;