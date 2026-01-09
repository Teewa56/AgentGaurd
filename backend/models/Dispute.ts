import mongoose, { Schema, Document } from 'mongoose';

export interface IDispute extends Document {
    txId: number;
    agentAddress: string;
    userAddress: string;
    amount: string; // Stored as string to handle large numbers (Wei)
    status: 'Pending' | 'Arbitrating' | 'Resolved' | 'Appealed';
    claudeAnalysis?: string; // Kept name for compatibility, can be generic 'aiAnalysis'
    refundPercent?: number;
    slashAmount?: string;
    createdAt: Date;
}

const DisputeSchema: Schema = new Schema({
    txId: { type: Number, required: true, unique: true },
    agentAddress: { type: String, required: true },
    userAddress: { type: String, required: true },
    amount: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Arbitrating', 'Resolved', 'Appealed'], default: 'Pending' },
    claudeAnalysis: { type: String },
    refundPercent: { type: Number },
    slashAmount: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDispute>('Dispute', DisputeSchema);
