package agent

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

// BlockchainClient handles all on-chain interactions.
type BlockchainClient struct {
	client  *ethclient.Client
	chainID *big.Int
}

func NewBlockchainClient(rpcURL string) (*BlockchainClient, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Ethereum node: %w", err)
	}

	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get network ID: %w", err)
	}

	return &BlockchainClient{
		client:  client,
		chainID: chainID,
	}, nil
}

// GetBalance returns the balance of an address in Wei.
func (b *BlockchainClient) GetBalance(ctx context.Context, address string) (*big.Int, error) {
	account := common.HexToAddress(address)
	return b.client.BalanceAt(ctx, account, nil)
}

// SendTransaction sends a basic ETH transaction.
func (b *BlockchainClient) SendTransaction(ctx context.Context, privateKeyHex string, to string, amount *big.Int) (string, error) {
	// Implementation logic for signing and sending tx
	return "0x-hash-placeholder", nil
}

// CallContract calls a constant function on a smart contract.
func (b *BlockchainClient) CallContract(ctx context.Context, contract string, abi string, method string, args ...interface{}) ([]interface{}, error) {
	// Implementation logic for contract calls
	return nil, nil
}
