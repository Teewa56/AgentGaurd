import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentProof extends Document {
    userId: string;
    agentAddress?: string;
    transactionHash: string;
    amount: number;
    token: string; // MNEE, USDC, USDT
    purpose: 'api_credit' | 'premium_feature' | 'third_party_api' | 'merchant_api';
    endpoint?: string;
    creditsIssued: number;
    creditsRemaining: number;
    expiresAt?: Date;
    status: 'pending' | 'confirmed' | 'expired' | 'refunded';
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentProofSchema = new Schema<IPaymentProof>({
    userId: {
        type: String,
        required: true,
        index: true
    },
    agentAddress: {
        type: String,
        index: true
    },
    transactionHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    token: {
        type: String,
        required: true,
        enum: ['MNEE', 'USDC', 'USDT']
    },
    purpose: {
        type: String,
        required: true,
        enum: ['api_credit', 'premium_feature', 'third_party_api', 'merchant_api']
    },
    endpoint: {
        type: String
    },
    creditsIssued: {
        type: Number,
        required: true,
        default: 0
    },
    creditsRemaining: {
        type: Number,
        required: true,
        default: 0
    },
    expiresAt: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'expired', 'refunded'],
        default: 'pending'
    },
    metadata: {
        type: Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
PaymentProofSchema.index({ userId: 1, status: 1 });
PaymentProofSchema.index({ agentAddress: 1, status: 1 });
PaymentProofSchema.index({ expiresAt: 1 }, { sparse: true });

// Virtual for checking if payment is valid
PaymentProofSchema.virtual('isValid').get(function () {
    if (this.status !== 'confirmed') return false;
    if (this.creditsRemaining <= 0) return false;
    if (this.expiresAt && this.expiresAt < new Date()) return false;
    return true;
});

export const PaymentProof = mongoose.model<IPaymentProof>('PaymentProof', PaymentProofSchema);
