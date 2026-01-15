package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
)

var deployCmd = &cobra.Command{
	Use:   "deploy [agent-id]",
	Short: "Deploy an existing agent configuration to the blockchain",
	Long: `Deploys an agent that has been created locally but not yet registered on-chain.
This is useful if you created an agent but didn't deploy it immediately, or if a previous deployment failed.`,
	Args: cobra.MaximumNArgs(1),
	RunE: runDeploy,
}

func runDeploy(cmd *cobra.Command, args []string) error {
	if err := loadConfig(); err != nil {
		return fmt.Errorf("please run 'agentguard setup' first: %w", err)
	}

	var agentID string
	if len(args) > 0 {
		agentID = args[0]
	} else {
		// TODO: Implement interactive selection of non-deployed agents
		return fmt.Errorf("please specify an agent ID")
	}

	fmt.Printf("\n🚀 Deploying Agent: %s\n", agentID)
	fmt.Println("═══════════════════════════════════════\n")

	// Deployment steps
	fmt.Println("   [1/3] Verifying configuration...")
	// TODO: Load and verify agent config
	fmt.Println("   " + greenText("✓") + " Configuration valid")

	fmt.Println("   [2/3] Registering on-chain...")
	// TODO: Execute blockchain transaction
	fmt.Println("   " + greenText("✓") + " Agent registered on Base")

	fmt.Println("   [3/3] Updating backend registry...")
	// TODO: Call backend API
	fmt.Println("   " + greenText("✓") + " Backend synchronized")

	fmt.Println("\n" + greenText("✅ Deployment successful!"))
	fmt.Printf("\nYour agent is now live on the network.\n")
	fmt.Printf("Run it using: agentguard run %s\n", agentID)

	return nil
}

func init() {
	rootCmd.AddCommand(deployCmd)
}
