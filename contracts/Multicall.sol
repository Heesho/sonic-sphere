// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "contracts/interfaces/ITOKEN.sol";
import "contracts/interfaces/IVTOKEN.sol";
import "contracts/interfaces/IVTOKENRewarder.sol";
import "contracts/interfaces/IMinter.sol";
import "contracts/interfaces/IGauge.sol";
import "contracts/interfaces/IBribe.sol";
import "contracts/interfaces/IVoter.sol";
import "contracts/interfaces/IPlugin.sol";
import "./FixedPointMathLib.sol";

contract Multicall {
    using FixedPointMathLib for uint256;

    /*----------  CONSTANTS  --------------------------------------------*/

    uint256 public constant DIVISOR = 10000;
    uint256 public constant PRECISION = 1e18;

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable voter;
    address public immutable BASE;
    address public immutable TOKEN;
    address public immutable OTOKEN;
    address public immutable VTOKEN;
    address public immutable rewarder;

    uint256 public immutable FEE;

    struct SwapCard {
        uint256 frBASE;
        uint256 mrvBASE;
        uint256 mrrBASE;
        uint256 mrrTOKEN;
        uint256 marketMaxTOKEN;
    }

    struct BondingCurve {
        uint256 priceBASE;              
        uint256 priceTOKEN;             
        uint256 priceOTOKEN;            
        uint256 maxMarketSell;          

        uint256 tvl;                    
        uint256 supplyTOKEN;            
        uint256 supplyVTOKEN;           
        uint256 apr;                   
        uint256 ltv;                   
        uint256 marketCap;             
        uint256 weekly;                

        uint256 accountBASE;            
        uint256 accountTOKEN;           
        uint256 accountOTOKEN;          

        uint256 accountEarnedBASE;      
        uint256 accountEarnedTOKEN;     
        uint256 accountEarnedOTOKEN;    

        uint256 accountVTOKEN;          
        uint256 accountVotingPower;     
        uint256 accountUsedWeights;    

        uint256 accountBorrowCredit;    
        uint256 accountBorrowDebt;      
        uint256 accountMaxWithdraw;      

        uint256 accountLastVoted;       

    }

    struct GaugeCard {
        address plugin;                     
        address token;
        uint8 tokenDecimals;

        address gauge;                       
        bool isAlive;                       

        string protocol;                   
        string name;                       
        address[] assetTokens;              

        uint256 priceBase;
        uint256 priceOTOKEN;

        uint256 rewardPerToken;            
        uint256 rewardPerTokenUSD;          
        uint256 votingWeight;               
        uint256 totalSupply;                

        uint256 accountTokenBalance;   
        uint256 accountStakedBalance;      
        uint256 accountEarnedOTOKEN;        
    }

    struct BribeCard {
        address plugin;                 
        address bribe;                  
        bool isAlive;                   

        string protocol;                
        string name;                  

        address[] rewardTokens;          
        uint8[] rewardTokenDecimals;    
        uint256[] rewardsPerToken;      
        uint256[] accountRewardsEarned; 

        uint256 voteWeight;             
        uint256 votePercent;            

        uint256 accountVote;            
    }

    struct Portfolio {
        uint256 total;
        uint256 stakingRewards;
        uint256 farmingRewards;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter,
        address _BASE,
        address _TOKEN,
        address _OTOKEN,
        address _VTOKEN,
        address _rewarder
    ) {
        voter = _voter;
        BASE = _BASE;
        TOKEN = _TOKEN;
        OTOKEN = _OTOKEN;
        VTOKEN = _VTOKEN;
        rewarder = _rewarder;

        FEE = ITOKEN(TOKEN).SWAP_FEE();
    }

    /*----------  VIEW FUNCTIONS  ---------------------------------------*/

    function getBasePrice() public pure returns (uint256) {
        return 1e18;
    }

    function swapCardData() external view returns (SwapCard memory swapCard) {
        swapCard.frBASE = ITOKEN(TOKEN).frBASE();
        swapCard.mrvBASE = ITOKEN(TOKEN).mrvBASE();
        swapCard.mrrBASE = ITOKEN(TOKEN).mrrBASE();
        swapCard.mrrTOKEN = ITOKEN(TOKEN).mrrTOKEN();
        swapCard.marketMaxTOKEN = ITOKEN(TOKEN).mrvBASE();

        return swapCard;
    }

    function bondingCurveData(address account) external view returns (BondingCurve memory bondingCurve) {
        bondingCurve.priceBASE = getBasePrice();
        bondingCurve.priceTOKEN = ITOKEN(TOKEN).getMarketPrice() * bondingCurve.priceBASE / 1e18;
        bondingCurve.priceOTOKEN = ITOKEN(TOKEN).getOTokenPrice() * bondingCurve.priceBASE / 1e18;
        bondingCurve.maxMarketSell = ITOKEN(TOKEN).getMaxSell();

        bondingCurve.tvl = ITOKEN(TOKEN).getTotalValueLocked() * bondingCurve.priceBASE / 1e18;
        bondingCurve.supplyTOKEN = IERC20(TOKEN).totalSupply();
        bondingCurve.supplyVTOKEN = IVTOKEN(VTOKEN).totalSupplyTOKEN();
        bondingCurve.apr = bondingCurve.supplyVTOKEN == 0 ? 0 : (((IVTOKENRewarder(rewarder).getRewardForDuration(BASE) * bondingCurve.priceBASE / 1e18) + (IVTOKENRewarder(rewarder).getRewardForDuration(TOKEN) * bondingCurve.priceTOKEN / 1e18) + 
                           (IVTOKENRewarder(rewarder).getRewardForDuration(OTOKEN) * bondingCurve.priceOTOKEN / 1e18)) * 365 * 100 * 1e18 / (7 * IERC20(VTOKEN).totalSupply() * bondingCurve.priceTOKEN / 1e18));
        bondingCurve.ltv = 100 * ITOKEN(TOKEN).getFloorPrice() * 1e18 / ITOKEN(TOKEN).getMarketPrice();
        bondingCurve.marketCap = bondingCurve.supplyTOKEN * bondingCurve.priceTOKEN / 1e18;
        bondingCurve.weekly = IMinter(IVoter(voter).minter()).weekly();

        bondingCurve.accountBASE = (account == address(0) ? 0 : IERC20(BASE).balanceOf(account));
        bondingCurve.accountTOKEN = (account == address(0) ? 0 : IERC20(TOKEN).balanceOf(account));
        bondingCurve.accountOTOKEN = (account == address(0) ? 0 : IERC20(OTOKEN).balanceOf(account));

        bondingCurve.accountEarnedBASE = (account == address(0) ? 0 : IVTOKENRewarder(rewarder).earned(account, BASE));
        bondingCurve.accountEarnedTOKEN = (account == address(0) ? 0 : IVTOKENRewarder(rewarder).earned(account, TOKEN));
        bondingCurve.accountEarnedOTOKEN = (account == address(0) ? 0 : IVTOKENRewarder(rewarder).earned(account, OTOKEN));

        bondingCurve.accountVTOKEN = (account == address(0) ? 0 : IVTOKEN(VTOKEN).balanceOfTOKEN(account));
        bondingCurve.accountVotingPower = (account == address(0) ? 0 : IERC20(VTOKEN).balanceOf(account));
        bondingCurve.accountUsedWeights = (account == address(0) ? 0 : IVoter(voter).usedWeights(account));

        bondingCurve.accountBorrowCredit = (account == address(0) ? 0 : ITOKEN(TOKEN).getAccountCredit(account));
        bondingCurve.accountBorrowDebt = (account == address(0) ? 0 : ITOKEN(TOKEN).debts(account));
        bondingCurve.accountMaxWithdraw = (account == address(0) ? 0 : (IVoter(voter).usedWeights(account) > 0 ? 0 : bondingCurve.accountVTOKEN - bondingCurve.accountBorrowDebt));

        bondingCurve.accountLastVoted = (account == address(0) ? 0 : IVoter(voter).lastVoted(account));

        return bondingCurve;
    }

    function gaugeCardData(address plugin, address account) public view returns (GaugeCard memory gaugeCard) {
        gaugeCard.plugin = plugin;
        gaugeCard.token = IPlugin(plugin).getToken();
        gaugeCard.tokenDecimals = IERC20Metadata(gaugeCard.token).decimals();

        gaugeCard.gauge = IVoter(voter).gauges(plugin);
        gaugeCard.isAlive = IVoter(voter).isAlive(gaugeCard.gauge);
        
        gaugeCard.protocol = IPlugin(plugin).getProtocol(); 
        gaugeCard.name = IPlugin(plugin).getName();
        gaugeCard.assetTokens = IPlugin(plugin).getAssetTokens();

        gaugeCard.priceBase = getBasePrice();
        gaugeCard.priceOTOKEN = ITOKEN(TOKEN).getOTokenPrice() * (gaugeCard.priceBase) / 1e18;
        
        gaugeCard.rewardPerToken = IGauge(gaugeCard.gauge).totalSupply() == 0 ? 0 : (IGauge(IVoter(voter).gauges(plugin)).getRewardForDuration(OTOKEN) * 1e18 / IGauge(gaugeCard.gauge).totalSupply());
        gaugeCard.rewardPerTokenUSD = IGauge(gaugeCard.gauge).totalSupply() == 0 ? 0 : (IGauge(IVoter(voter).gauges(plugin)).getRewardForDuration(OTOKEN) * gaugeCard.priceOTOKEN / IGauge(gaugeCard.gauge).totalSupply());
        gaugeCard.votingWeight = (IVoter(voter).totalWeight() == 0 ? 0 : 100 * IVoter(voter).weights(plugin) * 1e18 / IVoter(voter).totalWeight());
        gaugeCard.totalSupply = IGauge(gaugeCard.gauge).totalSupply();

        gaugeCard.accountTokenBalance = (account == address(0) ? 0 : IERC20(gaugeCard.token).balanceOf(account));
        gaugeCard.accountStakedBalance = (account == address(0) ? 0 : IPlugin(plugin).balanceOf(account));
        gaugeCard.accountEarnedOTOKEN = (account == address(0) ? 0 : IGauge(IVoter(voter).gauges(plugin)).earned(account, OTOKEN));

        return gaugeCard;
    }

    function bribeCardData(address plugin, address account) public view returns (BribeCard memory bribeCard) {
        bribeCard.plugin = plugin;
        bribeCard.bribe = IVoter(voter).bribes(plugin);
        bribeCard.isAlive = IVoter(voter).isAlive(IVoter(voter).gauges(plugin));

        bribeCard.protocol = IPlugin(plugin).getProtocol();
        bribeCard.name = IPlugin(plugin).getName();
        bribeCard.rewardTokens = IBribe(IVoter(voter).bribes(plugin)).getRewardTokens();

        uint8[] memory _rewardTokenDecimals = new uint8[](bribeCard.rewardTokens.length);
        for (uint i = 0; i < bribeCard.rewardTokens.length; i++) {
            _rewardTokenDecimals[i] = IERC20Metadata(bribeCard.rewardTokens[i]).decimals();
        }
        bribeCard.rewardTokenDecimals = _rewardTokenDecimals;

        uint[] memory _rewardsPerToken = new uint[](bribeCard.rewardTokens.length);
        for (uint i = 0; i < bribeCard.rewardTokens.length; i++) {
            _rewardsPerToken[i] = (IBribe(bribeCard.bribe).totalSupply() == 0 ? 0 : IBribe(bribeCard.bribe).getRewardForDuration(bribeCard.rewardTokens[i]) * 1e18 / IBribe(bribeCard.bribe).totalSupply());
        }
        bribeCard.rewardsPerToken = _rewardsPerToken;

        uint[] memory _accountRewardsEarned = new uint[](bribeCard.rewardTokens.length);
        for (uint i = 0; i < bribeCard.rewardTokens.length; i++) {
            _accountRewardsEarned[i] = (account == address(0) ? 0 : IBribe(IVoter(voter).bribes(plugin)).earned(account, bribeCard.rewardTokens[i]));
        }
        bribeCard.accountRewardsEarned = _accountRewardsEarned;

        bribeCard.voteWeight = IVoter(voter).weights(plugin);
        bribeCard.votePercent = (IVoter(voter).totalWeight() == 0 ? 0 : 100 * IVoter(voter).weights(plugin) * 1e18 / IVoter(voter).totalWeight());

        bribeCard.accountVote = (account == address(0) ? 0 : IBribe(bribeCard.bribe).balanceOf(account));

        return bribeCard;
    }

    function getGaugeCards(uint256 start, uint256 stop, address account) external view returns (GaugeCard[] memory) {
        GaugeCard[] memory gaugeCards = new GaugeCard[](stop - start);
        for (uint i = start; i < stop; i++) {
            gaugeCards[i] = gaugeCardData(getPlugin(i), account);
        }
        return gaugeCards;
    }

    function getBribeCards(uint256 start, uint256 stop, address account) external view returns (BribeCard[] memory) {
        BribeCard[] memory bribeCards = new BribeCard[](stop - start);
        for (uint i = start; i < stop; i++) {
            bribeCards[i] = bribeCardData(getPlugin(i), account);
        }
        return bribeCards;
    }

    function getPlugins() external view returns (address[] memory) {
        return IVoter(voter).getPlugins();
    }

    function getPlugin(uint256 index) public view returns (address) {
        return IVoter(voter).plugins(index);
    }

    function quoteBuyIn(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 feeBASE = input * FEE / DIVISOR;
        uint256 oldMrBASE = ITOKEN(TOKEN).mrvBASE() + ITOKEN(TOKEN).mrrBASE();
        uint256 newMrBASE = oldMrBASE + input - feeBASE;
        uint256 oldMrTOKEN = ITOKEN(TOKEN).mrrTOKEN();
        output = oldMrTOKEN - (oldMrBASE * oldMrTOKEN / newMrBASE);
        slippage = 100 * (1e18 - (output * ITOKEN(TOKEN).getMarketPrice() / input));
        minOutput = (input * 1e18 / ITOKEN(TOKEN).getMarketPrice()) * slippageTolerance / DIVISOR;
        autoMinOutput = (input * 1e18 / ITOKEN(TOKEN).getMarketPrice()) * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteBuyOut(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 oldMrBASE = ITOKEN(TOKEN).mrvBASE() + ITOKEN(TOKEN).mrrBASE();
        output = DIVISOR * ((oldMrBASE * ITOKEN(TOKEN).mrrTOKEN() / (ITOKEN(TOKEN).mrrTOKEN() - input)) - oldMrBASE) / (DIVISOR - FEE);
        slippage = 100 * (1e18 - (input * ITOKEN(TOKEN).getMarketPrice() / output));
        minOutput = input * slippageTolerance / DIVISOR;
        autoMinOutput = input * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteSellIn(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 feeTOKEN = input * FEE / DIVISOR;
        uint256 oldMrTOKEN = ITOKEN(TOKEN).mrrTOKEN();
        uint256 newMrTOKEN = oldMrTOKEN + input - feeTOKEN;
        if (newMrTOKEN > ITOKEN(TOKEN).mrvBASE()) {
            return (0, 0, 0, 0);
        }

        uint256 oldMrBASE = ITOKEN(TOKEN).mrvBASE() + ITOKEN(TOKEN).mrrBASE();
        output = oldMrBASE - (oldMrBASE * oldMrTOKEN / newMrTOKEN);
        slippage = 100 * (1e18 - (output * 1e18 / (input * ITOKEN(TOKEN).getMarketPrice() / 1e18)));
        minOutput = input * ITOKEN(TOKEN).getMarketPrice() /1e18 * slippageTolerance / DIVISOR;
        autoMinOutput = input * ITOKEN(TOKEN).getMarketPrice() /1e18 * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function quoteSellOut(uint256 input, uint256 slippageTolerance) external view returns (uint256 output, uint256 slippage, uint256 minOutput, uint256 autoMinOutput) {
        uint256 oldMrBASE = ITOKEN(TOKEN).mrvBASE() + ITOKEN(TOKEN).mrrBASE();
        output = DIVISOR * ((oldMrBASE * ITOKEN(TOKEN).mrrTOKEN() / (oldMrBASE - input)) - ITOKEN(TOKEN).mrrTOKEN()) / (DIVISOR - FEE);
        if (output.mulDivDown(DIVISOR - FEE, DIVISOR) + ITOKEN(TOKEN).mrrTOKEN() > ITOKEN(TOKEN).mrvBASE()) {
            return (0, 0, 0, 0);
        }
        slippage = 100 * (1e18 - (input * 1e18 / (output * ITOKEN(TOKEN).getMarketPrice() / 1e18)));
        minOutput = input * slippageTolerance / DIVISOR;
        autoMinOutput = input * ((DIVISOR * 1e18) - ((slippage + 1e18) * 100)) / (DIVISOR * 1e18);
    }

    function portfolioData(address account) external view returns (Portfolio memory portfolio) {
        uint256 priceBASE = getBasePrice();

        portfolio.total = (account == address(0) ? 0 : priceBASE * (((IERC20(TOKEN).balanceOf(account) 
            + IVTOKEN(VTOKEN).balanceOfTOKEN(account)) * ITOKEN(TOKEN).getMarketPrice() / 1e18)
            + (IERC20(OTOKEN).balanceOf(account) * ITOKEN(TOKEN).getOTokenPrice() / 1e18)
            - ITOKEN(TOKEN).debts(account)) / 1e18);

        portfolio.stakingRewards = (account == address(0) ? 0 : priceBASE * (IVTOKENRewarder(rewarder).getRewardForDuration(BASE)
            + (IVTOKENRewarder(rewarder).getRewardForDuration(TOKEN) * ITOKEN(TOKEN).getMarketPrice() / 1e18)
            + (IVTOKENRewarder(rewarder).getRewardForDuration(OTOKEN) * ITOKEN(TOKEN).getOTokenPrice() / 1e18)) / 1e18
            * IERC20(VTOKEN).balanceOf(account) / IERC20(VTOKEN).totalSupply());

        address[] memory plugins = IVoter(voter).getPlugins();
        uint256 rewardsOTOKEN = 0;
        for (uint i = 0; i < plugins.length; i++) {
            address gauge = IVoter(voter).gauges(plugins[i]);
            if (IPlugin(plugins[i]).balanceOf(account) > 0) {
                rewardsOTOKEN += (IGauge(gauge).getRewardForDuration(OTOKEN) * IGauge(gauge).balanceOf(account) / IGauge(gauge).totalSupply());
            }
        }

        portfolio.farmingRewards = rewardsOTOKEN * ITOKEN(TOKEN).getOTokenPrice() * priceBASE / 1e36;
        
        return portfolio;
    }

}

