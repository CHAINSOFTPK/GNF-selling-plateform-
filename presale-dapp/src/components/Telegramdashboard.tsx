import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/Web3Context';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUserFriends, FaWallet, FaExchangeAlt, FaRegClock,
    FaCopy, FaChartLine, FaLock, FaUnlock, FaHistory,
    FaUsers, FaLink, FaClock, FaGem, FaCalendarAlt, FaCheckCircle, FaArrowLeft
} from 'react-icons/fa';
import { usePresaleContract } from '../hooks/usePresaleContract';
import { ethers } from 'ethers';
import { IconType } from 'react-icons';
import { showToast } from './CustomToast';
import DashboardLoader from './DashboardLoader';
import TelegramHeader from './TelegramHeader';
import TelegramFooter from './TelegramFooter';
import TelegramToast from './TelegramToast';
import { usePublicClient, useWalletClient, useChainId } from 'wagmi';
import { createToastService } from '../services/toastService';
import { switchToNetwork } from '../utils/network';

interface VestingInfo {
    lastClaimDate: number | null;
    nextClaimDate: number | null;
    totalClaimed: string;
}

// Add interfaces
interface Referral {
    address: string;
    joinedTime: string;
    bonus: string;
}

const HexagonPattern = () => (
    <svg className="absolute w-full h-full opacity-5" viewBox="0 0 100 100">
        <pattern id="hexagon" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M10,0 L20,5 L20,15 L10,20 L0,15 L0,5 Z" fill="currentColor"/>
        </pattern>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#hexagon)"/>
    </svg>
);

const CircuitLines = () => (
    <svg className="absolute w-full h-full opacity-5" viewBox="0 0 100 100">
        <pattern id="circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0,20 H40 M20,0 V40" stroke="currentColor" strokeWidth="0.5" fill="none"/>
            <circle cx="20" cy="20" r="2" fill="currentColor"/>
        </pattern>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit)"/>
    </svg>
);

// Helper functions moved outside component
const calculateTotalPurchased = (data: any[] | undefined) => {
    if (!data) return '0';
    return data.reduce((acc, curr) => {
        const purchases = curr.purchases.amounts || [];
        return acc + purchases.reduce((sum: number, amount: string) => 
            sum + Number(ethers.utils.formatEther(amount)), 0);
    }, 0).toFixed(2);
};

const calculatePendingVesting = (data: any[] | undefined) => {
    if (!data) return '0';
    const now = Date.now() / 1000;
    
    return data.reduce((acc, curr) => {
        const details = curr.vestingDetails;
        return acc + (details?.amounts || [])
            .filter((_: any, i: number) => {
                const releaseTime = details.releaseTimes[i];
                const claimed = details.claimedStatus[i];
                return !claimed && releaseTime > now;
            })
            .reduce((sum: number, amount: string) => 
                sum + Number(ethers.utils.formatEther(amount)), 0);
    }, 0).toFixed(2);
};

