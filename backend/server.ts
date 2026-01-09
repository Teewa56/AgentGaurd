import app from './app';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { BlockchainService } from './services/BlockchainService';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

async function startServer() {
    try {
        // Database connection initialization
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not defined in environment");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log(" MongoDB Connected Successfully");

        // Blockchain service initialization
        if (process.env.PRIVATE_KEY && process.env.ESCROW_ADDRESS) {
            const blockchainService = new BlockchainService();
            await blockchainService.listenForDisputes();
        } else {
            console.warn(" Blockchain service NOT initialized: Missing environment variables.");
        }

        server.listen(PORT, () => {
            console.log(` AgentGuard Backend running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error during server startup:", error);
        process.exit(1);
    }
}

startServer();
