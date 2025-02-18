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
import { checkAllowance, approveToken, transferToken, getTokenBalance, transferNativeToken, TokenType } from '../services/paymentService';
import axios from 'axios';
import { RiCoinFill, RiLockLine, RiTimeLine, RiUserFollowLine } from 'react-icons/ri';
import { HiSparkles } from 'react-icons/hi';
import { ImStatsBars } from 'react-icons/im';
import { BsLightningCharge, BsShieldCheck, BsGraphUp } from 'react-icons/bs';
import { AiOutlineFieldTime } from 'react-icons/ai';
import AnimatedBackground from './AnimatedBackground';
import { RiShieldLine } from 'react-icons/ri';
import { usePublicClient, useWalletClient, useChainId } from 'wagmi';
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

const BuyTokens: React.FC = () => {
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
    const [usdValue, setUsdValue] = useState<string>('');

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

            if (paymentToken === 'NATIVE' && supportedNetwork) {
                // Convert native token to USD
                usdAmount = await convertNativeTokenToUSD(amount, supportedNetwork.nativeCoin);
                setUsdValue(usdAmount.toFixed(2));
            } else {
                // For USDT, use 1:1 ratio
                usdAmount = parseFloat(amount);
                setUsdValue(amount);
            }

            // Calculate tokens based on USD value
            const calculated = usdAmount / tokenConfig.price;
            setReceivedAmount(calculated.toString());
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
    const handleTokenButtonClick = (token: TokenWithDetails) => {
        if (!isConnected) {
            connectWallet();
            return;
        }

        // Add network validation check
        if (supportedNetwork?.nativeCoin === 'GNF') {
            toast.error('Please switch to a supported payment network (BSC, Polygon, or Avalanche)');
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
                showToast({ message: 'Failed to connect wallet', type: 'error' });
            }
            return;
        }

        // Change this part to handle social verification click
        if (tokenSymbol === 'GNF10' && !socialVerified) {
            if (verificationStatus === 'pending') {
                showToast({ message: 'Your verification is in progress. Please wait.', type: 'info' });
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
            showToast({ message: `${paymentToken} approved successfully`, type: 'success' });
        } catch (error: any) {
            console.error('Approval error:', error);
            showToast({ message: error.message || 'Failed to approve token', type: 'error' });
            setHasAllowance(false);
        } finally {
            setIsApproving(false);
        }
    };

    const handlePurchaseConfirm = async () => {
        if (!selectedToken || !amount || !account || !chainId) return;

        // Add network validation check
        if (supportedNetwork?.nativeCoin === 'GNF') {
            toast.error('Please switch to a supported payment network (BSC, Polygon, or Avalanche)');
            setSelectedToken(null);
            return;
        }

        setLoading(true);
        let transferToastId = null;
        
        try {
            // Validate amount
            if (!validateAmount(amount, selectedToken)) {
                throw new Error('Invalid amount');
            }

            // Convert amount to USD for validation
            let usdAmount = parseFloat(usdValue);
            if (usdAmount <= 0) {
                throw new Error('Invalid amount');
            }

            // GNF10 limit check with proper decimal conversion
            if (selectedToken === 'GNF10') {
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

            transferToastId = showToast({ message: 'Transferring payment...', type: 'info', duration: 0 });

            // Get chainId from network
            const currentChainId = chainId;
            if (!currentChainId) throw new Error('Network not detected');

            let txHash: string;

            if (paymentToken === 'NATIVE') {
                txHash = await transferNativeToken(amount, chainId);
            } else {
                txHash = await transferToken(paymentToken as TokenType, amount, chainId);
            }

            showToast({ message: 'Payment confirmed! Processing purchase...', type: 'info' });

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
        showToast({
            message: selectedToken === 'GNF10' 
                ? '🎉 Tokens transferred successfully! To claim your tokens, please visit Dashboard'
                : '🎉 Purchase successful! To claim your tokens after vesting period, please visit Dashboard',
            type: 'success',
            duration: 8000 // Increased duration to give users more time to read
        });
        
        // Optional: Add a second toast with a clickable link
        setTimeout(() => {
            showToast({
                message: '🔗 Click here to go to Dashboard',
                type: 'info',
                duration: 5000
            });
            // You could also programmatically navigate to dashboard here if clicked
        }, 1000);
        
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
        showToast({
            message: error.message || 'Purchase failed',
            type: 'error',
            duration: 6000
        });
        console.error('Purchase error:', error);
    };

    const handleSocialVerification = async () => {
        if (!account) return;
        
        if (hasSubmitted) {
            showToast({ message: 'You have already submitted your handles. Verification is pending.', type: 'error' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await submitSocialHandles(account, twitterHandle, discordHandle);
            if (response.success) {
                setVerificationStatus('pending');
                setHasSubmitted(true);
                showToast({ message: 'Social handles submitted for verification', type: 'success' });
                setShowSocialModal(false);
            }
        } catch (error: any) {
            if (error.response && error.response.data.message === 'Already submitted') {
                showToast({ message: 'You have already submitted your handles. Verification is pending.', type: 'error' });
                setHasSubmitted(true);
            } else {
                showToast({ message: 'Failed to submit social handles', type: 'error' });
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
    
        // Check max amount for GNF10
        if (selectedToken === 'GNF10' && numericValue > 40) {
            setAmount('40');
            return;
        }
    
        try {
            if (paymentToken === 'NATIVE' && supportedNetwork) {
                // For native tokens, get USD value first
                const usdAmount = await convertNativeTokenToUSD(value, supportedNetwork.nativeCoin);
                
                // Check if exceeds max USD amount (40 USD)
                if (usdAmount > 40) {
                    setAmount(maxNativeAmount);
                    setUsdValue('40');
                    return;
                }
    
                setUsdValue(usdAmount.toFixed(2));
            } else {
                // For USDT, direct USD value
                if (numericValue > 40) {
                    setAmount('40');
                    setUsdValue('40');
                    return;
                }
                setUsdValue(value);
            }
    
            setAmount(value);
            
            // Calculate received tokens based on USD value
            if (selectedToken) {
                const tokenConfig = TOKEN_CONFIGS[selectedToken as keyof typeof TOKEN_CONFIGS];
                const calculatedTokens = parseFloat(usdValue) / tokenConfig.price;
                setReceivedAmount(calculatedTokens.toFixed(4));
            }
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

    if (loading) {
        return <DashboardLoader />;
    }

    return (
        <div className="min-h-screen relative overflow-hidden pb-16"> {/* Added pb-16 for footer space */}
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("/bg.png")' }}
            />

            {/* Main Content - Added top & bottom margin */}
            <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-6 mt-20 mb-8"> {/* Adjusted margins */}
                {/* Enhanced Navigation Tabs */}
                <div className="bg-[#0f172a]/90 p-2 rounded-2xl backdrop-blur-sm mb-8 border border-white/10 relative overflow-hidden">
                    {/* Vector Background Pattern */}
                    <div className="absolute inset-0">
                        <svg className="w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path
                                d="M0,0 L100,0 L90,100 L10,100 Z"
                                fill="url(#grad)"
                            />
                            <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: '#0194FC' }} />
                                    <stop offset="100%" style={{ stopColor: '#300855' }} />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <div className="flex justify-between items-center relative">
                        {tokenEntries.map((token, index) => (
                            <VectorButton
                                key={token.key}
                                variant="outline"
                                isActive={currentCardIndex === index}
                                onClick={() => setCurrentCardIndex(index)}
                                className="flex-1 px-6 py-4"
                            >
                                <span>
                                    {token.key === 'GNF10' && 'Tier 1'}
                                    {token.key === 'GNF1000' && 'Tier 2'}
                                    {token.key === 'GNF10000' && 'Tier 3'}
                                </span>
                                {currentCardIndex === index && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-[#0194FC]/10 to-[#0182e0]/10 rounded-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </VectorButton>
                        ))}
                    </div>
                </div>

                {/* Vector-styled Token Card Container */}
                <div className="relative">
                    {/* Vector Background Accent */}
                    <div className="absolute -inset-1">
                        <div className="w-full h-full bg-gradient-to-r from-[#0194FC] to-[#300855] opacity-50 blur-lg" />
                    </div>

                    <TokenCard
                        token={tokenEntries[currentCardIndex]}
                        onBuyClick={() => handleTokenButtonClick(tokenEntries[currentCardIndex])}
                        onVerifyClick={() => setShowSocialModal(true)}  // Add this prop
                        isButtonDisabled={isButtonDisabled(tokenEntries[currentCardIndex])}
                        getButtonText={getButtonText}
                    />
                </div>
            </div>

            {/* Enhanced Purchase Modal */}
            <AnimatePresence>
                {selectedToken && (
                    <PurchaseModal
                        selectedToken={selectedToken}
                        onClose={() => setSelectedToken(null)}
                        amount={amount}
                        onAmountChange={handleAmountChange}
                        paymentToken={paymentToken}
                        onPaymentTokenChange={handlePaymentTokenChange}
                        usdValue={usdValue}
                        receivedAmount={receivedAmount}
                        loading={loading}
                        isApproving={isApproving}
                        hasAllowance={hasAllowance}
                        onApprove={handleApprove}
                        onPurchaseConfirm={handlePurchaseConfirm}
                        paymentOptions={paymentOptions}
                        maxAmount={paymentToken === 'NATIVE' ? maxNativeAmount : '40'}
                    />
                )}
            </AnimatePresence>

            {/* Updated Social Verification Modal */}
            <AnimatePresence>
                {showSocialModal && (
                    <SocialVerificationModal
                        isOpen={showSocialModal}
                        onClose={() => setShowSocialModal(false)}
                        account={account || ''}
                        hasSubmitted={hasSubmitted}
                        setHasSubmitted={setHasSubmitted}
                        setVerificationStatus={setVerificationStatus}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default BuyTokens;