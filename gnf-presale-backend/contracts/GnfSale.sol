// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SimpleTokenSale is Ownable, ReentrancyGuard {
    struct SaleOption {
        uint256 totalSupply;
        uint256 sold;
        uint256 vestingPeriod;
        uint256 maxPerWallet;
        bool hasMaxPerWallet;
    }

    struct Purchase {
        uint256 amount;
        uint256 releaseTime;
        bool claimed;
    }

    address public paymentVerifier;
    SaleOption[] public saleOptions;
    mapping(uint256 => mapping(address => Purchase[])) public purchases;

    event TokensPurchased(address indexed buyer, uint256 indexed optionId, uint256 amount);
    event TokensClaimed(address indexed buyer, uint256 amount);
    event SaleOptionAdded(uint256 indexed optionId);

    constructor() Ownable(msg.sender) {
        // Initialize sale options (example values)
        saleOptions.push(SaleOption({
            totalSupply: 500000 ether, // Converting to proper decimals
            sold: 0,
            vestingPeriod: 0,
            maxPerWallet: 200 ether,
            hasMaxPerWallet: true
        }));
        saleOptions.push(SaleOption({
            totalSupply: 2000000 ether,
            sold: 0,
            vestingPeriod: 365,
            maxPerWallet: 0,
            hasMaxPerWallet: false
        }));
        saleOptions.push(SaleOption({
            totalSupply: 3000000 ether,
            sold: 0,
            vestingPeriod: 1095,
            maxPerWallet: 0,
            hasMaxPerWallet: false
        }));
    }

    // Function to receive native tokens
    receive() external payable {}
    
    // Function to check contract's balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function setPaymentVerifier(address _paymentVerifier) external onlyOwner {
        paymentVerifier = _paymentVerifier;
    }

    function addSaleOption(
        uint256 totalSupply,
        uint256 vestingPeriod,
        uint256 maxPerWallet,
        bool hasMaxPerWallet
    ) public onlyOwner {
        saleOptions.push(SaleOption({
            totalSupply: totalSupply,
            sold: 0,
            vestingPeriod: vestingPeriod,
            maxPerWallet: maxPerWallet,
            hasMaxPerWallet: hasMaxPerWallet
        }));
        emit SaleOptionAdded(saleOptions.length - 1);
    }

    function processVerifiedPayment(
        address buyer, 
        uint256 optionId, 
        uint256 amount
    ) external {
        require(msg.sender == paymentVerifier, "Only payment verifier");
        require(optionId < saleOptions.length, "Invalid option");
        require(amount > 0, "Amount must be positive");
        require(address(this).balance >= amount, "Insufficient contract balance");

        SaleOption storage option = saleOptions[optionId];
        require(option.sold + amount <= option.totalSupply, "Exceeds supply");

        if (option.hasMaxPerWallet) {
            uint256 totalPurchased = 0;
            Purchase[] storage userPurchases = purchases[optionId][buyer];
            for (uint i = 0; i < userPurchases.length; i++) {
                totalPurchased += userPurchases[i].amount;
            }
            require(totalPurchased + amount <= option.maxPerWallet, "Exceeds wallet limit");
        }

        option.sold += amount;
        purchases[optionId][buyer].push(Purchase({
            amount: amount,
            releaseTime: block.timestamp + (option.vestingPeriod * 1 days),
            claimed: false
        }));

        emit TokensPurchased(buyer, optionId, amount);
    }

    function claimTokens(uint256 optionId) external nonReentrant {
        Purchase[] storage userPurchases = purchases[optionId][msg.sender];
        uint256 totalClaimable = 0;

        for (uint i = 0; i < userPurchases.length; i++) {
            if (!userPurchases[i].claimed && 
                block.timestamp >= userPurchases[i].releaseTime) {
                totalClaimable += userPurchases[i].amount;
                userPurchases[i].claimed = true;
            }
        }

        require(totalClaimable > 0, "Nothing to claim");
        require(address(this).balance >= totalClaimable, "Insufficient contract balance");

        (bool success, ) = payable(msg.sender).call{value: totalClaimable}("");
        require(success, "Transfer failed");
        
        emit TokensClaimed(msg.sender, totalClaimable);
    }

    function getClaimableAmount(address user, uint256 optionId) external view returns (uint256) {
        Purchase[] storage userPurchases = purchases[optionId][user];
        uint256 claimable = 0;

        for (uint i = 0; i < userPurchases.length; i++) {
            if (!userPurchases[i].claimed && 
                block.timestamp >= userPurchases[i].releaseTime) {
                claimable += userPurchases[i].amount;
            }
        }

        return claimable;
    }

    // New function to get vesting details for a user's purchases
    function getVestingDetails(address user, uint256 optionId) external view returns (
        uint256[] memory amounts,
        uint256[] memory releaseTimes,
        uint256[] memory remainingTimes,
        bool[] memory claimedStatus
    ) {
        Purchase[] storage userPurchases = purchases[optionId][user];
        uint256 length = userPurchases.length;
        
        amounts = new uint256[](length);
        releaseTimes = new uint256[](length);
        remainingTimes = new uint256[](length);
        claimedStatus = new bool[](length);
        
        for (uint i = 0; i < length; i++) {
            Purchase storage purchase = userPurchases[i];
            amounts[i] = purchase.amount;
            releaseTimes[i] = purchase.releaseTime;
            claimedStatus[i] = purchase.claimed;
            
            if (block.timestamp >= purchase.releaseTime || purchase.claimed) {
                remainingTimes[i] = 0;
            } else {
                remainingTimes[i] = purchase.releaseTime - block.timestamp;
            }
        }
        
        return (amounts, releaseTimes, remainingTimes, claimedStatus);
    }

    // Get total number of purchases for a user in a specific option
    function getPurchaseCount(address user, uint256 optionId) external view returns (uint256) {
        return purchases[optionId][user].length;
    }

    // Get details of a specific purchase
    function getPurchaseDetails(
        address user, 
        uint256 optionId, 
        uint256 purchaseIndex
    ) external view returns (
        uint256 amount,
        uint256 releaseTime,
        bool claimed,
        uint256 remainingTime
    ) {
        require(purchaseIndex < purchases[optionId][user].length, "Invalid purchase index");
        
        Purchase storage purchase = purchases[optionId][user][purchaseIndex];
        amount = purchase.amount;
        releaseTime = purchase.releaseTime;
        claimed = purchase.claimed;
        
        if (block.timestamp >= purchase.releaseTime || purchase.claimed) {
            remainingTime = 0;
        } else {
            remainingTime = purchase.releaseTime - block.timestamp;
        }
    }

    // Get all purchases for a user in a specific option
    function getAllPurchases(
        address user, 
        uint256 optionId
    ) external view returns (
        uint256[] memory amounts,
        uint256[] memory releaseTimes,
        bool[] memory claimedStatus,
        uint256[] memory remainingTimes
    ) {
        uint256 length = purchases[optionId][user].length;
        require(length > 0, "No purchases found");

        amounts = new uint256[](length);
        releaseTimes = new uint256[](length);
        claimedStatus = new bool[](length);
        remainingTimes = new uint256[](length);

        for (uint i = 0; i < length; i++) {
            Purchase storage purchase = purchases[optionId][user][i];
            amounts[i] = purchase.amount;
            releaseTimes[i] = purchase.releaseTime;
            claimedStatus[i] = purchase.claimed;
            
            if (block.timestamp >= purchase.releaseTime || purchase.claimed) {
                remainingTimes[i] = 0;
            } else {
                remainingTimes[i] = purchase.releaseTime - block.timestamp;
            }
        }
    }
}
