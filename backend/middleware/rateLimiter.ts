import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { SECURITY_CONFIG } from '../config/security';

// Standard library implementation as requested
export const rateLimiter = rateLimit({
    windowMs: SECURITY_CONFIG.RATE_LIMIT_WINDOW_MS,
    max: SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
        // Use User ID if authenticated, otherwise IP, plus the endpoint
        const userIdentifier = (req as any).user ? (req as any).user.id : req.ip;
        return `${userIdentifier}-${req.originalUrl}`;
    },
    message: {
        status: 429,
        message: "Too many requests, please try again later."
    }
});
