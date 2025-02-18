import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useChainId, useChains } from 'wagmi';  // Replace useNetwork
import { useNetworkValidation } from './useNetworkValidation';
import type { SupportedNetwork } from '../config/networks';

export const useTokenBalance = () => {
    const [balance, setBalance] = useState('0');
    const [tokenSymbol, setTokenSymbol] = useState('');
    const { address } = useAccount();
    const chainId = useChainId();
    const chains = useChains();

    useEffect(() => {
        const fetchBalance = async () => {
            if (!address || !chainId) {
                setBalance('0');
                setTokenSymbol('');
                return;
            }

            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const balance = await provider.getBalance(address);
                setBalance(ethers.utils.formatEther(balance));
                
                // Get token symbol from current chain
                const currentChain = chains.find(c => c.id === chainId);
                setTokenSymbol(currentChain?.nativeCurrency.symbol || '');
            } catch (error) {
                console.error('Error fetching balance:', error);
                setBalance('0');
                setTokenSymbol('');
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [address, chainId, chains]);

    return { balance, tokenSymbol };
};