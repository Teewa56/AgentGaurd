import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';
import { SECURITY_CONFIG } from '../config/security';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next(new UnauthorizedError('No token provided'));
    }

    jwt.verify(token, SECURITY_CONFIG.JWT_SECRET, (err: any, user: any) => {
        if (err) {
            return next(new UnauthorizedError('Invalid token'));
        }
        req.user = user;
        next();
    });
};
