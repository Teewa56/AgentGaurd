import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface DashboardStats {
    totalReputation: number;
    totalStaked: string;
    activeDisputes: number;
    successRate: number;
    totalTransactions: number;
}

export const useStats = () => {
    return useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const { data } = await api.get('/analytics/dashboard'); // Backend needs this endpoint
            return data as DashboardStats;
        }
    });
};
