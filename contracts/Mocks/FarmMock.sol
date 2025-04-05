// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract FarmMock is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;
    uint256 public constant REWARD_AMOUNT = 10e18; // 10 tokens per claim
    
    uint256 public _totalSupply;
    mapping(address => uint256) public _balanceOf;

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    function deposit(address account, uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot deposit 0");
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        _balanceOf[account] += amount;
        _totalSupply += amount;
    }

    function withdraw(address account, uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot withdraw 0");
        require(_balanceOf[account] >= amount, "Insufficient balance");
        
        _balanceOf[account] -= amount;
        _totalSupply -= amount;
        stakingToken.safeTransfer(account, amount);
    }

    function getReward(address account) external nonReentrant {
        require(_balanceOf[account] > 0, "Nothing staked");
        rewardToken.safeTransfer(account, REWARD_AMOUNT);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balanceOf[account];
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function earned(address account) external view returns (uint256) {
        return REWARD_AMOUNT;
    }

}