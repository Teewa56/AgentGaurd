package cmd

import (
	"crypto/ecdsa"
	"fmt"
	"os"
	"path/filepath"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize AgentGuard configuration",
	Long: `Initialize your local AgentGuard environment.
This will create a configuration file and optionally generate a new wallet.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("🚀 Initializing AgentGuard CLI...")

		// Create config directory
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return fmt.Errorf("failed to get home directory: %w", err)
		}

		configDir := filepath.Join(homeDir, ".agentguard")
		if err := os.MkdirAll(configDir, 0700); err != nil {
			return fmt.Errorf("failed to create config directory: %w", err)
		}

		configFile := filepath.Join(configDir, "config.yaml")

		// Check if config already exists
		if _, err := os.Stat(configFile); err == nil {
			fmt.Println("⚠️  Configuration already exists at:", configFile)
			fmt.Print("Do you want to overwrite it? (y/N): ")
			var response string
			fmt.Scanln(&response)
			if response != "y" && response != "Y" {
				fmt.Println("Initialization cancelled.")
				return nil
			}
		}

		// Generate new wallet
		privateKey, err := crypto.GenerateKey()
		if err != nil {
			return fmt.Errorf("failed to generate private key: %w", err)
		}

		privateKeyBytes := crypto.FromECDSA(privateKey)
		publicKey := privateKey.Public()
		publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
		if !ok {
			return fmt.Errorf("failed to cast public key to ECDSA")
		}

		address := crypto.PubkeyToAddress(*publicKeyECDSA).Hex()

		// Set up viper config
		viper.Set("network", "base-sepolia")
		viper.Set("rpc_url", "https://sepolia.base.org")
		viper.Set("wallet_address", address)
		viper.Set("private_key", fmt.Sprintf("%x", privateKeyBytes))
		viper.Set("agent_registry_address", "0x0244c18f9e9ca059960a9e6333b00bc34e917d92")
		viper.Set("escrow_payment_address", "0xd33447e97ae6fb33eef5591384dc46dbdba5a5cd")
		viper.Set("reputation_bond_address", "0x0e7a0e6ba48d9e1fd30362f4f2c900cff258c893")

		viper.SetConfigFile(configFile)
		if err := viper.WriteConfig(); err != nil {
			return fmt.Errorf("failed to write config: %w", err)
		}

		fmt.Println("\n✅ AgentGuard initialized successfully!")
		fmt.Println("\n📝 Configuration saved to:", configFile)
		fmt.Println("\n💼 Your wallet address:", address)
		fmt.Println("\n⚠️  IMPORTANT: Fund this wallet with Base Sepolia ETH and tokens")
		fmt.Println("   Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia")
		fmt.Println("\n🔐 Your private key is stored securely in the config file.")
		fmt.Println("   Never share this file with anyone!")

		return nil
	},
}
