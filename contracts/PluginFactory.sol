// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IVoter.sol";

abstract contract Plugin is Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public GAUGE_DEPOSIT_AMOUNT = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    string private immutable name;
    address private immutable voter;
    address private immutable otoken;
    address private immutable asset;
    address private gauge;
    address private bribe;
    address private assetAuction;
    address private rewardAuction;
    address private treasury;
    uint256 private balance;
    bool private initialized;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__Initialized();
    error Plugin__NotAuthorizedVoter();

    /*----------  EVENTS ------------------------------------------------*/

    event Plugin__Deposit(uint256 amount);
    event Plugin__ClaimGaugeRewards(uint256 amount);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier onlyVoter() {
        if (msg.sender != voter) revert Plugin__NotAuthorizedVoter();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        string memory _name,
        address _voter, 
        address _asset
    ) {
        name = _name;
        voter = _voter;
        asset = _asset;
        otoken = IVoter(voter).OTOKEN();
    }

    function initialize() external {
        if (initialized) revert Plugin__Initialized();
        initialized = true;
        IGauge(gauge)._deposit(address(this), GAUGE_DEPOSIT_AMOUNT);
    }

    function deposit() public virtual {
        uint256 oldBalance = balance;
        uint256 newBalance = IERC20(asset).balanceOf(address(this));
        balance = newBalance;
        emit Plugin__Deposit(newBalance - oldBalance);
    }

    function claimGaugeRewards() public virtual {
        IGauge(gauge).getReward(address(this));
        emit Plugin__ClaimGaugeRewards();
    }

    function claimAssetRewards() public virtual {
        emit Plugin__ClaimAssetRewards();
    }

    function distribute(address[] memory rewardTokens) public virtual {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            if (rewardTokens[i] == asset) revert Plugin__CannotDistributeAsset();
            if (rewardTokens[i] == otoken) {
                if (assetAuction == address(0)) revert Plugin__AssetAuctionNotSet();
                uint256 balance = IERC20(rewardTokens[i]).balanceOf(address(this));
                IERC20(rewardTokens[i]).safeTransfer(assetAuction, balance);
                emit Plugin__DistributeAssetAuction(assetAuction, rewardTokens[i], balance);
            } else {
                if (rewardAuction == address(0)) revert Plugin__RewardAuctionNotSet();
                uint256 balance = IERC20(rewardTokens[i]).balanceOf(address(this));
                IERC20(rewardTokens[i]).safeTransfer(rewardAuction, balance);
                emit Plugin__DistributeRewardAuction(rewardAuction, rewardTokens[i], balance);
            }
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function withdraw() external virtual onlyOwner {
        uint256 balance = IERC20(asset).balanceOf(address(this));
        IERC20(asset).safeTransfer(treasury, balance);
        emit Plugin__Withdraw(balance);
    }

    function setGauge(address _gauge) external onlyVoter {
        if (gauge != address(0)) revert Plugin__InvalidZeroAddress();
        gauge = _gauge;
        emit Plugin__SetGauge(_gauge);
    }

    function setBribe(address _bribe) external onlyVoter {
        if (bribe != address(0)) revert Plugin__InvalidZeroAddress();
        bribe = _bribe;
        emit Plugin__SetBribe(_bribe);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (treasury != address(0)) revert Plugin__InvalidZeroAddress();
        treasury = _treasury;
        emit Plugin__SetTreasury(_treasury);
    }

    function setAssetAuction(address _assetAuction) external onlyOwner {
        if (assetAuction != address(0)) revert Plugin__InvalidZeroAddress();
        assetAuction = _assetAuction;
        emit Plugin__SetAssetAuction(_assetAuction);
    }

    function setRewardAuction(address _rewardAuction) external onlyOwner {
        if (rewardAuction != address(0)) revert Plugin__InvalidZeroAddress();
        rewardAuction = _rewardAuction;
        emit Plugin__SetRewardAuction(_rewardAuction);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getName() public view virtual returns (string memory) {
        return name;
    }

    function getVoter() public view returns (address) {
        return voter;
    }
    
    function getOtoken() public view returns (address) {
        return otoken;
    }

    function getGauge() public view returns (address) {
        return gauge;
    }

    function getBribe() public view returns (address) {
        return bribe;
    }

    function getAssetAuction() public view returns (address) {
        return assetAuction;
    }

    function getRewardAuction() public view returns (address) {
        return rewardAuction;
    }

    function getTreasury() public view returns (address) {
        return treasury;
    }

    function getBalance() public view returns (uint256) {
        return balance;
    }

    function getInitialized() public view returns (bool) {
        return initialized;
    }

}