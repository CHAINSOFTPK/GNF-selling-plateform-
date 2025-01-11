const Web3 = require('web3');
const web3 = new Web3();

const verifySignature = async (req, res, next) => {
    try {
        const { signature, timestamp, walletAddress } = req.headers;

        if (!signature || !timestamp || !walletAddress) {
            return res.status(401).json({
                success: false,
                message: 'Missing authentication parameters'
            });
        }

        // Check timestamp to prevent replay attacks (5 minutes validity)
        const now = Date.now();
        const messageTime = parseInt(timestamp);
        if (now - messageTime > 300000) { // 5 minutes
            return res.status(401).json({
                success: false,
                message: 'Request expired'
            });
        }

        // Message that was signed
        const message = `${walletAddress}:${timestamp}`;
        
        // Recover signer address
        const recoveredAddress = web3.eth.accounts.recover(message, signature);

        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(401).json({
                success: false,
                message: 'Invalid signature'
            });
        }

        req.walletAddress = walletAddress.toLowerCase();
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

module.exports = { verifySignature };
