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
    IERC20 public immutable MNEE_TOKEN;
    AgentRegistry public immutable REGISTRY;

    // Configurable reputation constants
    uint256 public maxReputation = 1000;
    uint256 public defaultReputation = 500;

    struct AgentStats {
        uint256 reputation;
        uint256 stakedMnee;
        uint256 lastUpdateTimestamp;
    }

    mapping(address => AgentStats) public agentStats;

    address public escrowPayment;
    address public disputeResolution;

    event BondStaked(address indexed agent, uint256 amount);
    event ReputationUpdated(address indexed agent, uint256 newScore);
    event BondSlashed(address indexed agent, uint256 amount, string reason);
    event ConfigUpdated(uint256 maxRep, uint256 defaultRep);

    constructor(address _mneeToken, address _registry) Ownable(msg.sender) {
        MNEE_TOKEN = IERC20(_mneeToken);
        REGISTRY = AgentRegistry(_registry);
    }

    function setAuthorizedContracts(
        address _escrow,
        address _dispute
    ) external onlyOwner {
        escrowPayment = _escrow;
        disputeResolution = _dispute;
    }

    function setConfiguration(
        uint256 _maxRep,
        uint256 _defaultRep
    ) external onlyOwner {
        maxReputation = _maxRep;
        defaultReputation = _defaultRep;
        emit ConfigUpdated(_maxRep, _defaultRep);
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
        require(REGISTRY.isAgentActive(agent), "Agent not registered");
        require(
            MNEE_TOKEN.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        AgentStats storage stats = agentStats[agent];
        if (stats.reputation == 0 && stats.stakedMnee == 0) {
            stats.reputation = defaultReputation;
        }
        stats.stakedMnee += amount;

        emit BondStaked(agent, amount);
    }

    /**
     * @dev Calculates the required bond for an agent.
     * Formula: (Monthly Limit / 2) * (max - Rep) / max
     */
    function getRequiredBond(address agent) public view returns (uint256) {
        (, uint256 monthlyLimit, , , , , , bool active) = REGISTRY
            .agentCharters(agent);
        require(active, "Agent not active");

        uint256 rep = agentStats[agent].reputation;
        if (rep == 0) rep = defaultReputation;

        return ((monthlyLimit * (maxReputation - rep)) / 2) / maxReputation;
    }

    /**
     * @dev Checks if an agent has sufficient bond.
     */
    function hasSufficientBond(address agent) external view returns (bool) {
        return agentStats[agent].stakedMnee >= getRequiredBond(agent);
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

        if (newRep > int256(maxReputation)) {
            stats.reputation = maxReputation;
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
            agentStats[agent].stakedMnee >= amount,
            "Insufficient stake to slash"
        );

        agentStats[agent].stakedMnee -= amount;

        // Transfer slashed amount to Escrow or InsurancePool
        // Here we send it to Escrow so it can be part of the dispute settlement
        require(
            MNEE_TOKEN.transfer(escrowPayment, amount),
            "Slash transfer failed"
        );

        emit BondSlashed(agent, amount, reason);
    }

    /**
     * @dev Withdraw excess bond.
     */
    function withdrawExcess(address agent, uint256 amount) external {
        require(REGISTRY.agentToUser(agent) == msg.sender, "Not agent owner");
        uint256 required = getRequiredBond(agent);
        require(
            agentStats[agent].stakedMnee - amount >= required,
            "Cannot withdraw below required bond"
        );

        agentStats[agent].stakedMnee -= amount;
        require(MNEE_TOKEN.transfer(msg.sender, amount), "Transfer failed"); // Already fixed by user, ensuring standard
    }
}
