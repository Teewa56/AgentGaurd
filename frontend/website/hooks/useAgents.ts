import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Agent {
    _id: string;
    userId: string;
    address: string;
    charter: string;
    dailySpendingLimit: number;
    monthlySpendingLimit: number;
    transactionLimit: number;
    usage: {
        daily: number;
        monthly: number;
    };
    isActive: boolean;
    createdAt: string;
}

export const useAgents = () => {
    return useQuery({
        queryKey: ['agents'],
        queryFn: async () => {
            const { data } = await api.get('/agents');
            return data as Agent[];
        }
    });
};

export const useAgent = (address: string) => {
    return useQuery({
        queryKey: ['agent', address],
        queryFn: async () => {
            const { data } = await api.get(`/agents/${address}`);
            return data as Agent;
        },
        enabled: !!address
    });
};
