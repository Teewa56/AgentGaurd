import { Request, Response, NextFunction } from 'express';
import { AgentRepo } from '../repositories/AgentRepo';
import { AnalyticsService } from '../services/AnalyticsService';
import { CacheService } from '../services/CacheService';
import User from '../models/User';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors';

export class AgentController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { address, charter, dailySpendingLimit, monthlySpendingLimit, transactionLimit } = req.body;

            // Get userId from authenticated token (AuthMiddleware)
            const userId = (req as any).user?.id;

            if (!userId) {
                throw new UnauthorizedError("User not authenticated");
            }

            const user = await User.findById(userId);
            if (!user) {
                throw new NotFoundError("User not found");
            }

            const existingAgent = await AgentRepo.findByAddress(address);
            if (existingAgent) {
                throw new ValidationError("Agent address already registered");
            }

            const newAgent = await AgentRepo.create({
                user: userId,
                address,
                charter,
                dailySpendingLimit,
                monthlySpendingLimit,
                transactionLimit
            });

            res.status(201).json({ message: "Agent registered successfully", agent: newAgent });
        } catch (error) {
            next(error);
        }
    }

    static async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { address } = req.params;

            // Check cache first
            const cached = await CacheService.get(`agent_stats_${address}`);
            if (cached) {
                return res.json(cached);
            }

            const agent = await AgentRepo.findByAddress(address);
            if (!agent) {
                throw new NotFoundError("Agent not found");
            }

            const performance = await AnalyticsService.getAgentPerformance(address);

            const stats = {
                address: agent.address,
                isActive: agent.isActive,
                limits: {
                    daily: agent.dailySpendingLimit,
                    monthly: agent.monthlySpendingLimit
                },
                performance
            };

            await CacheService.set(`agent_stats_${address}`, stats);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}
