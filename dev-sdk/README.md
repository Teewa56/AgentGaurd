# @agentguard/sdk

TypeScript SDK for AgentGuard - The payment infrastructure for AI agents.

## Installation

```bash
npm install @agentguard/sdk viem
```

## Quick Start

```typescript
import { AgentGuardClient } from '@agentguard/sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Setup clients
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const walletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(),
  account: privateKeyToAccount('0x...')
});

// Initialize AgentGuard
const agentGuard = new AgentGuardClient({
  agentRegistryAddress: '0x...',
  escrowPaymentAddress: '0x...',
  reputationBondAddress: '0x...',
  publicClient,
  walletClient
});

// Register an agent
await agentGuard.registry.registerAgent({
  agentAddress: '0x...',
  spendingLimitPerTx: parseEther('100'),
  monthlySpendingLimit: parseEther('2000'),
  dailySpendingLimit: parseEther('200')
});

// Initiate a payment (supports USDC, USDT, MNEE)
const txId = await agentGuard.payments.initiate({
  merchantAddress: '0x...',
  tokenAddress: '0x...', // USDC/USDT/MNEE address
  amount: parseEther('50'),
  metadataURI: 'ipfs://...'
});
```

## Features

- **Registry Management**: Register and manage AI agent identities
- **Multi-Token Payments**: Support for USDC, USDT, and MNEE tokens
- **Reputation Bonds**: Stake and manage agent reputation
- **Escrow System**: Secure payment locking with dispute windows
- **Type-Safe**: Full TypeScript support with Viem

## API Reference

### Registry Operations

```typescript
// Register a new agent
await agentGuard.registry.registerAgent(params);

// Update agent charter
await agentGuard.registry.updateCharter(params);

// Check if agent is active
const isActive = await agentGuard.registry.isAgentActive(agentAddress);
```

### Payment Operations

```typescript
// Initiate a payment
const txId = await agentGuard.payments.initiate(params);

// Settle a transaction
await agentGuard.payments.settle(txId);

// Dispute a transaction
await agentGuard.payments.dispute(txId);
```

### Bond Operations

```typescript
// Stake a bond
await agentGuard.bonds.stake(params);

// Get required bond
const required = await agentGuard.bonds.getRequiredBond(agentAddress);

// Check bond sufficiency
const sufficient = await agentGuard.bonds.hasSufficientBond(agentAddress);
```

## License

MIT
