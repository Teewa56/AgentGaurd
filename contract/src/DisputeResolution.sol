// SPDX-LICENSE-IDENTIFIER: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./EscrowPayment.sol";
import "./ReputationBond.sol";

/**
 * @title DisputeResolution
 * @dev Handles arbitration logic, AI resolution signatures, and DAO escalation.
 */
contract DisputeResolution is Ownable {
    EscrowPayment public immutable escrow;
    ReputationBond public immutable bond;

    // In a production app, this would be an Oracle or a multisig/DAO
    mapping(address => bool) public isArbitrator;

    event DisputeResolved(
        uint256 indexed txId,
        string resolution,
        uint256 refundAmount
    );
    event ArbitratorAdded(address indexed arbitrator);

    constructor(address _escrow, address _bond) Ownable(msg.sender) {
        escrow = EscrowPayment(_escrow);
        bond = ReputationBond(_bond);
    }

    modifier onlyArbitrator() {
        require(isArbitrator[msg.sender], "Not an arbitrator");
        _;
    }

    function addArbitrator(address arbitrator) external onlyOwner {
        isArbitrator[arbitrator] = true;
        emit ArbitratorAdded(arbitrator);
    }

    /**
     * @dev Resolves a dispute.
     * @param txId Transaction ID from EscrowPayment.
     * @param refundPercent Percentage to refund to user (0-100).
     * @param slashAmount Amount to slash from agent's bond if it was a policy violation.
     */
    function resolveViaAi(
        uint256 txId,
        uint256 refundPercent,
        uint256 slashAmount,
        string calldata reasoning
    ) external onlyArbitrator {
        require(refundPercent <= 100, "Invalid percentage");

        (
            address agent,
            address user,
            ,
            uint256 amount,
            ,
            ,
            bool settled,

        ) = escrow.transactions(txId);
        require(!settled, "Transaction already settled");

        uint256 userAmount = (amount * refundPercent) / 100;
        uint256 merchantAmount = (amount - userAmount) + slashAmount;

        // Handle reputation and bond BEFORE settlement if slashing is involved
        if (refundPercent > 0) {
            // User got a refund, agent likely at fault
            int256 repPenalty = refundPercent == 100
                ? int256(-50)
                : int256(-20);
            bond.updateReputation(agent, repPenalty);

            if (slashAmount > 0) {
                bond.slashBond(agent, slashAmount, reasoning);
            }
        } else {
            // Merchant protected, agent did well (likely false dispute)
            bond.updateReputation(agent, 5); // +5 for surviving a false dispute
        }

        // Execute settlement in Escrow
        escrow.resolveDispute(txId, userAmount, merchantAmount);

        emit DisputeResolved(txId, reasoning, userAmount);
    }
}
