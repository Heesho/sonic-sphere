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
  OTOKENFactory = await ethers.getContractAt(
    "contracts/OTOKENFactory.sol:OTOKENFactory",
    "0x24f2b8BEb1F4D93Ea9599dd7E1e7Ca0B4Af6AF5D"
  );
  VTOKENFactory = await ethers.getContractAt(
    "contracts/VTOKENFactory.sol:VTOKENFactory",
    "0x48e62c9Fac1e1F3F7B081dBa55b19F818aA87fbC"
  );
  feesFactory = await ethers.getContractAt(
    "contracts/TOKENFeesFactory.sol:TOKENFeesFactory",
    "0xF81454810B92afA5cBd7c36e79FdE6B9E59AaAa1"
  );
  rewarderFactory = await ethers.getContractAt(
    "contracts/VTOKENRewarderFactory.sol:VTOKENRewarderFactory",
    "0xDe7D267Fb3c8612289dA1851f77b07Ac86b95192"
  );

  TOKEN = await ethers.getContractAt(
    "contracts/TOKEN.sol:TOKEN",
    "0x86B96239663D9c77A9C1654484a3F2F14D80F91E"
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

  gaugeFactory = await ethers.getContractAt(
    "contracts/GaugeFactory.sol:GaugeFactory",
    "0xeb9aDf6b244dc7b17343ab12BF2D96600aDB8320"
  );
  bribeFactory = await ethers.getContractAt(
    "contracts/BribeFactory.sol:BribeFactory",
    "0x6b02D0Dc81a6934a6AFc71f0bD70b453813cF425"
  );
  voter = await ethers.getContractAt(
    "contracts/Voter.sol:Voter",
    "0xae40C61071A4c4D8757713a6dc73B29f2d060853"
  );
  minter = await ethers.getContractAt(
    "contracts/Minter.sol:Minter",
    "0x762c7d49409A0521Ff21B0c517fFe47B4c8ac786"
  );

  auctionFactory = await ethers.getContractAt(
    "contracts/AuctionFactory.sol:AuctionFactory",
    "0x6601dEb210ddfEbB8641f1aC69f904Bc476c9829"
  );
  rewardAuction = await ethers.getContractAt(
    "contracts/AuctionFactory.sol:Auction",
    "0xA6e39C886fFb9b967434541b5466A365392DeF75"
  );

  multicall = await ethers.getContractAt(
    "contracts/Multicall.sol:Multicall",
    "0x32ac1f5a03753314953D064713f77c5cA9c71E21"
  );
  controller = await ethers.getContractAt(
    "contracts/Controller.sol:Controller",
    "0x34F9a430A226eFEA4d191209aca535f4e2833249"
  );
  router = await ethers.getContractAt(
    "contracts/Router.sol:Router",
    "0xcB22020E3C9cD2cDf264874c2096399E03382E03"
  );

  sale = await ethers.getContractAt(
    "contracts/Sale.sol:Sale",
    "0xBFe01B33ea5ebC81279462b8206690B1C5a9a419"
  );

  wS = await ethers.getContractAt(
    "contracts/Mocks/BaseMock.sol:BaseMock",
    "0x67a4d6796C12714FDED41eA7E999D5c32831E2A5"
  );
  SHADOW = await ethers.getContractAt(
    "contracts/Mocks/ERC20Mock.sol:ERC20Mock",
    "0x5AaA726fa1d844D71Ebe0757705b86fAb8041526"
  );
  SWPX = await ethers.getContractAt(
    "contracts/Mocks/ERC20Mock.sol:ERC20Mock",
    "0xa4Fcf5232Ad35c99449244427E308e6cf48FFf3D"
  );
  wS_SHADOW_lp = await ethers.getContractAt(
    "contracts/Mocks/LPMock.sol:LPMock",
    "0x23eA1dCd55F2ceaD68e4aC208662843f12CE66a6"
  );

  stS = await ethers.getContractAt(
    "contracts/Mocks/ERC4626Mock.sol:ERC4626Mock",
    "0x819e166848DB0370fc2BedBC22437C131F2c03d1"
  );

  wS_SWPX_lp = await ethers.getContractAt(
    "contracts/Mocks/ERC20Mock.sol:ERC20Mock",
    "0x74Ea8f0fE0b6Ab5EbFA2d2F2907DAd5aB58d8D53"
  );
  wS_SWPX_lp_farm = await ethers.getContractAt(
    "contracts/Mocks/FarmMock.sol:FarmMock",
    "0x20eFec197f8Dc18F57f1040effC56D7FbFEEc30d"
  );

  erc4626PluginFactory = await ethers.getContractAt(
    "contracts/Plugins/ERC4626PluginFactory.sol:ERC4626PluginFactory",
    "0x3C693FE082aEad4cbb86e8877330Bf1cC2cb8D38"
  );
  erc4626Plugin = await ethers.getContractAt(
    "contracts/Plugins/ERC4626PluginFactory.sol:ERC4626Plugin",
    "0xC75a3FbFF224b9ca95Cc1c3cB7B7D133E3AfC3c9"
  );

  lpPluginFactory = await ethers.getContractAt(
    "contracts/Plugins/LPPluginFactory.sol:LPPluginFactory",
    "0xF14c232D3eCE241BFbCa529666D63d41638ef4d2"
  );
  lpPlugin = await ethers.getContractAt(
    "contracts/Plugins/LPPluginFactory.sol:LPPlugin",
    "0x8Bd229467FbB8Fd829f97CAe57A9AD5D5a6162d7"
  );

  farmPluginFactory = await ethers.getContractAt(
    "contracts/Plugins/FarmPluginFactory.sol:FarmPluginFactory",
    "0x17BEE4c29E89ee61dA32Fdbc1851cADE60d4b360"
  );
  farmPlugin = await ethers.getContractAt(
    "contracts/Plugins/FarmPluginFactory.sol:FarmPlugin",
    "0xEde87458659110d7D02CF6FD505214Cd4fCF401B"
  );

  console.log("Contracts Retrieved");
}

