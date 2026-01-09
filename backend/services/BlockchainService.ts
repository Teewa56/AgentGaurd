import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { GeminiService } from './LLMService';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Helper to load ABI
const loadAbi = (filename: string) => {
    try {
        const p = path.join(process.cwd(), 'abis', filename);
        const content = fs.readFileSync(p, 'utf8');
        return JSON.parse(content).abi;
    } catch (e) {
        console.error(`Error loading ABI ${filename}:`, e);
        return [];
    }
};

const ESCROW_ABI = loadAbi('EscrowPayment.json');
const DISPUTE_ABI = loadAbi('DisputeResolution.json');
const REGISTRY_ABI = loadAbi('AgentRegistry.json');

export class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private escrowContract: ethers.Contract;
    private disputeContract: ethers.Contract;
    private registryContract: ethers.Contract;
    private geminiService: GeminiService;

    constructor() {
        if (!process.env.RPC_URL || !process.env.PRIVATE_KEY) {
            console.error("Missing RPC_URL or PRIVATE_KEY");
            // Fallback for types satisfaction in dev, but robust checking needed
            this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
            this.wallet = ethers.Wallet.createRandom().connect(this.provider);
        } else {
            this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        }

        // Addresses should be in .env
        const escrowAddr = process.env.ESCROW_PAYMENT_ADDRESS || '';
        const disputeAddr = process.env.DISPUTE_RESOLUTION_ADDRESS || '';
        const registryAddr = process.env.AGENT_REGISTRY_ADDRESS || '';

        this.escrowContract = new ethers.Contract(escrowAddr, ESCROW_ABI, this.wallet);
        this.disputeContract = new ethers.Contract(disputeAddr, DISPUTE_ABI, this.wallet);
        this.registryContract = new ethers.Contract(registryAddr, REGISTRY_ABI, this.wallet);

        this.geminiService = new GeminiService();
    }

    async listenForDisputes() {
        if (!this.escrowContract.target) {
            console.log("Skipping blockchain listeners: Contracts not configured");
            return;
        }

        console.log(" Listening for 'TransactionDisputed' events on:", this.escrowContract.target);

        // Listen for the event (Event signature matches contract)
        this.escrowContract.on("TransactionDisputed", async (txnId: bigint, disputer: string) => {
            console.log(` Dispute detected for Transaction ID: ${txnId.toString()} by ${disputer}`);
            await this.handleDispute(Number(txnId), disputer);
        });
    }

    private async handleDispute(txId: number, disputer: string) {
        try {
            console.log(`Processing dispute ${txId}...`);

            // 1. Fetch transaction details from Escrow contract
            // struct Transaction { address payer; address agent; uint256 amount; ... }
            const tx = await this.escrowContract.transactions(txId);
            const agentAddress = tx.agent;

            // In a real app, 'userClaim' and 'evidence' would be fetched from IPFS or DB 
            // triggered by an off-chain API call from the user to provide context.
            // For now, we simulate basic context.
            const userClaim = "User claims the service was not delivered as per charter.";

            // 2. Fetch Agent Charter from Registry
            // struct Charter { ... }
            const charter = await this.registryContract.agentCharters(agentAddress);
            const charterString = `Daily Limit: ${charter.dailySpendingLimit}, Activity: ${charter.isActive ? 'Active' : 'Inactive'}`;

            // 3. AI Arbitration with Gemini
            console.log(`Consulting Gemini for arbitration...`);
            const result = await this.geminiService.analyzeDispute({
                txId,
                agentCharter: charterString,
                transactionMetadata: tx.metadataURI || "No metadata",
                userClaim: userClaim
            });

            console.log(` Arbitration Result: Refund ${result.refundPercent}%, Slash: ${result.slashAmount}`, result.reasoning);

            // 4. Submit Resolution to Blockchain
            // ensure we only call this if we are an authorized arbitrator
            const txResponse = await this.disputeContract.resolveViaAI(
                txId,
                result.refundPercent,
                result.slashAmount,
                result.reasoning
            );

            await txResponse.wait();
            console.log(`Dispute ${txId} resolved on-chain. TX: ${txResponse.hash}`);

        } catch (error) {
            console.error(`Failed to handle dispute ${txId}:`, error);
        }
    }
}
