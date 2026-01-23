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
    private wallet: any;
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
        console.log(`[Blockchain] Initialized with RPC: ${process.env.RPC_URL}`);
        console.log(`[Blockchain] Escrow: ${this.escrowContract.target}`);
        console.log(`[Blockchain] Registry: ${this.registryContract.target}`);
        console.log(`[Blockchain] Bond: ${this.bondContract.target}`);
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
                // Find user in DB if exists (optional now)
                const dbUser = await User.findOne({ walletAddress: { $regex: new RegExp(`^${userAddress}$`, 'i') } });

                // Fetch charter from contract to sync initial limits
                const charter = await this.registryContract.agentCharters(agentAddress);

                const agentData = {
                    user: dbUser?._id as any,
                    address: agentAddress.toLowerCase(),
                    charter: "On-chain Registered Agent",
                    dailySpendingLimit: charter.dailySpendingLimit.toString(),
                    monthlySpendingLimit: charter.monthlySpendingLimit.toString(),
                    transactionLimit: charter.spendingLimitPerTx.toString(),
                    isActive: true
                };

                await AgentRepo.create(agentData);
                console.log(`[Sync] Success: Agent ${agentAddress} synced to DB. ${dbUser ? 'Linked to user: ' + dbUser.email : 'Unlinked.'}`);

                // Invalidate cache
                if (dbUser?._id) {
                    await CacheService.del(`dashboard_stats_v3_${dbUser._id}`);
                }
            } catch (err) {
                console.error(`[Sync] Error: Failed to sync AgentRegistered event for ${agentAddress}:`, err);
            }
        });

        // 2. Bond Staking & Reputation Listener
        this.bondContract.on("BondStaked", async (agentAddress: string, amount: bigint) => {
            const normalizedAddress = agentAddress.toLowerCase();
            console.log(`[Event] Bond Staked: ${normalizedAddress} (+${ethers.formatEther(amount)} MNEE)`);
            try {
                const agent = await AgentRepo.findByAddress(normalizedAddress);
                if (agent) {
                    const newTotal = (BigInt(agent.stakedMnee || "0") + amount).toString();
                    await AgentRepo.updateStats(normalizedAddress, { stakedMnee: newTotal });
                    console.log(`[Sync] Success: Bond updated for ${normalizedAddress}. New Total: ${ethers.formatEther(newTotal)} MNEE`);

                    // Invalidate dashboard cache
                    const agent = await AgentRepo.findByAddress(normalizedAddress);
                    if (agent && agent.user) {
                        await CacheService.del(`dashboard_stats_v3_${agent.user}`);
                    }
                } else {
                    console.warn(`[Sync] Warning: Received BondStaked for unknown agent ${agentAddress}. Syncing agent first...`);
                    // This can happen if BondStaked arrives before AgentRegistered
                    const charter = await this.registryContract.agentCharters(agentAddress);
                    const owner = await this.registryContract.agentToUser(agentAddress);
                    const dbUser = await User.findOne({ walletAddress: { $regex: new RegExp(`^${owner}$`, 'i') } });

                    await AgentRepo.create({
                        user: dbUser?._id as any,
                        address: agentAddress.toLowerCase(),
                        charter: "Auto-synced from Bond Event",
                        stakedMnee: amount.toString(),
                        dailySpendingLimit: charter.dailySpendingLimit.toString(),
                        monthlySpendingLimit: charter.monthlySpendingLimit.toString(),
                        transactionLimit: charter.spendingLimitPerTx.toString(),
                        isActive: true
                    });
                }
            } catch (err) {
                console.error(`[Sync] Error: Failed to sync BondStaked event for ${agentAddress}:`, err);
            }
        });

        this.bondContract.on("ReputationUpdated", async (agentAddress: string, newScore: bigint) => {
            console.log(`[Event] Reputation Updated: ${agentAddress} (Score: ${newScore.toString()})`);
            try {
                await AgentRepo.updateStats(agentAddress.toLowerCase(), { reputation: Number(newScore) });
            } catch (err) {
                console.error("Failed to sync ReputationUpdated event:", err);
            }
        });

        // 3. Transaction Lifecycle Listeners
        this.escrowContract.on("TransactionCreated", async (id: bigint, agent: string, merchant: string, token: string, amount: bigint) => {
            const decimals = token.toLowerCase() === process.env.MNEE_TOKEN_ADDRESS?.toLowerCase() ? 18 : 6;
            console.log(`[Event] Transaction Created: ID ${id.toString()}, Agent ${agent}, Token ${token}, Amount ${ethers.formatUnits(amount, decimals)}`);

            // Add delay to mitigate race conditions with chain state
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                // Fetch full txn details from contract to get metadataURI and user
                const txData = await this.escrowContract.transactions(id);
                console.log(`[Sync] Syncing Tx ${id.toString()} for Agent ${agent}...`);

                const savedTx = await TxRepo.create({
                    txId: Number(id),
                    agentAddress: agent.toLowerCase(),
                    userAddress: txData.user.toLowerCase(),
                    tokenAddress: token.toLowerCase(),
                    amount: amount.toString(),
                    serviceId: merchant.toLowerCase(),
                    metadataURI: txData.metadataURI,
                    status: 'Initiated'
                });
                console.log(`[Sync] Success: Transaction ${id.toString()} created in DB.`);

                // Invalidate Cache for the user who owns the agent
                const agentInDb = await AgentRepo.findByAddress(agent);
                if (agentInDb && agentInDb.user) {
                    await CacheService.del(`dashboard_stats_v3_${agentInDb.user}`);
                }
            } catch (err) {
                console.error(`[Sync] Error: Failed to sync TransactionCreated event for ID ${id.toString()}:`, err);
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

                    // Invalidate Cache
                    const agentInDb = await AgentRepo.findByAddress(tx.agentAddress);
                    if (agentInDb && agentInDb.user) {
                        await CacheService.del(`dashboard_stats_v3_${agentInDb.user}`);
                    }
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

    /**
     * Verify an ERC20 transaction on-chain
     * @param txHash Transaction hash
     * @param expectedAmount Amount expected (in human-readable units)
     * @param tokenSymbol Token symbol (MNEE, USDC, USDT)
     * @returns boolean indicating if transaction is valid
     */
    async verifyTransaction(txHash: string, expectedAmount: number, tokenSymbol: string): Promise<boolean> {
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);
            if (!receipt || receipt.status === 0) return false;

            const tx = await this.provider.getTransaction(txHash);
            if (!tx) return false;

            const receiver = (process.env.PAYMENT_RECEIVER_ADDRESS || '0x0000000000000000000000000000000000000000').toLowerCase();

            // Map symbol to address and decimals
            let tokenAddress = '';
            let decimals = 18;
            if (tokenSymbol === 'MNEE') {
                tokenAddress = process.env.MNEE_TOKEN_ADDRESS || '';
                decimals = 18;
            } else if (tokenSymbol === 'USDC') {
                tokenAddress = process.env.USDC_TOKEN_ADDRESS || '';
                decimals = 6;
            } else if (tokenSymbol === 'USDT') {
                tokenAddress = process.env.USDT_TOKEN_ADDRESS || '';
                decimals = 6;
            }

            // Basic check: Is it interacting with the correct token?
            if (tx.to?.toLowerCase() !== tokenAddress.toLowerCase()) {
                // If it's a direct eth/mnee transfer (for mock tokens that might be native)
                if (tokenSymbol === 'MNEE' && tx.to?.toLowerCase() === receiver) {
                    const value = parseFloat(ethers.formatEther(tx.value));
                    return value >= expectedAmount;
                }
                return false;
            }

            // Parse ERC20 Transfer(address,address,uint256)
            // Function selector for transfer: 0xa9059cbb
            if (tx.data.startsWith('0xa9059cbb')) {
                const iface = new ethers.Interface(['function transfer(address to, uint256 amount)']);
                const decoded = iface.decodeFunctionData('transfer', tx.data);

                const to = decoded[0].toLowerCase();
                const amount = decoded[1];
                const actualAmount = parseFloat(ethers.formatUnits(amount, decimals));

                return to === receiver && actualAmount >= expectedAmount;
            }

            return false;
        } catch (error) {
            console.error("Transaction verification failed:", error);
            return false;
        }
    }
}
