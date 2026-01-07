import { Request, Response } from 'express';

export class DisputeController {
    static async getAll(req: Request, res: Response) {
        // Mock list of disputes
        res.json([
            { id: 1, agent: '0x...', status: 'Resolved', outcome: 'Refund 100%' },
            { id: 2, agent: '0x...', status: 'Pending', outcome: 'In AI Arbitration' }
        ]);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        res.json({
            id,
            agent: '0x...',
            user: '0x...',
            amount: "150 MNEE",
            evidence: "ipfs://...",
            status: "Arbitrating",
            claudeAnalysis: "Agent violated spending limit policy by 5%."
        });
    }
}
