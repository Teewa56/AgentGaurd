// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @dev Manages AI Agent identities and their authorization charters.
 */
contract AgentRegistry is Ownable {
    struct Charter {
        uint256 spendingLimitPerTx;
        uint256 monthlySpendingLimit;
        uint256 dailySpendingLimit;
        uint256 currentMonthlySpent;
        uint256 currentDailySpent;
        uint256 lastDailyReset;
        uint256 lastMonthlyReset;
        bool isActive;
    }

    // Mapping from agent address to their charter
    mapping(address => Charter) public agentCharters;
    // Mapping from agent address to user (owner) address
    mapping(address => address) public agentToUser;

    address public escrowPayment;

    event AgentRegistered(address indexed agent, address indexed user);
    event CharterUpdated(address indexed agent);

    constructor() Ownable(msg.sender) {}

    function setEscrowPayment(address _escrow) external onlyOwner {
        escrowPayment = _escrow;
    }

    modifier onlyEscrowPayment() {
        require(msg.sender == escrowPayment, "Only EscrowPayment can call");
        _;
    }

    /**
     * @dev Registers a new agent with a specific charter.
     * @param agent The address of the AI agent.
     * @param _spendingLimitPerTx Maximum MNEE per transaction.
     * @param _monthlySpendingLimit Maximum MNEE per month.
     * @param _dailySpendingLimit Maximum MNEE per day.
     */
    function registerAgent(
        address agent,
        uint256 _spendingLimitPerTx,
        uint256 _monthlySpendingLimit,
        uint256 _dailySpendingLimit
    ) external {
        require(!agentCharters[agent].isActive, "Agent already registered");

        agentCharters[agent] = Charter({
            spendingLimitPerTx: _spendingLimitPerTx,
            monthlySpendingLimit: _monthlySpendingLimit,
            dailySpendingLimit: _dailySpendingLimit,
            currentMonthlySpent: 0,
            currentDailySpent: 0,
            lastDailyReset: block.timestamp,
            lastMonthlyReset: block.timestamp,
            isActive: true
        });

        agentToUser[agent] = msg.sender;
        emit AgentRegistered(agent, msg.sender);
    }

    /**
     * @dev Updates the charter for an agent. Can only be called by the agent's user.
     */
    function updateCharter(
        address agent,
        uint256 _spendingLimitPerTx,
        uint256 _monthlySpendingLimit,
        uint256 _dailySpendingLimit
    ) external {
        require(agentToUser[agent] == msg.sender, "Not the agent owner");

        Charter storage charter = agentCharters[agent];
        charter.spendingLimitPerTx = _spendingLimitPerTx;
        charter.monthlySpendingLimit = _monthlySpendingLimit;
        charter.dailySpendingLimit = _dailySpendingLimit;

        emit CharterUpdated(agent);
    }

    /**
     * @dev Checks if a transaction is within the agent's charter limits and updates spent amounts.
     * @notice This should be called by the EscrowPayment contract.
     */
    function authorizeAndRecordTransaction(
        address agent,
        uint256 amount
    ) external onlyEscrowPayment returns (bool) {
        Charter storage charter = agentCharters[agent];
        require(charter.isActive, "Agent not active");
        require(amount <= charter.spendingLimitPerTx, "Exceeds per-tx limit");

        _checkAndResetLimits(charter);

        require(
            charter.currentDailySpent + amount <= charter.dailySpendingLimit,
            "Exceeds daily limit"
        );
        require(
            charter.currentMonthlySpent + amount <=
                charter.monthlySpendingLimit,
            "Exceeds monthly limit"
        );

        charter.currentDailySpent += amount;
        charter.currentMonthlySpent += amount;

        return true;
    }

    function _checkAndResetLimits(Charter storage charter) internal {
        if (block.timestamp >= charter.lastDailyReset + 1 days) {
            charter.currentDailySpent = 0;
            charter.lastDailyReset = block.timestamp;
        }
        if (block.timestamp >= charter.lastMonthlyReset + 30 days) {
            charter.currentMonthlySpent = 0;
            charter.lastMonthlyReset = block.timestamp;
        }
    }

    function isAgentActive(address agent) external view returns (bool) {
        return agentCharters[agent].isActive;
    }
}
