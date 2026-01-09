import { Request, Response, NextFunction } from 'express';
import Agent from '../models/Agent';
import User from '../models/User';

export class AgentController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, address, charter, dailySpendingLimit, monthlySpendingLimit, transactionLimit } = req.body;

            // In a real app, userId should come from the authenticated JWT token (req.user.id)
            // validating that the user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const existingAgent = await Agent.findOne({ address });
            if (existingAgent) {
                return res.status(400).json({ message: "Agent address already registered" });
            }

            const newAgent = new Agent({
                user: userId,
                address,
                charter,
                dailySpendingLimit,
                monthlySpendingLimit,
                transactionLimit
            });

            await newAgent.save();
            res.status(201).json({ message: "Agent registered successfully", agent: newAgent });
        } catch (error) {
            next(error);
        }
    }

    static async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { address } = req.params;
            const agent = await Agent.findOne({ address });

            if (!agent) {
                return res.status(404).json({ message: "Agent not found" });
            }

            // In the future, we can fetch real-time on-chain stats here using BlockchainService
            // For now, return DB stats
            res.json({
                address: agent.address,
                isActive: agent.isActive,
                limits: {
                    daily: agent.dailySpendingLimit,
                    monthly: agent.monthlySpendingLimit
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
