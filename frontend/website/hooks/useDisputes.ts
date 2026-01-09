import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Dispute {
    _id: string;
    txHash: string;
    disputer: string;
    reason: string;
    status: 'Pending' | 'Resolved' | 'Arbitrating' | 'Failed';
    aiAnalysis?: {
        refundPercent: number;
        slashAmount: string;
        reasoning: string;
    };
    createdAt: string;
}

export const useDisputes = (status?: string) => {
    return useQuery({
        queryKey: ['disputes', status],
        queryFn: async () => {
            const url = status ? `/disputes?status=${status}` : '/disputes';
            const { data } = await api.get(url);
            return data as Dispute[];
        }
    });
};
