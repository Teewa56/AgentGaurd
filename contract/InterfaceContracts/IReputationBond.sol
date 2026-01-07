// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReputationBond {
    function hasSufficientBond(address agent) external view returns (bool);
    function updateReputation(address agent, int256 delta) external;
    function slashBond(
        address agent,
        uint256 amount,
        string calldata reason
    ) external;
}
