import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
    user: mongoose.Types.ObjectId;
    address: string;
    name: string;
    description?: string;
    charter: string;
    dailySpendingLimit: string;
    monthlySpendingLimit: string;
    transactionLimit: string;
    isActive: boolean;
    stakedMnee: string;
    reputation: number;
    createdAt: Date;
}

const AgentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    address: { type: String, required: true, unique: true },
    name: { type: String, default: 'Unnamed Agent' },
    description: { type: String },
    charter: { type: String, required: true },
    dailySpendingLimit: { type: String, default: '0' },
    monthlySpendingLimit: { type: String, default: '0' },
    transactionLimit: { type: String, default: '0' },
    isActive: { type: Boolean, default: true },
    stakedMnee: { type: String, default: '0' },
    reputation: { type: Number, default: 500 },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAgent>('Agent', AgentSchema);
