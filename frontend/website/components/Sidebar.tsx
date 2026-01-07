'use client';

import {
    LayoutDashboard,
    UserPlus,
    History,
    Gavel,
    ShieldCheck,
    Settings,
    HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Register Agent', icon: UserPlus, href: '/registry' },
    { label: 'Transactions', icon: History, href: '/transactions' },
    { label: 'Disputes', icon: Gavel, href: '/disputes' },
    { label: 'Insurance Pool', icon: ShieldCheck, href: '/insurance' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-64 border-r bg-white p-4 hidden lg:flex flex-col">
            <div className="space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto space-y-1 pt-4 border-t">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </Link>
                <Link
                    href="/help"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                >
                    <HelpCircle className="w-4 h-4" />
                    Help Center
                </Link>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Protocol Health</p>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs text-foreground/80">Mainnet Status: Optimal</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-3">
                    <div className="bg-primary h-1.5 rounded-full w-4/5"></div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Coverage: 8.2M MNEE</p>
            </div>
        </aside>
    );
}
