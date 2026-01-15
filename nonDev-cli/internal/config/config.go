package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

type Config struct {
	Network        string        `mapstructure:"network"`
	RPCUrl         string        `mapstructure:"rpc_url"`
	WalletAddress  string        `mapstructure:"wallet_address"`
	PrivateKey     string        `mapstructure:"private_key"`
	BackendURL     string        `mapstructure:"backend_url"`
	APIKey         string        `mapstructure:"api_key"`
	Agents         []AgentConfig `mapstructure:"agents"`
}

type AgentConfig struct {
	ID              string   `mapstructure:"id"`
	Name            string   `mapstructure:"name"`
	Description     string   `mapstructure:"description"`
	GeminiAPIKey    string   `mapstructure:"gemini_api_key"`
	AgentWallet     string   `mapstructure:"agent_wallet"`
	AgentPrivateKey string   `mapstructure:"agent_private_key"`
	PerTxLimit      uint64   `mapstructure:"per_tx_limit"`
	DailyLimit      uint64   `mapstructure:"daily_limit"`
	MonthlyLimit    uint64   `mapstructure:"monthly_limit"`
	AllowedTasks    []string `mapstructure:"allowed_tasks"`
	IsActive        bool     `mapstructure:"is_active"`
}

func LoadConfig() (*Config, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get home directory: %w", err)
	}

	configDir := filepath.Join(homeDir, ".agentguard")
	viper.AddConfigPath(configDir)
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config: %w", err)
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &cfg, nil
}

func SaveConfig(cfg *Config) error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	configDir := filepath.Join(homeDir, ".agentguard")
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	viper.Set("network", cfg.Network)
	viper.Set("rpc_url", cfg.RPCUrl)
	viper.Set("wallet_address", cfg.WalletAddress)
	viper.Set("private_key", cfg.PrivateKey)
	viper.Set("backend_url", cfg.BackendURL)
	viper.Set("api_key", cfg.APIKey)
	viper.Set("agents", cfg.Agents)

	return viper.WriteConfigAs(filepath.Join(configDir, "config.yaml"))
}
