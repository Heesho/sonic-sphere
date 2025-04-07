// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Plugin.sol";

interface ILP {
    function claimFees() external;
}

interface IAuctionFactory {
    function createAuction(
        uint256 initPrice,
        bool receiverIsPlugin_,
        address paymentToken_,
        address paymentReceiver_,
        uint256 epochPeriod_,
        uint256 priceMultiplier_,
        uint256 minInitPrice_
    ) external returns (address);
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
        ILP(asset).claimFees();
    }

}

contract LPPluginFactory is Ownable {

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public governance;
    address public treasury;
    address public rewardAuction;
    address public auctionFactory;

    address public lastPlugin;

    /*----------  ERRORS  -----------------------------------------------*/

    error PluginFactory__InvalidGovernance();

    /*----------  EVENTS  -----------------------------------------------*/

    event PluginFactory__CreatePlugin(address plugin);
    event PluginFactory__SetGovernance(address governance);
    event PluginFactory__SetTreasury(address treasury);
    event PluginFactory__SetRewardAuction(address rewardAuction);
    event PluginFactory__SetAuctionFactory(address auctionFactory);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _governance,
        address _treasury,
        address _rewardAuction,
        address _auctionFactory
    ) {
        if (_governance == address(0)) revert PluginFactory__InvalidGovernance();    
        governance = _governance;
        treasury = _treasury;
        rewardAuction = _rewardAuction;
        auctionFactory = _auctionFactory;
    }

    function createPlugin(
        string memory _name,
        address _voter,
        address _asset,
        address[] memory _rewardTokens,
        uint256 _initPrice,
        uint256 _epochPeriod,
        uint256 _priceMultiplier,
        uint256 _minInitPrice
    ) external returns (address) {
        address plugin = address(new LPPlugin(_name, _voter, _asset, _rewardTokens));
        lastPlugin = plugin;
        address assetAuction = IAuctionFactory(auctionFactory).createAuction(
            _initPrice,
            true,
            _asset,
            plugin,
            _epochPeriod,
            _priceMultiplier,
            _minInitPrice
        );
        LPPlugin(plugin).setTreasury(treasury);
        LPPlugin(plugin).setRewardAuction(rewardAuction);
        LPPlugin(plugin).setAssetAuction(assetAuction);
        LPPlugin(plugin).transferOwnership(governance);
        emit PluginFactory__CreatePlugin(plugin);
        return plugin;
    }

    /*---------- RESTRICTED FUNCTIONS  --------------------------------*/

    function setGovernance(address _governance) external onlyOwner {
        if (_governance == address(0)) revert PluginFactory__InvalidGovernance();
        governance = _governance;
        emit PluginFactory__SetGovernance(_governance);
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        emit PluginFactory__SetTreasury(_treasury);
    }

    function setRewardAuction(address _rewardAuction) external onlyOwner {
        rewardAuction = _rewardAuction;
        emit PluginFactory__SetRewardAuction(_rewardAuction);
    }

    function setAuctionFactory(address _auctionFactory) external onlyOwner {
        auctionFactory = _auctionFactory;
        emit PluginFactory__SetAuctionFactory(_auctionFactory);
    }

}
