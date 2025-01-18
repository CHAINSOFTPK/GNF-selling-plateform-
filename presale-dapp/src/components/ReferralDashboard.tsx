import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/Web3Context'; // Update this line
import { getReferralsByAddress, getReferralStats } from '../services/referralService';
import { toast } from 'react-toastify';
import { createOrGetUser } from '../services/userService';
import { FaUserFriends, FaGift, FaCopy, FaChartLine, FaHistory, FaArrowLeft, FaLink, FaMedal, FaCalendarAlt, FaCheckCircle, FaArrowRight, FaCheck } from 'react-icons/fa';
import { BiLinkAlt } from 'react-icons/bi';
import { RiCoinLine } from 'react-icons/ri';
import { motion } from 'framer-motion';
import { formatNumber } from '../utils/formatters';
import { checkSocialStatus } from '../services/socialVerificationService';
import { getClaimableTokens, claimTokens } from '../services/tokenService';
import { getUserPurchases, getUserTotalPurchases } from '../services/userService';
import { TOKEN_CONTRACTS } from '../config/tokens';

interface Referral {
    id: string;
    email?: string;
    status?: string;
    address: string;
    gnfBought?: number;
    bonusAmount: number;
    timestamp: Date;
}

interface ReferralStats {
    total: number;
    bonus: number;
    referrals: number;
}

interface TokenPurchase {
    amount: string;
    date: string;
    transactionHash: string;
}

interface UserStats {
    totalPurchases: number;
    joinedAt: Date;
}

interface TokenHolding {
    tokenSymbol: string;
    amount: number;
    purchaseDate: Date;
    vestingEndDate?: Date;
    isClaimable: boolean;
    remainingDays?: number;
    purchaseId: string;
}

// Add this interface
interface PurchaseHistory {
    tokenSymbol: string;
    amount: number;
    purchaseDate: Date;
    paymentTxHash: string;
    transferTxHash?: string;
    claimed: boolean;
}

const ReferralDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { account: walletAddress } = useWallet(); // Update this line
    const [referralUrl, setReferralUrl] = useState<string>(''); // Add this
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [stats, setStats] = useState<ReferralStats>({ total: 0, bonus: 0, referrals: 0 });
    const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [socialVerification, setSocialVerification] = useState({
        data: {
            twitter: { isVerified: false },
            discord: { isVerified: false }
        }
    });
    const [claimableTokens, setClaimableTokens] = useState<any[]>([]);
    const [holdings, setHoldings] = useState<TokenHolding[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);

    const copyReferralLink = () => {
        if (walletAddress) {
            const referralUrl = `${window.location.origin}/?referrer=${walletAddress}`;
            navigator.clipboard.writeText(referralUrl);
            toast.success('Referral link copied to clipboard!');
            setCopied(true);
            toast.success('Referral link copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        if (walletAddress) {
            setReferralUrl(`${window.location.origin}/?referrer=${walletAddress}`);
        }
    }, [walletAddress]);

    useEffect(() => {
        const fetchData = async () => {
            if (!walletAddress) {
                navigate('/'); // Redirect if no wallet connected
                return;
            }
            
            setLoading(true);
            try {
                const [
                    mongoReferrals, 
                    statsData, 
                    socialStatus, 
                    claimable,
                    purchaseData,
                    totalPurchases
                ] = await Promise.all([
                    getReferralsByAddress(walletAddress),
                    getReferralStats(walletAddress),
                    checkSocialStatus(walletAddress),
                    getClaimableTokens(walletAddress),
                    getUserPurchases(walletAddress),
                    getUserTotalPurchases(walletAddress)
                ]);

                // Ensure purchaseData is properly handled
                setPurchaseHistory(purchaseData.data ? purchaseData.data.map((p: any) => ({
                    ...p,
                    purchaseDate: new Date(p.purchaseDate)
                })) : []);

                // Set user stats with total purchases
                setUserStats({
                    totalPurchases: totalPurchases.totalAmount,
                    joinedAt: new Date()
                });

                const transformedReferrals: Referral[] = mongoReferrals.map((ref: any) => ({
                    id: ref._id?.toString() || '',
                    address: ref.referred,
                    bonusAmount: ref.bonusAmount,
                    timestamp: ref.timestamp,
                    status: 'Referred',
                    gnfBought: 0
                }));

                setReferrals(transformedReferrals);
                setStats(statsData);
                setReferralUrl(`${window.location.origin}/?referrer=${walletAddress}`);
                const formattedSocialStatus = {
                    data: {
                        twitter: { isVerified: socialStatus?.data?.twitter?.isVerified || false },
                        discord: { isVerified: socialStatus?.data?.discord?.isVerified || false }
                    }
                };

                setSocialVerification(formattedSocialStatus);
                setClaimableTokens(claimable.data);
                setHoldings(claimable.data.map((token: any) => ({
                    tokenSymbol: token.tokenSymbol,
                    amount: token.amount,
                    purchaseDate: new Date(token.purchaseDate),
                    vestingEndDate: token.vestingEndDate ? new Date(token.vestingEndDate) : undefined,
                    isClaimable: token.isClaimable,
                    remainingDays: token.remainingDays,
                    purchaseId: token.purchaseId
                })));

            } catch (error) {
                toast.error('Error fetching referral data');
                console.error("Error fetching dashboard data:", error);
                setSocialVerification({
                    data: {
                        twitter: { isVerified: false },
                        discord: { isVerified: false }
                    }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh every minute
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [walletAddress, navigate]);

    const handleClaim = async (purchaseId: string) => {
        try {
            if (!walletAddress) return;
            
            const result = await claimTokens(purchaseId, walletAddress);
            if (result.success) {
                toast.success('Tokens claimed successfully!');
                // Refresh claimable tokens
                const claimable = await getClaimableTokens(walletAddress);
                setClaimableTokens(claimable.data);
            }
        } catch (error) {
            toast.error('Failed to claim tokens');
            console.error(error);
        }
    };

    const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#09185E] p-6 rounded-xl shadow-md border-2 border-white/20 hover:shadow-lg transition-all duration-300 group"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                        {typeof value === 'number' ? formatNumber(value) : value}
                    </p>
                </div>
                <div className="text-white text-3xl group-hover:scale-110 transition-transform">{icon}</div>
            </div>
        </motion.div>
    );

    const renderTokenHoldings = () => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <h2 className="text-2xl font-bold mb-6 flex items-center">
                <RiCoinLine className="text-[#0194FC] mr-3 text-3xl" />
                Token Holdings
            </h2>
            <div className="grid grid-cols-1 gap-6">
                {Object.entries(TOKEN_CONTRACTS).map(([key, token]) => (
                    <div key={key} className="rounded-xl shadow-md border border-[#0194FC]/20 overflow-hidden" style={{ backgroundColor: '#030341' }}>
                        <div className="bg-gradient-to-r from-[#0194FC] to-[#079e92] px-6 py-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-white text-xl font-bold">{token.symbol}</h3>
                                    <p className="text-white/80 text-sm">
                                        {token.vestingPeriod === 0 ? 'No vesting period' : 
                                         token.vestingPeriod === 365 ? '1 year vesting' : '3 years vesting'}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <a 
                                        href={`https://etherscan.io/token/${token.address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/60 text-xs font-mono hover:text-white/90 transition-colors"
                                    >
                                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                    </a>
                                    <span className="text-white/60 text-xs mt-1">Contract Address</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-white-600">Your Balance</p>
                                <p className="text-2xl font-bold">
                                    {formatNumber(holdings.find(h => h.tokenSymbol === token.symbol)?.amount || 0)} {token.symbol}
                                </p>
                            </div>
                            {holdings.find(h => h.tokenSymbol === token.symbol) && (
                                <div>
                                    {token.vestingPeriod > 0 && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Vesting Progress</span>
                                                <span>{holdings.find(h => h.tokenSymbol === token.symbol)?.remainingDays} days left</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-[#0194FC] h-2 rounded-full"
                                                    style={{ 
                                                        width: `${100 - ((holdings.find(h => h.tokenSymbol === token.symbol)?.remainingDays || 0) / token.vestingPeriod * 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => handleClaim(holdings.find(h => h.tokenSymbol === token.symbol)?.purchaseId || '')}
                                            disabled={!holdings.find(h => h.tokenSymbol === token.symbol)?.isClaimable}
                                            style={{ backgroundColor: holdings.find(h => h.tokenSymbol === token.symbol)?.isClaimable ? '#0194FC' : '#white-400' }}
                                            className="w-full py-2 text-white rounded-lg font-medium disabled:opacity-50"
                                        >
                                            {holdings.find(h => h.tokenSymbol === token.symbol)?.isClaimable ? 'Claim Now' : 'Vesting in Progress'}
                                        </button>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <a 
                                                href={`https://etherscan.io/token/${token.address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-center text-sm text-[#0194FC] hover:underline flex items-center gap-1"
                                            >
                                                <span>View on Etherscan</span>
                                                <FaArrowRight size={12} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );

    // Add this section in your JSX after the Referral History section
    const renderPurchaseHistory = () => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl shadow-md p-6 backdrop-blur-sm"
            style={{ backgroundColor: '#030341' }}
        >
            <h2 className="text-xl font-bold mb-4">Purchase History</h2>
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="text-left border-b">
                    <th className="py-2">Token</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Status</th>
                </tr>
                </thead>
                <tbody>
                {purchaseHistory.map((purchase, index) => (
                    <tr key={purchase.paymentTxHash} className="border-b">
                    <td className="py-2">{purchase.tokenSymbol}</td>
                    <td className="py-2">{formatNumber(purchase.amount)}</td>
                    <td className="py-2">
                        {purchase.purchaseDate.toLocaleDateString()}
                    </td>
                    <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                        purchase.claimed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {purchase.claimed ? 'Claimed' : 'Pending'}
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {purchaseHistory.length === 0 && (
                <div className="text-center py-4 text-white-500">
                No purchase history found
                </div>
            )}
            </div>
        </motion.div>
    );

    if (!walletAddress) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-lg mb-4">Please connect your wallet to view your dashboard</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-[#0194FC] text-white rounded-lg"
                >
                    Go to Home
                </button>
            </div>
        );
    }

    return (
        <>
            <div 
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url("https://i.postimg.cc/yYRzqbgS/hero.jpg")' }}
            />
            <div className="max-w-6xl mx-auto p-4 sm:p-6 relative z-10">
                {loading ? (
                    <div className="bg-[#030341] rounded-xl p-8 shadow-lg border-2 border-white/20 backdrop-blur-sm">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-150"></div>
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-300"></div>
                            <span className="text-white ml-3">Loading dashboard...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header Section with added referral message */}
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4 sm:p-6 rounded-xl 
                                    shadow-xl border-2 border-white/20 hover:shadow-2xl transition-all duration-300 relative backdrop-blur-sm text-white"
                            style={{ backgroundColor: '#030341' }}
                        >
                            <div className="absolute inset-0 rounded-xl pointer-events-none bg-[#0194FC]/10 
                                            mix-blend-multiply blur-lg opacity-70" />
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full sm:w-auto">
                                <button 
                                    onClick={() => navigate(-1)}
                                    className="flex items-center text-[#0194FC] hover:text-[#079e92] transition-all duration-300"
                                >
                                    <FaArrowLeft className="text-[#0194FC] text-xl mr-2" /> Back
                                </button>
                                <div className="flex items-center gap-4">
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0194FC] to-[#079e92] bg-clip-text text-transparent">
                                        Dashboard
                                    </h1>
                                    <span className="bg-[#0194FC]/10 text-[#0194FC] px-4 py-1 rounded-full text-sm font-medium">
                                        Invite friends & earn 2% bonus on their each Purchases!
                                    </span>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto">
                                <div className="flex items-center bg-[#0194FC]/10 py-2 px-4 rounded-lg text-[#0194FC]">
                                    <FaCalendarAlt className="mr-2 text-xl" />
                                    Member since: {userStats?.joinedAt ? new Date(userStats.joinedAt).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                            <StatCard 
                                title="Total Referrals" 
                                value={stats.total} 
                                icon={<FaUserFriends />} 
                            />
                            <StatCard 
                                title="Pending Bonus" 
                                value={`${formatNumber(stats.bonus)} GNF100`} 
                                icon={<FaGift />} 
                            />
                            <StatCard 
                                title="Total Purchases" 
                                value={`${formatNumber(userStats?.totalPurchases || 0)} USDT`} 
                                icon={<FaMedal />} 
                            />
                        </div>

                        {/* Referral URL Section */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl p-6 shadow-lg border-2 border-white/20 hover:shadow-xl 
                                    transition-all duration-300 relative mb-4 sm:mb-8 backdrop-blur-sm text-white"
                            style={{ backgroundColor: '#030341' }}
                        >
                            <div className="absolute inset-0 rounded-xl pointer-events-none 
                                            bg-[#0194FC]/10 mix-blend-multiply blur-lg opacity-60" />
                            <div className="flex items-center mb-4">
                                <FaLink className="text-[#0194FC] text-2xl mr-3" />
                                <h2 className="text-xl font-semibold text-white-800">Your Referral Link</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={referralUrl}
                                    readOnly
                                    className="w-full flex-1 text-sm sm:text-base border-2 border-white/20 rounded-lg px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 text-black focus:outline-none focus:border-white/40 transition-colors"
                                />
                                <button
                                    onClick={copyReferralLink}
                                    className="w-full sm:w-auto flex items-center gap-2 bg-[#0194FC] hover:bg-[#079e92] text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                                    style={{ backgroundColor: '#0194FC' }}
                                >
                                    {copied ? <FaCheck /> : <FaCopy />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </motion.div>

                        {/* Add token holdings section here */}
                        <div className="bg-[#09185E] rounded-xl p-6 shadow-lg border-2 border-white/20 backdrop-blur-sm text-white">
                            {renderTokenHoldings()}
                        </div>

                        {/* Referrals List Section */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl p-6 shadow-md border-2 border-white/20 hover:shadow-xl 
                                    transition-all duration-300 backdrop-blur-sm mt-8 text-white"
                            style={{ backgroundColor: '#030341' }}
                        >
                            <div className="flex items-center mb-6">
                                <FaHistory className="text-[#0194FC] text-2xl mr-3" />
                                <h2 className="text-xl font-semibold text-white-800">Referral History</h2>
                            </div>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <div className="min-w-[600px] sm:w-full">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-[#0194FC]/10">
                                                <th className="text-left py-3 px-4 text-[#0194FC] font-semibold">Address</th>
                                                <th className="text-left py-3 px-4 text-[#0194FC] font-semibold">Bonus</th>
                                                <th className="text-left py-3 px-4 text-[#0194FC] font-semibold">Date</th>
                                                <th className="text-left py-3 px-4 text-[#0194FC] font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {referrals.map((referral, index) => (
                                                <motion.tr 
                                                    key={referral.id || index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="border-b border-white-50 hover:bg-[#0194FC]/5 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-white-800 font-mono">
                                                        {referral.address.slice(0, 6)}...{referral.address.slice(-4)}
                                                    </td>
                                                    <td className="py-3 px-4 text-[#0194FC] font-semibold">
                                                        {referral.bonusAmount} GNF100
                                                    </td>
                                                    <td className="py-3 px-4 text-white-600">
                                                        {new Date(referral.timestamp).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-3 py-1 rounded-full text-sm bg-[#0194FC] text-black">
                                                            {referral.status}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {referrals.length === 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-16 bg-[#0194FC]/5 rounded-lg mt-4"
                                        >
                                            <FaUserFriends className="text-[#0194FC] text-5xl mx-auto mb-4" />
                                            <p className="text-lg">No referrals yet. Share your referral link to start earning!</p>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Add Social Verification Status */}
                    
                        {/* Add Claimable Tokens Section */}
                        <div className="mt-8 bg-[#09185E] rounded-xl p-6 shadow-md border-2 border-white/20 backdrop-blur-sm text-white">
                            <h2 className="text-xl font-bold mb-4">Claimable Tokens</h2>
                            <div className="grid gap-4">
                                {claimableTokens.map((token) => (
                                    <div 
                                        key={token.purchaseId} 
                                        className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white-800">{token.tokenSymbol}</h3>
                                                <p className="text-white-600">Amount: {formatNumber(token.amount)}</p>
                                                {token.vestingEndDate && (
                                                    <p className="text-white-600">
                                                        Available: {new Date(token.vestingEndDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleClaim(token.purchaseId)}
                                                disabled={!token.isClaimable}
                                                className={`
                                                    px-6 py-2 rounded-lg font-semibold
                                                    ${token.isClaimable 
                                                        ? 'bg-[#0194FC] text-white hover:bg-[#079e92]' 
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                                                    transition-colors
                                                `}
                                            >
                                                {token.isClaimable ? 'Claim' : `${token.remainingDays} days left`}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {claimableTokens.length === 0 && (
                                    <div className="text-center py-8 bg-white-50 rounded-lg">
                                        <p className="text-white-500">No tokens available for claiming</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <motion.div 
                            className="mt-8 bg-[#09185E] rounded-xl p-6 shadow-md border-2 border-white/20 backdrop-blur-sm text-white"
                        >
                            {renderPurchaseHistory()}
                        </motion.div>
                    </>
                )}
            </div>
        </>
    );
};

export default ReferralDashboard;