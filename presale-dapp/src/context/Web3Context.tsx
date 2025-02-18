import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { SUPPORTED_NETWORKS } from '../config/networks';
import { switchToNetwork } from '../utils/network';
import { toast } from 'react-toastify';

interface Web3ContextProps {
  referrer: string | null;
  setReferrer: (address: string | null) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  account: `0x${string}` | undefined;
  chainId: number | undefined;
  isConnected: boolean;
  currentNetwork: typeof SUPPORTED_NETWORKS[keyof typeof SUPPORTED_NETWORKS] | null;
  switchNetwork?: (chainId: number) => void;
}

const Web3Context = createContext<Web3ContextProps>({
  referrer: null,
  setReferrer: () => {},
  connectWallet: () => {},
  disconnectWallet: () => {},
  account: undefined,
  chainId: undefined,
  isConnected: false,
  currentNetwork: null
});

export const useWallet = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWallet must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [referrer, setReferrer] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const currentNetwork = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId) || null;

  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  useEffect(() => {
    const handleNetworkSwitch = async () => {
      if (!chainId) return;

      const isOnGlobalNetwork = chainId === SUPPORTED_NETWORKS.GLOBALNETWORK.chainId;
      const currentPath = window.location.pathname;

      if (currentPath === '/referrals' && !isOnGlobalNetwork) {
        try {
          await switchToNetwork(SUPPORTED_NETWORKS.GLOBALNETWORK.chainId);
        } catch (error: any) {
          console.error('Failed to switch to GlobalNetwork:', error);
          toast.error('Failed to switch network. Please switch manually.');
        }
      }
    };

    handleNetworkSwitch();
  }, [chainId, window.location.pathname]);

  const value = {
    referrer,
    setReferrer,
    connectWallet,
    disconnectWallet,
    account: address,
    chainId,
    isConnected,
    currentNetwork,
    switchNetwork: (chainId: number) => switchChain({ chainId })
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Add this network if it's not already added
const GNF_NETWORK = {
    chainId: '0x3F5', // 1013 in hex
    chainName: 'GNF Network',
    nativeCurrency: {
        name: 'GNF',
        symbol: 'GNF',
        decimals: 18
    },
    rpcUrls: ['https://evm.globalnetwork.foundation/'],
    blockExplorerUrls: ['https://explore.globalnetwork.foundation/']
};
