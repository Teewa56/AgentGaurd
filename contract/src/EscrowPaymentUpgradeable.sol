// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./AgentRegistry.sol";
import "./ReputationBond.sol";

/**
 * @title EscrowPaymentUpgradeable
 * @dev Upgradeable version of EscrowPayment with API payment support
 * @notice Manages payment locking, escrow periods, and transaction metadata
 *         Supports both standard transactions and API payments
 */
contract EscrowPaymentUpgradeable is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    mapping(address => bool) public supportedTokens;
    AgentRegistry public REGISTRY;
    ReputationBond public BOND;
    address public insurancePool;
    address public disputeResolution;

    uint256 public constant DISPUTE_WINDOW = 24 hours;
    uint256 public constant API_DISPUTE_WINDOW = 1 hours; // Shorter window for API payments

    // Configurable state variables
    uint256 public serviceFeeBps; // 0.5% default (50 basis points)
    int256 public reputationRewardSuccess;

    enum TransactionType {
        STANDARD, // Regular goods/services
        API_PAYMENT // API access payment
    }

    struct Transaction {
        address agent;
        address user;
        address merchant;
        address token;
        uint256 amount;
        uint256 lockEndTimestamp;
        bool isDisputed;
        bool isSettled;
        string metadataURI; // IPFS link to evidence
        TransactionType txType;
        bool autoReleaseOnSuccess; // For API payments
    }

    uint256 public nextTransactionId;
    mapping(uint256 => Transaction) public transactions;

    // Batch payment support for high-frequency API calls
    struct BatchPayment {
        address agent;
        address provider;
        address token;
        uint256 totalAmount;
        uint256 callCount;
        uint256 createdAt;
        bool isSettled;
    }

    mapping(uint256 => BatchPayment) public batchPayments;
    uint256 public nextBatchId;

    event TransactionCreated(
        uint256 indexed id,
        address agent,
        address merchant,
        address token,
        uint256 amount,
        TransactionType txType
    );
    event TransactionSettled(uint256 indexed id, bool completed);
    event TransactionDisputed(uint256 indexed id);
    event TokenSupported(address indexed token, bool supported);
    event ConfigUpdated(uint256 feeBps, int256 repReward);
    event FundsRescued(address token, uint256 amount);
    event APIPaymentInitiated(
        uint256 indexed id,
        address indexed agent,
        address indexed provider,
        uint256 amount
    );
    event APIPaymentAutoReleased(uint256 indexed id, bool successful);
    event BatchPaymentCreated(
        uint256 indexed batchId,
        address indexed agent,
        address indexed provider,
        uint256 amount
    );
    event BatchPaymentSettled(uint256 indexed batchId, uint256 callCount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _mneeToken,
        address _registry,
        address _bond
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        supportedTokens[_mneeToken] = true;
        REGISTRY = AgentRegistry(_registry);
        BOND = ReputationBond(_bond);
        serviceFeeBps = 50; // 0.5%
        reputationRewardSuccess = 2;

        emit TokenSupported(_mneeToken, true);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    function setTokenSupport(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
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

    function emergencyWithdraw(
        address _token,
        uint256 _amount
    ) external onlyOwner {
        IERC20Upgradeable(_token).transfer(msg.sender, _amount);
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
     * @dev Initiates a new standard transaction. Called by the agent.
     */
    function initiateTransaction(
        address merchant,
        address token,
        uint256 amount,
        string calldata metadataURI
    ) external returns (uint256) {
        return
            _initiateTransaction(
                merchant,
                token,
                amount,
                metadataURI,
                TransactionType.STANDARD,
                false
            );
    }

    /**
     * @dev Initiates an API payment transaction with shorter escrow period
     * @param provider The API provider address
     * @param token Payment token
     * @param amount Payment amount
     * @param metadataURI Metadata about the API call
     */
    function initiateAPIPayment(
        address provider,
        address token,
        uint256 amount,
        string calldata metadataURI
    ) external returns (uint256) {
        uint256 txId = _initiateTransaction(
            provider,
            token,
            amount,
            metadataURI,
            TransactionType.API_PAYMENT,
            true // Auto-release on success
        );

        emit APIPaymentInitiated(txId, msg.sender, provider, amount);
        return txId;
    }

    /**
     * @dev Internal function to initiate transactions
     */
    function _initiateTransaction(
        address merchant,
        address token,
        uint256 amount,
        string calldata metadataURI,
        TransactionType txType,
        bool autoRelease
    ) internal returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        address agent = msg.sender;
        require(REGISTRY.isAgentActive(agent), "Agent not active");
        require(BOND.hasSufficientBond(agent), "Insufficient reputation bond");

        // Check charter and record spending
        require(
            REGISTRY.authorizeAndRecordTransaction(agent, amount),
            "Charter violation"
        );

        address user = REGISTRY.agentToUser(agent);
        IERC20Upgradeable tokenContract = IERC20Upgradeable(token);

        // Fee-on-transfer support: Measure actual received amount
        uint256 balanceBefore = tokenContract.balanceOf(address(this));
        require(
            tokenContract.transferFrom(user, address(this), amount),
            "Transfer failed"
        );
        uint256 receivedAmount = tokenContract.balanceOf(address(this)) -
            balanceBefore;

        // Determine dispute window based on transaction type
        uint256 disputeWindow = txType == TransactionType.API_PAYMENT
            ? API_DISPUTE_WINDOW
            : DISPUTE_WINDOW;

        uint256 txId = nextTransactionId++;
        transactions[txId] = Transaction({
            agent: agent,
            user: user,
            merchant: merchant,
            token: token,
            amount: receivedAmount,
            lockEndTimestamp: block.timestamp + disputeWindow,
            isDisputed: false,
            isSettled: false,
            metadataURI: metadataURI,
            txType: txType,
            autoReleaseOnSuccess: autoRelease
        });

        emit TransactionCreated(
            txId,
            agent,
            merchant,
            token,
            receivedAmount,
            txType
        );
        return txId;
    }

    /**
     * @dev Auto-release API payment on successful API response
     * @param txId Transaction ID
     * @param wasSuccessful Whether the API call succeeded
     */
    function confirmAPIResponse(uint256 txId, bool wasSuccessful) external {
        Transaction storage txn = transactions[txId];
        require(
            txn.txType == TransactionType.API_PAYMENT,
            "Not an API payment"
        );
        require(msg.sender == txn.merchant, "Only provider can confirm");
        require(!txn.isSettled, "Already settled");
        require(txn.autoReleaseOnSuccess, "Auto-release not enabled");

        if (wasSuccessful) {
            // Immediately release payment
            _settleTransaction(txId);
            emit APIPaymentAutoReleased(txId, true);
        } else {
            // Mark for refund
            txn.isDisputed = true;
            emit APIPaymentAutoReleased(txId, false);
        }
    }

    /**
     * @dev Create a batch payment for multiple API calls
     * @param provider API provider
     * @param token Payment token
     * @param callCount Number of API calls to pre-pay
     * @param pricePerCall Price per API call
     */
    function createBatchPayment(
        address provider,
        address token,
        uint256 callCount,
        uint256 pricePerCall
    ) external returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        address agent = msg.sender;
        require(REGISTRY.isAgentActive(agent), "Agent not active");

        uint256 totalAmount = callCount * pricePerCall;
        address user = REGISTRY.agentToUser(agent);
        IERC20Upgradeable tokenContract = IERC20Upgradeable(token);

        require(
            tokenContract.transferFrom(user, address(this), totalAmount),
            "Transfer failed"
        );

        uint256 batchId = nextBatchId++;
        batchPayments[batchId] = BatchPayment({
            agent: agent,
            provider: provider,
            token: token,
            totalAmount: totalAmount,
            callCount: callCount,
            createdAt: block.timestamp,
            isSettled: false
        });

        emit BatchPaymentCreated(batchId, agent, provider, totalAmount);
        return batchId;
    }

    /**
     * @dev Settle batch payment
     * @param batchId Batch payment ID
     * @param actualCallCount Actual number of calls made
     */
    function settleBatchPayment(
        uint256 batchId,
        uint256 actualCallCount
    ) external {
        BatchPayment storage batch = batchPayments[batchId];
        require(msg.sender == batch.provider, "Only provider can settle");
        require(!batch.isSettled, "Already settled");
        require(actualCallCount <= batch.callCount, "Exceeds pre-paid calls");

        batch.isSettled = true;
        IERC20Upgradeable tokenContract = IERC20Upgradeable(batch.token);

        uint256 pricePerCall = batch.totalAmount / batch.callCount;
        uint256 providerAmount = actualCallCount * pricePerCall;
        uint256 refundAmount = batch.totalAmount - providerAmount;

        // Pay provider
        if (providerAmount > 0) {
            require(
                tokenContract.transfer(batch.provider, providerAmount),
                "Provider payment failed"
            );
        }

        // Refund unused credits
        if (refundAmount > 0) {
            address user = REGISTRY.agentToUser(batch.agent);
            require(
                tokenContract.transfer(user, refundAmount),
                "Refund failed"
            );
        }

        emit BatchPaymentSettled(batchId, actualCallCount);
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

        _settleTransaction(txId);
    }

    /**
     * @dev Internal settlement logic
     */
    function _settleTransaction(uint256 txId) internal {
        Transaction storage txn = transactions[txId];
        txn.isSettled = true;
        IERC20Upgradeable tokenContract = IERC20Upgradeable(txn.token);

        // Calculate fees
        uint256 fee = (txn.amount * serviceFeeBps) / 10000;
        uint256 merchantAmount = txn.amount - fee;

        // Release funds
        require(
            tokenContract.transfer(txn.merchant, merchantAmount),
            "Merchant payment failed"
        );

        // Send fee to InsurancePool
        if (insurancePool != address(0) && fee > 0) {
            require(
                tokenContract.approve(insurancePool, fee),
                "Approve failed"
            );
            (bool success, ) = insurancePool.call(
                abi.encodeWithSignature(
                    "receiveFees(address,uint256)",
                    txn.token,
                    fee
                )
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
        IERC20Upgradeable tokenContract = IERC20Upgradeable(txn.token);

        if (userAmount > 0) {
            require(
                tokenContract.transfer(txn.user, userAmount),
                "User refund failed"
            );
        }
        if (merchantAmount > 0) {
            require(
                tokenContract.transfer(txn.merchant, merchantAmount),
                "Merchant payment failed"
            );
        }

        emit TransactionSettled(txId, false);
    }

    /**
     * @dev Get transaction details
     */
    function getTransaction(
        uint256 txId
    ) external view returns (Transaction memory) {
        return transactions[txId];
    }

    /**
     * @dev Get batch payment details
     */
    function getBatchPayment(
        uint256 batchId
    ) external view returns (BatchPayment memory) {
        return batchPayments[batchId];
    }
}
