// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentRegistry.sol";
import "./ReputationBond.sol";

/**
 * @title EscrowPayment
 * @dev Manages payment locking, escrow periods, and transaction metadata.
 */
contract EscrowPayment is Ownable {
    IERC20 public immutable MNEE_TOKEN;
    AgentRegistry public immutable REGISTRY;
    ReputationBond public immutable BOND;
    address public insurancePool;
    address public disputeResolution;

    uint256 public constant DISPUTE_WINDOW = 24 hours;

    // Configurable state variables instead of constants
    uint256 public serviceFeeBps = 50; // 0.5% default
    int256 public reputationRewardSuccess = 2;

    struct Transaction {
        address agent;
        address user;
        address merchant;
        uint256 amount;
        uint256 lockEndTimestamp;
        bool isDisputed;
        bool isSettled;
        string metadataURI; // IPFS link to evidence
    }

    uint256 public nextTransactionId;
    mapping(uint256 => Transaction) public transactions;

    event TransactionCreated(
        uint256 indexed id,
        address agent,
        address merchant,
        uint256 amount
    );
    event TransactionSettled(uint256 indexed id, bool completed);
    event TransactionDisputed(uint256 indexed id);
    event ConfigUpdated(uint256 feeBps, int256 repReward);
    event FundsRescued(address token, uint256 amount);

    constructor(
        address _mneeToken,
        address _registry,
        address _bond
    ) Ownable(msg.sender) {
        MNEE_TOKEN = IERC20(_mneeToken);
        REGISTRY = AgentRegistry(_registry);
        BOND = ReputationBond(_bond);
    }

    function setAuthorizedContracts(
        address _pool,
        address _dispute
    ) external onlyOwner {
        insurancePool = _pool;
        disputeResolution = _dispute;
    }

    function setConfiguration(
        uint256 _feeBps,
        int256 _repReward
    ) external onlyOwner {
        serviceFeeBps = _feeBps;
        reputationRewardSuccess = _repReward;
        emit ConfigUpdated(_feeBps, _repReward);
    }

    // Emergency function to rescue tokens stuck in the contract
    function emergencyWithdraw(
        address _token,
        uint256 _amount
    ) external onlyOwner {
        IERC20(_token).transfer(msg.sender, _amount);
        emit FundsRescued(_token, _amount);
    }

    modifier onlyDisputeResolution() {
        require(
            msg.sender == disputeResolution,
            "Only DisputeResolution can call"
        );
        _;
    }

    /**
     * @dev Initiates a new transaction. Called by the agent.
     */
    function initiateTransaction(
        address merchant,
        uint256 amount,
        string calldata metadataURI
    ) external returns (uint256) {
        address agent = msg.sender;
        require(REGISTRY.isAgentActive(agent), "Agent not active");
        require(BOND.hasSufficientBond(agent), "Insufficient reputation bond");

        // Check charter and record spending
        require(
            REGISTRY.authorizeAndRecordTransaction(agent, amount),
            "Charter violation"
        );

        address user = REGISTRY.agentToUser(agent);

        // Fee-on-transfer support: Measure actual received amount
        uint256 balanceBefore = MNEE_TOKEN.balanceOf(address(this));
        require(
            MNEE_TOKEN.transferFrom(user, address(this), amount),
            "Transfer failed"
        );
        uint256 receivedAmount = MNEE_TOKEN.balanceOf(address(this)) -
            balanceBefore;

        uint256 txId = nextTransactionId++;
        transactions[txId] = Transaction({
            agent: agent,
            user: user,
            merchant: merchant,
            amount: receivedAmount, // Tracking actual received amount
            lockEndTimestamp: block.timestamp + DISPUTE_WINDOW,
            isDisputed: false,
            isSettled: false,
            metadataURI: metadataURI
        });

        emit TransactionCreated(txId, agent, merchant, receivedAmount);
        return txId;
    }

    /**
     * @dev Settles a transaction after the dispute window.
     */
    function settleTransaction(uint256 txId) external {
        Transaction storage txn = transactions[txId];
        require(!txn.isSettled, "Already settled");
        require(!txn.isDisputed, "Transaction in dispute");
        require(
            block.timestamp >= txn.lockEndTimestamp,
            "Escrow window still open"
        );

        txn.isSettled = true;

        // Calculate fees
        uint256 fee = (txn.amount * serviceFeeBps) / 10000;
        uint256 merchantAmount = txn.amount - fee;

        // Release funds
        require(
            MNEE_TOKEN.transfer(txn.merchant, merchantAmount),
            "Merchant payment failed"
        );

        // Send fee to InsurancePool
        if (insurancePool != address(0)) {
            require(MNEE_TOKEN.approve(insurancePool, fee), "Approve failed");
            // Strict check: if fee transfer fails, revert the whole settlement
            (bool success, ) = insurancePool.call(
                abi.encodeWithSignature("receiveFees(uint256)", fee)
            );
            require(success, "Fee transfer to pool failed");
        }

        // Increase reputation
        BOND.updateReputation(txn.agent, reputationRewardSuccess);

        emit TransactionSettled(txId, true);
    }

    /**
     * @dev User files a dispute within the window.
     */
    function disputeTransaction(uint256 txId) external {
        Transaction storage txn = transactions[txId];
        require(msg.sender == txn.user, "Only user can dispute");
        require(
            block.timestamp <= txn.lockEndTimestamp,
            "Dispute window closed"
        );
        require(!txn.isSettled, "Already settled");

        txn.isDisputed = true;
        emit TransactionDisputed(txId);

        // This would then trigger DisputeResolution logic
    }

    /**
     * @dev Final resolution of a dispute (called by DisputeResolution contract).
     */
    function resolveDispute(
        uint256 txId,
        uint256 userAmount,
        uint256 merchantAmount
    ) external onlyDisputeResolution {
        Transaction storage txn = transactions[txId];
        require(txn.isDisputed, "Not in dispute");
        require(!txn.isSettled, "Already settled");

        txn.isSettled = true;

        if (userAmount > 0) {
            require(
                MNEE_TOKEN.transfer(txn.user, userAmount),
                "User refund failed"
            );
        }
        if (merchantAmount > 0) {
            require(
                MNEE_TOKEN.transfer(txn.merchant, merchantAmount),
                "Merchant payment failed"
            );
        }

        emit TransactionSettled(txId, false);
    }
}
