import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { ClaudeService } from './ClaudeService';
import fs from 'fs';
import path from 'path';

dotenv.config();

const ESCROW_ABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'abis/EscrowPayment.json'), 'utf8')).abi;
const DISPUTE_ABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'abis/DisputeResolution.json'), 'utf8')).abi;
const REGISTRY_ABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'abis/AgentRegistry.json'), 'utf8')).abi;

export class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private escrowContract: ethers.Contract;
    private disputeContract: ethers.Contract;
    private registryContract: ethers.Contract;
    private claudeService: ClaudeService;

    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);

        this.escrowContract = new ethers.Contract(process.env.ESCROW_ADDRESS!, ESCROW_ABI, this.wallet);
        this.disputeContract = new ethers.Contract(process.env.DISPUTE_ADDRESS!, DISPUTE_ABI, this.wallet);
        this.registryContract = new ethers.Contract(process.env.REGISTRY_ADDRESS!, REGISTRY_ABI, this.wallet);

        this.claudeService = new ClaudeService();
    }

    async listenForDisputes() {
        console.log(" Listening for 'TransactionDisputed' events...");

        this.escrowContract.on("TransactionDisputed", async (txId: bigint) => {
            console.log(` Dispute detected for Transaction ID: ${txId.toString()}`);
            await this.handleDispute(Number(txId));
        });
    }

    private async handleDispute(txId: number) {
        try {
            // 1. Fetch transaction details from Escrow contract
            const tx = await this.escrowContract.transactions(txId);
            const agentAddress = tx.agent;
            const userClaim = "User has filed a dispute. Analyze if the transaction matches the agent's charter."; // In real app, fetch from DB

            // 2. Fetch Agent Charter from Registry
            const charter = await this.registryContract.agentCharters(agentAddress);
            const charterString = `Daily Limit: ${charter.dailySpendingLimit}, Monthly Limit: ${charter.monthlySpendingLimit}, Per-Tx Limit: ${charter.spendingLimitPerTx}`;

            // 3. AI Arbitration
            console.log(`Consulting Claude for arbitration...`);
            const result = await this.claudeService.analyzeDispute({
                txId,
                agentCharter: charterString,
                transactionMetadata: tx.metadataURI,
                userClaim: userClaim
            });

            console.log(` Arbitration Result: Refund ${result.refundPercent}%, Slash: ${result.slashAmount}, Reason: ${result.reasoning}`);

            // 4. Submit Resolution to Blockchain
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
