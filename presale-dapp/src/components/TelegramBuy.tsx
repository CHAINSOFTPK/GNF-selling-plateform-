/** @jsxImportSource @emotion/react */
import React, { useState, useEffect, ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ethers } from 'ethers';
import { useParams, useNavigate } from 'react-router-dom';
import { BiWallet } from 'react-icons/bi';
import { FaDollarSign, FaArrowRight, FaTimes, FaExclamationCircle, FaTwitter, FaDiscord, FaCheckCircle, FaBook, FaChartLine } from 'react-icons/fa';
import { useWallet } from '../context/Web3Context';
import { formatNumber } from '../utils/formatters';
import { getTokenStats, purchaseToken, submitSocialHandles } from '../services/tokenService';
import { checkSocialStatus } from '../services/socialVerificationService';
import { TokenConfig } from '../types/token';
import { motion, AnimatePresence } from 'framer-motion';
import { checkAllowance, approveToken, transferToken, getTokenBalance, transferNativeToken, TokenType } from '../services/paymentService';
import axios from 'axios';
import { RiCoinFill, RiLockLine, RiTimeLine, RiUserFollowLine } from 'react-icons/ri';
import { HiSparkles } from 'react-icons/hi';
import { ImStatsBars } from 'react-icons/im';
import { BsLightningCharge, BsShieldCheck, BsGraphUp } from 'react-icons/bs';
import { AiOutlineFieldTime } from 'react-icons/ai';
import AnimatedBackground from './AnimatedBackground';
import { RiShieldLine } from 'react-icons/ri';
import { usePublicClient, useWalletClient, useChainId, useBalance } from 'wagmi';
import { validateAmount, safeParseFloat } from '../utils/validation';
import FAQ from './FAQ';
import { SUPPORTED_NETWORKS } from '../config/networks';
// Import necessary icons or replace with actual icon components
import { ReactComponent as BNBIcon } from '../assets/icons/bnb.svg';
import { ReactComponent as MATICIcon } from '../assets/icons/matic.svg';
import { ReactComponent as AVAXIcon } from '../assets/icons/avax.svg';
import { convertNativeTokenToUSD, convertUSDToNativeToken } from '../services/priceService';
import SocialVerificationModal from './modals/SocialVerificationModal';
import PurchaseModal from './modals/PurchaseModal';
import TokenCard from './TokenCard';
import VectorButton from './VectorButton';
import { showToast } from './CustomToast';
import { switchToNetwork } from '../utils/network';
import DashboardLoader from './DashboardLoader';
import { formatEther } from 'viem';
import { RiWallet3Line, RiExchangeLine } from 'react-icons/ri';
import TelegramFooter from './TelegramFooter';
import TelegramHeader from './TelegramHeader';
import TelegramToast from './TelegramToast';
import TelegramSocialModal from './modals/TelegramSocialModal';
import { createToastService } from '../services/toastService';

