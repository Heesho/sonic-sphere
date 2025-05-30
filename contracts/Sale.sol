// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Sale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 constant public PRICE = 0.5 ether;
    uint256 constant public DIVISOR = 1 ether;
    uint256 constant public MIN_CAP = 5_000_000 ether;
    uint256 constant public MAX_CAP = 10_000_000 ether;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public token;

    uint256 public totalAmount;
    uint256 public totalClaim;
    uint256 public totalRefund;

    mapping(address => uint256) public account_Amount;
    mapping(address => uint256) public account_Claim;
    mapping(address => uint256) public account_Refund;
    mapping(address => bool) public account_Whitelist;

    enum State {
        Closed,
        Whitelist,
        Open,
        Claim,
        Refund
    }

    State public state;

    /*----------  ERRORS  ------------------------------------------------*/

    error Sale__InvalidAccount();
    error Sale__NotWhitelisted();
    error Sale__NotOpen();
    error Sale__InvalidPayment();
    error Sale__InvalidClaim();
    error Sale__InvalidRefund();
    error Sale__TokenNotSet();
    error Sale__NotClaim();
    error Sale__NotRefund();
    error Sale__Concluded();
    error Sale__CantWithdrawInRefund();
    error Sale__MinCapNotReached();
    error Sale__MaxCapReached();

    /*----------  EVENTS  ------------------------------------------------*/

    event Sale__Purchase(address indexed account, uint256 amount);
    event Sale__Claim(address indexed account, uint256 amount);
    event Sale__Refund(address indexed account, uint256 amount);
    event Sale__Withdrawn(address indexed account, uint256 amount);
    event Sale__Whitelist(address indexed account, bool flag);
    event Sale__TokenSet(address indexed token);
    event Sale__StateUpdated(State indexed state);

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor() {}

    function purchaseFor(address account) external payable nonReentrant {
        if (account == address(0)) revert Sale__InvalidAccount();
        if (state == State.Whitelist) {
            if (!account_Whitelist[account]) revert Sale__NotWhitelisted();
        } else if (state != State.Open) revert Sale__NotOpen();

        uint256 amount = msg.value;
        if (amount <= 0) revert Sale__InvalidPayment();

        uint256 total = totalAmount + amount;
        if (total > MAX_CAP) revert Sale__MaxCapReached();

        account_Amount[account] += amount;
        totalAmount = total;

        emit Sale__Purchase(account, amount);
    }

    function claimFor(address account) external nonReentrant {
        if (account == address(0)) revert Sale__InvalidAccount();
        if (state != State.Claim) revert Sale__NotClaim();
        if (account_Amount[account] == 0) revert Sale__InvalidClaim();

        uint256 claim = account_Amount[account] * DIVISOR / PRICE - account_Claim[account];
        if (claim <= 0) revert Sale__InvalidClaim();

        account_Claim[account] += claim;
        totalClaim += claim;

        IERC20(token).safeTransfer(account, claim);

        emit Sale__Claim(account, claim);
    }

    function refundFor(address account) external nonReentrant {
        if (account == address(0)) revert Sale__InvalidAccount();
        if (state != State.Refund) revert Sale__NotRefund();
        if (account_Amount[account] == 0) revert Sale__InvalidRefund();

        uint256 refund = account_Amount[account] - account_Refund[account];
        if (refund <= 0) revert Sale__InvalidRefund();

        account_Refund[account] += refund;
        totalRefund += refund;

        payable(account).sendValue(refund);

        emit Sale__Refund(account, refund);
    }

    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/

    function whitelist(address[] calldata accounts, bool flag) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            account_Whitelist[accounts[i]] = flag;
            emit Sale__Whitelist(accounts[i], flag);
        }
    }

    function setToken(address _token) external onlyOwner {
        token = _token;
        emit Sale__TokenSet(token);
    }

    function updateState() external onlyOwner {
        if (state == State.Closed) {
            state = State.Whitelist;
            emit Sale__StateUpdated(State.Whitelist);
        } else if (state == State.Whitelist) {
            state = State.Open;
            emit Sale__StateUpdated(State.Open);
        } else if (state == State.Open) {
            if (totalAmount < MIN_CAP) {
                state = State.Refund;
                emit Sale__StateUpdated(State.Refund);
            } else {
                if (token == address(0)) revert Sale__TokenNotSet();
                state = State.Claim;
                uint256 tokenPurchased = getTotalTokenPurchased();
                IERC20(token).safeTransferFrom(msg.sender, address(this), tokenPurchased);
                emit Sale__StateUpdated(State.Claim);
            }
        } else {
            revert Sale__Concluded();
        }
    }

    function withdraw(address account) external onlyOwner {
        if (state == State.Refund) revert Sale__CantWithdrawInRefund();
        if (totalAmount < MIN_CAP) revert Sale__MinCapNotReached();
        uint256 amount = address(this).balance;
        payable(account).sendValue(amount);
        emit Sale__Withdrawn(account, amount);
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getTotalTokenPurchased() public view returns (uint256) {
        return totalAmount * DIVISOR / PRICE;
    }

}
