import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaChartLine, FaTelegram, FaTwitter, FaDiscord, FaYoutube, FaGlobe, FaBars, FaTimes } from 'react-icons/fa';
import { BiWallet } from 'react-icons/bi';
import ConnectWallet from './ConnectWallet';
import { useWallet } from '../context/Web3Context'; // Changed from WalletContext

const Header: React.FC = () => {
    const { account, connectWallet } = useWallet(); // Updated to use Web3Context properties
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isConnected = !!account; // Add connection check

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

    return (
        <header className="bg-white shadow-md border-b border-gray-100 relative z-50"> {/* Changed bg color */}
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center px-6 py-3 relative"> {/* Added relative */}
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#052f5c]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity relative pointer-events-auto" onClick={() => navigate('/')}>

                    <img 
                        src="/logo.png" 
                        alt="GNF Logo" 
                        className="h-12" 
                    />
                </div>
                
                {/* Social Icons - Desktop */}
                <div className="flex-1 flex justify-center items-center relative pointer-events-auto" style={{ marginLeft: '130px' }}>
                    <div className="flex items-center space-x-6">
                        <a 
                            href="https://t.me/megapayer" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#052f5c] hover:text-[#079e92] transition-colors duration-300 hover:scale-110 transform pointer-events-auto"
                        >
                            <FaTelegram size={24} style={{ color: '#052f5c' }} />
                        </a>
                        <a 
                            href="https://twitter.com/megapayer" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#052f5c] hover:text-[#079e92] transition-colors duration-300 hover:scale-110 transform pointer-events-auto"
                        >
                            <FaTwitter size={24} style={{ color: '#052f5c' }} />
                        </a>
                        <a 
                            href="https://discord.gg/NVqRsTnQ" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#052f5c] hover:text-[#079e92] transition-colors duration-300 hover:scale-110 transform pointer-events-auto"
                        >
                            <FaDiscord size={24} style={{ color: '#052f5c' }} />
                        </a>
                        <a 
                            href="https://www.youtube.com/@Megapayer_io" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#052f5c] hover:text-[#079e92] transition-colors duration-300 hover:scale-110 transform pointer-events-auto"
                        >
                            <FaYoutube size={24} style={{ color: '#052f5c' }} />
                        </a>
                       
                    </div>
                </div>

                {/* Buttons - Desktop */}
                <div className="flex items-center space-x-4 relative pointer-events-auto">
                    {isConnected && (
                        <>
                            <button
                                onClick={handleDashboardClick}
                                className="flex items-center space-x-2 bg-[#052f5c] hover:bg-[#079e92] text-white text-sm font-semibold py-1.5 px-4 rounded-md shadow-sm transition-all duration-200 hover:scale-105 w-32 pointer-events-auto"
                                style={{ backgroundColor: '#052f5c' }}
                            >
                                <FaChartLine className="text-white" />
                                <span>Dashboard</span>
                            </button>
                            <div className="h-6 w-px bg-gray-200"></div>
                        </>
                    )}
                    <div className="pointer-events-auto">
                        <ConnectWallet /> {/* Remove icon prop */}
                    </div>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden relative pointer-events-auto">
                <div className="flex justify-between items-center px-4 py-3">
                    {/* Logo */}
                    <div className="flex items-center" onClick={() => navigate('/')}>

                        <img src="/logo.png" 
                             alt="GNF Logo" 
                             className="h-8" 
                        />
                    </div>

                    {/* Mobile Menu Button */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-[#052f5c] p-2"
                    >
                        {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-50">
                        <div className="p-4 space-y-4">
                            {/* Social Icons - Mobile */}
                            <div className="flex justify-center space-x-6 py-4 border-b border-gray-100">
                                <a 
                                    href="https://t.me/yourgroup" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[#052f5c] hover:text-[#079e92] transition-colors duration-300 hover:scale-110 transform"
                                >
                                    <FaTelegram size={24} style={{ color: '#052f5c' }} />
                                </a>
                                <a 
                                    href="https://twitter.com/yourprofile" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[#052f5c] hover:text-[#079e92] transition-colors duration-300 hover:scale-110 transform"
                                >
                                    <FaTwitter size={24} style={{ color: '#052f5c' }} />
                                </a>
                                <a 
                                    href="https://discord.gg/yourinvite" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[#052f5c] hover:text-[#079e92] transition-colors duration-300 hover:scale-110 transform"
                                >
                                    <FaDiscord size={24} style={{ color: '#052f5c' }} />
                                </a>
                                <a 
                                    href="https://youtube.com/@yourchannel" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[#052f5c] hover:text-[#079e92] transition-colors duration-300 hover:scale-110 transform"
                                >
                                    <FaYoutube size={24} style={{ color: '#052f5c' }} />
                                </a>
                                
                            </div>

                            {/* Buttons - Mobile */}
                            <div className="space-y-3">
                                {isConnected && (
                                    <button
                                        onClick={handleDashboardClick}
                                        className="w-full flex items-center justify-center space-x-2 bg-[#052f5c] text-white py-2 px-4 rounded-md"
                                    >
                                        <FaChartLine className="text-white" />
                                        <span>Dashboard</span>
                                    </button>
                                )}
                                <ConnectWallet /> {/* Remove icon prop here too */}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;