# AgentGuard CLI

A command-line tool for non-technical users to easily create and manage AI agents with secure payment capabilities.

## Installation

### Download Pre-built Binary

Download the latest release for your platform from the [releases page](https://github.com/agentguard/cli/releases).

### Build from Source

```bash
git clone https://github.com/agentguard/agentguard-cli
cd agentguard-cli
go build -o agentguard
```

## Quick Start

### 1. Initialize

Set up your AgentGuard environment and create a wallet:

```bash
agentguard init
```

This will:
- Create a configuration file at `~/.agentguard/config.yaml`
- Generate a new wallet for you
- Display your wallet address (fund it with Base Sepolia testnet tokens)

### 2. Create an Agent

Register a new AI agent with spending limits:

```bash
agentguard create-agent
```

Follow the interactive prompts to:
- Name your agent
- Set spending limits (per transaction, daily, monthly)
- Register it on-chain

### 3. Make a Payment

Initiate a payment from your agent:

```bash
agentguard pay <merchant-address> <amount> <token>
```

Example:
```bash
agentguard pay 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 50 USDC
```

### 4. Check Status

View your wallet and agent status:

```bash
agentguard status
```

## Supported Tokens

- **MNEE** - Native AgentGuard token
- **USDC** - USD Coin
- **USDT** - Tether USD

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize AgentGuard configuration and wallet |
| `create-agent` | Register a new AI agent with spending limits |
| `pay` | Initiate a payment transaction |
| `status` | Check agent and wallet status |

## Configuration

Configuration is stored at `~/.agentguard/config.yaml`:

```yaml
network: base-sepolia
rpc_url: https://sepolia.base.org
wallet_address: 0x...
private_key: ...
agent_registry_address: 0x...
escrow_payment_address: 0x...
reputation_bond_address: 0x...
```

## Security

- Your private key is stored locally in `~/.agentguard/config.yaml`
- **Never share this file with anyone**
- Keep backups of your private key in a secure location
- Use testnet for development and testing

## Support

For issues and questions:
- GitHub Issues: https://github.com/agentguard/cli/issues
- Documentation: https://docs.agentguard.io
- Email: support@agentguard.io

## License

MIT
