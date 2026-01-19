import { Request, Response, NextFunction } from 'express';
import { TxRepo } from '../repositories/TxRepo';
import { UnauthorizedError } from '../utils/errors';
import { formatUnits } from 'ethers';
import User from '../models/User';
import { CONTRACTS } from '../config/contracts';

const getTokenDecimals = (address: string) => {
    if (!address) return 18;
    const addr = address.toLowerCase();
    // MNEE is 18, USDC/USDT are 6 in our mock setup
    if (addr === process.env.MNEE_TOKEN_ADDRESS?.toLowerCase()) return 18;
    if (addr === process.env.USDC_TOKEN_ADDRESS?.toLowerCase()) return 6;
    if (addr === process.env.USDT_TOKEN_ADDRESS?.toLowerCase()) return 6;
    return 18;
};

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

            const user = await User.findById(userId);
            const userAddress = user?.walletAddress;

            const transactions = await TxRepo.findAll({
                agentAddress: agent as string,
                status: statusFilter,
                userAddress: userAddress
            });

            // Map to frontend interface
            const mappedTransactions = transactions.map(tx => {
                const decimals = getTokenDecimals(tx.tokenAddress);
                return {
                    _id: tx._id,
                    hash: `0x${tx.txId.toString(16).padStart(64, '0')}`, // Mock hash from txId
                    txId: tx.txId,
                    agent: tx.agentAddress,
                    to: tx.serviceId,
                    value: parseFloat(formatUnits(tx.amount || '0', decimals)).toLocaleString(),
                    token: tx.tokenAddress,
                    timestamp: tx.createdAt.getTime(),
                    status: tx.status === 'Completed' ? 'Settled' :
                        tx.status === 'Initiated' ? 'Escrowed' :
                            tx.status === 'Disputed' ? 'Disputed' : 'Failed',
                    metadataURI: tx.metadataURI
                };
            });

            res.json(mappedTransactions);
        } catch (error) {
            next(error);
        }
    }
}
