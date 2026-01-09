'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Zap,
  Info,
  ShieldAlert,
  FileText,
  User,
  Activity,
  Calendar,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import api from '@/lib/api';

export default function Registry() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    dailyLimit: '100',
    monthlyLimit: '2000',
    perTxLimit: '50'
  });

  const handleSubmit = async () => {
    try {
      await api.post('/agents', {
        name: formData.name, 
        address: formData.address,
        charter: formData.description,
        dailySpendingLimit: Number(formData.dailyLimit),
        monthlySpendingLimit: Number(formData.monthlyLimit),
        transactionLimit: Number(formData.perTxLimit)
      });
      alert('Agent Registered Successfully!');
    } catch (error) {
      console.error(error);
      alert('Registration Failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Register New Agent</h1>
            <p className="text-muted-foreground mt-1">Define your agent's identity and establish its spending charter.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1.5 rounded-lg border border-primary/10 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" /> DID-Based Identity
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-2xl p-8 shadow-sm space-y-8">
              {/* Identity Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">Agent Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Agent Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Agent v1"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-secondary/30 border rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Agent Wallet Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-secondary/30 border rounded-xl py-2 px-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Mission Narrative / Policy</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the agent's purpose and trusted merchant domains..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-secondary/30 border rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Charter Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">Spending Charter</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      Daily Limit <Clock className="w-3 h-3 text-muted-foreground" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.dailyLimit}
                        onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                        className="w-full bg-secondary/30 border rounded-xl py-2 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">MNEE</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      Monthly Limit <Calendar className="w-3 h-3 text-muted-foreground" />
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.monthlyLimit}
                        onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
                        className="w-full bg-secondary/30 border rounded-xl py-2 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">MNEE</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Max per Tx</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.perTxLimit}
                        onChange={(e) => setFormData({ ...formData, perTxLimit: e.target.value })}
                        className="w-full bg-secondary/30 border rounded-xl py-2 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">MNEE</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all">
                  Sign & Register Agent
                </button>
                <button className="px-8 py-3 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all">
                  Save Draft
                </button>
              </div>
            </div>
          </div>

          {/* Guidelines / Sidebar */}
          <div className="space-y-6">
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <ShieldAlert className="w-8 h-8 mb-4 opacity-80" />
              <h4 className="text-lg font-bold mb-2">Protocol Requirement</h4>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                Registration requires an initial Reputation Bond proportionate to your monthly spending limit.
              </p>
              <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
                  <span>Est. Proof of Stake</span>
                  <span>500 MNEE</span>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-primary" />
                <h4 className="font-bold text-sm">Best Practices</h4>
              </div>
              <ul className="space-y-4">
                {[
                  { title: "Principle of Least Privilege", desc: "Set limits only as high as necessary for the specific task." },
                  { title: "Verification Context", desc: "Clearly define merchant URL patterns in the mission narrative." },
                  { title: "Monitoring", desc: "Enable notifications for transactions above 50% of monthly limit." }
                ].map((item, i) => (
                  <li key={i} className="space-y-1">
                    <p className="text-xs font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
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
