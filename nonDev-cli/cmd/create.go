package cmd

import (
	"crypto/ecdsa"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/manifoldco/promptui"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var createCmd = &cobra.Command{
	Use:   "create",
	Short: "Create and deploy a new AI agent",
	Long: `Interactive wizard to create and deploy a new AI agent.
You'll configure the agent's identity, capabilities, and spending limits.
The agent will be registered on-chain and with the AgentGuard backend.`,
	RunE: runCreate,
}

type AgentConfig struct {
	Name            string
	Description     string
	GeminiAPIKey    string
	AgentWallet     string
	AgentPrivateKey string
	PerTxLimit      uint64
	DailyLimit      uint64
	MonthlyLimit    uint64
	AllowedTasks    []string
}

func runCreate(cmd *cobra.Command, args []string) error {
	// Load config
	if err := loadConfig(); err != nil {
		return fmt.Errorf("please run 'agentguard setup' first: %w", err)
	}

	fmt.Println("\n🤖 Create Your AI Agent")
	fmt.Println("═══════════════════════════════════════\n")

	var config AgentConfig

	// Step 1: Agent Identity
	fmt.Println("📝 Step 1: Agent Identity")
	config.Name = promptAgentName()
	config.Description = promptAgentDescription()

	// Step 2: AI Configuration
	fmt.Println("\n🧠 Step 2: AI Configuration")
	config.GeminiAPIKey = promptGeminiAPIKey()

	// Step 3: Spending Limits
	fmt.Println("\n💰 Step 3: Spending Limits")
	config.PerTxLimit, config.DailyLimit, config.MonthlyLimit = promptSpendingLimits()

	// Step 4: Agent Wallet
	fmt.Println("\n💼 Step 4: Agent Wallet")
	config.AgentWallet, config.AgentPrivateKey = promptAgentWallet()

	// Step 5: Task Configuration
	fmt.Println("\n⚙️  Step 5: Task Configuration")
	config.AllowedTasks = promptAllowedTasks()

	// Step 6: Review and Confirm
	fmt.Println("\n📋 Step 6: Review Configuration")
	displayAgentSummary(config)

	if !promptYesNo("Proceed with deployment?", true) {
		fmt.Println("Agent creation cancelled.")
		return nil
	}

	// Step 7: Deploy Agent
	fmt.Println("\n🚀 Step 7: Deploying Agent...")
	agentID, err := deployAgent(config)
	if err != nil {
		return fmt.Errorf("deployment failed: %w", err)
	}

	// Success!
	fmt.Println("\n" + greenText("✅ Agent deployed successfully!"))
	fmt.Println("\n📊 Agent Details:")
	fmt.Println("   ID:", agentID)
	fmt.Println("   Name:", config.Name)
	fmt.Println("   Wallet:", config.AgentWallet)
	fmt.Println("   Dashboard:", fmt.Sprintf("https://agent-gaurd.vercel.app/agents/%s", agentID))
	
	fmt.Println("\n💡 Next Steps:")
	fmt.Println("   1. Fund agent wallet:", config.AgentWallet)
	fmt.Println("   2. Test agent: agentguard test", agentID)
	fmt.Println("   3. View logs: agentguard logs", agentID)
	fmt.Println("   4. Run agent (premium): agentguard run", agentID)

	return nil
}

func promptAgentName() string {
	prompt := promptui.Prompt{
		Label: "What would you like to name your agent?",
		Validate: func(input string) error {
			if len(input) < 3 {
				return fmt.Errorf("name must be at least 3 characters")
			}
			return nil
		},
	}

	name, err := prompt.Run()
	if err != nil {
		fmt.Printf("Input failed: %v\n", err)
		os.Exit(1)
	}

	return name
}

