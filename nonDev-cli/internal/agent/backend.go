package agent

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// BackendClient handles communication with the AgentGuard backend.
type BackendClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewBackendClient(baseURL string) *BackendClient {
	return &BackendClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// RegisterAgent registers a new agent with the backend.
func (b *BackendClient) RegisterAgent(data map[string]interface{}) error {
	return b.post("/api/agents/register", data)
}

// FetchTasks retrieves pending tasks for an agent.
func (b *BackendClient) FetchTasks(agentAddress string) ([]map[string]interface{}, error) {
	// Implementation logic for GET request
	return nil, nil
}

func (b *BackendClient) post(endpoint string, data interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	resp, err := b.HTTPClient.Post(b.BaseURL+endpoint, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("backend error: status %d", resp.StatusCode)
	}

	return nil
}
