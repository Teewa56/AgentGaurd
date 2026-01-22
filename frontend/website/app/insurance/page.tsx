'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import {
    ShieldCheck,
    Droplets,
    Plus,
    ShieldAlert,
    History,
    Wallet
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import {
    REPUTATION_BOND_ADDRESS,
    REPUTATION_BOND_ABI,
    MNEE_TOKEN_ADDRESS,
    ERC20_ABI
} from '@/lib/contracts';
import { parseEther, formatEther } from 'viem';
import { useAgents } from '@/hooks/useAgents';
import { useReadContract } from 'wagmi';

export default function Insurance() {
    const { address: userAddress } = useAccount();
    const { data: agents } = useAgents();
    const [selectedAgent, setSelectedAgent] = useState('');
    const [amount, setAmount] = useState('500');
    const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>();
    const [stakeHash, setStakeHash] = useState<`0x${string}` | undefined>();

    const { writeContractAsync } = useWriteContract();

    // 1. Check Allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: MNEE_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, REPUTATION_BOND_ADDRESS as `0x${string}`],
        query: { enabled: !!userAddress }
    });

    const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isLoading: isStaking, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({ hash: stakeHash });

    const handleStake = async () => {
        if (!selectedAgent || !amount) return;
        const amountWei = parseEther(amount);

        try {
            // Check if we need approval
            if (!allowance || (allowance as bigint) < amountWei) {
                setStep('approving');
                const hash = await writeContractAsync({
                    address: MNEE_TOKEN_ADDRESS as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: 'approve',
                    args: [REPUTATION_BOND_ADDRESS as `0x${string}`, amountWei],
                });
                setApproveHash(hash);
            } else {
                handleActualStake();
            }
        } catch (error) {
            console.error("Stake pre-flight failed:", error);
            setStep('idle');
        }
    };

    const handleActualStake = async () => {
        setStep('staking');
        try {
            const amountWei = parseEther(amount);
            const hash = await writeContractAsync({
                address: REPUTATION_BOND_ADDRESS as `0x${string}`,
                abi: REPUTATION_BOND_ABI,
                functionName: 'stakeBond',
                args: [selectedAgent as `0x${string}`, amountWei],
            });
            setStakeHash(hash);
        } catch (error) {
            console.error("Actual stake failed:", error);
            setStep('idle');
        }
    }

    useEffect(() => {
        if (isApproveSuccess) {
            refetchAllowance().then(() => handleActualStake());
        }
    }, [isApproveSuccess]);

    useEffect(() => {
        if (isStakeSuccess) {
            alert('Stake Successful!');
            setStep('idle');
            setAmount('');
            setStakeHash(undefined);
            setApproveHash(undefined);
        }
    }, [isStakeSuccess]);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground italic flex items-center gap-3">
                        Reputation <span className="text-primary not-italic">& Staking</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Back your agents with MNEE to increase their trust score and limit.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* TVL and Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border-2 border-primary/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                            <div className="relative z-10 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Select Agent</label>
                                        <select
                                            value={selectedAgent}
                                            onChange={(e) => setSelectedAgent(e.target.value)}
                                            className="w-full bg-secondary/30 border rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        >
                                            <option value="">Choose an agent...</option>
                                            {agents?.map(agent => (
                                                <option key={agent.address} value={agent.address}>
                                                    {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Amount (MNEE)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="500"
                                            className="w-full bg-secondary/30 border rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleStake}
                                    disabled={!selectedAgent || !amount || isApproving || isStaking || step !== 'idle'}
                                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50"
                                >
                                    {isApproving ? 'Approving MNEE...' :
                                        isStaking ? 'Confirming Stake...' :
                                            'Stake Reputation Bond'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600">ACTIVE</span>
                                </div>
                                <h4 className="text-sm font-bold text-muted-foreground uppercase mb-1 tracking-tight">Your Staked Pool</h4>
                                <p className="text-2xl font-black italic">
                                    {agents?.reduce((acc, a) => acc + Number(formatEther(BigInt(a.stakedMnee || '0'))), 0).toLocaleString()} MNEE
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Total MNEE backing your active agents across the protocol.</p>
                            </div>
                            <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Droplets className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-600">STABLE</span>
                                </div>
                                <h4 className="text-sm font-bold text-muted-foreground uppercase mb-1 tracking-tight">Avg Reputation</h4>
                                <p className="text-2xl font-black italic">
                                    {agents?.length ? Math.round(agents.reduce((acc, a) => acc + (a.reputation || 0), 0) / agents.length) : '500'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Collective trust score of your operational agent fleet.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Staking History</h3>
                            <div className="bg-white border rounded-2xl divide-y shadow-sm">
                                {agents?.filter(a => BigInt(a.stakedMnee || '0') > BigInt(0)).map((agent, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-secondary/50 text-primary">
                                                <Wallet className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">Agent: {agent.address.slice(0, 8)}...{agent.address.slice(-4)}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Active Stake</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-emerald-600">
                                            +{formatEther(BigInt(agent.stakedMnee || '0'))} MNEE
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                            <ShieldAlert className="w-8 h-8 mb-4 opacity-80" />
                            <h4 className="text-lg font-bold mb-2">Bond Logic</h4>
                            <p className="text-blue-100 text-sm leading-relaxed mb-4">
                                Reputation Bonds are required to enable escrow payments. If an agent violates its charter, its bond can be slashed to refund victims.
                            </p>
                            <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-80">
                                    <span>Min Req. Bond</span>
                                    <span>~{amount} MNEE</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                            <h4 className="text-lg font-bold mb-4 italic tracking-wide">Secure by Design</h4>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Staking not only unlocks higher spending limits but also allows you to earn protocol yield in future versions.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Non-Custodial',
                                    'Permissionless',
                                    'Slashed on Policy Violation'
                                ].map((point, i) => (
                                    <li key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-80">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
