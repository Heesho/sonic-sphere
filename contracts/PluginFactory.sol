// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IVoter.sol";

interface IDutchAuctionFactory {
    function createDutchAuction(
        uint256 initPrice,
        address paymentToken_,
        address paymentReceiver_,
        uint256 epochPeriod_,
        uint256 priceMultiplier_,
        uint256 minInitPrice_
    ) external returns (address);
}

abstract contract Plugin {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public GAUGE_DEPOSIT_AMOUNT = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    string private immutable name;
    address private immutable voter;
    address private immutable token;
    address private gauge;
    address private bribe;
    address private assetAuction;
    address private rewardAuction;
    bool private initialized;

    /*----------  ERRORS ------------------------------------------------*/

    error Plugin__Initialized();
    error Plugin__NotAuthorizedVoter();

    /*----------  EVENTS ------------------------------------------------*/

    /*----------  MODIFIERS  --------------------------------------------*/

    modifier onlyVoter() {
        if (msg.sender != voter) revert Plugin__NotAuthorizedVoter();
        _;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        string memory _name,
        address _voter, 
        address _token, 
        uint256 initPrice,
        address paymentToken,
        address paymentReceiver,
        uint256 epochPeriod,
        uint256 priceMultiplier,
        uint256 minInitPrice
    ) {

        voter = _voter;
        name = _name;
        token = _token;
    }

    function initialize() external {
        if (initialized) revert Plugin__Initialized();
        initialized = true;
        IGauge(gauge)._deposit(address(this), GAUGE_DEPOSIT_AMOUNT);
    }

    // deposit

    // claim

    // distribute

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    // withdraw

    function setGauge(address _gauge) external onlyVoter {
        gauge = _gauge;
    }

    function setBribe(address _bribe) external onlyVoter {
        bribe = _bribe;
    }

    function setAuction(address _auction) external onlyOwner {
        auction = _auction;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

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

    function getAuction() public view returns (address) {
        return auction;
    }

}