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

            <div className="flex items-center gap-4">
                <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
            </div>
        </nav>
    );
}
