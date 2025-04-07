const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const one = convert("1", 18);

const MARKET_RESERVES = "5000000"; // 5,000,000 TOKEN in market reserves

const BASE_ADDRESS = "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce"; // HONEY address
const MULTISIG = "0xaB53AfB5C63E2552e7bD986c0a38E8a8dC58E09C"; // Multisig Address
const VAULT_FACTORY = "0x94Ad6Ac84f6C6FbA8b8CCbD71d9f4f101def52a8"; // Vault Factory Address
const BUILDER_ADDRESS = "0xDeb7d9B443a3ab779DFe9Ff2Aa855b1eA5fD318e";

const HONEY = "0xFCBD14DC51f0A4d49d5E53C2E0950e0bC26d0Dce";
const WBERA = "0x6969696969696969696969696969696969696969";
const WETH = "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590";
const WBTC = "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c";
const USDCe = "0x549943e04f40284185054145c6E4e9568C1D3241";
const BYUSD = "0x688e72142674041f8f6Af4c808a4045cA1D6aC82";
const YEET = "0x08A38Caa631DE329FF2DAD1656CE789F31AF3142";
const IBGT = "0xac03CABA51e17c86c921E1f6CBFBdC91F8BB2E6b";
const OHM = "0x18878Df23e2a36f81e820e4b47b4A40576D3159C";
const XKDK = "0xe8D7b965BA082835EA917F2B173Ff3E035B69eeB";
const PLUG = "0x231A6BD8eB88Cfa42776B7Ac575CeCAf82bf1E21";
const BRLY = "0x5C43a5fEf2b056934478373A53d1cb08030fd382";
const rUSD = "0x09D4214C03D01F49544C0448DBE3A27f768F2b34";
const rUSDOT = "0x4A8B5283E053A8B118EaDc4981e8Ec8659995652";
const PRG = "0xbf2E152f460090aCE91A456e3deE5ACf703f27aD";
const BERAMO = "0x1F7210257FA157227D09449229a9266b0D581337";
const LBGT = "0xBaadCC2962417C01Af99fb2B7C75706B9bd6Babe";
const RAMEN = "0xb8B1Af593Dc37B33a2c87C8Db1c9051FC32858B7";
const BITCOIN = "0x6B26f778bfae56CFb4Bf9b62c678d9D40e725227";
const NECT = "0x1ce0a25d13ce4d52071ae7e02cf1f6606f4c79d3";
const WGBERA = "0xd77552d3849ab4d8c3b189a9582d0ba4c1f4f912";
const LOCKS = "0xb7E448E5677D212B8C8Da7D6312E8Afc49800466";
const brWETH = "0xDDCa6328c88e30aBB02436A9Cc1A4e229Cad44aC";

// Beradrom Plugin Factory
const BERADROME_PLUGIN_FACTORY = "0xf0b0f738Fed0656D66725bb1528B42050de64DCa";

// Beradrome Kodiak PLUG-WBERA-V2
// get from
const BERADROME_TOKEN_0 = "0xac1D44f0284634EB04FFA56C76d47e839224b46F";
const BERADROME_TOKENS_0 = [PLUG, WBERA];
const BERADROME_REWARDS_0 = [PLUG];
const BERADROME_SYMBOL_0 = "Kodiak PLUG-WBERA-V2";
const BERADROME_NAME_0 = "Beradrome Kodiak PLUG-WBERA-V2";
const BERADROME_PLUGIN_0 = "0xAEe71E1C9506f7a1fa6c7655657d239EbC31b5AE";

// Beradrome Kodiak BRLY-WBERA-V2
// get from
const BERADROME_TOKEN_1 = "0xedd7deb874de23b168a5803a4f3a21bae9720b84";
const BERADROME_TOKENS_1 = [BRLY, WBERA];
const BERADROME_REWARDS_1 = [BRLY];
const BERADROME_SYMBOL_1 = "Kodiak BRLY-WBERA-V2";
const BERADROME_NAME_1 = "Beradrome Kodiak BRLY-WBERA-V2";
const BERADROME_PLUGIN_1 = "0x54128f98a3E2F22828B23Ba32F182A3f89a69BA2";

// Beradrome AB-KODIAK-rUSD-rUSDOT-500
// get from
const BERADROME_TOKEN_2 = "0x20a49a266AE70d07Ba066Ef1F8b6e670216Ab2a6";
const BERADROME_TOKENS_2 = [rUSD, rUSDOT];
const BERADROME_REWARDS_2 = [PRG];
const BERADROME_SYMBOL_2 = "AB-KODIAK-rUSD-rUSDOT-500";
const BERADROME_NAME_2 = "Beradrome AB-KODIAK-rUSD-rUSDOT-500";
const BERADROME_PLUGIN_2 = "0x15b09BA2a72035d84d19B10951F0bF116114DC7C";

// Beradrome AB-KODIAK-WBERA-BERAMO-10000
// get from
const BERADROME_TOKEN_3 = "0xf9845a03F7e6b06645A03a28b943C8A4B5fE7BCC";
const BERADROME_TOKENS_3 = [WBERA, BERAMO];
const BERADROME_REWARDS_3 = [BERAMO];
const BERADROME_SYMBOL_3 = "AB-KODIAK-WBERA-BERAMO-10000";
const BERADROME_NAME_3 = "Beradrome AB-KODIAK-WBERA-BERAMO-10000";
const BERADROME_PLUGIN_3 = "0x9162DeF1900e74Ca75D72fE8a01D5cDb7eA0CdF1";

// Beradrome LOCKS
const BERADROME_TOKEN_4 = LOCKS;
const BERADROME_TOKENS_4 = [LOCKS];
const BERADROME_REWARDS_4 = [PRG];
const BERADROME_SYMBOL_4 = "LOCKS";
const BERADROME_NAME_4 = "Beradrome LOCKS";
const BERADROME_PLUGIN_4 = "0x395bBE4Bc7DB06cc188FAC373adc4729391c6406";

// Berachain Plugin Factory
const BERACHAIN_PLUGIN_FACTORY = "0x3E5b9a5D7D73D8781c4782910523b942dB831ef8";

// Berachain BeraSwap 50WBERA-50HONEY-WEIGHTED
// get from https://hub.berachain.com/pools/0x2c4a603a2aa5596287a06886862dc29d56dbc354000200000000000000000002/details/
const BERACHAIN_TOKEN_0 = "0x2c4a603A2aA5596287A06886862dc29d56DbC354";
const BERACHAIN_TOKENS_0 = [WBERA, HONEY];
const BERACHAIN_SYMBOL_0 = "BeraSwap 50WBERA-50HONEY-WEIGHTED";
const BERACHAIN_NAME_0 = "Beradrome BeraSwap 50WBERA-50HONEY-WEIGHTED";
const BERACHAIN_PLUGIN_0 = "0xAC5922bccb16A0213684427F0412fCf8F9500171";

// Berachain Beraswap 50WETH-50WBERA-WEIGHTED
// get from https://hub.berachain.com/pools/0xdd70a5ef7d8cfe5c5134b5f9874b09fb5ce812b4000200000000000000000003/details/
const BERACHAIN_TOKEN_1 = "0xDd70A5eF7d8CfE5C5134b5f9874b09Fb5Ce812b4";
const BERACHAIN_TOKENS_1 = [WETH, WBERA];
const BERACHAIN_SYMBOL_1 = "BeraSwap 50WETH-50WBERA-WEIGHTED";
const BERACHAIN_NAME_1 = "Beradrome BeraSwap 50WETH-50WBERA-WEIGHTED";
const BERACHAIN_PLUGIN_1 = "0x9dEcf33822180902DA7643F459bAb1163dB00Bad";

// Berachain BeraSwap 50WBTC-50WBERA-WEIGHTED
// get from https://hub.berachain.com/pools/0x38fdd999fe8783037db1bbfe465759e312f2d809000200000000000000000004/details/
const BERACHAIN_TOKEN_2 = "0x38fdD999Fe8783037dB1bBFE465759e312f2d809";
const BERACHAIN_TOKENS_2 = [WBTC, WBERA];
const BERACHAIN_SYMBOL_2 = "BeraSwap 50WBTC-50WBERA-WEIGHTED";
const BERACHAIN_NAME_2 = "Beradrome BeraSwap 50WBTC-50WBERA-WEIGHTED";
const BERACHAIN_PLUGIN_2 = "0x90c199CC9Eb30218B421045935EAb3E9D26d9f0C";

// Berachain BeraSwap USDCe-HONEY-STABLE
// get from https://hub.berachain.com/pools/0xf961a8f6d8c69e7321e78d254ecafbcc3a637621000000000000000000000001/details/
const BERACHAIN_TOKEN_3 = "0xF961a8f6d8c69E7321e78d254ecAfBcc3A637621";
const BERACHAIN_TOKENS_3 = [USDCe, HONEY];
const BERACHAIN_SYMBOL_3 = "BeraSwap USDCe-HONEY-STABLE";
const BERACHAIN_NAME_3 = "Beradrome BeraSwap USDCe-HONEY-STABLE";
const BERACHAIN_PLUGIN_3 = "0xCA35e42fA5DE0810ace624aD414B43C6966EF9a2";

