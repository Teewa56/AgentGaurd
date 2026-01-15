package cmd

import (
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "agentguard",
	Short: "AgentGuard CLI - Manage AI agents and payments",
	Long: `AgentGuard CLI is a command-line tool for non-technical users to easily
create and manage AI agents with secure payment capabilities.

Think of it as a simple way to give your AI agent a wallet with spending limits.`,
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	// The commands are registered in their respective files via their init() functions.
	// We don't need to manually add them here if they are in the same package.
	// But we should ensure we remove the old placeholders.
}

