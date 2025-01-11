import React from 'react';
import { useWallet } from '../context/Web3Context'; // Changed from WalletContext

interface ConnectWalletProps {
    icon?: React.ReactNode;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ icon }) => {
    const { account, connectWallet, disconnectWallet } = useWallet(); // Updated to match Web3Context
    const isConnected = !!account;

    const handleClick = () => {
        if (isConnected) {
            disconnectWallet();
        } else {
            connectWallet();
        }
    };

    return (
        <button
            onClick={handleClick}
            style={{ backgroundColor: '#08B4A6' }}
            className="flex items-center space-x-2 text-white text-sm font-semibold 
                       py-1.5 px-4 rounded-md shadow-sm transition-all duration-200 
                       hover:scale-105 pointer-events-auto relative z-10" // Added pointer-events-auto and z-10
        >
            {icon}
            <span>{isConnected ? 'Disconnect' : 'Connect Wallet'}</span>
        </button>
    );
};

export default ConnectWallet;