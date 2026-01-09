import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

export class IPFSService {
    private static PINATA_API_KEY = process.env.PINATA_API_KEY;
    private static PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
    private static PINATA_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

    static async uploadJSON(data: any): Promise<string> {
        try {
            if (!this.PINATA_API_KEY || !this.PINATA_SECRET_KEY) {
                console.warn("Missing Pinata Keys. Returning mock CID for dev flow.");
                return `ipfs://QmMock${Date.now()}`;
            }

            const response = await axios.post(this.PINATA_URL, data, {
                headers: {
                    'pinata_api_key': this.PINATA_API_KEY,
                    'pinata_secret_api_key': this.PINATA_SECRET_KEY
                }
            });

            return `ipfs://${response.data.IpfsHash}`;
        } catch (error) {
            console.error("IPFS Upload Error:", error);
            throw new Error("Failed to upload to IPFS");
        }
    }

    static async fetchJSON(cid: string): Promise<any> {
        try {
            // Remove 'ipfs://' prefix
            const hash = cid.replace('ipfs://', '');
            const gateway = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

            const response = await axios.get(`${gateway}${hash}`);
            return response.data;
        } catch (error) {
            console.error("IPFS Fetch Error:", error);
            return null;
        }
    }
}
