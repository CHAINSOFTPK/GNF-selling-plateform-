import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import SimpleTokenSaleABI from '../abi/SimpleTokenSale.json';

const CONTRACT_ADDRESS = '0xD80acDaFbF9B35eA02D0c80C907e2D840684B43d';
const RPC_URL = 'https://evm.globalnetwork.foundation/';

interface ReferralInfo {
    userReferralCode: string;
    userReferrer: string;
    pendingRewards: string;
    totalReferrals: number;
    referredAddresses: string[];
    referrerRewardRate: number;
    referredBonusRate: number;
}

export const usePresaleContract = (account: string | undefined) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [purchaseData, setPurchaseData] = useState<any[]>([]);
    const [claimableAmount, setClaimableAmount] = useState<string>('0');
    const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!account) {
                setLoading(false);
                return;
            }

            try {
                const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    SimpleTokenSaleABI.abi,
                    provider
                );

                // Initialize empty data array
                const allOptionData = [];
                let totalPurchaseCount = 0;

                // Fetch data for each option individually with better error handling
                for (let optionId = 0; optionId < 3; optionId++) {
                    try {
                        console.log(`Fetching data for option ${optionId}...`);
                        
                        const [purchases, claimable, vestingDetails, purchaseCount] = await Promise.all([
                            contract.getAllPurchases(account, optionId).catch(() => ({
                                amounts: [], releaseTimes: [], claimedStatus: [], remainingTimes: []
                            })),
                            contract.getClaimableAmount(account, optionId).catch(() => ethers.BigNumber.from(0)),
                            contract.getVestingDetails(account, optionId).catch(() => ({
                                amounts: [], releaseTimes: [], remainingTimes: [], claimedStatus: []
                            })),
                            contract.getPurchaseCount(account, optionId).catch(() => 0)
                        ]);

                        // Add to total purchase count regardless of claim status
                        totalPurchaseCount += Number(purchaseCount);

                        allOptionData.push({
                            optionId,
                            purchases,
                            claimable: ethers.utils.formatEther(claimable),
                            vestingDetails,
                            totalPurchases: Number(purchaseCount)
                        });
                    } catch (err) {
                        console.log(`Error fetching option ${optionId}:`, err);
                        allOptionData.push({
                            optionId,
                            purchases: { amounts: [], releaseTimes: [], claimedStatus: [], remainingTimes: [] },
                            claimable: '0',
                            vestingDetails: { amounts: [], releaseTimes: [], remainingTimes: [], claimedStatus: [] },
                            totalPurchases: 0
                        });
                    }
                }

                setPurchaseData(allOptionData.map(data => ({
                    ...data,
                    // Keep track of all purchases, not just unclaimed ones
                    totalPurchases: data.totalPurchases
                })));
                
                // Calculate total claimable
                const totalClaimable = allOptionData.reduce(
                    (acc, curr) => acc + Number(curr.claimable),
                    0
                );
                setClaimableAmount(totalClaimable.toString());

                // Fetch referral info
                const info = await contract.getReferralInfo(account);
                setReferralInfo({
                    userReferralCode: info[0],
                    userReferrer: info[1],
                    pendingRewards: ethers.utils.formatEther(info[2]),
                    totalReferrals: info[3].toString(),
                    referredAddresses: info[4],
                    referrerRewardRate: info[5].toString(),
                    referredBonusRate: info[6].toString()
                });

                setError(null);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [account]);

    const claimTokens = async (optionId: number) => {
        if (!account) return;
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            if (network.chainId !== 1013) {
                throw new Error('Please switch to GNF Network to claim tokens');
            }

            await provider.send("eth_requestAccounts", []); // Request account access
            const signer = provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                SimpleTokenSaleABI.abi,
                signer
            );

            const tx = await contract.claimTokens(optionId);
            await tx.wait();
            
            // Refresh data after claiming
            window.location.reload();
        } catch (err: any) {
            // Throw the raw error to be handled by the component
            throw err;
        }
    };

    const generateReferralCode = async () => {
        if (!account) return;
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                SimpleTokenSaleABI.abi,
                signer
            );
            const tx = await contract.generateReferralCode();
            await tx.wait();
            await fetchReferralInfo();
        } catch (err: any) {
            throw err;
        }
    };

    const registerReferral = async (code: string) => {
        if (!account) return;
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                SimpleTokenSaleABI.abi,
                signer
            );
            const tx = await contract.registerReferral(code);
            await tx.wait();
            await fetchReferralInfo();
        } catch (err: any) {
            throw err;
        }
    };

    const claimReferralRewards = async () => {
        if (!account) return;
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            if (network.chainId !== 1013) {
                throw new Error('Please switch to GNF Network to claim rewards');
            }

            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                SimpleTokenSaleABI.abi,
                signer
            );
            
            const tx = await contract.claimReferralRewards();
            await tx.wait();
            
            await fetchReferralInfo();
        } catch (err: any) {
            throw err;
        }
    };

    const fetchReferralInfo = async () => {
        if (!account) return;
        try {
            const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                SimpleTokenSaleABI.abi,
                provider
            );
            const info = await contract.getReferralInfo(account);
            setReferralInfo({
                userReferralCode: info[0],
                userReferrer: info[1],
                pendingRewards: ethers.utils.formatEther(info[2]),
                totalReferrals: info[3].toString(),
                referredAddresses: info[4],
                referrerRewardRate: info[5].toString(),
                referredBonusRate: info[6].toString()
            });
        } catch (err) {
            console.error('Error fetching referral info:', err);
        }
    };

    useEffect(() => {
        if (account) {
            fetchReferralInfo();
        }
    }, [account]);

    return {
        loading,
        error,
        purchaseData,
        claimableAmount,
        claimTokens,
        referralInfo,
        generateReferralCode,
        registerReferral,
        claimReferralRewards,
        refreshData: fetchReferralInfo
    };
};
