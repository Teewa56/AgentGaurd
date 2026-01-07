// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDisputeResolution {
    function resolveViaAI(
        uint256 txId,
        uint256 refundPercent,
        uint256 slashAmount,
        string calldata reasoning
    ) external;
}
