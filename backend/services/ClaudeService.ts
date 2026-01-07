import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

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

export class ClaudeService {
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
    `;

        try {
            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }],
            });

            const content = response.content[0];
            if (content.type === 'text') {
                const result = JSON.parse(content.text);
                return {
                    refundPercent: result.refundPercent,
                    slashAmount: result.slashAmount || "0",
                    reasoning: result.reasoning
                };
            }
            throw new Error("Unexpected response from Claude");
        } catch (error) {
            console.error("Error in Claude Arbitration:", error);
            // Fallback for demo purposes if API fails or key is missing
            return {
                refundPercent: 0,
                slashAmount: "0",
                reasoning: "AI Arbitration failed due to technical error. Escalating to human review."
            };
        }
    }
}
