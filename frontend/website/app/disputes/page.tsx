'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Gavel,
  Scale,
  Search,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  MessageSquareText
} from 'lucide-react';
import { useDisputes, Dispute } from '@/hooks/useDisputes';
import { useState } from 'react';

export default function Disputes() {
  const { data: disputes, isLoading } = useDisputes();
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  // Auto-select the first dispute for the spotlight if none selected
  const activeSpotlight = selectedDispute || (disputes && disputes.length > 0 ? disputes[0] : null);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Arbitration Portal</h1>
            <p className="text-muted-foreground mt-1">Review and manage protocol disputes resolved via AgentGuard AI.</p>
          </div>
          <div className="flex bg-secondary p-1 rounded-xl">
            <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white shadow-sm transition-all">All Cases</button>
            <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-muted-foreground hover:text-foreground transition-all">Pending</button>
            <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-muted-foreground hover:text-foreground transition-all">Outcome: Refund</button>
          </div>
        </div>

        {/* Dispute Summary Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Avg. Resolution Time', value: '4.2 Minutes', icon: Scale, color: 'text-primary' },
            { label: 'Total MNEE Refunded', value: '124,500', icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'System Savings', value: '18% / Fee', icon: Gavel, color: 'text-indigo-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-tight">{stat.label}</p>
                <h3 className="text-xl font-bold">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Active Cases Table */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-bold">Active & Recent Cases</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input placeholder="Search Tx ID..." className="bg-secondary/50 border rounded-lg py-1.5 pl-10 pr-4 text-xs focus:outline-none w-48" />
            </div>
          </div>
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary/30 text-xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Case / Tx ID</th>
                    <th className="px-6 py-4">Disputer</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">AI Outcome</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {disputes?.map((dispute: Dispute) => (
                    <tr key={dispute._id} className="hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => setSelectedDispute(dispute)}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-primary">#{dispute.txHash.substring(0, 8)}...</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Tx ID</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{dispute.disputer.substring(0, 10)}...</td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className="bg-secondary px-2 py-1 rounded-md max-w-[150px] truncate block" title={dispute.reason}>{dispute.reason}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {dispute.status === 'Resolved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <HelpCircle className="w-3.5 h-3.5 text-amber-500" />}
                          <span className="text-sm font-bold">
                            {dispute.aiAnalysis ? `${dispute.aiAnalysis.refundPercent}% Refund` : 'Pending Analysis'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${dispute.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                            dispute.status === 'Arbitrating' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                              'bg-indigo-100 text-indigo-700'
                          }`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:bg-primary/5 p-2 rounded-lg transition-all group">
                          <MessageSquareText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!disputes || disputes.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No disputes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Analysis Detail Spotlight */}
        {activeSpotlight && (
          <div className="bg-white border rounded-2xl p-8 shadow-sm">
            <div className="flex items-start justify-between gap-8 flex-col lg:flex-row">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold italic tracking-tight">Gemini AI: Case Analysis Insight</h3>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest leading-none">Real-time Arbitration Feed</p>
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-2xl p-6 border-l-4 border-primary">
                  <p className="text-sm font-medium italic leading-relaxed text-foreground/80">
                    "{activeSpotlight.aiAnalysis?.reasoning || "Waiting for AI analysis..."}"
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold opacity-60">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Policy Logic Validated</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Evidence Path Verified</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> On-chain Action Queued</span>
                </div>
              </div>
              <div className="w-full lg:w-72 space-y-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Arbitration Confidence</h4>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-black italic">99.8%</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">HIGH</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full w-[99.8%] shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                  </div>
                </div>
                <button className="w-full bg-foreground text-white font-bold py-3 rounded-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10">
                  Review Metadata <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