const formatTimeRemaining = (timestamp: number | null): string => {
    if (!timestamp) return 'No pending claims';
    
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Ready to claim';
    
    const days = Math.floor(diff / (24 * 60 * 60));
    const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((diff % (60 * 60)) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}m`;
    return `${minutes}m`;
};

const formatLastClaim = (timestamp: number | null): string => {
    if (!timestamp) return 'Never claimed';
    
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

// Update the parseContractError function
const parseContractError = (error: any): string => {
    try {
        // Handle MetaMask RPC error format
        if (error?.data?.data) {
            const nestedMessage = error.data.data.message || error.data.message;
            if (nestedMessage) {
                if (nestedMessage.includes('revert')) {
                    // Extract the actual revert message
                    const revertMessage = nestedMessage.split('revert ')[1];
                    return getReadableErrorMessage(revertMessage);
                }
                return getReadableErrorMessage(nestedMessage);
            }
        }

        // Handle direct error message
        if (error.message) {
            if (error.message.includes('execution reverted:')) {
                const revertMessage = error.message.split('execution reverted:')[1].trim();
                return getReadableErrorMessage(revertMessage);
            }
            if (error.message.includes('user denied')) {
                return "Transaction was cancelled by user";
            }
            if (error.message.includes('network changed')) {
                return "Please stay on GNF Network while transaction is processing";
            }
        }

        // Handle error.reason format
        if (error.reason) {
            return getReadableErrorMessage(error.reason);
        }

        return "Something went wrong. Please try again.";
    } catch (e) {
        console.error('Error parsing contract error:', e);
        return "Something went wrong. Please try again.";
    }
};

// Add this helper function to convert technical messages to user-friendly ones
const getReadableErrorMessage = (message: string): string => {
    const errorMessages: { [key: string]: string } = {
        'Cannot self-refer': "You cannot use your own referral code",
        'Already referred': "You have already used a referral code",
        'Already generated': "You have already generated a referral code",
        'No rewards': "You don't have any rewards to claim",
        'Invalid referral code': "Please enter a valid referral code",
        'Referral code not found': "This referral code doesn't exist"
        // Add more mappings as needed
    };

    // Check if we have a user-friendly version of the message
    for (const [technical, readable] of Object.entries(errorMessages)) {
        if (message.includes(technical)) {
            return readable;
        }
    }

    // If no mapping found, return the original message with first letter capitalized
    return message.charAt(0).toUpperCase() + message.slice(1);
};

const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0194FC] border-t-transparent rounded-full animate-spin" />
    </div>
);

// Update text colors in StatsCard component
const StatsCard: React.FC<{
    title: string;
    value: string | number;
    icon: IconType;
}> = ({ title, value, icon: Icon }) => (
    <div className="bg-[#1c1c1c] p-2 rounded-lg border border-gray-800">
        <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-[#0194FC]/10 flex items-center justify-center">
                <Icon className="text-[#0194FC] text-xs" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-white/60 text-[10px] truncate">{title}</p>
                <p className="text-white text-xs font-medium mt-0.5 truncate">{value}</p>
            </div>
        </div>
    </div>
);

// Update the BeautifulLoader component
const BeautifulLoader = () => (
    <div className="flex-1 flex items-center justify-center bg-[#0f172a] min-h-[70vh]">
        <div className="relative w-20 h-20">
            {/* Outer circle */}
            <div className="absolute inset-0 border-4 border-[#0194FC]/20 rounded-full animate-ping"></div>
            {/* Inner rotating circle */}
            <div className="absolute inset-0 border-4 border-[#0194FC]/20 border-t-[#0194FC] rounded-full animate-spin"></div>
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 100 100" className="text-[#0194FC]">
                    <path
                        fill="currentColor"
                        d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C27.9 90 10 72.1 10 50S27.9 10 50 10s40 17.9 40 40-17.9 40-40 40z"
                    />
                    <path
                        fill="currentColor"
                        d="M50 20c-16.5 0-30 13.5-30 30s13.5 30 30 30 30-13.5 30-30-13.5-30-30-30zm0 50c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z"
                    />
                </svg>
            </div>
        </div>
    </div>
);

const Telegramdashboard: React.FC = () => {
    const navigate = useNavigate();
    const { account, connectWallet } = useWallet();
    const chainId = useChainId();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

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

    const { 
        loading, 
        error, 
        purchaseData, 
        claimableAmount,
        claimTokens,
        referralInfo,
        generateReferralCode,
        registerReferral,
        claimReferralRewards
    } = usePresaleContract(account);

    const [referralCode, setReferralCode] = useState('');
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [inputReferralCode, setInputReferralCode] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [registrationError, setRegistrationError] = useState('');

    // Add new state for active tab
    const [activeTab, setActiveTab] = useState<'gnf' | 'referral'>('gnf');
    const [showHistory, setShowHistory] = useState(false);

    // Add state for claiming referral rewards
    const [isClaimingRewards, setIsClaimingRewards] = useState(false);

    // Create tab options
    const tabOptions = [
        { id: 'gnf', label: 'GNF Tokens', icon: <FaGem /> },
        { id: 'referral', label: 'Referral', icon: <FaUsers /> }
    ];

    // Add state for footer menu
    const [currentPage, setCurrentPage] = useState<'buy' | 'dashboard' | 'guide'>('dashboard');

    // Update the navigation handler
    const handleFooterMenuClick = (action: 'buy' | 'dashboard' | 'guide') => {
        switch(action) {
            case 'buy':
                navigate('/bot'); // Update this to go to /bot instead of /
                break;
            case 'dashboard':
                // Already on dashboard, no need to navigate
                break;
            case 'guide':
                navigate('/telegramguide');
                break;
        }
    };

    // Update the renderTabNavigation function
    const renderTabNavigation = () => (
        <div className="relative mb-3">
            <div className="relative bg-[#0f172a]/90 p-1 rounded-lg backdrop-blur-xl border border-white/10">
                <div className="flex justify-between items-stretch relative gap-1">
                    {tabOptions.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'gnf' | 'referral')}
                            className={`
                                flex-1 relative flex items-center justify-center gap-1
                                px-2 py-1.5 rounded-md text-xs font-medium
                                transition-all duration-200
                                ${activeTab === tab.id 
                                    ? 'text-white bg-[#0880E3]/20' 
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            <span className="text-xs">{tab.icon}</span>
                            <span className="text-xs">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Enhanced referral code generation
    const handleGenerateCode = async () => {
        if (!account) {
            showToast({ 
                message: 'Please connect your wallet first', 
                type: 'error' 
            });
            return;
        }

        try {
            setIsGenerating(true);
            await generateReferralCode();
            showToast({ 
                message: 'Referral code generated successfully! 🎉', 
                type: 'success' 
            });
        } catch (err: any) {
            const errorMessage = parseContractError(err);
            showToast({ 
                message: errorMessage, 
                type: 'error' 
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // Enhanced referral registration
    const handleRegisterReferral = async () => {
        try {
            setIsRegistering(true);
            setRegistrationError('');
            if (!inputReferralCode) {
                throw new Error('Please enter a referral code');
            }
            await registerReferral(inputReferralCode);
            setInputReferralCode('');
            setShowRegisterModal(false);
            showToast({ 
                message: '✨ Referral code activated successfully! You will now receive bonus tokens on your purchases', 
                type: 'success',
                duration: 5000 
            });
        } catch (err: any) {
            const errorMessage = parseContractError(err);
            setRegistrationError(errorMessage);
            showToast({ 
                message: errorMessage, 
                type: 'error' 
            });
        } finally {
            setIsRegistering(false);
        }
    };

    // Copy referral code function
    const copyReferralCode = () => {
        if (referralInfo?.userReferralCode) {
            navigator.clipboard.writeText(referralInfo.userReferralCode);
            showToast({ 
                message: '📋 Referral code copied to clipboard!', 
                type: 'success' 
            });
        }
    };

    const copyToClipboard = () => {
    };

    const handleClaimRewards = async () => {
        try {
            setIsClaimingRewards(true);
            await claimReferralRewards();
            showToast({ 
                message: '🎉 Rewards claimed successfully!', 
                type: 'success' 
            });
        } catch (err: any) {
            const errorMessage = parseContractError(err);
            showToast({ 
                message: errorMessage, 
                type: 'error' 
            });
        } finally {
            setIsClaimingRewards(false);
        }
    };

    // Add referrals mock data with proper typing
    const referrals: Referral[] = [
        { address: '0x......1233', joinedTime: '2 days ago', bonus: '10 GNF' },
        { address: '0x......1234', joinedTime: '3 days ago', bonus: '15 GNF' },
        { address: '0x......1235', joinedTime: '5 days ago', bonus: '20 GNF' }
    ];

    // Move calculateTotalPurchases inside component
    const calculateTotalPurchases = (data: any[] | undefined) => {
        if (!data) return 0;
        return data.reduce((acc, curr) => acc + (curr.totalPurchases || 0), 0);
    };

    // Consolidate all memoized calculations into one hook
    const memoizedData = useMemo(() => {
        // Format purchases data
        const formatted = !purchaseData ? [] : purchaseData.flatMap((option) => {
            const amounts = option.vestingDetails.amounts || [];
            const releaseTimes = option.vestingDetails.releaseTimes || [];
            const claimedStatus = option.vestingDetails.claimedStatus || [];
            
            return amounts.map((amount: any, index: number) => ({
                tier: `Tier ${option.optionId + 1}`,
                amount: `${ethers.utils.formatEther(amount)} GNF`,
                vestingPeriod: new Date(Number(releaseTimes[index]) * 1000).toLocaleDateString(),
                claimed: claimedStatus[index]
            }));
        }).filter(purchase => !purchase.claimed);

        // Calculate vesting info
        const now = Date.now() / 1000;
        let lastClaimDate: number | null = null;
        let nextClaimDate: number | null = null;
        let totalClaimed = 0;

        if (purchaseData) {
            purchaseData.forEach(option => {
                const vestingDetails = option.vestingDetails;
                const releaseTimes = vestingDetails.releaseTimes || [];
                const claimedStatus = vestingDetails.claimedStatus || [];
                const amounts = vestingDetails.amounts || [];

                releaseTimes.forEach((releaseTime: number, index: number) => {
                    if (claimedStatus[index]) {
                        totalClaimed += Number(ethers.utils.formatEther(amounts[index]));
                        if (!lastClaimDate || releaseTime > lastClaimDate) {
                            lastClaimDate = releaseTime;
                        }
                    } else if (releaseTime > now && (!nextClaimDate || releaseTime < nextClaimDate)) {
                        nextClaimDate = releaseTime;
                    }
                });
            });
        }

        // Calculate stats
        const stats = [
            { 
                title: 'Total Purchases', 
                value: calculateTotalPurchases(purchaseData), 
                icon: FaUserFriends 
            },
            { 
                title: 'Total Purchased GNF', 
                value: `${calculateTotalPurchased(purchaseData)} GNF`, 
                icon: FaWallet 
            },
            { 
                title: 'Claimable GNF', 
                value: `${claimableAmount} GNF`, 
                icon: FaExchangeAlt 
            },
            { 
                title: 'Pending Vesting', 
                value: `${calculatePendingVesting(purchaseData)} GNF`, 
                icon: FaRegClock 
            }
        ];

        return {
            formattedPurchases: formatted,
            vestingInfo: {
                lastClaimDate,
                nextClaimDate,
                totalClaimed: totalClaimed.toFixed(2)
            },
            stats
        };
    }, [purchaseData, claimableAmount]);

    // Extract memoized values
    const { formattedPurchases, vestingInfo, stats } = memoizedData;

    // Update loading state
    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">
            {error}
        </div>;
    }

    // Handle claim with network check
    const handleClaim = async (optionId: number) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            if (network.chainId !== 1013) {
                // Add GNF network if not added
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x3F5' }], // 1013 in hex
                    });
                } catch (switchError: any) {
                    // If network doesn't exist, add it
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0x3F5',
                                chainName: 'GNF Network',
                                nativeCurrency: {
                                    name: 'GNF',
                                    symbol: 'GNF',
                                    decimals: 18
                                },
                                rpcUrls: ['https://evm.globalnetwork.foundation/'],
                                blockExplorerUrls: ['https://explore.globalnetwork.foundation/']
                            }]
                        });
                    }
                }
            }
            
            await claimTokens(optionId);
            showToast({ 
                message: '🎉 Tokens claimed successfully!', 
                type: 'success' 
            });
        } catch (err: any) {
            const errorMessage = parseContractError(err);
            showToast({ 
                message: errorMessage, 
                type: 'error' 
            });
        }
    };

    // Generate referral link from referralInfo
    const getReferralLink = () => {
        if (referralInfo?.userReferralCode) {
            return `${window.location.origin}/register?ref=${referralInfo.userReferralCode}`;
        }
        return 'Generate your referral code to get your link';
    };

    // Update stats array to use real data
    const updatedStats = [
        { 
            title: 'Total Referrals', 
            value: referralInfo?.totalReferrals || 0, 
            icon: FaUserFriends 
        },
        { 
            title: 'Pending Rewards', 
            value: `${referralInfo?.pendingRewards || 0} GNF`, 
            icon: FaWallet 
        },
        { 
            title: 'Referrer Rate', 
            // Convert basis points to percentage (200 basis points = 2%)
            value: `${(referralInfo?.referrerRewardRate || 0) / 100}%`, 
            icon: FaExchangeAlt 
        },
        { 
            title: 'Referee Bonus', 
            // Convert basis points to percentage (100 basis points = 1%)
            value: `${(referralInfo?.referredBonusRate || 0) / 100}%`, 
            icon: FaRegClock 
        }
    ];

    // Update referral list rendering to use real data
    const referredAddresses = referralInfo?.referredAddresses || [];

    // Replace the referral link section with this simplified version
    const renderReferralSection = () => (
        <div className="relative bg-[#0f172a]/90 backdrop-blur-xl p-6 rounded-xl border border-white/20 shadow-lg">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <FaUsers className="text-[#0194FC]" />
                Referral System
            </h2>

            <div className="space-y-6">
                {/* Referral Stats */}
                {(referralInfo?.userReferralCode || referralInfo?.userReferrer) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-white/10">
                            <span className="text-white/60 text-sm">Total Referrals</span>
                            <p className="text-white font-medium text-xl mt-1">
                                {referralInfo.totalReferrals || 0}
                            </p>
                        </div>
                        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-white/10">
                            <span className="text-white/60 text-sm">Pending Rewards</span>
                            <p className="text-white font-medium text-xl mt-1">
                                {referralInfo.pendingRewards || 0} GNF
                            </p>
                        </div>
                    </div>
                )}

                {/* Your Referral Code Section */}
                <div className="space-y-2">
                    <h3 className="text-white font-medium">Your Referral Code</h3>
                    {referralInfo?.userReferralCode ? (
                        <div className="flex items-center justify-between bg-[#1e293b]/50 p-4 rounded-lg border border-white/10">
                            <div>
                                <p className="text-white font-medium text-xl">{referralInfo.userReferralCode}</p>
                                <p className="text-white/60 text-sm mt-1">
                                    Share this code to earn {(referralInfo.referrerRewardRate || 0) / 100}% rewards
                                </p>
                            </div>
                            <button 
                                onClick={copyReferralCode}
                                className="text-[#0194FC] hover:text-[#0194FC]/80 transition-all p-2"
                            >
                                <FaCopy size={20} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerateCode}
                            disabled={isGenerating}
                            className="w-full px-4 py-3 bg-[#0194FC] text-white rounded-lg hover:bg-[#0194FC]/80 transition-all text-sm font-medium flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FaLink size={14} />
                                    Generate Referral Code
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Use Someone's Code Section */}
                {!referralInfo?.userReferrer && (
                    <div className="space-y-2">
                        <h3 className="text-white font-medium">Use Someone's Code</h3>
                        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-white/10">
                            <div className="space-y-4">
                                {registrationError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                        {registrationError}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter referral code"
                                        value={inputReferralCode}
                                        onChange={(e) => setInputReferralCode(e.target.value)}
                                        className="flex-1 bg-[#0f172a] text-white p-3 rounded-lg border border-white/10 focus:border-[#0194FC] outline-none"
                                    />
                                    <button
                                        onClick={handleRegisterReferral}
                                        disabled={isRegistering || !inputReferralCode}
                                        className="px-6 bg-[#0194FC] text-white rounded-lg hover:bg-[#0194FC]/80 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRegistering ? '...' : 'Use Code'}
                                    </button>
                                </div>
                                <p className="text-white/60 text-sm">
                                    Get {(referralInfo?.referredBonusRate || 0) / 100}% bonus on your purchases
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Show Referrer if exists */}
                {referralInfo?.userReferrer && (
                    <div className="space-y-2">
                        <h3 className="text-white font-medium">Your Referrer</h3>
                        <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-white/10">
                            <p className="text-white font-medium">{referralInfo.userReferrer}</p>
                            <p className="text-white/60 text-sm mt-1">
                                You get {(referralInfo.referredBonusRate || 0) / 100}% bonus on purchases
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Render GNF content
    const renderGNFContent = () => (
        <div className="space-y-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                {stats.map((stat, index) => (
                    <StatsCard
                        key={index}
                        title={stat.title}
                        value={typeof stat.value === 'number' 
                            ? stat.value.toFixed(3) 
                            : stat.value.includes('GNF') 
                                ? `${parseFloat(stat.value).toFixed(3)} GNF`
                                : stat.value
                        }
                        icon={stat.icon}
                    />
                ))}
            </div>

            {/* Professional Claim Section */}
            <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-white text-xs font-medium flex items-center gap-1">
                            <FaUnlock className="text-[#0194FC] text-[10px]" />
                            Claimable
                        </h2>
                        <p className="text-white/60 text-[10px]">Available rewards</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-white">
                            {parseFloat(claimableAmount).toFixed(3)} GNF
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-[#1e293b]/50 p-2 rounded-lg border border-white/10">
                        <p className="text-white/60 text-[10px] mb-0.5">Last Claim</p>
                        <p className="text-white text-[11px] flex items-center gap-1">
                            <FaHistory className="text-[#0194FC] text-[10px]" />
                            {formatLastClaim(vestingInfo?.lastClaimDate ?? null)}
                        </p>
                    </div>
                    <div className="bg-[#1e293b]/50 p-2 rounded-lg border border-white/10">
                        <p className="text-white/60 text-[10px] mb-0.5">Next Claim</p>
                        <p className="text-white text-[11px] flex items-center gap-1">
                            <FaLock className="text-[#0194FC] text-[10px]" />
                            {formatTimeRemaining(vestingInfo?.nextClaimDate ?? null)}
                        </p>
                    </div>
                    <div className="bg-[#1e293b]/50 p-2 rounded-lg border border-white/10">
                        <p className="text-white/60 text-[10px] mb-0.5">Total Claimed</p>
                        <p className="text-white text-[11px] flex items-center gap-1">
                            <FaWallet className="text-[#0194FC] text-[10px]" />
                            {parseFloat(vestingInfo?.totalClaimed || '0').toFixed(3)} GNF
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleClaim(0)} 
                        disabled={!Number(claimableAmount)}
                        className={`flex-1 px-4 py-2 ${
                            Number(claimableAmount) > 0 
                                ? 'bg-[#0194FC] hover:bg-[#0194FC]/80' 
                                : 'bg-gray-600 cursor-not-allowed'
                        } text-white text-sm rounded-lg transition-all font-medium flex items-center justify-center gap-2`}
                    >
                        <FaUnlock className="text-sm" />
                        {Number(claimableAmount) > 0 ? 'Claim Tokens' : 'Nothing to Claim'}
                    </button>
                    <button 
                        onClick={() => {
                            setShowHistory(true);
                            // Smooth scroll to the purchases section
                            document.getElementById('purchases-section')?.scrollIntoView({ 
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }}
                        className="px-4 py-2 bg-[#1e293b] text-white text-sm rounded-lg hover:bg-[#1e293b]/80 transition-all font-medium border border-white/10"
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Recent Purchases Section Moved to Bottom */}
            <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white text-xs font-medium flex items-center gap-1">
                        <FaGem className="text-[#0194FC] text-[10px]" />
                        {showHistory ? 'Purchase History pending Claim' : 'Recent Purchases'}
                    </h2>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-white/60 bg-[#1e293b] px-2 py-1 rounded-md">
                            {showHistory ? 'All time' : 'Last 30 days'}
                        </span>
                        {showHistory && (
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-[10px] text-[#0194FC] hover:text-[#0194FC]/80 transition-all"
                            >
                                Show Recent Only
                            </button>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    {formattedPurchases.length > 0 ? (
                        (showHistory ? formattedPurchases : formattedPurchases.slice(0, 5)).map((purchase, index) => (
                            <div key={index} className="bg-[#1e293b]/50 rounded-lg border border-white/10 overflow-hidden">
                                <div className="p-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-lg bg-[#0194FC]/10 flex items-center justify-center">
                                            <FaGem className="text-[#0194FC]" size={10} />
                                        </div>
                                        <div>
                                            <p className="text-white text-[11px] font-medium">{purchase.tier}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <FaCalendarAlt className="text-[#0194FC]" size={8} />
                                                <span className="text-white/60 text-[10px]">
                                                    Vesting until {purchase.vestingPeriod}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white text-[11px] font-medium">
                                            {parseFloat(purchase.amount).toFixed(3)} GNF
                                        </p>
                                        <p className="text-[#0194FC] text-[10px]">Purchased</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-white/60 py-2 text-[11px]">
                            No purchases found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Update the renderReferralContent function
    const renderReferralContent = () => (
        <div className="space-y-2">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                {updatedStats.map((stat, index) => (
                    <StatsCard
                        key={index}
                        title={stat.title}
                        value={typeof stat.value === 'number' 
                            ? stat.value.toFixed(4) 
                            : stat.value.includes('GNF') 
                                ? `${parseFloat(stat.value).toFixed(4)} GNF`
                                : stat.value
                        }
                        icon={stat.icon}
                    />
                ))}
            </div>

            {/* Add Claim Rewards Button if there are pending rewards */}
            {Number(referralInfo?.pendingRewards) > 0 && (
                <div className="bg-[#1c1c1c] p-3 rounded-lg border border-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-white font-medium text-sm flex items-center gap-1">
                                <FaWallet className="text-[#0194FC] text-xs" />
                                Referral Rewards
                            </h2>
                            <p className="text-white/60 text-[10px]">
                                You have {referralInfo?.pendingRewards || '0'} GNF in pending rewards
                            </p>
                        </div>
                        <button
                            onClick={handleClaimRewards}
                            disabled={isClaimingRewards}
                            className="px-4 py-2 bg-[#0194FC] text-white rounded-lg hover:bg-[#0194FC]/80 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isClaimingRewards ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Claiming...
                                </>
                            ) : (
                                <>
                                    <FaWallet size={14} />
                                    Claim Rewards
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Referral Code Section */}
            <div className="bg-[#1c1c1c] p-3 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-white font-medium text-sm flex items-center gap-1">
                            <FaLink className="text-[#0194FC]" />
                            Referral System
                        </h2>
                        <p className="text-white/60 text-[10px]">Generate and use referral codes</p>
                    </div>
                </div>

                {/* Generate Code Section */}
                <div className="space-y-2">
                    {referralInfo?.userReferralCode ? (
                        <div className="bg-[#1e293b]/50 p-3 rounded-lg border border-white/10">
                            <h3 className="text-white font-medium mb-1">Your Referral Code</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium text-base">{referralInfo.userReferralCode}</p>
                                    <p className="text-white/60 text-[10px] mt-1">
                                        Share this code to earn {(referralInfo.referrerRewardRate || 0) / 100}% rewards
                                    </p>
                                </div>
                                <button 
                                    onClick={copyReferralCode}
                                    className="text-[#0194FC] hover:text-[#0194FC]/80 transition-all p-2"
                                >
                                    <FaCopy size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-white font-medium mb-1">Generate Your Code</h3>
                            <button
                                onClick={handleGenerateCode}
                                disabled={isGenerating}
                                className="w-full px-4 py-2 bg-[#0194FC] text-white rounded-lg hover:bg-[#0194FC]/80 transition-all text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <FaLink size={14} />
                                        Generate Referral Code
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Use Code Section - Only show if user hasn't used a code yet (has zero address as referrer) */}
                    {referralInfo?.userReferrer === '0x0000000000000000000000000000000000000000' && (
                        <div>
                            <h3 className="text-white font-medium mb-1">
                                <span className="flex items-center gap-1">
                                    <FaLink className="text-[#0194FC]" />
                                    Connect with a Referrer
                                </span>
                                <p className="text-white/60 text-[10px] font-normal mt-1">
                                    
                                </p>
                            </h3>
                            <div className="bg-[#1e293b]/50 p-3 rounded-lg border border-white/10">
                                <div className="space-y-2">
                                    {registrationError && (
                                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px]">
                                            {registrationError}
                                        </div>
                                    )}
                                    <div className="flex gap-1">
                                        <input
                                            type="text"
                                            placeholder="Enter your referral code"
                                            value={inputReferralCode}
                                            onChange={(e) => setInputReferralCode(e.target.value)}
                                            className="flex-1 bg-[#0f172a] text-white p-2 rounded-lg border border-white/10 focus:border-[#0194FC] outline-none text-xs"
                                        />
                                        <button
                                            onClick={handleRegisterReferral}
                                            disabled={isRegistering || !inputReferralCode}
                                            className="px-4 bg-[#0194FC] text-white rounded-lg hover:bg-[#0194FC]/80 transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            {isRegistering ? '...' : 'Activate Bonus'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 text-white/60 text-[10px]">
                                        <FaGem className="text-[#0194FC] text-xs" />
                                        Receive {(referralInfo?.referredBonusRate || 0) / 100}% additional bonus on all your purchases
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Referrals List */}
            <div className="bg-[#1c1c1c] p-3 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-white font-medium text-sm flex items-center gap-1">
                            <FaUsers className="text-[#0194FC]" />
                            Your Referrals
                        </h2>
                        <p className="text-white/60 text-[10px]">People who used your code</p>
                    </div>
                    <span className="text-[10px] text-white/60 bg-[#1e293b] px-2 py-1 rounded-md">
                        Total: {referredAddresses.length}
                    </span>
                </div>
                <div className="space-y-2">
                    {referredAddresses.map((address: string, index: number) => (
                        <div key={index} className="bg-[#1e293b]/50 rounded-lg border border-white/10 overflow-hidden">
                            <div className="p-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-[#0194FC]/10 flex items-center justify-center">
                                        <FaCheckCircle className="text-[#0194FC]" size={12} />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-xs">{address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {referredAddresses.length === 0 && (
                        <div className="text-center text-white/60 py-3">
                            No referrals yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#1c1c1c] border-b border-gray-800">
                <TelegramHeader
                    account={account}
                    chainId={chainId}
                    onConnect={connectWallet}
                    onNetworkSwitch={handleNetworkSwitch}
                />
            </div>

            {/* Tab Navigation */}
            <div className="fixed top-[60px] left-0 right-0 z-40 bg-[#0f172a] px-2 py-3">
                <div className="max-w-[500px] mx-auto mt-2.5">
                    {renderTabNavigation()}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto pt-[120px] pb-20 mt-[26px]">
                <div className="px-2 max-w-[500px] mx-auto">
                    {loading ? (
                        <BeautifulLoader />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeTab === 'gnf' ? renderGNFContent() : renderReferralContent()}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <TelegramFooter 
                    onMenuClick={handleFooterMenuClick}
                    currentPage="dashboard"
                    navigationText={{
                        guide: 'Guide',
                        dashboard: 'Dashboard',
                        buy: 'Buy'
                    }}
                />
            </div>

            {/* Toast */}
            <div className="fixed bottom-16 left-0 right-0 z-50">
                <TelegramToast
                    message={toastState.message}
                    type={toastState.type}
                    isVisible={toastState.isVisible}
                    onClose={() => toastService.dismiss()}
                />
            </div>
        </div>
    );
};

export default Telegramdashboard;