const API_BASE_URL = 'https://api.gnfstore.com/api';
const TOKEN_CONFIGS: Record<string, TokenConfig> = {
    GNF10: {
        symbol: 'GNF',
        price: 0.2,
        maxPerWallet: 200,
        totalSupply: 500000,
        requiresSocialVerification: true,
        description: 'For verified social media followers',
        bgColor: 'bg-[#0194FC]', // Simplified color
        icon: <RiUserFollowLine className="text-3xl text-white" />,
        benefits: [
            'Early Access to Platform',
            'Community Voting Rights',
            'Exclusive Events Access'
        ]
    },
    GNF1000: {
        symbol: 'GNF',
        price: 0.6,
        totalSupply: 2000000,
        vestingPeriod: 365,
        description: '1 year vesting period',
        bgColor: 'bg-[#2563eb]', // Simplified color
        icon: <RiTimeLine className="text-3xl text-white" />,
        benefits: [
            'Higher Staking Rewards',
            'Premium Features Access',
            'Priority Support'
        ]
    },
    GNF10000: {
        symbol: 'GNF',
        price: 0.15,
        totalSupply: 3000000,
        vestingPeriod: 1095,
        description: '3 years vesting period',
        bgColor: 'bg-[#7c3aed]', // Simplified color
        icon: <RiLockLine className="text-3xl text-white" />,
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

// Add new GNF loader component
const GNFLoader = () => (
    <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="relative w-20 h-20">
            {/* Animated circles */}
            <div className="absolute inset-0 border-4 border-[#0194FC]/20 rounded-full animate-[ping_1.5s_ease-in-out_infinite]"></div>
            <div className="absolute inset-0 border-4 border-[#0194FC]/20 border-t-[#0194FC] rounded-full animate-[spin_1s_linear_infinite]"></div>
            
            {/* GNF Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[#0194FC] text-2xl font-bold">GNF</span>
            </div>
        </div>
        <div className="absolute mt-24 text-white/80 text-sm">Processing...</div>
    </div>
);

// Update the InitialLoader component with a more beautiful design
const InitialLoader = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f172a]"
    >
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-col items-center justify-center space-y-6"
        >
            {/* Animated Logo */}
            <motion.div className="relative">
                <motion.img 
                    src="/logo.png" 
                    alt="GNF Logo" 
                    className="h-16 w-auto relative z-10"
                    animate={{ 
                        scale: [1, 1.1, 1],
                        rotateY: [0, 360],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                
                {/* Glowing effect behind logo */}
                <motion.div
                    className="absolute inset-0 blur-xl bg-[#0194FC]"
                    animate={{
                        opacity: [0.2, 0.5, 0.2],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>

            {/* Loading Text */}
            <motion.div 
                className="text-center space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-xl font-bold text-white">Welcome to GNF</h2>
                <div className="flex items-center justify-center space-x-1">
                    <motion.span
                        className="h-2 w-2 rounded-full bg-[#0194FC]"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.span
                        className="h-2 w-2 rounded-full bg-[#0194FC]"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.span
                        className="h-2 w-2 rounded-full bg-[#0194FC]"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                </div>
            </motion.div>

            {/* Orbital rings effect */}
            <motion.div 
                className="absolute w-32 h-32 border border-[#0194FC]/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
                className="absolute w-48 h-48 border border-[#0194FC]/10 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
        </motion.div>
    </motion.div>
);

const TelegramBuy: React.FC = () => {
    const { referrerAddress } = useParams();
    const navigate = useNavigate();
    const { account, connectWallet } = useWallet();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const chainId = useChainId();
    const supportedNetwork = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);
    
    // Replace provider references with publicClient or walletClient
    const isConnected = !!account;
    
    // State declarations
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [paymentToken, setPaymentToken] = useState<string>('USDT');
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
    const [usdValue, setUsdValue] = useState<string>('');
    const [selectedToken, setSelectedToken] = useState<string>('GNF10');

    // Replace maxNativeAmount state with a function
    const [maxNativeAmount, setMaxNativeAmount] = useState<string>('0');

    const updateMaxNativeAmount = async () => {
        if (!supportedNetwork) return;
        try {
            // Convert $40 to native token amount using real-time price
            const maxAmount = await convertUSDToNativeToken(40, supportedNetwork.nativeCoin);
            setMaxNativeAmount(maxAmount);
            console.log(`Updated max ${supportedNetwork.nativeCoin} amount:`, maxAmount);
        } catch (error) {
            console.error('Error updating max native amount:', error);
        }
    };

    // Update maxNativeAmount when network changes or every minute
    useEffect(() => {
        if (supportedNetwork) {
            updateMaxNativeAmount();
            const interval = setInterval(updateMaxNativeAmount, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [supportedNetwork]);

    // 1) Define a mapping of token decimals
    const PAYMENT_TOKEN_DECIMALS: Record<string, number> = {
        USDT: 6,
        BUSD: 18,
        GNF: 18,
        // ...add others as needed...
    };

    // Update payment options to properly handle native token
    const paymentOptions = supportedNetwork ? [
        {
            type: 'NATIVE',  // Changed from 'native' to 'NATIVE' to match TokenType
            symbol: supportedNetwork.nativeCoin,
            icon: supportedNetwork.icon
        },
        {
            type: 'USDT',
            symbol: 'USDT',
            icon: '🟡'
        }
    ] : [];

    // Add this function for GNF10 balance updates
    const updateGNF10Balance = async () => {
        if (!account) return;
        try {
            const balanceResponse = await axios.get(`${API_BASE_URL}/tokens/balance/${account}/GNF10`);
            const balance = balanceResponse.data.balance || 0;
            
            // Store the actual token amount (not Wei)
            setCurrentGNF10Balance(balance);
            setRemainingAllowance(200 - balance);
            
            console.log('Updated GNF10 balance:', {
                balance,
                remaining: 200 - balance
            });
        } catch (error) {
            console.error('Error updating GNF10 balance:', error);
        }
    };

    // Calculate received amount when amount changes
    useEffect(() => {
        const calculateReceivedAmount = async () => {
            if (!amount || !selectedToken) return;

            const tokenConfig = TOKEN_CONFIGS[selectedToken as keyof typeof TOKEN_CONFIGS];
            let usdAmount = 0;

            try {
                if (paymentToken === 'NATIVE' && supportedNetwork) {
                    if (supportedNetwork.nativeCoin === 'GNF') {
                        usdAmount = parseFloat(amount) * tokenConfig.price; // Use tier-specific price
                    } else {
                        usdAmount = await convertNativeTokenToUSD(amount, supportedNetwork.nativeCoin);
                    }
                    setUsdValue(usdAmount.toFixed(2));
                } else {
                    usdAmount = parseFloat(amount);
                    setUsdValue(amount);
                }

                // Calculate tokens based on selected tier's price
                const calculatedTokens = usdAmount / tokenConfig.price;
                setReceivedAmount(calculatedTokens.toFixed(4));

            } catch (error) {
                console.error('Error calculating received amount:', error);
                setUsdValue('0');
                setReceivedAmount('0');
            }
        };

        calculateReceivedAmount();
    }, [amount, selectedToken, paymentToken, supportedNetwork]);

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
            if (!account || !amount || !paymentToken || !chainId) return;
            
            // Skip allowance check for native token
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
                    // Store balance in wei
                    const balanceInWei = response.data.balance || 0;
                    setCurrentGNF10Balance(balanceInWei);
                    // Convert to actual tokens for remaining calculation
                    const actualBalance = balanceInWei / 1e18;
                    setRemainingAllowance(200 - actualBalance);
                } catch (error) {
                    console.error('Error fetching GNF10 balance:', error);
                }
            }
        };

        fetchGNF10Balance();
    }, [selectedToken, account]);

    // Add effect to reset payment token when network changes
    useEffect(() => {
        if (supportedNetwork) {
            // Default to native token when network changes
            setPaymentToken('NATIVE');
            // Reset allowance state
            setHasAllowance(true);
        }
    }, [supportedNetwork]);

    // Update the handleTokenButtonClick function
    const handleTokenButtonClick = async (token: TokenWithDetails) => {
        if (!isConnected) {
            connectWallet();
            return;
        }

        if (supportedNetwork?.nativeCoin === 'GNF') {
            toastService.show('Please switch to a supported payment network (BSC, Polygon, or Avalanche)', 'error');
            return;
        }

        if (token.requiresSocialVerification && !socialVerified) {
            if (hasSubmitted) {
                toastService.show('Your verification is pending. Please wait.', 'info');
                return;
            }
            setShowSocialModal(true);
            return;
        }

        // If we get here, we can proceed with the purchase
        if (!amount || parseFloat(amount) <= 0) {
            toastService.show('Please enter a valid amount', 'error');
            return;
        }

        // Proceed with purchase logic directly
        await handlePurchaseConfirm(token.key);
    };

    // Add toast state and service
    const [toastState, setToastState] = useState<{
        message: string;
        type: 'success' | 'error' | 'info';
        isVisible: boolean;
    }>({
        message: '',
        type: 'info',
        isVisible: false
    });

    const toastService = React.useMemo(
        () => createToastService(setToastState),
        []
    );

    // Update the showToast helper function to match our usage
    const showCustomToast = (message: string, type: 'success' | 'error' | 'info', duration?: number) => {
        setToastState({ 
            message, 
            type, 
            isVisible: true 
        });
        setTimeout(() => {
            setToastState(prev => ({ ...prev, isVisible: false }));
        }, duration || 3000);
        return null; // Return null instead of an ID
    };

    // Update the reference to toast to use our custom toast
    const toast = {
        error: (message: string) => showCustomToast(message, 'error'),
        success: (message: string) => showCustomToast(message, 'success'),
        info: (message: string) => showCustomToast(message, 'info'),
        dismiss: () => setToastState(prev => ({ ...prev, isVisible: false }))
    };

    // Update all showToast calls to use the new format
    const handleApprove = async () => {
        if (!amount || !account || !chainId) return;
        
        // Skip approval for native tokens and set allowance to true
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
            toastService.show(`${paymentToken} approved successfully`, 'success');
        } catch (error: any) {
            console.error('Approval error:', error);
            toastService.show(error.message || 'Failed to approve token', 'error');
            setHasAllowance(false);
        } finally {
            setIsApproving(false);
        }
    };

    // Update other toast usage
    const handlePurchaseConfirm = async (tokenKey: string) => {
        if (!account || !chainId) return;

        setLoading(true);
        let transferToastId = null;

        try {
            // Validate amount
            if (!validateAmount(amount, tokenKey)) {
                throw new Error('Invalid amount');
            }

            // Convert amount to USD for validation
            let usdAmount = parseFloat(usdValue);
            if (usdAmount <= 0) {
                throw new Error('Invalid amount');
            }

            // GNF10 limit check with proper decimal conversion
            if (tokenKey === 'GNF10') {
                const tokenAmountToReceive = parseFloat(receivedAmount);
                // Convert wei to actual token amount by dividing by 10^18
                const currentBalance = currentGNF10Balance / 1e18;
                const totalAfterPurchase = currentBalance + tokenAmountToReceive;
                
                console.log('GNF10 Purchase Check:', {
                    currentBalance: currentBalance.toFixed(4),
                    attemptingToBuy: tokenAmountToReceive.toFixed(4),
                    totalAfterPurchase: totalAfterPurchase.toFixed(4),
                    remainingAllowed: (200 - currentBalance).toFixed(4)
                });

                if (totalAfterPurchase > 200) {
                    throw new Error(
                        `Purchase would exceed maximum limit of 200 GNF10 tokens. ` +
                        `Current balance: ${currentBalance.toFixed(4)}, ` +
                        `Attempting to buy: ${tokenAmountToReceive.toFixed(4)}, ` +
                        `Remaining allowed: ${(200 - currentBalance).toFixed(4)}`
                    );
                }
            }

            // Check balance with proper decimal handling
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

            // Verify allowance
            // For native token, skip allowance check
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

            transferToastId = showCustomToast('Transferring payment...', 'info', 0);

            // Get chainId from network
            const currentChainId = chainId;
            if (!currentChainId) throw new Error('Network not detected');

            let txHash: string;

            if (paymentToken === 'NATIVE') {
                txHash = await transferNativeToken(amount, chainId);
            } else {
                txHash = await transferToken(paymentToken as TokenType, amount, chainId);
            }

            toastService.show('Payment confirmed! Processing purchase...', 'info');

            // Process purchase
            const purchaseResult = await purchaseToken(
                account,
                tokenKey,
                safeParseFloat(amount),
                txHash,
                paymentToken
            );

            if (purchaseResult.success) {
                await handlePurchaseSuccess(tokenKey);
            } else {
                throw new Error(purchaseResult.message || 'Purchase failed');
            }

        } catch (error: any) {
            if (transferToastId) toast.dismiss();
            toastService.show(error.message || 'Purchase failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchaseSuccess = async (selectedToken: string) => {
        toastService.show(
            selectedToken === 'GNF10' 
                ? '🎉 Tokens transferred successfully! To claim your tokens, please visit Dashboard'
                : '🎉 Purchase successful! To claim your tokens after vesting period, please visit Dashboard',
            'success',
            8000
        );
        
        // Optional: Add a second toast with a clickable link
        setTimeout(() => {
            toastService.show('🔗 Click here to go to Dashboard', 'info', 5000);
            // You could also programmatically navigate to dashboard here if clicked
        }, 1000);
        
        // Reset states and update data
        setAmount('');
        const stats = await getTokenStats();
        setTokens(stats);
        
        if (selectedToken === 'GNF10') {
            updateGNF10Balance();
        }
    };

    const handlePurchaseError = (error: any, toastId: string | number | null) => {
        toastService.show(error.message || 'Purchase failed', 'error');
        console.error('Purchase error:', error);
    };

    const handleSocialVerification = async () => {
        if (!account) return;
        
        if (hasSubmitted) {
            toastService.show('You have already submitted your handles. Verification is pending.', 'error');
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await submitSocialHandles(account, twitterHandle, discordHandle);
            if (response.success) {
                setVerificationStatus('pending');
                setHasSubmitted(true);
                toastService.show('Social handles submitted for verification', 'success');
                setShowSocialModal(false);
            }
        } catch (error: any) {
            if (error.response && error.response.data.message === 'Already submitted') {
                toastService.show('You have already submitted your handles. Verification is pending.', 'error');
                setHasSubmitted(true);
            } else {
                toastService.show('Failed to submit social handles', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Modify the amount change handler to validate GNF10 limits
    const handleAmountChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Allow empty input
        if (value === '') {
            setAmount('');
            setUsdValue('0');
            setReceivedAmount('0');
            return;
        }
    
        // Validate numeric input
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 0) {
            return;
        }
    
        try {
            let maxUsdAmount;
            // Set max USD amount based on tier
            switch(selectedToken) {
                case 'GNF10':
                    maxUsdAmount = 40;  // $40 max for Tier 1
                    break;
                case 'GNF1000':
                    maxUsdAmount = 1000;  // $1000 max for Tier 2
                    break;
                case 'GNF10000':
                    maxUsdAmount = 10000;  // $10000 max for Tier 3
                    break;
                default:
                    maxUsdAmount = 40;
            }
    
            if (paymentToken === 'NATIVE' && supportedNetwork) {
                // For native tokens, get USD value first
                const usdAmount = await convertNativeTokenToUSD(value, supportedNetwork.nativeCoin);
                
                // Check if exceeds max USD amount (40 USD)
                if (usdAmount > maxUsdAmount) {
                    // Convert max USD amount back to native token
                    const maxNativeAmount = await convertUSDToNativeToken(maxUsdAmount, supportedNetwork.nativeCoin);
                    setAmount(maxNativeAmount);
                    setUsdValue(maxUsdAmount.toString());
                    return;
                }
    
                setUsdValue(usdAmount.toFixed(2));
            } else {
                // For USDT, direct USD value
                if (numericValue > maxUsdAmount) {
                    setAmount(maxUsdAmount.toString());
                    setUsdValue(maxUsdAmount.toString());
                    return;
                }
                setUsdValue(value);
            }
    
            setAmount(value);
            
            // Calculate received tokens based on tier-specific price
            const tokenConfig = TOKEN_CONFIGS[selectedToken as keyof typeof TOKEN_CONFIGS];
            const calculatedTokens = parseFloat(usdValue) / tokenConfig.price;
            setReceivedAmount(calculatedTokens.toFixed(4));
    
        } catch (error) {
            console.error('Error converting amount:', error);
        }
    };

    // Update the payment token change handler
    const handlePaymentTokenChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newPaymentToken = e.target.value as TokenType;
        setPaymentToken(newPaymentToken);
        // Reset allowance when switching payment tokens
        setHasAllowance(newPaymentToken === 'NATIVE');
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

    // Add this state for current card index
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    // Add these navigation functions
    const nextCard = () => {
        setCurrentCardIndex((prev) => (prev + 1) % tokenEntries.length);
    };

    const previousCard = () => {
        setCurrentCardIndex((prev) => (prev - 1 + tokenEntries.length) % tokenEntries.length);
    };

    useEffect(() => {
        const initializeNetwork = async () => {
            // Only switch if not on any supported network
            if (!supportedNetwork) {
                try {
                    await switchToNetwork(SUPPORTED_NETWORKS.POLYGON.chainId);
                } catch (error) {
                    console.error('Failed to switch network:', error);
                }
            }
        };

        initializeNetwork();
    }, [chainId]);

    // Add new balance hook
    const { data: balanceData } = useBalance({
        address: account as `0x${string}`,
        chainId: chainId,
    });

    // Add network switch handler
    const handleNetworkSwitch = async (targetChainId: number) => {
        try {
            await switchToNetwork(targetChainId);
            toastService.show('Network switched successfully', 'success');
        } catch (error) {
            console.error('Failed to switch network:', error);
            toastService.show('Failed to switch network', 'error');
        }
    };

    // Format balance for display
    const formatBalance = (balance: string | undefined) => {
        if (!balance) return '0.00';
        const formatted = parseFloat(formatEther(BigInt(balance))).toFixed(4);
        return formatted;
    };

    // Add state for network menu
    const [showNetworkMenu, setShowNetworkMenu] = useState(false);

    // Add function to handle footer menu clicks
    const handleFooterMenuClick = (action: 'buy' | 'dashboard' | 'guide') => {
        switch(action) {
            case 'buy':
                // Already on buy page
                break;
            case 'dashboard':
                navigate('/telegramdashboard'); // Update this to use proper navigation
                break;
            case 'guide':
                navigate('/telegramguide');
                break;
        }
    };

    // Update the button to show loading state
    const ButtonContent = ({ token, isProcessing }: { token: TokenWithDetails, isProcessing: boolean }) => {
        if (isProcessing) {
            return (
                <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                </div>
            );
        }
        return <span>{getButtonText(token)}</span>;
    };

    // Update the card selection handler to also update selectedToken
    const handleTierSelection = (index: number, tokenKey: string) => {
        setCurrentCardIndex(index);
        setSelectedToken(tokenKey);
        // Reset amount and calculations when changing tiers
        setAmount('');
        setUsdValue('0');
        setReceivedAmount('0');
    };

    // Add initial loading state
    const [isInitialLoading, setIsInitialLoading] = useState(() => {
        return !sessionStorage.getItem('hasLoadedBefore');
    });

    // Update the initial loading duration
    useEffect(() => {
        if (isInitialLoading) {
            const timer = setTimeout(() => {
                setIsInitialLoading(false);
                sessionStorage.setItem('hasLoadedBefore', 'true');
            }, 3000); // Increased from 1500ms to 3000ms

            return () => clearTimeout(timer);
        }
    }, [isInitialLoading]);

    return (
        <>
            {/* Initial Loader */}
            <AnimatePresence>
                {isInitialLoading && <InitialLoader />}
            </AnimatePresence>

            {/* Existing component content */}
            <div className="min-h-screen bg-[#0f172a] text-white">
                {/* Show loader when processing */}
                {loading && <GNFLoader />}
                
                {/* Replace old header with new TelegramHeader */}
                <TelegramHeader
                    account={account}
                    chainId={chainId}
                    onConnect={connectWallet}
                    onNetworkSwitch={handleNetworkSwitch}
                />

                {/* Network Warning - Enhanced styling */}
                {supportedNetwork?.nativeCoin === 'GNF' && (
                    <div className="mx-4 mt-4">
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl 
                                      flex items-center space-x-3">
                            <FaExclamationCircle className="text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-500">
                                Please switch to a supported payment network (BSC, Polygon, or Avalanche)
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Content - Simplified for Telegram */}
                <div className="p-2 max-w-md mx-auto space-y-2"> {/* reduced from p-4 and space-y-4 */}

                

                    {/* Simplified Token Selection */}
                    <div className="bg-[#1c1c1c] rounded-lg p-3 border border-gray-800"> {/* reduced from rounded-xl and p-4 */}
                        <div className="grid grid-cols-3 gap-1 mb-2"> {/* reduced from gap-2 and mb-4 */}
                            {tokenEntries.map((token, index) => (
                                <button
                                    key={token.key}
                                    onClick={() => handleTierSelection(index, token.key)}
                                    className={`p-1.5 rounded-lg text-center text-[11px] ${  // reduced from p-2 and text-sm
                                        currentCardIndex === index
                                            ? 'bg-[#0194FC] text-white'
                                            : 'bg-gray-800 text-gray-300'
                                    }`}
                                >
                                    Tier {index + 1}
                                </button>
                            ))}
                        </div>

                        {/* Current Token Display - Beautiful Version */}
                        <div className="space-y-2"> {/* reduced from space-y-3 */}
                            {/* Header with Icon and Price */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2"> {/* reduced from space-x-3 */}
                                    <div className={`w-8 h-8 rounded-lg ${tokenEntries[currentCardIndex].bgColor} 
                                                   flex items-center justify-center shadow-lg`}> {/* reduced from w-10 h-10 */}
                                        {tokenEntries[currentCardIndex].icon}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white text-xs">GNF</h3> {/* reduced from font-semibold */}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-[#0194FC]">${tokenEntries[currentCardIndex].price}</p>
                                    <p className="text-[10px] text-gray-400">per token</p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-800"></div>

                            {/* Token Details Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5"> {/* reduced from space-y-1 */}
                                    <p className="text-[10px] text-gray-400">Total Supply</p>
                                    <p className="text-xs font-medium text-white">
                                        {formatNumber(tokenEntries[currentCardIndex].totalSupply)}
                                    </p>
                                </div>
                                
                                {currentCardIndex === 0 ? (
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-gray-400">Max Per Wallet</p>
                                        <p className="text-xs font-medium text-white">200 GNF</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-gray-400">Vesting Period</p>
                                        <p className="text-xs font-medium text-white">
                                            {tokenEntries[currentCardIndex].vestingPeriod} Days
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="bg-gray-800/50 rounded px-2 py-1.5"> {/* reduced padding */}
                                <p className="text-[10px] text-gray-300">
                                    {tokenEntries[currentCardIndex].description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Controls */}
                    <div className="bg-[#1c1c1c] rounded-lg p-3 border border-gray-800">
                        <div className="space-y-2">
                            {/* Amount Input */}
                            <div>
                                <label className="text-xs text-gray-400">Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    className="w-full bg-gray-800 rounded p-1.5 mt-1 text-xs"
                                    placeholder="Enter amount"
                                />
                            </div>

                            {/* Payment Token Selection */}
                            <div>
                                <label className="text-xs text-gray-400">Pay with</label>
                                <select
                                    value={paymentToken}
                                    onChange={handlePaymentTokenChange}
                                    className="w-full bg-gray-800 rounded p-1.5 mt-1 text-xs"
                                >
                                    {paymentOptions.map(option => (
                                        <option key={option.symbol} value={option.type}>
                                            {option.symbol}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* You Receive */}
                            <div className="bg-gray-800 rounded p-2">
                                <div className="text-xs text-gray-400">You receive</div>
                                <div className="text-sm font-medium">
                                    {receivedAmount} GNF
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => handleTokenButtonClick(tokenEntries[currentCardIndex])}
                                disabled={isButtonDisabled(tokenEntries[currentCardIndex]) || loading}
                                className="w-full bg-[#0194FC] hover:bg-[#0182e0] disabled:bg-gray-600 
                                         disabled:cursor-not-allowed py-2 rounded-lg font-medium"
                            >
                                <ButtonContent 
                                    token={tokenEntries[currentCardIndex]} 
                                    isProcessing={loading} 
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* New Footer with Circle Menu */}
                <TelegramFooter 
                    onMenuClick={handleFooterMenuClick}
                    currentPage="buy"
                    navigationText={{
                        guide: 'Guide',
                        dashboard: 'Dashboard',
                        buy: 'Buy'
                    }}
                />

                {/* Add padding at the bottom to account for footer */}
                <div className="pb-20" />

                {/* Modals */}
                <AnimatePresence>
                    {showSocialModal && (
                        <TelegramSocialModal
                            isOpen={showSocialModal}
                            onClose={() => setShowSocialModal(false)}
                            account={account || ''}
                            hasSubmitted={hasSubmitted}
                            setHasSubmitted={setHasSubmitted}
                            setVerificationStatus={setVerificationStatus}
                        />
                    )}
                </AnimatePresence> 

                {/* Replace ToastContainer with TelegramToast */}
                <TelegramToast
                    message={toastState.message}
                    type={toastState.type}
                    isVisible={toastState.isVisible}
                    onClose={() => toastService.dismiss()}
                />
            </div>
        </>
    );
};

export default TelegramBuy;
