'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import {
    History,
    ArrowUpRight,
    ExternalLink,
    ShieldCheck,
    Search,
    ArrowDownWideArrow,
    Filter
} from 'lucide-react';

export default function Transactions() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight italic">Audit <span className="text-primary not-italic">Logs</span></h1>
                        <p className="text-muted-foreground mt-1">Full immutable history of agent-driven transactions and protocol actions.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold hover:bg-secondary transition-all">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            placeholder="Search by Tx Hash, Agent, or Merchant..."
                            className="w-full bg-secondary/30 border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select className="bg-secondary/30 border rounded-xl py-2 px-4 text-sm focus:outline-none w-full md:w-40 font-bold text-muted-foreground appearance-none">
                            <option>All Agents</option>
                            <option>Procurement Bot</option>
                            <option>Marketing v2</option>
                        </select>
                        <select className="bg-secondary/30 border rounded-xl py-2 px-4 text-sm focus:outline-none w-full md:w-40 font-bold text-muted-foreground appearance-none">
                            <option>All Status</option>
                            <option>Settled</option>
                            <option>Escrowed</option>
                            <option>Disputed</option>
                        </select>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-secondary/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-5">Transaction Hash</th>
                                    <th className="px-6 py-5">Agent / Merchant</th>
                                    <th className="px-6 py-5">Amount</th>
                                    <th className="px-6 py-5">Timestamp</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {[
                                    { hash: '0x328a...b910', agent: 'Procurement Bot A', merchant: 'aws.amazon.com', amount: '150 MNEE', time: '12 mins ago', status: 'Settled' },
                                    { hash: '0x192d...f421', agent: 'Marketing Exec v2', merchant: 'ad-engine.net', amount: '1,200 MNEE', time: '4 hours ago', status: 'In Escrow' },
                                    { hash: '0x902a...c011', agent: 'Procurement Bot A', merchant: 'stripe.com', amount: '45 MNEE', time: '6 hours ago', status: 'Settled' },
                                    { hash: '0x442c...e890', agent: 'Inventory Replenisher', merchant: 'dhl-logistics.com', amount: '840 MNEE', time: '1 day ago', status: 'Disputed', urgent: true },
                                    { hash: '0x221b...a342', agent: 'Marketing Exec v2', merchant: 'openai.com', amount: '200 MNEE', time: '2 days ago', status: 'Settled' },
                                ].map((tx, i) => (
                                    <tr key={i} className="hover:bg-secondary/10 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground">{tx.hash}</span>
                                                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground leading-tight">{tx.agent}</span>
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{tx.merchant}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-black italic tracking-tight">{tx.amount}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-medium text-muted-foreground">{tx.time}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${tx.status === 'Settled' ? 'bg-emerald-100 text-emerald-700' :
                                                    tx.status === 'In Escrow' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-destructive/10 text-destructive'
                                                }`}>
                                                <div className={`w-1 h-1 rounded-full ${tx.status === 'Settled' ? 'bg-emerald-500' :
                                                        tx.status === 'In Escrow' ? 'bg-blue-500' :
                                                            'bg-destructive'
                                                    }`}></div>
                                                {tx.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="bg-secondary/50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10">
                                                <ArrowUpRight className="w-4 h-4 text-primary" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-secondary/10 border-t flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Showing 5 of 1,240 Transactions</p>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-1.5 border rounded-lg text-xs font-bold bg-white disabled:opacity-50" disabled>Previous</button>
                            <button className="px-4 py-1.5 border rounded-lg text-xs font-bold bg-white hover:bg-secondary transition-all">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
