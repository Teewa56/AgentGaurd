import { Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import { PaymentProof } from '../models/PaymentProof';
import { AuthRequest } from '../middleware/authMiddleware';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class PaymentProofController {
    /**
     * Purchase API credits
     * POST /api/payments/buy-credits
     */
    static async buyCredits(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { transactionHash, amount, token = 'MNEE' } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                throw new BadRequestError('User authentication required');
            }

            if (!transactionHash) {
                throw new BadRequestError('Transaction hash required');
            }

            if (!amount || amount <= 0) {
                throw new BadRequestError('Valid amount required');
            }

            // Check if transaction already processed
            const existing = await PaymentProof.findOne({ transactionHash });
            if (existing) {
                return res.status(200).json({
                    message: 'Payment already processed',
                    paymentProof: existing
                });
            }

            // TODO: Verify transaction on-chain
            // For now, we'll trust the transaction hash
            // In production, verify with blockchain RPC

            // Calculate credits based on amount (1 MNEE = 10 credits)
            const creditsIssued = amount * 10;

            // Create payment proof
            const paymentProof = await PaymentProof.create({
                userId,
                agentAddress: req.body.agentAddress,
                transactionHash,
                amount,
                token,
                purpose: 'api_credit',
                creditsIssued,
                creditsRemaining: creditsIssued,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                status: 'confirmed',
                metadata: {
                    purchasedAt: new Date(),
                    conversionRate: 10 // 1 MNEE = 10 credits
                }
            });

            res.status(201).json({
                message: 'Credits purchased successfully',
                paymentProof: {
                    id: paymentProof._id,
                    creditsIssued: paymentProof.creditsIssued,
                    creditsRemaining: paymentProof.creditsRemaining,
                    expiresAt: paymentProof.expiresAt,
                    transactionHash: paymentProof.transactionHash
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get credit balance
     * GET /api/payments/credits
     */
    static async getCredits(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const agentAddress = req.query.agentAddress as string;

            if (!userId) {
                throw new BadRequestError('User authentication required');
            }

            const query: any = {
                userId,
                status: 'confirmed',
                creditsRemaining: { $gt: 0 },
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: new Date() } }
                ]
            };

            if (agentAddress) {
                query.agentAddress = agentAddress;
            }

            const paymentProofs = await PaymentProof.find(query).sort({ expiresAt: 1 });

            const totalCredits = paymentProofs.reduce(
                (sum, proof) => sum + proof.creditsRemaining,
                0
            );

            res.json({
                totalCredits,
                breakdown: paymentProofs.map(proof => ({
                    id: proof._id,
                    creditsRemaining: proof.creditsRemaining,
                    expiresAt: proof.expiresAt,
                    transactionHash: proof.transactionHash
                }))
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get payment history
     * GET /api/payments/history
     */
    static async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            const { page = 1, limit = 20 } = req.query;

            if (!userId) {
                throw new BadRequestError('User authentication required');
            }

            const skip = (Number(page) - 1) * Number(limit);

            const [payments, total] = await Promise.all([
                PaymentProof.find({ userId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit)),
                PaymentProof.countDocuments({ userId })
            ]);

            res.json({
                payments: payments.map(p => ({
                    id: p._id,
                    transactionHash: p.transactionHash,
                    amount: p.amount,
                    token: p.token,
                    purpose: p.purpose,
                    creditsIssued: p.creditsIssued,
                    creditsRemaining: p.creditsRemaining,
                    status: p.status,
                    createdAt: p.createdAt,
                    expiresAt: p.expiresAt
                })),
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify payment proof (for third-party API providers)
     * POST /api/payments/verify
     */
    static async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { transactionHash, requiredAmount } = req.body;

            if (!transactionHash) {
                throw new BadRequestError('Transaction hash required');
            }

            const paymentProof = await PaymentProof.findOne({
                transactionHash,
                status: 'confirmed'
            });

            if (!paymentProof) {
                throw new NotFoundError('Payment proof not found');
            }

            const isValid = paymentProof.creditsRemaining >= (requiredAmount || 0) &&
                (!paymentProof.expiresAt || paymentProof.expiresAt > new Date());

            res.json({
                valid: isValid,
                paymentProof: {
                    userId: paymentProof.userId,
                    agentAddress: paymentProof.agentAddress,
                    creditsRemaining: paymentProof.creditsRemaining,
                    expiresAt: paymentProof.expiresAt,
                    status: paymentProof.status
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Record API usage (for tracking and analytics)
     * POST /api/payments/usage
     */
    static async recordUsage(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { endpoint, creditsUsed, agentAddress } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                throw new BadRequestError('User authentication required');
            }

            // This is logged for analytics purposes
            // Actual credit consumption happens in the middleware

            res.json({
                message: 'Usage recorded',
                endpoint,
                creditsUsed,
                timestamp: new Date()
            });
        } catch (error) {
            next(error);
        }
    }
}
