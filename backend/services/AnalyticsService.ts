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
        const totalTx = await Transaction.countDocuments({ agentAddress: address });
        const disputes = await Dispute.countDocuments({ agentAddress: address });

        return {
            address,
            totalTx,
            disputeRate: totalTx > 0 ? (disputes / totalTx) * 100 : 0
        };
    }
}
