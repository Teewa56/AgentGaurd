import app from './app';
import http from 'http';
import dotenv from 'dotenv';
import { BlockchainService } from './services/BlockchainService';
import connectDB from './config/dbconfig';
import { connectRedis } from './config/redis';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

async function startServer() {
    try {
        // 1. Database Connection
        await connectDB();
        console.log(" MongoDB Connected Successfully");

        // 2. Redis Connection 
        try {
            await connectRedis();
        } catch (error) {
            console.error("Redis Connection Failed (Continuing without cache):", error);
        }

        // 3. Blockchain Service
        if (process.env.PRIVATE_KEY && process.env.ESCROW_PAYMENT_ADDRESS) {
            const blockchainService = new BlockchainService();
            await blockchainService.listenForDisputes();
        } else {
            console.warn(" Blockchain service NOT initialized: Missing environment variables.");
        }

        // 4. Start Server
        server.listen(PORT, () => {
            console.log(` AgentGuard Backend running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("CRITICAL: Error during server startup:", error);
        process.exit(1);
    }
}

startServer();
