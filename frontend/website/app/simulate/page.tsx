'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import {
    Send,
    ShieldCheck,
    AlertCircle,
    ArrowRight,
    Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import api from '@/lib/api';
import {
    AGENT_REGISTRY_ADDRESS,
    AGENT_REGISTRY_ABI,
    ESCROW_PAYMENT_ADDRESS,
    ESCROW_PAYMENT_ABI,
    REPUTATION_BOND_ADDRESS,
    REPUTATION_BOND_ABI,
    MNEE_TOKEN_ADDRESS,
    USDC_TOKEN_ADDRESS,
    USDT_TOKEN_ADDRESS,
    ERC20_ABI
} from '@/lib/contracts';
import { parseUnits, formatUnits } from 'viem';
import { useAgents } from '@/hooks/useAgents';
import { useReadContract } from 'wagmi';

export default function Simulate() {
    const { address: currentWallet } = useAccount();
    const { data: agents } = useAgents();
    const [merchant, setMerchant] = useState('0x1..........');
    const [amount, setAmount] = useState('10');
    const [metadata, setMetadata] = useState('{"item": "AI GPU Credits", "service": "HyperCompute"}');
    const [selectedTokenAddr, setSelectedTokenAddr] = useState(MNEE_TOKEN_ADDRESS);
    const [targetAgent, setTargetAgent] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    // Sync target agent based on connection or owner's agents
    useEffect(() => {
        const currentIsAgent = agents?.some(a => a.address.toLowerCase() === currentWallet?.toLowerCase());
        if (currentWallet && currentIsAgent) {
            setTargetAgent(currentWallet);
        } else if (agents && agents.length > 0 && !targetAgent) {
            setTargetAgent(agents[0].address);
        }
    }, [currentWallet, agents, targetAgent]);

    const TOKENS = [
        { name: 'MNEE', address: MNEE_TOKEN_ADDRESS, decimals: 18 },
        { name: 'USDC', address: USDC_TOKEN_ADDRESS, decimals: 6 },
        { name: 'USDT', address: USDT_TOKEN_ADDRESS, decimals: 6 },
    ];

    const currentToken = TOKENS.find(t => t.address === selectedTokenAddr) || TOKENS[0];

    // 1. Find who owns THIS target agent
    const { data: agentOwner } = useReadContract({
        address: AGENT_REGISTRY_ADDRESS as `0x${string}`,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'agentToUser',
        args: targetAgent ? [targetAgent as `0x${string}`] : undefined,
    });

    // 2. Check Owner's Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: selectedTokenAddr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: agentOwner ? [agentOwner as `0x${string}`, ESCROW_PAYMENT_ADDRESS as `0x${string}`] : undefined,
    });

    // 3. Check Staking Status
    const { data: hasSufficientBond, refetch: refetchBond } = useReadContract({
        address: REPUTATION_BOND_ADDRESS as `0x${string}`,
        abi: REPUTATION_BOND_ABI,
        functionName: 'hasSufficientBond',
        args: targetAgent ? [targetAgent as `0x${string}`] : undefined,
    });

    const { writeContract, data: hash, error: writeError, isPending: isTxPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

    const isRegisteredAgent = currentWallet?.toLowerCase() === targetAgent?.toLowerCase();
    const isOwner = currentWallet?.toLowerCase() === (agentOwner as string)?.toLowerCase();

    const [uiError, setUiError] = useState<string | null>(null);

    useEffect(() => {
        if (isSuccess) {
            refetchAllowance();
            refetchBond();
        }
    }, [isSuccess]);

    useEffect(() => {
        const error = writeError || confirmError;
        if (error) {
            console.error("Contract Error:", error);
            setUiError(error.message || "An unexpected error occurred during the transaction.");
        }
    }, [writeError, confirmError]);

    const needsApproval = allowance !== undefined && amount ? (parseFloat(amount) > 0 && (allowance as bigint) < parseUnits(amount, currentToken.decimals)) : false;

    const handleApprove = () => {
        try {
            setUiError(null);
            if (!isOwner) {
                setUiError("Only the Owner wallet can grant token allowance.");
                return;
            }

            writeContract({
                address: selectedTokenAddr as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [ESCROW_PAYMENT_ADDRESS as `0x${string}`, parseUnits(amount || "1000000", currentToken.decimals)],
            });
        } catch (error: any) {
            setUiError(error.message || "Failed to approve token.");
        }
    };

    const handleSimulate = async () => {
        try {
            setUiError(null);

            // Role Contextual Logic
            if (needsApproval) {
                if (isOwner) {
                    handleApprove();
                } else {
                    setUiError(`Owner Wallet (${(agentOwner as string)?.slice(0, 10)}...) must grant allowance. Please switch wallets.`);
                }
                return;
            }

            if (!isRegisteredAgent) {
                setUiError(`Must be connected as Agent (${targetAgent?.slice(0, 10)}...) to simulate.`);
                return;
            }

            if (!hasSufficientBond && selectedTokenAddr === MNEE_TOKEN_ADDRESS) {
                setUiError("Insufficient reputation bond for this agent.");
                return;
            }

            // Basic Validation
            if (!merchant.startsWith('0x') || merchant.length !== 42) {
                setUiError("Invalid Merchant Address format.");
                return;
            }

            if (!amount || parseFloat(amount) <= 0) {
                setUiError("Amount must be greater than 0.");
                return;
            }

            let metadataJSON;
            try {
                metadataJSON = JSON.parse(metadata);
            } catch (e) {
                setUiError("Invalid Metadata JSON format.");
                return;
            }

            // 1. Upload metadata to IPFS via backend relay
            setIsUploading(true);
            let metadataURI;
            try {
                const response = await api.post('/ipfs/upload', { metadata: metadataJSON });
                metadataURI = response.data.cid;
            } catch (err: any) {
                setUiError("Failed to upload metadata to IPFS: " + (err.response?.data?.error || err.message));
                return;
            } finally {
                setIsUploading(false);
            }

            // 2. Initiate transaction on-chain
            writeContract({
                address: ESCROW_PAYMENT_ADDRESS as `0x${string}`,
                abi: ESCROW_PAYMENT_ABI,
                functionName: 'initiateTransaction',
                args: [
                    merchant as `0x${string}`,
                    selectedTokenAddr as `0x${string}`,
                    parseUnits(amount, currentToken.decimals),
                    metadataURI
                ],
            });
        } catch (error: any) {
            console.error(error);
            setUiError(error.message || "Failed to initiate simulation.");
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transaction Simulation</h1>
                    <p className="text-muted-foreground mt-1 text-sm italic">
                        Test the AgentGuard Escrow lifecycle. Note: This must be called from an Agent's wallet address.
                    </p>
                </div>

                {!isRegisteredAgent && !needsApproval && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-amber-900">Agent Wallet Required</h4>
                            <p className="text-sm text-amber-800 mt-1">
                                You are connected as a different wallet. To simulate a transaction from <span className="font-mono font-bold">{targetAgent?.slice(0, 10)}...</span>, please switch to its wallet.
                            </p>
                        </div>
                    </div>
                )}

                {needsApproval && (
                    <div className={`bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4 ${isOwner ? 'animate-pulse ring-2 ring-blue-500/20' : ''}`}>
                        <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-blue-900">Owner Authorization Required</h4>
                            <p className="text-sm text-blue-800 mt-1">
                                {isOwner
                                    ? `You are the Owner! Click "Grant Approval" below to authorize ${currentToken.name} spending for this agent.`
                                    : `The protocol pulls funds from the Owner's wallet: ${agentOwner as string}. Please switch to that wallet to grant allowance.`
                                }
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white border-2 border-primary/10 rounded-[2.5rem] p-10 shadow-xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Send className="w-32 h-32" />
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Acting Agent</label>
                            <select
                                value={targetAgent}
                                onChange={(e) => setTargetAgent(e.target.value)}
                                className="w-full bg-secondary/30 border rounded-2xl py-3 px-4 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                {agents?.map(a => (
                                    <option key={a.address} value={a.address}>
                                        {a.name} ({a.address.slice(0, 10)}...)
                                    </option>
                                ))}
                                {!agents?.some(a => a.address.toLowerCase() === targetAgent.toLowerCase()) && targetAgent && (
                                    <option value={targetAgent}>{targetAgent.slice(0, 10)}... (Connected)</option>
                                )}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Merchant/Service Address</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={merchant}
                                    onChange={(e) => setMerchant(e.target.value)}
                                    className="w-full bg-secondary/30 border rounded-2xl py-3 pl-12 pr-4 font-mono text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Token Selection</label>
                                <select
                                    value={selectedTokenAddr}
                                    onChange={(e) => setSelectedTokenAddr(e.target.value)}
                                    className="w-full bg-secondary/30 border rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                >
                                    {TOKENS.map(t => (
                                        <option key={t.address} value={t.address}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount ({currentToken.name})</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-secondary/30 border rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Escrow Window</label>
                                <div className="w-full bg-secondary/20 border rounded-2xl py-3 px-4 text-sm text-muted-foreground italic">
                                    24 Hours (Static Dispute Period)
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transaction Metadata (IPFS/JSON)</label>
                            <textarea
                                rows={2}
                                value={metadata}
                                onChange={(e) => setMetadata(e.target.value)}
                                className="w-full bg-secondary/30 border rounded-2xl py-3 px-4 font-mono text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>

                        {uiError && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3 text-destructive animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p className="text-xs font-bold leading-tight">{uiError}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSimulate}
                            disabled={(needsApproval ? !isOwner : !isRegisteredAgent) || isTxPending || isConfirming || isUploading}
                            className={`w-full py-4 font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${needsApproval
                                ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
                                : 'bg-primary text-white shadow-primary/20 hover:scale-[1.01] active:scale-[0.98]'
                                }`}
                        >
                            {isUploading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                                    Uploading to IPFS...
                                </>
                            ) : isTxPending ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                                    Signing Transaction...
                                </>
                            ) : isConfirming ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                                    Confirming on Chain...
                                </>
                            ) : isSuccess ? (
                                <>
                                    <ShieldCheck className="w-5 h-5" /> Success!
                                </>
                            ) : (
                                <>
                                    {needsApproval
                                        ? (isOwner ? `Grant ${currentToken.name} Approval` : 'Switch to Owner to Approve')
                                        : (isRegisteredAgent ? 'Simulate Agent Purchase' : 'Switch to Agent Wallet')
                                    }
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                    <h3 className="font-bold flex items-center gap-2 mb-4 italic italic">
                        <ShieldCheck className="w-5 h-5 text-blue-400" /> Protocol Flow
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start opacity-60">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                            <p className="text-xs leading-relaxed">Agent initiates transaction with metadata (Service URL, Item description).</p>
                        </div>
                        <div className="flex gap-4 items-start opacity-60">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                            <p className="text-xs leading-relaxed">EscrowPayment locks {currentToken.name} from User's wallet for 24 hours.</p>
                        </div>
                        <div className="flex gap-4 items-start opacity-60 border-l-2 border-blue-500/30 ml-3 pl-7 py-2">
                            <p className="text-xs leading-relaxed italic text-blue-300">During this window, if the AI agent performs an unauthorized action, the User can file a dispute.</p>
                        </div>
                        <div className="flex gap-4 items-start opacity-60">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                            <p className="text-xs leading-relaxed">After 24h, anyone can call 'Settle' to release funds to the merchant.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
