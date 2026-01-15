'use client';

import React, { useEffect, useState } from 'react';
import { Coins, TrendingUp, Loader2 } from 'lucide-react';

interface CreditBalanceProps {
    agentAddress?: string;
    className?: string;
}

export default function CreditBalance({ agentAddress, className = '' }: CreditBalanceProps) {
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBalance();
        // Refresh balance every 30 seconds
        const interval = setInterval(fetchBalance, 30000);
        return () => clearInterval(interval);
    }, [agentAddress]);

    const fetchBalance = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Not authenticated');
                setIsLoading(false);
                return;
            }

            const url = agentAddress
                ? `/api/payments/credits?agentAddress=${agentAddress}`
                : '/api/payments/credits';

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch balance');
            }

            const data = await response.json();
            setBalance(data.totalCredits || 0);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg ${className}`}>
                <Loader2 className="animate-spin text-gray-400" size={18} />
                <span className="text-sm text-gray-600">Loading...</span>
            </div>
        );
    }

    if (error) {
        return null; // Silently fail
    }

    return (
        <div className={`flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 ${className}`}>
            <div className="p-2 bg-white rounded-lg shadow-sm">
                <Coins className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-600 font-medium">API Credits</p>
                <p className="text-lg font-bold text-gray-900">
                    {balance?.toLocaleString() || 0}
                </p>
            </div>
            <button
                onClick={fetchBalance}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="Refresh balance"
            >
                <TrendingUp className="text-gray-400 hover:text-blue-600" size={16} />
            </button>
        </div>
    );
}