// Berachain BeraSwap BYUSD-HONEY-STABLE
// get from https://hub.berachain.com/pools/0xde04c469ad658163e2a5e860a03a86b52f6fa8c8000000000000000000000000/details/
const BERACHAIN_TOKEN_4 = "0xde04c469ad658163e2a5e860a03a86b52f6fa8c8";
const BERACHAIN_TOKENS_4 = [BYUSD, HONEY];
const BERACHAIN_SYMBOL_4 = "BeraSwap BYUSD-HONEY-STABLE";
const BERACHAIN_NAME_4 = "Beradrome BeraSwap BYUSD-HONEY-STABLE";
const BERACHAIN_PLUGIN_4 = "0x968eC53B7bBC6284333719Cd23A653fD9cD4eD86";

// BeraPaw Plugin Factory
const BERAPAW_PLUGIN_FACTORY = "0x5Fd179B11359681e1bd39B8cb0bA623834613a64";

// BeraPaw BeraSwap 50WBERA-50HONEY-WEIGHTED
const BERAPAW_TOKEN_0 = "0x2c4a603A2aA5596287A06886862dc29d56DbC354";
const BERAPAW_TOKENS_0 = [WBERA, HONEY];
const BERAPAW_SYMBOL_0 = "BeraSwap 50WBERA-50HONEY-WEIGHTED";
const BERAPAW_NAME_0 = "Beradrome BeraPaw BeraSwap 50WBERA-50HONEY-WEIGHTED";
const BERAPAW_PLUGIN_0 = "0xEEb20cf591B2246a042Ff9eB8d734c38532BE46c";

// BeraPaw BeraSwap 50WETH-50WBERA-WEIGHTED
const BERAPAW_TOKEN_1 = "0xDd70A5eF7d8CfE5C5134b5f9874b09Fb5Ce812b4";
const BERAPAW_TOKENS_1 = [WETH, WBERA];
const BERAPAW_SYMBOL_1 = "BeraSwap 50WETH-50WBERA-WEIGHTED";
const BERAPAW_NAME_1 = "Beradrome BeraPaw BeraSwap 50WETH-50WBERA-WEIGHTED";
const BERAPAW_PLUGIN_1 = "0x29017de16D6F1F257E731A67E8C780616e655681";

// BeraPaw BeraSwap 50WBTC-50WBERA-WEIGHTED
const BERAPAW_TOKEN_2 = "0x38fdD999Fe8783037dB1bBFE465759e312f2d809";
const BERAPAW_TOKENS_2 = [WBTC, WBERA];
const BERAPAW_SYMBOL_2 = "BeraSwap 50WBTC-50WBERA-WEIGHTED";
const BERAPAW_NAME_2 = "Beradrome BeraPaw BeraSwap 50WBTC-50WBERA-WEIGHTED";
const BERAPAW_PLUGIN_2 = "0x28d6aD720C7e2002Fa8a4025CBeA220991605079";

// BeraPaw BeraSwap USDCe-HONEY-STABLE
const BERAPAW_TOKEN_3 = "0xF961a8f6d8c69E7321e78d254ecAfBcc3A637621";
const BERAPAW_TOKENS_3 = [USDCe, HONEY];
const BERAPAW_SYMBOL_3 = "BeraSwap USDCe-HONEY-STABLE";
const BERAPAW_NAME_3 = "Beradrome BeraPaw BeraSwap USDCe-HONEY-STABLE";
const BERAPAW_PLUGIN_3 = "0xbf65AB8E96c9a56e81E252554e41E6752118067D";

// BeraPaw BeraSwap BYUSD-HONEY-STABLE
const BERAPAW_TOKEN_4 = "0xde04c469ad658163e2a5e860a03a86b52f6fa8c8";
const BERAPAW_TOKENS_4 = [BYUSD, HONEY];
const BERAPAW_SYMBOL_4 = "BeraSwap BYUSD-HONEY-STABLE";
const BERAPAW_NAME_4 = "Beradrome BeraPaw BeraSwap BYUSD-HONEY-STABLE";
const BERAPAW_PLUGIN_4 = "0x8Dc5C77ffF4Dd77AA50D6F5f8C1DBdfdacA05e12";

// Infrared Plugin Factory
const INFRARED_PLUGIN_FACTORY = "0x1901f6371aECC135FEdCaDdCF15647C13EAc6DF0";

// Infrared BeraSwap 50WBERA-50HONEY-WEIGHTED
// get from https://hub.berachain.com/pools/0x2c4a603a2aa5596287a06886862dc29d56dbc354000200000000000000000002/details/
const INFRARED_VAULT_0 = "0xe2d8941dfb85435419D90397b09D18024ebeef2C";
const INFRARED_TOKENS_0 = [WBERA, HONEY];
const INFRARED_REWARDS_0 = [IBGT];
const INFRARED_SYMBOL_0 = "BeraSwap 50WBERA-50HONEY-WEIGHTED";
const INFRARED_NAME_0 = "Beradrome Infrared BeraSwap 50WBERA-50HONEY-WEIGHTED";
const INFRARED_PLUGIN_0 = "0xF7f7cFc9FEB0f40a158D607F7Aa04B9D18aC8CA6";

// Infrared BeraSwap 50WETH-50WBERA-WEIGHTED
// get from https://hub.berachain.com/pools/0xdd70a5ef7d8cfe5c5134b5f9874b09fb5ce812b4000200000000000000000003/details/
const INFRARED_VAULT_1 = "0x0dF14916796854d899576CBde69a35bAFb923c22";
const INFRARED_TOKENS_1 = [WETH, WBERA];
const INFRARED_REWARDS_1 = [IBGT];
const INFRARED_SYMBOL_1 = "BeraSwap 50WETH-50WBERA-WEIGHTED";
const INFRARED_NAME_1 = "Beradrome Infrared BeraSwap 50WETH-50WBERA-WEIGHTED";
const INFRARED_PLUGIN_1 = "0xdB79d6a9D43c69BEd341ee93d796f4aDDEF174cc";

// Infrared BeraSwap 50WBTC-50WBERA-WEIGHTED
// get from https://hub.berachain.com/pools/0x38fdd999fe8783037db1bbfe465759e312f2d809000200000000000000000004/details/
const INFRARED_VAULT_2 = "0x78beda3a06443f51718d746aDe95b5fAc094633E";
const INFRARED_TOKENS_2 = [WBTC, WBERA];
const INFRARED_REWARDS_2 = [IBGT];
const INFRARED_SYMBOL_2 = "BeraSwap 50WBTC-50WBERA-WEIGHTED";
const INFRARED_NAME_2 = "Beradrome Infrared BeraSwap 50WBTC-50WBERA-WEIGHTED";
const INFRARED_PLUGIN_2 = "0x8bBFCfF7FeA31aA4d330663111b85924dBad11B8";

// Infrared BeraSwap USDCe-HONEY-STABLE
// get from https://hub.berachain.com/pools/0xf961a8f6d8c69e7321e78d254ecafbcc3a637621000000000000000000000001/details/
const INFRARED_VAULT_3 = "0x1419515d3703d8F2cc72Fa6A341685E4f8e7e8e1";
const INFRARED_TOKENS_3 = [USDCe, HONEY];
const INFRARED_REWARDS_3 = [IBGT];
const INFRARED_SYMBOL_3 = "BeraSwap USDCe-HONEY-STABLE";
const INFRARED_NAME_3 = "Beradrome Infrared BeraSwap USDCe-HONEY-STABLE";
const INFRARED_PLUGIN_3 = "0x98DBeA9494f4630773D3Ef834c0734D28C39E440";

// Infrared BeraSwap BYUSD-HONEY-STABLE
// get from https://hub.berachain.com/pools/0xde04c469ad658163e2a5e860a03a86b52f6fa8c8000000000000000000000000/details/
const INFRARED_VAULT_4 = "0xbbB228B0D7D83F86e23a5eF3B1007D0100581613";
const INFRARED_TOKENS_4 = [BYUSD, HONEY];
const INFRARED_REWARDS_4 = [IBGT];
const INFRARED_SYMBOL_4 = "BeraSwap BYUSD-HONEY-STABLE";
const INFRARED_NAME_4 = "Beradrome Infrared BeraSwap BYUSD-HONEY-STABLE";
const INFRARED_PLUGIN_4 = "0xdbF1a45Cf806346a26B54c447fb4840b68828cDd";

// Infrared iBGT
// get from
const INFRARED_VAULT_5 = "0x75F3Be06b02E235f6d0E7EF2D462b29739168301";
const INFRARED_TOKENS_5 = [IBGT];
const INFRARED_REWARDS_5 = [HONEY];
const INFRARED_SYMBOL_5 = "iBGT";
const INFRARED_NAME_5 = "Beradrome Infrared iBGT";
const INFRARED_PLUGIN_5 = "0x0AB1f3949cebB19FDebC5934d1822EA9ca24aE6F";

// Infrared Kodiak brWETH-HONEY-V2
const INFRARED_VAULT_6 = "0x6124F8aB58Ea91C782F3eb7A971F0f8c8D3D7948";
const INFRARED_TOKENS_6 = [brWETH, HONEY];
const INFRARED_REWARDS_6 = [IBGT];
const INFRARED_SYMBOL_6 = "brWETH-HONEY-V2";
const INFRARED_NAME_6 = "Beradrome Infrared Kodiak brWETH-HONEY-V2";
const INFRARED_PLUGIN_6 = "0x8C3B6d5dF8fEB0D5E7c995FDBD9fB08ca29F38Af";

