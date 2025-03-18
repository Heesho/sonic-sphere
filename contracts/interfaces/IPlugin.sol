// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPlugin {
    /*----------  FUNCTIONS  --------------------------------------------*/
    function claimAndDistribute() external;
    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/
    function setGauge(address gauge) external;
    function setBribe(address bribe) external;
    /*----------  VIEW FUNCTIONS  ---------------------------------------*/
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function getToken() external view returns (address);
    function getProtocol() external view returns (string memory);
    function getName() external view returns (string memory);
    function getVoter() external view returns (address);
    function getGauge() external view returns (address);
    function getBribe() external view returns (address);
    function getAssetTokens() external view returns (address[] memory);
    function getBribeTokens() external view returns (address[] memory);
}


