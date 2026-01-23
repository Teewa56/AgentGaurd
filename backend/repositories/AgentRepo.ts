import Agent, { IAgent } from '../models/Agent';

export class AgentRepo {
    static async create(data: Partial<IAgent>): Promise<IAgent | null> {
        if (data.address) data.address = data.address.toLowerCase();
        return await Agent.findOneAndUpdate(
            { address: data.address },
            data,
            { upsert: true, new: true }
        );
    }

    static async findByAddress(address: string): Promise<IAgent | null> {
        return await Agent.findOne({ address: address.toLowerCase() });
    }

    static async findByUserId(userId: string): Promise<IAgent[]> {
        return await Agent.find({ user: userId });
    }

    static async updateStats(address: string, updates: Partial<IAgent>): Promise<IAgent | null> {
        return await Agent.findOneAndUpdate({ address: address.toLowerCase() }, updates, { new: true });
    }

    static async findAll(): Promise<IAgent[]> {
        return await Agent.find();
    }

    static async getLatestUpdate(): Promise<Date | null> {
        const latest = await Agent.findOne().sort({ updatedAt: -1, createdAt: -1 }).select('updatedAt createdAt');
        if (!latest) return null;
        return latest.updatedAt || latest.createdAt || null;
    }
}
