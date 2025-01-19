import { ethers } from 'ethers';
import { ERC20_ABI } from '../abis';
import { SUPPORTED_NETWORKS } from '../config/networks';

export type TokenType = 'NATIVE' | 'USDT';

const getNetworkByChainId = (chainId: number) => {
    return Object.values(SUPPORTED_NETWORKS).find(net => net.chainId === chainId);
};

export const getTokenContract = (tokenSymbol: TokenType, chainId: number) => {
    // Early return for native token
    if (tokenSymbol === 'NATIVE') {
        return null;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const network = getNetworkByChainId(chainId);
    if (!network) throw new Error(`Network not supported: ${chainId}`);
    const tokenData = network.tokens[tokenSymbol];
    
    if (!tokenData || !('address' in tokenData)) {
        throw new Error(`No contract address found for ${tokenSymbol} on chain ${chainId}`);
    }

    return new ethers.Contract(tokenData.address, ERC20_ABI, signer);
};

export const checkAllowance = async (
    tokenSymbol: TokenType,
    walletAddress: string,
    chainId: number
): Promise<boolean> => {
    if (tokenSymbol === 'NATIVE') return true;

    try {
        const network = getNetworkByChainId(chainId);
        if (!network) throw new Error(`Network not supported: ${chainId}`);
        const contract = getTokenContract(tokenSymbol, chainId);
        if (!contract) throw new Error('No contract available');
        const allowance = await contract.allowance(walletAddress, network.spender);
        return allowance.gt(0);
    } catch (error) {
        console.error('Error checking allowance:', error);
        return false;
    }
};

export const approveToken = async (tokenSymbol: TokenType, amount: string, chainId: number): Promise<void> => {
    if (tokenSymbol === 'NATIVE') return;

    const network = getNetworkByChainId(chainId);
    if (!network) throw new Error(`Network not supported: ${chainId}`);
    const contract = getTokenContract(tokenSymbol, chainId);
    if (!contract) throw new Error('No contract available');
    
    const tx = await contract.approve(network.spender, ethers.utils.parseUnits(amount, network.tokens[tokenSymbol].decimals));
    await tx.wait();
};

interface EthersError extends Error {
    code?: string;
    reason?: string;
    data?: unknown;
}

export const transferNativeToken = async (amount: string, chainId: number) => {
    try {
        const recipientAddress = process.env.REACT_APP_RECIPIENT_ADDRESS;
        if (!recipientAddress) {
            throw new Error('Recipient address not configured');
        }

        if (!ethers.utils.isAddress(recipientAddress)) {
            throw new Error('Invalid recipient address configuration');
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        console.log('Sending native token to:', recipientAddress); // Debug log
        
        const tx = await signer.sendTransaction({
            to: recipientAddress,
            value: ethers.utils.parseEther(amount)
        });

        const receipt = await tx.wait();
        return receipt.transactionHash;
    } catch (error) {
        console.error('Error transferring native token:', error);
        const ethersError = error as EthersError;
        if (ethersError.code === 'INVALID_ARGUMENT') {
            throw new Error('Invalid transaction parameters. Please check the configuration.');
        }
        if (ethersError.reason) {
            throw new Error(ethersError.reason);
        }
        throw new Error('Failed to transfer native token');
    }
};

export const transferToken = async (tokenSymbol: TokenType, amount: string, chainId: number): Promise<string> => {
    const network = getNetworkByChainId(chainId);
    if (!network) throw new Error(`Network not supported: ${chainId}`);
    const contract = getTokenContract(tokenSymbol, chainId);
    if (!contract) throw new Error('No contract available');
    const decimals = network.tokens[tokenSymbol].decimals;
    
    try {
        const parsedAmount = ethers.utils.parseUnits(amount, decimals);
        const tx = await contract.transfer(network.spender, parsedAmount);
        const receipt = await tx.wait();
        return receipt.transactionHash;
    } catch (error) {
        console.error('Error transferring token:', error);
        throw error;
    }
};

export const getTokenBalance = async (
    tokenSymbol: TokenType,
    walletAddress: string,
    chainId: number
): Promise<string> => {
    // Handle native token balance
    if (tokenSymbol === 'NATIVE') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(walletAddress);
        return ethers.utils.formatEther(balance);
    }

    const network = getNetworkByChainId(chainId);
    if (!network) throw new Error(`Network not supported: ${chainId}`);
    const contract = getTokenContract(tokenSymbol, chainId);
    if (!contract) throw new Error('No contract available');
    
    try {
        const balance = await contract.balanceOf(walletAddress);
        const decimals = network.tokens[tokenSymbol]?.decimals || 18;
        return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
        console.error('Error getting token balance:', error);
        throw error;
    }
};
