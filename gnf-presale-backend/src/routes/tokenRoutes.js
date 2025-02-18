const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const Web3 = require('web3');
const { default: BigNumber } = require('bignumber.js');
const TokenBalance = require('../models/TokenBalance');

// Initialize Web3 with GNF network
const web3 = new Web3('https://evm.globalnetwork.foundation');
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Initialize PaymentVerifier account
const paymentVerifierAccount = web3.eth.accounts.privateKeyToAccount(process.env.PAYMENT_VERIFIER_PRIVATE_KEY);
web3.eth.accounts.wallet.add(paymentVerifierAccount);

// ABI for ERC20 token transfer function
const TOKEN_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const PAYMENT_VERIFIER_ADDRESS = '0xeAf9308310522dC838F30D033dB2EB948C64F1F0';
const PAYMENT_VERIFIER_ABI = [
    {
        "inputs": [
            {"name": "buyer", "type": "address"},
            {"name": "optionId", "type": "uint256"},
            {"name": "amount", "type": "uint256"},
            {"name": "paymentId", "type": "string"}
        ],
        "name": "verifyPayment",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Initialize tokens in database
router.post('/init-tokens', async (req, res) => {
    try {
        await Token.deleteMany({}); // Clear existing tokens
        
        const tokens = [
            {
                symbol: 'GNF10',
                contractAddress: '0xAEd556A73beAE48868967ED3755D02fd4a2f62E4',
                price: 0.2,
                totalSupply: 500000,
                maxPerWallet: 200,
                vestingPeriod: 0
            },
            {
                symbol: 'GNF1000',
                contractAddress: '0x390D5B3A854864CAF342008b61cE4b8b9716bda8',
                price: 0.6,
                totalSupply: 2000000,
                vestingPeriod: 365 // 1 year in days
            },
            {
                symbol: 'GNF10000',
                contractAddress: '0x4C9c0772A58ad89844C7B6Eb701B2E0ED34a9601',
                price: 3000000,
                totalSupply: 3000000,
                vestingPeriod: 1095 // 3 years in days
            }
        ];

        await Token.insertMany(tokens);
        res.json({ success: true, message: 'Tokens initialized' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get token info and stats
router.get('/stats', async (req, res) => {
    try {
        const tokens = await Token.find({});
        res.json({
            success: true,
            data: tokens.map(token => ({
                symbol: token.symbol,
                price: token.price,
                totalSupply: token.totalSupply,
                soldAmount: token.soldAmount,
                remaining: token.totalSupply - token.soldAmount,
                maxPerWallet: token.maxPerWallet,
                vestingPeriod: token.vestingPeriod
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Purchase token
router.post('/purchase', async (req, res) => {
    try {
        const { walletAddress, tokenSymbol, amount, tokenAmount, paymentTxHash, referrer, bonusAmount } = req.body;

        console.log('Purchase request:', {
            walletAddress,
            tokenSymbol,
            usdAmount: amount,
            tokenAmount,
            paymentTxHash
        });

        // Validate required fields
        if (!walletAddress || !tokenSymbol || !amount || !tokenAmount || !paymentTxHash) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Map token symbol to optionId
        const optionIdMap = {
            'GNF10': 0,
            'GNF1000': 1,
            'GNF10000': 2
        };

        const optionId = optionIdMap[tokenSymbol];
        if (optionId === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Invalid token symbol'
            });
        }

        // Use the tokenAmount directly as it's already in wei
        console.log('Using token amount:', tokenAmount);

        // Initialize PaymentVerifier contract
        const paymentVerifier = new web3.eth.Contract(PAYMENT_VERIFIER_ABI, PAYMENT_VERIFIER_ADDRESS);

        // Generate a unique payment ID
        const paymentId = `${walletAddress}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Prepare transaction with the correct token amount
        const tx = {
            from: paymentVerifierAccount.address,
            to: PAYMENT_VERIFIER_ADDRESS,
            gas: 300000,
            gasPrice: await web3.eth.getGasPrice(),
            data: paymentVerifier.methods.verifyPayment(
                walletAddress,
                optionId,
                tokenAmount, // Use the provided token amount in wei
                paymentId
            ).encodeABI()
        };

        console.log('Preparing transaction:', {
            from: tx.from,
            to: tx.to,
            gas: tx.gas,
            optionId,
            amount: tokenAmount
        });

        // First check if the method will succeed
        try {
            await paymentVerifier.methods.verifyPayment(
                walletAddress,
                optionId,
                tokenAmount,
                paymentId
            ).call({ from: paymentVerifierAccount.address });
        } catch (error) {
            console.error('Verification simulation failed:', error);
            return res.status(400).json({
                success: false,
                message: 'Payment verification would fail',
                error: error.message
            });
        }

        // If simulation succeeded, proceed with actual transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.PAYMENT_VERIFIER_PRIVATE_KEY);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        console.log('Transaction receipt:', receipt);

        // Create purchase record
        const purchase = new Purchase({
            walletAddress,
            tokenSymbol,
            amount: tokenAmount,
            paymentTxHash,
            referrer,
            bonusAmount,
            paymentVerificationTx: receipt.transactionHash,
            paymentId
        });

        await purchase.save();

        res.json({
            success: true,
            message: 'Purchase recorded and payment verified successfully',
            data: {
                purchaseId: purchase._id,
                paymentVerificationTx: receipt.transactionHash,
                paymentId
            }
        });
    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            details: error.receipt || {}
        });
    }
});

// Get user's purchases
router.get('/purchases/:walletAddress', async (req, res) => {
    try {
        const purchases = await Purchase.find({
            walletAddress: req.params.walletAddress.toLowerCase()
        });

        res.json({
            success: true,
            data: purchases
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check claim eligibility
router.get('/claim-status/:purchaseId', async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.purchaseId);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }

        const canClaim = purchase.claimDate && new Date() >= purchase.claimDate;
        
        res.json({
            success: true,
            canClaim,
            claimDate: purchase.claimDate,
            claimed: purchase.claimed
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Claim tokens
router.post('/claim', async (req, res) => {
    try {
        const { purchaseId, walletAddress } = req.body;

        // Verify purchase exists and is claimable
        const purchase = await Purchase.findById(purchaseId);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            });
        }

        // Verify wallet address matches purchase
        if (purchase.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized claim attempt'
            });
        }

        // Check if already claimed
        if (purchase.claimed) {
            return res.status(400).json({
                success: false,
                message: 'Tokens already claimed'
            });
        }

        // Get token details
        const token = await Token.findOne({ symbol: purchase.tokenSymbol });
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token configuration not found'
            });
        }

        // Check vesting period
        const now = new Date();
        const vestingEndDate = new Date(purchase.purchaseDate.getTime() + (token.vestingPeriod * 24 * 60 * 60 * 1000));
        
        if (now < vestingEndDate) {
            return res.status(400).json({
                success: false,
                message: 'Vesting period not completed',
                vestingEndDate,
                remainingDays: Math.ceil((vestingEndDate - now) / (1000 * 60 * 60 * 24))
            });
        }

        // Initialize token contract
        const tokenContract = new web3.eth.Contract(TOKEN_ABI, token.contractAddress);

        // Convert amount to wei (assuming 18 decimals)
        const amount = web3.utils.toWei(purchase.amount.toString(), 'ether');

        // Send tokens
        const tx = await tokenContract.methods.transfer(walletAddress, amount).send({
            from: account.address,
            gas: 200000,
            gasPrice: await web3.eth.getGasPrice()
        });

        // Update purchase as claimed
        purchase.claimed = true;
        purchase.claimDate = now;
        await purchase.save();

        res.json({
            success: true,
            message: 'Tokens claimed successfully',
            transactionHash: tx.transactionHash,
            amount: purchase.amount,
            token: purchase.tokenSymbol
        });

    } catch (error) {
        console.error('Claim error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to claim tokens',
            error: error.message
        });
    }
});

// Get claimable purchases for a wallet
router.get('/claimable/:walletAddress', async (req, res) => {
    try {
        const purchases = await Purchase.find({
            walletAddress: req.params.walletAddress.toLowerCase(),
            claimed: false
        });

        const claimableTokens = await Promise.all(purchases.map(async (purchase) => {
            const token = await Token.findOne({ symbol: purchase.tokenSymbol });
            const vestingEndDate = new Date(purchase.purchaseDate.getTime() + (token.vestingPeriod * 24 * 60 * 60 * 1000));
            const isClaimable = new Date() >= vestingEndDate;

            return {
                purchaseId: purchase._id,
                tokenSymbol: purchase.tokenSymbol,
                amount: purchase.amount,
                purchaseDate: purchase.purchaseDate,
                vestingEndDate,
                isClaimable,
                remainingDays: isClaimable ? 0 : Math.ceil((vestingEndDate - new Date()) / (1000 * 60 * 60 * 24))
            };
        }));

        res.json({
            success: true,
            data: claimableTokens
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch claimable tokens',
            error: error.message
        });
    }
});

// Get total purchases for a user
router.get('/total-purchases/:walletAddress', async (req, res) => {
    try {
        const purchases = await Purchase.find({
            walletAddress: req.params.walletAddress.toLowerCase()
        });

        const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        res.json({
            success: true,
            totalAmount
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update the balance endpoint to calculate from purchase history
router.get('/balance/:walletAddress/:symbol', async (req, res) => {
    try {
        const { walletAddress, symbol } = req.params;
        
        if (symbol !== 'GNF10') {
            return res.json({ balance: 0 }); // Only track GNF10
        }

        // Get all GNF10 purchases for this wallet
        const purchases = await Purchase.find({
            walletAddress: walletAddress.toLowerCase(),
            tokenSymbol: 'GNF10'
        });

        // Calculate total purchased amount
        const totalPurchased = purchases.reduce((sum, purchase) => {
            // Convert purchase amount from USD to tokens using GNF10 price (0.2 USD)
            const tokenAmount = purchase.amount / 0.2;
            return sum + tokenAmount;
        }, 0);

        // Return the balance in standard format (not wei)
        return res.json({
            balance: totalPurchased,
            purchases: purchases.map(p => ({
                amount: p.amount / 0.2, // Convert to token amount
                date: p.purchaseDate,
                txHash: p.paymentTxHash
            }))
        });
    } catch (error) {
        console.error('Error calculating balance:', error);
        res.status(500).json({ error: 'Failed to calculate balance' });
    }
});

// Update the check-purchase-limit endpoint as well
router.post('/check-purchase-limit', async (req, res) => {
    try {
        const { walletAddress, amount } = req.body;
        
        // Get all GNF10 purchases
        const purchases = await Purchase.find({
            walletAddress: walletAddress.toLowerCase(),
            tokenSymbol: 'GNF10'
        });

        // Calculate current balance
        const currentBalance = purchases.reduce((sum, purchase) => {
            const tokenAmount = purchase.amount / 0.2; // Convert USD to tokens
            return sum + tokenAmount;
        }, 0);

        // Calculate token amount for new purchase
        const newTokenAmount = parseFloat(amount);
        const wouldExceed = currentBalance + newTokenAmount > 200;

        res.json({
            allowed: !wouldExceed,
            currentBalance,
            remainingAllowance: 200 - currentBalance,
            purchaseHistory: purchases.map(p => ({
                amount: p.amount / 0.2,
                date: p.purchaseDate,
                txHash: p.paymentTxHash
            }))
        });
    } catch (error) {
        console.error('Error checking purchase limit:', error);
        res.status(500).json({ error: 'Failed to check purchase limit' });
    }
});

// Remove or comment out the update-balance endpoint since we don't need it anymore
// The balance is now calculated from purchase history

module.exports = router;
