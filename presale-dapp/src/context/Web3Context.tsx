import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { SUPPORTED_NETWORK_ID, SUPPORTED_NETWORK_NAME } from '../config';
import { useLocation } from 'react-router-dom';

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface Web3ContextProps {
    account: string | null;
    chainId: number | null;
    provider: ethers.providers.Web3Provider | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    referrer: string | null;
    setReferrer: (address: string | null) => void;
}

const Web3Context = createContext<Web3ContextProps>({
    account: null,
    chainId: null,
    provider: null,
    connectWallet: async () => {},
    disconnectWallet: () => {},
    referrer: null,
    setReferrer: () => {}
});

export const useWallet = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWallet must be used within a Web3Provider');
    }
    return context;
};

const switchToGNFNetwork = async (ethereum: any) => {
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x3F5' }], // 1013 in hex
        });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x3F5',
                        chainName: 'Global Network Foundation',
                        nativeCurrency: {
                            name: 'GNF',
                            symbol: 'GNF',
                            decimals: 18
                        },
                        rpcUrls: ['https://evm.globalnetwork.foundation'],
                        blockExplorerUrls: ['https://explorer.globalnetwork.foundation']
                    }]
                });
            } catch (addError) {
                throw addError;
            }
        }
        throw switchError;
    }
};

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [referrer, setReferrer] = useState<string | null>(null);
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    const initializeUser = async (address: string) => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://153.92.222.4:4000';
            const response = await fetch(`${apiUrl}/api/users/initialize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    walletAddress: address,
                    referrer: referrer // Include referrer in initialization
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to initialize user');
            }

            // After successful initialization, save the referral if exists
            if (referrer) {
                await fetch(`${apiUrl}/api/referrals/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        referrer: referrer,
                        referred: address
                    })
                });
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Failed to initialize user:', error);
            throw error;
        }
    };

    const connectWallet = async (showToast: boolean = true) => {
        if (isAdminRoute) return;

        try {
            const { ethereum } = window;
            if (!ethereum) {
                toast.error('Please install MetaMask!');
                return;
            }

            await switchToGNFNetwork(ethereum);

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const address = accounts[0];
            const web3Provider = new ethers.providers.Web3Provider(ethereum);
            const network = await web3Provider.getNetwork();

            if (network.chainId !== SUPPORTED_NETWORK_ID) {
                toast.error(`Please connect to ${SUPPORTED_NETWORK_NAME}!`);
                return;
            }

            await initializeUser(address);

            setAccount(address);
            setChainId(network.chainId);
            setProvider(web3Provider);
            localStorage.setItem('walletConnected', 'true');
            
            // Only show success toast if explicitly requested
            if (showToast) {
                toast.success('Wallet connected successfully');
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            if (showToast) {
                toast.error('Failed to connect wallet');
            }
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setChainId(null);
        setProvider(null);
        localStorage.removeItem('walletConnected');
        toast.info('Wallet disconnected');
    };

    useEffect(() => {
        if (isAdminRoute) return; // Skip initialization on admin routes

        const checkConnection = async () => {
            const isConnected = localStorage.getItem('walletConnected') === 'true';
            if (isConnected && window.ethereum) {
                // Pass false to prevent showing toast on auto-reconnect
                await connectWallet(false);
            }
        };

        checkConnection();
    }, [isAdminRoute]);

    useEffect(() => {
        if (window.ethereum && !isAdminRoute) {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnectWallet();
                } else {
                    setAccount(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum && !isAdminRoute) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, [isAdminRoute]);

    const value = {
        account,
        chainId,
        provider,
        connectWallet,
        disconnectWallet,
        referrer,
        setReferrer
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
};