// BurrBear Plugin Factory
const BURRBEAR_PLUGIN_FACTORY = "0x37bDB41e497C5b93C9D0652B52cF9979B1c8751e";

// BurrBear NECT/USDC/HONEY
const BURRBEAR_PID_0 = "0";
const BURRBEAR_TOKENS_0 = [NECT, USDCe, HONEY];
const BURRBEAR_SYMBOL_0 = "NECT/USDC/HONEY";
const BURRBEAR_NAME_0 = "Beradrome BurrBear NECT/USDC/HONEY";
const BURRBEAR_PLUGIN_0 = "0xDC296fA14deeD5762c7bcb38afac7c958839C019";

// BurrBear WBERA-wgBERA
const BURRBEAR_PID_1 = "1";
const BURRBEAR_TOKENS_1 = [WBERA, WGBERA];
const BURRBEAR_SYMBOL_1 = "WBERA-wgBERA";
const BURRBEAR_NAME_1 = "Beradrome BurrBear WBERA-wgBERA";
const BURRBEAR_PLUGIN_1 = "0x991214424e93331434b4BD2DAB2E6A2a6408E30D";

// BurrBear NECT-wgBERA
const BURRBEAR_PID_2 = "2";
const BURRBEAR_TOKENS_2 = [NECT, WGBERA];
const BURRBEAR_SYMBOL_2 = "50NECT-50wgBERA";
const BURRBEAR_NAME_2 = "Beradrome BurrBear 50NECT-50wgBERA";
const BURRBEAR_PLUGIN_2 = "0x2946c4aA82c14bA9355fF2D93645586690c1B579";

// Trifecta Plugin Factory
const TRIFECTA_PLUGIN_FACTORY = "0x5CEf8C04AD128Cf25142111f868ab09D6eA25f6A";

// Trifecta Kodiak YEET-WBERA
const TRIFECTA_TOKEN_0 = "0xEc8BA456b4e009408d0776cdE8B91f8717D13Fa1";
const TRIFECTA_FARM_0 = "0x1C8e199c6c42D5ccE652Cf02002694D937118177";
const TRIFECTA_TOKEN0_0 = YEET;
const TRIFECTA_TOKEN1_0 = WBERA;
const TRIFECTA_OTHER_REWARDS_0 = [YEET];
const TRIFECTA_SYMBOL_0 = "Kodiak Island WBERA-YEET-1%";
const TRIFECTA_NAME_0 =
  "Beradrome Liquidity Trifecta Kodiak Island WBERA-YEET-1%";
const TRIFECTA_PLUGIN_0 = "0x26aE252B4607826f03b8e701a792346864bec758";

// Trifecta Kodiak WBERA-RAMEN
const TRIFECTA_TOKEN_1 = "0x93A913351CaE2D8C82C4b85f699726947eB76d32";
const TRIFECTA_FARM_1 = "0x6F22221dC5845A25597BC96629D92F2b4979D943";
const TRIFECTA_TOKEN0_1 = WBERA;
const TRIFECTA_TOKEN1_1 = RAMEN;
const TRIFECTA_OTHER_REWARDS_1 = [RAMEN];
const TRIFECTA_SYMBOL_1 = "Kodiak Island WBERA-RAMEN-1%";
const TRIFECTA_NAME_1 =
  "Beradrome Liquidity Trifecta Kodiak Island WBERA-RAMEN-1%";
const TRIFECTA_PLUGIN_1 = "0x75b3C55fc3C0a2f874eEeC2C056fA336FB78fECa";

// Trifecta Kodiak BERA-BITCOIN
const TRIFECTA_TOKEN_2 = "0x2CaFe99dB26Cf86Ae8587F5934830d25aD5C3Cb3";
const TRIFECTA_FARM_2 = "0xB4a1519956ceE0798EAac3De08F1531F58a0C950";
const TRIFECTA_TOKEN0_2 = WBERA;
const TRIFECTA_TOKEN1_2 = BITCOIN;
const TRIFECTA_OTHER_REWARDS_2 = [BITCOIN];
const TRIFECTA_SYMBOL_2 = "Kodiak Island WBERA-BITCOIN-1%";
const TRIFECTA_NAME_2 =
  "Beradrome Liquidity Trifecta Kodiak Island WBERA-BITCOIN-1%";
const TRIFECTA_PLUGIN_2 = "0xfB58F9fab6aa614001304d6296F46069BDcac355";

// Infrared Trifecta Plugin Factory
const INFRARED_TRIFECTA_PLUGIN_FACTORY =
  "0xE31E90ceE704A24ad84caBa1CA31B827fA05FE3d";

// Infrared Trifecta Kodiak Island OHM-HONEY-0.3%
const INFRARED_TRIFECTA_VAULT_0 = "0xa57Cb177Beebc35A1A26A286951a306d9B752524";
const INFRARED_TRIFECTA_TOKENS_0 = [OHM, HONEY];
const INFRARED_TRIFECTA_REWARDS_0 = [OHM];
const INFRARED_TRIFECTA_SYMBOL_0 = "Kodiak Island OHM-HONEY-0.3%";
const INFRARED_TRIFECTA_NAME_0 =
  "Beradrome Infrared Trifecta Kodiak Island OHM-HONEY-0.3%";
const INFRARED_TRIFECTA_PLUGIN_0 = "0x125bd220ac62DBE312D4752FFB57551E9b3c1848";

// Bullas BULL iSH
const BULLAS_PLUGIN = "0xE259A689D13139F413eE693BE27181192319a629";

// Gumball BentoBera
const GUMBALL_PLUGIN_0 = "";

// Contract Variables
let OTOKENFactory, VTOKENFactory, feesFactory, rewarderFactory;
let TOKEN, OTOKEN, VTOKEN, fees, rewarder, governor;
let voter, minter, gaugeFactory, bribeFactory;
let multicall, controller, trifectaMulticall;
let helper;

let beradromePlugin;
let beradromePluginFactory;

let berachainPlugin;
let berachainPluginFactory;

let infraredPlugin;
let infraredPluginFactory;

let berapawPlugin;
let berapawPluginFactory;

let burrBearPlugin;
let burrBearPluginFactory;

let trifectaPlugin;
let trifectaPluginFactory;

let infraredTrifectaPlugin;
let infraredTrifectaPluginFactory;

async function getContracts() {
  OTOKENFactory = await ethers.getContractAt(
    "contracts/OTOKENFactory.sol:OTOKENFactory",
    "0xbBc46f6DBB199c85CCa67aD06C4D4949d09caFc3"
  );
  VTOKENFactory = await ethers.getContractAt(
    "contracts/VTOKENFactory.sol:VTOKENFactory",
    "0xbCDa85b9b140ddBF7C1467BE867E0274c91977E8"
  );
  feesFactory = await ethers.getContractAt(
    "contracts/TOKENFeesFactory.sol:TOKENFeesFactory",
    "0xc831A63931AeF4017A9ecb65099F7eC1D367e414"
  );
  rewarderFactory = await ethers.getContractAt(
    "contracts/VTOKENRewarderFactory.sol:VTOKENRewarderFactory",
    "0x07C2E5EA884c755E374E360BC2815aE28dAbCc38"
  );

  TOKEN = await ethers.getContractAt(
    "contracts/TOKEN.sol:TOKEN",
    "0x7838CEc5B11298Ff6a9513Fa385621B765C74174"
  );
  OTOKEN = await ethers.getContractAt(
    "contracts/OTOKENFactory.sol:OTOKEN",
    await TOKEN.OTOKEN()
  );
  VTOKEN = await ethers.getContractAt(
    "contracts/VTOKENFactory.sol:VTOKEN",
    await TOKEN.VTOKEN()
  );
  fees = await ethers.getContractAt(
    "contracts/TOKENFeesFactory.sol:TOKENFees",
    await TOKEN.FEES()
  );
  rewarder = await ethers.getContractAt(
    "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
    await VTOKEN.rewarder()
  );
  governor = await ethers.getContractAt(
    "contracts/TOKENGovernor.sol:TOKENGovernor",
    "0x8fE450e4B403fA857Cb126E7a603B5eba3Af398a"
  );

  gaugeFactory = await ethers.getContractAt(
    "contracts/GaugeFactory.sol:GaugeFactory",
    "0x8d97b0B334EB5076F2CE66a7B7ffAc1931622022"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0xEB4b7929A5E084b2817Ee0085F9A2B94e2f4F226"
  );
  voter = await ethers.getContractAt(
    "contracts/Voter.sol:Voter",
    "0xd7ea36ECA1cA3E73bC262A6D05DB01E60AE4AD47"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0xe2719e4C3AC97890b2AF3783A3B892c3a6FF041C"
  );

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    "0x6DE64633c9a5beCDde6c5Dc27dfF308F05F56665"
  );
  trifectaMulticall = await ethers.getContractAt(
    "contracts/TrifectaMulticall.sol:TrifectaMulticall",
    "0xA431bA493D5A63Fa77c69284535E105fB98f0472"
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0x65e3249EccD38aD841345dA5beBBebE3a73a596C"
  );
  helper = await ethers.getContractAt(
    "contracts/BeradromeHelper.sol:BeradromeHelper",
    "0x05e970Cf64b44456e019bAaA63361864D55d900E"
  );

  beradromePluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/BeradromePluginFactory.sol:BeradromePluginFactory",
    BERADROME_PLUGIN_FACTORY
  );

  beradromePlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/BeradromePluginFactory.sol:BeradromePlugin",
    BERADROME_PLUGIN_0
  );

  berachainPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/BerachainPluginFactory.sol:BerachainPluginFactory",
    BERACHAIN_PLUGIN_FACTORY
  );

  berachainPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/BerachainPluginFactory.sol:BerachainPlugin",
    BERACHAIN_PLUGIN_0
  );

  infraredPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    INFRARED_PLUGIN_FACTORY
  );

  infraredPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    INFRARED_PLUGIN_0
  );

  berapawPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPluginFactory",
    BERAPAW_PLUGIN_FACTORY
  );

  berapawPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPlugin",
    BERAPAW_PLUGIN_0
  );

  burrBearPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/BurrBearPluginFactory.sol:BurrBearPluginFactory",
    BURRBEAR_PLUGIN_FACTORY
  );

  burrBearPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/BurrBearPluginFactory.sol:BurrBearPlugin",
    BURRBEAR_PLUGIN_0
  );

  trifectaPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
    TRIFECTA_PLUGIN_FACTORY
  );

  trifectaPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
    TRIFECTA_PLUGIN_0
  );

  infraredTrifectaPluginFactory = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredTrifectaPluginFactory.sol:InfraredTrifectaPluginFactory",
    INFRARED_TRIFECTA_PLUGIN_FACTORY
  );

  infraredTrifectaPlugin = await ethers.getContractAt(
    "contracts/plugins/berachain/InfraredTrifectaPluginFactory.sol:InfraredTrifectaPlugin",
    INFRARED_TRIFECTA_PLUGIN_0
  );

  console.log("Contracts Retrieved");
}

