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

        // 0. Deploy Mock Tokens
        MockERC20 mnee = new MockERC20("Mock MNEE", "MNEE", 18);
        MockERC20 usdt = new MockERC20("Mock USDT", "USDT", 6);
        MockERC20 usdc = new MockERC20("Mock USDC", "USDC", 6);

        // Mint some tokens to deployer for testing
        mnee.mint(msg.sender, 1000000 * 1e18);
        usdt.mint(msg.sender, 1000000 * 1e6);
        usdc.mint(msg.sender, 1000000 * 1e6);

        // 1. Deploy InsurancePool
        InsurancePool pool = new InsurancePool(); // No MNEE arg in constructor based on file check, or if changed, update.
        // Checking InsurancePool.sol content from previous turns, it has `constructor() Ownable(msg.sender) {}`
        // effectively ignoring the MNEE arg if passed, but let's check if I should remove it based on standard.
        // Actually, previous Deployment.s.sol showed `new InsurancePool(MNEE)`, but `InsurancePool.sol` (viewed in Step 108)
        // has `constructor() Ownable(msg.sender) {}`. So passing MNEE is actually an error if I don't fix it.
        // Wait, Step 108 view_file `InsurancePool.sol` line 25: `constructor() Ownable(msg.sender) {}`.
        // It does NOT take arguments. The original script was wrong or the contract changed.
        // I will trust the file I viewed.

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
        dispute.addArbitrator(msg.sender); // Deployer is the first arbitrator

        // 7. Whitelist Mock Tokens
        escrow.setTokenSupport(address(mnee), true); // Constructor does this, but being explicit helps
        escrow.setTokenSupport(address(usdt), true);
        escrow.setTokenSupport(address(usdc), true);

        vm.stopBroadcast();
    }
}
