import Transaction, { ITransaction } from '../models/Transaction';

export class TxRepo {
    static async create(data: Partial<ITransaction>): Promise<ITransaction> {
        const tx = new Transaction(data);
        return await tx.save();
    }

    static async findByTxId(txId: number): Promise<ITransaction | null> {
        return await Transaction.findOne({ txId });
    }

    static async findByAgent(agentAddress: string): Promise<ITransaction[]> {
        return await Transaction.find({ agentAddress }).sort({ createdAt: -1 });
    }

    static async countAll(): Promise<number> {
        return Transaction.countDocuments();
    }

    static async countByStatus(status: 'Initiated' | 'Completed' | 'Disputed' | 'Refunded'): Promise<number> {
        return Transaction.countDocuments({ status });
    }

    static async findAll(filters: { agentAddress?: string; status?: string; userAddress?: string } = {}): Promise<ITransaction[]> {
        const query: any = {};
        if (filters.agentAddress) query.agentAddress = filters.agentAddress;
        if (filters.status) query.status = filters.status;
        if (filters.userAddress) query.userAddress = filters.userAddress;
        return await Transaction.find(query).sort({ createdAt: -1 });
    }
}
