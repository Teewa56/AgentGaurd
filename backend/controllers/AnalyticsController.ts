import { Request, Response, NextFunction } from 'express';
import { AgentRepo } from '../repositories/AgentRepo';
import { DisputeRepo } from '../repositories/DisputeRepo';
import { TxRepo } from '../repositories/TxRepo';
import { CacheService } from '../services/CacheService';

export class AnalyticsController {
    static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const cached = await CacheService.get(`dashboard_stats_${userId}`);
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

            // 4. Total Staked 
            const agents = await AgentRepo.findAll();
            const totalDailyLimit = agents.reduce((sum, agent) => sum + (agent.dailySpendingLimit || 0), 0);
            const totalStaked = (totalDailyLimit * 0.5).toLocaleString(); // Assume 50% collateral ratio requirement

            // 5. Total Reputation (Derived from Performance)
            const reputationScore = 500 + (completedTransactions * 10) - (disputedTransactions * 50);

            const stats = {
                totalReputation: Math.max(0, reputationScore),
                totalStaked: totalStaked,
                activeDisputes,
                successRate: Number(successRate),
                totalTransactions
            };

            await CacheService.set(`dashboard_stats_${userId}`, stats, 60 * 60); // Cache for 1 hour

            res.json(stats);

        } catch (error) {
            next(error);
        }
    }
}
