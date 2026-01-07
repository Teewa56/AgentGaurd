// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentRegistry.sol";

/**
 * @title ReputationBond
 * @dev Manages agent bonds (staked MNEE) and reputation scores.
 */
contract ReputationBond is Ownable {
    IERC20 public immutable mneeToken;
    AgentRegistry public immutable registry;

    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant DEFAULT_REPUTATION = 500;

    struct AgentStats {
        uint256 reputation;
        uint256 stakedMNEE;
        uint256 lastUpdateTimestamp;
    }

    mapping(address => AgentStats) public agentStats;

    address public escrowPayment;
    address public disputeResolution;

    event BondStaked(address indexed agent, uint256 amount);
    event ReputationUpdated(address indexed agent, uint256 newScore);
    event BondSlashed(address indexed agent, uint256 amount, string reason);

    constructor(address _mneeToken, address _registry) Ownable(msg.sender) {
        mneeToken = IERC20(_mneeToken);
        registry = AgentRegistry(_registry);
    }

    function setAuthorizedContracts(
        address _escrow,
        address _dispute
    ) external onlyOwner {
        escrowPayment = _escrow;
        disputeResolution = _dispute;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == escrowPayment ||
                msg.sender == disputeResolution ||
                msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    /**
     * @dev Staking MNEE to meet bond requirements.
     */
    function stakeBond(address agent, uint256 amount) external {
        require(registry.isAgentActive(agent), "Agent not registered");
        mneeToken.transferFrom(msg.sender, address(this), amount);

        AgentStats storage stats = agentStats[agent];
        if (stats.reputation == 0 && stats.stakedMNEE == 0) {
            stats.reputation = DEFAULT_REPUTATION;
        }
        stats.stakedMNEE += amount;

        emit BondStaked(agent, amount);
    }

    /**
     * @dev Calculates the required bond for an agent.
     * Formula: (Monthly Limit / 2) * (1000 - Rep) / 1000
     */
    function getRequiredBond(address agent) public view returns (uint256) {
        (, uint256 monthlyLimit, , , , , , bool active) = registry
            .agentCharters(agent);
        require(active, "Agent not active");

        uint256 rep = agentStats[agent].reputation;
        if (rep == 0) rep = DEFAULT_REPUTATION;

        return ((monthlyLimit / 2) * (MAX_REPUTATION - rep)) / MAX_REPUTATION;
    }

    /**
     * @dev Checks if an agent has sufficient bond.
     */
    function hasSufficientBond(address agent) external view returns (bool) {
        return agentStats[agent].stakedMNEE >= getRequiredBond(agent);
    }

    /**
     * @dev Updates reputation. In a real system, this would be restricted to
     * trusted contracts (Escrow/DisputeResolution).
     */
    function updateReputation(
        address agent,
        int256 delta
    ) external onlyAuthorized {
        AgentStats storage stats = agentStats[agent];
        int256 newRep = int256(stats.reputation) + delta;

        if (newRep > int256(MAX_REPUTATION)) {
            stats.reputation = MAX_REPUTATION;
        } else if (newRep < 0) {
            stats.reputation = 0;
        } else {
            stats.reputation = uint256(newRep);
        }

        emit ReputationUpdated(agent, stats.reputation);
    }

    /**
     * @dev Slashes bond for dispute payouts.
     */
    function slashBond(
        address agent,
        uint256 amount,
        string calldata reason
    ) external {
        require(
            msg.sender == disputeResolution,
            "Only DisputeResolution can slash"
        );
        require(
            agentStats[agent].stakedMNEE >= amount,
            "Insufficient stake to slash"
        );

        agentStats[agent].stakedMNEE -= amount;

        // Transfer slashed amount to Escrow or InsurancePool
        // Here we send it to Escrow so it can be part of the dispute settlement
        require(
            mneeToken.transfer(escrowPayment, amount),
            "Slash transfer failed"
        );

        emit BondSlashed(agent, amount, reason);
    }

    /**
     * @dev Withdraw excess bond.
     */
    function withdrawExcess(address agent, uint256 amount) external {
        require(registry.agentToUser(agent) == msg.sender, "Not agent owner");
        uint256 required = getRequiredBond(agent);
        require(
            agentStats[agent].stakedMNEE - amount >= required,
            "Cannot withdraw below required bond"
        );

        agentStats[agent].stakedMNEE -= amount;
        mneeToken.transfer(msg.sender, amount);
    }
}
