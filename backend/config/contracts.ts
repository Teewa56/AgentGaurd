import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const loadAbi = (filename: string) => {
    try {
        const p = path.join(process.cwd(), 'abis', filename);
        if (!fs.existsSync(p)) return [];
        return JSON.parse(fs.readFileSync(p, 'utf8')).abi;
    } catch (e) {
        console.warn(`Warning: Could not load ABI for ${filename}`);
        return [];
    }
};

export const CONTRACTS = {
    ESCROW_PAYMENT: {
        ADDRESS: process.env.ESCROW_PAYMENT_ADDRESS || '',
        ABI: loadAbi('EscrowPayment.json')
    },
    DISPUTE_RESOLUTION: {
        ADDRESS: process.env.DISPUTE_RESOLUTION_ADDRESS || '',
        ABI: loadAbi('DisputeResolution.json')
    },
    AGENT_REGISTRY: {
        ADDRESS: process.env.AGENT_REGISTRY_ADDRESS || '',
        ABI: loadAbi('AgentRegistry.json')
    },
    INSURANCE_POOL: {
        ADDRESS: process.env.INSURANCE_POOL_ADDRESS || '',
        ABI: loadAbi('InsurancePool.json')
    }
};
