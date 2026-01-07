// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentRegistry {
    function isAgentActive(address agent) external view returns (bool);
    function agentToUser(address agent) external view returns (address);
    function authorizeAndRecordTransaction(
        address agent,
        uint256 amount
    ) external returns (bool);
}
