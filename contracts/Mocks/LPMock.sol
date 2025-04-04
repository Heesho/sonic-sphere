// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MockLPToken is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token0;  // First reward token (e.g., USDC)
    IERC20 public immutable token1;  // Second reward token (e.g., ETH)
    
    uint256 public constant REWARD_AMOUNT_0 = 5e18;  // 5 tokens of token0 per claim
    uint256 public constant REWARD_AMOUNT_1 = 2e18;  // 2 tokens of token1 per claim

    constructor(
        string memory name,
        string memory symbol,
        address _token0,
        address _token1
    ) ERC20(name, symbol) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    // Mint LP tokens (in real pools this would be done when adding liquidity)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    // Claim accumulated fees (simplified to just mint fixed amounts)
    function claimFees() external nonReentrant {
        require(balanceOf(msg.sender) > 0, "No LP tokens held");
        
        // Transfer fixed amounts of both tokens
        token0.safeTransfer(msg.sender, REWARD_AMOUNT_0);
        token1.safeTransfer(msg.sender, REWARD_AMOUNT_1);
    }
}