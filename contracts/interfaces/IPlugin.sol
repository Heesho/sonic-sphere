// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IPlugin {
    struct Slot0 {
        uint8 locked;
        uint16 epochId;
        uint192 initPrice;
        uint40 startTime;
    }
    /*----------  FUNCTIONS  --------------------------------------------*/
    function buy(address[] calldata assets, address assetsReceiver, uint256 epochId, uint256 deadline, uint256 maxPaymentTokenAmount) external returns (uint256);
    /*----------  RESTRICTED FUNCTIONS  ---------------------------------*/
    function setGauge(address gauge) external;
    function setBribe(address bribe) external;
    /*----------  VIEW FUNCTIONS  ---------------------------------------*/
    function getName() external view returns (string memory);
    function getVoter() external view returns (address);
    function getGauge() external view returns (address);
    function getBribe() external view returns (address);
    function getAssetTokens() external view returns (address[] memory);
    function getBribeTokens() external view returns (address[] memory);
    function getPrice() external view returns (uint256);
    function getSlot0() external view returns (Slot0 memory);
    function initialized() external view returns (bool);
    function paymentToken() external view returns (address);
    function paymentReceiver() external view returns (address);
    function epochPeriod() external view returns (uint256);
    function priceMultiplier() external view returns (uint256);
    function minInitPrice() external view returns (uint256);
}


