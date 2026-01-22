'use client';

import {
    LayoutDashboard,
    UserPlus,
    History,
    Gavel,
    ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { label: 'Dash', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Register', icon: UserPlus, href: '/registry' },
    { label: 'Simulate', icon: ShieldCheck, href: '/simulate' },
    { label: 'Stake', icon: ShieldCheck, href: '/insurance' },
    { label: 'Logs', icon: History, href: '/transactions' },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t z-50 flex lg:hidden items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all relative",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                        <span className={cn("text-[9px] font-bold uppercase tracking-tight", isActive ? "opacity-100" : "opacity-60")}>
                            {item.label}
                        </span>
                        {isActive && (
                            <div className="absolute -bottom-1 w-8 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
