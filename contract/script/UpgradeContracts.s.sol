// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/EscrowPaymentUpgradeable.sol";
import "../src/APIPaymentRegistry.sol";

/**
 * @title UpgradeContracts
 * @notice Script to upgrade UUPS proxies to new implementations
 * @dev Run with: forge script script/UpgradeContracts.s.sol:UpgradeContracts --rpc-url <RPC_URL> --broadcast
 */
contract UpgradeContracts is Script {
    function run() external {
        // Get proxy addresses from environment
        address escrowPaymentProxy = vm.envAddress("ESCROW_PAYMENT_ADDRESS");
        address apiPaymentRegistryProxy = vm.envAddress(
            "API_PAYMENT_REGISTRY_ADDRESS"
        );

        vm.startBroadcast();

        console.log("Upgrading AgentGuard contracts...");
        console.log("");

        // Upgrade EscrowPayment
        if (escrowPaymentProxy != address(0)) {
            console.log("Upgrading EscrowPayment...");
            console.log("Current Proxy:", escrowPaymentProxy);

            EscrowPaymentUpgradeable newEscrowImpl = new EscrowPaymentUpgradeable();
            console.log("New Implementation:", address(newEscrowImpl));

            EscrowPaymentUpgradeable(escrowPaymentProxy).upgradeToAndCall(
                address(newEscrowImpl),
                ""
            );
            console.log("EscrowPayment upgraded successfully!");
            console.log("");
        }

        // Upgrade APIPaymentRegistry
        if (apiPaymentRegistryProxy != address(0)) {
            console.log("Upgrading APIPaymentRegistry...");
            console.log("Current Proxy:", apiPaymentRegistryProxy);

            APIPaymentRegistry newApiPaymentImpl = new APIPaymentRegistry();
            console.log("New Implementation:", address(newApiPaymentImpl));

            APIPaymentRegistry(apiPaymentRegistryProxy).upgradeToAndCall(
                address(newApiPaymentImpl),
                ""
            );
            console.log("APIPaymentRegistry upgraded successfully!");
            console.log("");
        }

        vm.stopBroadcast();

        console.log("=== UPGRADE COMPLETE ===");
    }
}
