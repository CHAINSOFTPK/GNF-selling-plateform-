export const SUPPORTED_NETWORKS = {
    BSC: {
        chainId: 56,
        name: 'BNB Smart Chain',
        nativeCoin: 'BNB',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        icon: '🟢', // Replace with actual icon paths or components
        spender: process.env.REACT_APP_RECIPIENT_ADDRESS, // Use recipient address from env
        tokens: {
            NATIVE: {
                symbol: 'BNB',
                decimals: 18
            },
            USDT: {
                address: '0x55d398326f99059fF775485246999027B3197955',
                decimals: 18
            }
        }
    },
    POLYGON: {
        chainId: 137,
        name: 'Polygon',
        nativeCoin: 'MATIC',
        rpcUrl: 'https://polygon-rpc.com',
        icon: '🔵',
        spender: process.env.REACT_APP_RECIPIENT_ADDRESS, // Use the same recipient address
        tokens: {
            NATIVE: {
                symbol: 'MATIC',
                decimals: 18
            },
            USDT: {
                address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                decimals: 6
            }
        }
    },
    AVALANCHE: {
        chainId: 43114,
        name: 'Avalanche',
        nativeCoin: 'AVAX',
        icon: '🟠',
        spender: process.env.REACT_APP_RECIPIENT_ADDRESS, // Use the same recipient address
        tokens: {
            NATIVE: {
                symbol: 'AVAX',
                decimals: 18
            },
            USDT: {
                address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
                decimals: 6
            }
        }
    }
};