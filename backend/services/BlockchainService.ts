import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { GeminiService } from './LLMService';
import { DisputeRepo } from '../repositories/DisputeRepo';
import { AgentRepo } from '../repositories/AgentRepo';
import { TxRepo } from '../repositories/TxRepo';
import { IPFSService } from './IPFSservice';
import { CONTRACTS } from '../config/contracts';
import User from '../models/User';

dotenv.config();

export class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private escrowContract: ethers.Contract;
    private disputeContract: ethers.Contract;
    private registryContract: ethers.Contract;
    private bondContract: ethers.Contract;
    private geminiService: GeminiService;

    constructor() {
        if (!process.env.RPC_URL || !process.env.PRIVATE_KEY) {
            console.error("Missing RPC_URL or PRIVATE_KEY");
            this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            this.wallet = process.env.PRIVATE_KEY ? new ethers.Wallet(process.env.PRIVATE_KEY, this.provider) : ethers.Wallet.createRandom().connect(this.provider);
        } else {
            this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        }

        this.escrowContract = new ethers.Contract(CONTRACTS.ESCROW_PAYMENT.ADDRESS, CONTRACTS.ESCROW_PAYMENT.ABI, this.wallet);
        this.disputeContract = new ethers.Contract(CONTRACTS.DISPUTE_RESOLUTION.ADDRESS, CONTRACTS.DISPUTE_RESOLUTION.ABI, this.wallet);
        this.registryContract = new ethers.Contract(CONTRACTS.AGENT_REGISTRY.ADDRESS, CONTRACTS.AGENT_REGISTRY.ABI, this.wallet);
        this.bondContract = new ethers.Contract(CONTRACTS.REPUTATION_BOND.ADDRESS, CONTRACTS.REPUTATION_BOND.ABI, this.wallet);

        this.geminiService = new GeminiService();
    }

    async listenForEvents() {
        if (!this.escrowContract.target) {
            console.log("Skipping blockchain listeners: Contracts not configured");
            return;
        }

        console.log(" Initializing Blockchain Event Listeners...");

        // 1. Agent Registration Listener
        this.registryContract.on("AgentRegistered", async (agentAddress: string, userAddress: string) => {
            console.log(`[Event] Agent Registered: ${agentAddress} (Owner: ${userAddress})`);
            try {
                // Find or create user in DB based on wallet address if possible
                let dbUser = await User.findOne({ walletAddress: userAddress });

                // Fetch charter from contract to sync initial limits
                const charter = await this.registryContract.agentCharters(agentAddress);

                await AgentRepo.create({
                    user: dbUser?._id, // Might be null if user hasn't signed up via Web2 flow yet
                    address: agentAddress,
                    charter: "On-chain Registered Agent",
                    dailySpendingLimit: Number(charter.dailySpendingLimit),
                    monthlySpendingLimit: Number(charter.monthlySpendingLimit),
                    transactionLimit: Number(charter.spendingLimitPerTx),
                    isActive: true
                });
            } catch (err) {
                console.error("Failed to sync AgentRegistered event:", err);
            }
        });

        // 2. Bond Staking & Reputation Listener
        this.bondContract.on("BondStaked", async (agentAddress: string, amount: bigint) => {
            console.log(`[Event] Bond Staked: ${agentAddress} (+${ethers.formatEther(amount)} MNEE)`);
            try {
                const agent = await AgentRepo.findByAddress(agentAddress);
                if (agent) {
                    const newTotal = (BigInt(agent.stakedMnee || "0") + amount).toString();
                    await AgentRepo.updateStats(agentAddress, { stakedMnee: newTotal });
                }
            } catch (err) {
                console.error("Failed to sync BondStaked event:", err);
            }
        });

        this.bondContract.on("ReputationUpdated", async (agentAddress: string, newScore: bigint) => {
            console.log(`[Event] Reputation Updated: ${agentAddress} (Score: ${newScore.toString()})`);
            try {
                await AgentRepo.updateStats(agentAddress, { reputation: Number(newScore) });
            } catch (err) {
                console.error("Failed to sync ReputationUpdated event:", err);
            }
        });

        // 3. Transaction Lifecycle Listeners
        this.escrowContract.on("TransactionCreated", async (id: bigint, agent: string, merchant: string, amount: bigint) => {
            console.log(`[Event] Transaction Created: ID ${id.toString()}, Agent ${agent}, Amount ${ethers.formatEther(amount)} MNEE`);
            try {
                // Fetch full txn details from contract
                const txData = await this.escrowContract.transactions(id);

                await TxRepo.create({
                    txId: Number(id),
                    agentAddress: agent,
                    userAddress: txData.user,
                    amount: amount.toString(),
                    serviceId: merchant, // Using merchant as serviceId for simplicity
                    metadataURI: txData.metadataURI,
                    status: 'Initiated'
                });
            } catch (err) {
                console.error("Failed to sync TransactionCreated event:", err);
            }
        });

        this.escrowContract.on("TransactionSettled", async (id: bigint, completed: boolean) => {
            console.log(`[Event] Transaction Settled: ID ${id.toString()} (Success: ${completed})`);
            try {
                const status = completed ? 'Completed' : 'Refunded';
                const tx = await TxRepo.findByTxId(Number(id));
                if (tx) {
                    tx.status = status;
                    await tx.save();
                }
            } catch (err) {
                console.error("Failed to sync TransactionSettled event:", err);
            }
        });

        this.escrowContract.on("TransactionDisputed", async (txnId: bigint, disputer: string) => {
            console.log(`[Event] Dispute Detected: ID ${txnId.toString()} by ${disputer}`);
            try {
                const tx = await TxRepo.findByTxId(Number(txnId));
                if (tx) {
                    tx.status = 'Disputed';
                    await tx.save();
                }
                await this.handleDispute(Number(txnId), disputer);
            } catch (err) {
                console.error("Failed to sync TransactionDisputed event:", err);
            }
        });
    }

    private async handleDispute(txId: number, disputer: string) {
        try {
            console.log(`Processing AI Arbitration for Dispute ${txId}...`);

            const tx = await this.escrowContract.transactions(txId);
            const agentAddress = tx.agent;

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
                        if (userClaim === "Dispute raised by user." && ipfsData.claim) {
                            userClaim = ipfsData.claim;
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch IPFS metadata:", err);
                }
            }

            const charter = await this.registryContract.agentCharters(agentAddress);
            const charterString = `Daily Limit: ${charter.dailySpendingLimit.toString()}, Activity: ${charter.isActive ? 'Active' : 'Inactive'}`;

            const result = await this.geminiService.analyzeDispute({
                txId,
                agentCharter: charterString,
                transactionMetadata: transactionContext,
                userClaim: userClaim
            });

            console.log(` AI Result: Refund ${result.refundPercent}%, Slash: ${result.slashAmount}`, result.reasoning);

            const txResponse = await this.disputeContract.resolveViaAI(
                txId,
                result.refundPercent,
                result.slashAmount,
                result.reasoning
            );

            await txResponse.wait();
            console.log(`Dispute ${txId} resolved on-chain. TX: ${txResponse.hash}`);

            await DisputeRepo.updateStatus(txId, 'Resolved', result);

        } catch (error) {
            console.error(`Failed to handle dispute ${txId}:`, error);
        }
    }
}
