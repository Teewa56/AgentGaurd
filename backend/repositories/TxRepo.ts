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
}
