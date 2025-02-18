import React, { useState } from 'react';
import { RiWallet3Line } from 'react-icons/ri';
import { useWallet } from '../context/Web3Context';
import { formatEther } from 'viem';
import { useBalance, useDisconnect } from 'wagmi'; // Add useDisconnect
import { SUPPORTED_NETWORKS } from '../config/networks';
import { BNBIcon, MaticIcon, AvaxIcon } from './icons/PaymentIcons';
import { GlobalNetworkIcon } from './icons/NetworkIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom'; // Add this import

interface TelegramHeaderProps {
    account?: string;
    chainId?: number;
    onConnect: () => void;
    onNetworkSwitch: (chainId: number) => void;
}

const TelegramHeader: React.FC<TelegramHeaderProps> = ({
    account,
    chainId,
    onConnect,
    onNetworkSwitch
}) => {
    const [showNetworkMenu, setShowNetworkMenu] = useState(false);
    const { disconnect } = useDisconnect(); // Add disconnect hook
    const location = useLocation(); // Add this hook
    const { data: balanceData } = useBalance({
        address: account as `0x${string}`,
        chainId: chainId,
    });

    // Update handleDisconnect to use wagmi's disconnect
    const handleDisconnect = async () => {
        try {
            // Disconnect using wagmi
            disconnect();
            
            // Clear all wallet-related storage
            localStorage.removeItem('walletconnect');
            localStorage.removeItem('wagmi.wallet');
            localStorage.removeItem('wagmi.store');
            localStorage.removeItem('wagmi.network');
            localStorage.removeItem('wagmi.account');
            
            // Clear session storage
            sessionStorage.clear();
            
            // Disconnect WalletConnect if available
            if (window.ethereum && window.ethereum.disconnect) {
                await window.ethereum.disconnect();
            }

            // Force clear MetaMask connection
            if (window.ethereum && window.ethereum.removeAllListeners) {
                window.ethereum.removeAllListeners();
            }

            // Clear any custom connection states
            if (window.localStorage.clear) {
                window.localStorage.clear();
            }

            // Instead of redirecting to home, reload the current page
            window.location.href = location.pathname;
        } catch (error) {
            console.error('Disconnect error:', error);
            // Force reload current page as fallback
            window.location.reload();
        }
    };

    const supportedNetwork = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);

    const formatBalance = (balance: string | undefined) => {
        if (!balance) return '0.00';
        const formatted = parseFloat(formatEther(BigInt(balance))).toFixed(4);
        return formatted;
    };

    const getNetworkIcon = (network: any) => {
        switch (network.chainId) {
            case 56: // BSC
                return <BNBIcon />;
            case 137: // Polygon
                return <MaticIcon />;
            case 43114: // Avalanche
                return <AvaxIcon />;
            case 1013: // Global Network
                return <GlobalNetworkIcon />;
            default:
                return null;
        }
    };

    const getNetworkColor = (networkId: number) => {
        switch (networkId) {
            case 56: // BSC
                return 'from-yellow-500 to-yellow-600';
            case 137: // Polygon
                return 'from-purple-500 to-purple-600';
            case 43114: // Avalanche
                return 'from-red-500 to-red-600';
            case 1013: // Global Network
                return 'from-blue-500 to-blue-600';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <div className="bg-[#1c1c1c] border-b border-gray-800">
            <div className="px-4 py-3">
                {account ? (
                    <div className="flex items-center justify-between gap-2">
                        {/* Balance Display - Made more compact */}
                        <div className="flex items-center bg-gray-800/50 rounded-lg px-2 py-1.5 border border-gray-700">
                            <div className="flex items-center space-x-2">
                                {supportedNetwork && (
                                    <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${getNetworkColor(supportedNetwork.chainId)} 
                                                  flex items-center justify-center`}>
                                        {getNetworkIcon(supportedNetwork)}
                                    </div>
                                )}
                                <span className="text-xs font-medium text-white">
                                    {formatBalance(balanceData?.value?.toString() || '0')}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons - Ensure they're visible */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Network Switch Button - More compact */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                                    className="bg-[#0194FC] hover:bg-[#0182e0] px-2 py-1.5 rounded-lg
                                             text-xs font-medium text-white transition-all duration-200
                                             whitespace-nowrap"
                                >
                                    Network
                                </button>
                                
                                {/* Network Menu Popup */}
                                <AnimatePresence>
                                    {showNetworkMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1c1c1c] border border-gray-800
                                                     shadow-xl overflow-hidden z-50"
                                        >
                                            {Object.values(SUPPORTED_NETWORKS)
                                                .filter(net => net.chainId !== chainId)
                                                .map(network => (
                                                    <button
                                                        key={network.chainId}
                                                        onClick={() => {
                                                            onNetworkSwitch(network.chainId);
                                                            setShowNetworkMenu(false);
                                                        }}
                                                        className="w-full flex items-center space-x-3 px-4 py-3 
                                                                 text-white hover:bg-gray-800/50
                                                                 transition-colors duration-200 border-b border-gray-800/50
                                                                 last:border-b-0"
                                                    >
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getNetworkColor(network.chainId)}
                                                                      flex items-center justify-center`}>
                                                            {getNetworkIcon(network)}
                                                        </div>
                                                        <span className="text-sm font-medium text-white">{network.name}</span>
                                                    </button>
                                                ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Enhanced Disconnect Button */}
                            <button
                                onClick={handleDisconnect}
                                className="bg-gradient-to-r from-red-500/10 to-red-600/10 
                                         hover:from-red-500/20 hover:to-red-600/20 
                                         px-2 py-1.5 rounded-lg text-xs font-medium text-red-500 
                                         whitespace-nowrap transition-all duration-200 
                                         border border-red-500/20 hover:border-red-500/40
                                         flex-shrink-0 inline-flex items-center justify-center
                                         hover:shadow-lg hover:shadow-red-500/10
                                         active:transform active:scale-95"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onConnect}
                        className="w-full bg-[#0194FC] hover:bg-[#0182e0] px-4 py-2.5 rounded-xl
                                 text-sm font-medium flex items-center justify-center space-x-2 text-white
                                 transition-all duration-200 border border-[#0194FC]/20"
                    >
                        <RiWallet3Line className="w-4 h-4" />
                        <span>Connect Wallet</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default TelegramHeader;
