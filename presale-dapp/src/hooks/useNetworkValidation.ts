import { useChainId, useSwitchChain } from 'wagmi';
import { SUPPORTED_NETWORKS } from '../config/networks';

export const useNetworkValidation = () => {
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const validateNetwork = (requiredChainId: number) => {
        if (chainId !== requiredChainId) {
            switchChain && switchChain({ chainId: requiredChainId });
            return false;
        }
        return true;
    };

    const currentNetwork = Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);

    return { validateNetwork, currentNetwork };
};