async function deployOTOKENFactory() {
  console.log("Starting OTOKENFactory Deployment");
  const OTOKENFactoryArtifact = await ethers.getContractFactory(
    "OTOKENFactory"
  );
  const OTOKENFactoryContract = await OTOKENFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  OTOKENFactory = await OTOKENFactoryContract.deployed();
  await sleep(5000);
  console.log("OTOKENFactory Deployed at:", OTOKENFactory.address);
}

async function deployVTOKENFactory() {
  console.log("Starting VTOKENFactory Deployment");
  const VTOKENFactoryArtifact = await ethers.getContractFactory(
    "VTOKENFactory"
  );
  const VTOKENFactoryContract = await VTOKENFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  VTOKENFactory = await VTOKENFactoryContract.deployed();
  await sleep(5000);
  console.log("VTOKENFactory Deployed at:", VTOKENFactory.address);
}

async function deployFeesFactory() {
  console.log("Starting FeesFactory Deployment");
  const feesFactoryArtifact = await ethers.getContractFactory(
    "TOKENFeesFactory"
  );
  const feesFactoryContract = await feesFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  feesFactory = await feesFactoryContract.deployed();
  await sleep(5000);
  console.log("FeesFactory Deployed at:", feesFactory.address);
}

async function deployRewarderFactory() {
  console.log("Starting RewarderFactory Deployment");
  const rewarderFactoryArtifact = await ethers.getContractFactory(
    "VTOKENRewarderFactory"
  );
  const rewarderFactoryContract = await rewarderFactoryArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  rewarderFactory = await rewarderFactoryContract.deployed();
  await sleep(5000);
  console.log("RewarderFactory Deployed at:", rewarderFactory.address);
}

async function printFactoryAddresses() {
  console.log("**************************************************************");
  console.log("OTOKENFactory: ", OTOKENFactory.address);
  console.log("VTOKENFactory: ", VTOKENFactory.address);
  console.log("FeesFactory: ", feesFactory.address);
  console.log("RewarderFactory: ", rewarderFactory.address);
  console.log("**************************************************************");
}

