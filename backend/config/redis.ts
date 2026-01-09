import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Redis Client Connected');
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error;
    }
};

export default redisClient;
