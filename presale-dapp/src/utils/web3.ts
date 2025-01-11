import { ethers } from 'ethers';
import { GNF_NETWORK } from '../config/constants';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export const getWeb3Provider = () => {
    if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
    }
    return new ethers.providers.Web3Provider(window.ethereum);
};

export const connectWallet = async (): Promise<string> => {
    const provider = getWeb3Provider();
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        return accounts[0];
    } catch (error) {
        console.error("Error connecting to wallet:", error);
        throw error;
    }
};

export const disconnectWallet = async () => {
    // MetaMask doesn't support programmatically disconnecting.
    // You might clear local storage or reset state in your app.
    // For this example, we'll assume it's handled in the ConnectWallet component.
    return true;
};

export const verifyTransaction = async (transactionHash: string) => {
    try {
        const provider = getWeb3Provider();
        const receipt = await provider.getTransactionReceipt(transactionHash);
        return receipt && receipt.status === 1;
    } catch (error) {
        console.error("Error verifying transaction:", error);
        throw error;
    }
};

export const getContract = (contractAddress: string, abi: any) => {
    const provider = getWeb3Provider();
    return new ethers.Contract(contractAddress, abi, provider.getSigner());
};

export const switchToGNFNetwork = async () => {
    try {
        // First try to switch to the network if it exists
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: GNF_NETWORK.chainId }],
            });
            return;
        } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [GNF_NETWORK],
                    });
                    return;
                } catch (addError) {
                    throw new Error("Failed to add GNF network to MetaMask");
                }
            }
            throw new Error("Failed to switch to GNF network");
        }
    } catch (error) {
        console.error("Error switching to GNF network:", error);
        throw error;
    }
};

export const transferToken = async (tokenContract: ethers.Contract, to: string, amount: string) => {
    try {
        const tx = await tokenContract.transfer(to, ethers.utils.parseUnits(amount, 18));
        const receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error("Error transferring tokens:", error);
        throw error;
    }
};

// Remove the duplicate export statement
export {}; // Ensure the file is treated as a module