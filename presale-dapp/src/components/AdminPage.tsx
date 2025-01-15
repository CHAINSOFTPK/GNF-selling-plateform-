import React, { useEffect, useState } from 'react';
import { getPendingVerifications, approveVerification, getPlatformStats } from '../services/adminService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaCoins, FaDollarSign, FaUserCheck } from 'react-icons/fa';
import type { PlatformStats } from '../types/admin';
import { formatNumber } from '../utils/formatters';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { barChartOptions, getChartColors } from '../config/chartConfig';
import ActivityIcon from './ActivityIcon';
import { formatTimeAgo } from '../utils/timeFormat';
import type { Activity } from '../types/admin';
import Header from './Header';
import Footer from './Footer';

const defaultStats: PlatformStats = {
    totalUsers: 0,
    totalTokensSold: {
        GNF10: 0,
        GNF1000: 0,
        GNF10000: 0
    },
    totalUSDTRaised: 0,
    activeSocialVerifications: 0,
    totalPurchases: 0,
    recentTransactions: []
};

interface User {
    _id: string;
    walletAddress: string;
    socialVerification: {
        twitter: {
            handle: string;
            isVerified: boolean;
        };
        discord: {
            handle: string;
            isVerified: boolean;
        };
    };
}

const AdminPage: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PlatformStats>(defaultStats);
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Check for authentication when component mounts
        const checkAuth = async () => {
            const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
            setIsAuthenticated(isAdmin);
            if (isAdmin) {
                await fetchPendingVerifications();
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (isAuthenticated) {
                try {
                    setLoading(true);
                    const [verifications, platformStats] = await Promise.all([
                        getPendingVerifications(),
                        getPlatformStats()
                    ]);
                    setUsers(verifications.data);
                    setStats(platformStats);
                    
                    // Transform transactions into activities with proper timestamp
                    const activities: Activity[] = platformStats.recentTransactions.map(tx => ({
                        type: 'purchase',
                        timestamp: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(), // Ensure proper date format
                        walletAddress: tx.walletAddress,
                        details: `Purchased ${Number(tx.amount).toFixed(2)} ${tx.tokenType}`, // Format amount
                        amount: tx.amount.toString(),
                        tokenType: tx.tokenType
                    }));
                    setRecentActivities(activities);
                } catch (error: any) {
                    toast.error(error.message || 'Error loading dashboard data');
                    setStats(defaultStats);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadDashboardData();
    }, [isAuthenticated]);

    const fetchPendingVerifications = async () => {
        try {
            const response = await getPendingVerifications();
            setUsers(response.data);
        } catch (error) {
            toast.error('Error fetching pending verifications');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // Get credentials directly from .env.local
        const correctUsername = process.env.REACT_APP_ADMIN_USERNAME;
        const correctPassword = process.env.REACT_APP_ADMIN_PASSWORD;

        if (username === correctUsername && password === correctPassword) {
            setIsAuthenticated(true);
            sessionStorage.setItem('adminAuthenticated', 'true');
            await fetchPendingVerifications();
            toast.success('Successfully logged in');
        } else {
            toast.error('Invalid credentials');
            console.log('Login attempt failed', { 
                enteredUsername: username,
                correctUsername,
                passwordMatch: password === correctPassword 
            });
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminAuthenticated');
        navigate('/');
        toast.success('Logged out successfully');
    };

    const handleApprove = async (userId: string, platform: 'twitter' | 'discord') => {
        try {
            await approveVerification(userId, platform);
            toast.success('Verification approved');
            setUsers(users.map(user => 
                user._id === userId 
                    ? { 
                        ...user, 
                        socialVerification: {
                            ...user.socialVerification,
                            [platform]: {
                                ...user.socialVerification[platform],
                                isVerified: true
                            }
                        }
                    } 
                    : user
            ));
        } catch (error) {
            toast.error('Error approving verification');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#08B4A6]/10 to-white">
                <div className="relative w-full max-w-md">
                    {/* Background elements */}
                    <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#08B4A6]/10 rounded-full filter blur-3xl animate-pulse" />
                    <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-[#08B4A6]/10 rounded-full filter blur-3xl animate-pulse" />
                    
                    {/* Login container */}
                    <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-[#08B4A6]/20 mx-4">
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <img 
                                    src="/logo.png" 
                                    alt="GNF Logo" 
                                    className="h-16 w-auto" 
                                />
                            </div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#08B4A6] to-[#079e92] bg-clip-text text-transparent">
                                Admin Login
                            </h2>
                            <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="username"
                                            type="text"
                                            required
                                            className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg 
                                                     placeholder-gray-400 focus:outline-none focus:ring-[#08B4A6] focus:border-[#08B4A6]
                                                     transition-all duration-200"
                                            placeholder="Enter your username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type="password"
                                            required
                                            className="appearance-none block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg 
                                                     placeholder-gray-400 focus:outline-none focus:ring-[#08B4A6] focus:border-[#08B4A6]
                                                     transition-all duration-200"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                style={{ backgroundColor: '#052f5c' }}  // Add this line
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                                         text-sm font-semibold text-white hover:bg-[#079e92]
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08B4A6]
                                         transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                            >
                                Sign in to Dashboard
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#052f5c]"></div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div 
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="flex justify-between items-center mb-8"
                    >
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#08B4A6] to-[#079e92] bg-clip-text text-transparent">
                                Admin Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">Welcome back, Admin</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-all duration-200"
                        >
                            Logout
                        </motion.button>
                    </motion.div>

                    {/* Stats Grid with Animations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { icon: <FaUsers />, title: "Total Users", value: formatNumber(stats?.totalUsers || 0) },
                            { icon: <FaCoins />, title: "Total Tokens Sold", value: formatNumber((stats?.totalTokensSold?.GNF10 || 0) + (stats?.totalTokensSold?.GNF1000 || 0) + (stats?.totalTokensSold?.GNF10000 || 0)) },
                            { icon: <FaDollarSign />, title: "Total USDT Raised", value: `$${formatNumber(stats?.totalUSDTRaised || 0)}` },
                            { icon: <FaUserCheck />, title: "Pending Verifications", value: formatNumber(stats?.activeSocialVerifications || 0) }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <StatsCard {...stat} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Token Distribution Chart */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
                    >
                        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">Token Distribution</h3>
                            <TokenDistributionChart stats={stats} />
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                            <ActivityFeed activities={recentActivities} />
                        </div>
                    </motion.div>

                    {/* Social Verifications Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-sm overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">Pending Social Verifications</h2>
                        </div>

                        <div className="overflow-x-auto">
                            {users.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Wallet Address
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Twitter Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Discord Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map(user => (
                                            <tr key={user._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.walletAddress.substring(0, 6)}...
                                                        {user.walletAddress.substring(user.walletAddress.length - 4)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {user.socialVerification.twitter.handle ? (
                                                            <div>
                                                                <div className="text-sm text-gray-900">
                                                                    @{user.socialVerification.twitter.handle}
                                                                </div>
                                                                <div className={`text-xs ${user.socialVerification.twitter.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                                                                    {user.socialVerification.twitter.isVerified ? 'Verified' : 'Pending'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">Not submitted</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {user.socialVerification.discord.handle ? (
                                                            <div>
                                                                <div className="text-sm text-gray-900">
                                                                    {user.socialVerification.discord.handle}
                                                                </div>
                                                                <div className={`text-xs ${user.socialVerification.discord.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                                                                    {user.socialVerification.discord.isVerified ? 'Verified' : 'Pending'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">Not submitted</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                    {!user.socialVerification.twitter.isVerified && user.socialVerification.twitter.handle && (
                                                        <button
                                                            onClick={() => handleApprove(user._id, 'twitter')}
                                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            Verify Twitter
                                                        </button>
                                                    )}
                                                    {!user.socialVerification.discord.isVerified && user.socialVerification.discord.handle && (
                                                        <button
                                                            onClick={() => handleApprove(user._id, 'discord')}
                                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        >
                                                            Verify Discord
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending verifications</h3>
                                    <p className="mt-1 text-sm text-gray-500">All social verifications are up to date.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
            <Footer />
        </>
    );
};

// Helper Components
const StatsCard: React.FC<{ icon: React.ReactNode; title: string; value: string }> = ({ icon, title, value }) => (
    <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
            <div className="text-xl">{icon}</div>
            <div className="text-right">
                <p className="text-gray-500 text-sm">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);

const TokenStatsCard: React.FC<{ title: string; sold: number; price: number }> = ({ title, sold, price }) => (
    <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-[#08B4A6] mb-4">{title}</h3>
        <div className="space-y-2">
            <div className="flex justify-between">
                <span className="text-gray-500">Sold</span>
                <span className="font-medium">{formatNumber(sold)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Value</span>
                <span className="font-medium">${formatNumber(sold * price)}</span>
            </div>
        </div>
    </div>
);

const TokenDistributionChart: React.FC<{ stats: PlatformStats }> = ({ stats }) => {
    const data = {
        labels: ['GNF10', 'GNF1000', 'GNF10000'],
        datasets: [{
            label: 'Tokens Sold',
            data: [
                stats?.totalTokensSold?.GNF10 || 0,
                stats?.totalTokensSold?.GNF1000 || 0,
                stats?.totalTokensSold?.GNF10000 || 0
            ],
            backgroundColor: getChartColors(3),
            borderRadius: 6,
        }]
    };

    return (
        <div style={{ height: '300px', position: 'relative', width: '100%' }}>
            <Bar data={data} options={barChartOptions} />
        </div>
    );
};

const ActivityFeed: React.FC<{ activities: Activity[] }> = ({ activities }) => (
    <div className="space-y-4">
        {activities.map((activity, index) => (
            <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
            >
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.details}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                </div>
            </motion.div>
        ))}
    </div>
);

export default AdminPage;
