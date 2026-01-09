import crypto from 'crypto';

export class CryptoUtils {
    static generateSecret(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    static hash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    static verifySignature(message: string, signature: string, address: string): boolean {
        // Placeholder for signature verification logic (e.g. using ethers)
        // For now, this is a mock implementation
        // Real implementation would use ethers.verifyMessage(message, signature) === address
        return true;
    }
}
