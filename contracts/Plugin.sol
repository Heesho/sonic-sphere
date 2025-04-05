// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IGauge {
    function _deposit(address account, uint256 amount) external;
    function getReward(address account) external;
}

interface IVoter {
    function OTOKEN() external view returns (address);
}

abstract contract Plugin is Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public GAUGE_DEPOSIT_AMOUNT = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    string public name;
    address public immutable voter;
    address public immutable otoken;
    address public immutable asset;
    address internal gauge;
    address internal bribe;
    address internal assetAuction;
    address internal rewardAuction;
    address internal treasury;
    address[] internal rewardTokens;
    uint256 internal tvl;
    bool internal initialized;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__Initialized();
    error Plugin__NotAuthorizedVoter();
    error Plugin__InvalidZeroAddress();
    error Plugin__TreasuryNotSet();
    error Plugin__AssetAuctionNotSet();
    error Plugin__RewardAuctionNotSet();
    error Plugin__CannotDistributeAsset();

    /*----------  EVENTS ------------------------------------------------*/

    event Plugin__Deposit(uint256 amount);
    event Plugin__DistributeAssetAuction(address indexed assetAuction, address indexed rewardToken, uint256 amount);
    event Plugin__DistributeRewardAuction(address indexed rewardAuction, address indexed rewardToken, uint256 amount);
    event Plugin__Withdraw(uint256 amount);
    event Plugin__SetName(string name);
    event Plugin__SetTreasury(address indexed treasury);
    event Plugin__SetAssetAuction(address indexed assetAuction);
    event Plugin__SetRewardAuction(address indexed rewardAuction);
    event Plugin__SetRewardTokens(address[] rewardTokens);
    event Plugin__SetGauge(address indexed gauge);
    event Plugin__SetBribe(address indexed bribe);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier onlyVoter() {
        if (msg.sender != voter) revert Plugin__NotAuthorizedVoter();
        _;
    }

    modifier nonZeroAddress(address _address) {
        if (_address == address(0)) revert Plugin__InvalidZeroAddress();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        string memory _name,
        address _voter, 
        address _asset,
        address[] memory _rewardTokens
    ) {
        name = _name;
        voter = _voter;
        asset = _asset;
        rewardTokens = _rewardTokens;

        otoken = IVoter(voter).OTOKEN();
    }

    function initialize() external {
        if (initialized) revert Plugin__Initialized();
        initialized = true;
        IGauge(gauge)._deposit(address(this), GAUGE_DEPOSIT_AMOUNT);
    }

    function deposit(uint256 amount) public virtual {
        tvl += amount;
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        emit Plugin__Deposit(amount);
    }

    function claim() public virtual {}

    function distribute(address[] memory tokens) public virtual {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == asset) revert Plugin__CannotDistributeAsset();
            if (tokens[i] == otoken) {
                if (assetAuction == address(0)) revert Plugin__AssetAuctionNotSet();
                IGauge(gauge).getReward(address(this));
                uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
                IERC20(tokens[i]).safeTransfer(assetAuction, balance);
                emit Plugin__DistributeAssetAuction(assetAuction, tokens[i], balance);
            } else {
                if (rewardAuction == address(0)) revert Plugin__RewardAuctionNotSet();
                uint256 balance = IERC20(tokens[i]).balanceOf(address(this));
                IERC20(tokens[i]).safeTransfer(rewardAuction, balance);
                emit Plugin__DistributeRewardAuction(rewardAuction, tokens[i], balance);
            }
        }
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function withdraw() public virtual onlyOwner {
        if (treasury == address(0)) revert Plugin__TreasuryNotSet();
        uint256 balance = IERC20(asset).balanceOf(address(this));
        if (balance > 0) {
            tvl = 0;
            IERC20(asset).safeTransfer(treasury, balance);
            emit Plugin__Withdraw(balance);
        }
    }

    function setName(string memory _name) external onlyOwner {
        name = _name;
        emit Plugin__SetName(_name);
    }

    function setTreasury(address _treasury) external onlyOwner nonZeroAddress(_treasury) {
        treasury = _treasury;
        emit Plugin__SetTreasury(_treasury);
    }

    function setAssetAuction(address _assetAuction) external onlyOwner nonZeroAddress(_assetAuction) {
        assetAuction = _assetAuction;
        emit Plugin__SetAssetAuction(_assetAuction);
    }

    function setRewardAuction(address _rewardAuction) external onlyOwner nonZeroAddress(_rewardAuction) {
        rewardAuction = _rewardAuction;
        emit Plugin__SetRewardAuction(_rewardAuction);
    }

    function setRewardTokens(address[] memory _rewardTokens) external onlyOwner {
        rewardTokens = _rewardTokens;
        emit Plugin__SetRewardTokens(_rewardTokens);
    }

    function setGauge(address _gauge) external onlyVoter nonZeroAddress(_gauge) {
        gauge = _gauge;
        emit Plugin__SetGauge(_gauge);
    }

    function setBribe(address _bribe) external onlyVoter nonZeroAddress(_bribe) {
        bribe = _bribe;
        emit Plugin__SetBribe(_bribe);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

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

    function getTvl() public view returns (uint256) {
        return tvl;
    }

    function getInitialized() public view returns (bool) {
        return initialized;
    }

    function getRewardTokens() public view returns (address[] memory) {
        return rewardTokens;
    }

}