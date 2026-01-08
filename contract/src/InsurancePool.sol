// SPDX-LICENSE-IDENTIFIER: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InsurancePool
 * @dev Collects protocol fees and provides a backstop for catastrophic events.
 */
contract InsurancePool is Ownable {
    IERC20 public immutable MNEE_TOKEN;

    event FeeReceived(address indexed from, uint256 amount);
    event PayoutExecuted(address indexed to, uint256 amount, string reason);

    constructor(address _mneeToken) Ownable(msg.sender) {
        MNEE_TOKEN = IERC20(_mneeToken);
    }

    /**
     * @dev Receives fees from the EscrowPayment contract.
     */
    function receiveFees(uint256 amount) external {
        require(
            MNEE_TOKEN.transferFrom(msg.sender, address(this), amount),
            "Fee transfer failed"
        );
        emit FeeReceived(msg.sender, amount);
    }

    /**
     * @dev Payout for merchant protection or black swan events.
     */
    function executePayout(
        address to,
        uint256 amount,
        string calldata reason
    ) external onlyOwner {
        require(MNEE_TOKEN.transfer(to, amount), "Payout transfer failed");
        emit PayoutExecuted(to, amount, reason);
    }

    /**
     * @dev Get current pool balance.
     */
    function getPoolBalance() external view returns (uint256) {
        return MNEE_TOKEN.balanceOf(address(this));
    }
}
