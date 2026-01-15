// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title APIPaymentRegistry
 * @notice Registry for API payment authorizations and verification
 * @dev Supports all three HTTP 402 use cases:
 *      1. AgentGuard premium endpoints
 *      2. Third-party API payments
 *      3. Merchant API protection
 */
contract APIPaymentRegistry is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    struct APIProvider {
        address providerAddress;
        string apiEndpoint;
        uint256 pricePerRequest; // in wei
        bool isActive;
        uint256 totalRequests;
        uint256 totalRevenue;
    }
    
    struct PaymentCredential {
        address payer;
        address provider;
        uint256 creditsRemaining;
        uint256 expiresAt;
        bool isActive;
    }
    
    struct APICall {
        address caller;
        address provider;
        string endpoint;
        uint256 amount;
        uint256 timestamp;
        bool wasSuccessful;
        bool wasRefunded;
    }
    
    // Provider registry
    mapping(address => APIProvider) public providers;
    mapping(string => address) public endpointToProvider;
    
    // Payment credentials
    mapping(bytes32 => PaymentCredential) public credentials;
    
    // API call history
    mapping(address => APICall[]) public callHistory;
    
    // Events
    event ProviderRegistered(address indexed provider, string endpoint, uint256 price);
    event ProviderUpdated(address indexed provider, uint256 newPrice, bool isActive);
    event CredentialIssued(bytes32 indexed credentialId, address indexed payer, address indexed provider, uint256 credits);
    event CredentialUsed(bytes32 indexed credentialId, uint256 creditsUsed, uint256 remaining);
    event APICallRecorded(address indexed caller, address indexed provider, string endpoint, uint256 amount);
    event RefundIssued(address indexed caller, address indexed provider, uint256 amount);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @notice Register a new API provider
     * @param endpoint The API endpoint (e.g., "/api/weather")
     * @param pricePerRequest Price in wei per API request
     */
    function registerProvider(
        string memory endpoint,
        uint256 pricePerRequest
    ) external {
        require(endpointToProvider[endpoint] == address(0), "Endpoint already registered");
        require(pricePerRequest > 0, "Price must be greater than 0");
        
        providers[msg.sender] = APIProvider({
            providerAddress: msg.sender,
            apiEndpoint: endpoint,
            pricePerRequest: pricePerRequest,
            isActive: true,
            totalRequests: 0,
            totalRevenue: 0
        });
        
        endpointToProvider[endpoint] = msg.sender;
        
        emit ProviderRegistered(msg.sender, endpoint, pricePerRequest);
    }
    
    /**
     * @notice Update provider settings
     * @param newPrice New price per request
     * @param isActive Whether the provider is active
     */
    function updateProvider(uint256 newPrice, bool isActive) external {
        require(providers[msg.sender].providerAddress != address(0), "Provider not registered");
        
        providers[msg.sender].pricePerRequest = newPrice;
        providers[msg.sender].isActive = isActive;
        
        emit ProviderUpdated(msg.sender, newPrice, isActive);
    }
    
    /**
     * @notice Issue payment credential for pre-paid API access
     * @param provider The API provider address
     * @param credits Number of API calls to credit
     * @param duration Validity duration in seconds
     */
    function issueCredential(
        address provider,
        uint256 credits,
        uint256 duration
    ) external payable returns (bytes32) {
        require(providers[provider].isActive, "Provider not active");
        
        uint256 totalCost = providers[provider].pricePerRequest * credits;
        require(msg.value >= totalCost, "Insufficient payment");
        
        bytes32 credentialId = keccak256(
            abi.encodePacked(msg.sender, provider, block.timestamp, credits)
        );
        
        credentials[credentialId] = PaymentCredential({
            payer: msg.sender,
            provider: provider,
            creditsRemaining: credits,
            expiresAt: block.timestamp + duration,
            isActive: true
        });
        
        // Transfer payment to provider
        payable(provider).transfer(totalCost);
        
        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit CredentialIssued(credentialId, msg.sender, provider, credits);
        
        return credentialId;
    }
    
    /**
     * @notice Verify and consume a payment credential
     * @param credentialId The credential to verify
     * @return bool Whether the credential is valid and was consumed
     */
    function verifyAndConsumeCredential(bytes32 credentialId) external returns (bool) {
        PaymentCredential storage cred = credentials[credentialId];
        
        require(cred.isActive, "Credential not active");
        require(cred.creditsRemaining > 0, "No credits remaining");
        require(block.timestamp < cred.expiresAt, "Credential expired");
        require(msg.sender == cred.provider, "Only provider can consume");
        
        cred.creditsRemaining--;
        
        providers[cred.provider].totalRequests++;
        
        emit CredentialUsed(credentialId, 1, cred.creditsRemaining);
        
        return true;
    }
    
    /**
     * @notice Record an API call (for analytics and dispute resolution)
     * @param caller The address making the API call
     * @param endpoint The endpoint being called
     * @param wasSuccessful Whether the call succeeded
     */
    function recordAPICall(
        address caller,
        string memory endpoint,
        bool wasSuccessful
    ) external {
        require(providers[msg.sender].isActive, "Provider not active");
        
        APICall memory call = APICall({
            caller: caller,
            provider: msg.sender,
            endpoint: endpoint,
            amount: providers[msg.sender].pricePerRequest,
            timestamp: block.timestamp,
            wasSuccessful: wasSuccessful,
            wasRefunded: false
        });
        
        callHistory[caller].push(call);
        
        if (wasSuccessful) {
            providers[msg.sender].totalRevenue += providers[msg.sender].pricePerRequest;
        }
        
        emit APICallRecorded(caller, msg.sender, endpoint, providers[msg.sender].pricePerRequest);
    }
    
    /**
     * @notice Issue refund for failed API call
     * @param caller The caller to refund
     * @param callIndex Index of the call in history
     */
    function issueRefund(address caller, uint256 callIndex) external payable {
        require(providers[msg.sender].isActive, "Provider not active");
        require(callIndex < callHistory[caller].length, "Invalid call index");
        
        APICall storage call = callHistory[caller][callIndex];
        require(call.provider == msg.sender, "Not your call");
        require(!call.wasSuccessful, "Call was successful");
        require(!call.wasRefunded, "Already refunded");
        require(msg.value >= call.amount, "Insufficient refund amount");
        
        call.wasRefunded = true;
        payable(caller).transfer(call.amount);
        
        // Refund excess
        if (msg.value > call.amount) {
            payable(msg.sender).transfer(msg.value - call.amount);
        }
        
        emit RefundIssued(caller, msg.sender, call.amount);
    }
    
    /**
     * @notice Get provider information
     * @param provider The provider address
     */
    function getProvider(address provider) external view returns (APIProvider memory) {
        return providers[provider];
    }
    
    /**
     * @notice Get credential information
     * @param credentialId The credential ID
     */
    function getCredential(bytes32 credentialId) external view returns (PaymentCredential memory) {
        return credentials[credentialId];
    }
    
    /**
     * @notice Get call history for an address
     * @param caller The caller address
     */
    function getCallHistory(address caller) external view returns (APICall[] memory) {
        return callHistory[caller];
    }
    
    /**
     * @notice Check if a credential is valid
     * @param credentialId The credential to check
     */
    function isCredentialValid(bytes32 credentialId) external view returns (bool) {
        PaymentCredential memory cred = credentials[credentialId];
        return cred.isActive && 
               cred.creditsRemaining > 0 && 
               block.timestamp < cred.expiresAt;
    }
}
