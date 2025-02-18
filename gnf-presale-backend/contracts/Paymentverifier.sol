// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

contract PaymentVerifier is Ownable {
    address public saleContract;
    mapping(string => bool) public processedPayments;
    
    event PaymentVerified(address buyer, uint256 amount, string paymentId);
    
    constructor() Ownable(msg.sender) {}
    
    function setSaleContract(address _saleContract) external onlyOwner {
        saleContract = _saleContract;
    }
    
    function verifyPayment(
        address buyer,
        uint256 optionId,
        uint256 amount,
        string calldata paymentId
    ) external onlyOwner {
        require(!processedPayments[paymentId], "Payment already processed");
        processedPayments[paymentId] = true;
        
        ISimpleTokenSale(saleContract).processVerifiedPayment(buyer, optionId, amount);
        
        emit PaymentVerified(buyer, amount, paymentId);
    }
}

interface ISimpleTokenSale {
    function processVerifiedPayment(address buyer, uint256 optionId, uint256 amount) external;
}
