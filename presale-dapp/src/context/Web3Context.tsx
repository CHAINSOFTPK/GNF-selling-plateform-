import React, { createContext, useContext, useState } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface Web3ContextProps {
  referrer: string | null;
  setReferrer: (address: string | null) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  account: `0x${string}` | undefined;
  chainId: number | undefined;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextProps>({
  referrer: null,
  setReferrer: () => {},
  connectWallet: () => {},
  disconnectWallet: () => {},
  account: undefined,
  chainId: undefined,
  isConnected: false
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

  const connectWallet = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const value = {
    referrer,
    setReferrer,
    connectWallet,
    disconnectWallet,
    account: address,
    chainId,
    isConnected
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
