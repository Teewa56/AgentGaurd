import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure API key is present
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("WARNING: GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || 'mock_key');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export interface DisputeContext {
    txId: number;
    agentCharter: string;
    transactionMetadata: string;
    userClaim: string;
    merchantEvidence?: string;
}

export interface ArbitrationResult {
    refundPercent: number;
    slashAmount: string; // amount in MNEE (wei)
    reasoning: string;
}

export class GeminiService {
    async analyzeDispute(context: DisputeContext): Promise<ArbitrationResult> {
        const prompt = `
      You are an AI Arbitrator for AgentGuard, a protocol for autonomous AI agent commerce.
      Your task is to analyze a transaction dispute and determine the outcome.

      DISPUTE CONTEXT:
      - Transaction ID: ${context.txId}
      - Agent Charter (Behavior Policies): ${context.agentCharter}
      - Transaction Details: ${context.transactionMetadata}
      - User Claim: ${context.userClaim}
      - Merchant Evidence: ${context.merchantEvidence || 'None provided'}

      INSTRUCTIONS:
      1. Determine if the agent violated its charter.
      2. Decide on a refund percentage for the user (0-100).
      3. Decide if the agent should be penalized (slashed) from its bond.
      4. Provide a clear, concise reasoning for the decision.

      RESPONSE FORMAT (JSON ONLY):
      {
        "refundPercent": number,
        "slashAmount": "string",
        "reasoning": "string"
      }
      Do not include markdown formatting like \`\`\`json. Just the raw JSON object.
    `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up potential markdown formatting if model ignores instruction
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const parsed = JSON.parse(cleanJson);

            return {
                refundPercent: parsed.refundPercent,
                slashAmount: parsed.slashAmount || "0",
                reasoning: parsed.reasoning
            };

        } catch (error) {
            console.error("Error in Gemini Arbitration:", error);
            // Fallback
            return {
                refundPercent: 0,
                slashAmount: "0",
                reasoning: "AI Arbitration failed due to technical error. Escalating to human review."
            };
        }
    }
}
