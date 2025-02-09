import React from 'react';
import { FaPlus, FaNetworkWired } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface AddNetworkProps {
  buttonText?: string;
}

const AddNetwork: React.FC<AddNetworkProps> = ({ buttonText }) => {
  const handleAddNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x3F5' }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x3F5',
                chainName: 'Global Network Foundation',
                nativeCurrency: {
                  name: 'GNF',
                  symbol: 'GNF',
                  decimals: 18,
                },
                rpcUrls: ['https://evm.globalnetwork.foundation'],
                blockExplorerUrls: ['https://explorer.globalnetwork.foundation'],
              }],
            });
          } catch (addError: any) {
            console.error('Error adding network:', addError);
          }
        } else {
          console.error('Error switching network:', switchError);
        }
      }
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleAddNetwork}
      style={{ backgroundColor: '#0194FC', width: 'auto', height: '50px', padding: '0 10px' }}
      className="flex items-center justify-center text-white rounded-lg 
                 transition-all duration-200 hover:brightness-110"
    >
      <FaNetworkWired className="text-xl mr-2" />
      {buttonText && <span>{buttonText}</span>}
      <FaPlus className="text-sm ml-2" />
    </motion.button>
  );
};

export default AddNetwork;
