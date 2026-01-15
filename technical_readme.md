# AgentGuard Technical Documentation

This guide provides step-by-step instructions for setting up and running the AgentGuard ecosystem locally, along with core conceptual information.

## Project Structure
- **/contract**: Solidity smart contracts and Foundry setup.
- **/backend**: Express.js server, MongoDB models, and Blockchain listeners.
- **/frontend/website**: Next.js dashboard and user interface.
- **/dev-sdk**: TypeScript SDK for developers to integrate AgentGuard into their AI agents (like Stripe for agent payments).
- **/nonDev-cli**: Go CLI tool for non-technical users to easily create agents and make payments.
---

## 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)
- [Redis](https://redis.io/download/) (Local or Upstash)
- [MetaMask](https://metamask.io/) or another Web3 wallet

---

## Technology Stack

### Smart Contracts (Ethereum)
- **Solidity 0.8.20** - Core contract language
- **OpenZeppelin Contracts** - Security standards and escrow templates
- **Foundry** - Development framework, testing, deployment
- **Chainlink** - Price oracles for USD/MNEE conversion

**Contracts:**
1. `AgentRegistry.sol` - Agent identity and charter management
2. `ReputationBond.sol` - Staking, bond management, reputation scoring
3. `EscrowPayment.sol` - Payment locking, release, dispute handling (supports USDC, USDT, MNEE)
4. `DisputeResolution.sol` - Arbitration logic, DAO voting
5. `InsurancePool.sol` - Pool management, payout distribution (multi-token support)
6. `MockERC20.sol` - Mock MNEE token for Base Sepolia testnet

### Backend Services
- **Node.js + Express** - API server for agent interactions
- **MongoDB** - Transaction history, analytics, metadata
- **IPFS (via Pinata )** - Decentralized evidence storage
- **Redis** - Caching, rate limiting, session management
- **Gemini API** - AI arbitration and dispute analysis

### Frontend
- **Next.js** - Web application framework
- **Tailwind CSS** - Styling and UI components
- **wagmi + viem** - Ethereum wallet connections
- **RainbowKit** - Wallet connection UI
- **Recharts** - Analytics and visualization
- **React Query** - Data fetching and state management

### Developer Tools
- **TypeScript SDK** (`@agentguard/sdk`) - Developer SDK for easy integration
- **Go CLI** - Command-line tool for non-technical users
- **Viem** - TypeScript library for Ethereum interactions

### Blockchain Infrastructure
- **Alchemy** - Ethereum RPC provider
- **Base Sepolia** - Testnet for development
- **The Graph** - Indexing and querying on-chain data

### Supported Payment Tokens
- **MNEE** - Native token for reputation bonds and payments
- **USDC** - USD Coin stablecoin for payments
- **USDT** - Tether stablecoin for payments
- **MockERC20** - Mock MNEE token for Base Sepolia testnet

### DevOps & Monitoring
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **Base Scan** - Blockchain 

---

### Architecture
```mermaid
graph TB
    subgraph "User Interfaces"
        CLI[Go CLI Tool<br/>Non-Technical Users]
        SDK[TypeScript SDK<br/>Developers]
        WEB[Next.js Dashboard<br/>Web Users]
    end

    subgraph "Backend Services"
        API[Express API Server]
        ARB[AI Arbitration Service]
        NOTIF[Notification Service]
        ANALYTICS[Analytics Engine]
    end

    subgraph "Data Layer"
        MD[(MongoDB)]
        REDIS[(Redis Cache)]
        IPFS[IPFS/Pinata<br/>Evidence Vault]
    end

    subgraph "Smart Contracts - Base Sepolia"
        REG[AgentRegistry<br/>Identity & Charter]
        ESC[EscrowPayment<br/>Multi-Token Support]
        BOND[ReputationBond]
        POOL[InsurancePool<br/>Multi-Token Fees]
        DISP[DisputeResolution]
    end

    subgraph "Tokens"
        MNEE[MNEE Token]
        USDC[USDC]
        USDT[USDT]
    end

    subgraph "External Services"
        Gemini[Gemini API<br/>AI Arbitration]
        ALCHEMY[Alchemy<br/>RPC Provider]
    end

    %% User Interface Connections
    CLI --> SDK
    SDK --> ESC
    WEB --> ESC
    WEB --> API
    
    %% Contract Interactions
    ESC --> REG
    ESC --> BOND
    ESC --> POOL
    ESC --> DISP
    
    %% Token Support (EscrowPayment supports these tokens)
    ESC -.supports.-> MNEE
    ESC -.supports.-> USDC
    ESC -.supports.-> USDT
    
    %% Fee Collection (InsurancePool collects fees in these tokens)
    POOL -.collects fees in.-> MNEE
    POOL -.collects fees in.-> USDC
    POOL -.collects fees in.-> USDT
    
    %% Backend Connections
    API --> MD
    API --> REDIS
    API --> IPFS
    API --> ALCHEMY
    ARB --> Gemini
    
    %% Blockchain RPC Connections
    ALCHEMY --> REG
    ALCHEMY --> ESC
    ALCHEMY --> BOND
    ALCHEMY --> POOL
    ALCHEMY --> DISP
```

## 2. Core Concepts & Architecture

### Agent Identity (The Wallet Address)
The **Agent Wallet Address** you input during registration serves as the agent's **Digital Passport**. 

- **Authorization (The Corporate Card)**: By registering an address, the **Owner** (User) is authorizing that specific wallet to spend MNEE on their behalf. The `EscrowPayment` smart contract checks this authorization record before releasing funds.
- **Spending Boundaries**: The "Charter" (limits) are cryptographically tied to this address. If the agent address attempts a transaction that exceeds these limits, the contract rejects it automatically.
- **Reputation (DID)**: Every transaction, settlement, and dispute is logged against this address, building a persistent "Reputation Score" over time.

### How the AI uses the Wallet (The Secret Sauce)
A "Real-world" autonomous agent is typically a Python or Node.js service running on a server (e.g., an AutoGPT instance or a custom trading bot).
- **Private Key Access**: To act autonomously, the AI service is provided with the **Private Key** of the **Agent Wallet Address** (the one you registered).
- **Autonomy**: This allows the AI to sign transaction requests (e.g., purchasing compute credits or API access) without human intervention.
- **User-Agent Link**: The smart contract links the **Agent Address** to the **User Wallet Address**. When the agent signs a transaction, the contract essentially says: *"I see this is Agent X, who belongs to User Y, and User Y has authorized Agent X to spend up to $Z."*
- **Security Separation**: The AI **never** has access to the User's primary private key. It only holds the key for its authorized "Agent Wallet," meaning even if the AI is compromised, the damage is strictly capped by the daily/monthly limits defined in its on-chain charter.

---

## 3. How Agent-Wallet Connection Enables Insurance

The insurance mechanism works because the agent's bond is locked in a smart contract. When a transaction occurs:
1. **Verification**: The contract checks if the agent is authorized by the owner and within its limits.
2. **Locking**: A portion of the agent's bonded MNEE is locked as collateral.
3. **Dispute**: If a dispute occurs and the agent is at fault (policy violation), the smart contract slashes the **Agent's Bond** to refund the user. The merchant is protected because the refund comes from the agent's stake, not the merchant's account.

---

## 4. Transaction Lifecycle

After an agent initiates a transaction, the protocol enters the **Escrow & Verification** phase:

### Phase 1: The Escrow Window
- **Funds Locked**: Payment tokens (MNEE, USDC, or USDT) are moved from the User's wallet into the `EscrowPayment` contract.
- **Verification Window**: A 24-hour countdown (configurable) begins. During this time, the status is marked as **"Escrowed"**.

### Phase 2: Settlement or Dispute
There are two possible outcomes once the window closes:

#### Path A: Settlement (The "Happy Path")
- **Manual/Auto Release**: Once the 24h window passes, anyone can call `settleTransaction`.
- **Merchant Payment**: Funds are released to the merchant.
- **Rewards**: The Agent earns **+2 Reputation points**, and a small protocol fee (0.5%) is collected.

#### Path B: Dispute (The "Correction Path")
- **User Intervention**: If a violation is noticed, the User can file a dispute within the 24h window.
- **Arbitration**: The backend service analyzes the **Agent Charter** vs. **Transaction Evidence**.
- **Resolution**: Funds are either refunded to the User (slashing the agent's bond) or released to the merchant if the dispute is invalid.

---

### Smart Contract Setup
1. Navigate to `contract/`.
2. Run `forge install`, then `forge build`.
3. Use `forge test` to verify logic.

### Backend Setup
1. Navigate to `backend/`.
2. Run `npm install`.
3. Configure `.env` with RPC URL, Private Key, MongoDB URL, and Gemini API Key.
4. Run `npm run dev` to start the server (Port 5000/3001).

### Frontend Setup
1. Navigate to `frontend/website/`.
2. Run `npm install`.
3. Configure `.env` with `NEXT_PUBLIC_API_URL`.
4. Run `npm run dev` to start the dashboard (Port 3000).

### SDK Setup (for Developers)
1. Navigate to `dev-sdk/`.
2. Run `npm install`.
3. Run `npm run build` to compile TypeScript.
4. Use in your project:
   ```typescript
   import { AgentGuardClient } from '@agentguard/sdk';
   
   const client = new AgentGuardClient({
     agentRegistryAddress: '0x...',
     escrowPaymentAddress: '0x...',
     reputationBondAddress: '0x...',
     publicClient,
     walletClient
   });
   
   // Initiate payment with USDC
   await client.payments.initiate({
     merchantAddress: '0x...',
     tokenAddress: '0x...', // USDC/USDT/MNEE
     amount: parseEther('50'),
     metadataURI: 'ipfs://...'
   });
   ```

### CLI Setup (for Non-Technical Users)
1. Navigate to `nonDev-cli/`.
2. Run `go build -o agentguard` to compile.
3. Initialize: `./agentguard init`
4. Create agent: `./agentguard create-agent`
5. Make payment: `./agentguard pay <merchant> <amount> <token>`

---

## 5. Testing & Registration Data
Use this data to test a new agent registration on the **Registry** page:

| Field | Value |
| :--- | :--- |
| **Agent Name** | `AutoProcure-v1` |
| **Agent Address** | *[Enter a secondary test wallet address - the one your AI will use]* |
| **Authorization Charter** | `Autonomous procurement agent for marketing SaaS tools. Authorized to spend up to 2000 tokens monthly on verified services within specified daily limits.` |
| **Daily Limit** | `200 tokens` |
| **Monthly Limit** | `2000 tokens` |
| **Per Transaction Limit**| `100 tokens` |
| **Supported Tokens** | `MNEE, USDC, USDT` |

### Steps to Register:
1. **Switch Network**: Ensure MetaMask is on **Base Sepolia**.
2. **Connect Owner**: Connect with the wallet that holds the MNEE (the "Bank").
3. **Submit**: Navigate to **Registry** in the sidebar, fill the form, and click **Sign & Register Agent**.
4. **Confirm**: Approve the transaction. The backend will sync the metadata once confirmed.
5. **Simulate (Acting as Agent)**: Switch your MetaMask to the **Agent Wallet Address** you just registered, then go to the **Simulate** page to initiate a purchase as the agent.

---

## 6. TypeScript SDK

Created a complete SDK at [`dev-sdk/`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/dev-sdk/) with the following structure:

### Files Created:
- [`package.json`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/dev-sdk/package.json) - Dependencies and scripts
- [`tsconfig.json`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/dev-sdk/tsconfig.json) - TypeScript configuration
- [`src/index.ts`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/dev-sdk/src/index.ts) - Main SDK client
- [`src/abis.ts`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/dev-sdk/src/abis.ts) - Contract ABIs
- [`README.md`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/dev-sdk/README.md) - Documentation

### SDK Features:

**Registry Operations:**
```typescript
await client.registry.registerAgent({
  agentAddress: '0x...',
  spendingLimitPerTx: parseEther('100'),
  monthlySpendingLimit: parseEther('2000'),
  dailySpendingLimit: parseEther('200')
});
```

**Payment Operations (Multi-Token):**
```typescript
const txId = await client.payments.initiate({
  merchantAddress: '0x...',
  tokenAddress: '0x...', // USDC, USDT, or MNEE
  amount: parseEther('50'),
  metadataURI: 'ipfs://...'
});
```

**Bond Operations:**
```typescript
await client.bonds.stake({
  agentAddress: '0x...',
  amount: parseEther('1000')
});
```

---

## 7. Go CLI Tool

Created a user-friendly CLI at [`nonDev-cli/`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/nonDev-cli/) for non-technical users.

### Files Created:
- [`go.mod`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/nonDev-cli/go.mod) - Go module definition
- [`main.go`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/nonDev-cli/main.go) - Entry point
- [`cmd/root.go`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/nonDev-cli/cmd/root.go) - Root command
- [`cmd/init.go`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/nonDev-cli/cmd/init.go) - Initialization command
- [`cmd/create_agent.go`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/nonDev-cli/cmd/create_agent.go) - Agent creation wizard
- [`cmd/pay.go`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/nonDev-cli/cmd/pay.go) - Payment and status commands
- [`README.md`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/nonDev-cli/README.md) - User documentation

### CLI Commands:

**Initialize:**
```bash
agentguard init
```
- Creates config at `~/.agentguard/config.yaml`
- Generates a new wallet
- Displays wallet address for funding

**Create Agent:**
```bash
agentguard create-agent
```
- Interactive wizard for agent registration
- Sets spending limits (per-tx, daily, monthly)
- Registers agent on-chain

**Make Payment:**
```bash
agentguard pay 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 50 USDC
```
- Supports USDC, USDT, and MNEE
- Confirms before executing
- Shows transaction ID and status

**Check Status:**
```bash
agentguard status
```
- Displays wallet balances
- Shows registered agents
- Lists recent transactions

---

## 8. Token Support Summary

### Supported Tokens

| Token | Purpose | Notes |
|-------|---------|-------|
| **MNEE** | Reputation bonds, payments | Original token, still required for bonds |
| **USDC** | Payments | Stablecoin for predictable pricing |
| **USDT** | Payments | Alternative stablecoin option |

### Mock Token Note

> [!IMPORTANT]
> Since MNEE is not available on Base Sepolia, you should use the `MockERC20` contract located at [`contract/test/mocks/MockERC20.sol`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/contract/test/mocks/MockERC20.sol). Deploy this contract and update the `MNEE_TOKEN_ADDRESS` in [`frontend/website/lib/contracts.ts`](file:///c:/Users/oguno/Desktop/codes/AgentGaurd/frontend/website/lib/contracts.ts).

---

## 9. Next Steps

### For Contract Deployment:

1. **Deploy MockERC20** for MNEE on Base Sepolia
2. **Update contract addresses** in:
   - `frontend/website/lib/contracts.ts`
   - `dev-sdk/src/abis.ts`
   - `nonDev-cli/cmd/init.go`
3. **Add USDC/USDT** support via `setTokenSupport()` on `EscrowPayment`
4. **Test multi-token transactions** on testnet

### For SDK:

1. **Install dependencies**: `cd dev-sdk && npm install`
2. **Build**: `npm run build`
3. **Publish** to npm (when ready): `npm publish`

### For CLI:

1. **Build binary**: `cd nonDev-cli && go build -o agentguard`
2. **Test commands**: `./agentguard init`, `./agentguard create-agent`
3. **Cross-compile** for different platforms:
   ```bash
   GOOS=windows GOARCH=amd64 go build -o agentguard.exe
   GOOS=darwin GOARCH=arm64 go build -o agentguard-mac
   GOOS=linux GOARCH=amd64 go build -o agentguard-linux
   ```

---

## 10. Maintenance & Deployment
- Deployment: Backend (Render), Frontend (Vercel).
- Support: [support@agentguard.io](mailto:ogunodemarvellous@gmail.com).
- License: MIT.