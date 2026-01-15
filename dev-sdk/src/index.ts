import { Address, PublicClient, WalletClient, parseEther } from 'viem';
import { AGENT_REGISTRY_ABI, ESCROW_PAYMENT_ABI, REPUTATION_BOND_ABI, ERC20_ABI } from './abis';

export interface AgentGuardConfig {
    agentRegistryAddress: Address;
    escrowPaymentAddress: Address;
    reputationBondAddress: Address;
    publicClient: PublicClient;
    walletClient: WalletClient;
}

export interface RegisterAgentParams {
    agentAddress: Address;
    spendingLimitPerTx: bigint;
    monthlySpendingLimit: bigint;
    dailySpendingLimit: bigint;
}

export interface InitiatePaymentParams {
    merchantAddress: Address;
    tokenAddress: Address;
    amount: bigint;
    metadataURI: string;
}

export interface StakeBondParams {
    agentAddress: Address;
    amount: bigint;
}

/**
 * AgentGuard SDK Client
 * 
 * A TypeScript SDK for integrating AgentGuard payment infrastructure into AI agents.
 * Similar to Stripe for traditional payments, but designed for autonomous agents.
 * 
 * @example
 * ```typescript
 * const client = new AgentGuardClient({
 *   agentRegistryAddress: '0x...',
 *   escrowPaymentAddress: '0x...',
 *   reputationBondAddress: '0x...',
 *   publicClient,
 *   walletClient
 * });
 * 
 * // Register an agent
 * await client.registry.registerAgent({
 *   agentAddress: '0x...',
 *   spendingLimitPerTx: parseEther('100'),
 *   monthlySpendingLimit: parseEther('2000'),
 *   dailySpendingLimit: parseEther('200')
 * });
 * 
 * // Initiate a payment
 * const txId = await client.payments.initiate({
 *   merchantAddress: '0x...',
 *   tokenAddress: '0x...', // USDC, USDT, or MNEE
 *   amount: parseEther('50'),
 *   metadataURI: 'ipfs://...'
 * });
 * ```
 */
export class AgentGuardClient {
    private config: AgentGuardConfig;

    constructor(config: AgentGuardConfig) {
        this.config = config;
    }

    /**
     * Registry operations for managing agent identities and charters
     */
    get registry() {
        return {
            /**
             * Register a new agent with spending limits
             */
            registerAgent: async (params: RegisterAgentParams): Promise<Address> => {
                const { request } = await this.config.publicClient.simulateContract({
                    address: this.config.agentRegistryAddress,
                    abi: AGENT_REGISTRY_ABI,
                    functionName: 'registerAgent',
                    args: [
                        params.agentAddress,
                        params.spendingLimitPerTx,
                        params.monthlySpendingLimit,
                        params.dailySpendingLimit,
                    ],
                    account: this.config.walletClient.account!,
                });

                return await this.config.walletClient.writeContract(request);
            },

            /**
             * Update an existing agent's charter (spending limits)
             */
            updateCharter: async (params: RegisterAgentParams): Promise<Address> => {
                const { request } = await this.config.publicClient.simulateContract({
                    address: this.config.agentRegistryAddress,
                    abi: AGENT_REGISTRY_ABI,
                    functionName: 'updateCharter',
                    args: [
                        params.agentAddress,
                        params.spendingLimitPerTx,
                        params.monthlySpendingLimit,
                        params.dailySpendingLimit,
                    ],
                    account: this.config.walletClient.account!,
                });

                return await this.config.walletClient.writeContract(request);
            },

            /**
             * Check if an agent is active
             */
            isAgentActive: async (agentAddress: Address): Promise<boolean> => {
                return await this.config.publicClient.readContract({
                    address: this.config.agentRegistryAddress,
                    abi: AGENT_REGISTRY_ABI,
                    functionName: 'isAgentActive',
                    args: [agentAddress],
                }) as boolean;
            },
        };
    }

