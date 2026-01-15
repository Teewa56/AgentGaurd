import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UnauthorizedError } from '../utils/errors';
import { AuthRequest } from './authMiddleware';

interface CLISession {
    userId: string;
    agentAddress?: string;
    createdAt: Date;
    lastUsed: Date;
    requestCount: number;
}

// In-memory store for CLI sessions (in production, use Redis)
const cliSessions = new Map<string, CLISession>();

// Rate limiting configuration
const RATE_LIMIT = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
};

/**
 * Middleware for CLI authentication
 * Supports API key authentication for CLI tools
 */
export const authenticateCLI = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const apiKey = req.headers['x-cli-api-key'] as string;
        const cliVersion = req.headers['x-cli-version'] as string;

        if (!apiKey) {
            throw new UnauthorizedError('CLI API key required');
        }

        // Verify API key format
        if (!isValidAPIKey(apiKey)) {
            throw new UnauthorizedError('Invalid API key format');
        }

        // Get or create session
        let session = cliSessions.get(apiKey);

        if (!session) {
            // New session - verify API key with database
            // For now, we'll create a session (in production, verify against database)
            session = {
                userId: extractUserIdFromAPIKey(apiKey),
                createdAt: new Date(),
                lastUsed: new Date(),
                requestCount: 0
            };
            cliSessions.set(apiKey, session);
        }

        // Rate limiting
        const now = new Date();
        const timeSinceLastReset = now.getTime() - session.lastUsed.getTime();

        if (timeSinceLastReset > RATE_LIMIT.windowMs) {
            // Reset counter
            session.requestCount = 0;
            session.lastUsed = now;
        }

        session.requestCount++;

        if (session.requestCount > RATE_LIMIT.maxRequests) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Maximum ${RATE_LIMIT.maxRequests} requests per minute`,
                retryAfter: Math.ceil((RATE_LIMIT.windowMs - timeSinceLastReset) / 1000)
            });
        }

        // Attach user info to request
        req.user = {
            id: session.userId,
            role: 'cli_user'
        };

        // Log CLI version for analytics
        if (cliVersion) {
            req.headers['x-client-type'] = `cli-${cliVersion}`;
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Generate a new CLI API key
 */
export function generateCLIAPIKey(userId: string): string {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(32).toString('hex');
    const userPart = Buffer.from(userId).toString('base64url');

    return `agcli_${timestamp}_${userPart}_${randomPart}`;
}

/**
 * Validate API key format
 */
function isValidAPIKey(apiKey: string): boolean {
    return /^agcli_[a-z0-9]+_[A-Za-z0-9_-]+_[a-f0-9]{64}$/.test(apiKey);
}

/**
 * Extract user ID from API key
 */
function extractUserIdFromAPIKey(apiKey: string): string {
    const parts = apiKey.split('_');
    if (parts.length < 4) {
        throw new UnauthorizedError('Invalid API key format');
    }

    try {
        return Buffer.from(parts[2], 'base64url').toString();
    } catch {
        throw new UnauthorizedError('Invalid API key format');
    }
}

/**
 * Cleanup old sessions (call periodically)
 */
export function cleanupCLISessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, session] of cliSessions.entries()) {
        if (now.getTime() - session.lastUsed.getTime() > maxAge) {
            cliSessions.delete(key);
        }
    }
}

// Cleanup sessions every hour
setInterval(cleanupCLISessions, 60 * 60 * 1000);
