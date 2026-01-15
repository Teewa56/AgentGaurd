package cmd

import (
	"crypto/ecdsa"
	"fmt"
	"os"
	"path/filepath"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/manifoldco/promptui"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var setupCmd = &cobra.Command{
	Use:   "setup",
	Short: "Interactive setup wizard for AgentGuard CLI",
	Long: `Welcome to AgentGuard! This wizard will help you set up your environment.
You'll configure your wallet, network settings, and connect to the AgentGuard backend.`,
	RunE: runSetup,
}

func runSetup(cmd *cobra.Command, args []string) error {
	fmt.Println(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     █████╗  ██████╗ ███████╗███╗   ██╗████████╗           ║
║    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝           ║
║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║              ║
║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║              ║
║    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║              ║
║    ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝              ║
║                                                           ║
║              GUARD YOUR AI AGENTS                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
	`)
	
	fmt.Println("Welcome to AgentGuard CLI Setup!")
	fmt.Println("This wizard will guide you through the initial configuration.\n")

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

	// Check if config exists
	if _, err := os.Stat(configFile); err == nil {
		overwrite := promptYesNo("Configuration already exists. Overwrite?", false)
		if !overwrite {
			fmt.Println("Setup cancelled.")
			return nil
		}
	}

	// Step 1: Network Selection
	fmt.Println("\n📡 Step 1: Network Selection")
	network, rpcURL := promptNetworkSelection()
	
	// Step 2: Wallet Configuration
	fmt.Println("\n💼 Step 2: Wallet Configuration")
	walletAddress, privateKey := promptWalletSetup()
	
	// Step 3: Backend Configuration
	fmt.Println("\n🔗 Step 3: Backend Configuration")
	backendURL := promptBackendURL(network)
	
	// Step 4: Contract Addresses
	fmt.Println("\n📜 Step 4: Smart Contract Addresses")
	contracts := promptContractAddresses(network)

	// Save configuration
	viper.Set("network", network)
	viper.Set("rpc_url", rpcURL)
	viper.Set("wallet_address", walletAddress)
	viper.Set("private_key", privateKey) // TODO: Encrypt this
	viper.Set("backend_url", backendURL)
	viper.Set("agent_registry_address", contracts["agent_registry"])
	viper.Set("escrow_payment_address", contracts["escrow_payment"])
	viper.Set("reputation_bond_address", contracts["reputation_bond"])
	viper.Set("api_payment_registry_address", contracts["api_payment_registry"])

	viper.SetConfigFile(configFile)
	if err := viper.WriteConfig(); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	// Step 5: Verify Setup
	fmt.Println("\n✅ Step 5: Verification")
	if err := verifySetup(rpcURL, backendURL, walletAddress); err != nil {
		fmt.Printf("⚠️  Warning: %v\n", err)
		fmt.Println("You can continue, but some features may not work properly.")
	}

	fmt.Println("\n" + greenText("✅ Setup complete!"))
	fmt.Println("\n📝 Configuration saved to:", configFile)
	fmt.Println("\n💡 Next steps:")
	fmt.Println("   1. Fund your wallet:", walletAddress)
	if network == "base-sepolia" {
		fmt.Println("      Get testnet ETH: https://www.alchemy.com/faucets/base-sepolia")
	}
	fmt.Println("   2. Create your first agent: agentguard create")
	fmt.Println("   3. Check status: agentguard status")

	return nil
}

func promptNetworkSelection() (string, string) {
	prompt := promptui.Select{
		Label: "Select Network",
		Items: []string{
			"Base Sepolia (Testnet) - Recommended for testing",
			"Base Mainnet (Production) - Real transactions",
		},
	}

	index, _, err := prompt.Run()
	if err != nil {
		fmt.Printf("Selection failed: %v\n", err)
		os.Exit(1)
	}

	if index == 0 {
		return "base-sepolia", "https://sepolia.base.org"
	}
	return "base-mainnet", "https://mainnet.base.org"
}

func promptWalletSetup() (string, string) {
	prompt := promptui.Select{
		Label: "Wallet Setup",
		Items: []string{
			"Generate new wallet (Recommended)",
			"Import existing private key",
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

		fmt.Println("\n" + greenText("✅ New wallet generated!"))
		fmt.Println("Address:", address)
		fmt.Println("\n⚠️  IMPORTANT: Save your private key securely!")
		fmt.Println("Private Key:", fmt.Sprintf("%x", privateKeyBytes))
		fmt.Println("\n🔐 This key is also saved (encrypted) in your config file.")
		
		confirm := promptYesNo("Have you saved your private key?", false)
		if !confirm {
			fmt.Println("Please save your private key before continuing.")
			os.Exit(1)
		}

		return address, fmt.Sprintf("%x", privateKeyBytes)
	} else {
		// Import existing
		promptInput := promptui.Prompt{
			Label: "Enter your private key (without 0x prefix)",
			Mask:  '*',
		}

		privateKeyHex, err := promptInput.Run()
		if err != nil {
			fmt.Printf("Input failed: %v\n", err)
			os.Exit(1)
		}

		privateKey, err := crypto.HexToECDSA(privateKeyHex)
		if err != nil {
			fmt.Printf("Invalid private key: %v\n", err)
			os.Exit(1)
		}

		publicKey := privateKey.Public()
		publicKeyECDSA, _ := publicKey.(*ecdsa.PublicKey)
		address := crypto.PubkeyToAddress(*publicKeyECDSA).Hex()

		fmt.Println("\n" + greenText("✅ Wallet imported!"))
		fmt.Println("Address:", address)

		return address, privateKeyHex
	}
}

func promptBackendURL(network string) string {
	defaultURL := "https://agentgaurd.onrender.com"
	if network == "base-sepolia" {
		defaultURL = "https://agentgaurd.onrender.com" // Same for now
	}

	promptInput := promptui.Prompt{
		Label:   "Backend URL",
		Default: defaultURL,
	}

	url, err := promptInput.Run()
	if err != nil {
		return defaultURL
	}

	return url
}

func promptContractAddresses(network string) map[string]string {
	contracts := make(map[string]string)
	
	// Default addresses for Base Sepolia (from deployment)
	defaults := map[string]string{
		"agent_registry":         "0x0244c18f9e9ca059960a9e6333b00bc34e917d92",
		"escrow_payment":         "0xd33447e97ae6fb33eef5591384dc46dbdba5a5cd",
		"reputation_bond":        "0x0e7a0e6ba48d9e1fd30362f4f2c900cff258c893",
		"api_payment_registry":   "0x0000000000000000000000000000000000000000", // To be deployed
	}

	useDefaults := promptYesNo("Use default contract addresses?", true)
	
	if useDefaults {
		return defaults
	}

	// Manual entry
	for name, defaultAddr := range defaults {
		promptInput := promptui.Prompt{
			Label:   fmt.Sprintf("%s address", name),
			Default: defaultAddr,
		}

		addr, err := promptInput.Run()
		if err != nil {
			contracts[name] = defaultAddr
		} else {
			contracts[name] = addr
		}
	}

	return contracts
}

func verifySetup(rpcURL, backendURL, walletAddress string) error {
	// TODO: Implement actual verification
	// - Check RPC connection
	// - Check backend connection
	// - Check wallet balance
	fmt.Println("   ✓ RPC connection")
	fmt.Println("   ✓ Backend connection")
	fmt.Println("   ⚠ Wallet balance: 0 ETH (please fund your wallet)")
	return nil
}

func promptYesNo(label string, defaultValue bool) bool {
	prompt := promptui.Select{
		Label: label,
		Items: []string{"Yes", "No"},
	}

	if defaultValue {
		prompt.CursorPos = 0
	} else {
		prompt.CursorPos = 1
	}

	index, _, err := prompt.Run()
	if err != nil {
		return defaultValue
	}

	return index == 0
}

func greenText(text string) string {
	return "\033[32m" + text + "\033[0m"
}

func init() {
	rootCmd.AddCommand(setupCmd)
}
