export const SUPPORTED_NETWORK_ID = 1013;
export const SUPPORTED_NETWORK_NAME = 'Global Network Foundation';

// Add other network-specific configurations here if needed
export const NETWORK_CONFIG = {
    1013: {
        name: 'Global Network Foundation',
        rpcUrl: 'https://evm.globalnetwork.foundation',
        chainId: '0x3F5', // 1013 in hex
        symbol: 'GNF',
        blockExplorer: 'https://explorer.globalnetwork.foundation',
        nativeCurrency: {
            name: 'GNF',
            symbol: 'GNF',
            decimals: 18
        }
    }
};
