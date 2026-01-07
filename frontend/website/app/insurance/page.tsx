'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import {
    ShieldCheck,
    Droplets,
    ArrowUpRight,
    Plus,
    ShieldAlert,
    History
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Insurance() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground italic flex items-center gap-3">
                        Insurance Pool <span className="text-primary not-italic">& Coverage</span>
                    </h1>
                    <p className="text-muted-foreground mt-1">Staking MNEE liquidity to backstop the AgentGuard ecosystem.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* TVL and Stats */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-primary p-8 rounded-[2rem] shadow-2xl shadow-primary/30 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Total Value Locked</p>
                                    <h2 className="text-5xl font-black text-white tracking-tight">8,245,000 <span className="text-xl font-medium opacity-60 ml-1">MNEE</span></h2>
                                    <div className="flex items-center gap-2 pt-2">
                                        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 italic tracking-tighter">APY: 8.42%</span>
                                        <span className="text-white/40 text-xs font-medium italic select-none">Calculated via protocol fees</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-all flex items-center gap-2">
                                        <Plus className="w-5 h-5" /> Stake Liquidity
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600">SAFE</span>
                                </div>
                                <h4 className="text-sm font-bold text-muted-foreground uppercase mb-1 tracking-tight">Coverage Ratio</h4>
                                <p className="text-2xl font-black italic">42.5x</p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">System holds 42.5 MNEE for every 1 MNEE currently in escrow.</p>
                            </div>
                            <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Droplets className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold text-blue-600">LIQUID</span>
                                </div>
                                <h4 className="text-sm font-bold text-muted-foreground uppercase mb-1 tracking-tight">24h Fee Collection</h4>
                                <p className="text-2xl font-black italic">14,200</p>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Protocol fees collected and distributed to stakers from transaction volume.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Recent Pool Actions</h3>
                            <div className="bg-white border rounded-2xl divide-y shadow-sm">
                                {[
                                    { action: 'Fee Injection', amount: '+42.5 MNEE', time: '14 mins ago', icon: ShieldCheck, color: 'text-emerald-500' },
                                    { action: 'Payout Executed', amount: '-1,200 MNEE', time: '2 hours ago', icon: ShieldAlert, color: 'text-destructive' },
                                    { action: 'New Stake', amount: '+50,000 MNEE', time: '5 hours ago', icon: Plus, color: 'text-primary' },
                                    { action: 'Fee Injection', amount: '+12.4 MNEE', time: '1 day ago', icon: ShieldCheck, color: 'text-emerald-500' },
                                ].map((item, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg bg-secondary/50 ${item.color}`}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{item.action}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.time}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-black ${item.amount.startsWith('+') ? 'text-emerald-600' : 'text-destructive'}`}>
                                            {item.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="bg-white border rounded-2xl p-6 shadow-sm">
                            <h4 className="font-bold text-sm mb-4">Coverage Parameters</h4>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between text-xs font-bold uppercase mb-2">
                                        <span className="text-muted-foreground tracking-tighter">Default Fee Rate</span>
                                        <span className="text-primary tracking-tight italic text-sm">0.5%</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-1">
                                        <div className="bg-primary/30 h-1 rounded-full w-1/4"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-xs font-bold uppercase mb-2">
                                        <span className="text-muted-foreground tracking-tighter">Black Swan Buffer</span>
                                        <span className="text-primary tracking-tight italic text-sm">1.2M MNEE</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-1">
                                        <div className="bg-primary/30 h-1 rounded-full w-2/3"></div>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed">
                                Governance controls variables for the insurance pool. Current coverage is optimized for Base mainnet volume.
                            </p>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                            <h4 className="text-lg font-bold mb-4 italic tracking-wide">Secure by Design</h4>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Our insurance pool is hyper-collateralized by reputation bonds from active agents, creating a multi-layered safety net.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Permissionless Staking',
                                    'On-chain Proof of Reserves',
                                    'Automated Rebalancing'
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
