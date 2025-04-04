// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Plugin.sol";

interface IERC4626 {
    function asset() external view returns (address);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
    function convertToShares(uint256 assets) external view returns (uint256 shares);
    function convertToAssets(uint256 shares) external view returns (uint256 assets);
    function totalAssets() external view returns (uint256);
}

contract ERC4626Plugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public amountReference;

    event ERC4626Plugin__Claim(uint256 assets);

    constructor(
        string memory _name,
        address _voter, 
        address _asset, 
        address[] memory _rewardTokens
    ) Plugin(_name, _voter, _asset, _rewardTokens) {}

    function deposit(uint256 amount) public override nonReentrant {
        claim();
        super.deposit(amount);

        uint256 depositReference = IERC4626(asset).convertToAssets(amount);
        amountReference += depositReference;
    }

    function claim() public override nonReentrant {
        uint256 currentReference = IERC4626(asset).convertToAssets(tvl);
        if (currentReference > amountReference) {
            uint256 withdrawReference = currentReference - amountReference;
            IERC4626(asset).withdraw(withdrawReference, address(this), address(this));
            tvl = IERC20(asset).balanceOf(address(this));
            emit ERC4626Plugin__Claim(withdrawReference);
        }
    }

    function withdraw() public override {
        amountReference = 0;
        super.withdraw();
    }

}

contract ERC4626PluginFactory {
    function createERC4626Plugin(
        string memory _name,
        address _voter,
        address _asset,
        address[] memory _rewardTokens
    ) external returns (address) {
        return address(new ERC4626Plugin(_name, _voter, _asset, _rewardTokens));
    }
}