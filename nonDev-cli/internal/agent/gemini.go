package agent

import (
	"context"
	"fmt"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// GeminiClient handles communication with Google's Gemini AI.
type GeminiClient struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

func NewGeminiClient(ctx context.Context, apiKey string) (*GeminiClient, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create genai client: %w", err)
	}

	model := client.GenerativeModel("gemini-pro")
	
	// Set default safety settings and configuration
	model.SetTemperature(0.7)
	model.SetTopK(40)
	model.SetTopP(0.95)

	return &GeminiClient{
		client: client,
		model:  model,
	}, nil
}

// AnalyzeTask uses Gemini to decide how to handle a task.
func (g *GeminiClient) AnalyzeTask(ctx context.Context, description string, task string) (string, error) {
	prompt := fmt.Sprintf(`You are an autonomous AI agent. 
Your persona: %s

Current task: %s

Decide what action to take. If a financial transaction is required, specify the amount and recipient.
Provide your reasoning.`, description, task)

	resp, err := g.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) == 0 {
		return "", fmt.Errorf("no response from Gemini")
	}

	// Simple extraction of text content
	var result string
	for _, part := range resp.Candidates[0].Content.Parts {
		result += fmt.Sprintf("%v", part)
	}

	return result, nil
}

func (g *GeminiClient) Close() error {
	return g.client.Close()
}
