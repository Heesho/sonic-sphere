// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Sale is Ownable {
    using SafeERC20 for IERC20;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public PRICE = 0.5 ether;
    uint256 constant public DIVISOR = 1 ether;
    uint256 constant public MIN_CAP =  5_000 ether;
    uint256 constant public MAX_CAP = 10_000 ether;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public token;

    uint256 public totalAmount;
    uint256 public totalClaim;
    uint256 public totalRefund;

    mapping(address => uint256) public account_Amount;
    mapping(address => uint256) public account_Claim;
    mapping(address => uint256) public account_Refund;

    enum State {
        Inactive,
        Active,
        Claim,
        Refund
    }

    State public state;

    /*----------  ERRORS  ------------------------------------------------*/

    error Sale__NotActive();
    error Sale__NotClaimable();
    error Sale__NotRefundable();
    error Sale__InvalidClaim();
    error Sale__InvalidRefund();
    error Sale__NotInactive();
    error Sale__InvalidPayment();
    error Sale__CapReached();

    /*----------  EVENTS  ------------------------------------------------*/

    event Sale__Purchase(address indexed account, uint256 amount);
    event Sale__Claim(address indexed account, uint256 amount);
    event Sale__Refund(address indexed account, uint256 amount);
    event Sale__Initialized();
    event Sale__Concluded(uint256 amount);
    event Sale__Withdrawn(address indexed account, uint256 amount);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor() {}

    function purchaseFor(address account) external payable {
        if (state != State.Active) revert Sale__NotActive();

        uint256 amount = msg.value;
        if (amount <= 0) revert Sale__InvalidPayment();

        uint256 total = totalAmount + amount;
        if (total > MAX_CAP) revert Sale__CapReached();

        account_Amount[account] += amount;
        totalAmount += amount;

        emit Sale__Purchase(account, amount);
    }

    function claimFor(address account) external {
        if (state != State.Claim) revert Sale__NotClaimable();
        if (account_Amount[account] == 0) revert Sale__InvalidClaim();

        uint256 claim = account_Amount[account] * PRICE / DIVISOR - account_Claim[account];
        if (claim <= 0) revert Sale__InvalidClaim();

        account_Claim[account] += claim;
        totalClaim += claim;

        IERC20(token).safeTransfer(account, claim);

        emit Sale__Claim(account, claim);
    }

    function refundFor(address account) external {
        if (state != State.Refund) revert Sale__NotRefundable();

        uint256 refund = account_Amount[account] - account_Refund[account];
        if (refund <= 0) revert Sale__InvalidRefund();

        account_Refund[account] += refund;
        totalRefund += refund;

        payable(account).transfer(refund);

        emit Sale__Refund(account, refund);
    }

    function initialize() external onlyOwner {
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
            totalClaim = totalAmount * DIVISOR / PRICE; 
            IERC20(token).safeTransfer(msg.sender, totalClaim);
            emit Sale__Concluded(totalClaim);
        }
    }

    function withdraw(address account) external onlyOwner {
        if (state != State.Claim) revert Sale__NotClaimable();
        uint256 amount = address(this).balance;
        payable(account).transfer(amount);
        emit Sale__Withdrawn(account, amount);
    }

}
