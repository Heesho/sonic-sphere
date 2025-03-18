// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IBribe.sol";
import "contracts/interfaces/IVoter.sol";

// TODO:
// - make it ownable
// - make a treasury
// - add balance of and totalSupply back
// - add funciton to setTreasury
// - think about other settable variables (duration, initial price, etc.) 
// - why is minInitPrice immutable?
// - review fee flow again to see what they got
// - remove the bribe token, probably only add them if requested
// - on buy do i want to let them input basket of assets? In case someone sends assets to contract?
// - a bunch of testing
contract Plugin is ReentrancyGuard, Ownable {
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

    address public treasury;
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

    event Plugin__ClaimedAndDistributed(address indexed treasury, uint256 amount);
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
        uint256 _minInitPrice,
        address _treasury
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
        treasury = _treasury;
    }

    function claimAndDistribute() public virtual nonReentrant {
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.safeTransfer(treasury, balance);
            emit Plugin__ClaimedAndDistributed(treasury, balance);
        }
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

        // change this to just oTOKEN
        IGauge(gauge).getReward(address(this));
        uint256 balance = IERC20(OTOKEN).balanceOf(address(this));
        if (balance > 0) {
            IERC20(OTOKEN).safeTransfer(assetReceiver, balance);
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
        uint256 _minInitPrice,
        address _treasury
    ) external returns (address) {

        address[] memory bribeTokens = new address[](1);
        bribeTokens[0] = _paymentToken;

        Plugin lastPlugin = new Plugin(
            _paymentToken,
            VOTER,
            _assetTokens,
            bribeTokens,
            PROTOCOL,
            _name,
            _initPrice,
            _minInitPrice,
            _treasury
        );
        last_plugin = address(lastPlugin);
        lastPlugin.transferOwnership(msg.sender);
        emit PluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

}