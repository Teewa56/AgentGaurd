import { Request, Response, NextFunction } from 'express';
import { TxRepo } from '../repositories/TxRepo';
import { UnauthorizedError } from '../utils/errors';
import { formatEther } from 'ethers';

export class TransactionController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                throw new UnauthorizedError("User not authenticated");
            }

            const { agent, status } = req.query;

            // Map frontend status filter to backend enum if necessary
            let statusFilter = status as string;
            if (statusFilter === 'Settled') statusFilter = 'Completed';
            if (statusFilter === 'Escrowed') statusFilter = 'Initiated';

            const transactions = await TxRepo.findAll({
                agentAddress: agent as string,
                status: statusFilter
            });

            // Map to frontend interface
            const mappedTransactions = transactions.map(tx => ({
                _id: tx._id,
                hash: `0x${tx.txId.toString(16).padStart(64, '0')}`, // Mock hash from txId
                txId: tx.txId,
                agent: tx.agentAddress,
                to: tx.serviceId,
                value: parseFloat(formatEther(tx.amount || '0')).toLocaleString(),
                timestamp: tx.createdAt.getTime(),
                status: tx.status === 'Completed' ? 'Settled' :
                    tx.status === 'Initiated' ? 'Escrowed' :
                        tx.status === 'Disputed' ? 'Disputed' : 'Failed',
                metadataURI: tx.metadataURI
            }));

            res.json(mappedTransactions);
        } catch (error) {
            next(error);
        }
    }
}
