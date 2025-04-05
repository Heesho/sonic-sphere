// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Plugin.sol";

interface IFarm {
    function deposit(address account, uint256 amount) external;
    function withdraw(address account, uint256 amount) external;
    function getReward(address account) external;
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
        IFarm(farm).getReward(address(this));
    }

    function withdraw() public override {
        super.withdraw();
        IFarm(farm).withdraw(address(this), IERC20(asset).balanceOf(address(this)));
    }

}

contract FarmPluginFactory is Ownable {

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
    
    function createFarmPlugin(
        string memory _name,
        address _voter,
        address _asset,
        address[] memory _rewardTokens,
        address _farm,
        uint256 _initPrice,
        uint256 _epochPeriod,
        uint256 _priceMultiplier,
        uint256 _minInitPrice
    ) external returns (address) {
        address plugin = address(new FarmPlugin(_name, _voter, _asset, _rewardTokens, _farm));
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
        FarmPlugin(plugin).setTreasury(treasury);
        FarmPlugin(plugin).setRewardAuction(rewardAuction);
        FarmPlugin(plugin).setAssetAuction(assetAuction);
        FarmPlugin(plugin).transferOwnership(governance);
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
