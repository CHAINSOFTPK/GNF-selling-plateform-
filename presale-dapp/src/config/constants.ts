export const API_BASE_URL = 'https://api.gnfstore.com/api';
export const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS || "0xYourTokenContractAddress";
export const USDT_CONTRACT_ADDRESS = process.env.REACT_APP_USDT_CONTRACT_ADDRESS || "0xYourUSDTContractAddress";
export const BUSD_CONTRACT_ADDRESS = process.env.REACT_APP_BUSD_CONTRACT_ADDRESS || "0xYourBUSDContractAddress";
export const USDC_CONTRACT_ADDRESS = '0x0ECd3c2Ce412F29Dec31b19Ee6455894013b3d91'; // Replace with actual USDC contract address
export const REFERRAL_BONUS = 2; // Bonus tokens for referrals
export const TRANSACTION_CONFIRMATION_TIMEOUT = 30000; // 30 seconds timeout for transaction confirmation
export const RECIPIENT_ADDRESS = process.env.REACT_APP_RECIPIENT_ADDRESS || "";
export const GNF_NETWORK = {
    chainId: "0x3F5", // 1013 in hex
    chainName: "Global Network Foundation",
    nativeCurrency: {
        name: "Global Network Foundation",
        symbol: "GNF",
        decimals: 18
    },
    rpcUrls: ["https://evm.globalnetwork.foundation"],
    blockExplorerUrls: ["https://explorer.globalnetwork.foundation"],
    iconUrls: [""] // Add network logo URL if available
};
export const GNF_TOKEN_PRICE = 0.1; // 1 USDT = 0.1 GNF

export const APP_CONSTANTS = {
    TOKEN_ADDRESS: '0x0069642085257abB29DFd67EdA5F4ca484862D90',
    DEFAULT_CHAIN_ID: 1013,
    DEFAULT_RPC_URL: 'https://evm.globalnetwork.foundation',
    EXPLORER_URL: 'https://explorer.globalnetwork.foundation'
};

export const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";
export const CONTRACT_ABI = [/* Your contract ABI here */];