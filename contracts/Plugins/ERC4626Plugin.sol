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

contract ERC4626Plugin is Plugin, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public amountReference;

    event Plugin__Claim(uint256 assets);

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
            emit Plugin__Claim(withdrawReference);
        }
    }

    function withdraw() public override {
        amountReference = 0;
        super.withdraw();
    }

}

contract ERC4626PluginFactory is Ownable {

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
        address plugin = address(new ERC4626Plugin(_name, _voter, _asset, _rewardTokens));
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
        ERC4626Plugin(plugin).setTreasury(treasury);
        ERC4626Plugin(plugin).setRewardAuction(rewardAuction);
        ERC4626Plugin(plugin).setAssetAuction(assetAuction);
        ERC4626Plugin(plugin).transferOwnership(governance);
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