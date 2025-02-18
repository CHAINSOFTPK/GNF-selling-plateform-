import React from 'react';
import { FaPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';

const MetaMaskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32.958 1L19.504 10.658L21.923 4.987L32.958 1Z" fill="#E17726" stroke="#E17726" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.042 1L15.346 10.773L13.077 4.987L2.042 1Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28.264 23.565L24.729 28.935L32.279 31L34.375 23.705L28.264 23.565Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M0.644989 23.705L2.72099 31L10.271 28.935L6.73599 23.565L0.644989 23.705Z" fill="#E27625" stroke="#E27625" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface AddNetworkProps {
  buttonText: string;
  buttonStyle?: React.CSSProperties;
}

const AddNetwork: React.FC<AddNetworkProps> = ({ buttonText, buttonStyle }) => {
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
      style={buttonStyle}
      className="flex items-center text-xs font-medium bg-gradient-to-r from-[#0194FC] to-[#0182e0] 
                 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-all duration-200"
    >
      <MetaMaskIcon />
      <span className="mx-1">GlobalNetwork</span>
      <FaPlus className="w-3 h-3" />
    </motion.button>
  );
};

export default AddNetwork;
