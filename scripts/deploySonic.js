const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const one = convert("1", 18);
const two = convert("2", 18);
const ten = convert("10", 18);
const oneHundred = convert("100", 18);
const addressZero = "0x0000000000000000000000000000000000000000";

const MARKET_RESERVES = "10000000"; // 10,000,000 TOKEN in market reserves

const MULTISIG = "0x039ec2E90454892fCbA461Ecf8878D0C45FDdFeE"; // Multisig Address

// Contract Variables
let OTOKENFactory, VTOKENFactory, feesFactory, rewarderFactory;
let TOKEN, OTOKEN, VTOKEN, fees, rewarder;
let voter, minter, gaugeFactory, bribeFactory, auctionFactory, rewardAuction;
let multicall, controller, router;
let sale;

let wS, SHADOW, SWPX; // erc20
let stS; // erc4626
let wS_SHADOW_lp; // lp
let wS_SWPX_lp; // erc20
let wS_SWPX_lp_farm; // farm

let erc4626PluginFactory, erc4626Plugin;
let lpPluginFactory, lpPlugin;
let farmPluginFactory, farmPlugin;

async function getContracts() {
  // OTOKENFactory = await ethers.getContractAt(
  //   "contracts/OTOKENFactory.sol:OTOKENFactory",
  //   ""
  // );
  // VTOKENFactory = await ethers.getContractAt(
  //   "contracts/VTOKENFactory.sol:VTOKENFactory",
  //   ""
  // );
  // feesFactory = await ethers.getContractAt(
  //   "contracts/TOKENFeesFactory.sol:TOKENFeesFactory",
  //   ""
  // );
  // rewarderFactory = await ethers.getContractAt(
  //   "contracts/VTOKENRewarderFactory.sol:VTOKENRewarderFactory",
  //   ""
  // );

  // TOKEN = await ethers.getContractAt(
  //   "contracts/TOKEN.sol:TOKEN",
  //   ""
  // );
  // OTOKEN = await ethers.getContractAt(
  //   "contracts/OTOKENFactory.sol:OTOKEN",
  //   await TOKEN.OTOKEN()
  // );
  // VTOKEN = await ethers.getContractAt(
  //   "contracts/VTOKENFactory.sol:VTOKEN",
  //   await TOKEN.VTOKEN()
  // );
  // fees = await ethers.getContractAt(
  //   "contracts/TOKENFeesFactory.sol:TOKENFees",
  //   await TOKEN.FEES()
  // );
  // rewarder = await ethers.getContractAt(
  //   "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
  //   await VTOKEN.rewarder()
  // );

  // gaugeFactory = await ethers.getContractAt(
  //   "contracts/GaugeFactory.sol:GaugeFactory",
  //   ""
  // );
  // bribeFactory = await ethers.getContractAt(
  //   "contracts/BribeFactory.sol:BribeFactory",
  //   ""
  // );
  // voter = await ethers.getContractAt(
  //   "contracts/Voter.sol:Voter",
  //   ""
  // );
  // minter = await ethers.getContractAt(
  //   "contracts/Minter.sol:Minter",
  //   ""
  // );

  // auctionFactory = await ethers.getContractAt(
  //   "contracts/AuctionFactory.sol:AuctionFactory",
  //   ""
  // );
  // rewardAuction = await ethers.getContractAt(
  //   "contracts/AuctionFactory.sol:Auction",
  //   ""
  // );

  // multicall = await ethers.getContractAt(
  //   "contracts/Multicall.sol:Multicall",
  //   ""
  // );
  // controller = await ethers.getContractAt(
  //   "contracts/Controller.sol:Controller",
  //   ""
  // );
  // router = await ethers.getContractAt(
  //   "contracts/Router.sol:Router",
  //   ""
  // );

  sale = await ethers.getContractAt(
    "contracts/Sale.sol:Sale",
    "0x9C751E6825EDAa55007160b99933846f6ECeEc9B"
  );

  // erc4626PluginFactory = await ethers.getContractAt(
  //   "contracts/Plugins/ERC4626PluginFactory.sol:ERC4626PluginFactory",
  //   ""
  // );
  // erc4626Plugin = await ethers.getContractAt(
  //   "contracts/Plugins/ERC4626PluginFactory.sol:ERC4626Plugin",
  //   ""
  // );

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
    wS.address,
    convert(MARKET_RESERVES, 18),
    OTOKENFactory.address,
    VTOKENFactory.address,
    rewarderFactory.address,
    feesFactory.address,
    {
      gasPrice: ethers.gasPrice,
    }
  );
  TOKEN = await TOKENContract.deployed();
  await sleep(5000);
  console.log("TOKEN Deployed at:", TOKEN.address);
}