async function deployTOKEN() {
  console.log("Starting TOKEN Deployment");
  const TOKENArtifact = await ethers.getContractFactory("TOKEN");
  const TOKENContract = await TOKENArtifact.deploy(
    BASE_ADDRESS,
    convert(MARKET_RESERVES, 18),
    OTOKENFactory.address,
    VTOKENFactory.address,
    rewarderFactory.address,
    feesFactory.address,
    VAULT_FACTORY,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  TOKEN = await TOKENContract.deployed();
  await sleep(5000);
  console.log("TOKEN Deployed at:", TOKEN.address);
}

async function deployGovernor() {
  console.log("Starting Governor Deployment");
  const governorArtifact = await ethers.getContractFactory("TOKENGovernor");
  const governorContract = await governorArtifact.deploy(VTOKEN.address, {
    gasPrice: ethers.gasPrice,
  });
  governor = await governorContract.deployed();
  await sleep(5000);
  console.log("Governor Deployed at:", governor.address);
}

async function printTokenAddresses() {
  console.log("**************************************************************");
  console.log("BERO: ", TOKEN.address);
  console.log("oBERO: ", OTOKEN.address);
  console.log("hiBERO: ", VTOKEN.address);
  console.log("Fees: ", fees.address);
  console.log("Rewarder: ", rewarder.address);
  console.log("Governor: ", governor.address);
  console.log("**************************************************************");
}

async function verifyTOKEN() {
  console.log("Starting TOKEN Verification");
  await hre.run("verify:verify", {
    address: TOKEN.address,
    contract: "contracts/TOKEN.sol:TOKEN",
    constructorArguments: [
      BASE_ADDRESS,
      convert(MARKET_RESERVES, 18),
      OTOKENFactory.address,
      VTOKENFactory.address,
      rewarderFactory.address,
      feesFactory.address,
      VAULT_FACTORY,
    ],
  });
  console.log("TOKEN Verified");
}

async function verifyOTOKEN(wallet) {
  console.log("Starting OTOKEN Verification");
  await hre.run("verify:verify", {
    address: OTOKEN.address,
    contract: "contracts/OTOKENFactory.sol:OTOKEN",
    constructorArguments: [wallet.address],
  });
  console.log("OTOKEN Verified");
}

async function verifyVTOKEN() {
  console.log("Starting VTOKEN Verification");
  await hre.run("verify:verify", {
    address: VTOKEN.address,
    contract: "contracts/VTOKENFactory.sol:VTOKEN",
    constructorArguments: [
      TOKEN.address,
      OTOKEN.address,
      rewarderFactory.address,
      VAULT_FACTORY,
    ],
  });
  console.log("VTOKEN Verified");
}

async function verifyFees() {
  console.log("TOKENFees Deployed at:", fees.address);
  console.log("Starting TOKENFees Verification");
  await hre.run("verify:verify", {
    address: await fees.address,
    contract: "contracts/TOKENFeesFactory.sol:TOKENFees",
    constructorArguments: [
      rewarder.address,
      TOKEN.address,
      BASE_ADDRESS,
      OTOKEN.address,
    ],
  });
  console.log("TOKENFees Verified");
}

async function verifyRewarder() {
  console.log("Rewarder Deployed at:", rewarder.address);
  console.log("Starting Rewarder Verification");
  await hre.run("verify:verify", {
    address: rewarder.address,
    contract: "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
    constructorArguments: [VTOKEN.address],
  });
  console.log("Rewarder Verified");
}

async function verifyGovernor() {
  console.log("Starting Governor Verification");
  await hre.run("verify:verify", {
    address: governor.address,
    contract: "contracts/TOKENGovernor.sol:TOKENGovernor",
    constructorArguments: [VTOKEN.address],
  });
  console.log("Governor Verified");
}

async function deployGaugeFactory(wallet) {
  console.log("Starting GaugeFactory Deployment");
  const gaugeFactoryArtifact = await ethers.getContractFactory("GaugeFactory");
  const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(wallet, {
    gasPrice: ethers.gasPrice,
  });
  gaugeFactory = await gaugeFactoryContract.deployed();
  await sleep(5000);
  console.log("GaugeFactory Deployed at:", gaugeFactory.address);
}

async function deployBribeFactory(wallet) {
  console.log("Starting BribeFactory Deployment");
  const bribeFactoryArtifact = await ethers.getContractFactory("BribeFactory");
  const bribeFactoryContract = await bribeFactoryArtifact.deploy(wallet, {
    gasPrice: ethers.gasPrice,
  });
  bribeFactory = await bribeFactoryContract.deployed();
  await sleep(5000);
  console.log("BribeFactory Deployed at:", bribeFactory.address);
}

async function deployVoter() {
  console.log("Starting Voter Deployment");
  const voterArtifact = await ethers.getContractFactory("Voter");
  const voterContract = await voterArtifact.deploy(
    VTOKEN.address,
    gaugeFactory.address,
    bribeFactory.address,
    { gasPrice: ethers.gasPrice }
  );
  voter = await voterContract.deployed();
  await sleep(5000);
  console.log("Voter Deployed at:", voter.address);
}

async function deployMinter() {
  console.log("Starting Minter Deployment");
  const minterArtifact = await ethers.getContractFactory("Minter");
  const minterContract = await minterArtifact.deploy(
    voter.address,
    TOKEN.address,
    VTOKEN.address,
    OTOKEN.address,
    { gasPrice: ethers.gasPrice }
  );
  minter = await minterContract.deployed();
  await sleep(5000);
  console.log("Minter Deployed at:", minter.address);
}

async function printVotingAddresses() {
  console.log("**************************************************************");
  console.log("GaugeFactory: ", gaugeFactory.address);
  console.log("BribeFactory: ", bribeFactory.address);
  console.log("Voter: ", voter.address);
  console.log("Minter: ", minter.address);
  console.log("**************************************************************");
}

async function verifyGaugeFactory(wallet) {
  console.log("Starting GaugeFactory Verification");
  await hre.run("verify:verify", {
    address: gaugeFactory.address,
    contract: "contracts/GaugeFactory.sol:GaugeFactory",
    constructorArguments: [wallet],
  });
  console.log("GaugeFactory Verified");
}

async function verifyBribeFactory(wallet) {
  console.log("Starting BribeFactory Verification");
  await hre.run("verify:verify", {
    address: bribeFactory.address,
    contract: "contracts/BribeFactory.sol:BribeFactory",
    constructorArguments: [wallet],
  });
  console.log("BribeFactory Verified");
}

async function verifyVoter() {
  console.log("Starting Voter Verification");
  await hre.run("verify:verify", {
    address: voter.address,
    contract: "contracts/Voter.sol:Voter",
    constructorArguments: [
      VTOKEN.address,
      gaugeFactory.address,
      bribeFactory.address,
    ],
  });
  console.log("Voter Verified");
}

async function verifyMinter() {
  console.log("Starting Minter Verification");
  await hre.run("verify:verify", {
    address: minter.address,
    contract: "contracts/Minter.sol:Minter",
    constructorArguments: [
      voter.address,
      TOKEN.address,
      VTOKEN.address,
      OTOKEN.address,
    ],
  });
  console.log("Minter Verified");
}

async function deployMulticall() {
  console.log("Starting Multicall Deployment");
  const multicallArtifact = await ethers.getContractFactory("Multicall");
  const multicallContract = await multicallArtifact.deploy(
    voter.address,
    BASE_ADDRESS,
    TOKEN.address,
    OTOKEN.address,
    VTOKEN.address,
    rewarder.address,
    { gasPrice: ethers.gasPrice }
  );
  multicall = await multicallContract.deployed();
  await sleep(5000);
  console.log("Multicall Deployed at:", multicall.address);
}

async function deployTrifectaMulticall() {
  console.log("Starting TrifectaMulticall Deployment");
  const trifectaMulticallArtifact = await ethers.getContractFactory(
    "TrifectaMulticall"
  );
  const trifectaMulticallContract = await trifectaMulticallArtifact.deploy(
    voter.address,
    { gasPrice: ethers.gasPrice }
  );
  trifectaMulticall = await trifectaMulticallContract.deployed();
  await sleep(5000);
  console.log("TrifectaMulticall Deployed at:", trifectaMulticall.address);
}

async function deployController() {
  console.log("Starting Controller Deployment");
  const controllerArtifact = await ethers.getContractFactory("Controller");
  const controllerContract = await controllerArtifact.deploy(
    voter.address,
    fees.address,
    { gasPrice: ethers.gasPrice }
  );
  controller = await controllerContract.deployed();
  await sleep(5000);
  console.log("Controller Deployed at:", controller.address);
}

async function printAncillaryAddresses() {
  console.log("**************************************************************");
  console.log("Multicall: ", multicall.address);
  console.log("TrifectaMulticall: ", trifectaMulticall.address);
  console.log("Controller: ", controller.address);
  console.log("**************************************************************");
}

async function verifyMulticall() {
  console.log("Starting Multicall Verification");
  await hre.run("verify:verify", {
    address: multicall.address,
    contract: "contracts/Multicall.sol:Multicall",
    constructorArguments: [
      voter.address,
      BASE_ADDRESS,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
    ],
  });
  console.log("Multicall Verified");
}

async function verifyTrifectaMulticall() {
  console.log("Starting TrifectaMulticall Verification");
  await hre.run("verify:verify", {
    address: trifectaMulticall.address,
    contract: "contracts/TrifectaMulticall.sol:TrifectaMulticall",
    constructorArguments: [voter.address],
  });
  console.log("TrifectaMulticall Verified");
}

async function verifyController() {
  console.log("Starting Controller Verification");
  await hre.run("verify:verify", {
    address: controller.address,
    contract: "contracts/Controller.sol:Controller",
    constructorArguments: [voter.address, fees.address],
  });
  console.log("Controller Verified");
}

async function setUpSystem(wallet) {
  console.log("Starting System Set Up");

  // await OTOKEN.approve(VTOKEN.address, convert("200000", 18));
  // await VTOKEN.burnFor(BUILDER_ADDRESS, convert("200000", 18));
  // console.log("OTOKEN burned for builder");

  // amount = await OTOKEN.balanceOf(wallet);
  // await OTOKEN.transfer(MULTISIG, amount);
  // console.log("OTOKEN Allocated");

  // await sleep(5000);
  // await gaugeFactory.setVoter(voter.address);
  // await sleep(5000);
  // await bribeFactory.setVoter(voter.address);
  // await sleep(5000);
  // console.log("Factories Set Up");

  // await VTOKEN.addReward(TOKEN.address);
  // await sleep(5000);
  // await VTOKEN.addReward(OTOKEN.address);
  // await sleep(5000);
  // await VTOKEN.addReward(BASE_ADDRESS);
  // await sleep(5000);
  // console.log("VTOKEN Rewards Set Up");

  // await VTOKEN.setVoter(voter.address);
  // await sleep(5000);
  // console.log("Token-Voting Set Up");
  // await OTOKEN.setMinter(minter.address);
  // await sleep(5000);
  // console.log("Token-Voting Set Up");

  // await voter.initialize(minter.address);
  // await sleep(5000);
  // await minter.initialize();
  // await sleep(5000);
  // console.log("Minter Set Up");

  console.log("System Initialized");
}

async function transferOwnership() {
  await minter.setTeam(MULTISIG);
  await sleep(5000);
  console.log("Minter team set to MULTISIG");

  await minter.transferOwnership(MULTISIG);
  //   await minter.transferOwnership(governor.address);
  await sleep(5000);
  console.log("Minter ownership transferred to governor");

  await voter.transferOwnership(MULTISIG);
  //   await voter.transferOwnership(governor.address);
  await sleep(5000);
  console.log("Voter ownership transferred to governor");

  await VTOKEN.transferOwnership(MULTISIG);
  //   await VTOKEN.transferOwnership(governor.address);
  await sleep(5000);
  console.log("VTOKEN ownership transferred to governor");
}

async function verifyGauge(pluginAddress, gaugeAddress) {
  console.log("Starting Gauge Verification");
  await hre.run("verify:verify", {
    address: gaugeAddress,
    contract: "contracts/GaugeFactory.sol:Gauge",
    constructorArguments: [voter.address, pluginAddress],
  });
  console.log("Gauge Verified");
}

async function verifyBribe(bribeAddress) {
  console.log("Starting Bribe Verification");
  await hre.run("verify:verify", {
    address: bribeAddress,
    contract: "contracts/BribeFactory.sol:Bribe",
    constructorArguments: [voter.address],
  });
  console.log("Bribe Verified");
}

async function deployBerachainPluginFactory() {
  console.log("Starting BerachainPluginFactory Deployment");
  const berachainPluginFactoryArtifact = await ethers.getContractFactory(
    "BerachainPluginFactory"
  );
  const berachainPluginFactoryContract =
    await berachainPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  berachainPluginFactory = await berachainPluginFactoryContract.deployed();
  console.log(
    "BerachainPluginFactory Deployed at:",
    berachainPluginFactory.address
  );
}

async function verifyBerachainPluginFactory() {
  console.log("Starting BerachainPluginFactory Verification");
  await hre.run("verify:verify", {
    address: berachainPluginFactory.address,
    contract:
      "contracts/plugins/berachain/BerachainPluginFactory.sol:BerachainPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("BerachainPluginFactory Verified");
}

async function deployBerachainPlugin() {
  console.log("Starting BerachainPlugin Deployment");
  await berachainPluginFactory.createPlugin(
    BERACHAIN_TOKEN_4,
    BERACHAIN_TOKENS_4,
    BERACHAIN_SYMBOL_4,
    BERACHAIN_NAME_4,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "BerachainPlugin Deployed at:",
    await berachainPluginFactory.last_plugin()
  );
}

async function verifyBerachainPlugin() {
  console.log("Starting BerachainPlugin Verification");
  await hre.run("verify:verify", {
    address: berachainPlugin.address,
    contract:
      "contracts/plugins/berachain/BerachainPluginFactory.sol:BerachainPlugin",
    constructorArguments: [
      BERACHAIN_TOKEN_0,
      voter.address,
      BERACHAIN_TOKENS_0,
      [WBERA],
      VAULT_FACTORY,
      "0xC2BaA8443cDA8EBE51a640905A8E6bc4e1f9872c",
      "Berachain",
      BERACHAIN_SYMBOL_0,
      BERACHAIN_NAME_0,
    ],
  });
  console.log("BerachainPlugin Verified");
}

async function deployInfraredPluginFactory() {
  console.log("Starting InfraredPluginFactory Deployment");
  const infraredPluginFactoryArtifact = await ethers.getContractFactory(
    "InfraredPluginFactory"
  );
  const infraredPluginFactoryContract =
    await infraredPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  infraredPluginFactory = await infraredPluginFactoryContract.deployed();
  console.log(
    "InfraredPluginFactory Deployed at:",
    infraredPluginFactory.address
  );
}

async function verifyInfraredPluginFactory() {
  console.log("Starting InfraredPluginFactory Verification");
  await hre.run("verify:verify", {
    address: infraredPluginFactory.address,
    contract:
      "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("InfraredPluginFactory Verified");
}

async function deployInfraredPlugin() {
  console.log("Starting InfraredPlugin Deployment");
  await infraredPluginFactory.createPlugin(
    INFRARED_VAULT_6,
    INFRARED_TOKENS_6,
    INFRARED_REWARDS_6,
    INFRARED_SYMBOL_6,
    INFRARED_NAME_6,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "InfraredPlugin Deployed at:",
    await infraredPluginFactory.last_plugin()
  );
}

async function verifyInfraredPlugin() {
  console.log("Starting InfraredPlugin Verification");
  await hre.run("verify:verify", {
    address: infraredPlugin.address,
    contract:
      "contracts/plugins/berachain/InfraredPluginFactory.sol:InfraredPlugin",
    constructorArguments: [
      "0x2c4a603A2aA5596287A06886862dc29d56DbC354",
      voter.address,
      INFRARED_TOKENS_0,
      INFRARED_REWARDS_0,
      VAULT_FACTORY,
      INFRARED_VAULT_0,
      "Infrared",
      INFRARED_SYMBOL_0,
      INFRARED_NAME_0,
    ],
  });
  console.log("InfraredPlugin Verified");
}

async function deployTrifectaPluginFactory() {
  console.log("Starting TrifectaPluginFactory Deployment");
  const trifectaPluginFactoryArtifact = await ethers.getContractFactory(
    "TrifectaPluginFactory"
  );
  const trifectaPluginFactoryContract =
    await trifectaPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  trifectaPluginFactory = await trifectaPluginFactoryContract.deployed();
  console.log(
    "TrifectaPluginFactory Deployed at:",
    trifectaPluginFactory.address
  );
}

async function verifyTrifectaPluginFactory() {
  console.log("Starting TrifectaPluginFactory Verification");
  await hre.run("verify:verify", {
    address: trifectaPluginFactory.address,
    contract:
      "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("TrifectaPluginFactory Verified");
}

async function deployTrifectaPlugin() {
  console.log("Starting TrifectaPlugin Deployment");
  await trifectaPluginFactory.createPlugin(
    TRIFECTA_TOKEN_2,
    TRIFECTA_FARM_2,
    TRIFECTA_TOKEN0_2,
    TRIFECTA_TOKEN1_2,
    TRIFECTA_OTHER_REWARDS_2,
    TRIFECTA_SYMBOL_2,
    TRIFECTA_NAME_2
  );
  await sleep(10000);
  console.log(
    "TrifectaPlugin Deployed at:",
    await trifectaPluginFactory.last_plugin()
  );
}

async function verifyTrifectaPlugin() {
  console.log("Starting TrifectaPlugin Verification");
  await hre.run("verify:verify", {
    address: trifectaPlugin.address,
    contract:
      "contracts/plugins/berachain/TrifectaPluginFactory.sol:TrifectaPlugin",
    constructorArguments: [
      TRIFECTA_TOKEN_0,
      voter.address,
      await trifectaPlugin.getAssetTokens(),
      await trifectaPlugin.getBribeTokens(),
      VAULT_FACTORY,
      TRIFECTA_FARM_0,
      "Liquidity Trifecta",
      TRIFECTA_SYMBOL_0,
      TRIFECTA_NAME_0,
    ],
  });
}

async function deployBeraPawPluginFactory() {
  console.log("Starting BeraPawPluginFactory Deployment");
  const berapawPluginFactoryArtifact = await ethers.getContractFactory(
    "BeraPawPluginFactory"
  );
  const berapawPluginFactoryContract =
    await berapawPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  berapawPluginFactory = await berapawPluginFactoryContract.deployed();
  console.log(
    "BeraPawPluginFactory Deployed at:",
    berapawPluginFactory.address
  );
}

async function verifyBeraPawPluginFactory() {
  console.log("Starting BeraPawPluginFactory Verification");
  await hre.run("verify:verify", {
    address: berapawPluginFactory.address,
    contract:
      "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("BeraPawPluginFactory Verified");
}

async function deployBeraPawPlugin() {
  console.log("Starting BeraPawPlugin Deployment");
  await berapawPluginFactory.createPlugin(
    BERAPAW_TOKEN_4,
    BERAPAW_TOKENS_4,
    BERAPAW_SYMBOL_4,
    BERAPAW_NAME_4,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "BeraPawPlugin Deployed at:",
    await berapawPluginFactory.last_plugin()
  );
}

async function verifyBeraPawPlugin() {
  console.log("Starting BeraPawPlugin Verification");
  await hre.run("verify:verify", {
    address: berapawPlugin.address,
    contract:
      "contracts/plugins/berachain/BeraPawPluginFactory.sol:BeraPawPlugin",
    constructorArguments: [
      BERAPAW_TOKEN_0,
      voter.address,
      BERAPAW_TOKENS_0,
      [LBGT],
      VAULT_FACTORY,
      "0xC2BaA8443cDA8EBE51a640905A8E6bc4e1f9872c",
      "BeraPaw",
      BERAPAW_SYMBOL_0,
      BERAPAW_NAME_0,
    ],
  });
  console.log("BeraPawPlugin Verified");
}

async function deployBeradromePluginFactory() {
  console.log("Starting BeradromePluginFactory Deployment");
  const beradromePluginFactoryArtifact = await ethers.getContractFactory(
    "BeradromePluginFactory"
  );
  const beradromePluginFactoryContract =
    await beradromePluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  beradromePluginFactory = await beradromePluginFactoryContract.deployed();
  console.log(
    "BeradromePluginFactory Deployed at:",
    beradromePluginFactory.address
  );
}

async function verifyBeradromePluginFactory() {
  console.log("Starting BeradromePluginFactory Verification");
  await hre.run("verify:verify", {
    address: beradromePluginFactory.address,
    contract:
      "contracts/plugins/berachain/BeradromePluginFactory.sol:BeradromePluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("BeradromePluginFactory Verified");
}

async function deployBeradromePlugin() {
  console.log("Starting BeradromePlugin Deployment");
  await beradromePluginFactory.createPlugin(
    BERADROME_TOKEN_4,
    BERADROME_TOKENS_4,
    BERADROME_REWARDS_4,
    BERADROME_SYMBOL_4,
    BERADROME_NAME_4,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "BeradromePlugin Deployed at ",
    await beradromePluginFactory.last_plugin()
  );
}

async function verifyBeradromePlugin() {
  console.log("Starting BeradromePlugin Verification");
  await hre.run("verify:verify", {
    address: beradromePlugin.address,
    contract:
      "contracts/plugins/berachain/BeradromePluginFactory.sol:BeradromePlugin",
    constructorArguments: [
      BERADROME_TOKEN_0,
      voter.address,
      BERADROME_TOKENS_0,
      BERADROME_REWARDS_0,
      VAULT_FACTORY,
      "Beradrome",
      BERADROME_SYMBOL_0,
      BERADROME_NAME_0,
    ],
  });
  console.log("BeradromePlugin Verified");
}

async function deployInfraredTrifectaPluginFactory() {
  console.log("Starting InfraredTrifectaPluginFactory Deployment");
  const infraredTrifectaPluginFactoryArtifact = await ethers.getContractFactory(
    "InfraredTrifectaPluginFactory"
  );
  const infraredTrifectaPluginFactoryContract =
    await infraredTrifectaPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  infraredTrifectaPluginFactory =
    await infraredTrifectaPluginFactoryContract.deployed();
  console.log(
    "InfraredTrifectaPluginFactory Deployed at:",
    infraredTrifectaPluginFactory.address
  );
}

async function verifyInfraredTrifectaPluginFactory() {
  console.log("Starting InfraredTrifectaPluginFactory Verification");
  await hre.run("verify:verify", {
    address: infraredTrifectaPluginFactory.address,
    contract:
      "contracts/plugins/berachain/InfraredTrifectaPluginFactory.sol:InfraredTrifectaPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("InfraredTrifectaPluginFactory Verified");
}

async function deployInfraredTrifectaPlugin() {
  console.log("Starting InfraredTrifectaPlugin Deployment");
  await infraredTrifectaPluginFactory.createPlugin(
    INFRARED_TRIFECTA_VAULT_0,
    INFRARED_TRIFECTA_TOKENS_0,
    INFRARED_TRIFECTA_REWARDS_0,
    INFRARED_TRIFECTA_SYMBOL_0,
    INFRARED_TRIFECTA_NAME_0,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "InfraredTrifectaPlugin Deployed at:",
    await infraredTrifectaPluginFactory.last_plugin()
  );
}

async function verifyInfraredTrifectaPlugin() {
  console.log("Starting InfraredTrifectaPlugin Verification");
  await hre.run("verify:verify", {
    address: infraredTrifectaPlugin.address,
    contract:
      "contracts/plugins/berachain/InfraredTrifectaPluginFactory.sol:InfraredTrifectaPlugin",
    constructorArguments: [
      "0x98bdeede9a45c28d229285d9d6e9139e9f505391",
      voter.address,
      INFRARED_TRIFECTA_TOKENS_0,
      INFRARED_TRIFECTA_REWARDS_0,
      VAULT_FACTORY,
      INFRARED_TRIFECTA_VAULT_0,
      "Infrared Trifecta",
      INFRARED_TRIFECTA_SYMBOL_0,
      INFRARED_TRIFECTA_NAME_0,
    ],
  });
  console.log("InfraredTrifectaPlugin Verified");
}

async function deployBurrBearPluginFactory() {
  console.log("Starting BurrBearPluginFactory Deployment");
  const burrBearPluginFactoryArtifact = await ethers.getContractFactory(
    "BurrBearPluginFactory"
  );
  const burrBearPluginFactoryContract =
    await burrBearPluginFactoryArtifact.deploy(voter.address, {
      gasPrice: ethers.gasPrice,
    });
  burrBearPluginFactory = await burrBearPluginFactoryContract.deployed();
  console.log(
    "BurrBearPluginFactory Deployed at:",
    burrBearPluginFactory.address
  );
}

async function verifyBurrBearPluginFactory() {
  console.log("Starting BurrBearPluginFactory Verification");
  await hre.run("verify:verify", {
    address: burrBearPluginFactory.address,
    contract:
      "contracts/plugins/berachain/BurrBearPluginFactory.sol:BurrBearPluginFactory",
    constructorArguments: [voter.address],
  });
  console.log("BurrBearPluginFactory Verified");
}

async function deployBurrBearPlugin() {
  console.log("Starting BurrBearPlugin Deployment");
  await burrBearPluginFactory.createPlugin(
    BURRBEAR_PID_2,
    BURRBEAR_TOKENS_2,
    BURRBEAR_SYMBOL_2,
    BURRBEAR_NAME_2,
    { gasPrice: ethers.gasPrice }
  );
  await sleep(10000);
  console.log(
    "BurrBearPlugin Deployed at:",
    await burrBearPluginFactory.last_plugin()
  );
}

async function verifyBurrBearPlugin() {
  console.log("Starting BurrBearPlugin Verification");
  await hre.run("verify:verify", {
    address: burrBearPlugin.address,
    contract:
      "contracts/plugins/berachain/BurrBearPluginFactory.sol:BurrBearPlugin",
    constructorArguments: [
      "0xD10E65A5F8cA6f835F2B1832e37cF150fb955f23",
      voter.address,
      BURRBEAR_TOKENS_0,
      [WBERA],
      VAULT_FACTORY,
      BURRBEAR_PID_0,
      "BurrBear",
      BURRBEAR_SYMBOL_0,
      BURRBEAR_NAME_0,
    ],
  });
  console.log("BurrBearPlugin Verified");
}

async function deployBeradromeHelper() {
  console.log("Starting BeradromeHelper Deployment");
  const helperArtifact = await ethers.getContractFactory("BeradromeHelper");
  const helperContract = await helperArtifact.deploy({
    gasPrice: ethers.gasPrice,
  });
  helper = await helperContract.deployed();
  console.log("BeradromeHelper Deployed at:", helper.address);
}

async function verifyBeradromeHelper() {
  console.log("Starting BeradromeHelper Verification");
  await hre.run("verify:verify", {
    address: helper.address,
    contract: "contracts/BeradromeHelper.sol:BeradromeHelper",
  });
  console.log("BeradromeHelper Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 1. Deploy Token Factories
  //===================================================================

  // console.log("Starting Factory Deployment");
  // await deployOTOKENFactory();
  // await deployVTOKENFactory();
  // await deployFeesFactory();
  // await deployRewarderFactory();
  // await printFactoryAddresses();

  //===================================================================
  // 2. Deploy Token
  //===================================================================

  // console.log("Starting Token Deployment");
  // await deployTOKEN();
  // await deployGovernor();
  // await printTokenAddresses();

  //===================================================================
  // 3. Verify Token
  //===================================================================

  // console.log("Starting Token Verification");
  // await verifyTOKEN();
  // await verifyOTOKEN(wallet);
  // await verifyVTOKEN();
  // await verifyFees();
  // await verifyRewarder();
  // await verifyGovernor();
  // console.log("Token Verified");

  //===================================================================
  // 3. Deploy Voting System
  //===================================================================

  // console.log("Starting Voting Deployment");
  // await deployGaugeFactory(wallet.address);
  // await deployBribeFactory(wallet.address);
  // await deployVoter();
  // await deployMinter();
  // await printVotingAddresses();

  //===================================================================
  // 6. Verify Voting Contracts
  //===================================================================

  // console.log("Starting Voting Verification");
  // await verifyGaugeFactory(wallet.address);
  // await verifyBribeFactory(wallet.address);
  // await verifyVoter();
  // await verifyMinter();
  // console.log("Voting Contracts Verified");

  //===================================================================
  // 4. Deploy Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Deployment");
  // await deployMulticall();
  // await deployTrifectaMulticall();
  // await deployController();
  // await printAncillaryAddresses();

  //===================================================================
  // 7. Verify Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Verification");
  // await verifyMulticall();
  // await verifyTrifectaMulticall();
  // await verifyController();
  // console.log("Ancillary Contracts Verified");

  //===================================================================
  // 8. Set Up System
  //===================================================================

  // console.log("Starting System Set Up");
  // await setUpSystem(wallet.address);
  // console.log("System Set Up");

  //===================================================================
  // 9. Transfer Ownership
  //===================================================================

  // console.log("Starting Ownership Transfer");
  // await transferOwnership();
  // console.log("Ownership Transferred");

  //===================================================================
  // 9. Print Deployment
  //===================================================================

  // console.log("Beradrome Mainnet Deployment");
  // console.log();
  // await printTokenAddresses();
  // console.log();
  // await printVotingAddresses();
  // console.log();
  // await printAncillaryAddresses();
  // console.log();

  //===================================================================
  // 11. Deploy Berachain Plugin Factory
  //===================================================================

  // console.log("Starting StationPlugin Deployment");
  // await deployBerachainPluginFactory();
  // await verifyBerachainPluginFactory();
  // console.log("BerachainPlugin Deployed and Verified");

  //===================================================================
  // 12. Deploy Berachain Plugin
  //===================================================================

  // console.log("Starting BerachainPlugin Deployment");
  // await deployBerachainPlugin();
  // await verifyBerachainPlugin();
  // console.log("BerachainPlugin Deployed and Verified");

  //===================================================================
  // 13. Deploy Infrared Plugin Factory
  //===================================================================

  // console.log("Starting InfraredPluginFactory Deployment");
  // await deployInfraredPluginFactory();
  // await verifyInfraredPluginFactory();
  // console.log("InfraredPluginFactory Deployed and Verified");

  //===================================================================
  // 14. Deploy Infrared Plugin
  //===================================================================

  // console.log("Starting InfraredPlugin Deployment");
  // await deployInfraredPlugin();
  // await verifyInfraredPlugin();
  // console.log("InfraredPlugin Deployed and Verified");

  //===================================================================
  // 19. Deploy BeraPaw Plugin Factory
  //===================================================================

  // console.log("Starting BeraPawPluginFactory Deployment");
  // await deployBeraPawPluginFactory();
  // await verifyBeraPawPluginFactory();
  // console.log("BeraPawPluginFactory Deployed and Verified");

  //===================================================================
  // 20. Deploy BeraPaw Plugin
  //===================================================================

  // console.log("Starting BeraPawPlugin Deployment");
  // await deployBeraPawPlugin();
  // await verifyBeraPawPlugin();
  // console.log("BeraPawPlugin Deployed and Verified");

  //===================================================================
  // 21. Deploy BurrBear Plugin Factory
  //===================================================================

  // console.log("Starting BurrBearPluginFactory Deployment");
  // await deployBurrBearPluginFactory();
  // await verifyBurrBearPluginFactory();
  // console.log("BurrBearPluginFactory Deployed and Verified");

  //===================================================================
  // 22. Deploy BurrBear Plugin
  //===================================================================

  // console.log("Starting BurrBearPlugin Deployment");
  // await deployBurrBearPlugin();
  // await verifyBurrBearPlugin();
  // console.log("BurrBearPlugin Deployed and Verified");

  //===================================================================
  // 17. Deploy Trifecta Plugin Factory
  //===================================================================

  // console.log("Starting TrifectaPluginFactory Deployment");
  // await deployTrifectaPluginFactory();
  // await verifyTrifectaPluginFactory();
  // console.log("TrifectaPluginFactory Deployed and Verified");

  //===================================================================
  // 18. Deploy Trifecta Plugin
  //===================================================================

  // console.log("Starting TrifectaPlugin Deployment");
  // await deployTrifectaPlugin();
  // await verifyTrifectaPlugin();
  // console.log("TrifectaPlugin Deployed and Verified");

  //===================================================================
  // 13. Deploy Beradrome Plugin Factory
  //===================================================================

  // console.log("Starting Beradrome Plugin Factory Deployment");
  // await deployBeradromePluginFactory();
  // await verifyBeradromePluginFactory();
  // console.log("Beradrome Plugin Factory Deployed and Verified");

  //===================================================================
  // 13. Deploy Beradrome Plugin
  //===================================================================

  // console.log("Starting Beradrome Plugin Deployment");
  // await deployBeradromePlugin();
  // await verifyBeradromePlugin();
  // console.log("Beradrome Plugin Deployed and Verified");

  //===================================================================
  // 14. Deploy Infrared Trifecta Plugin Factory
  //===================================================================

  // console.log("Starting Infrared Trifecta Plugin Factory Deployment");
  // await deployInfraredTrifectaPluginFactory();
  // await verifyInfraredTrifectaPluginFactory();
  // console.log("Infrared Trifecta Plugin Factory Deployed and Verified");

  //===================================================================
  // 15. Deploy Infrared Trifecta Plugin
  //===================================================================

  // console.log("Starting Infrared Trifecta Plugin Deployment");
  // await deployInfraredTrifectaPlugin();
  // await verifyInfraredTrifectaPlugin();
  // console.log("Infrared Trifecta Plugin Deployed and Verified");

  //===================================================================
  // 13. Add Gauge Rewards
  //===================================================================

  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(TRIFECTA_PLUGIN_0),
  //   KDK // KDK
  // ); // KDK added to Trifecta YEET-WBERA Island Gauge
  // console.log("- KDK added as gauge reward");

  // await voter.connect(wallet).addGaugeReward(
  //   await voter.gauges(TRIFECTA_PLUGIN_0),
  //   XKDK // xKDK
  // ); // xKDK added to Trifecta YEET-WBERA Island Gauge
  // console.log("- xKDK added as gauge rewards");

  //===================================================================
  // 13. Print Deployment
  //===================================================================

  // console.log("Beradrome Mainnet Deployment");
  // console.log();
  // console.log("voter: ", await voter.address);
  // console.log("gaugeFactory: ", await gaugeFactory.address);
  // console.log("bribeFactory: ", await bribeFactory.address);
  // console.log();
  // console.log("multicall: ", await multicall.address);
  // console.log("trifectaMulticall: ", await trifectaMulticall.address);
  // console.log("controller: ", await controller.address);
  // console.log();
  // console.log("StationPluginFactory: ", await stationPluginFactory.address);
  // console.log("InfraredPluginFactory: ", await infraredPluginFactory.address);
  // console.log("BeraPawPluginFactory: ", await berapawPluginFactory.address);
  // console.log("TrifectaPluginFactory: ", await trifectaPluginFactory.address);
  // console.log();
  // console.log("Reward Vault: ", await VTOKEN.rewardVault());
  // console.log("Vault Token: ", await VTOKEN.vaultToken());

  //===================================================================
  // 13. Print Plugins
  //===================================================================

  // let plugins = [
  // BERADROME_PLUGIN_0,
  // BERADROME_PLUGIN_1,
  // BERACHAIN_PLUGIN_0,
  // BERACHAIN_PLUGIN_1,
  // BERACHAIN_PLUGIN_2,
  // BERACHAIN_PLUGIN_3,
  // BERACHAIN_PLUGIN_4,
  // INFRARED_PLUGIN_0,
  // INFRARED_PLUGIN_1,
  // INFRARED_PLUGIN_2,
  // INFRARED_PLUGIN_3,
  // INFRARED_PLUGIN_4,
  // INFRARED_PLUGIN_5,
  // TRIFECTA_PLUGIN_0,
  // TRIFECTA_PLUGIN_1,
  // INFRARED_TRIFECTA_PLUGIN_0,
  // BULLAS_PLUGIN,
  // BERAPAW_PLUGIN_0,
  // BERAPAW_PLUGIN_1,
  // BERAPAW_PLUGIN_2,
  // BERAPAW_PLUGIN_3,
  // BERAPAW_PLUGIN_4,
  // ];

  // for (let i = 0; i < plugins.length; i++) {
  //   let plugin = await controller.getPlugin(plugins[i]);

  //   console.log("Protocol: ", plugin.protocol);
  //   console.log("Name: ", plugin.name);
  //   console.log("Token: ", plugin.token);
  //   console.log("Plugin: ", plugin.plugin);
  //   console.log("Gauge: ", plugin.gauge);
  //   console.log("Bribe: ", plugin.bribe);
  //   console.log("Vault Token: ", plugin.vaultToken);
  //   console.log("Reward Vault: ", plugin.rewardVault);
  //   console.log();
  // }

  // await verifyGauge(
  //   BERACHAIN_PLUGIN_0,
  //   "0x229FdFf961392cEBB08E93D630E7a6A5614dcC38"
  // );

  // await verifyBribe("0x5DBa62Ae28E2EfBd1f42aC372910F8Df78659Edd");

  //===================================================================
  // 13. Distro
  //===================================================================

  // console.log("Distributing Rewards");

  // await voter.distro();
  // console.log("Gauge Rewards Distributed");

  // await fees.distribute();
  // console.log("Fees Rewards Distributed");

  // await voter.distributeToBribes([
  //   BERACHAIN_PLUGIN_0,
  //   BERACHAIN_PLUGIN_1,
  //   BERACHAIN_PLUGIN_2,
  //   BERACHAIN_PLUGIN_3,
  //   BERACHAIN_PLUGIN_4,
  // ]);
  // console.log("Berachain Bribe Rewards Distributed");

  // await voter.distributeToBribes([
  //   INFRARED_PLUGIN_0,
  //   INFRARED_PLUGIN_1,
  //   INFRARED_PLUGIN_2,
  //   INFRARED_PLUGIN_3,
  //   INFRARED_PLUGIN_4,
  //   INFRARED_PLUGIN_5,
  // ]);
  // console.log("Infrared Bribe Rewards Distributed");

  // await voter.distributeToBribes([
  //   BERAPAW_PLUGIN_0,
  //   BERAPAW_PLUGIN_1,
  //   BERAPAW_PLUGIN_2,
  //   BERAPAW_PLUGIN_3,
  //   BERAPAW_PLUGIN_4,
  // ]);
  // console.log("BeraPaw Bribe Rewards Distributed");

  // await voter.distributeToBribes([
  //   BURRBEAR_PLUGIN_0,
  //   BURRBEAR_PLUGIN_1,
  //   BURRBEAR_PLUGIN_2,
  // ]);
  // console.log("BurrBear Bribe Rewards Distributed");

  // await voter.distributeToBribes([
  //   TRIFECTA_PLUGIN_0,
  //   TRIFECTA_PLUGIN_1,
  //   TRIFECTA_PLUGIN_2, // Kodiak has not whitelisted yet
  // ]);
  // console.log("Liquidity Trifecta Bribe Rewards Distributed");

  // await voter.distributeToBribes([INFRARED_TRIFECTA_PLUGIN_0]);
  // console.log("Infrared Trifecta Bribe Rewards Distributed");

  // await voter.distributeToBribes([BULLAS_PLUGIN]);
  // console.log("Game Bribe Rewards Distributed");

  //===================================================================
  // 14. Remove Plugin
  //===================================================================

  // console.log("Removing Plugin from Voter"); // Remove BULL ISH plugin
  // await voter
  //   .connect(wallet)
  //   .killGauge("0x1a173326c5859CF5A67f6aEB83a9954EfCdBeC3d");
  // console.log("Plugin removed from Voter");

  //===================================================================
  // 13. Add Bribe Rewards
  //===================================================================

  //   await voter
  //     .connect(wallet)
  //     .addBribeReward("0x91316cde390F239CbE039Ab39CbBfED0B86e6742", YEET);
  //   console.log("YEET added as bribe reward");

  // let data = await multicall.bondingCurveData(
  //   "0x34D023ACa5A227789B45A62D377b5B18A680BE01"
  // );
  // console.log(data);

  //===================================================================
  // 14. Deploy Beradrome Helper
  //===================================================================

  // await deployBeradromeHelper();
  // await verifyBeradromeHelper();

  // let plugins = [
  //   BERADROME_PLUGIN_0,
  //   BERADROME_PLUGIN_1,
  //   BERADROME_PLUGIN_2,
  //   BERADROME_PLUGIN_3,
  //   BERADROME_PLUGIN_4,
  //   BERACHAIN_PLUGIN_0,
  //   BERACHAIN_PLUGIN_1,
  //   BERACHAIN_PLUGIN_2,
  //   BERACHAIN_PLUGIN_3,
  //   BERACHAIN_PLUGIN_4,
  //   INFRARED_PLUGIN_0,
  //   INFRARED_PLUGIN_1,
  //   INFRARED_PLUGIN_2,
  //   INFRARED_PLUGIN_3,
  //   INFRARED_PLUGIN_4,
  //   INFRARED_PLUGIN_5,
  //   INFRARED_PLUGIN_6,
  //   TRIFECTA_PLUGIN_0,
  //   TRIFECTA_PLUGIN_1,
  //   TRIFECTA_PLUGIN_2,
  //   INFRARED_TRIFECTA_PLUGIN_0,
  //   BERAPAW_PLUGIN_0,
  //   BERAPAW_PLUGIN_1,
  //   BERAPAW_PLUGIN_2,
  //   BERAPAW_PLUGIN_3,
  //   BERAPAW_PLUGIN_4,
  //   BURRBEAR_PLUGIN_0,
  //   BURRBEAR_PLUGIN_1,
  //   BURRBEAR_PLUGIN_2,
  // ];

  // for (let i = 0; i < plugins.length; i++) {
  //   let res = await controller.connect(wallet).getPlugin(plugins[i]);
  //   console.log("Plugin: ", plugins[i]);
  //   console.log("Underlying Token: ", res.token);
  //   console.log("Vault Token: ", res.vaultToken);
  //   await helper.connect(wallet).setToken(res.vaultToken, res.token);
  //   await sleep(5000);
  //   console.log("Token Set");
  //   console.log();
  // }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
