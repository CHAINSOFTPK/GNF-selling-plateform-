import { ethers } from 'ethers';
import { ERC20_ABI, PAYMENT_TOKENS, RECIPIENT_ADDRESS } from '../config/contracts';

const getWeb3Provider = () => {
    if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
    }
    return new ethers.providers.Web3Provider(window.ethereum);
};

const getContract = (address: string, abi: any) => {
    const provider = getWeb3Provider();
    return new ethers.Contract(address, abi, provider.getSigner());
};

export const checkAllowance = async (
    tokenSymbol: string,
    walletAddress: string
): Promise<boolean> => {
    const token = PAYMENT_TOKENS[tokenSymbol as keyof typeof PAYMENT_TOKENS];
    const contract = getContract(token.address, ERC20_ABI);
    
    try {
        const allowance = await contract.allowance(walletAddress, RECIPIENT_ADDRESS);
        return allowance.gt(ethers.constants.Zero);
    } catch (error) {
        console.error('Error checking allowance:', error);
        return false;
    }
};

export const approveToken = async (
    tokenSymbol: string,
    amount: string
): Promise<boolean> => {
    const token = PAYMENT_TOKENS[tokenSymbol as keyof typeof PAYMENT_TOKENS];
    const contract = getContract(token.address, ERC20_ABI);
    
    try {
        const decimals = token.decimals;
        const amountInWei = ethers.utils.parseUnits(amount, decimals);
        
        const tx = await contract.approve(RECIPIENT_ADDRESS, amountInWei);
        await tx.wait();
        return true;
    } catch (error) {
        console.error('Error approving token:', error);
        throw error;
    }
};

export const transferToken = async (
    tokenSymbol: string,
    amount: string
): Promise<string> => {
    const token = PAYMENT_TOKENS[tokenSymbol as keyof typeof PAYMENT_TOKENS];
    const contract = getContract(token.address, ERC20_ABI);
    
    try {
        const decimals = token.decimals;
        const amountInWei = ethers.utils.parseUnits(amount, decimals);
        
        const tx = await contract.transfer(RECIPIENT_ADDRESS, amountInWei);
        const receipt = await tx.wait();
        return receipt.transactionHash;
    } catch (error) {
        console.error('Error transferring token:', error);
        throw error;
    }
};

export const getTokenBalance = async (
    tokenSymbol: string,
    walletAddress: string
): Promise<string> => {
    const token = PAYMENT_TOKENS[tokenSymbol as keyof typeof PAYMENT_TOKENS];
    const contract = getContract(token.address, ERC20_ABI);
    
    try {
        const balance = await contract.balanceOf(walletAddress);
        return ethers.utils.formatUnits(balance, token.decimals);
    } catch (error) {
        console.error('Error getting token balance:', error);
        throw error;
    }
};
