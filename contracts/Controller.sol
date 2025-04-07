// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IVoter {
    function OTOKEN() external view returns (address);
    function getPlugins() external view returns (address[] memory);
    function gauges(address plugin) external view returns (address);
    function isAlive(address gauge) external view returns (bool);
    function distribute(address gauge) external;
}

interface ITOKENFees {
    function distribute() external;
}

interface IPlugin {
    function getRewardTokens() external view returns (address[] memory);
    function claim() external;
    function distribute(address[] memory tokens) external;
}

contract Controller {

    /*----------  CONSTANTS  --------------------------------------------*/

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable voter;
    address public immutable fees;

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter,
        address _fees
    ) {
        voter = _voter;
        fees = _fees;
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function distributeToGauges() public {
        address[] memory plugins = IVoter(voter).getPlugins();
        for (uint256 i = 0; i < plugins.length; i++) {
            address gauge = IVoter(voter).gauges(plugins[i]);
            if (IVoter(voter).isAlive(gauge)) {
                IVoter(voter).distribute(gauge);
            }
        }
    }

    function distributeToAuctions() public {
        address[] memory plugins = IVoter(voter).getPlugins();
        for (uint256 i = 0; i < plugins.length; i++) {
            address oToken = IVoter(voter).OTOKEN();
            address[] memory rewardTokens = IPlugin(plugins[i]).getRewardTokens();
            address[] memory tokens = new address[](rewardTokens.length + 1);
            tokens[0] = oToken;
            for (uint256 j = 0; j < rewardTokens.length; j++) {
                tokens[j + 1] = rewardTokens[j];
            }
            IPlugin(plugins[i]).claim();
            IPlugin(plugins[i]).distribute(tokens);
        }
    }

    function distributeToStakers() public {
        ITOKENFees(fees).distribute();
    }

    function distribute() external {
        distributeToGauges();
        distributeToAuctions();
        distributeToStakers();
    }

}