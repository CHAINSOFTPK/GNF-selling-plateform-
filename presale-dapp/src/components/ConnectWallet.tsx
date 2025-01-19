import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import { BiWallet } from 'react-icons/bi';
import { mainnet } from 'viem/chains';

const ConnectWallet: React.FC = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        if (!ready) return null;
        
        if (!account) {
          return (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openConnectModal}
              style={{ backgroundColor: '#0194FC' }}
              className="flex items-center space-x-2 text-white text-sm font-semibold 
                         py-2 px-4 rounded-xl shadow-lg hover:shadow-xl 
                         transition-all duration-200"
            >
              <BiWallet className="mr-2" />
              Connect Wallet
            </motion.button>
          );
        }

        if (chain?.unsupported) {
          return (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openChainModal}
              className="flex items-center space-x-2 text-white text-sm font-semibold 
                         py-2 px-4 rounded-xl shadow-lg hover:shadow-xl 
                         transition-all duration-200 bg-red-500"
            >
              Wrong Network
            </motion.button>
          );
        }

        if (chain?.id !== mainnet.id) {
          return (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openChainModal}
              className="flex items-center space-x-2 text-white text-sm font-semibold 
                   py-2 px-4 rounded-xl shadow-lg hover:shadow-xl 
                   transition-all duration-200 bg-blue-500"
            >
              Switch Network
            </motion.button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openChainModal}
              style={{ backgroundColor: '#0194FC' }}
              className="flex items-center space-x-2 text-white text-sm font-semibold 
                         py-2 px-4 rounded-xl shadow-lg hover:shadow-xl 
                         transition-all duration-200"
            >
              {chain?.name ?? 'Unknown Network'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAccountModal}
              style={{ backgroundColor: '#0194FC' }}
              className="flex items-center space-x-2 text-white text-sm font-semibold 
                         py-2 px-4 rounded-xl shadow-lg hover:shadow-xl 
                         transition-all duration-200"
            >
              {account.displayName}
            </motion.button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default ConnectWallet;