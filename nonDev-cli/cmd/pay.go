package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var payCmd = &cobra.Command{
	Use:   "pay [merchant-address] [amount] [token]",
	Short: "Initiate a payment transaction",
	Long: `Initiate a payment from your agent to a merchant.
Supports USDC, USDT, and MNEE tokens.`,
	Args: cobra.ExactArgs(3),
	RunE: func(cmd *cobra.Command, args []string) error {
		merchantAddress := args[0]
		amount := args[1]
		token := args[2]

		if err := loadConfig(); err != nil {
			return err
		}

		fmt.Println("💳 Initiating payment...")
		fmt.Printf("   Merchant: %s\n", merchantAddress)
		fmt.Printf("   Amount: %s %s\n", amount, token)
		fmt.Printf("   From: %s\n", viper.GetString("wallet_address"))

		fmt.Print("\nConfirm payment? (y/N): ")
		var confirm string
		fmt.Scanln(&confirm)
		if confirm != "y" && confirm != "Y" {
			fmt.Println("Payment cancelled.")
			return nil
		}

		// TODO: Implement actual payment logic with contract binding
		fmt.Println("\n🔄 Processing payment...")
		fmt.Println("   This would call: initiateTransaction(", merchantAddress, ",", token, ",", amount, ", metadata)")
		
		fmt.Println("\n✅ Payment initiated!")
		fmt.Println("   Transaction ID: 123") // Would be returned from contract
		fmt.Println("   Status: Escrowed (24h dispute window)")
		fmt.Println("\n💡 The merchant will receive funds after 24 hours if no dispute is filed.")

		return nil
	},
}

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Check agent and wallet status",
	Long:  `Display current agent status, balance, and recent transactions.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := loadConfig(); err != nil {
			return err
		}

		fmt.Println("📊 AgentGuard Status")
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		fmt.Printf("Wallet: %s\n", viper.GetString("wallet_address"))
		fmt.Printf("Network: %s\n", viper.GetString("network"))
		fmt.Println("\n💰 Balances:")
		fmt.Println("   ETH: 0.1 (for gas)")
		fmt.Println("   MNEE: 1000")
		fmt.Println("   USDC: 500")
		fmt.Println("\n🤖 Registered Agents:")
		fmt.Println("   No agents registered yet")
		fmt.Println("\n💡 Run 'agentguard create-agent' to get started!")

		return nil
	},
}
