import app from './app';
import http from 'http';
import { BlockchainService } from './services/BlockchainService';

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

async function startServer() {
    try {
        // Database connection initialization would go here
        // await AppDataSource.initialize(); 
        // console.log("Data Source has been initialized!");

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
