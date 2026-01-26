// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {ReputationBond} from "../src/ReputationBond.sol";
import {EscrowPaymentUpgradeable} from "../src/EscrowPaymentUpgradeable.sol";
import {DisputeResolution} from "../src/DisputeResolution.sol";
import {InsurancePool} from "../src/InsurancePool.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import "../lib/openzeppelin-contracts/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract AutomationBugTest is Test {
    AgentRegistry registry;
    ReputationBond bond;
    EscrowPaymentUpgradeable escrow;
    MockERC20 mnee;

    address user = address(0x1);
    address agent = address(0x2);
    address merchant = address(0x3);

    function setUp() public {
        mnee = new MockERC20("MNEE", "MNEE");
        registry = new AgentRegistry();
        bond = new ReputationBond(address(mnee), address(registry));

        EscrowPaymentUpgradeable implementation = new EscrowPaymentUpgradeable();

        // Deploy proxy
        bytes memory data = abi.encodeWithSelector(
            EscrowPaymentUpgradeable.initialize.selector,
            address(mnee),
            address(registry),
            address(bond)
        );
        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            address(implementation),
            address(0x9), // admin
            data
        );

        escrow = EscrowPaymentUpgradeable(address(proxy));

        registry.setEscrowPayment(address(escrow));
        bond.setAuthorizedContracts(address(escrow), address(0x4));

        mnee.mint(user, 10000e18);
        vm.startPrank(user);
        mnee.approve(address(escrow), type(uint256).max);
        mnee.approve(address(bond), type(uint256).max);
        registry.registerAgent(agent, 100e18, 1000e18, 500e18);
        bond.stakeBond(agent, 500e18);
        vm.stopPrank();
    }

    function test_AutomationOrphanBug() public {
        // 1. Create a Standard Transaction (ID 0, 24h window)
        vm.prank(agent);
        uint256 txId0 = escrow.initiateTransaction(
            merchant,
            address(mnee),
            50e18,
            "ipfs://standard"
        );

        // 2. Create an API Transaction (ID 1, 1h window)
        vm.prank(agent);
        uint256 txId1 = escrow.initiateAPIPayment(
            merchant,
            address(mnee),
            10e18,
            "ipfs://api"
        );

        // 3. Wait 2 hours. API Transaction is ready, Standard is NOT.
        vm.warp(block.timestamp + 2 hours);

        // 4. Run Automation
        (bool upkeepNeeded, bytes memory performData) = escrow.checkUpkeep("");
        assertTrue(upkeepNeeded, "Upkeep should be needed for API tx");

        escrow.performUpkeep(performData);

        // Verify ID 1 is settled, ID 0 is NOT.
        (, , , , , , bool isDisputed1, bool isSettled1, , , ) = escrow
            .transactions(txId1);
        (, , , , , , bool isDisputed0, bool isSettled0, , , ) = escrow
            .transactions(txId0);
        assertTrue(isSettled1, "API tx should be settled");
        assertFalse(isSettled0, "Standard tx should NOT be settled yet");

        // Check lastAutomationCheck - after FIX, it should stay at 0
        // because Tx 0 is still pending settlement.
        assertEq(
            escrow.lastAutomationCheck(),
            0,
            "FIX confirmed: lastAutomationCheck should not jump past Tx 0"
        );
        console2.log(
            "API Transaction (ID 1) settled. lastAutomationCheck stayed at 0 correctly."
        );

        // 5. Wait 24 more hours. Standard Transaction (ID 0) is now ready.
        vm.warp(block.timestamp + 24 hours);

        // 6. Run Automation again
        (upkeepNeeded, performData) = escrow.checkUpkeep("");

        // After FIX: upkeepNeeded should be TRUE because it now searches correctly and finds ID 0.
        assertTrue(
            upkeepNeeded,
            "FIX confirmed: Upkeep should be needed for ID 0"
        );

        escrow.performUpkeep(performData);

        (, , , , , , isDisputed0, isSettled0, , , ) = escrow.transactions(
            txId0
        );
        assertTrue(isSettled0, "Standard tx should now be settled after fix");

        console2.log(
            "FIX VERIFIED: Standard transaction ID 0 was correctly settled."
        );
    }
}
