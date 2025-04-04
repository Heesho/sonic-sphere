// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Plugin.sol";

interface ILP {
    function claimFees() external;
}

contract LPPlugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    constructor(
        string memory _name,
        address _voter, 
        address _asset, 
        address[] memory _rewardTokens
    ) Plugin(_name, _voter, _asset, _rewardTokens) {}

    function claim() public override nonReentrant {
        super.claim();
        ILP(asset).claimFees();
    }

}

contract LPPluginFactory {
    function createLPPlugin(
        string memory _name,
        address _voter,
        address _asset,
        address[] memory _rewardTokens
    ) external returns (address) {
        return address(new LPPlugin(_name, _voter, _asset, _rewardTokens));
    }
}