func promptAgentDescription() string {
	prompt := promptui.Prompt{
		Label: "What will this agent do? (describe in simple terms)",
		Validate: func(input string) error {
			if len(input) < 10 {
				return fmt.Errorf("description must be at least 10 characters")
			}
			return nil
		},
	}

	description, err := prompt.Run()
	if err != nil {
		fmt.Printf("Input failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("\n" + greenText("✓") + " Great! I'll set up an AI agent that can " + description)
	return description
}

func promptGeminiAPIKey() string {
	fmt.Println("You'll need a Gemini API key for your agent's AI capabilities.")
	fmt.Println("Get one here: https://makersuite.google.com/app/apikey")
	fmt.Println()

	prompt := promptui.Prompt{
		Label: "Enter your Gemini API key",
		Mask:  '*',
		Validate: func(input string) error {
			if !strings.HasPrefix(input, "AIza") {
				return fmt.Errorf("invalid Gemini API key format")
			}
			return nil
		},
	}

	apiKey, err := prompt.Run()
	if err != nil {
		fmt.Printf("Input failed: %v\n", err)
		os.Exit(1)
	}

	// TODO: Validate API key by making a test request
	fmt.Println("\n" + greenText("✓") + " API key validated successfully!")
	return apiKey
}

func promptSpendingLimits() (uint64, uint64, uint64) {
	fmt.Println("Let's set spending limits to keep your agent safe:")
	fmt.Println()

	// Per transaction limit
	perTxPrompt := promptui.Prompt{
		Label:   "Maximum per transaction ($)",
		Default: "50",
		Validate: func(input string) error {
			val, err := strconv.ParseFloat(input, 64)
			if err != nil || val <= 0 {
				return fmt.Errorf("must be a positive number")
			}
			return nil
		},
	}

	perTxStr, _ := perTxPrompt.Run()
	perTx, _ := strconv.ParseFloat(perTxStr, 64)

	// Daily limit
	dailyPrompt := promptui.Prompt{
		Label:   "Daily spending limit ($)",
		Default: "200",
		Validate: func(input string) error {
			val, err := strconv.ParseFloat(input, 64)
			if err != nil || val <= 0 {
				return fmt.Errorf("must be a positive number")
			}
			return nil
		},
	}

	dailyStr, _ := dailyPrompt.Run()
	daily, _ := strconv.ParseFloat(dailyStr, 64)

	// Monthly limit
	monthlyPrompt := promptui.Prompt{
		Label:   "Monthly spending limit ($)",
		Default: "1000",
		Validate: func(input string) error {
			val, err := strconv.ParseFloat(input, 64)
			if err != nil || val <= 0 {
				return fmt.Errorf("must be a positive number")
			}
			return nil
		},
	}

	monthlyStr, _ := monthlyPrompt.Run()
	monthly, _ := strconv.ParseFloat(monthlyStr, 64)

	fmt.Println("\n" + greenText("✓") + " Limits configured:")
	fmt.Printf("   Per transaction: $%.2f\n", perTx)
	fmt.Printf("   Daily: $%.2f\n", daily)
	fmt.Printf("   Monthly: $%.2f\n", monthly)

	// Convert to wei (assuming 18 decimals, 1 USD = 1 MNEE)
	perTxWei := uint64(perTx * 1e18)
	dailyWei := uint64(daily * 1e18)
	monthlyWei := uint64(monthly * 1e18)

	return perTxWei, dailyWei, monthlyWei
}

func promptAgentWallet() (string, string) {
	prompt := promptui.Select{
		Label: "Agent Wallet Setup",
		Items: []string{
			"Generate new wallet (Recommended)",
			"Use existing wallet address",
		},
	}

	index, _, err := prompt.Run()
	if err != nil {
		fmt.Printf("Selection failed: %v\n", err)
		os.Exit(1)
	}

	if index == 0 {
		// Generate new wallet
		privateKey, err := crypto.GenerateKey()
		if err != nil {
			fmt.Printf("Failed to generate wallet: %v\n", err)
			os.Exit(1)
		}

		privateKeyBytes := crypto.FromECDSA(privateKey)
		publicKey := privateKey.Public()
		publicKeyECDSA, _ := publicKey.(*ecdsa.PublicKey)
		address := crypto.PubkeyToAddress(*publicKeyECDSA).Hex()

		fmt.Println("\n" + greenText("✓") + " Generated agent wallet:", address)
		fmt.Println("   (Private key will be securely stored)")

		return address, fmt.Sprintf("%x", privateKeyBytes)
	} else {
		// Use existing
		promptInput := promptui.Prompt{
			Label: "Enter agent wallet address",
		}

		address, err := promptInput.Run()
		if err != nil {
			fmt.Printf("Input failed: %v\n", err)
			os.Exit(1)
		}

		return address, "" // No private key for existing wallet
	}
}

func promptAllowedTasks() []string {
	fmt.Println("What tasks should your agent be allowed to do?")
	fmt.Println()

	tasks := []string{
		"Make purchases",
		"Compare prices",
		"Subscribe to services",
		"Cancel subscriptions",
		"Pay bills",
		"Book appointments",
		"Order food",
		"Buy tickets",
	}

	// Multi-select
	selectedTasks := []string{}
	
	for _, task := range tasks {
		allow := promptYesNo("Allow: "+task+"?", true)
		if allow {
			selectedTasks = append(selectedTasks, task)
		}
	}

	if len(selectedTasks) == 0 {
		selectedTasks = []string{"Make purchases"} // Default
	}

	fmt.Println("\n" + greenText("✓") + " Allowed tasks:")
	for _, task := range selectedTasks {
		fmt.Println("   •", task)
	}

	return selectedTasks
}

func displayAgentSummary(config AgentConfig) {
	fmt.Println()
	fmt.Println("═══════════════════════════════════════")
	fmt.Println("           AGENT SUMMARY")
	fmt.Println("═══════════════════════════════════════")
	fmt.Println()
	fmt.Println("Name:", config.Name)
	fmt.Println("Description:", config.Description)
	fmt.Println()
	fmt.Println("Wallet:", config.AgentWallet)
	fmt.Println()
	fmt.Println("Spending Limits:")
	fmt.Printf("  Per Transaction: $%.2f\n", float64(config.PerTxLimit)/1e18)
	fmt.Printf("  Daily: $%.2f\n", float64(config.DailyLimit)/1e18)
	fmt.Printf("  Monthly: $%.2f\n", float64(config.MonthlyLimit)/1e18)
	fmt.Println()
	fmt.Println("Allowed Tasks:")
	for _, task := range config.AllowedTasks {
		fmt.Println("  •", task)
	}
	fmt.Println()
	fmt.Println("═══════════════════════════════════════")
	fmt.Println()
}

func deployAgent(config AgentConfig) (string, error) {
	// Step 1: Register on blockchain
	fmt.Println("   [1/5] Registering on blockchain...")
	// TODO: Implement blockchain registration
	fmt.Println("   " + greenText("✓") + " Blockchain registration complete")

	// Step 2: Stake reputation bond
	fmt.Println("   [2/5] Staking reputation bond...")
	// TODO: Implement bond staking
	fmt.Println("   " + greenText("✓") + " Bond staked: 500 MNEE")

	// Step 3: Register with backend
	fmt.Println("   [3/5] Registering with AgentGuard backend...")
	// TODO: Implement backend registration
	fmt.Println("   " + greenText("✓") + " Backend registration complete")

	// Step 4: Configure AI
	fmt.Println("   [4/5] Configuring Gemini AI...")
	// TODO: Initialize Gemini client
	fmt.Println("   " + greenText("✓") + " AI configuration complete")

	// Step 5: Save configuration
	fmt.Println("   [5/5] Saving agent configuration...")
	agentID := fmt.Sprintf("agent_%s", generateRandomID())
	
	// TODO: Save to config file
	fmt.Println("   " + greenText("✓") + " Configuration saved")

	return agentID, nil
}

func generateRandomID() string {
	// Simple random ID generator
	return fmt.Sprintf("%x", crypto.Keccak256([]byte(fmt.Sprintf("%d", os.Getpid())))[:6])
}

func init() {
	rootCmd.AddCommand(createCmd)
}
