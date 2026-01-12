import Agent, { IAgent } from '../models/Agent';

export class AgentRepo {
    static async create(data: Partial<IAgent>): Promise<IAgent | null> {
        return await Agent.findOneAndUpdate(
            { address: data.address },
            data,
            { upsert: true, new: true }
        );
    }

    static async findByAddress(address: string): Promise<IAgent | null> {
        return await Agent.findOne({ address });
    }

    static async findByUserId(userId: string): Promise<IAgent[]> {
        return await Agent.find({ user: userId });
    }

    static async updateStats(address: string, updates: Partial<IAgent>): Promise<IAgent | null> {
        return await Agent.findOneAndUpdate({ address }, updates, { new: true });
    }

    static async findAll(): Promise<IAgent[]> {
        return await Agent.find();
    }
}
