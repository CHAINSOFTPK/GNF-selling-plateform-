import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { getTokenBalance } from '../services/paymentService';
import { SUPPORTED_NETWORKS } from '../config/networks';
import { formatNumber } from '../utils/formatters';
import { ethers } from 'ethers';

export const useTokenBalance = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [balance, setBalance] = useState<string>('0');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !chainId) return;

      const network = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);
      if (!network) return;

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(address);
        setBalance(ethers.utils.formatEther(balance));
        setTokenSymbol(network.nativeCoin);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0');
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [address, chainId]);

  return { balance, tokenSymbol };
};