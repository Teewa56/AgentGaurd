'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import {
    Shield,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useStats } from '@/hooks/useStats';
import { useAgents } from '@/hooks/useAgents';
import { formatEther } from 'viem';
import { useTransactions } from '@/hooks/useTransactions';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { getTokenSymbol } from '@/lib/contracts';

export default function Dashboard() {
    const { data: stats, isLoading: statsLoading } = useStats();
    const { data: agents, isLoading: agentsLoading } = useAgents();
    const { data: transactions, isLoading: txLoading } = useTransactions();

    if (statsLoading || agentsLoading || txLoading) {
        return <DashboardSkeleton />;
    }

    const safeBigInt = (val: any) => {
        if (!val) return 0n;
        if (typeof val === 'bigint') return val;
        // Remove commas and other non-numeric characters before parsing
        const clean = String(val).replace(/[^0-9]/g, '');
        return BigInt(clean || '0');
    };

    // Default to 0/empty if data fetch fails or is pending
    const displayStats = [
        { label: 'Total Reputation', value: stats?.totalReputation || 0, icon: Shield, color: 'text-blue-600', trend: 'Global Score' },
        { label: 'Total Staked', value: `${stats?.totalStaked ? Number(formatEther(safeBigInt(stats.totalStaked))).toLocaleString() : 0} MNEE`, icon: TrendingUp, color: 'text-indigo-600', trend: 'Across agents' },
        { label: 'Active Disputes', value: stats?.activeDisputes || 0, icon: AlertTriangle, color: 'text-amber-600', trend: 'Requires attention' },
        { label: 'Success Rate', value: `${stats?.successRate || 100}%`, icon: CheckCircle2, color: 'text-emerald-600', trend: `from ${stats?.totalTransactions || 0} txs` },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground mt-1">Welcome back. Here is what's happening with your agents today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayStats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg bg-secondary/50 ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                    Real-time
                                </span>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                            <p className="text-xs mt-2 font-medium text-emerald-600 flex items-center gap-1">
                                {stat.trend}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Agents */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Your Active Agents</h2>
                            <Link href="/registry" className="text-sm font-semibold text-primary hover:underline">View all</Link>
                        </div>
                        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/30 text-xs font-bold uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Agent Address</th>
                                        <th className="px-6 py-4">Daily Limit</th>
                                        <th className="px-6 py-4">Spent (Monthly)</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {agents?.slice(0, 5).map((agent, i) => (
                                        <tr key={agent._id} className="hover:bg-secondary/10 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-xs font-mono">{agent.address.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 text-sm">{formatEther(BigInt(agent.dailySpendingLimit || '0'))} MNEE</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex flex-col gap-1 w-24">
                                                    <div className="w-full bg-secondary rounded-full h-1">
                                                        <div className={`h-1 rounded-full bg-primary`} style={{ width: `${Math.min((Number(formatEther(BigInt(agent.usage?.monthly || '0'))) / Number(formatEther(BigInt(agent.monthlySpendingLimit || '1')))) * 100, 100)}%` }}></div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">{formatEther(BigInt(agent.usage?.monthly || '0'))} / {formatEther(BigInt(agent.monthlySpendingLimit || '0'))}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${agent.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    <div className={`w-1 h-1 rounded-full ${agent.isActive ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                                                    {agent.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!agents || agents.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                                                No agents registered yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Recent Activity</h2>
                        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
                            {transactions?.slice(0, 5).map((activity, i) => (
                                <div key={activity._id} className="flex gap-4 relative">
                                    {i !== 4 && <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-secondary"></div>}
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 ${activity.status === 'Disputed' ? 'bg-destructive/10' : 'bg-primary/10'
                                        }`}>
                                        <Clock className={`w-3 h-3 ${activity.status === 'Disputed' ? 'text-destructive' : 'text-primary'}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold">{activity.status} Transaction</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {activity.agent.substring(0, 6)}... paid {activity.value} {getTokenSymbol(activity.token)} to {activity.to.substring(0, 8)}...
                                        </p>
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase mt-1 block tracking-wider">
                                            {new Date(activity.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {(!transactions || transactions.length === 0) && (
                                <p className="text-sm text-center text-muted-foreground">No recent activity.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function DashboardSkeleton() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white border rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <Skeleton className="h-9 w-9 rounded-lg" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-5 w-32 mb-1" />
                            <Skeleton className="h-8 w-24 mb-2" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Agents Skeleton */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b bg-secondary/30 flex justify-between gap-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                            <div className="divide-y">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between gap-4">
                                        <Skeleton className="h-5 w-24" />
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Skeleton */}
                    <div className="space-y-6">
                        <Skeleton className="h-7 w-40" />
                        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}