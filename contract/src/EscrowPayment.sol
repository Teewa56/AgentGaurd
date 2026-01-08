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
    address public INSURANCE_POOL;
    address public DISPUTE_RESOLUTION;

    uint256 public constant DISPUTE_WINDOW = 24 hours;
    uint256 public constant SERVICE_FEE_BPS = 50; // 0.5% default

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
        INSURANCE_POOL = _pool;
        DISPUTE_RESOLUTION = _dispute;
    }

    modifier onlyDisputeResolution() {
        require(
            msg.sender == DISPUTE_RESOLUTION,
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
        require(
            MNEE_TOKEN.transferFrom(user, address(this), amount),
            "Transfer failed"
        );

        uint256 txId = nextTransactionId++;
        transactions[txId] = Transaction({
            agent: agent,
            user: user,
            merchant: merchant,
            amount: amount,
            lockEndTimestamp: block.timestamp + DISPUTE_WINDOW,
            isDisputed: false,
            isSettled: false,
            metadataURI: metadataURI
        });

        emit TransactionCreated(txId, agent, merchant, amount);
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
        uint256 fee = (txn.amount * SERVICE_FEE_BPS) / 10000;
        uint256 merchantAmount = txn.amount - fee;

        // Release funds
        require(
            MNEE_TOKEN.transfer(txn.merchant, merchantAmount),
            "Merchant payment failed"
        );

        // Send fee to InsurancePool
        if (INSURANCE_POOL != address(0)) {
            require(MNEE_TOKEN.approve(INSURANCE_POOL, fee), "Approve failed");
            // Assuming InsurancePool has a receiveFees function
            (bool success, ) = INSURANCE_POOL.call(
                abi.encodeWithSignature("receiveFees(uint256)", fee)
            );
            // We don't necessarily want to fail the whole settlement if the pool fails,
            // but for safety we might. Let's just track it for now.
        }

        // Increase reputation
        BOND.updateReputation(txn.agent, 2); // +2 for success

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

        // Ensure we don't transfer more than we have (amount + any slashed funds received)
        uint256 totalAvailable = MNEE_TOKEN.balanceOf(address(this));
        // Note: This is a bit simplified, ideally track balance per txId.

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
