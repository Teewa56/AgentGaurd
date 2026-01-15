// SPDX-LICENSE-IDENTIFIER: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InsurancePool
 * @dev Collects protocol fees and provides a backstop for catastrophic events.
 * Supports multiple tokens (MNEE, USDC, USDT, etc.)
 */
contract InsurancePool is Ownable {
    event FeeReceived(
        address indexed from,
        address indexed token,
        uint256 amount
    );
    event PayoutExecuted(
        address indexed to,
        address indexed token,
        uint256 amount,
        string reason
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Receives fees from the EscrowPayment contract.
     */
    function receiveFees(address token, uint256 amount) external {
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "Fee transfer failed"
        );
        emit FeeReceived(msg.sender, token, amount);
    }

    /**
     * @dev Payout for merchant protection or black swan events.
     */
    function executePayout(
        address to,
        address token,
        uint256 amount,
        string calldata reason
    ) external onlyOwner {
        require(IERC20(token).transfer(to, amount), "Payout transfer failed");
        emit PayoutExecuted(to, token, amount, reason);
    }

    /**
     * @dev Get current pool balance for a specific token.
     */
    function getPoolBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
