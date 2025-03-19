// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IVoter.sol";

contract Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public GAUGE_DEPOSIT_AMOUNT = 1e18;
    uint256 public constant MIN_EPOCH_PERIOD = 1 hours;
    uint256 public constant MAX_EPOCH_PERIOD = 365 days;
    uint256 public constant MIN_PRICE_MULTIPLIER = 1.1e18; // Should at least be 110% of settlement price
    uint256 public constant MAX_PRICE_MULTIPLIER = 3e18; // Should not exceed 300% of settlement price
    uint256 public constant ABS_MIN_INIT_PRICE = 1e6; // Minimum sane value for init price
    uint256 public constant ABS_MAX_INIT_PRICE = type(uint192).max; // chosen so that initPrice * priceMultiplier does not exceed uint256
    uint256 public constant PRICE_MULTIPLIER_SCALE = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address private immutable OTOKEN;
    address private immutable voter;
    address private gauge;
    address private bribe;
    string private name;
    address[] private assetTokens;
    bool public initialized = false;

    IERC20 public immutable paymentToken;
    address public immutable paymentReceiver;
    uint256 public immutable epochPeriod;
    uint256 public immutable priceMultiplier;
    uint256 public immutable minInitPrice;

    struct Slot0 {
        uint8 locked; // 1 if unlocked, 2 if locked
        uint16 epochId; // intentionally overflowable
        uint192 initPrice;
        uint40 startTime;
    }

    Slot0 internal slot0;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__Initialized();
    error Plugin__NotAuthorizedVoter();
    error Plugin__DeadlinePassed();
    error Plugin__EpochIdMismatch();
    error Plugin__MaxPaymentAmountExceeded();
    error Plugin__EmptyAssets();
    error Plugin__Reentrancy();
    error Plugin__InitPriceBelowMin();
    error Plugin__InitPriceExceedsMax();
    error Plugin__EpochPeriodBelowMin();
    error Plugin__EpochPeriodExceedsMax();
    error Plugin__PriceMultiplierBelowMin();
    error Plugin__PriceMultiplierExceedsMax();
    error Plugin__MinInitPriceBelowMin();
    error Plugin__MinInitPriceExceedsAbsMaxInitPrice();
    error Plugin__PaymentReceiverIsThis();

    /*----------  EVENTS ------------------------------------------------*/

    event Plugin__Buy(address indexed buyer, address indexed assetsReceiver, uint256 paymentAmount);

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier nonReentrant() {
        if (slot0.locked == 2) revert Plugin__Reentrancy();
        slot0.locked = 2;
        _;
        slot0.locked = 1;
    }

    modifier nonReentrantView() {
        if (slot0.locked == 2) revert Plugin__Reentrancy();
        _;
    }

    modifier onlyVoter() {
        if (msg.sender != voter) revert Plugin__NotAuthorizedVoter();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter, 
        address[] memory _assetTokens, 
        string memory _name,
        uint256 initPrice,
        address paymentToken_,
        address paymentReceiver_,
        uint256 epochPeriod_,
        uint256 priceMultiplier_,
        uint256 minInitPrice_
    ) {
        if (initPrice < minInitPrice_) revert Plugin__InitPriceBelowMin();
        if (initPrice > ABS_MAX_INIT_PRICE) revert Plugin__InitPriceExceedsMax();
        if (epochPeriod_ < MIN_EPOCH_PERIOD) revert Plugin__EpochPeriodBelowMin();
        if (epochPeriod_ > MAX_EPOCH_PERIOD) revert Plugin__EpochPeriodExceedsMax();
        if (priceMultiplier_ < MIN_PRICE_MULTIPLIER) revert Plugin__PriceMultiplierBelowMin();
        if (priceMultiplier_ > MAX_PRICE_MULTIPLIER) revert Plugin__PriceMultiplierExceedsMax();
        if (minInitPrice_ < ABS_MIN_INIT_PRICE) revert Plugin__MinInitPriceBelowMin();
        if (minInitPrice_ > ABS_MAX_INIT_PRICE) revert Plugin__MinInitPriceExceedsAbsMaxInitPrice();
        if (paymentReceiver_ == address(this)) revert Plugin__PaymentReceiverIsThis();

        voter = _voter;
        assetTokens = _assetTokens;
        name = _name;
        OTOKEN = IVoter(_voter).OTOKEN();

        slot0.initPrice = uint192(initPrice);
        slot0.startTime = uint40(block.timestamp);

        paymentToken = IERC20(paymentToken_);
        paymentReceiver = paymentReceiver_;
        epochPeriod = epochPeriod_;
        priceMultiplier = priceMultiplier_;
        minInitPrice = minInitPrice_;
    }

    function buy(
        address[] calldata assets,
        address assetsReceiver,
        uint256 epochId,
        uint256 deadline,
        uint256 maxPaymentTokenAmount
    ) external nonReentrant returns (uint256 paymentAmount) {
        if (block.timestamp > deadline) revert Plugin__DeadlinePassed();
        if (assets.length == 0) revert Plugin__EmptyAssets();

        Slot0 memory slot0Cache = slot0;

        if (uint16(epochId) != slot0Cache.epochId) revert Plugin__EpochIdMismatch();

        paymentAmount = getPriceFromCache(slot0Cache);

        if (paymentAmount > maxPaymentTokenAmount) revert Plugin__MaxPaymentAmountExceeded();

        if (paymentAmount > 0) {
            paymentToken.safeTransferFrom(msg.sender, paymentReceiver, paymentAmount);
        }

        for (uint256 i = 0; i < assets.length; i++) {
            uint256 balance = IERC20(assets[i]).balanceOf(address(this));
            IERC20(assets[i]).safeTransfer(assetsReceiver, balance);
        }

        // Setup new auction
        uint256 newInitPrice = paymentAmount * priceMultiplier / PRICE_MULTIPLIER_SCALE;

        if (newInitPrice > ABS_MAX_INIT_PRICE) {
            newInitPrice = ABS_MAX_INIT_PRICE;
        } else if (newInitPrice < minInitPrice) {
            newInitPrice = minInitPrice;
        }

        // epochID is allowed to overflow, effectively reusing them
        unchecked {
            slot0Cache.epochId++;
        }
        slot0Cache.initPrice = uint192(newInitPrice);
        slot0Cache.startTime = uint40(block.timestamp);

        // Write cache in single write
        slot0 = slot0Cache;

        emit Plugin__Buy(msg.sender, assetsReceiver, paymentAmount);

        return paymentAmount;
    }

    function initialize() external {
        if (initialized) revert Plugin__Initialized();
        initialized = true;
        IGauge(gauge)._deposit(address(this), GAUGE_DEPOSIT_AMOUNT);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function setGauge(address _gauge) external onlyVoter {
        gauge = _gauge;
    }

    function setBribe(address _bribe) external onlyVoter {
        bribe = _bribe;
    }

    /// @dev Retrieves the current price from the cache based on the elapsed time since the start of the epoch.
    /// @param slot0Cache The Slot0 struct containing the initial price and start time of the epoch.
    /// @return price The current price calculated based on the elapsed time and the initial price.
    /// @notice This function calculates the current price by subtracting a fraction of the initial price based on the elapsed time.
    // If the elapsed time exceeds the epoch period, the price will be 0.
    function getPriceFromCache(Slot0 memory slot0Cache) internal view returns (uint256) {
        uint256 timePassed = block.timestamp - slot0Cache.startTime;

        if (timePassed > epochPeriod) {
            return 0;
        }

        return slot0Cache.initPrice - slot0Cache.initPrice * timePassed / epochPeriod;
    }


    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    /// @dev Calculates the current price
    /// @return price The current price calculated based on the elapsed time and the initial price.
    /// @notice Uses the internal function `getPriceFromCache` to calculate the current price.
    function getPrice() external view nonReentrantView returns (uint256) {
        return getPriceFromCache(slot0);
    }

    /// @dev Retrieves Slot0 as a memory struct
    /// @return Slot0 The Slot0 value as a Slot0 struct
    function getSlot0() external view nonReentrantView returns (Slot0 memory) {
        return slot0;
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

}

contract PluginFactory {

    address public immutable VOTER;

    address public last_plugin;

    event PluginFactory__PluginCreated(address plugin);

    constructor(address _VOTER) {
        VOTER = _VOTER;
    }

    function createPlugin(
        address[] memory _assetTokens,
        string memory _name,
        uint256 initPrice,
        address paymentToken_,
        address paymentReceiver_,
        uint256 epochPeriod_,
        uint256 priceMultiplier_,
        uint256 minInitPrice_
    ) external returns (address) {

        Plugin lastPlugin = new Plugin(
            VOTER,
            _assetTokens,
            _name,
            initPrice,
            paymentToken_,
            paymentReceiver_,
            epochPeriod_,
            priceMultiplier_,
            minInitPrice_
        );
        last_plugin = address(lastPlugin);
        emit PluginFactory__PluginCreated(last_plugin);
        return last_plugin;
    }

}