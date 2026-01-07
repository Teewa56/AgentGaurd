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

export default function Dashboard() {
    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground mt-1">Welcome back. Here is what's happening with your agents today.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Reputation', value: '742', icon: Shield, color: 'text-blue-600', trend: '+12 this week' },
                        { label: 'Total Staked', value: '25,400 MNEE', icon: trendingup, color: 'text-indigo-600', trend: 'Required: 18k' },
                        { label: 'Active Disputes', value: '2', icon: alerttriangle, color: 'text-amber-600', trend: '1 needing action' },
                        { label: 'Success Rate', value: '98.4%', icon: checkcircle2, color: 'text-emerald-600', trend: 'from 240 txs' },
                    ].map((stat, i) => (
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
                            <button className="text-sm font-semibold text-primary hover:underline">View all</button>
                        </div>
                        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/30 text-xs font-bold uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Agent Name</th>
                                        <th className="px-6 py-4">Daily Limit</th>
                                        <th className="px-6 py-4">Spent (24h)</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {[
                                        { name: 'Procurement Bot A', limit: '500 MNEE', spent: '120 MNEE', status: 'Healthy' },
                                        { name: 'Marketing Exec v2', limit: '2000 MNEE', spent: '1850 MNEE', status: 'Limit Near' },
                                        { name: 'Inventory Replenisher', limit: '1000 MNEE', spent: '0 MNEE', status: 'Healthy' },
                                    ].map((agent, i) => (
                                        <tr key={i} className="hover:bg-secondary/10 transition-colors">
                                            <td className="px-6 py-4 font-semibold">{agent.name}</td>
                                            <td className="px-6 py-4 text-sm">{agent.limit}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex flex-col gap-1 w-24">
                                                    <div className="w-full bg-secondary rounded-full h-1">
                                                        <div className={`h-1 rounded-full ${agent.status === 'Limit Near' ? 'bg-amber-500 w-[92%]' : 'bg-primary w-[24%]'}`}></div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">{agent.spent}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${agent.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    <div className={`w-1 h-1 rounded-full ${agent.status === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                    {agent.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Recent Activity</h2>
                        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
                            {[
                                { type: 'settlement', title: 'Transaction Settled', desc: 'Agent: Procurement Bot A', time: '12 mins ago' },
                                { type: 'stake', title: 'Bond Increased', desc: 'Added 500 MNEE to Marketing Exec', time: '2 hours ago' },
                                { type: 'dispute', title: 'Dispute Filed', desc: 'User filed dispute for TX #1042', time: '5 hours ago', urgent: true },
                                { type: 'registry', title: 'Agent Registered', desc: 'New agent "Customer Support Alpha"', time: '1 day ago' },
                            ].map((activity, i) => (
                                <div key={i} className="flex gap-4 relative">
                                    {i !== 3 && <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-secondary"></div>}
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 ${activity.urgent ? 'bg-destructive/10' : 'bg-primary/10'
                                        }`}>
                                        <Clock className={`w-3 h-3 ${activity.urgent ? 'text-destructive' : 'text-primary'}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold">{activity.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">{activity.desc}</p>
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase mt-1 block tracking-wider">{activity.time}</span>
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

// Fix for icon casing in mapping
const trendingup = TrendingUp;
const alerttriangle = AlertTriangle;
const checkcircle2 = CheckCircle2;
