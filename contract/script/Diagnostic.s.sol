// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/ReputationBond.sol";
import "../src/EscrowPaymentUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Diagnostic is Script {
    address agentRegistryAddr = 0x7516873F0Ebbfc2B984B0503843DA8Ef2970d159;
    address reputationBondAddr = 0x4c0855D23c65D6c41d87bdB3b18ec38e4F665d6E;
    address escrowPaymentAddr = 0x2aB75d86DBdB3825069894CfCc5e7038EE243efC;

    address agent = 0x52589a0AF0Bc0809350C7096c186c327Aac2DF95;
    address mnee = 0x365C84B65b167073AFaC060Aa463204023c4d118;

    function run() external view {
        EscrowPaymentUpgradeable escrow = EscrowPaymentUpgradeable(
            escrowPaymentAddr
        );
        AgentRegistry registry = AgentRegistry(agentRegistryAddr);
        ReputationBond bond = ReputationBond(reputationBondAddr);
        IERC20 token = IERC20(mnee);

        console.log("--- PROTOCOL LINKS ---");
        console.log("Escrow -> Registry:", address(escrow.REGISTRY()));
        console.log("Escrow -> Bond:", address(escrow.BOND()));
        console.log("Registry -> Authorized Escrow:", registry.escrowPayment());

        console.log("--- AGENT ENTITY ---");
        bool isActive = registry.isAgentActive(agent);
        address owner = registry.agentToUser(agent);
        console.log("Is Agent Active in Registry?", isActive ? "YES" : "NO");
        console.log("Agent Owner (User):", owner);

        console.log("--- CHARTER LIMITS ---");
        (
            uint256 perTx,
            uint256 monthly,
            uint256 daily,
            uint256 spentMonthly,
            uint256 spentDaily,
            ,
            ,

        ) = registry.agentCharters(agent);
        console.log("Limit Per Tx:", perTx);
        console.log("Daily Limit:", daily);
        console.log("Monthly Limit:", monthly);
        console.log("Daily Spent:", spentDaily);
        console.log("Monthly Spent:", spentMonthly);

        console.log("--- BONDING STATUS ---");
        (uint256 reputation, uint256 stakedMnee, ) = bond.agentStats(agent);
        console.log("Reputation Score:", reputation);
        console.log("Staked MNEE:", stakedMnee);
        console.log(
            "Has Sufficient Bond?",
            bond.hasSufficientBond(agent) ? "YES" : "NO"
        );

        console.log("--- WALLET & ALLOWANCE (FOR OWNER) ---");
        console.log("Owner MNEE Balance:", token.balanceOf(owner));
        console.log(
            "Owner -> Escrow Allowance:",
            token.allowance(owner, escrowPaymentAddr)
        );

        console.log("--- ESCROW CONFIG ---");
        console.log(
            "MNEE Supported in Escrow?",
            escrow.supportedTokens(mnee) ? "YES" : "NO"
        );
    }
}