    /**
     * Payment operations for initiating and managing transactions
     */
    get payments() {
        return {
            /**
             * Initiate a new payment transaction
             * The agent must approve the token first
             */
            initiate: async (params: InitiatePaymentParams): Promise<bigint> => {
                // First, approve the token
                const { request: approveRequest } = await this.config.publicClient.simulateContract({
                    address: params.tokenAddress,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [this.config.escrowPaymentAddress, params.amount],
                    account: this.config.walletClient.account!,
                });

                await this.config.walletClient.writeContract(approveRequest);

                // Then initiate the transaction
                const { request } = await this.config.publicClient.simulateContract({
                    address: this.config.escrowPaymentAddress,
                    abi: ESCROW_PAYMENT_ABI,
                    functionName: 'initiateTransaction',
                    args: [params.merchantAddress, params.tokenAddress, params.amount, params.metadataURI],
                    account: this.config.walletClient.account!,
                });

                const hash = await this.config.walletClient.writeContract(request);

                // Wait for transaction and get the transaction ID from events
                const receipt = await this.config.publicClient.waitForTransactionReceipt({ hash });
                const log = receipt.logs.find(log => log.address.toLowerCase() === this.config.escrowPaymentAddress.toLowerCase());

                // Parse the transaction ID from the event (first indexed parameter after event signature)
                return log?.topics[1] ? BigInt(log.topics[1]) : 0n;
            },

            /**
             * Settle a transaction after the dispute window
             */
            settle: async (txId: bigint): Promise<Address> => {
                const { request } = await this.config.publicClient.simulateContract({
                    address: this.config.escrowPaymentAddress,
                    abi: ESCROW_PAYMENT_ABI,
                    functionName: 'settleTransaction',
                    args: [txId],
                    account: this.config.walletClient.account!,
                });

                return await this.config.walletClient.writeContract(request);
            },

            /**
             * Dispute a transaction within the dispute window
             */
            dispute: async (txId: bigint): Promise<Address> => {
                const { request } = await this.config.publicClient.simulateContract({
                    address: this.config.escrowPaymentAddress,
                    abi: ESCROW_PAYMENT_ABI,
                    functionName: 'disputeTransaction',
                    args: [txId],
                    account: this.config.walletClient.account!,
                });

                return await this.config.walletClient.writeContract(request);
            },
        };
    }

    /**
     * Bond operations for staking and managing reputation
     */
    get bonds() {
        return {
            /**
             * Stake MNEE tokens as a bond for an agent
             */
            stake: async (params: StakeBondParams): Promise<Address> => {
                // First approve the bond contract
                const mneeTokenAddress = await this.config.publicClient.readContract({
                    address: this.config.reputationBondAddress,
                    abi: REPUTATION_BOND_ABI,
                    functionName: 'MNEE_TOKEN',
                }) as Address;

                const { request: approveRequest } = await this.config.publicClient.simulateContract({
                    address: mneeTokenAddress,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [this.config.reputationBondAddress, params.amount],
                    account: this.config.walletClient.account!,
                });

                await this.config.walletClient.writeContract(approveRequest);

                // Then stake the bond
                const { request } = await this.config.publicClient.simulateContract({
                    address: this.config.reputationBondAddress,
                    abi: REPUTATION_BOND_ABI,
                    functionName: 'stakeBond',
                    args: [params.agentAddress, params.amount],
                    account: this.config.walletClient.account!,
                });

                return await this.config.walletClient.writeContract(request);
            },

            /**
             * Get required bond amount for an agent
             */
            getRequiredBond: async (agentAddress: Address): Promise<bigint> => {
                return await this.config.publicClient.readContract({
                    address: this.config.reputationBondAddress,
                    abi: REPUTATION_BOND_ABI,
                    functionName: 'getRequiredBond',
                    args: [agentAddress],
                }) as bigint;
            },

            /**
             * Check if agent has sufficient bond
             */
            hasSufficientBond: async (agentAddress: Address): Promise<boolean> => {
                return await this.config.publicClient.readContract({
                    address: this.config.reputationBondAddress,
                    abi: REPUTATION_BOND_ABI,
                    functionName: 'hasSufficientBond',
                    args: [agentAddress],
                }) as boolean;
            },
        };
    }
}

export * from './abis';
