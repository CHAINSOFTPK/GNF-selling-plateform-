import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaChartLine, FaBars, FaTimes } from 'react-icons/fa';
import ConnectWallet from './ConnectWallet';
import { useWallet } from '../context/Web3Context';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { formatNumber } from '../utils/formatters';

const Header: React.FC = () => {
    const { account, connectWallet, currentNetwork } = useWallet();
    const { balance, tokenSymbol } = useTokenBalance();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isConnected = !!account;

    const handleDashboardClick = async () => {
        if (isConnected && account) {
            navigate('/referrals');
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

    const navLinks = [
        { title: 'Home', path: 'https://www.gnfstore.com/' },
        { title: 'About', path: 'https://www.gnfstore.com/#about' },
        { title: 'How to Buy', path: 'https://www.gnfstore.com/#howtobuy' },
        { title: 'FAQ', path: 'https://www.gnfstore.com/#faq' },
    ];

    // Add this function to handle external navigation
    const handleNavigation = (path: string) => {
        window.location.href = path;
    };

    return (
        <header className="bg-transparent shadow-md relative z-50">
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center px-6 py-3 relative">
                <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity relative pointer-events-auto" onClick={() => navigate('/')}>
                    <img 
                        src="https://i.postimg.cc/ZY1Z7dYH/logo.png" 
                        alt="GNF Logo" 
                        className="h-12" 
                    />
                </div>
                
                {/* Navigation Links - Desktop */}
                <div className="flex-1 flex justify-center items-center space-x-8">
                    {navLinks.map((link) => (
                        <button
                            key={link.path}
                            onClick={() => handleNavigation(link.path)}
                            className="text-white hover:text-[#08B4A6] transition-colors duration-300"
                        >
                            {link.title}
                        </button>
                    ))}
                </div>

                {/* Buttons - Desktop */}
                <div className="flex items-center space-x-4 relative pointer-events-auto">
                    {isConnected && (
                        <>
                            <button
                                onClick={handleDashboardClick}
                                style={{ backgroundColor: '#22054Ed' }}
                                className="flex items-center space-x-2 hover:bg-[#1e0444] text-white text-sm font-semibold py-1.5 px-4 rounded-md shadow-sm transition-all duration-200 hover:scale-105 w-32"
                            >
                                <FaChartLine className="text-white" />
                                <span>Dashboard</span>
                            </button>
                            <div className="h-6 w-px bg-gray-200"></div>
                            <button className="text-xs text-white bg-blue-600 px-3 py-1 rounded-md">
                                {formatNumber(balance)} {tokenSymbol}
                            </button>
                            <button className="text-xs text-white bg-blue-600 px-3 py-1 rounded-md">
                                 {currentNetwork?.name || 'Unknown'}
                            </button>
                        </>
                    )}
                    <div className="pointer-events-auto">
                        <ConnectWallet />
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden relative">
                <div className="flex justify-between items-center px-4 py-3">
                    <div className="flex items-center" onClick={() => navigate('/')}>
                        <img src="https://i.ibb.co/F4n00MP/bfecf737-844d-4a6c-ba16-9052fad6c92a.png" 
                             alt="GNF Logo" 
                             className="h-8" 
                        />
                    </div>

                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-[#08B4A6] p-2"
                    >
                        {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-lg z-50">
                        <div className="p-4 space-y-4">
                            {/* Navigation Links - Mobile */}
                            <div className="flex flex-col space-y-3">
                                {navLinks.map((link) => (
                                    <button
                                        key={link.path}
                                        onClick={() => {
                                            handleNavigation(link.path);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="text-white-700 hover:text-[#08B4A6] py-2 text-left"
                                    >
                                        {link.title}
                                    </button>
                                ))}
                            </div>

                            {/* Buttons - Mobile */}
                            <div className="space-y-3 pt-3 border-t border-gray-100">
                                {isConnected && (
                                    <button
                                        onClick={handleDashboardClick}
                                        className="w-full flex items-center justify-center space-x-2 bg-[#08B4A6] text-white py-2 px-4 rounded-md"
                                    >
                                        <FaChartLine className="text-white" />
                                        <span>Dashboard</span>
                                    </button>
                                )}
                                <ConnectWallet />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
