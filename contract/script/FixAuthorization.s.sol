// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/ReputationBond.sol";
import "../src/EscrowPaymentUpgradeable.sol";

/**
 * @title FixAuthorization
 * @notice Script to fix contract authorizations for already deployed contracts
 * @dev Run with: forge script script/FixAuthorization.s.sol:FixAuthorization --rpc-url <RPC_URL> --broadcast
 */
contract FixAuthorization is Script {
    // Current deployed addresses
    address agentRegistryAddr = 0x7516873F0Ebbfc2B984B0503843DA8Ef2970d159;
    address reputationBondAddr = 0x4c0855D23c65D6c41d87bdB3b18ec38e4F665d6E;
    address escrowPaymentAddr = 0x2aB75d86DBdB3825069894CfCc5e7038EE243efC;
    address merchantAddr = 0x1460bB01Fc619316F1123971A652727408EBa892; // insurancePool
    address disputeResolutionAddr = 0xE51ee309139f02204e17dBeB023B529942d5c937;

    function run() external {
        vm.startBroadcast();

        console.log("Fixing authorizations...");

        // 1. Link AgentRegistry to EscrowPayment
        AgentRegistry(agentRegistryAddr).setEscrowPayment(escrowPaymentAddr);
        console.log("AgentRegistry linked to EscrowPayment");

        // 2. Link ReputationBond to EscrowPayment & DisputeResolution
        ReputationBond(reputationBondAddr).setAuthorizedContracts(
            escrowPaymentAddr,
            disputeResolutionAddr
        );
        console.log("ReputationBond: Escrow and Dispute addresses set");

        // 3. Link EscrowPayment to InsurancePool & DisputeResolution
        EscrowPaymentUpgradeable(escrowPaymentAddr).setAuthorizedContracts(
            merchantAddr,
            disputeResolutionAddr
        );
        console.log("EscrowPayment: Pool and Dispute addresses set");

        vm.stopBroadcast();
        console.log("Authorization fix complete!");
    }
}
