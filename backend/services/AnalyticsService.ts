import Dispute from '../models/Dispute';
import Transaction from '../models/Transaction';
import Agent from '../models/Agent';

export class AnalyticsService {
    static async getSystemStats() {
        const totalAgents = await Agent.countDocuments();
        const totalDisputes = await Dispute.countDocuments();
        const totalTx = await Transaction.countDocuments();

        return {
            totalAgents,
            totalDisputes,
            totalTransactions: totalTx,
            timestamp: new Date()
        };
    }

    static async getAgentPerformance(address: string) {
        const transactions = await Transaction.find({ agentAddress: address });
        const totalTx = transactions.length;
        const totalSpent = transactions.reduce((acc, tx) => acc + (parseFloat(tx.amount) || 0), 0);
        const disputes = await Dispute.countDocuments({ agentAddress: address });

        return {
            address,
            totalTx,
            totalSpent,
            disputes,
            disputeRate: totalTx > 0 ? (disputes / totalTx) * 100 : 0,
            avgTransactionSize: totalTx > 0 ? totalSpent / totalTx : 0,
            avgDailySpending: totalSpent > 0 ? totalSpent / 30 : 0, // Placeholder for 30 days
            avgFeeRate: 0.1 // Placeholder
        };
    }

    static async getRecentTransactions(address: string, limit: number = 50) {
        return await Transaction.find({ agentAddress: address })
            .sort({ timestamp: -1 })
            .limit(limit);
    }

    static async getPerformanceTrends(address: string, days: number = 30) {
        // Simplified trend stub
        return {
            period: `${days} days`,
            growth: 0.05,
            history: []
        };
    }
}
