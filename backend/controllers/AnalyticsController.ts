import { Request, Response, NextFunction } from 'express';
import { AgentRepo } from '../repositories/AgentRepo';
import { DisputeRepo } from '../repositories/DisputeRepo';
import { TxRepo } from '../repositories/TxRepo';

export class AnalyticsController {
    static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
        try {
            // Fetch counts and aggregates
            // NOTE: In a real high-scale app, these should be cached or pre-aggregated

            // 1. Total Reputation (Mock logic: Sum of all agent reputation or similar. 
            // For now, we don't have a reputation field on agents, so we'll mock or derive it)
            // Let's assume a baseline + successful txs
            const totalTransactions = await TxRepo.countAll();

            // 2. Total Staked (Mock: We can fetch from blockchain or assume a fixed stake per agent)
            const agents = await AgentRepo.findAll();
            const totalStaked = agents.length * 1000; // Assume 1000 MNEE stake per agent for MVP

            // 3. Active Disputes
            const activeDisputes = await DisputeRepo.countActive();

            // 4. Success Rate
            // (Total Tx - Failed/Disputed) / Total Tx
            // For MVP, simplified:
            const successRate = totalTransactions > 0 ? 98.4 : 100; // hardcoded for now until we have status in TxRepo query

            res.json({
                totalReputation: 750 + (totalTransactions * 0.1), // Derived score
                totalStaked: totalStaked.toLocaleString(),
                activeDisputes,
                successRate,
                totalTransactions
            });

        } catch (error) {
            next(error);
        }
    }
}
