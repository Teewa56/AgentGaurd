'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import {
  ShieldCheck,
  Cpu,
  Scale,
  Zap,
  Users,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-50 to-white -z-10 opacity-60"></div>
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" /> The Trust Layer for AI Agents
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight mb-8">
                Securing the Future of <span className="text-primary italic">Agent Commerce</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
                AgentGuard provides the economic verification and insurance layer needed for autonomous agents to transact safely on-chain.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  Launch Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="#" className="w-full sm:w-auto px-8 py-4 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-all flex items-center justify-center gap-2">
                  Read Whitepaper
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Interactive Mockup / Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
            <div className="aspect-[16/9] glass rounded-3xl shadow-2xl overflow-hidden p-4 border border-white">
              <div className="w-full h-full rounded-2xl bg-slate-900 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
                {/* Visual Representation of the Protocol */}
                <div className="flex items-center justify-center h-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-12 w-full">
                    {[
                      { title: "Escrow Locked", value: "24.5k MNEE", color: "text-blue-400" },
                      { title: "Active Bonds", value: "1.2M MNEE", color: "text-indigo-400" },
                      { title: "Resolution Time", value: "< 5 mins", color: "text-emerald-400" }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <p className="text-white/50 text-xs font-semibold uppercase mb-2">{stat.title}</p>
                        <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: ShieldCheck,
                title: "Reputation Bonds",
                desc: "Agents stake MNEE tokens based on their mission risk. Poor behavior results in instant automated slashing."
              },
              {
                icon: Scale,
                title: "AI Arbitration",
                desc: "Powered by Claude 3.5 Sonnet, disputes are resolved in minutes with deep policy understanding."
              },
              {
                icon: Zap,
                title: "Spending Charters",
                desc: "On-chain enforcement of daily and monthly spending limits, preventing agent runaway errors."
              }
            ].map((f, i) => (
              <div key={i} className="group p-8 rounded-2xl bg-white border hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5">
                <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 group-hover:blue-gradient group-hover:text-white transition-all text-primary">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-24 border-t">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12 italic text-foreground tracking-tight">
            "Eliminating the Trust Gap in Autonomous Agent Commerce"
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all">
            {/* Logo Placeholders */}
            <div className="font-black text-2xl tracking-tighter">BASE</div>
            <div className="font-black text-2xl tracking-tighter">OPENZEPPELIN</div>
            <div className="font-black text-2xl tracking-tighter">ANTHROPIC</div>
            <div className="font-black text-2xl tracking-tighter">MNEE</div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 blue-gradient rounded flex items-center justify-center">
              <ShieldCheck className="text-white w-4 h-4" />
            </div>
            <span className="font-bold">AgentGuard</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Documentation</Link>
            <Link href="#" className="hover:text-primary transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-primary transition-colors">Security</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 AgentGuard Protocol. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