async function printTokenAddresses() {
  console.log("**************************************************************");
  console.log("SPHERE: ", TOKEN.address);
  console.log("oSPHERE: ", OTOKEN.address);
  console.log("gSPHERE: ", VTOKEN.address);
  console.log("Fees: ", fees.address);
  console.log("Rewarder: ", rewarder.address);
  console.log("**************************************************************");
}

async function verifyTOKEN() {
  console.log("Starting TOKEN Verification");
  await hre.run("verify:verify", {
    address: TOKEN.address,
    contract: "contracts/TOKEN.sol:TOKEN",
    constructorArguments: [
      wS.address,
      convert(MARKET_RESERVES, 18),
      OTOKENFactory.address,
      VTOKENFactory.address,
      rewarderFactory.address,
      feesFactory.address,
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
      wS.address,
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
    wS.address,
    TOKEN.address,
    OTOKEN.address,
    VTOKEN.address,
    rewarder.address,
    rewardAuction.address,
    { gasPrice: ethers.gasPrice }
  );
  multicall = await multicallContract.deployed();
  await sleep(5000);
  console.log("Multicall Deployed at:", multicall.address);
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

async function deployRouter() {
  console.log("Starting Router Deployment");
  const routerArtifact = await ethers.getContractFactory("Router");
  const routerContract = await routerArtifact.deploy(
    voter.address,
    TOKEN.address,
    OTOKEN.address,
    multicall.address,
    rewardAuction.address,
    controller.address
  );
  router = await routerContract.deployed();
  await sleep(5000);
  console.log("Router Deployed at:", router.address);
}

async function verifyRouter() {
  console.log("Starting Router Verification");
  await hre.run("verify:verify", {
    address: router.address,
    contract: "contracts/Router.sol:Router",
    constructorArguments: [
      voter.address,
      TOKEN.address,
      OTOKEN.address,
      multicall.address,
      rewardAuction.address,
      controller.address,
    ],
  });
  console.log("Router Verified");
}

async function printAncillaryAddresses() {
  console.log("**************************************************************");
  console.log("Multicall: ", multicall.address);
  console.log("Controller: ", controller.address);
  console.log("Router: ", router.address);
  console.log("**************************************************************");
}

async function verifyMulticall() {
  console.log("Starting Multicall Verification");
  await hre.run("verify:verify", {
    address: multicall.address,
    contract: "contracts/Multicall.sol:Multicall",
    constructorArguments: [
      voter.address,
      wS.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      rewardAuction.address,
    ],
  });
  console.log("Multicall Verified");
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

  await gaugeFactory.setVoter(voter.address);
  await sleep(5000);
  await bribeFactory.setVoter(voter.address);
  await sleep(5000);
  console.log("Factories Set Up");

  await VTOKEN.addReward(TOKEN.address);
  await sleep(5000);
  await VTOKEN.addReward(OTOKEN.address);
  await sleep(5000);
  await VTOKEN.addReward(wS.address);
  await sleep(5000);
  console.log("VTOKEN Rewards Set Up");

  await VTOKEN.setVoter(voter.address);
  await sleep(5000);
  console.log("Token-Voting Set Up");
  await OTOKEN.setMinter(minter.address);
  await sleep(5000);
  console.log("Token-Voting Set Up");

  await voter.initialize(minter.address);
  await sleep(5000);

  await minter.initialize();
  await sleep(5000);
  // await minter.setVoter(voter.address);
  console.log("Minter Set Up");

  console.log("System Initialized");
}

async function transferOwnership() {
  await minter.setTeam(MULTISIG);
  await sleep(5000);
  console.log("Minter team set to MULTISIG");

  await minter.transferOwnership(MULTISIG);
  await sleep(5000);
  console.log("Minter ownership transferred to MULTISIG");

  await voter.transferOwnership(MULTISIG);
  await sleep(5000);
  console.log("Voter ownership transferred to MULTISIG");

  await VTOKEN.transferOwnership(MULTISIG);
  await sleep(5000);
  console.log("VTOKEN ownership transferred to MULTISIG");
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

async function deployAuctionFactory() {
  console.log("Starting AuctionFactory Deployment");
  const auctionFactoryArtifact = await ethers.getContractFactory(
    "AuctionFactory"
  );
  auctionFactory = await auctionFactoryArtifact.deploy();
  await sleep(5000);
  console.log("AuctionFactory Deployed at:", auctionFactory.address);
}

async function verifyAuctionFactory() {
  console.log("Starting AuctionFactory Verification");
  await hre.run("verify:verify", {
    address: auctionFactory.address,
    contract: "contracts/AuctionFactory.sol:AuctionFactory",
  });
  console.log("AuctionFactory Verified");
}

async function deployRewardAuction() {
  console.log("Starting RewardAuction Deployment");
  await auctionFactory.createAuction(
    oneHundred,
    false,
    TOKEN.address,
    fees.address,
    24 * 3600,
    two,
    ten
  );
  await sleep(5000);
  rewardAuction = await ethers.getContractAt(
    "Auction",
    await auctionFactory.last_auction()
  );
  console.log("RewardAuction Deployed at:", rewardAuction.address);
}

async function verifyRewardAuction() {
  console.log("Starting RewardAuction Verification");
  await hre.run("verify:verify", {
    address: rewardAuction.address,
    contract: "contracts/AuctionFactory.sol:Auction",
    constructorArguments: [
      oneHundred,
      false,
      TOKEN.address,
      fees.address,
      addressZero,
      24 * 3600,
      two,
      ten,
    ],
  });
  console.log("RewardAuction Verified");
}

async function deploySale() {
  console.log("Starting Sale Deployment");
  const saleArtifact = await ethers.getContractFactory("Sale");
  sale = await saleArtifact.deploy();
  await sleep(5000);
  console.log("Sale Deployed at:", sale.address);
}

async function verifySale() {
  console.log("Starting Sale Verification");
  await hre.run("verify:verify", {
    address: sale.address,
    contract: "contracts/Sale.sol:Sale",
  });
}

async function deployERC4626PluginFactory() {
  console.log("Starting ERC4626PluginFactory Deployment");
  const erc4626PluginFactoryArtifact = await ethers.getContractFactory(
    "ERC4626PluginFactory"
  );
  erc4626PluginFactory = await erc4626PluginFactoryArtifact.deploy(
    MULTISIG,
    MULTISIG,
    rewardAuction.address,
    auctionFactory.address
  );
  await sleep(5000);
  console.log(
    "ERC4626PluginFactory Deployed at:",
    erc4626PluginFactory.address
  );
}

async function verifyERC4626PluginFactory() {
  console.log("Starting ERC4626PluginFactory Verification");
  await hre.run("verify:verify", {
    address: erc4626PluginFactory.address,
    contract: "contracts/Plugins/ERC4626PluginFactory.sol:ERC4626PluginFactory",
    constructorArguments: [
      MULTISIG,
      MULTISIG,
      rewardAuction.address,
      auctionFactory.address,
    ],
  });
  console.log("ERC4626PluginFactory Verified");
}

async function deployERC4626Plugin() {
  console.log("Starting ERC4626Plugin Deployment");
  await erc4626PluginFactory.createPlugin(
    "Beets stS",
    voter.address,
    stS.address,
    [wS.address],
    oneHundred,
    2 * 24 * 3600,
    two,
    ten
  );
  await sleep(5000);
  erc4626Plugin = await ethers.getContractAt(
    "ERC4626Plugin",
    await erc4626PluginFactory.lastPlugin()
  );
  console.log("ERC4626Plugin Deployed at:", erc4626Plugin.address);
}

async function verifyERC4626Plugin() {
  console.log("Starting ERC4626Plugin Verification");
  await hre.run("verify:verify", {
    address: erc4626Plugin.address,
    contract: "contracts/Plugins/ERC4626PluginFactory.sol:ERC4626Plugin",
    constructorArguments: [
      "Beets stS",
      voter.address,
      stS.address,
      [wS.address],
    ],
  });
  console.log("ERC4626Plugin Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // Deploy Tokens
  //===================================================================

  // await deployERC20();
  // await verifyERC20();

  // await deployERC4626();
  // await verifyERC4626();

  // await deployLP();
  // await verifyLP();

  // await deployFarm();
  // await verifyFarm();

  // await wS.setWhitelisted(wS_SHADOW_lp.address, true);
  // console.log("wS_SHADOW_lp whitelisted");

  // await wS.setWhitelisted(lpPlugin.address, true);
  // console.log("LP Plugin whitelisted");

  // await wS.setWhitelisted(wS_SWPX_lp_farm.address, true);
  // console.log("wS_SWPX_lp_farm whitelisted");

  //===================================================================
  // Deploy Token Factories
  //===================================================================

  // console.log("Starting Factory Deployment");
  // await deployOTOKENFactory();
  // await deployVTOKENFactory();
  // await deployFeesFactory();
  // await deployRewarderFactory();
  // await printFactoryAddresses();

  //===================================================================
  // Deploy Token
  //===================================================================

  // console.log("Starting Token Deployment");
  // await deployTOKEN();
  // await printTokenAddresses();

  //===================================================================
  // Verify Token
  //===================================================================

  // console.log("Starting Token Verification");
  // await verifyTOKEN();
  // await verifyOTOKEN(wallet);
  // await verifyVTOKEN();
  // await verifyFees();
  // await verifyRewarder();
  // console.log("Token Verified");

  //===================================================================
  // Deploy Voting System
  //===================================================================

  // console.log("Starting Voting Deployment");
  // await deployGaugeFactory(wallet.address);
  // await deployBribeFactory(wallet.address);
  // await deployVoter();
  // await deployMinter();
  // await printVotingAddresses();

  //===================================================================
  // Verify Voting Contracts
  //===================================================================

  // console.log("Starting Voting Verification");
  // await verifyGaugeFactory(wallet.address);
  // await verifyBribeFactory(wallet.address);
  // await verifyVoter();
  // await verifyMinter();
  // console.log("Voting Contracts Verified");

  //===================================================================
  // Deploy Auction Factory
  //===================================================================

  // await deployAuctionFactory();
  // await verifyAuctionFactory();

  // await deployRewardAuction();
  // await verifyRewardAuction();

  //===================================================================
  // Deploy Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Deployment");
  // await deployMulticall();
  // await deployController();
  // await deployRouter();
  // await printAncillaryAddresses();

  //===================================================================
  // Verify Ancillary Contracts
  //===================================================================

  // console.log("Starting Ancillary Verification");
  // await verifyMulticall();
  // await verifyController();
  // await verifyRouter();
  // console.log("Ancillary Contracts Verified");

  //===================================================================
  // Verify Gauge and Bribe
  //===================================================================

  // await verifyGauge(
  //   farmPlugin.address,
  //   "0xC426c984DD1EC880109D719F34C90C8ecF16D7C8"
  // );

  // await verifyBribe("0x8E8dbB69baeafeC597e2B2a4f13166a4fb8C685c");

  //===================================================================
  // Set Up System
  //===================================================================

  // console.log("Starting System Set Up");
  // await setUpSystem(wallet.address);
  // console.log("System Set Up");

  //===================================================================
  // 8. Deploy Sale
  //===================================================================

  // console.log("Starting Sale Deployment");
  // await deploySale();
  // await verifySale();
  // console.log("Sale Deployed");

  //===================================================================
  // Transfer Ownership
  //===================================================================

  // console.log("Starting Ownership Transfer");
  // await transferOwnership();
  // console.log("Ownership Transferred");

  //===================================================================
  // Deploy ERC4626 Plugin Factory
  //===================================================================

  // await deployERC4626PluginFactory();
  // await verifyERC4626PluginFactory();

  // await deployERC4626Plugin();
  // await verifyERC4626Plugin();

  //===================================================================
  // Deploy LP Plugin Factory
  //===================================================================

  // await deployLPPluginFactory();
  // await verifyLPPluginFactory();

  // await deployLPPlugin();
  // await verifyLPPlugin();

  //===================================================================
  // Deploy Farm Plugin Factory
  //===================================================================

  // await deployFarmPluginFactory();
  // await verifyFarmPluginFactory();

  // await deployFarmPlugin();
  // await verifyFarmPlugin();

  //===================================================================
  // Add Plugins to Voter
  //===================================================================

  // await voter.addPlugin(farmPlugin.address);
  // console.log("Farm Plugin Added to Voter");
  // await sleep(5000);
  // await voter.addPlugin(lpPlugin.address);
  // console.log("LP Plugin Added to Voter");
  // await sleep(5000);
  // await voter.addPlugin(erc4626Plugin.address);
  // console.log("ERC4626 Plugin Added to Voter");
  // await sleep(5000);

  //===================================================================
  // Initialize Plugins
  //===================================================================

  // await farmPlugin.initialize();
  // console.log("Farm Plugin Initialized");
  // await sleep(5000);
  // await lpPlugin.initialize();
  // console.log("LP Plugin Initialized");
  // await sleep(5000);
  // await erc4626Plugin.initialize();
  // console.log("ERC4626 Plugin Initialized");
  // await sleep(5000);

  //===================================================================
  // Burn 100 oSPHERE for gSPHERE
  //===================================================================

  // await OTOKEN.approve(VTOKEN.address, oneHundred);
  // await sleep(5000);
  // await VTOKEN.burnFor(wallet.address, oneHundred);
  // console.log("100 oSPHERE burned for gSPHERE");

  //===================================================================
  // Vote for plugins
  //===================================================================

  // await voter.vote(
  //   [farmPlugin.address, lpPlugin.address, erc4626Plugin.address],
  //   [100, 100, 100]
  // );
  // console.log("Plugins Voted for");

  //===================================================================
  // Set bribe split
  //===================================================================

  // await auctionFactory.setSplit(5000);
  // console.log("Bribe split set to 50%");

  //===================================================================
  // Whitelist
  //===================================================================

  // await sale.connect(wallet).whitelist(
  //   [
  // "0x0049447a694d4dfbf679f13a58a66f96c77d67f8",
  // "0x026B4e03bd8594ad51E76819eB7d258a0a616344",
  // "0x02d283be53ec9993ad307865a29ea0a90019c110",
  // "0x030f18ad7dd095e398ac6c8925e403a39f77445a",
  // "0x039ec2e90454892fcba461ecf8878d0c45fddfee",
  // "0x05036afa3898064b7ec4a745b7677cbf1c214017",
  // "0x05a2e50C5E4d724897b67b708db432A38c985f83",
  // "0x0b776552c1aef1dc33005dd25acda22493b6615d",
  // "0x0b9558286935f84d1d64e9305ca036e5150e2f2f",
  // "0x0c9c3ba64072eb566b0e9a4b6bb0d7b204d68469",
  // "0x0ca6cadb6a8ca4199788b9a060c3285fe7b897fd",
  // "0x0fac6899fB1c598cD37Bf993308C255cDE28f7D7",
  // "0x115b65464043e9d0ad7422f95d1398b593c0efd3",
  // "0x11b16cfcf212edd202d202d6afa931f2c97c1800",
  // "0x14fd7d24ebf81196dfd6d3af740d5024071859f8",
  // "0x15bb96a6ad73e09665dcddadb75690034c76c9e1",
  // "0x167d87a906da361a10061fe42bbe89451c2ee584",
  // "0x1682Db339694d5381b5ffD7c80dd19C4c4D30a86",
  // "0x1a96db12ad7f0c9f91c538d16c39c360b5e8fb21",
  // "0x1f0344fB68c616C26cf49F9430B29f95C1BD2376",
  // "0x21783b49198a6f60ab4c35fa0a58e1650a54368e",
  // "0x21c926605259f11425ddf11b201cdb1f4958a20b",
  // "0x21d0360b1A7843C3EC65D1bcfe3555E13503EcF8",
  // "0x2278a9463774fc0b538b7d52087a00405ca9e1ac",
  // "0x2448e87c802521dbcbab63c11137f6f2f1b7e7dd",
  // "0x2853e5f1109fe84967d7de32b51296317eadd9e2",
  // "0x2bfca5af2596fb4fb9b6dbd7b3026d251ad6e3c9",
  // "0x304856144a8cc390cd59c76f7df2dcd8174ba549",
  // "0x30a40961a176e74ff72386fbce5434e755eeaaaf",
  // "0x3125a38881b0ec053fa28a8f912248913cc21cc0",
  // "0x332F93fb7708B950CcE542eC9b3d8baB567AA8C2",
  // "0x34f6ea796d06870db4dd5775d9e665539bc6bba0",
  // "0x3538ae0adbe1d0cf81ae7cf321026299e82d7a41",
  // "0x363085d9ebc20715fc61c3337f293b7940529e1f",
  // "0x3be3A8613dC18554a73773a5Bfb8E9819d360Dc0",
  // "0x3E30bb05e183D388b573ECc6377E9F584D7cfC42",
  // "0x3fb442013f949b58cbf1398f780b46edd384ae9e",
  // "0x4388633200F0da4577a405A10e4c561D0e2E7924",
  // "0x447ab18573542537ec3b584b75b33fa0db202162",
  // "0x47f4e5ca3d84348004a531be3986c850b6e76e08",
  // "0x48b576c87e788a762d6f95a456f2a39113b46950",
  // "0x4a961770fb9b17ff3e8f5a2b55e46160cde671e9",
  // "0x4b9919603170c77936d8ec2c08b604844e861699",
  // "0x4d72d4269ab46962713ca19cab8161a87684a163",
  // "0x50d398268762dd37b5b5acba486b9aedd8f6d8ce",
  // "0x5519afebe88238a1ada6a5c1585f71a8df9934c9",
  // "0x55248d95011767c0c045b8ec161a602e7864cd68",
  // "0x55899fd1140EC8e691B20649f282905203487911",
  // "0x5642430f70f5cb9f9a1cd6b17dd49c1edfa0ebce",
  // "0x56f2c4cb8518d0a4ec749593df574f7597a36140",
  // "0x5baac7ccda079839c9524b90df81720834fc039f",
  // "0x5be66f4095f89bd18abe4ae9d2acd5021ec433bc",
  // "0x5c1de9ce04dc35d8a2d2ab821840319f03a5e291",
  // "0x639b690449678b0185399fe4824ef5c1ee3ad1da",
  // "0x649ca49192D1cBaF8aa3B08ceb73e694061caC28",
  // "0x64f6c557796e0f564d97a3581cdc46c6bfd1ef84",
  // "0x665d613a38553e37c49224c2a9de616a68620356",
  // "0x6668f0641ec53f45a5de7b43ee698c83c7b105b3",
  // "0x693266b4180d90eccd218cef8c16bc90753f6e7b",
  // "0x6c4BecB209a521C631DC2f993c6ccDbFC3Fa671d",
  // "0x6d3be6f009bba2a69febdfeeef9610fd88134c46",
  // "0x6dd2d5cec3fe89ad7976e07dfe4acfac8f41a902",
  // "0x70CA78a19d7A5CD49474FC763cB3076DEeDA8e0C",
  // "0x7389d73869941222cfd31503a996859e3df52fa9",
  // "0x73ce13ac285569738bc499ec711bdaa899725d37",
  // "0x74114523acdda8547b71bf734546d6959d4f6597",
  // "0x74232E5F03DD98DcEEd3e7546670746069f9652b",
  // "0x743D7B30661d65B41960Bf6b5d1bB93CF7972A73",
  // "0x746b70df44f2bccaf7092d4989d3f18c774a222d",
  // "0x781360ec46b828a7d2e3ce539f8fad80be48c4ba",
  // "0x7B0CC017f59959C384A47Bce5De744a938B613Dc",
  // "0x80841d48420f90b5a6d99fd5506864ae9dd4937f",
  // "0x80d5f78d32d318f9143708c21d118542216c018b",
  // "0x812b25559e427ac87fefd3616d3699fcc208303c",
  // "0x8377fd48c0519c92cb10dbe678c5f5087151968d",
  // "0x864DE5bbaf4b8c808E94a8385B95B0855d170137",
  // "0x8b3af6a938b855822feef4269300fbf59177b4f2",
  // "0x8be8874828588eb4ad0640c5f5def45e3e18f44f",
  // "0x8f6cac5886d6aeb8fcb54d51738d16fa03d56378",
  // "0x90daaf10cde253c94615ca22b8c953e270b848f7",
  // "0x93e22ecd5b8a4dA8C0e97D7158C060612E7115A3",
  // "0x952cba70b03631542367dc30fb5ee152552bcf81",
  // "0x98c1803ff7ab06224b0042c191e7ce45da3307d3",
  // "0x9acf8d0315094d33aa6875b673eb126483c3a2c0",
  // "0x9B511061f59F594E6A21aFD2CD2ab0a5f130B261",
  // "0x9d0028ade4f99ecc97535e13cdf937d8c3e0a2c8",
  // "0x9eF89e487088Ae478A4e1e4a7747f2d0111fF960",
  // "0xa100fa6fada1be2041a20ba80c11e8f370c9306b",
  // "0xA1958a37C21372482DEfF4618BAEbbeC23C9a449",
  // "0xa61301A5199671aB6C5d2E21c718fdDBDAB778E3",
  // "0xa77cd019af8153cc2393e6cc8866587a2abc20d3",
  // "0xad241290ff4e599c9a77e7fd9b969b3956ea17a4",
  // "0xae40c61071a4c4d8757713a6dc73b29f2d060853",
  // "0xb017a3e0e614336e72a380b2647fbe5ae3aeb2c8",
  // "0xb1496587d188dbd39e135b38842104cf05a0bc69",
  // "0xb188aef3607f26743dbfcca148f90dea93bc2353",
  // "0xb1ae67fc2c3c78068c32a1a1f48d6d8ae9e4631e",
  // "0xb511c7661793f875ec18d99e8b855213de71ce5d",
  // "0xb6bd61ee9496ddd3debaaf040d8354e27ec3d048",
  // "0xb8960e2fc86fc22d09a9a5f0e9281992e20e8105",
  // "0xba98a17f23bbfc47990810a7d42a1a89dbd42c7f",
  // "0xbCa0323Bb34a2f0DcF745D1C82AEf87d9e75EB1B",
  // "0xbde77033a21fe143c54f7fef6b9b84f44fbbf223",
  // "0xBdFC087A5C32F6B6E425697c1A19a10E378136eE",
  // "0xbf178fdabdde5e79ecd2fb19732eead1c67c0921",
  // "0xc073c7acf73f0de6981ae4bbd8832c875d70b459",
  // "0xc426c984dd1ec880109d719f34c90c8ecf16d7c8",
  // "0xC7d8cF1762c743F18B128f4147056A3eFfEa8884",
  // "0xca0bc7bbf5f40ddcfe52d8d01bf3a35e347b4b58",
  // "0xcd812016b15e1937e281B7B7b1F1654e54CC0818",
  // "0xcda77c9243e2a7f0c3b197fa8733d7cd854ed0b0",
  // "0xcfcc136f40ae2cc2711cb3ff607384474d635f46",
  // "0xd0392E43557Dad622DB230C515ede5810E085EC4",
  // "0xd319b86300219cda70F4Fe46E516A936845370F8",
  // "0xD427e5C70FFbce7d8a41d974AF9267cBaB497007",
  // "0xd64ea7747d01e447cbff632955f3326c9b64db94",
  // "0xd780B0C4F1e0dD3B2bC41749389893a9f79d320e",
  // "0xd7d54012bf5452c45bcc1f18032187e126ec8b02",
  // "0xd7Fc4Ab828AFc1bb4b217f337f1777Ca856Efd12",
  // "0xda228e38505b79a4465ff5afc204c368af1c60f4",
  // "0xda6d534da2169934a63bc5808baf2f1e291e79d9",
  // "0xDB93342558502d4F522E774Eac55D71BFF8e6130",
  // "0xDC7dE6dd10633bBf406804444F775fB4Fb62acDF",
  // "0xDD660cFDE53B18e48dDF1A356D0E21b42C764d8a",
  // "0xdd66522e580d95517205f1f74791a7132e2873df",
  // "0xddc366f52c143abe508050a1f7dc4e0164be8674",
  // "0xdf490b0b5891053c1020e1113c6d0cbc880ee8c1",
  // "0xDF90937E07c60108B505FE3C542aB782e0A19AE5",
  // "0xe0ff5244d2be4a676475d9282ab9cfb6fe2322bb",
  // "0xe1fb6bea15d8f6ed62e4962131fd8f6ba0d5cd5a",
  // "0xe244b3bdd6f452e03958f76d2b9c66ccd9c53288",
  // "0xe3278dd9cdc262c60fbfba91d496dbac90a929bf",
  // "0xe668cAb6D7cCEf3ECEE81329a0587E24f5994889",
  // "0xe673F5e474dBF76A1230FEA52e8e58F4BACa151c",
  // "0xe71AA3699DB23fa2c3c8D0ad329F39573619a6b7",
  // "0xe786c1c68f3bbb3d94e91f9c961a067939e498cd",
  // "0xe7ed108463416098593fe4fbc891f21cb1aa471b",
  // "0xea3ee4b011b28297d7752153229e7bc5d915e646",
  // "0xea869669210a69b035b382e0f2a498b87dc6a45c",
  // "0xeaea9bcf58464ae3626bc9806a14dbe44fa79cdc",
  // "0xEB834028f893b60d6bd39BD6E7Fc139b2D88aDbC",
  // "0xec3048ec71269306d0db67cb60b50bef64c01877",
  // "0xed8e924735f590572361b52657abd9a3260f35a0",
  // "0xee2385052165986aff65075d3b1bfc948deea849",
  // "0xEe554aC7AdA8cEE59Bc40A9F00A064f1c6514B8D",
  // "0xee647c33418b1e3c3fa89fb4319f620e7489e56a",
  // "0xef2638f9ffc7b0be0dac3496af4750c8012eb022",
  // "0xf037b3B0cb56d733BC1E588C309b32683891974C",
  // "0xf6735eb77b94ccdc462fc46442060400e6ab176d",
  // "0xf73bd5710d3e3d4e8db7ec6058f9fb77ff8414e9",
  // "0xF9F8f3Acb39282199d210D1a67a1FDdC32c392ce",
  // "0xfb17d5cd85854b6bee89e714591de521f3169de5",
  // "0xfd25508e72c88c096c1195b54397a4f948c36451",
  // "0x41a6ac7f4e4dbffeb934f95f1db58b68c76dc4df",
  //   ],
  //   true
  // );

  // await sale.connect(wallet).updateState();
  // console.log("Sale State: ", await sale.state());
  // await sale
  //   .connect(wallet)
  //   .transferOwnership("0x403801485E6693ec40aBAEBf7c75Ea7fD42d27d6");
  // console.log("Sale Owner: ", await sale.owner());

  //===================================================================
  // Distro
  //===================================================================

  // await controller.distribute();
  // console.log("Distro");

  //===================================================================
  // Delist plugins
  //===================================================================

  // await voter.killGauge(await voter.gauges(farmPlugin.address));
  // await voter.killGauge(await voter.gauges(lpPlugin.address));

  //===================================================================
  // Ops
  //===================================================================

  // await wS.mint(wallet.address, oneHundred);
  // console.log("Wallet wS balance: ", await wS.balanceOf(wallet.address));
  // await wS.approve(stS.address, oneHundred);
  // await stS.deposit(oneHundred, wallet.address);
  // console.log("wS balance: ", await wS.balanceOf(wallet.address));
  // console.log("stS balance: ", await stS.balanceOf(wallet.address));

  //===================================================================
  // Print Deployment
  //===================================================================

  // console.log("SonicSphere Blaze Deployment");
  // console.log();
  // console.log("wS: ", wS.address);
  // console.log("SHADOW: ", SHADOW.address);
  // console.log("SWPX: ", SWPX.address);
  // console.log("stS: ", stS.address);
  // console.log("Shadow vAMM-wS/SHADOW: ", wS_SHADOW_lp.address);
  // console.log("SwapX vAMM-wS/SWPX: ", wS_SWPX_lp.address);
  // console.log("SwapX vAMM-wS/SWPX Farm: ", wS_SWPX_lp_farm.address);
  // console.log();
  // console.log("SPHERE: ", TOKEN.address);
  // console.log("oSPHERE: ", OTOKEN.address);
  // console.log("gSPHERE: ", VTOKEN.address);
  // console.log("Fees: ", fees.address);
  // console.log("Rewarder: ", rewarder.address);
  // console.log();
  // console.log("GaugeFactory: ", gaugeFactory.address);
  // console.log("BribeFactory: ", bribeFactory.address);
  // console.log("Voter: ", voter.address);
  // console.log("Minter: ", minter.address);
  // console.log();
  // console.log("Multicall: ", multicall.address);
  // console.log("Controller: ", controller.address);
  // console.log("Router: ", router.address);
  // console.log();
  // console.log("Auction Factory: ", auctionFactory.address);
  // console.log("Reward Auction: ", rewardAuction.address);
  // console.log();

  // let plugins = [farmPlugin.address, lpPlugin.address, erc4626Plugin.address];

  // for (let i = 0; i < plugins.length; i++) {
  //   let plugin = await multicall.pluginCardData(plugins[i], addressZero);
  //   console.log("Name: ", plugin.name);
  //   console.log("Asset: ", plugin.asset);
  //   console.log("Gauge: ", plugin.gauge);
  //   console.log("Bribe: ", plugin.bribe);
  //   console.log("AssetAuction: ", plugin.assetAuction);
  //   console.log();
  // }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
