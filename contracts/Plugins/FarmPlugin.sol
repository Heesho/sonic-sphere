// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Plugin.sol";

interface IFarm {
    function deposit(address account, uint256 amount) external;
    function withdraw(address account, uint256 amount) external;
    function getReward(address account) external;
}

contract FarmPlugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable farm;

    constructor(
        string memory _name,
        address _voter, 
        address _asset, 
        address[] memory _rewardTokens,
        address _farm
    ) Plugin(_name, _voter, _asset, _rewardTokens) {
        farm = _farm;
    }

    function deposit(uint256 amount) public override nonReentrant {
        super.deposit(amount);
        IERC20(asset).safeApprove(farm, 0);
        IERC20(asset).safeApprove(farm, amount);
        IFarm(farm).deposit(address(this), amount);
    }

    function claim() public override nonReentrant {
        super.claim();
        IFarm(farm).getReward(address(this));
    }

    function withdraw() public override {
        super.withdraw();
        IFarm(farm).withdraw(address(this), IERC20(asset).balanceOf(address(this)));
    }

}

contract FarmPluginFactory {
    function createFarmPlugin(
        string memory _name,
        address _voter,
        address _asset,
        address[] memory _rewardTokens,
        address _farm
    ) external returns (address) {
        return address(new FarmPlugin(_name, _voter, _asset, _rewardTokens, _farm));
    }
}
