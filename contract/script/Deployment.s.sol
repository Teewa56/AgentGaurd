// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ReputationBond} from "../src/ReputationBond.sol";
import {EscrowPayment} from "../src/EscrowPayment.sol";
import {DisputeResolution} from "../src/DisputeResolution.sol";
import {InsurancePool} from "../src/InsurancePool.sol";

contract DeploymentScript is Script {
    // MNEE address from README
    address constant MNEE = 0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF;

    function run() public {
        vm.startBroadcast();

        // 1. Deploy InsurancePool
        InsurancePool pool = new InsurancePool(MNEE);

        // 2. Deploy AgentRegistry
        AgentRegistry registry = new AgentRegistry();

        // 3. Deploy ReputationBond
        ReputationBond bond = new ReputationBond(MNEE, address(registry));

        // 4. Deploy EscrowPayment
        EscrowPayment escrow = new EscrowPayment(
            MNEE,
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

        vm.stopBroadcast();
    }
}
