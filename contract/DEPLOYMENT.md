# AgentGuard Contract Deployment Guide

## Prerequisites

1. **Environment Setup**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   ```

2. **Required Environment Variables**
   ```env
   # Deployment
   PRIVATE_KEY=your_private_key_here
   RPC_URL=https://sepolia.base.org  # or mainnet
   ETHERSCAN_API_KEY=your_etherscan_api_key
   
   # Token Addresses
   MNEE_TOKEN_ADDRESS=0x...  # MNEE stablecoin address
   
   # Deployed Contract Addresses (filled after deployment)
   AGENT_REGISTRY_ADDRESS=
   REPUTATION_BOND_ADDRESS=
   ESCROW_PAYMENT_ADDRESS=
   INSURANCE_POOL_ADDRESS=
   DISPUTE_RESOLUTION_ADDRESS=
   API_PAYMENT_REGISTRY_ADDRESS=
   ```

## Deployment Steps

### 1. Deploy All Contracts with Proxies

```bash
# Base Sepolia (Testnet)
forge script script/DeployProxies.s.sol:DeployProxies \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv

# Base Mainnet (Production)
forge script script/DeployProxies.s.sol:DeployProxies \
  --rpc-url https://mainnet.base.org \
  --broadcast \
  --verify \
  -vvvv
```

### 2. Save Deployment Addresses

After deployment, addresses will be saved to `deployed-addresses.txt`. Copy these to your `.env` file:

```bash
# Automatically update .env
cat deployed-addresses.txt >> .env
```

### 3. Verify Deployment

```bash
# Check contract on Basescan
# Visit: https://sepolia.basescan.org/address/<CONTRACT_ADDRESS>

# Verify proxy implementation
cast implementation <PROXY_ADDRESS> --rpc-url $RPC_URL
```

## Upgrading Contracts

### When to Upgrade

Upgrade when you need to:
- Fix bugs in contract logic
- Add new features
- Optimize gas usage
- Update business logic

### How to Upgrade

```bash
# 1. Update contract code in src/
# 2. Run upgrade script
forge script script/UpgradeContracts.s.sol:UpgradeContracts \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### Upgrade Safety

✅ **Safe to Change:**
- Function logic
- Add new functions
- Add new state variables (at the end)
- Modify events

❌ **NOT Safe to Change:**
- Existing state variable order
- Existing state variable types
- Remove state variables
- Change inheritance order

## Testing Deployment

### 1. Test APIPaymentRegistry

```bash
# Register as API provider
cast send $API_PAYMENT_REGISTRY_ADDRESS \
  "registerProvider(string,uint256)" \
  "/api/test" \
  100000000000000000 \  # 0.1 ETH per request
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Issue payment credential
cast send $API_PAYMENT_REGISTRY_ADDRESS \
  "issueCredential(address,uint256,uint256)" \
  $PROVIDER_ADDRESS \
  10 \  # 10 credits
  86400 \  # 24 hours
  --value 1000000000000000000 \  # 1 ETH
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### 2. Test EscrowPayment

```bash
# Initiate API payment
cast send $ESCROW_PAYMENT_ADDRESS \
  "initiateAPIPayment(address,address,uint256,string)" \
  $PROVIDER_ADDRESS \
  $MNEE_TOKEN_ADDRESS \
  100000000000000000 \
  "ipfs://metadata" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

## Contract Addresses by Network

### Base Sepolia (Testnet)
```
MNEE Token: TBD
AgentRegistry: TBD
ReputationBond: TBD
EscrowPayment (Proxy): TBD
InsurancePool: TBD
DisputeResolution: TBD
APIPaymentRegistry (Proxy): TBD
```

### Base Mainnet (Production)
```
MNEE Token: TBD
AgentRegistry: TBD
ReputationBond: TBD
EscrowPayment (Proxy): TBD
InsurancePool: TBD
DisputeResolution: TBD
APIPaymentRegistry (Proxy): TBD
```

## Troubleshooting

### Issue: "Insufficient funds for gas"
**Solution:** Ensure deployer wallet has enough ETH for gas

### Issue: "Contract verification failed"
**Solution:** Wait a few minutes and try verifying manually:
```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/ContractName.sol:ContractName \
  --chain-id 84532 \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### Issue: "Proxy upgrade failed"
**Solution:** Ensure you're the owner of the proxy contract

## Security Checklist

Before mainnet deployment:

- [ ] All tests passing (`forge test`)
- [ ] Contracts audited
- [ ] Multisig wallet set as owner
- [ ] Timelock on upgrades
- [ ] Emergency pause mechanism tested
- [ ] Gas optimization reviewed
- [ ] Access control verified
- [ ] Upgrade path tested on testnet

## Post-Deployment

1. **Update Backend**
   ```bash
   # Update backend/.env with new addresses
   AGENT_REGISTRY_ADDRESS=0x...
   ESCROW_PAYMENT_ADDRESS=0x...
   API_PAYMENT_REGISTRY_ADDRESS=0x...
   ```

2. **Update Frontend**
   ```bash
   # Update frontend/.env with new addresses
   NEXT_PUBLIC_AGENT_REGISTRY=0x...
   NEXT_PUBLIC_ESCROW_PAYMENT=0x...
   NEXT_PUBLIC_API_PAYMENT_REGISTRY=0x...
   ```

3. **Update CLI**
   ```bash
   # Update CLI config with new addresses
   agentguard init --network base-sepolia
   ```

## Monitoring

Monitor deployed contracts:
- Basescan: https://basescan.org
- Tenderly: https://dashboard.tenderly.co
- Defender: https://defender.openzeppelin.com

## Support

For deployment issues:
- Check Foundry docs: https://book.getfoundry.sh
- Base docs: https://docs.base.org
- OpenZeppelin upgrades: https://docs.openzeppelin.com/upgrades-plugins
