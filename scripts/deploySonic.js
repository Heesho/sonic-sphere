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
  await verifySale();
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
