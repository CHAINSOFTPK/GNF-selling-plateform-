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

const ReferralDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { account } = useWallet();
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

    // Update the renderTabNavigation function
    const renderTabNavigation = () => (
        <div className="relative mb-6">
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0880E3] to-[#0880E3]/50 rounded-lg blur-sm opacity-25" />
            
            <div className="relative bg-[#0f172a]/90 p-1.5 rounded-lg backdrop-blur-xl border border-white/10">
                <div className="flex justify-between items-stretch relative gap-1">
                    {tabOptions.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'gnf' | 'referral')}
                            className={`
                                flex-1 relative flex items-center justify-center gap-2
                                px-4 py-2 rounded-md text-sm font-medium
                                transition-all duration-200
                                ${activeTab === tab.id 
                                    ? 'text-white bg-[#0880E3]/20' 
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            <span className="text-base">{tab.icon}</span>
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 rounded-md"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                >
                                    <div className="absolute inset-0 bg-[#0880E3] opacity-10" />
                                    <div className="absolute inset-0 border border-[#0880E3]/30 rounded-md" />
                                </motion.div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Enhanced referral code generation
    const handleGenerateCode = async () => {
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
        if (referralInfo?.userReferralCode) {
            const referralLink = `${window.location.origin}/register?ref=${referralInfo.userReferralCode}`;
            navigator.clipboard.writeText(referralLink);
            showToast({ 
                message: '📋 Referral link copied to clipboard!', 
                type: 'success' 
            });
        }
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
    if (loading) {
        return <DashboardLoader />;
    }

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
        <>
            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0194FC] to-[#300855] rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"/>
                        <div className="relative bg-[#0f172a]/90 backdrop-blur-xl p-4 rounded-xl border border-white/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-white/60 text-xs mb-1">{stat.title}</p>
                                    <h3 className="text-white text-xl font-bold">{stat.value}</h3>
                                </div>
                                <div className="p-2 bg-gradient-to-r from-[#0194FC]/10 to-[#300855]/10 rounded-lg">
                                    <stat.icon className="text-[#0194FC]" size={16}/>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Professional Claim Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="transform hover:scale-[1.01] transition-all duration-300 mb-6"
            >
                <div className="bg-[#0f172a]/90 backdrop-blur-xl p-6 rounded-xl border border-white/20">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                                <FaUnlock className="text-[#0194FC] text-sm" />
                                Claimable Tokens
                            </h2>
                            <p className="text-white/60 text-xs">Your available rewards</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white mb-0.5">{claimableAmount} GNF</p>
                            <p className="text-[#0194FC] text-xs">Make sure while claiming you are on Global Network</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-white/10">
                            <p className="text-white/60 mb-1">Last Claim</p>
                            <p className="text-white flex items-center gap-2">
                                <FaHistory className="text-[#0194FC]" />
                                {formatLastClaim(vestingInfo?.lastClaimDate ?? null)}
                            </p>
                        </div>
                        <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-white/10">
                            <p className="text-white/60 mb-1">Next Claim</p>
                            <p className="text-white flex items-center gap-2">
                                <FaLock className="text-[#0194FC]" />
                                {formatTimeRemaining(vestingInfo?.nextClaimDate ?? null)}
                            </p>
                        </div>
                        <div className="bg-[#1e293b]/50 p-4 rounded-xl border border-white/10">
                            <p className="text-white/60 mb-1">Total Claimed</p>
                            <p className="text-white flex items-center gap-2">
                                <FaWallet className="text-[#0194FC]" />
                                {vestingInfo?.totalClaimed || '0'} GNF
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => handleClaim(0)} 
                            disabled={!Number(claimableAmount)}
                            className={`flex-1 px-6 py-2.5 ${
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
                            className="px-6 py-2.5 bg-[#1e293b] text-white text-sm rounded-lg hover:bg-[#1e293b]/80 transition-all font-medium border border-white/10"
                        >
                            History
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Recent Purchases Section Moved to Bottom */}
            <motion.div
                id="purchases-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="transform hover:scale-[1.01] transition-all duration-300"
            >
                <div className="bg-[#0f172a]/90 backdrop-blur-xl p-6 rounded-xl border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                            <FaGem className="text-[#0194FC]" />
                            {showHistory ? 'Purchase History pending Claim' : 'Recent Purchases'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/60 bg-[#1e293b] px-2 py-1 rounded-md">
                                {showHistory ? 'All time' : 'Last 30 days'}
                            </span>
                            {showHistory && (
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="text-xs text-[#0194FC] hover:text-[#0194FC]/80 transition-all"
                                >
                                    Show Recent Only
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-3">
                        {formattedPurchases.length > 0 ? (
                            (showHistory ? formattedPurchases : formattedPurchases.slice(0, 5)).map((purchase, index) => (
                                <div key={index} className="bg-[#1e293b]/50 rounded-lg border border-white/10 overflow-hidden">
                                    <div className="p-3 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#0194FC]/10 flex items-center justify-center">
                                                <FaGem className="text-[#0194FC]" size={14} />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium text-sm">{purchase.tier}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <FaCalendarAlt className="text-[#0194FC]" size={12} />
                                                    <span className="text-white/60 text-xs">
                                                        Vesting until {purchase.vestingPeriod}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-bold text-sm">{purchase.amount}</p>
                                            <p className="text-[#0194FC] text-xs">Purchased</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-white/60 py-4">
                                No purchases found
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );

    // Update the renderReferralContent function
    const renderReferralContent = () => (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {updatedStats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0194FC] to-[#300855] rounded-xl blur opacity-50 group-hover:opacity-75 transition duration-300"/>
                        <div className="relative bg-[#0f172a]/90 backdrop-blur-xl p-4 rounded-xl border border-white/20">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-white/60 text-xs mb-1">{stat.title}</p>
                                    <h3 className="text-white text-xl font-bold">{stat.value}</h3>
                                </div>
                                <div className="p-2 bg-gradient-to-r from-[#0194FC]/10 to-[#300855]/10 rounded-lg">
                                    <stat.icon className="text-[#0194FC]" size={16}/>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Add Claim Rewards Button if there are pending rewards */}
            {Number(referralInfo?.pendingRewards) > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <div className="bg-[#0f172a]/90 backdrop-blur-xl p-6 rounded-xl border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                                    <FaWallet className="text-[#0194FC] text-sm" />
                                    Referral Rewards
                                </h2>
                                <p className="text-white/60 text-sm">
                                    You have {referralInfo?.pendingRewards || '0'} GNF in pending rewards
                                </p>
                            </div>
                            <button
                                onClick={handleClaimRewards}
                                disabled={isClaimingRewards}
                                className="px-6 py-2.5 bg-[#0194FC] text-white rounded-lg hover:bg-[#0194FC]/80 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                </motion.div>
            )}

            {/* Referral Code Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="transform hover:scale-[1.01] transition-all duration-300 mb-6"
            >
                <div className="bg-[#0f172a]/90 backdrop-blur-xl p-6 rounded-xl border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-white font-bold text-lg flex items-center gap-2">
                                <FaLink className="text-[#0194FC]" />
                                Referral System
                            </h2>
                            <p className="text-white/60 text-xs">Generate and use referral codes</p>
                        </div>
                    </div>

                    {/* Generate Code Section */}
                    <div className="space-y-4">
                        {referralInfo?.userReferralCode ? (
                            <div className="bg-[#1e293b]/50 p-4 rounded-lg border border-white/10">
                                <h3 className="text-white font-medium mb-2">Your Referral Code</h3>
                                <div className="flex items-center justify-between">
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
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-white font-medium mb-2">Generate Your Code</h3>
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
                            </div>
                        )}

                        {/* Use Code Section - Only show if user hasn't used a code yet (has zero address as referrer) */}
                        {referralInfo?.userReferrer === '0x0000000000000000000000000000000000000000' && (
                            <div>
                                <h3 className="text-white font-medium mb-2">
                                    <span className="flex items-center gap-2">
                                        <FaLink className="text-[#0194FC]" />
                                        Connect with a Referrer
                                    </span>
                                    <p className="text-white/60 text-xs font-normal mt-1">
                                        
                                    </p>
                                </h3>
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
                                                placeholder="Enter your referral code"
                                                value={inputReferralCode}
                                                onChange={(e) => setInputReferralCode(e.target.value)}
                                                className="flex-1 bg-[#0f172a] text-white p-3 rounded-lg border border-white/10 focus:border-[#0194FC] outline-none"
                                            />
                                            <button
                                                onClick={handleRegisterReferral}
                                                disabled={isRegistering || !inputReferralCode}
                                                className="px-6 bg-[#0194FC] text-white rounded-lg hover:bg-[#0194FC]/80 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                {isRegistering ? '...' : 'Activate Bonus'}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/60 text-sm">
                                            <FaGem className="text-[#0194FC] text-xs" />
                                            Receive {(referralInfo?.referredBonusRate || 0) / 100}% additional bonus on all your purchases
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Referrals List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0f172a]/90 backdrop-blur-xl p-6 rounded-xl border border-white/20"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                            <FaUsers className="text-[#0194FC]" />
                            Your Referrals
                        </h2>
                        <p className="text-white/60 text-xs">People who used your code</p>
                    </div>
                    <span className="text-xs text-white/60 bg-[#1e293b] px-2 py-1 rounded-md">
                        Total: {referredAddresses.length}
                    </span>
                </div>
                <div className="space-y-3">
                    {referredAddresses.map((address: string, index: number) => (
                        <div key={index} className="bg-[#1e293b]/50 rounded-lg border border-white/10 overflow-hidden">
                            <div className="p-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#0194FC]/10 flex items-center justify-center">
                                        <FaCheckCircle className="text-[#0194FC]" size={14} />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {referredAddresses.length === 0 && (
                        <div className="text-center text-white/60 py-4">
                            No referrals yet
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );

    return (
        <div className="min-h-screen relative overflow-hidden pb-12 bg-[#0f172a]">
            {/* Background elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-[#0f172a]" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0194FC]/20 via-[#300855]/20 to-transparent animate-gradient" />
                <div className="absolute inset-0" style={{ 
                    backgroundImage: 'url("/grid.svg")',
                    backgroundSize: '40px 40px',
                    opacity: 0.1 
                }} />
                <HexagonPattern />
                <CircuitLines />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                {/* Add Back Button */}
                <div className="mb-6">
                    <motion.button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-white/60 hover:text-white transition-all 
                                 bg-[#1e293b]/50 hover:bg-[#1e293b] px-4 py-2 rounded-xl border border-white/5
                                 hover:border-[#0194FC]/30 backdrop-blur-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <FaArrowLeft className="text-sm transition-transform group-hover:-translate-x-1" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </motion.button>
                </div>

                {/* Tab Navigation */}
                {renderTabNavigation()}

                {/* Content based on active tab */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'gnf' ? renderGNFContent() : renderReferralContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Register Referral Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-[#0f172a] p-6 rounded-xl border border-white/20 w-full max-w-md mx-4">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <FaUsers className="text-[#0194FC]" />
                            Enter Someone's Referral Code
                        </h3>
                        
                        {registrationError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                                {registrationError}
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <label className="block text-white/60 text-sm mb-2">
                                Enter the referral code to receive {(referralInfo?.referredBonusRate || 1) / 100}% bonus on your purchases
                            </label>
                            <input
                                type="text"
                                value={inputReferralCode}
                                onChange={(e) => setInputReferralCode(e.target.value)}
                                placeholder="Enter referral code"
                                className="w-full bg-[#1e293b] text-white p-3 rounded-lg border border-white/10 focus:border-[#0194FC] outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleRegisterReferral}
                                disabled={isRegistering || !inputReferralCode}
                                className="flex-1 px-4 py-2.5 bg-[#0194FC] text-white rounded-lg hover:bg-[#0194FC]/80 transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRegistering ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <FaUsers size={14} />
                                        Use Code
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRegisterModal(false);
                                    setRegistrationError('');
                                    setInputReferralCode('');
                                }}
                                className="px-4 py-2.5 bg-[#1e293b] text-white rounded-lg hover:bg-[#1e293b]/80 transition-all text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Stats Card Component
const StatsCard: React.FC<{
    title: string;
    value: string | number;
    icon: IconType;
}> = ({ title, value, icon: Icon }) => (
    <div className="bg-[#0f172a]/90 backdrop-blur-xl p-6 rounded-xl border border-white/20">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0194FC]/10 flex items-center justify-center">
                <Icon className="text-[#0194FC]" size={24} />
            </div>
            <div>
                <p className="text-white/60 text-sm">{title}</p>
                <p className="text-white text-xl font-bold mt-1">{value}</p>
            </div>
        </div>
    </div>
);

export default ReferralDashboard;