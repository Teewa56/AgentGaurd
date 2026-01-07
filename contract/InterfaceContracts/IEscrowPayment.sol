// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrowPayment {
    function initiateTransaction(
        address merchant,
        uint256 amount,
        string calldata metadataURI
    ) external returns (uint256);
    function settleTransaction(uint256 txId) external;
    function disputeTransaction(uint256 txId) external;
    function resolveDispute(
        uint256 txId,
        uint256 userAmount,
        uint256 merchantAmount
    ) external;
}
