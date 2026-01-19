// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ReputationBond} from "../src/ReputationBond.sol";
import {EscrowPayment} from "../src/EscrowPayment.sol";
import {DisputeResolution} from "../src/DisputeResolution.sol";
import {InsurancePool} from "../src/InsurancePool.sol";

import {MockERC20} from "../src/MockERC20.sol";

contract DeploymentScript is Script {
    function run() public {
        vm.startBroadcast();

        MockERC20 mnee = new MockERC20("Mock MNEE", "MNEE", 18);
        MockERC20 usdt = new MockERC20("Mock USDT", "USDT", 6);
        MockERC20 usdc = new MockERC20("Mock USDC", "USDC", 6);

        mnee.mint(msg.sender, 1000000 * 1e18);
        usdt.mint(msg.sender, 1000000 * 1e6);
        usdc.mint(msg.sender, 1000000 * 1e6);

        // 1. Deploy InsurancePool
        InsurancePool pool = new InsurancePool();

        // 2. Deploy AgentRegistry
        AgentRegistry registry = new AgentRegistry();

        // 3. Deploy ReputationBond
        ReputationBond bond = new ReputationBond(
            address(mnee),
            address(registry)
        );

        // 4. Deploy EscrowPayment
        EscrowPayment escrow = new EscrowPayment(
            address(mnee),
            address(registry),
            address(bond)
        );

        // 5. Deploy DisputeResolution
        DisputeResolution dispute = new DisputeResolution(
            address(escrow),
            address(bond)
        );

        // 6. Setup Authorized Contracts
        registry.setEscrowPayment(address(escrow));
        bond.setAuthorizedContracts(address(escrow), address(dispute));
        escrow.setAuthorizedContracts(address(pool), address(dispute));
        dispute.addArbitrator(msg.sender);

        // 7. Whitelist Mock Tokens
        escrow.setTokenSupport(address(mnee), true);
        escrow.setTokenSupport(address(usdt), true);
        escrow.setTokenSupport(address(usdc), true);

        vm.stopBroadcast();
    }
}
