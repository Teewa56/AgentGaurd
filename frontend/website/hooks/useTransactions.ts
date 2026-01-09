import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Transaction {
    _id: string;
    hash: string;
    agent: string; // Agent Address
    to: string; // Merchant/Destination
    value: string;
    timestamp: number;
    status: 'Settled' | 'Failed' | 'Disputed' | 'Escrowed';
    metadataURI?: string;
}

export const useTransactions = (filters?: { agent?: string; status?: string }) => {
    return useQuery({
        queryKey: ['transactions', filters],
        queryFn: async () => {
            // Pass simple query params. In a real app we'd construct URLSearchParams
            // Backend needs to support these query params. Currently it might not support complex filtering yet,
            // but we'll send them.
            const params = new URLSearchParams();
            if (filters?.agent) params.append('agent', filters.agent);
            if (filters?.status) params.append('status', filters.status);

            const { data } = await api.get(`/transactions?${params.toString()}`);
            return data as Transaction[];
        }
    });
};
