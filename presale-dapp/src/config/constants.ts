export const API_BASE_URL = 'http://153.92.222.4:4000/api';
export const TOKEN_CONTRACT_ADDRESS = process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS || "0xYourTokenContractAddress";
export const USDT_CONTRACT_ADDRESS = process.env.REACT_APP_USDT_CONTRACT_ADDRESS || "0xYourUSDTContractAddress";
export const USDC_CONTRACT_ADDRESS = process.env.REACT_APP_USDC_CONTRACT_ADDRESS || "0xYourUSDCContractAddress";
export const FUSD_CONTRACT_ADDRESS = '0x0ECd3c2Ce412F29Dec31b19Ee6455894013b3d91'; // Replace with actual FUSD contract address
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