// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface ITOKEN {
    function frBASE() external view returns (uint256);
    function mrvBASE() external view returns (uint256);
    function mrrBASE() external view returns (uint256);
    function mrrTOKEN() external view returns (uint256);
    function getMarketPrice() external view returns (uint256);
    function getOTokenPrice() external view returns (uint256);
    function getTotalValueLocked() external view returns (uint256);
    function getFloorPrice() external view returns (uint256);
    function getMaxSell() external view returns (uint256);
    function getAccountCredit(address account) external view returns (uint256);
    function debts(address account) external view returns (uint256);
}

interface IVoter {
    function totalWeight() external view returns (uint256);
    function weights(address plugin) external view returns (uint256);
    function usedWeights(address account) external view returns (uint256);
    function lastVoted(address account) external view returns (uint256);
    function gauges(address plugin) external view returns (address);
    function bribes(address plugin) external view returns (address);
    function isAlive(address gauge) external view returns (bool);
    function plugins(uint256 index) external view returns (address);
    function getPlugins() external view returns (address[] memory);
    function minter() external view returns (address);
}

interface IVTOKEN {
    function totalSupplyTOKEN() external view returns (uint256);
    function balanceOfTOKEN(address account) external view returns (uint256);
}

interface IVTOKENRewarder {
    function getRewardForDuration(address token) external view returns (uint256);
    function earned(address account, address token) external view returns (uint256);
}

interface IMinter {
    function weekly() external view returns (uint256);
}

