import Dispute, { IDispute } from '../models/Dispute';
import { DisputeStatus } from '../utils/constants';

export class DisputeRepo {
    static async create(data: Partial<IDispute>): Promise<IDispute> {
        const dispute = new Dispute(data);
        return await dispute.save();
    }

    static async findByTxId(txId: number): Promise<IDispute | null> {
        return await Dispute.findOne({ txId });
    }

    static async findPending(): Promise<IDispute[]> {
        return await Dispute.find({ status: DisputeStatus.PENDING });
    }

    static async updateStatus(txId: number, status: string, resolution?: any): Promise<IDispute | null> {
        const updates: any = { status };
        if (resolution) {
            updates.refundPercent = resolution.refundPercent;
            updates.slashAmount = resolution.slashAmount;
            updates.claudeAnalysis = resolution.reasoning;
        }
        return await Dispute.findOneAndUpdate({ txId }, updates, { new: true });
    }

    static async countActive(): Promise<number> {
        return Dispute.countDocuments({ status: { $in: ['Open', 'Arbitrating'] } });
    }
}
