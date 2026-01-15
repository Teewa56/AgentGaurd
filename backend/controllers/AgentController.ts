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
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                throw new UnauthorizedError("User not authenticated");
            }

            const agents = await AgentRepo.findByUserId(userId);
            res.json(agents);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { address } = req.params;
            const updates = req.body;
            const userId = (req as any).user?.id;

            // Use AgentRepo.create (which is an upsert) to handle race conditions
            // between on-chain event listener and frontend metadata sync.
            const agent = await AgentRepo.create({
                address,
                ...updates,
                user: userId
            });

            res.json(agent);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PREMIUM ENDPOINT: Get advanced analytics for all user agents
     * Requires payment via HTTP 402
     */
    static async getPremiumAnalytics(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                throw new UnauthorizedError("User not authenticated");
            }

            const agents = await AgentRepo.findByUserId(userId);

            // Advanced analytics calculations
            const analytics = await Promise.all(
                agents.map(async (agent) => {
                    const performance = await AnalyticsService.getAgentPerformance(agent.address);
                    const trends = await AnalyticsService.getPerformanceTrends(agent.address, 30); // 30 days

                    return {
                        address: agent.address,
                        performance,
                        trends,
                        predictions: {
                            nextMonthSpending: performance.totalSpent * 1.1, // Simple prediction
                            riskScore: calculateRiskScore(performance),
                            recommendedBondAdjustment: calculateBondAdjustment(agent, performance)
                        },
                        optimization: {
                            suggestedLimits: calculateOptimalLimits(performance),
                            costSavings: calculatePotentialSavings(performance)
                        }
                    };
                })
            );

            res.json({
                totalAgents: agents.length,
                analytics,
                generatedAt: new Date()
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * PREMIUM ENDPOINT: Get AI-powered insights for a specific agent
     * Requires payment via HTTP 402
     */
    static async getAIInsights(req: Request, res: Response, next: NextFunction) {
        try {
            const { address } = req.params;
            const userId = (req as any).user?.id;

            const agent = await AgentRepo.findByAddress(address);
            if (!agent) {
                throw new NotFoundError("Agent not found");
            }

            // Verify ownership
            if (agent.user.toString() !== userId) {
                throw new UnauthorizedError("Not authorized to access this agent");
            }

            const performance = await AnalyticsService.getAgentPerformance(address);
            const recentTransactions = await AnalyticsService.getRecentTransactions(address, 50);

            // AI-powered insights (in production, this would call an LLM API)
            const insights = {
                behaviorAnalysis: {
                    spendingPattern: analyzeSpendingPattern(recentTransactions),
                    timePreferences: analyzeTimePreferences(recentTransactions),
                    merchantPreferences: analyzeMerchantPreferences(recentTransactions)
                },
                anomalyDetection: {
                    unusualTransactions: detectAnomalies(recentTransactions),
                    riskAlerts: generateRiskAlerts(performance, recentTransactions)
                },
                recommendations: {
                    limitAdjustments: recommendLimitAdjustments(agent, performance),
                    bondOptimization: recommendBondOptimization(agent, performance),
                    costReduction: recommendCostReductions(performance)
                },
                predictions: {
                    nextWeekSpending: predictSpending(recentTransactions, 7),
                    nextMonthSpending: predictSpending(recentTransactions, 30),
                    reputationTrajectory: predictReputationChange(performance)
                }
            };

            res.json({
                agent: {
                    address: agent.address,
                    isActive: agent.isActive
                },
                insights,
                generatedAt: new Date(),
                confidence: 0.85 // AI confidence score
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * CLI ENDPOINT: Register agent from CLI
     * Requires CLI API Key authentication
     */
    static async registerFromCLI(req: Request, res: Response, next: NextFunction) {
        try {
            const { address, name, description, spendingLimits, allowedTasks } = req.body;
            const userId = (req as any).user?.id;

            if (!userId) {
                throw new UnauthorizedError("User not authenticated");
            }

            // Create agent metadata in database
            const agent = await AgentRepo.create({
                user: userId,
                address,
                name,
                description: description,
                charter: `CLI Agent: ${name}. Allowed tasks: ${allowedTasks.join(', ')}`,
                dailySpendingLimit: spendingLimits.daily,
                monthlySpendingLimit: spendingLimits.monthly,
                transactionLimit: spendingLimits.perTx,
                isActive: true
            });

            res.status(201).json({
                message: "Agent registered from CLI successfully",
                agentId: agent._id,
                agentAddress: agent.address
            });
        } catch (error) {
            next(error);
        }
    }
}

// Helper functions for analytics calculations
function calculateRiskScore(performance: any): number {
    // Simple risk calculation based on dispute rate
    const disputeRate = performance.disputes / Math.max(performance.totalTransactions, 1);
    return Math.min(100, disputeRate * 1000);
}

function calculateBondAdjustment(agent: any, performance: any): number {
    const riskScore = calculateRiskScore(performance);
    if (riskScore < 10) return -20; // Reduce bond by 20%
    if (riskScore > 50) return 50; // Increase bond by 50%
    return 0;
}

function calculateOptimalLimits(performance: any): any {
    return {
        daily: performance.avgDailySpending * 1.5,
        monthly: performance.totalSpent * 1.2,
        perTransaction: performance.avgTransactionSize * 2
    };
}

function calculatePotentialSavings(performance: any): number {
    // Calculate potential savings from optimized limits and better reputation
    return performance.totalFees * 0.3; // 30% potential savings
}

function analyzeSpendingPattern(transactions: any[]): string {
    // Analyze spending patterns
    const amounts = transactions.map(t => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length;

    if (variance < avg * 0.1) return "Consistent";
    if (variance < avg * 0.5) return "Moderate";
    return "Highly Variable";
}

function analyzeTimePreferences(transactions: any[]): any {
    // Analyze when agent makes transactions
    const hours = transactions.map(t => new Date(t.timestamp).getHours());
    const hourCounts = hours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
    return {
        peakHour: peakHour ? parseInt(peakHour[0]) : null,
        pattern: "Business Hours" // Simplified
    };
}

function analyzeMerchantPreferences(transactions: any[]): any {
    const merchants = transactions.map(t => t.merchant);
    const merchantCounts = merchants.reduce((acc, merchant) => {
        acc[merchant] = (acc[merchant] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        topMerchants: Object.entries(merchantCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([merchant, count]) => ({ merchant, count }))
    };
}

function detectAnomalies(transactions: any[]): any[] {
    // Simple anomaly detection
    const amounts = transactions.map(t => t.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / amounts.length);

    return transactions.filter(t => Math.abs(t.amount - avg) > 2 * stdDev);
}

function generateRiskAlerts(performance: any, transactions: any[]): string[] {
    const alerts: string[] = [];

    if (calculateRiskScore(performance) > 50) {
        alerts.push("High dispute rate detected");
    }

    const anomalies = detectAnomalies(transactions);
    if (anomalies.length > 5) {
        alerts.push(`${anomalies.length} unusual transactions detected`);
    }

    return alerts;
}

function recommendLimitAdjustments(agent: any, performance: any): any {
    const optimal = calculateOptimalLimits(performance);
    return {
        current: {
            daily: agent.dailySpendingLimit,
            monthly: agent.monthlySpendingLimit
        },
        recommended: optimal,
        reasoning: "Based on spending patterns and risk profile"
    };
}

function recommendBondOptimization(agent: any, performance: any): any {
    const adjustment = calculateBondAdjustment(agent, performance);
    return {
        currentBond: agent.bondAmount || 0,
        recommendedAdjustment: adjustment,
        reasoning: adjustment < 0 ? "Good performance, reduce bond" : "High risk, increase bond"
    };
}

function recommendCostReductions(performance: any): string[] {
    const recommendations: string[] = [];

    if (performance.avgFeeRate > 0.5) {
        recommendations.push("Improve reputation to reduce fees");
    }

    if (performance.disputes > 0) {
        recommendations.push("Reduce disputes to lower insurance costs");
    }

    return recommendations;
}

function predictSpending(transactions: any[], days: number): number {
    // Simple linear prediction
    const recentDaily = transactions.slice(0, Math.min(7, transactions.length))
        .reduce((sum, t) => sum + t.amount, 0) / 7;
    return recentDaily * days;
}

function predictReputationChange(performance: any): string {
    const riskScore = calculateRiskScore(performance);
    if (riskScore < 10) return "Improving";
    if (riskScore > 50) return "Declining";
    return "Stable";
}
