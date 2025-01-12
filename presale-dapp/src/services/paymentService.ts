import { ethers } from 'ethers';
import { ERC20_ABI, PAYMENT_TOKENS, RECIPIENT_ADDRESS } from '../config/contracts';
import { TOKEN_DECIMALS } from './tokenService';

export const getTokenContract = (tokenSymbol: string) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const tokenAddress = PAYMENT_TOKENS[tokenSymbol as keyof typeof PAYMENT_TOKENS]?.address;
    
    if (!tokenAddress) {
        throw new Error(`No contract address found for ${tokenSymbol}`);
    }

    return new ethers.Contract(tokenAddress, ERC20_ABI, signer);
};

export const checkAllowance = async (tokenSymbol: string, walletAddress: string): Promise<boolean> => {
    try {
        const contract = getTokenContract(tokenSymbol);
        const allowance = await contract.allowance(walletAddress, RECIPIENT_ADDRESS);
        return allowance.gt(0);
    } catch (error) {
        console.error('Error checking allowance:', error);
        return false;
    }
};

export const approveToken = async (tokenSymbol: string, amount: string): Promise<void> => {
    const contract = getTokenContract(tokenSymbol);
    const decimals = TOKEN_DECIMALS[tokenSymbol] || 18;
    
    try {
        const parsedAmount = ethers.utils.parseUnits(amount, decimals);
        const tx = await contract.approve(RECIPIENT_ADDRESS, parsedAmount);
        await tx.wait();
    } catch (error) {
        console.error('Error approving token:', error);
        throw error;
    }
};

export const transferToken = async (tokenSymbol: string, amount: string): Promise<string> => {
    const contract = getTokenContract(tokenSymbol);
    const decimals = TOKEN_DECIMALS[tokenSymbol] || 18;
    
    try {
        const parsedAmount = ethers.utils.parseUnits(amount, decimals);
        const tx = await contract.transfer(RECIPIENT_ADDRESS, parsedAmount);
        const receipt = await tx.wait();
        return receipt.transactionHash;
    } catch (error) {
        console.error('Error transferring token:', error);
        throw error;
    }
};

export const getTokenBalance = async (tokenSymbol: string, walletAddress: string): Promise<string> => {
    const contract = getTokenContract(tokenSymbol);
    try {
        const balance = await contract.balanceOf(walletAddress);
        const decimals = TOKEN_DECIMALS[tokenSymbol] || 18;
        return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
        console.error('Error getting token balance:', error);
        throw error;
    }
};
