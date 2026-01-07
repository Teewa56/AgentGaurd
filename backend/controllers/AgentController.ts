import { Request, Response } from 'express';

export class AgentController {
    static async register(req: Request, res: Response) {
        try {
            const { agentAddress, charter } = req.body;
            // In real app: save to database
            res.status(201).json({
                message: 'Agent metadata registered successfully',
                agent: agentAddress
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to register agent' });
        }
    }

    static async getStats(req: Request, res: Response) {
        const { address } = req.params;
        // Mock stats
        res.json({
            address,
            reputation: 750,
            totalTransactions: 120,
            disputeRate: "2.5%",
            successRate: "97.5%"
        });
    }
}