async function deployERC20() {
  console.log("Starting Base Deployment");
  const BaseMockArtifact = await ethers.getContractFactory("BaseMock");
  wS = await BaseMockArtifact.deploy("wS", "wS");
  await sleep(5000);
  console.log("wS Deployed at:", wS.address);
  console.log("Base Deployed");

  console.log("Starting ERC20 Deployment");
  const ERC20MockArtifact = await ethers.getContractFactory("ERC20Mock");
  SHADOW = await ERC20MockArtifact.deploy("SHADOW", "SHADOW");
  await sleep(5000);
  console.log("SHADOW Deployed at:", SHADOW.address);
  SWPX = await ERC20MockArtifact.deploy("SWPX", "SWPX");
  await sleep(5000);
  console.log("SWPX Deployed at:", SWPX.address);
  wS_SWPX_lp = await ERC20MockArtifact.deploy("vAMM-wS/SWPX", "vAMM-wS/SWPX");
  await sleep(5000);
  console.log("SwapX vAMM-wS/SWPX Deployed at:", wS_SWPX_lp.address);
  console.log("ERC20s Deployed");
}

async function verifyERC20() {
  console.log("Starting Base Verification");
  await hre.run("verify:verify", {
    address: wS.address,
    contract: "contracts/Mocks/BaseMock.sol:BaseMock",
    constructorArguments: ["wS", "wS"],
  });
  console.log("wS Verified");

  console.log("Starting ERC20 Verification");
  await hre.run("verify:verify", {
    address: wS.address,
    contract: "contracts/Mocks/ERC20Mock.sol:ERC20Mock",
    constructorArguments: ["wS", "wS"],
  });
  console.log("wS Verified");
}

async function deployERC4626() {
  console.log("Starting ERC4626 Deployment");
  const ERC4626MockArtifact = await ethers.getContractFactory("ERC4626Mock");
  stS = await ERC4626MockArtifact.deploy(wS.address, "stS", "stS");
  await sleep(5000);
  console.log("stS Deployed at:", stS.address);
}

async function verifyERC4626() {
  console.log("Starting ERC4626 Verification");
  await hre.run("verify:verify", {
    address: stS.address,
    contract: "contracts/Mocks/ERC4626Mock.sol:ERC4626Mock",
    constructorArguments: [wS.address, "stS", "stS"],
  });
  console.log("stS Verified");
}

async function deployLP() {
  console.log("Starting LP Deployment");
  const LPMockArtifact = await ethers.getContractFactory("LPMock");
  wS_SHADOW_lp = await LPMockArtifact.deploy(
    "vAMM-wS/SHADOW",
    "vAMM-wS/SHADOW",
    wS.address,
    SHADOW.address
  );
  await sleep(5000);
  console.log("wS-SHADOW LP Deployed at:", wS_SHADOW_lp.address);
}

async function verifyLP() {
  console.log("Starting LP Verification");
  await hre.run("verify:verify", {
    address: wS_SHADOW_lp.address,
    contract: "contracts/Mocks/LPMock.sol:LPMock",
    constructorArguments: [
      "vAMM-wS/SHADOW",
      "vAMM-wS/SHADOW",
      wS.address,
      SHADOW.address,
    ],
  });
  console.log("wS-SHADOW LP Verified");
}

