# AgentGaurd
The trust and insurance layer for AI agent commerce—making agent transactions safer than human purchases through bonded reputation, instant dispute resolution, and zero merchant chargeback risk.


Architecture
```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Dashboard]
        WC[Wallet Connect/RainbowKit]
        SDK[Agent SDK]
    end

    subgraph "Backend Services Layer"
        API[Express API Server]
        ARB[AI Arbitration Service]
        NOTIF[Notification Service]
        ANALYTICS[Analytics Engine]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        REDIS[(Redis Cache)]
        IPFS[IPFS/Pinata<br/>Evidence Vault]
    end

    subgraph "Blockchain Layer - Ethereum"
        MNEE[MNEE Token<br/>0x8cce...FD6cF]
        
        subgraph "AgentGuard Smart Contracts"
            REG[AgentRegistry<br/>Identity & Charter]
            BOND[ReputationBond<br/>Staking & Scoring]
            ESC[EscrowPayment<br/>Tx Management]
            DISP[DisputeResolution<br/>Arbitration]
            POOL[InsurancePool<br/>Fund Management]
            GOV[DAOGovernance<br/>Voting & Params]
        end
    end

    subgraph "External Services"
        CLAUDE[Claude API<br/>AI Arbitration]
        ALCHEMY[Alchemy/Infura<br/>RPC Provider]
        ETHERSCAN[Etherscan API<br/>Verification]
    end

    UI --> WC
    UI --> API
    SDK --> API
    WC --> ALCHEMY
    
    API --> PG
    API --> REDIS
    API --> IPFS
    API --> ALCHEMY
    ARB --> CLAUDE
    API --> ARB
    API --> NOTIF
    API --> ANALYTICS
    
    ALCHEMY --> REG
    ALCHEMY --> BOND
    ALCHEMY --> ESC
    ALCHEMY --> DISP
    ALCHEMY --> POOL
    ALCHEMY --> GOV
    
    REG -.references.-> MNEE
    BOND -.stakes.-> MNEE
    ESC -.locks.-> MNEE
    POOL -.manages.-> MNEE
    
    REG --> BOND
    BOND --> ESC
    ESC --> DISP
    DISP --> POOL
    DISP --> GOV
    POOL --> BOND
    
    PG -.logs.-> IPFS
    DISP -.evidence.-> IPFS
```