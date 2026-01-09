import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { SECURITY_CONFIG } from '../config/security';
import { UnauthorizedError } from '../utils/errors';

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password, role } = req.body;

            // Validation handled by middleware

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }

            const salt = await bcrypt.genSalt(SECURITY_CONFIG.BCRYPT_SALT_ROUNDS);
            const passwordHash = await bcrypt.hash(password, salt);

            const newUser = new User({
                email,
                passwordHash,
                role: role || 'user'
            });

            await newUser.save();

            res.status(201).json({ message: "User registered successfully" });
        } catch (error) {
            next(error);
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Generate Access Token (Short Lived)
            const accessToken = jwt.sign(
                { id: user._id, role: user.role },
                SECURITY_CONFIG.JWT_SECRET,
                { expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN }
            );

            // Generate Refresh Token (Long Lived)
            const refreshToken = jwt.sign(
                { id: user._id, role: user.role },
                SECURITY_CONFIG.JWT_REFRESH_SECRET,
                { expiresIn: SECURITY_CONFIG.JWT_REFRESH_EXPIRES_IN }
            );

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                accessToken,
                user: { id: user._id, email: user.email, role: user.role }
            });
        } catch (error) {
            next(error);
        }
    }

    static async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            if (!refreshToken) {
                throw new UnauthorizedError("Refresh token missing");
            }

            jwt.verify(refreshToken, SECURITY_CONFIG.JWT_REFRESH_SECRET, (err: any, decoded: any) => {
                if (err) {
                    throw new UnauthorizedError("Invalid refresh token");
                }

                // Generate new Access Token
                const accessToken = jwt.sign(
                    { id: decoded.id, role: decoded.role },
                    SECURITY_CONFIG.JWT_SECRET,
                    { expiresIn: SECURITY_CONFIG.JWT_EXPIRES_IN }
                );

                res.json({ accessToken });
            });
        } catch (error) {
            next(error);
        }
    }
}
