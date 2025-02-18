export const getExplorerUrl = (chainId: number, address: string): string => {
    const explorers: Record<number, string> = {
        1: 'https://etherscan.io',
        56: 'https://bscscan.com',
        43114: 'https://snowtrace.io',
        // Add more explorers as needed
    };

    const baseUrl = explorers[chainId] || explorers[1]; // Default to Etherscan
    return `${baseUrl}/address/${address}`;
};
