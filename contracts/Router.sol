// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IVoter {
    function getPlugins() external view returns (address[] memory);
}

interface IPlugin {
    function getAssetAuction() external view returns (address);
    function getRewardTokens() external view returns (address[] memory);
    function claim() external;
    function distribute(address[] memory tokens) external;
}

interface IMulticall {
    function getRewardAuctionAssets() external view returns (address[] memory);
}

interface IAuction {
    function paymentToken() external view returns (address);
    function buy(
        address[] calldata assets,
        address receiver,
        uint256 epochId,
        uint256 deadline,
        uint256 maxPayment
    ) external returns (uint256);
}

contract Router {
    using SafeERC20 for IERC20;

    address public immutable voter;
    address public immutable token;
    address public immutable oToken;
    address public immutable multicall;
    address public immutable rewardAuction;

    /*----------  ERRORS  ---------------------------------------------*/

    error Router__InvalidPlugin();
    error Router__InvalidAuction();
    error Router__InvalidAssets();

    /*----------  FUNCTIONS  -----------------------------------------*/

    constructor(address _voter, address _token, address _oToken, address _multicall, address _rewardAuction) {
        voter = _voter;
        token = _token;
        oToken = _oToken;
        multicall = _multicall;
        rewardAuction = _rewardAuction;
    }

    function buyFromAssetAuction(
        address plugin,
        uint256 epochId,
        uint256 deadline,
        uint256 maxPayment
    ) external {
        address auction = IPlugin(plugin).getAssetAuction();
        address paymentToken = IAuction(auction).paymentToken();
        address[] memory assets = new address[](1);
        assets[0] = oToken;

        IPlugin(plugin).distribute(assets);
        IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), maxPayment);
        IERC20(paymentToken).approve(auction, 0);
        IERC20(paymentToken).approve(auction, maxPayment);
        IAuction(auction).buy(
            assets,
            msg.sender,
            epochId,
            deadline,
            maxPayment
        );
        IERC20(paymentToken).safeTransfer(msg.sender, IERC20(paymentToken).balanceOf(address(this)));
    }

    function buyFromRewardAuction(
        uint256 epochId,
        uint256 deadline,
        uint256 maxPayment
    ) external {
        address[] memory plugins = IVoter(voter).getPlugins();
        for (uint256 i = 0; i < plugins.length; i++) {
            address[] memory rewardTokens = IPlugin(plugins[i]).getRewardTokens();
            IPlugin(plugins[i]).claim();
            IPlugin(plugins[i]).distribute(rewardTokens);
        }
        address[] memory assets = IMulticall(multicall).getRewardAuctionAssets();
        IERC20(token).safeTransferFrom(msg.sender, address(this), maxPayment);
        IERC20(token).approve(rewardAuction, 0);
        IERC20(token).approve(rewardAuction, maxPayment);
        IAuction(rewardAuction).buy(
            assets,
            msg.sender,
            epochId,
            deadline,
            maxPayment
        );
        IERC20(token).safeTransfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }

}

