import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { GeminiService } from './LLMService';
import { DisputeRepo } from '../repositories/DisputeRepo';
import { IPFSService } from './IPFSservice';
import { CONTRACTS } from '../config/contracts';

dotenv.config();

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
            // Fail fast in production, but allow mock provider for tests if needed
            this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            this.wallet = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, this.provider) : ethers.Wallet.createRandom().connect(this.provider);
        } else {
            this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        }

        // Use addresses from config
        this.escrowContract = new ethers.Contract(CONTRACTS.ESCROW_PAYMENT.ADDRESS, CONTRACTS.ESCROW_PAYMENT.ABI, this.wallet);
        this.disputeContract = new ethers.Contract(CONTRACTS.DISPUTE_RESOLUTION.ADDRESS, CONTRACTS.DISPUTE_RESOLUTION.ABI, this.wallet);
        this.registryContract = new ethers.Contract(CONTRACTS.AGENT_REGISTRY.ADDRESS, CONTRACTS.AGENT_REGISTRY.ABI, this.wallet);

        this.geminiService = new GeminiService();
    }

    async listenForDisputes() {
        if (!this.escrowContract.target) {
            console.log("Skipping blockchain listeners: Contracts not configured");
            return;
        }

        console.log(" Listening for 'TransactionDisputed' events on:", this.escrowContract.target);

        this.escrowContract.on("TransactionDisputed", async (txnId: bigint, disputer: string) => {
            console.log(` Dispute detected for Transaction ID: ${txnId.toString()} by ${disputer}`);
            await this.handleDispute(Number(txnId), disputer);
        });
    }

    private async handleDispute(txId: number, disputer: string) {
        try {
            console.log(`Processing dispute ${txId}...`);

            // 1. Fetch transaction details from Escrow contract
            const tx = await this.escrowContract.transactions(txId);
            const agentAddress = tx.agent;

            // 2. Fetch User Claim & Context
            // We look for an existing dispute record in DB (submitted via API)
            // If not found, we try to fetch metadata from IPFS or use default.
            let userClaim = "Dispute raised by user.";
            let transactionContext = "No metadata available.";

            const dbDispute = await DisputeRepo.findByTxId(txId);
            if (dbDispute && dbDispute.reason) {
                userClaim = dbDispute.reason;
            }

            if (tx.metadataURI) {
                try {
                    const ipfsData = await IPFSService.fetchJSON(tx.metadataURI);
                    if (ipfsData) {
                        transactionContext = JSON.stringify(ipfsData);
                        // If DB didn't have claim, maybe IPFS does?
                        if (userClaim === "Dispute raised by user." && ipfsData.claim) {
                            userClaim = ipfsData.claim;
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch IPFS metadata:", err);
                }
            }

            // 3. Fetch Agent Charter from Registry
            const charter = await this.registryContract.agentCharters(agentAddress);
            const charterString = `Daily Limit: ${charter.dailySpendingLimit.toString()}, Activity: ${charter.isActive ? 'Active' : 'Inactive'}`;

            // 4. AI Arbitration with Gemini
            console.log(`Consulting Gemini for arbitration...`);
            const result = await this.geminiService.analyzeDispute({
                txId,
                agentCharter: charterString,
                transactionMetadata: transactionContext,
                userClaim: userClaim
            });

            console.log(` Arbitration Result: Refund ${result.refundPercent}%, Slash: ${result.slashAmount}`, result.reasoning);

            // 5. Submit Resolution to Blockchain
            const txResponse = await this.disputeContract.resolveViaAI(
                txId,
                result.refundPercent,
                result.slashAmount,
                result.reasoning
            );

            await txResponse.wait();
            console.log(`Dispute ${txId} resolved on-chain. TX: ${txResponse.hash}`);

            // Update DB Status
            await DisputeRepo.updateStatus(txId, 'Resolved', result);

        } catch (error) {
            console.error(`Failed to handle dispute ${txId}:`, error);
        }
    }
}
