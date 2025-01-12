export const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)"
];

export const PAYMENT_TOKENS = {
    USDT: {
        address: process.env.REACT_APP_USDT_CONTRACT_ADDRESS || '',
        decimals: 6
    },
    BUSD: {
        address: process.env.REACT_APP_BUSD_CONTRACT_ADDRESS || '',
        decimals: 18
    },
    USDC: {
        address: process.env.REACT_APP_USDC_CONTRACT_ADDRESS || '',
        decimals: 6
    }
};

export const RECIPIENT_ADDRESS = process.env.REACT_APP_RECIPIENT_ADDRESS || '';
