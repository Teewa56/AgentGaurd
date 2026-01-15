// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/EscrowPaymentUpgradeable.sol";
import "../src/APIPaymentRegistry.sol";
import "../src/AgentRegistry.sol";
import "../src/ReputationBond.sol";
import "../src/InsurancePool.sol";
import "../src/DisputeResolution.sol";

/**
 * @title DeployProxies
 * @notice Deployment script for all AgentGuard contracts with UUPS proxies
 * @dev Run with: forge script script/DeployProxies.s.sol:DeployProxies --rpc-url <RPC_URL> --broadcast
 */
contract DeployProxies is Script {
    // Deployment addresses will be stored here
    address public mneeToken;
    address public agentRegistryProxy;
    address public reputationBondProxy;
    address public escrowPaymentProxy;
    address public insurancePoolProxy;
    address public disputeResolutionProxy;
    address public apiPaymentRegistryProxy;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get MNEE token address (should be deployed separately or use existing)
        mneeToken = vm.envOr("MNEE_TOKEN_ADDRESS", address(0));
        require(mneeToken != address(0), "MNEE token address not set");

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying AgentGuard contracts with UUPS proxies...");
        console.log("Deployer:", deployer);
        console.log("MNEE Token:", mneeToken);
        console.log("");

        // 1. Deploy AgentRegistry (non-upgradeable for now, can be made upgradeable later)
        console.log("1. Deploying AgentRegistry...");
        AgentRegistry agentRegistry = new AgentRegistry();
        agentRegistryProxy = address(agentRegistry);
        console.log("   AgentRegistry deployed at:", agentRegistryProxy);

        // 2. Deploy ReputationBond (non-upgradeable for now)
        console.log("2. Deploying ReputationBond...");
        ReputationBond reputationBond = new ReputationBond(agentRegistryProxy);
        reputationBondProxy = address(reputationBond);
        console.log("   ReputationBond deployed at:", reputationBondProxy);

        // 3. Deploy EscrowPaymentUpgradeable with UUPS Proxy
        console.log("3. Deploying EscrowPaymentUpgradeable...");
        EscrowPaymentUpgradeable escrowImpl = new EscrowPaymentUpgradeable();
        console.log("   Implementation:", address(escrowImpl));

        bytes memory escrowInitData = abi.encodeWithSelector(
            EscrowPaymentUpgradeable.initialize.selector,
            mneeToken,
            agentRegistryProxy,
            reputationBondProxy
        );

        ERC1967Proxy escrowProxy = new ERC1967Proxy(
            address(escrowImpl),
            escrowInitData
        );
        escrowPaymentProxy = address(escrowProxy);
        console.log("   Proxy:", escrowPaymentProxy);

        // 4. Deploy InsurancePool (non-upgradeable for now)
        console.log("4. Deploying InsurancePool...");
        InsurancePool insurancePool = new InsurancePool(
            mneeToken,
            agentRegistryProxy,
            reputationBondProxy
        );
        insurancePoolProxy = address(insurancePool);
        console.log("   InsurancePool deployed at:", insurancePoolProxy);

        // 5. Deploy DisputeResolution (non-upgradeable for now)
        console.log("5. Deploying DisputeResolution...");
        DisputeResolution disputeResolution = new DisputeResolution(
            agentRegistryProxy,
            escrowPaymentProxy,
            insurancePoolProxy,
            reputationBondProxy
        );
        disputeResolutionProxy = address(disputeResolution);
        console.log(
            "   DisputeResolution deployed at:",
            disputeResolutionProxy
        );

        // 6. Deploy APIPaymentRegistry with UUPS Proxy
        console.log("6. Deploying APIPaymentRegistry...");
        APIPaymentRegistry apiPaymentImpl = new APIPaymentRegistry();
        console.log("   Implementation:", address(apiPaymentImpl));

        bytes memory apiPaymentInitData = abi.encodeWithSelector(
            APIPaymentRegistry.initialize.selector
        );

        ERC1967Proxy apiPaymentProxy = new ERC1967Proxy(
            address(apiPaymentImpl),
            apiPaymentInitData
        );
        apiPaymentRegistryProxy = address(apiPaymentProxy);
        console.log("   Proxy:", apiPaymentRegistryProxy);

        // 7. Set authorized contracts
        console.log("7. Configuring contract permissions...");
        EscrowPaymentUpgradeable(escrowPaymentProxy).setAuthorizedContracts(
            insurancePoolProxy,
            disputeResolutionProxy
        );
        console.log("   EscrowPayment authorized contracts set");

        vm.stopBroadcast();

        // Print deployment summary
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("MNEE Token:", mneeToken);
        console.log("AgentRegistry:", agentRegistryProxy);
        console.log("ReputationBond:", reputationBondProxy);
        console.log("EscrowPayment (Proxy):", escrowPaymentProxy);
        console.log("InsurancePool:", insurancePoolProxy);
        console.log("DisputeResolution:", disputeResolutionProxy);
        console.log("APIPaymentRegistry (Proxy):", apiPaymentRegistryProxy);
        console.log("");
        console.log("Save these addresses to your .env file!");
        console.log("");

        // Write addresses to file
        string memory addresses = string.concat(
            "AGENT_REGISTRY_ADDRESS=",
            vm.toString(agentRegistryProxy),
            "\n",
            "REPUTATION_BOND_ADDRESS=",
            vm.toString(reputationBondProxy),
            "\n",
            "ESCROW_PAYMENT_ADDRESS=",
            vm.toString(escrowPaymentProxy),
            "\n",
            "INSURANCE_POOL_ADDRESS=",
            vm.toString(insurancePoolProxy),
            "\n",
            "DISPUTE_RESOLUTION_ADDRESS=",
            vm.toString(disputeResolutionProxy),
            "\n",
            "API_PAYMENT_REGISTRY_ADDRESS=",
            vm.toString(apiPaymentRegistryProxy),
            "\n"
        );

        vm.writeFile("deployed-addresses.txt", addresses);
        console.log("Addresses written to deployed-addresses.txt");
    }
}
