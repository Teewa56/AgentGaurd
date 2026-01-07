'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Shield, Bell, Search } from 'lucide-react';
import Link from 'next/link';

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 h-16 glass z-50 px-6 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 blue-gradient rounded-lg flex items-center justify-center">
                    <Shield className="text-white w-5 h-5" />
                </div>
                <Link href="/" className="font-bold text-xl tracking-tight text-primary">
                    AgentGuard<span className="text-foreground/50 text-sm ml-1 font-medium">Protocol</span>
                </Link>
            </div>

            <div className="flex-1 max-w-xl px-12 hidden md:block">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search agents, transactions, or disputes..."
                        className="w-full bg-secondary/50 border rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-secondary rounded-full relative transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
                </button>
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
            </div>
        </nav>
    );
}
