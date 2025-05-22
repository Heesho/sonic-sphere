// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BaseMock is ERC20, Ownable {

    uint256 public constant MAX_MINT = 1000 ether;
    uint256 public constant DURATION = 1 hours;

    mapping(address => uint256) public account_LastMint;
    mapping(address => bool) public account_IsWhitelisted;

    error BaseMock__MintTooLarge();
    error BaseMock__MintTooOften();

    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {}

    function mint(address _to, uint256 _amount) public {
        if (!account_IsWhitelisted[_to]) {
            if (_amount > MAX_MINT) revert BaseMock__MintTooLarge();
            if (account_LastMint[_to] + DURATION > block.timestamp)
                revert BaseMock__MintTooOften();
        }
        account_LastMint[_to] = block.timestamp;
        _mint(_to, _amount);
    }

    function setWhitelisted(address _account, bool _isWhitelisted) public onlyOwner {
        account_IsWhitelisted[_account] = _isWhitelisted;
    }
    
}
