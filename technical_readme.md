# AgentGuard Technical Documentation

This guide provides step-by-step instructions for setting up and running the AgentGuard ecosystem locally.

## Project Structure
- **/contract**: Solidity smart contracts and Foundry setup.
- **/backend**: Express.js server, MongoDB models, and Blockchain listeners.
- **/frontend/website**: Next.js dashboard and user interface.

---

## 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (for smart contracts)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)
- [Redis](https://redis.io/download/) (Local or Upstash)
- [MetaMask](https://metamask.io/) or another Web3 wallet

---

## 2. Smart Contract Setup
The contracts manage agent identity, reputation bonds, and escrow payments.

1. Navigate to the contract directory:
   ```bash
   cd contract
   ```
2. Install dependencies:
   ```bash
   forge install
   ```
3. Build the contracts:
   ```bash
   forge build
   ```
4. Run tests:
   ```bash
   forge test
   ```

---

## 3. Backend Setup
The backend handles AI arbitration logic and synchronizes on-chain events with the database.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *Fill in your RPC URL, Private Key, MongoDB URL, Redis URL, and Gemini API Key.*
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 4. Frontend Setup
The dashboard provides a user interface for agent registration and transaction monitoring.

1. Navigate to the frontend directory:
   ```bash
   cd frontend/website
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Create a `.env` file and add:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 5. Running the Full System
1. **Start MongoDB and Redis** (e.g., via Docker or local services).
2. **Launch Backend**: `npm run dev` (Runs on port 3001).
3. **Launch Frontend**: `npm run dev` (Runs on port 3000).
4. **Connect Wallet**: Ensure your wallet is connected to **Base Sepolia** (or your target network).

---

## Troubleshooting
- **401 Unauthorized**: Ensure your `CORS_ORIGIN` in the backend `.env` matches your frontend URL (e.g., `http://localhost:3000`).
- **Chain Sync**: The backend `BlockchainService` must be running to capture on-chain events like `AgentRegistered`.
- **Gas**: Ensure your test wallet has Sepolia ETH.


## 6. Deployment

1. **Backend**: Deploy the backend to a server or cloud platform (e.g., Heroku, Vercel).
2. **Frontend**: Deploy the frontend to a static hosting service (e.g., Vercel, GitHub Pages).

---

## 7. Maintenance
Regularly update dependencies and monitor for security vulnerabilities.

---

## 8. Support
For issues or questions, please contact [support@agentguard.io](mailto:ogunodemarvellous@gmail.com).

---

## 9. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


# Testing
1. New Agent Registration Data
Use this data to register your new agent on the Registry page:

Field	Value
Agent Name	AutoProcure-v1
Agent Address	[Enter a secondary test wallet address here]
Authorization Charter	Autonomous procurement agent for marketing SaaS tools. Authorized to spend up to 2000 MNEE monthly on verified services within specified daily limits.
Daily Limit	200 MNEE
Monthly Limit	2000 MNEE
Per Transaction Limit	100 MNEE

#Steps to Register:

Switch Network: Ensure your wallet (MetaMask) is on Base Sepolia.
Fill Form: Navigate to Registry in the sidebar and paste the values above.
Submit: Click Sign & Register Agent. This will trigger an on-chain transaction.
Confirm: Approve the transaction in your wallet.
Sync: Wait a few seconds for confirmation. The backend will automatically sync the data to your dashboard.