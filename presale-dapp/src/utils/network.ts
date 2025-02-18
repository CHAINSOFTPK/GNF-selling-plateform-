import { SUPPORTED_NETWORKS } from '../config/networks';

export const switchToNetwork = async (chainId: number) => {
    if (!window.ethereum) throw new Error('No crypto wallet found');

    const network = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);
    if (!network) throw new Error('Network not supported');

    const hexChainId = `0x${chainId.toString(16)}`;

    try {
        // First try to switch to the network
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
        });
    } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902 || switchError.code === -32603) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: hexChainId,
                        chainName: network.network.chainName,
                        nativeCurrency: network.network.nativeCurrency,
                        rpcUrls: network.network.rpcUrls,
                        blockExplorerUrls: network.network.blockExplorerUrls
                    }],
                });
            } catch (addError) {
                throw new Error('Failed to add network to wallet');
            }
        } else {
            throw switchError;
        }
    }
};