interface IBribe {
    function totalSupply() external view returns (uint256);
    function getRewardForDuration(address token) external view returns (uint256);
    function left(address token) external view returns (uint256);
    function getRewardTokens() external view returns (address[] memory);
    function earned(address account, address token) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

interface IPlugin {
    function name() external view returns (string memory);
    function asset() external view returns (address);
    function getRewardAuction() external view returns (address);
    function getAssetAuction() external view returns (address);
    function getTreasury() external view returns (address);
    function getRewardTokens() external view returns (address[] memory);
    function getInitialized() external view returns (bool);
    function getTvl() external view returns (uint256);
}

interface IAuction {
    struct Slot0 {
        uint8 locked; 
        uint16 epochId; 
        uint192 initPrice;
        uint40 startTime;
    }
    function epochPeriod() external view returns (uint256);
    function priceMultiplier() external view returns (uint256);
    function minInitPrice() external view returns (uint256);
    function getSlot0() external view returns (Slot0 memory);
    function getPrice() external view returns (uint256);
}

interface IGauge {
    function earned(address account, address token) external view returns (uint256);
}

contract Multicall {

    /*----------  STATE VARIABLES  --------------------------------------*/

    address public immutable voter;
    address public immutable BASE;
    address public immutable TOKEN;
    address public immutable OTOKEN;
    address public immutable VTOKEN;
    address public immutable rewarder;
    address public immutable auction;

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

    struct PluginCard {
        string name;

        address plugin;
        address asset;
        address gauge;
        address bribe;
        address assetAuction;
        address rewardAuction;
        address treasury;
        address[] rewardTokens;

        bool isAlive;       
        bool isInitialized;
        uint8 assetDecimals;

        uint256 tvl;
        uint256 votingWeight;
        uint256 auctionEpochDuration;
        uint256 auctionPriceMultiplier;
        uint256 auctionMinInitPrice;
        uint256 auctionEpoch;
        uint256 auctionInitPrice;
        uint256 auctionStartTime;
        uint256 auctionPrice;
        uint256 offeredOTOKEN;
        uint256 accountBalance;
    }

    struct RewardAuction {
        address[] assets;
        uint256[] amounts;
        uint256 auctionEpochDuration;
        uint256 auctionPriceMultiplier;
        uint256 auctionMinInitPrice;
        uint256 auctionEpoch;
        uint256 auctionInitPrice;
        uint256 auctionStartTime;
        uint256 auctionPrice;
        uint256 accountBalance;
    }

    struct BribeCard {
        address plugin;
        address bribe;
        bool isAlive;

        string name;

        address[] rewardTokens;
        uint8[] rewardTokenDecimals;
        uint256[] rewardsPerToken;
        uint256[] accountRewardsEarned;
        uint256[] rewardsLeft;

        uint256 voteWeight;
        uint256 votePercent;

        uint256 accountVote;
    }

    struct Portfolio {
        uint256 total;
        uint256 stakingRewards;
    }

    /*----------  FUNCTIONS  --------------------------------------------*/

    constructor(
        address _voter,
        address _BASE,
        address _TOKEN,
        address _OTOKEN,
        address _VTOKEN,
        address _rewarder,
        address _auction
    ) {
        voter = _voter;
        BASE = _BASE;
        TOKEN = _TOKEN;
        OTOKEN = _OTOKEN;
        VTOKEN = _VTOKEN;
        rewarder = _rewarder;
        auction = _auction;
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

    function pluginCardData(address plugin, address account) public view returns (PluginCard memory pluginCard) {
        pluginCard.name = IPlugin(plugin).name();
        pluginCard.plugin = plugin;
        pluginCard.asset = IPlugin(plugin).asset();
        pluginCard.gauge = IVoter(voter).gauges(plugin);
        pluginCard.bribe = IVoter(voter).bribes(plugin);
        pluginCard.assetAuction = IPlugin(plugin).getAssetAuction();
        pluginCard.rewardAuction = IPlugin(plugin).getRewardAuction();
        pluginCard.treasury = IPlugin(plugin).getTreasury();
        pluginCard.rewardTokens = IPlugin(plugin).getRewardTokens();
        
        pluginCard.isAlive = IVoter(voter).isAlive(pluginCard.gauge);
        pluginCard.isInitialized = IPlugin(plugin).getInitialized();
        pluginCard.assetDecimals = IERC20Metadata(pluginCard.asset).decimals();
        pluginCard.tvl = IPlugin(plugin).getTvl();
        pluginCard.votingWeight = (IVoter(voter).totalWeight() == 0 ? 0 : 100 * IVoter(voter).weights(plugin) * 1e18 / IVoter(voter).totalWeight());

        pluginCard.auctionEpochDuration = IAuction(pluginCard.assetAuction).epochPeriod();
        pluginCard.auctionPriceMultiplier = IAuction(pluginCard.assetAuction).priceMultiplier();
        pluginCard.auctionMinInitPrice = IAuction(pluginCard.assetAuction).minInitPrice();
        IAuction.Slot0 memory slot0 = IAuction(pluginCard.assetAuction).getSlot0();
        pluginCard.auctionEpoch = slot0.epochId;
        pluginCard.auctionInitPrice = slot0.initPrice;
        pluginCard.auctionStartTime = slot0.startTime;
        pluginCard.auctionPrice = IAuction(pluginCard.assetAuction).getPrice();
        pluginCard.offeredOTOKEN = IERC20(OTOKEN).balanceOf(pluginCard.assetAuction) 
            + IERC20(OTOKEN).balanceOf(pluginCard.plugin) 
            + IGauge(pluginCard.gauge).earned(pluginCard.plugin, OTOKEN);

        pluginCard.accountBalance = (account == address(0) ? 0 : IERC20(pluginCard.asset).balanceOf(account));

        return pluginCard;
    }

    function rewardAuctionData(address account) public view returns (RewardAuction memory rewardAuction) {
        address[] memory plugins = IVoter(voter).getPlugins();
        uint256 assetsLength = 0;
        for (uint i = 0; i < plugins.length; i++) {
            assetsLength += IPlugin(plugins[i]).getRewardTokens().length;
        }
        rewardAuction.assets = new address[](assetsLength);
        rewardAuction.amounts = new uint256[](assetsLength);
        uint256 index = 0;
        for (uint i = 0; i < plugins.length; i++) {
            address[] memory rewardTokens = IPlugin(plugins[i]).getRewardTokens();
            for (uint j = 0; j < rewardTokens.length; j++) {
                rewardAuction.assets[index] = rewardTokens[j];
                rewardAuction.amounts[index] = IERC20(rewardTokens[j]).balanceOf(auction);
                index++;
            }
        }
        rewardAuction.auctionEpochDuration = IAuction(auction).epochPeriod();
        rewardAuction.auctionPriceMultiplier = IAuction(auction).priceMultiplier();
        rewardAuction.auctionMinInitPrice = IAuction(auction).minInitPrice();
        IAuction.Slot0 memory slot0 = IAuction(auction).getSlot0();
        rewardAuction.auctionEpoch = slot0.epochId;
        rewardAuction.auctionInitPrice = slot0.initPrice;
        rewardAuction.auctionStartTime = slot0.startTime;
        rewardAuction.auctionPrice = IAuction(auction).getPrice();
        rewardAuction.accountBalance = (account == address(0) ? 0 : IERC20(TOKEN).balanceOf(account));

        return rewardAuction;
    }

    function bribeCardData(address plugin, address account) public view returns (BribeCard memory bribeCard) {
        bribeCard.plugin = plugin;
        bribeCard.bribe = IVoter(voter).bribes(plugin);
        bribeCard.isAlive = IVoter(voter).isAlive(IVoter(voter).gauges(plugin));

        bribeCard.name = IPlugin(plugin).name();
        bribeCard.rewardTokens = IBribe(bribeCard.bribe).getRewardTokens();

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
            _accountRewardsEarned[i] = (account == address(0) ? 0 : IBribe(bribeCard.bribe).earned(account, bribeCard.rewardTokens[i]));
        }
        bribeCard.accountRewardsEarned = _accountRewardsEarned;

        uint[] memory _rewardsLeft = new uint[](bribeCard.rewardTokens.length);
        for (uint i = 0; i < bribeCard.rewardTokens.length; i++) {
            _rewardsLeft[i] = IBribe(bribeCard.bribe).left(bribeCard.rewardTokens[i]);
        }
        bribeCard.rewardsLeft = _rewardsLeft;

        bribeCard.voteWeight = IVoter(voter).weights(plugin);
        bribeCard.votePercent = (IVoter(voter).totalWeight() == 0 ? 0 : 100 * IVoter(voter).weights(plugin) * 1e18 / IVoter(voter).totalWeight());

        bribeCard.accountVote = (account == address(0) ? 0 : IBribe(bribeCard.bribe).balanceOf(account));

        return bribeCard;
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
        
        return portfolio;
    }

    function getPluginCards(uint256 start, uint256 stop, address account) external view returns (PluginCard[] memory) {
        PluginCard[] memory pluginCards = new PluginCard[](stop - start);
        for (uint i = start; i < stop; i++) {
            pluginCards[i] = pluginCardData(getPlugin(i), account);
        }
        return pluginCards;
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

}

