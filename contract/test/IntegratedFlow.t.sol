// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ReputationBond} from "../src/ReputationBond.sol";
import {EscrowPayment} from "../src/EscrowPayment.sol";
import {DisputeResolution} from "../src/DisputeResolution.sol";
import {InsurancePool} from "../src/InsurancePool.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract IntegratedFlowTest is Test {
    AgentRegistry registry;
    ReputationBond bond;
    EscrowPayment escrow;
    DisputeResolution dispute;
    InsurancePool pool;
    MockERC20 mnee;

    address user = address(0x1);
    address agent = address(0x2);
    address merchant = address(0x3);
    address arbitrator = address(0x4);

    function setUp() public {
        mnee = new MockERC20("MNEE", "MNEE");

        pool = new InsurancePool(address(mnee));
        registry = new AgentRegistry();
        bond = new ReputationBond(address(mnee), address(registry));
        escrow = new EscrowPayment(
            address(mnee),
            address(registry),
            address(bond)
        );
        dispute = new DisputeResolution(address(escrow), address(bond));

        // Wiring
        registry.setEscrowPayment(address(escrow));
        bond.setAuthorizedContracts(address(escrow), address(dispute));
        escrow.setAuthorizedContracts(address(pool), address(dispute));
        dispute.addArbitrator(arbitrator);

        // Prep user funds
        mnee.mint(user, 10000e18);
        vm.prank(user);
        mnee.approve(address(escrow), type(uint256).max);
        vm.prank(user);
        mnee.approve(address(bond), type(uint256).max);
    }

    function test_SuccessfulTransactionFlow() public {
        // 1. Register Agent
        vm.prank(user);
        registry.registerAgent(agent, 100e18, 1000e18, 500e18);

        // 2. Stake Bond
        // Initial rep 500, Monthly Limit 1000.
        // Required Bond = (1000 / 2) * (1000 - 500) / 1000 = 500 * 0.5 = 250
        vm.prank(user);
        bond.stakeBond(agent, 250e18);
        assertTrue(bond.hasSufficientBond(agent));

        // 3. Initiate Transaction
        vm.prank(agent);
        uint256 txId = escrow.initiateTransaction(
            merchant,
            50e18,
            "ipfs://evidence"
        );

        // 4. Verify Escrow
        (, , , , uint256 lockEnd, , , ) = escrow.transactions(txId);
        assertEq(mnee.balanceOf(address(escrow)), 50e18);
        assertEq(lockEnd, block.timestamp + 24 hours);

        // 5. Warp and Settle
        vm.warp(block.timestamp + 25 hours);
        escrow.settleTransaction(txId);

        // 6. Verify Settlement
        // Fee is 0.5% of 50 = 0.25. Merchant gets 49.75
        assertEq(mnee.balanceOf(merchant), 49.75e18);

        (uint256 rep, , ) = bond.agentStats(agent);
        assertEq(rep, 502); // Rep increased by 2
    }

    function test_DisputeAndRefundFlow() public {
        vm.prank(user);
        registry.registerAgent(agent, 100e18, 1000e18, 500e18);
        vm.prank(user);
        bond.stakeBond(agent, 500e18); // Plenty of bond

        vm.prank(agent);
        uint256 txId = escrow.initiateTransaction(
            merchant,
            50e18,
            "ipfs://evidence"
        );

        // User disputes
        vm.prank(user);
        escrow.disputeTransaction(txId);

        // Arbitrator resolves with 100% refund and slashes 10 MNEE
        vm.prank(arbitrator);
        dispute.resolveViaAI(txId, 100, 10e18, "Policy violation detected");

        // Verify Refund
        assertEq(mnee.balanceOf(user), 10000e18 - 500e18); // Full refund of 50, but 500 still staked

        // Verify Restocking Fee for Merchant
        assertEq(mnee.balanceOf(merchant), 10e18);

        // Bond should be slashed by 10
        (uint256 rep, uint256 staked, ) = bond.agentStats(agent);
        assertEq(staked, 490e18);
        assertEq(rep, 450); // -50 for violation
    }
}
