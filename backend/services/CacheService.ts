import redisClient from '../config/redis';

export class CacheService {
    static async get(key: string): Promise<any | null> {
        try {
            const data = await redisClient.get(key);
            if (data) return JSON.parse(data);
            return null;
        } catch (error) {
            console.error(`Cache Get Error (${key}):`, error);
            return null;
        }
    }

    static async set(key: string, value: any, ttlSeconds: number = 300) {
        try {
            await redisClient.set(key, JSON.stringify(value), {
                EX: ttlSeconds
            });
        } catch (error) {
            console.error(`Cache Set Error (${key}):`, error);
        }
    }

    static async del(key: string) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error(`Cache Del Error (${key}):`, error);
        }
    }
}
