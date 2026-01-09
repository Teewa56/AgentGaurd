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
    EscrowPayment public immutable ESCROW;
    ReputationBond public immutable BOND;

    // Configurable state variables
    int256 public reputationPenaltyMax = -50;
    int256 public reputationPenaltyPartial = -20;
    int256 public reputationRewardFalseDispute = 5;

    // For later improvements, this would be an Oracle or a multisig/DAO
    mapping(address => bool) public isArbitrator;

    event DisputeResolved(
        uint256 indexed txId,
        string resolution,
        uint256 refundAmount
    );
    event ArbitratorAdded(address indexed arbitrator);
    event ConfigUpdated(
        int256 maxPenalty,
        int256 partialPenalty,
        int256 falseDisputeReward
    );

    constructor(address _escrow, address _bond) Ownable(msg.sender) {
        ESCROW = EscrowPayment(_escrow);
        BOND = ReputationBond(_bond);
    }

    function setConfiguration(
        int256 _reputationPenaltyMax,
        int256 _reputationPenaltyPartial,
        int256 _reputationRewardFalseDispute
    ) external onlyOwner {
        reputationPenaltyMax = _reputationPenaltyMax;
        reputationPenaltyPartial = _reputationPenaltyPartial;
        reputationRewardFalseDispute = _reputationRewardFalseDispute;
        emit ConfigUpdated(
            _reputationPenaltyMax,
            _reputationPenaltyPartial,
            _reputationRewardFalseDispute
        );
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
            , // user address extracted but unused in this local scope
            ,
            uint256 amount,
            ,
            ,
            bool settled,

        ) = ESCROW.transactions(txId);
        require(!settled, "Transaction already settled");

        uint256 userAmount = (amount * refundPercent) / 100;
        uint256 merchantAmount = (amount - userAmount) + slashAmount;

        // Handle reputation and bond BEFORE settlement if slashing is involved
        if (refundPercent > 0) {
            // User got a refund, agent likely at fault
            int256 repPenalty = refundPercent == 100
                ? reputationPenaltyMax
                : reputationPenaltyPartial;
            BOND.updateReputation(agent, repPenalty);

            if (slashAmount > 0) {
                BOND.slashBond(agent, slashAmount, reasoning);
            }
        } else {
            // Merchant protected, agent did well (likely false dispute)
            BOND.updateReputation(agent, reputationRewardFalseDispute);
        }

        // Execute settlement in Escrow
        ESCROW.resolveDispute(txId, userAmount, merchantAmount);

        emit DisputeResolved(txId, reasoning, userAmount);
    }
}
