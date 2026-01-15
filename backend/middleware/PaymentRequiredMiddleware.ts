import { Request, Response, NextFunction } from 'express';
import { PaymentProof } from '../models/PaymentProof';
import { AuthRequest } from './authMiddleware';

export interface PaymentRequiredError extends Error {
    statusCode: number;
    paymentDetails: {
        endpoint: string;
        pricePerRequest: number;
        currency: string;
        acceptedTokens: string[];
        paymentAddress: string;
        creditBalance?: number;
    };
}

interface PricingConfig {
    [endpoint: string]: {
        pricePerRequest: number; // in MNEE
        requiresAuth: boolean;
        description: string;
    };
}

// Pricing configuration for premium endpoints
const PRICING: PricingConfig = {
    '/api/agents/premium-analytics': {
        pricePerRequest: 0.1,
        requiresAuth: true,
        description: 'Advanced analytics and insights'
    },
    '/api/agents/:address/ai-insights': {
        pricePerRequest: 0.5,
        requiresAuth: true,
        description: 'AI-powered agent insights'
    },
    '/api/analytics/advanced': {
        pricePerRequest: 0.2,
        requiresAuth: true,
        description: 'Advanced analytics dashboard'
    }
};

/**
 * Middleware to enforce HTTP 402 Payment Required for premium endpoints
 * Supports both pre-paid credits and per-request payment verification
 */
export const requirePayment = (endpoint?: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Determine endpoint pricing
            const requestPath = endpoint || req.path;
            const pricing = findPricingForPath(requestPath);

            if (!pricing) {
                // No payment required for this endpoint
                return next();
            }

            // Check for payment proof in headers
            const paymentProofHeader = req.headers['x-payment-proof'] as string;
            const userId = req.user?.id;
            const agentAddress = req.headers['x-agent-address'] as string;

            // Try to use existing credits first
            if (userId) {
                const hasCredits = await consumeCredit(userId, agentAddress, pricing.pricePerRequest);
                if (hasCredits) {
                    // Credits consumed successfully
                    return next();
                }
            }

            // Check for payment proof transaction
            if (paymentProofHeader) {
                const isValid = await verifyPaymentProof(
                    paymentProofHeader,
                    userId,
                    agentAddress,
                    pricing.pricePerRequest
                );

                if (isValid) {
                    return next();
                }
            }

            // No valid payment found - return 402
            const creditBalance = userId ? await getCreditBalance(userId, agentAddress) : 0;

            const error: Partial<PaymentRequiredError> = new Error('Payment Required');
            error.statusCode = 402;
            error.paymentDetails = {
                endpoint: requestPath,
                pricePerRequest: pricing.pricePerRequest,
                currency: 'MNEE',
                acceptedTokens: ['MNEE', 'USDC', 'USDT'],
                paymentAddress: process.env.PAYMENT_RECEIVER_ADDRESS || '0x0000000000000000000000000000000000000000',
                creditBalance
            };

            res.status(402).json({
                error: 'Payment Required',
                message: `This endpoint requires payment: ${pricing.description}`,
                payment: error.paymentDetails,
                instructions: {
                    option1: 'Purchase credits via /api/payments/buy-credits',
                    option2: 'Include payment proof in X-Payment-Proof header',
                    option3: 'Use AgentGuard escrow for automatic payment'
                }
            });
        } catch (err) {
            next(err);
        }
    };
};

/**
 * Find pricing configuration for a given path (supports wildcards)
 */
function findPricingForPath(path: string): PricingConfig[string] | null {
    // Exact match first
    if (PRICING[path]) {
        return PRICING[path];
    }

    // Check for pattern matches (e.g., /api/agents/:address/ai-insights)
    for (const [pattern, config] of Object.entries(PRICING)) {
        const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
        if (regex.test(path)) {
            return config;
        }
    }

    return null;
}

/**
 * Consume credits for a request
 * Returns true if credits were consumed, false if insufficient credits
 */
async function consumeCredit(
    userId: string,
    agentAddress: string | undefined,
    amount: number
): Promise<boolean> {
    const query: any = {
        userId,
        status: 'confirmed',
        creditsRemaining: { $gte: amount },
        $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
        ]
    };

    if (agentAddress) {
        query.agentAddress = agentAddress;
    }

    // Find and update payment proof with sufficient credits
    const paymentProof = await PaymentProof.findOneAndUpdate(
        query,
        {
            $inc: { creditsRemaining: -amount }
        },
        {
            sort: { expiresAt: 1 }, // Use credits expiring soonest first
            new: true
        }
    );

    return !!paymentProof;
}

/**
 * Verify a payment proof transaction hash
 */
async function verifyPaymentProof(
    transactionHash: string,
    userId: string | undefined,
    agentAddress: string | undefined,
    requiredAmount: number
): Promise<boolean> {
    const paymentProof = await PaymentProof.findOne({
        transactionHash,
        status: 'confirmed',
        creditsRemaining: { $gte: requiredAmount }
    });

    if (!paymentProof) {
        return false;
    }

    // Verify ownership
    if (userId && paymentProof.userId !== userId) {
        return false;
    }

    if (agentAddress && paymentProof.agentAddress !== agentAddress) {
        return false;
    }

    // Consume credits
    paymentProof.creditsRemaining -= requiredAmount;
    await paymentProof.save();

    return true;
}

/**
 * Get total credit balance for a user/agent
 */
async function getCreditBalance(
    userId: string,
    agentAddress?: string
): Promise<number> {
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

    const paymentProofs = await PaymentProof.find(query);

    return paymentProofs.reduce((total, proof) => total + proof.creditsRemaining, 0);
}

/**
 * Export pricing configuration for use in other modules
 */
export { PRICING };
