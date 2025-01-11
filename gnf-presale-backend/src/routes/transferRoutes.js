const express = require('express');
const router = express.Router();
const Web3 = require('web3');
require('dotenv').config();
const { verifySignature } = require('../middleware/auth');

// Initialize Web3 with proper error handling
let web3;
try {
    web3 = new Web3(new Web3.providers.HttpProvider('https://evm.globalnetwork.foundation'));
} catch (error) {
    console.error('Web3 initialization error:', error);
    process.exit(1);
}

// Initialize account
let account;
try {
    account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
} catch (error) {
    console.error('Account initialization error:', error);
    process.exit(1);
}

// Configure chain ID
const CHAIN_ID = 1013;

// Test token configuration
const TEST_TOKEN_ADDRESS = '0x7cef025E9A77d5a960540c30F5894A44A4eF1af3';
const TEST_TOKEN_ABI = [
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

// Rate limiting for security
const rateLimit = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each wallet to 5 requests per windowMs
};

const rateLimiter = new Map();

const checkRateLimit = (walletAddress) => {
    const now = Date.now();
    const userRequests = rateLimiter.get(walletAddress) || [];
    const validRequests = userRequests.filter(time => now - time < rateLimit.windowMs);
    
    if (validRequests.length >= rateLimit.max) {
        return false;
    }
    
    validRequests.push(now);
    rateLimiter.set(walletAddress, validRequests);
    return true;
};

// Test token transfer endpoint
router.post('/test-transfer', verifySignature, async (req, res) => {
    const { to, amount } = req.body;

    if (!web3.utils.isAddress(to)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid wallet address provided'
        });
    }

    try {
        // Check rate limit
        if (!checkRateLimit(req.walletAddress)) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded. Please try again later.'
            });
        }

        // Verify the requester is the recipient
        if (req.walletAddress.toLowerCase() !== req.body.to.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized transfer attempt'
            });
        }

        // Initialize test token contract
        const testToken = new web3.eth.Contract(TEST_TOKEN_ABI, TEST_TOKEN_ADDRESS);
        
        // Convert amount to wei (assuming 18 decimals)
        const amountInWei = web3.utils.toWei(amount.toString(), 'ether');

        // Prepare transaction
        const tx = {
            from: account.address,
            to: TEST_TOKEN_ADDRESS,
            gas: 200000,
            gasPrice: await web3.eth.getGasPrice(),
            data: testToken.methods.transfer(to, amountInWei).encodeABI()
        };

        // Sign and send transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        res.status(200).json({
            status: 'success',
            message: 'Test token transferred successfully',
            data: {
                transactionHash: receipt.transactionHash,
                from: account.address,
                to: to,
                amount: amount,
                tokenAddress: TEST_TOKEN_ADDRESS
            }
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Transfer failed',
            error: error.message
        });
    }
});

// Test transfer endpoint for specific recipient
const RECIPIENT_ADDRESS = '0x3EA9E1885ca03b983b689b4Ed27683992A980410';

router.post('/test-token', verifySignature, async (req, res) => {
    const { amount } = req.body;

    try {
        // Check rate limit
        if (!checkRateLimit(req.walletAddress)) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded. Please try again later.'
            });
        }

        // Verify the requester is the recipient
        if (req.walletAddress.toLowerCase() !== req.body.to.toLowerCase()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized transfer attempt'
            });
        }

        const testToken = new web3.eth.Contract(TEST_TOKEN_ABI, TEST_TOKEN_ADDRESS);
        const amountInWei = web3.utils.toWei(amount.toString(), 'ether');

        // Prepare transaction
        const tx = {
            from: account.address,
            to: TEST_TOKEN_ADDRESS,
            gas: 200000,
            gasPrice: await web3.eth.getGasPrice(),
            data: testToken.methods.transfer(RECIPIENT_ADDRESS, amountInWei).encodeABI()
        };

        // Sign and send transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        res.status(200).json({
            status: 'success',
            message: 'Test token transferred successfully',
            data: {
                transactionHash: receipt.transactionHash,
                from: account.address,
                to: RECIPIENT_ADDRESS,
                amount: amount,
                tokenAddress: TEST_TOKEN_ADDRESS
            }
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Transfer failed',
            error: error.message
        });
    }
});

router.post('/', async (req, res) => {
    const { to, amount } = req.body;

    if (!web3.utils.isAddress(to)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid wallet address provided',
            error: 'INVALID_ADDRESS'
        });
    }

    const value = web3.utils.toWei(amount.toString(), 'ether');

    try {
        const tx = {
            from: account.address,
            to,
            value,
            gas: 21000,
            gasPrice: await web3.eth.getGasPrice(),
            chainId: CHAIN_ID
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, account.privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        res.status(200).json({
            status: 'success',
            message: 'Transaction completed successfully',
            data: {
                transactionHash: receipt.transactionHash,
                from: account.address,
                to: to,
                amount: amount,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Transaction failed',
            error: error.message,
            details: error.toString()
        });
    }
});

module.exports = router;
