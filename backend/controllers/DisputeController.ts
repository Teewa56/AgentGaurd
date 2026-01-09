import { Request, Response, NextFunction } from 'express';
import { DisputeRepo } from '../repositories/DisputeRepo';
import { NotFoundError } from '../utils/errors';

export class DisputeController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const disputes = await DisputeRepo.findPending(); 
            res.json(disputes);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const dispute = await DisputeRepo.findByTxId(Number(id));

            if (!dispute) {
                throw new NotFoundError("Dispute not found");
            }
            res.json(dispute);
        } catch (error) {
            next(error);
        }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            res.status(501).json({ message: "Disputes are created via Blockchain events." });
        } catch (error) {
            next(error);
        }
    }
}
