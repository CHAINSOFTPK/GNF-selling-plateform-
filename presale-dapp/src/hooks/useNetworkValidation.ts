import { useChainId } from 'wagmi';
import { SUPPORTED_NETWORKS } from '../config/networks';

export const useNetworkValidation = () => {
    const chainId = useChainId();

    const getCurrentNetwork = () => {
        // This needs to match exactly, including when on GlobalNetwork
        const network = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);
        return network || null;
    };

    const currentNetwork = getCurrentNetwork();

    return {
        currentNetwork,
        chainId,
        isValidNetwork: !!currentNetwork,
        // Add this helper
        getNetworkSymbol: () => currentNetwork?.nativeCoin || ''
    };
};