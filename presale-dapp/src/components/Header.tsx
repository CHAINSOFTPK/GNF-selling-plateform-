import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaChartLine, FaBars, FaTimes, FaChevronDown, FaWallet, FaSignOutAlt, FaExchangeAlt, FaExternalLinkAlt } from 'react-icons/fa';
import ConnectWallet from './ConnectWallet';
import { useWallet } from '../context/Web3Context';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { formatNumber } from '../utils/formatters';
import { SUPPORTED_NETWORKS } from '../config/networks';
import { getExplorerUrl } from '../utils/explorer';
import { useDisconnect, useSwitchChain, useChainId, useChains } from 'wagmi';  // Replace useNetwork with these
import { BNBIcon, MaticIcon, AvaxIcon, GNFIcon } from './icons/PaymentIcons';
import { switchToNetwork } from '../utils/network';
import { useNetworkValidation } from '../hooks/useNetworkValidation';

const Header: React.FC = () => {
    const { account, connectWallet } = useWallet();
    const { balance, tokenSymbol } = useTokenBalance();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { disconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();
    const [showNetworkMenu, setShowNetworkMenu] = useState(false);
    const { currentNetwork } = useNetworkValidation();
    const chainId = useChainId();
    const chains = useChains();

    const isConnected = !!account;

    const handleDashboardClick = async () => {
        if (isConnected && account) {
            // First switch to GlobalNetwork before navigating
            try {
                if (currentNetwork?.chainId !== SUPPORTED_NETWORKS.GLOBALNETWORK.chainId) {
                    await switchToNetwork(SUPPORTED_NETWORKS.GLOBALNETWORK.chainId);
                }
                // Navigate after successful network switch
                navigate('/referrals');
            } catch (error) {
                console.error('Failed to switch network:', error);
                toast.error('Please switch to GlobalNetwork to access the dashboard');
            }
        } else {
            toast.warning('Please connect your wallet first');
            try {
                await connectWallet();
            } catch (error) {
                console.error('Failed to connect wallet:', error);
                toast.error('Failed to connect wallet');
            }
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setShowAccountMenu(false);
    };

    const handleNetworkSwitch = async (chainId: number) => {
        try {
            if (switchChain) {
                await switchChain({ chainId });
            } else {
                // Fallback to manual network switching if wagmi's switchChain is not available
                await switchToNetwork(chainId);
            }
            
            setShowNetworkMenu(false);
            setShowAccountMenu(false);
        } catch (error: any) {
            console.error('Failed to switch network:', error);
            toast.error(error.message || 'Failed to switch network');
        }
    };

    const openExplorer = () => {
        if (account && currentNetwork) {
            const explorerUrl = getExplorerUrl(currentNetwork.chainId, account);
            window.open(explorerUrl, '_blank');
        }
    };

    // Update the navLinks array to distinguish between external and internal links
    const navLinks = [
        { title: 'Home', path: 'https://gnfstore.com/', isExternal: true },
        { title: 'About', path: 'https://gnfstore.com/#about', isExternal: true },
        { title: 'How to Buy', path: '/howtobuy', isExternal: false }, // Changed to internal route
        { title: 'FAQ', path: 'https://gnfstore.com/#faq', isExternal: true },
    ];

    // Update the navigation handler to handle both internal and external links
    const handleNavigation = (path: string, isExternal: boolean) => {
        if (isExternal) {
            window.location.href = path;
        } else {
            navigate(path);
        }
    };

    // Add this function to get the network icon component
    const getNetworkIcon = (chainId: number) => {
        switch (chainId) {
            case 56: // BSC
                return <BNBIcon />;
            case 137: // Polygon
                return <MaticIcon />;
            case 43114: // Avalanche
                return <AvaxIcon />;
            case 1013: // GlobalNetwork
                return <GNFIcon />;
            default:
                return null;
        }
    };

    const getNetworkDisplay = () => {
        if (!chainId) return 'Unknown Network';
        const currentChain = chains.find(c => c.id === chainId);
        return currentChain?.name || 'Unknown Network';
    };

    const getBalanceDisplay = () => {
        if (!chainId || !balance) return '0';
        const currentChain = chains.find(c => c.id === chainId);
        return `${formatNumber(balance)} ${currentChain?.nativeCurrency.symbol || ''}`;
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowAccountMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <header className="bg-[#0f172a]/90 backdrop-blur-sm border-b border-white/10">
                {/* Desktop Header */}
                <div className="hidden md:flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
                    {/* Logo */}
                    <div 
                        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/')}
                    >
                        <img src="/logo.png" alt="GNF Logo" className="h-10" />
                    </div>
                    
                    {/* Navigation Links - Updated */}
                    <div className="flex items-center space-x-6">
                        {navLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => handleNavigation(link.path, link.isExternal)}
                                className="text-white/80 hover:text-white transition-colors duration-300 text-sm font-medium"
                            >
                                {link.title}
                            </button>
                        ))}
                    </div>

                    {/* Account Section - Redesigned */}
                    <div className="flex items-center space-x-3">
                        {isConnected ? (
                            <div className="relative" ref={menuRef}>
                                {/* Account Button - Enhanced */}
                                <button
                                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-[#1e293b]/80 to-[#1e293b]/60 
                                             hover:from-[#1e293b] hover:to-[#1e293b]/80
                                             text-white rounded-xl px-4 py-2.5 transition-all duration-300
                                             border border-[#1e293b] hover:border-[#0194FC]/50 shadow-lg"
                                >
                                    {/* Network Indicator - Enhanced */}
                                    <div className="flex items-center mr-3">
                                        <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse shadow-lg shadow-green-400/20" />
                                        <span className="text-sm font-medium text-white/90">
                                            {getNetworkDisplay()}
                                        </span>
                                    </div>

                                    <span className="text-sm font-medium px-2 py-1 bg-[#0f172a]/40 rounded-lg">
                                        {account?.slice(0, 6)}...{account?.slice(-4)}
                                    </span>
                                    <FaChevronDown className={`w-4 h-4 transition-transform duration-300 
                                        ${showAccountMenu ? 'rotate-180' : ''}`} 
                                    />
                                </button>

                                {/* Enhanced Dropdown Menu */}
                                {showAccountMenu && (
                                    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-gradient-to-b from-[#1e293b] to-[#0f172a] 
                                                 border border-white/10 shadow-xl shadow-black/20 backdrop-blur-xl
                                                 transform transition-all duration-200 scale-100 opacity-100">
                                        {/* Balance Section - Enhanced */}
                                        <div className="p-4 border-b border-white/10 bg-white/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white/70 text-sm">Wallet Balance</span>
                                                <span className="text-white font-medium bg-[#0f172a]/50 px-3 py-1 rounded-lg">
                                                    {getBalanceDisplay()}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={openExplorer}
                                                className="flex items-center text-[#0194FC] text-xs hover:text-[#0182e0] transition-colors"
                                            >
                                                View on Explorer <FaExternalLinkAlt className="ml-1 w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* Menu Items - Enhanced */}
                                        <div className="p-2 space-y-1">
                                            {/* Dashboard Button */}
                                            <button
                                                onClick={handleDashboardClick}
                                                className="w-full flex items-center space-x-3 p-3 rounded-lg
                                                         text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                <FaChartLine className="w-4 h-4" />
                                                <span>Dashboard</span>
                                            </button>

                                            {/* Network Switch Button - With Submenu */}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                                                    className="w-full flex items-center justify-between p-3 rounded-lg
                                                             text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <FaExchangeAlt className="w-4 h-4" />
                                                        <span>Switch Network</span>
                                                    </div>
                                                    <FaChevronDown className={`w-3 h-3 transition-transform duration-200 
                                                        ${showNetworkMenu ? 'rotate-180' : ''}`} />
                                                </button>

                                                {/* Network Selection Submenu - Updated with icons */}
                                                {showNetworkMenu && (
                                                    <div className="absolute left-0 right-0 mt-1 bg-[#1e293b] rounded-lg border border-white/10 overflow-hidden">
                                                        {Object.values(SUPPORTED_NETWORKS).map((network) => (
                                                            <button
                                                                key={network.chainId}
                                                                onClick={() => handleNetworkSwitch(network.chainId)}
                                                                className={`w-full flex items-center px-4 py-3 hover:bg-white/5
                                                                          ${network.chainId === currentNetwork?.chainId 
                                                                            ? 'bg-white/10 text-white' 
                                                                            : 'text-white/70'}`}
                                                            >
                                                                <div className="w-8 h-8 flex items-center justify-center mr-3">
                                                                    {getNetworkIcon(network.chainId)}
                                                                </div>
                                                                <span className="flex-1 text-left">{network.name}</span>
                                                                {network.chainId === currentNetwork?.chainId && (
                                                                    <div className="w-2 h-2 rounded-full bg-green-400 ml-3" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Disconnect Button - Enhanced */}
                                            <button
                                                onClick={handleDisconnect}
                                                className="w-full flex items-center space-x-3 p-3 rounded-lg
                                                         text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors"
                                            >
                                                <FaSignOutAlt className="w-4 h-4" />
                                                <span>Disconnect Wallet</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <ConnectWallet />
                        )}
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden">
                    <div className="flex justify-between items-center px-4 py-3">
                        <div className="flex items-center" onClick={() => navigate('/')}>
                            <img src="/logo.png" alt="GNF Logo" className="h-8" />
                        </div>

                        <div className="flex items-center space-x-2">
                            {isConnected && currentNetwork && (
                                <div className="flex items-center px-2 py-1 bg-[#1e293b]/50 rounded-lg border border-[#1e293b]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                                    <span className="text-white/90 text-xs font-medium">
                                        {currentNetwork.name}
                                    </span>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-white/80 hover:text-white p-2"
                            >
                                {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu - Updated */}
                    {isMobileMenuOpen && (
                        <div className="absolute top-full left-0 right-0 bg-[#0f172a]/95 backdrop-blur-sm border-b border-white/10">
                            <div className="p-4 space-y-3">
                                {/* Balance Display - Mobile */}
                                {isConnected && Number(balance) > 0 && (
                                    <div className="flex items-center justify-between px-3 py-2 bg-[#1e293b]/50 rounded-xl border border-[#1e293b]">
                                        <span className="text-white/60 text-sm">Balance</span>
                                        <span className="text-[#0194FC] font-medium text-sm">
                                            {formatNumber(balance)} {tokenSymbol}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Updated Mobile Navigation Links */}
                                {navLinks.map((link) => (
                                    <button
                                        key={link.path}
                                        onClick={() => {
                                            handleNavigation(link.path, link.isExternal);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="block w-full text-left text-white/80 hover:text-white py-2 text-sm font-medium"
                                    >
                                        {link.title}
                                    </button>
                                ))}
                                
                                {isConnected && (
                                    <button
                                        onClick={handleDashboardClick}
                                        className="w-full flex items-center justify-center space-x-2 bg-[#0194FC] hover:bg-[#0182e0] text-white text-sm font-medium py-2 px-4 rounded-xl mt-3"
                                    >
                                        <FaChartLine className="text-sm" />
                                        <span>Dashboard</span>
                                    </button>
                                )}
                                
                                <div className="pt-3">
                                    <ConnectWallet />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
};

export default Header;
