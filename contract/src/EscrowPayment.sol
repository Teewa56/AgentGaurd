// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./AgentRegistry.sol";
import "./ReputationBond.sol";

/**
 * @title EscrowPayment
 * @dev Manages payment locking, escrow periods, and transaction metadata.
 * Compatible with Chainlink Automation for automatic settlements.
 */
contract EscrowPayment is Ownable, AggregatorV3Interface {
    mapping(address => bool) public supportedTokens;
    AgentRegistry public immutable REGISTRY;
    ReputationBond public immutable BOND;
    address public insurancePool;
    address public disputeResolution;

    uint256 public constant DISPUTE_WINDOW = 24 hours;

    // Configurable state variables instead of constants
    uint256 public serviceFeeBps = 50; // 0.5% default
    int256 public reputationRewardSuccess = 2;
    
    // Chainlink Automation state
    uint256 public lastAutomationCheck;
    uint256 public maxBatchSize = 20; // Max transactions per automation call

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
    }

    uint256 public nextTransactionId;
    mapping(uint256 => Transaction) public transactions;

    event TransactionCreated(
        uint256 indexed id,
        address agent,
        address merchant,
        address token,
        uint256 amount
    );
    event TransactionSettled(uint256 indexed id, bool completed);
    event TransactionDisputed(uint256 indexed id);
    event TokenSupported(address indexed token, bool supported);
    event ConfigUpdated(uint256 feeBps, int256 repReward);
    event FundsRescued(address token, uint256 amount);

    constructor(
        address _mneeToken,
        address _registry,
        address _bond
    ) Ownable(msg.sender) {
        supportedTokens[_mneeToken] = true;
        REGISTRY = AgentRegistry(_registry);
        BOND = ReputationBond(_bond);
        emit TokenSupported(_mneeToken, true);
    }

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
        address token,
        uint256 amount,
        string calldata metadataURI
    ) external returns (uint256) {
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
        IERC20 tokenContract = IERC20(token);

        // Fee-on-transfer support: Measure actual received amount
        uint256 balanceBefore = tokenContract.balanceOf(address(this));
        require(
            tokenContract.transferFrom(user, address(this), amount),
            "Transfer failed"
        );
        uint256 receivedAmount = tokenContract.balanceOf(address(this)) -
            balanceBefore;

        uint256 txId = nextTransactionId++;
        transactions[txId] = Transaction({
            agent: agent,
            user: user,
            merchant: merchant,
            token: token,
            amount: receivedAmount, // Tracking actual received amount
            lockEndTimestamp: block.timestamp + DISPUTE_WINDOW,
            isDisputed: false,
            isSettled: false,
            metadataURI: metadataURI
        });

        emit TransactionCreated(txId, agent, merchant, token, receivedAmount);
        return txId;
    }

    /**
     * @dev Settles a transaction after the dispute window.
     * Can be called by anyone after the escrow period ends (automatable by bots).
     */
    function settleTransaction(uint256 txId) external {
        Transaction storage txn = transactions[txId];
        require(!txn.isSettled, "Already settled");
        require(!txn.isDisputed, "Transaction in dispute");
        require(
            block.timestamp >= txn.lockEndTimestamp,
            "Escrow window still open"
        );

        _settleTransaction(txId, txn);
    }

    /**
     * @dev Internal settlement logic to avoid code duplication
     */
    function _settleTransaction(uint256 txId, Transaction storage txn) internal {
        txn.isSettled = true;
        IERC20 tokenContract = IERC20(txn.token);

        // Calculate fees
        uint256 fee = (txn.amount * serviceFeeBps) / 10000;
        uint256 merchantAmount = txn.amount - fee;

        // Release funds
        require(
            tokenContract.transfer(txn.merchant, merchantAmount),
            "Merchant payment failed"
        );

        // Send fee to InsurancePool
        if (insurancePool != address(0)) {
            require(
                tokenContract.approve(insurancePool, fee),
                "Approve failed"
            );
            // Strict check: if fee transfer fails, revert the whole settlement
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
     * @dev Chainlink Automation: check if there are transactions ready for settlement
     * Returns true if there are eligible transactions to be settled
     */
    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256[] memory settleableTxs = _getSettleableTransactions(lastAutomationCheck, nextTransactionId - 1);
        
        if (settleableTxs.length > 0) {
            upkeepNeeded = true;
            performData = abi.encode(settleableTxs);
        } else {
            upkeepNeeded = false;
            performData = "";
        }
    }

    /**
     * @dev Chainlink Automation: perform the settlement of eligible transactions
     * Called by Chainlink Automation Network when checkUpkeep returns true
     */
    function performUpkeep(bytes calldata performData) external override {
        require(msg.sender == tx.origin || tx.origin != address(0), "Only automation can call");
        
        uint256[] memory settleableTxs = abi.decode(performData, (uint256[]));
        require(settleableTxs.length > 0, "No transactions to settle");
        
        // Limit batch size to prevent gas issues
        uint256 batchSize = settleableTxs.length > maxBatchSize ? maxBatchSize : settleableTxs.length;
        
        for (uint256 i = 0; i < batchSize; i++) {
            uint256 txId = settleableTxs[i];
            Transaction storage txn = transactions[txId];
            
            // Double check conditions (in case state changed since checkUpkeep)
            if (!txn.isSettled && !txn.isDisputed && block.timestamp >= txn.lockEndTimestamp) {
                _settleTransaction(txId, txn);
            }
        }
        
        // Update the last automation check position
        if (batchSize > 0) {
            lastAutomationCheck = settleableTxs[batchSize - 1];
        }
    }

    /**
     * @dev Batch settle multiple eligible transactions.
     * Optimized for keepers/bots to automate settlements efficiently.
     */
    function batchSettleTransactions(uint256[] calldata txIds) external {
        require(txIds.length > 0, "Empty array");
        require(txIds.length <= 50, "Too many transactions"); // Gas limit protection

        for (uint256 i = 0; i < txIds.length; i++) {
            uint256 txId = txIds[i];
            Transaction storage txn = transactions[txId];
            
            // Skip if already settled, disputed, or still in escrow
            if (txn.isSettled || txn.isDisputed || block.timestamp < txn.lockEndTimestamp) {
                continue;
            }

            txn.isSettled = true;
            IERC20 tokenContract = IERC20(txn.token);

            // Calculate fees
            uint256 fee = (txn.amount * serviceFeeBps) / 10000;
            uint256 merchantAmount = txn.amount - fee;

            // Release funds
            require(
                tokenContract.transfer(txn.merchant, merchantAmount),
                "Merchant payment failed"
            );

            // Send fee to InsurancePool
            if (insurancePool != address(0)) {
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
    }

    /**
     * @dev Returns array of transaction IDs that are ready for settlement.
     * Useful for keepers/bots to find eligible transactions.
     */
    function getSettleableTransactions(uint256 startId, uint256 endId) external view returns (uint256[] memory) {
        return _getSettleableTransactions(startId, endId);
    }

    /**
     * @dev Internal function to get settleable transactions
     */
    function _getSettleableTransactions(uint256 startId, uint256 endId) internal view returns (uint256[] memory) {
        require(endId >= startId, "Invalid range");
        require(endId < nextTransactionId, "End ID out of bounds");
        
        // Estimate array size (worst case all are settleable)
        uint256 maxCount = endId - startId + 1;
        uint256[] memory tempIds = new uint256[](maxCount);
        uint256 count = 0;
        
        for (uint256 i = startId; i <= endId; i++) {
            Transaction storage txn = transactions[i];
            if (!txn.isSettled && !txn.isDisputed && block.timestamp >= txn.lockEndTimestamp) {
                tempIds[count] = i;
                count++;
            }
        }
        
        // Create properly sized array
        uint256[] memory settleableIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            settleableIds[i] = tempIds[i];
        }
        
        return settleableIds;
    }

    /**
     * @dev Set Chainlink Automation parameters
     */
    function setAutomationParameters(uint256 _maxBatchSize) external onlyOwner {
        require(_maxBatchSize > 0 && _maxBatchSize <= 50, "Invalid batch size");
        maxBatchSize = _maxBatchSize;
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
        IERC20 tokenContract = IERC20(txn.token);

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
}
