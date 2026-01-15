package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show AgentGuard CLI status and configuration",
	Long:  `Display current configuration, wallet info, and agent status.`,
	RunE:  runStatus,
}

func runStatus(cmd *cobra.Command, args []string) error {
	if err := loadConfig(); err != nil {
		fmt.Println("❌ Not configured. Run 'agentguard setup' first.")
		return nil
	}

	fmt.Println("\n🔍 AgentGuard Status")
	fmt.Println("═══════════════════════════════════════\n")

	// Configuration
	fmt.Println("📋 Configuration:")
	fmt.Println("   Network:", getConfigValue("network"))
	fmt.Println("   RPC URL:", getConfigValue("rpc_url"))
	fmt.Println("   Backend:", getConfigValue("backend_url"))
	fmt.Println()

	// Wallet
	fmt.Println("💼 Wallet:")
	fmt.Println("   Address:", getConfigValue("wallet_address"))
	// TODO: Fetch and display balance
	fmt.Println("   Balance: (fetching...)")
	fmt.Println()

	// Contracts
	fmt.Println("📜 Smart Contracts:")
	fmt.Println("   AgentRegistry:", getConfigValue("agent_registry_address"))
	fmt.Println("   EscrowPayment:", getConfigValue("escrow_payment_address"))
	fmt.Println("   APIPaymentRegistry:", getConfigValue("api_payment_registry_address"))
	fmt.Println()

	// Agents
	fmt.Println("🤖 Your Agents:")
	// TODO: List configured agents
	fmt.Println("   (No agents configured yet)")
	fmt.Println()

	fmt.Println("💡 Tip: Create your first agent with 'agentguard create'")

	return nil
}

func init() {
	rootCmd.AddCommand(statusCmd)
}
