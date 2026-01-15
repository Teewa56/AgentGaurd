package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

func loadConfig() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}

	configFile := filepath.Join(homeDir, ".agentguard", "config.yaml")
	
	if _, err := os.Stat(configFile); os.IsNotExist(err) {
		return fmt.Errorf("config file not found")
	}

	viper.SetConfigFile(configFile)
	return viper.ReadInConfig()
}

func getConfigValue(key string) string {
	return viper.GetString(key)
}

func getConfigInt(key string) int {
	return viper.GetInt(key)
}
