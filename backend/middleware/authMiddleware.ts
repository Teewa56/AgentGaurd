import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';
import { SECURITY_CONFIG } from '../config/security';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader: any = req.headers['authorization'];
    const headerToken = authHeader?.split(' ')[1];
    const cookieToken = req.cookies?.accessToken;

    const token = cookieToken || headerToken;

    if (!token) {
        console.error(`[Auth] No token provided. Headers: ${JSON.stringify(req.headers)}, Cookies: ${JSON.stringify(req.cookies)}`);
        return next(new UnauthorizedError('No token provided'));
    }

    jwt.verify(token, SECURITY_CONFIG.JWT_SECRET as string, (err: any, user: any) => {
        if (err) {
            console.error(`[Auth] Token verification failed: ${err.message}`);
            return next(new UnauthorizedError('Invalid token'));
        }
        req.user = user;
        next();
    });
};
