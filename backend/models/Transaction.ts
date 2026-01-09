import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    txId: number;      // On-chain Transaction ID
    agentAddress: string;
    userAddress: string;
    amount: string;    // Wei
    serviceId: string;
    metadataURI: string;
    status: 'Initiated' | 'Completed' | 'Disputed' | 'Refunded';
    createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
    txId: { type: Number, required: true, unique: true },
    agentAddress: { type: String, required: true },
    userAddress: { type: String, required: true },
    amount: { type: String, required: true },
    serviceId: { type: String, required: true },
    metadataURI: { type: String, required: true },
    status: { type: String, enum: ['Initiated', 'Completed', 'Disputed', 'Refunded'], default: 'Initiated' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
