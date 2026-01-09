import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export const validate = (schema: { required?: string[] }) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!schema.required) return next();

        const missing = schema.required.filter(field => !req.body[field]);
        if (missing.length > 0) {
            return next(new ValidationError(`Missing required fields: ${missing.join(', ')}`));
        }
        next();
    };
};
