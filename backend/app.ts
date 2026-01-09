import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
//santization 
import agentRoutes from './routes/agentRoutes';
import disputeRoutes from './routes/disputeRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Basic Route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/disputes', disputeRoutes);

// Error Handler
app.use(errorHandler);

export default app;
