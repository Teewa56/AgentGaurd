import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
    user: mongoose.Types.ObjectId;
    address: string;
    charter: string;
    dailySpendingLimit: number;
    monthlySpendingLimit: number;
    transactionLimit: number;
    isActive: boolean;
    createdAt: Date;
}

const AgentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String, required: true, unique: true },
    charter: { type: String, required: true },
    dailySpendingLimit: { type: Number, default: 0 },
    monthlySpendingLimit: { type: Number, default: 0 },
    transactionLimit: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IAgent>('Agent', AgentSchema);
