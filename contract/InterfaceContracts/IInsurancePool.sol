// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IInsurancePool {
    function receiveFees(uint256 amount) external;
    function executePayout(
        address to,
        uint256 amount,
        string calldata reason
    ) external;
}
