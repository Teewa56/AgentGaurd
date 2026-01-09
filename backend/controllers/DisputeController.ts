import { Request, Response, NextFunction } from 'express';
import Dispute from '../models/Dispute';

export class DisputeController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const disputes = await Dispute.find().sort({ createdAt: -1 });
            res.json(disputes);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            // Assuming the ID in params is the MongoDB _id, or we could search by txId
            const dispute = await Dispute.findById(id) || await Dispute.findOne({ txId: Number(id) });

            if (!dispute) {
                return res.status(404).json({ message: "Dispute not found" });
            }
            res.json(dispute);
        } catch (error) {
            next(error);
        }
    }

    // Optional: Creating a dispute record (if needed before on-chain event)
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            // Implementation depends on workflow
            res.status(501).json({ message: "Not implemented, Dispute creation primarily happens via Blockchain Event" });
        } catch (error) {
            next(error);
        }
    }
}
