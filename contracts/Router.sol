// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FixedPointMathLib.sol";

interface ITOKEN {
    function SWAP_FEE() external view returns (uint256);
    function mrvBASE() external view returns (uint256);
    function mrrBASE() external view returns (uint256);
    function mrrTOKEN() external view returns (uint256);
    function getMarketPrice() external view returns (uint256);
}

interface IVoter {
    function getPlugins() external view returns (address[] memory);
}

interface IPlugin {
    function getTvl() external view returns (uint256);
    function getAssetAuction() external view returns (address);
    function getRewardTokens() external view returns (address[] memory);
    function claim() external;
    function distribute(address[] memory tokens) external;
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
    using FixedPointMathLib for uint256;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant PRECISION = 1e18;


    address public immutable voter;
    address public immutable token;
    address public immutable oToken;
    address public immutable multicall;
    address public immutable rewardAuction;
    uint256 public immutable swapFee;

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

        swapFee = ITOKEN(token).SWAP_FEE();
    }

    function buyFromAssetAuction(
        address plugin,
        uint256 epochId,
        uint256 deadline,
        uint256 maxPayment
    ) external {
        address auction = IPlugin(plugin).getAssetAuction();
        address paymentToken = IAuction(auction).paymentToken();
        address[] memory plugins = IVoter(voter).getPlugins();
        for (uint256 i = 0; i < plugins.length; i++) {
            address[] memory rewardTokens = IPlugin(plugins[i]).getRewardTokens();
            IPlugin(plugins[i]).claim();
            IPlugin(plugins[i]).distribute(rewardTokens);
        }

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
        uint256 assetsLength = 0;
        for (uint256 i = 0; i < plugins.length; i++) {
            address[] memory rewardTokens = IPlugin(plugins[i]).getRewardTokens();
            assetsLength += rewardTokens.length;
            if (IPlugin(plugins[i]).getTvl() > 0) {
                IPlugin(plugins[i]).claim();
                IPlugin(plugins[i]).distribute(rewardTokens);
            }
        }
        address[] memory assets = new address[](assetsLength);
        uint256 index = 0;
        for (uint256 i = 0; i < plugins.length; i++) {
            address[] memory rewardTokens = IPlugin(plugins[i]).getRewardTokens();
            for (uint256 j = 0; j < rewardTokens.length; j++) {
                assets[index] = rewardTokens[j];
                index++;
            }
        }

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

     function quoteBuyIn(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 feeBASE = input * swapFee / DIVISOR;
        uint256 oldMrBASE = ITOKEN(token).mrvBASE() + ITOKEN(token).mrrBASE();
        uint256 newMrBASE = oldMrBASE + input - feeBASE;
        uint256 oldMrTOKEN = ITOKEN(token).mrrTOKEN();
        output = oldMrTOKEN - (oldMrBASE * oldMrTOKEN / newMrBASE);
        slippage = 100 * (1e18 - (output * ITOKEN(token).getMarketPrice() / input));
        minOutput = (input * 1e18 / ITOKEN(token).getMarketPrice()) * slippageTolerance / DIVISOR;
        autoMinOutput = (input * 1e18 / ITOKEN(token).getMarketPrice()) * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteBuyOut(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 oldMrBASE = ITOKEN(token).mrvBASE() + ITOKEN(token).mrrBASE();
        output = DIVISOR * ((oldMrBASE * ITOKEN(token).mrrTOKEN() / (ITOKEN(token).mrrTOKEN() - input)) - oldMrBASE) / (DIVISOR - swapFee);
        slippage = 100 * (1e18 - (input * ITOKEN(token).getMarketPrice() / output));
        minOutput = input * slippageTolerance / DIVISOR;
        autoMinOutput = input * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteSellIn(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 feeTOKEN = input * swapFee / DIVISOR;
        uint256 oldMrTOKEN = ITOKEN(token).mrrTOKEN();
        uint256 newMrTOKEN = oldMrTOKEN + input - feeTOKEN;
        if (newMrTOKEN > ITOKEN(token).mrvBASE()) {
            return (0, 0, 0, 0);
        }

        uint256 oldMrBASE = ITOKEN(token).mrvBASE() + ITOKEN(token).mrrBASE();
        output = oldMrBASE - (oldMrBASE * oldMrTOKEN / newMrTOKEN);
        slippage = 100 * (1e18 - (output * 1e18 / (input * ITOKEN(token).getMarketPrice() / 1e18)));
        minOutput = input * ITOKEN(token).getMarketPrice() /1e18 * slippageTolerance / DIVISOR;
        autoMinOutput = input * ITOKEN(token).getMarketPrice() /1e18 * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteSellOut(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 oldMrBASE = ITOKEN(token).mrvBASE() + ITOKEN(token).mrrBASE();
        output = DIVISOR * ((oldMrBASE * ITOKEN(token).mrrTOKEN() / (oldMrBASE - input)) - ITOKEN(token).mrrTOKEN()) / (DIVISOR - swapFee);
        if (output.mulDivDown(DIVISOR - swapFee, DIVISOR) + ITOKEN(token).mrrTOKEN() > ITOKEN(token).mrvBASE()) {
            return (0, 0, 0, 0);
        }
        slippage = 100 * (1e18 - (input * 1e18 / (output * ITOKEN(token).getMarketPrice() / 1e18)));
        minOutput = input * slippageTolerance / DIVISOR;
        autoMinOutput = input * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

}

