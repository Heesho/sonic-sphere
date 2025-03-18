// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IBribe.sol";
import "contracts/interfaces/IVoter.sol";

contract Plugin is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public AMOUNT = 1e18;
    uint256 constant public PRECISION = 1e18;
    uint256 constant public DURATION = 7 days;
    uint256 constant public ABS_MAX_INIT_PRICE = type(uint192).max;
    uint256 constant public PRICE_MULITPLIER = 2e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    IERC20 private immutable token; // payment token
    address private immutable OTOKEN;
    address private immutable voter;
    address private gauge;
    address private bribe;
    string private  protocol;
    string private name;
    address[] private assetTokens;
    address[] private bribeTokens;

    uint256 public immutable minInitPrice;
    bool public initialized = false;

    struct Auction {
        uint256 epochId;
        uint256 initPrice;
        uint256 startTime;
    }

    Auction internal auction;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__InvalidZeroInput();
    error Plugin__NotAuthorizedVoter();
    error Plugin__DeadlinePassed();
    error Plugin__EpochIdMismatch();
    error Plugin__MaxPaymentAmountExceeded();
    error Plugin__Initialized();

    /*----------  EVENTS ------------------------------------------------*/

    event Plugin__ClaimedAnDistributed();
    event Plugin__Buy(address indexed buyer, address indexed assetReceiver, uint256 paymentAmount);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonZeroInput(uint256 _amount) {
        if (_amount == 0) revert Plugin__InvalidZeroInput();
        _;
    }

    modifier onlyVoter() {
        if (msg.sender != voter) revert Plugin__NotAuthorizedVoter();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _token, 
        address _voter, 
        address[] memory _assetTokens, 
        address[] memory _bribeTokens,
        string memory _protocol,
        string memory _name,
        uint256 _initPrice,
        uint256 _minInitPrice
    ) {
        token = IERC20(_token);
        voter = _voter;
        assetTokens = _assetTokens;
        bribeTokens = _bribeTokens;
        protocol = _protocol;
        name = _name;
        OTOKEN = IVoter(_voter).OTOKEN();

        auction.initPrice = _initPrice;
        auction.startTime = block.timestamp;

        minInitPrice = _minInitPrice;
    }

    function claimAndDistribute() public virtual nonReentrant {
        uint256 balance = token.balanceOf(address(this));
        if (balance > DURATION) {
            token.safeApprove(bribe, 0);
            token.safeApprove(bribe, balance);
            IBribe(bribe).notifyRewardAmount(address(token), balance);
        }
        emit Plugin__ClaimedAnDistributed();
    }

    function buy(address assetReceiver, uint256 epochId, uint256 deadline, uint256 maxPaymentTokenAmount) external nonReentrant returns (uint256 paymentAmount) {
        if (block.timestamp > deadline) revert Plugin__DeadlinePassed();

        Auction memory auctionCache = auction;

        if (epochId != auctionCache.epochId) revert Plugin__EpochIdMismatch();

        paymentAmount = getPriceFromCache(auctionCache);

        if (paymentAmount > maxPaymentTokenAmount) revert Plugin__MaxPaymentAmountExceeded();

        if (paymentAmount > 0) {
            token.safeTransferFrom(msg.sender, address(this), paymentAmount);
        }

        IGauge(gauge).getReward(address(this));
        address[] memory rewardTokens = IGauge(gauge).getRewardTokens();
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            IERC20(rewardTokens[i]).safeTransfer(assetReceiver, IERC20(rewardTokens[i]).balanceOf(address(this)));
        }

        uint256 newInitPrice = paymentAmount * PRICE_MULITPLIER / PRECISION;

        if (newInitPrice > ABS_MAX_INIT_PRICE) {
            newInitPrice = ABS_MAX_INIT_PRICE;
        } else if (newInitPrice < minInitPrice) {
            newInitPrice = minInitPrice;
        }

        auctionCache.epochId++;
        auctionCache.initPrice = newInitPrice;
        auctionCache.startTime = block.timestamp;

        auction = auctionCache;

        emit Plugin__Buy(msg.sender, assetReceiver, paymentAmount);

        return paymentAmount;
    }

    function initialize() external {
        if (initialized) revert Plugin__Initialized();
        initialized = true;
        IGauge(gauge)._deposit(address(this), AMOUNT);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setGauge(address _gauge) external onlyVoter {
        gauge = _gauge;
    }

    function setBribe(address _bribe) external onlyVoter {
        bribe = _bribe;
    }

    function getPriceFromCache(Auction memory auctionCache) internal view returns (uint256) {
        uint256 timeElapsed = block.timestamp - auctionCache.startTime;

        if (timeElapsed > DURATION) {
            return 0;
        }

        return auctionCache.initPrice - (auctionCache.initPrice * timeElapsed / DURATION);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getPrice() external view returns (uint256) {
        return getPriceFromCache(auction);
    }

    function getAuction() external view returns (Auction memory) {
        return auction;
    }

    function balanceOf(address account) public view returns (uint256) {
        if (account == address(this)) {
            return AMOUNT;
        } else {
            return 0;
        }
    }

    function totalSupply() public pure returns (uint256) {
        return AMOUNT;
    }

    function getToken() public view virtual returns (address) {
        return address(token);
    }

    function getProtocol() public view virtual returns (string memory) {
        return protocol;
    }

    function getName() public view virtual returns (string memory) {
        return name;
    }

    function getVoter() public view returns (address) {
        return voter;
    }

    function getGauge() public view returns (address) {
        return gauge;
    }

    function getBribe() public view returns (address) {
        return bribe;
    }

    function getAssetTokens() public view returns (address[] memory) {
        return assetTokens;
    }

    function getBribeTokens() public view returns (address[] memory) {
        return bribeTokens;
    }

}

contract PluginFactory {

    string public constant PROTOCOL = 'Voter Owned Liquidity';

    address public immutable VOTER;

    address public last_plugin;

    event PluginFactory__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address _paymentToken,
        address[] memory _assetTokens,
        string memory _name,
        uint256 _initPrice,
        uint256 _minInitPrice
    ) external returns (address) {

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = _paymentToken;

        VolPlugin lastPlugin = new VolPlugin(
            _paymentToken,
            VOTER,
            _assetTokens,
            bribeTokens,
            PROTOCOL,
            _name,
            _initPrice,
            _minInitPrice
        );
        last_plugin = address(lastPlugin);
        emit PluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

}