async function deployFarm() {
  console.log("Starting Farm Deployment");
  const FarmMockArtifact = await ethers.getContractFactory("FarmMock");
  wS_SWPX_lp_farm = await FarmMockArtifact.deploy(
    wS_SWPX_lp.address,
    SWPX.address
  );
  await sleep(5000);
  console.log("wS-SWPX LP Farm Deployed at:", wS_SWPX_lp_farm.address);
}

async function verifyFarm() {
  console.log("Starting Farm Verification");
  await hre.run("verify:verify", {
    address: wS_SWPX_lp_farm.address,
    contract: "contracts/Mocks/FarmMock.sol:FarmMock",
    constructorArguments: [wS_SWPX_lp.address, SWPX.address],
  });
  console.log("wS-SWPX LP Farm Verified");
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

async function deployLPPluginFactory() {
  console.log("Starting LPPluginFactory Deployment");
  const lpPluginFactoryArtifact = await ethers.getContractFactory(
    "LPPluginFactory"
  );
  lpPluginFactory = await lpPluginFactoryArtifact.deploy(
    MULTISIG,
    MULTISIG,
    rewardAuction.address,
    auctionFactory.address
  );
  await sleep(5000);
  console.log("LPPluginFactory Deployed at:", lpPluginFactory.address);
}

async function verifyLPPluginFactory() {
  console.log("Starting LPPluginFactory Verification");
  await hre.run("verify:verify", {
    address: lpPluginFactory.address,
    contract: "contracts/Plugins/LPPluginFactory.sol:LPPluginFactory",
    constructorArguments: [
      MULTISIG,
      MULTISIG,
      rewardAuction.address,
      auctionFactory.address,
    ],
  });
  console.log("LPPluginFactory Verified");
}

async function deployLPPlugin() {
  console.log("Starting LPPlugin Deployment");
  await lpPluginFactory.createPlugin(
    "Shadow vAMM-wS/SHADOW",
    voter.address,
    wS_SHADOW_lp.address,
    [wS.address, SHADOW.address],
    oneHundred,
    2 * 24 * 3600,
    two,
    ten
  );
  await sleep(5000);
  lpPlugin = await ethers.getContractAt(
    "LPPlugin",
    await lpPluginFactory.lastPlugin()
  );
  console.log("LPPlugin Deployed at:", lpPlugin.address);
}

async function verifyLPPlugin() {
  console.log("Starting LPPlugin Verification");
  await hre.run("verify:verify", {
    address: lpPlugin.address,
    contract: "contracts/Plugins/LPPluginFactory.sol:LPPlugin",
    constructorArguments: [
      "Shadow vAMM-wS/SHADOW",
      voter.address,
      wS_SHADOW_lp.address,
      [wS.address, SHADOW.address],
    ],
  });
  console.log("LPPlugin Verified");
}

async function deployFarmPluginFactory() {
  console.log("Starting FarmPluginFactory Deployment");
  const farmPluginFactoryArtifact = await ethers.getContractFactory(
    "FarmPluginFactory"
  );
  farmPluginFactory = await farmPluginFactoryArtifact.deploy(
    MULTISIG,
    MULTISIG,
    rewardAuction.address,
    auctionFactory.address
  );
  await sleep(5000);
  console.log("FarmPluginFactory Deployed at:", farmPluginFactory.address);
}

async function verifyFarmPluginFactory() {
  console.log("Starting FarmPluginFactory Verification");
  await hre.run("verify:verify", {
    address: farmPluginFactory.address,
    contract: "contracts/Plugins/FarmPluginFactory.sol:FarmPluginFactory",
    constructorArguments: [
      MULTISIG,
      MULTISIG,
      rewardAuction.address,
      auctionFactory.address,
    ],
  });
  console.log("FarmPluginFactory Verified");
}

async function deployFarmPlugin() {
  console.log("Starting FarmPlugin Deployment");
  await farmPluginFactory.createPlugin(
    "SwapX vAMM-wS/SWPX",
    voter.address,
    wS_SWPX_lp.address,
    [SWPX.address],
    wS_SWPX_lp_farm.address,
    oneHundred,
    2 * 24 * 3600,
    two,
    ten
  );
  await sleep(5000);
  farmPlugin = await ethers.getContractAt(
    "FarmPlugin",
    await farmPluginFactory.lastPlugin()
  );
  console.log("FarmPlugin Deployed at:", farmPlugin.address);
}

async function verifyFarmPlugin() {
  console.log("Starting FarmPlugin Verification");
  await hre.run("verify:verify", {
    address: farmPlugin.address,
    contract: "contracts/Plugins/FarmPluginFactory.sol:FarmPlugin",
    constructorArguments: [
      "SwapX vAMM-wS/SWPX",
      voter.address,
      wS_SWPX_lp.address,
      [SWPX.address],
      wS_SWPX_lp_farm.address,
    ],
  });
  console.log("FarmPlugin Verified");
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
