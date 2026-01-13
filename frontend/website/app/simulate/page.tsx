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
import {
    ESCROW_PAYMENT_ADDRESS,
    ESCROW_PAYMENT_ABI,
    MNEE_TOKEN_ADDRESS,
    ERC20_ABI
} from '@/lib/contracts';
import { parseEther } from 'viem';
import { useAgents } from '@/hooks/useAgents';

export default function Simulate() {
    const { address: currentWallet } = useAccount();
    const { data: agents } = useAgents();
    const [merchant, setMerchant] = useState('0x1..........');
    const [amount, setAmount] = useState('10');
    const [metadata, setMetadata] = useState('{"item": "AI GPU Credits", "service": "HyperCompute"}');

    const { writeContract, data: hash, error: writeError, isPending: isTxPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

    // Find if the current wallet is an agent
    const isRegisteredAgent = agents?.some(a => a.address.toLowerCase() === currentWallet?.toLowerCase());

    const [uiError, setUiError] = useState<string | null>(null);

    useEffect(() => {
        if (isSuccess) {
            alert("Transaction Initiated Successfully!");
        }
    }, [isSuccess]);

    useEffect(() => {
        const error = writeError || confirmError;
        if (error) {
            console.error("Contract Error:", error);
            setUiError(error.message || "An unexpected error occurred during the transaction.");
        }
    }, [writeError, confirmError]);

    const handleSimulate = async () => {
        try {
            setUiError(null);

            if (!isRegisteredAgent) {
                setUiError("You must be connected with an Agent's Wallet to initiate a transaction.");
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

            try {
                JSON.parse(metadata);
            } catch (e) {
                setUiError("Invalid Metadata JSON format.");
                return;
            }

            writeContract({
                address: ESCROW_PAYMENT_ADDRESS as `0x${string}`,
                abi: ESCROW_PAYMENT_ABI,
                functionName: 'initiateTransaction',
                args: [
                    merchant as `0x${string}`,
                    parseEther(amount),
                    metadata
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

                {!isRegisteredAgent && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                        <div>
                            <h4 className="font-bold text-amber-900">Agent Identity Required</h4>
                            <p className="text-sm text-amber-800 mt-1">
                                Your current wallet ({currentWallet?.slice(0, 10)}...) is not registered as an Agent.
                                Switch to a wallet you registered in the "Registry" tab to simulate a transaction.
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
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount (MNEE)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-secondary/30 border rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Escrow Window</label>
                                <div className="w-full bg-secondary/20 border rounded-2xl py-3 px-4 text-sm text-muted-foreground italic">
                                    24 Hours (Static)
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
                            disabled={!isRegisteredAgent || isTxPending || isConfirming}
                            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isTxPending ? (
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
                                    <ShieldCheck className="w-5 h-5" /> Transaction Success!
                                </>
                            ) : (
                                <>
                                    Simulate Agent Purchase <ArrowRight className="w-5 h-5" />
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
                            <p className="text-xs leading-relaxed">EscrowPayment locks MNEE from User's wallet for 24 hours.</p>
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
