import { GeminiService } from '../services/LLMService';

// Mock GoogleGenerativeAI
jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockResolvedValue({
                    response: {
                        text: jest.fn().mockReturnValue('{"refundPercent": 100, "slashAmount": "0", "reasoning": "Test reasoning"}')
                    }
                })
            })
        }))
    };
});

describe('GeminiService', () => {
    let service: GeminiService;

    beforeEach(() => {
        service = new GeminiService();
    });

    it('should analyze dispute and return parsed result', async () => {
        const result = await service.analyzeDispute({
            txId: 1,
            agentCharter: 'No refund',
            transactionMetadata: 'Item not delivered',
            userClaim: 'Where is my item?'
        });

        expect(result.refundPercent).toBe(100);
        expect(result.reasoning).toBe('Test reasoning');
    });
});
