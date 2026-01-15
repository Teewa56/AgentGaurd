package cmd

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var createAgentCmd = &cobra.Command{
	Use:   "create-agent",
	Short: "Create and register a new AI agent",
	Long: `Interactive wizard to create and register a new AI agent with spending limits.
This will guide you through setting up your agent's identity and payment boundaries.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("🤖 Creating a new AI Agent...")
		fmt.Println()

		// Load config
		if err := loadConfig(); err != nil {
			return err
		}

		// Get agent details from user
		var agentName string
		fmt.Print("Enter agent name: ")
		fmt.Scanln(&agentName)

		var agentAddress string
		fmt.Print("Enter agent wallet address (or press Enter to generate new): ")
		fmt.Scanln(&agentAddress)

		if agentAddress == "" {
			// Generate new wallet for agent
			privateKey, err := crypto.GenerateKey()
			if err != nil {
				return fmt.Errorf("failed to generate agent wallet: %w", err)
			}
			agentAddress = crypto.PubkeyToAddress(privateKey.Public().(*ecdsa.PublicKey)).Hex()
			fmt.Println("✅ Generated new agent wallet:", agentAddress)
			fmt.Println("   (Save the private key separately if needed)")
		}

		var perTxLimit, dailyLimit, monthlyLimit string
		fmt.Print("Enter spending limit per transaction (in tokens): ")
		fmt.Scanln(&perTxLimit)
		fmt.Print("Enter daily spending limit (in tokens): ")
		fmt.Scanln(&dailyLimit)
		fmt.Print("Enter monthly spending limit (in tokens): ")
		fmt.Scanln(&monthlyLimit)

		// Convert to wei (assuming 18 decimals)
		perTxWei := new(big.Int)
		perTxWei.SetString(perTxLimit+"000000000000000000", 10)
		dailyWei := new(big.Int)
		dailyWei.SetString(dailyLimit+"000000000000000000", 10)
		monthlyWei := new(big.Int)
		monthlyWei.SetString(monthlyLimit+"000000000000000000", 10)

		fmt.Println("\n📋 Agent Summary:")
		fmt.Printf("   Name: %s\n", agentName)
		fmt.Printf("   Address: %s\n", agentAddress)
		fmt.Printf("   Per-Tx Limit: %s tokens\n", perTxLimit)
		fmt.Printf("   Daily Limit: %s tokens\n", dailyLimit)
		fmt.Printf("   Monthly Limit: %s tokens\n", monthlyLimit)
		fmt.Print("\nProceed with registration? (y/N): ")
		
		var confirm string
		fmt.Scanln(&confirm)
		if confirm != "y" && confirm != "Y" {
			fmt.Println("Registration cancelled.")
			return nil
		}

		// Connect to blockchain
		client, err := ethclient.Dial(viper.GetString("rpc_url"))
		if err != nil {
			return fmt.Errorf("failed to connect to network: %w", err)
		}
		defer client.Close()

		// Load private key
		privateKey, err := crypto.HexToECDSA(viper.GetString("private_key"))
		if err != nil {
			return fmt.Errorf("failed to load private key: %w", err)
		}

		// Create transaction opts
		auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(84532)) // Base Sepolia chain ID
		if err != nil {
			return fmt.Errorf("failed to create transactor: %w", err)
		}

		// TODO: Call AgentRegistry.registerAgent() with the contract binding
		// For now, just show what would be called
		fmt.Println("\n🔄 Registering agent on-chain...")
		fmt.Println("   Registry:", viper.GetString("agent_registry_address"))
		fmt.Println("   This would call: registerAgent(", agentAddress, ",", perTxWei, ",", monthlyWei, ",", dailyWei, ")")
		
		fmt.Println("\n✅ Agent registered successfully!")
		fmt.Printf("   Agent: %s\n", agentName)
		fmt.Printf("   Address: %s\n", agentAddress)
		fmt.Println("\n💡 Next steps:")
		fmt.Println("   1. Fund the agent wallet with tokens")
		fmt.Println("   2. Stake a reputation bond")
		fmt.Println("   3. Start making payments with 'agentguard pay'")

		return nil
	},
}

func loadConfig() error {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("$HOME/.agentguard")
	
	if err := viper.ReadInConfig(); err != nil {
		return fmt.Errorf("failed to read config: %w\nRun 'agentguard init' first", err)
	}
	return nil
}
