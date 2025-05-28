// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Sale is Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public PRICE = 0.5 ether;
    uint256 constant public DIVISOR = 1 ether;
    uint256 constant public MIN_CAP =  5_000_000 ether;
    uint256 constant public MAX_CAP = 10_000_000 ether;


    /*----------  STATE VARIABLES  --------------------------------------*/

    address public token;

    mapping(address => uint256) public account_Amount;
    mapping(address => uint256) public account_Claim;
    mapping(address => uint256) public account_Refund;

    uint256 public totalAmount;
    uint256 public totalClaim;
    uint256 public totalRefund;

    enum State {
        Inactive,
        Active,
        Claim,
        Refund
    }

    State public state;

    /*----------  ERRORS  ------------------------------------------------*/


    /*----------  EVENTS  ------------------------------------------------*/

    event Sale__StateSet(State state);
    event Sale__Purchase(address indexed account, uint256 amount);
    event Sale__Claim(address indexed account, uint256 amount);


    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor() {}

    function purchase(address account) external payable {
        if (state != State.Active) revert Sale__NotActive();

        uint256 amount = msg.value;
        if (amount <= 0) revert Sale__InvalidAmount();

        uint256 total = totalAmount + amount;
        if (total > MAX_CAP) revert Sale__MaxCapReached();

        account_Amount[account] += amount;
        totalAmount += amount;

        emit Sale__Purchase(account, amount);
    }

    function claim(address account) external {
        if (state != State.Claim) revert Sale__NotClaimable();
        if (account_Amount[account] == 0) revert Sale__InvalidClaim();

        uint256 claim = account_Amount[account] * PRICE / DIVISOR - account_Claimed[account];
        if (claim <= 0) revert Sale__InvalidClaim();

        account_Claim[account] += claim;
        totalClaim += claim;

        IERC20(token).safeTransfer(account, claim);

        emit Sale__Claim(account, claim);
    }

    function refund(address account) external {
        if (state != State.Refund) revert Sale__NotRefundable();

        uint256 refund = account_Amount[account] - account_Refund[account];
        if (refund <= 0) revert Sale__InvalidRefund();

        account_Refund[account] += refund;
        totalRefund += refund;

        payable(account).transfer(refund);

        emit Sale__Refund(account, refund);
    }

    function intialize() external onlyOwner {
        if (state != State.Inactive) revert Sale__NotInactive();
        state = State.Active;
        emit Sale__Initialized();
    }

    function conclude(address _token) external onlyOwner {
        if (state != State.Active) revert Sale__NotActive();

        if (totalAmount < MIN_CAP) {
            state = State.Refund;
            emit Sale__Concluded(0);
        } else {
            state = State.Claim;
            token = _token;
            totalClaim = totalAmount * PRICE / DIVISOR; 
            IERC20(token).safeTransfer(msg.sender, totalClaim);
            emit Sale__Concluded(totalClaim);
        }
    }

}
