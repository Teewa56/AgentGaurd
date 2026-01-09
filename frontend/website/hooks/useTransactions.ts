import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Transaction {
    _id: string;
    hash: string;
    agent: string;
    to: string;
    value: string;
    timestamp: number;
    status: 'Settled' | 'Failed' | 'Disputed' | 'Escrowed';
    metadataURI?: string;
}

export const useTransactions = (filters?: { agent?: string; status?: string }) => {
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.agent) params.append('agent', filters.agent);
            if (filters?.status) params.append('status', filters.status);

            const { data } = await api.get(`/transactions?${params.toString()}`);
            return data as Transaction[];
        }
    });
};
