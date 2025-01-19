import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { SUPPORTED_NETWORKS } from '../config/networks';

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
    if (!chainId) return;
    
    const isSupported = Object.values(SUPPORTED_NETWORKS).some(
      net => net.chainId === chainId
    );

    if (!isSupported && switchChain) {
      // Switch to BSC by default if on unsupported network
      switchChain({ chainId: SUPPORTED_NETWORKS.BSC.chainId });
    }
  }, [chainId, switchChain]);

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
