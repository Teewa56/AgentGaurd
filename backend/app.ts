import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import agentRoutes from './routes/agentRoutes';
import disputeRoutes from './routes/disputeRoutes';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { errorHandler } from './middleware/errorHandler';
import { SECURITY_CONFIG } from './config/security';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    credentials: true,
    origin: SECURITY_CONFIG.CORS_ORIGIN,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(cookieParser());
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection

app.set('trust proxy', 1);

// Basic Route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handler
app.use(errorHandler);

export default app;
