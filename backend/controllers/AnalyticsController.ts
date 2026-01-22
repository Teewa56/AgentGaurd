import { Request, Response, NextFunction } from 'express';
import { AgentRepo } from '../repositories/AgentRepo';
import { DisputeRepo } from '../repositories/DisputeRepo';
import { TxRepo } from '../repositories/TxRepo';
import { CacheService } from '../services/CacheService';

export class AnalyticsController {
    static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            const cacheKey = `dashboard_stats_v2_${userId}`;
            const cached = await CacheService.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            // 1. Transaction Stats
            const totalTransactions = await TxRepo.countAll();
            const completedTransactions = await TxRepo.countByStatus('Completed');
            const disputedTransactions = await TxRepo.countByStatus('Disputed');

            // 2. Success Rate Calculation
            const successRate = totalTransactions > 0
                ? ((completedTransactions / totalTransactions) * 100).toFixed(1)
                : 100;

            // 3. Active Disputes
            const activeDisputes = await DisputeRepo.countActive();

            // 4. User-Specific Stats (Real data from MongoDB synced from chain)
            const agents = await AgentRepo.findByUserId(userId);
            const totalStakedWei = agents.reduce((sum, agent) => {
                try {
                    return sum + BigInt(agent.stakedMnee || "0");
                } catch {
                    return sum;
                }
            }, 0n).toString();

            // 5. Average Reputation
            const avgReputation = agents.length > 0
                ? agents.reduce((sum, a) => sum + (a.reputation || 0), 0) / agents.length
                : 500;

            const stats = {
                totalReputation: Math.round(avgReputation),
                totalStaked: totalStakedWei,
                activeDisputes,
                successRate: Number(successRate),
                totalTransactions
            };

            await CacheService.set(cacheKey, stats, 60 * 60); // Cache for 1 hour

            res.json(stats);

        } catch (error) {
            next(error);
        }
    }
}
