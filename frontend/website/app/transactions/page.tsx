'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import {
    ExternalLink,
    Search,
    Filter,
    ArrowUpRight
} from 'lucide-react';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useState } from 'react';
import Link from 'next/link';

export default function Transactions() {
    const [filterAgent, setFilterAgent] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Construct filters object only if values are present
    const filters = {
        ...(filterAgent && { agent: filterAgent }),
        ...(filterStatus && filterStatus !== 'All Status' && { status: filterStatus })
    };

    const { data: transactions, isLoading } = useTransactions(filters);

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
                            value={filterAgent}
                            onChange={(e) => setFilterAgent(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            className="bg-secondary/30 border rounded-xl py-2 px-4 text-sm focus:outline-none w-full md:w-40 font-bold text-muted-foreground appearance-none"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option>All Status</option>
                            <option value="Settled">Settled</option>
                            <option value="Escrowed">Escrowed</option>
                            <option value="Disputed">Disputed</option>
                        </select>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
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
                                        {transactions?.map((tx: Transaction) => (
                                            <tr key={tx._id} className="hover:bg-secondary/10 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-muted-foreground">{tx.hash.substring(0, 10)}...</span>
                                                        <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-foreground leading-tight">{tx.agent.substring(0, 8)}...</span>
                                                        <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{tx.to}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-black italic tracking-tight">{tx.value} MNEE</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {new Date(tx.timestamp).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${tx.status === 'Settled' ? 'bg-emerald-100 text-emerald-700' :
                                                        tx.status === 'Escrowed' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-destructive/10 text-destructive'
                                                        }`}>
                                                        <div className={`w-1 h-1 rounded-full ${tx.status === 'Settled' ? 'bg-emerald-500' :
                                                            tx.status === 'Escrowed' ? 'bg-blue-500' :
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
                                        {(!transactions || transactions.length === 0) && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                                    No transactions found matching your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-secondary/10 border-t flex items-center justify-between">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Showing {transactions?.length || 0} Transactions
                                </p>
                                <div className="flex items-center gap-2">
                                    <button className="px-4 py-1.5 border rounded-lg text-xs font-bold bg-white disabled:opacity-50" disabled>Previous</button>
                                    <button className="px-4 py-1.5 border rounded-lg text-xs font-bold bg-white hover:bg-secondary transition-all">Next</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
