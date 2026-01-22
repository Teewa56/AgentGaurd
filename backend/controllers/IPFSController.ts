import { Request, Response, NextFunction } from 'express';
import { IPFSService } from '../services/IPFSservice';

export class IPFSController {
    static async uploadMetadata(req: Request, res: Response, next: NextFunction) {
        try {
            const { metadata } = req.body;
            if (!metadata) {
                return res.status(400).json({ error: 'Metadata is required' });
            }

            // metadata can be an object or a string
            const dataToUpload = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

            const cid = await IPFSService.uploadJSON(dataToUpload);

            res.json({ cid });
        } catch (error) {
            next(error);
        }
    }
}
