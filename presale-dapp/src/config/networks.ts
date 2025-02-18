export const SUPPORTED_NETWORKS = {
    BSC: {
        chainId: 56,
        name: 'BSC',
        nativeCoin: 'BNB',
        network: {
            chainId: '0x38',
            chainName: 'BNB Chain',
            nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed.binance.org'],
            blockExplorerUrls: ['https://bscscan.com']
        },
        icon: '🟢',
        spender: process.env.REACT_APP_RECIPIENT_ADDRESS,
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
        network: {
            chainId: '0x89',
            chainName: 'Polygon',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
            },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com']
        },
        icon: '🔵',
        spender: process.env.REACT_APP_RECIPIENT_ADDRESS,
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
        network: {
            chainId: '0xA86A',
            chainName: 'Avalanche',
            nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18
            },
            rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://snowtrace.io']
        },
        icon: '🟠',
        spender: process.env.REACT_APP_RECIPIENT_ADDRESS,
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
    },
    GLOBALNETWORK: {
        chainId: 1013,
        name: 'Global Network',
        nativeCoin: 'GNF',
        network: {
            chainId: '0x3F5',
            chainName: 'Global Network',
            nativeCurrency: {
                name: 'GNF',
                symbol: 'GNF',
                decimals: 18
            },
            rpcUrls: ['https://evm.globalnetwork.foundation'],
            blockExplorerUrls: ['https://explorer.globalnetwork.foundation']
        },
        icon: 'G',
        spender: process.env.REACT_APP_RECIPIENT_ADDRESS,
        tokens: {
            NATIVE: {
                symbol: 'GNF',
                decimals: 18
            },
            USDT: {
                address: '', // Add the USDT contract address for GlobalNetwork when available
                decimals: 18
            }
        }
    }
} as const;

// Add type definition
export type SupportedNetwork = typeof SUPPORTED_NETWORKS[keyof typeof SUPPORTED_NETWORKS];