const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const divDec6 = (amount, decimals = 6) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");

const AddressZero = "0x0000000000000000000000000000000000000000";
const one = convert("1", 18);
const two = convert("2", 18);
const five = convert("5", 18);
const ten = convert("10", 18);
const twenty = convert("20", 18);
const ninety = convert("90", 18);
const oneHundred = convert("100", 18);
const twoHundred = convert("200", 18);
const fiveHundred = convert("500", 18);
const eightHundred = convert("800", 18);
const oneThousand = convert("1000", 18);

let owner, multisig, treasury, user0, user1, user2;
let vaultFactory;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, controller;
let TOKEN, VTOKEN, OTOKEN, BASE;
let pluginFactory;
let TEST0, xTEST0, plugin0, gauge0, bribe0;
let TEST1, xTEST1, plugin1, gauge1, bribe1;
let TEST2, LP0, plugin2, gauge2, bribe2;
let TEST3, LP1, plugin3, gauge3, bribe3;

describe("local: test5", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
      await ethers.getSigners();

    // initialize BASE
    const ERC20MockArtifact = await ethers.getContractFactory(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock"
    );
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
    console.log("- BASE Initialized");

    // initialize VaultFactory
    const VaultFactoryArtifact = await ethers.getContractFactory(
      "BerachainRewardsVaultFactory"
    );
    vaultFactory = await VaultFactoryArtifact.deploy();
    console.log("- VaultFactory Initialized");

    // initialize OTOKENFactory
    const OTOKENFactoryArtifact = await ethers.getContractFactory(
      "OTOKENFactory"
    );
    OTOKENFactory = await OTOKENFactoryArtifact.deploy();
    console.log("- OTOKENFactory Initialized");

    // initialize VTOKENFactory
    const VTOKENFactoryArtifact = await ethers.getContractFactory(
      "VTOKENFactory"
    );
    VTOKENFactory = await VTOKENFactoryArtifact.deploy();
    console.log("- VTOKENFactory Initialized");

    // initialize FeesFactory
    const FeesFactoryArtifact = await ethers.getContractFactory(
      "TOKENFeesFactory"
    );
    feesFactory = await FeesFactoryArtifact.deploy();
    console.log("- FeesFactory Initialized");

    // initialize RewarderFactory
    const RewarderFactoryArtifact = await ethers.getContractFactory(
      "VTOKENRewarderFactory"
    );
    rewarderFactory = await RewarderFactoryArtifact.deploy();
    console.log("- RewarderFactory Initialized");

    // intialize TOKEN
    const TOKENArtifact = await ethers.getContractFactory("TOKEN");
    TOKEN = await TOKENArtifact.deploy(
      BASE.address,
      oneThousand,
      OTOKENFactory.address,
      VTOKENFactory.address,
      rewarderFactory.address,
      feesFactory.address,
      vaultFactory.address
    );
    console.log("- TOKEN Initialized");

    // initialize TOKENFees
    fees = await ethers.getContractAt(
      "contracts/TOKENFeesFactory.sol:TOKENFees",
      await TOKEN.FEES()
    );
    console.log("- TOKENFees Initialized");

    //initialize OTOKEN
    OTOKEN = await ethers.getContractAt(
      "contracts/OTOKENFactory.sol:OTOKEN",
      await TOKEN.OTOKEN()
    );
    console.log("- OTOKEN Initialized");

    //initialize VTOKEN
    VTOKEN = await ethers.getContractAt(
      "contracts/VTOKENFactory.sol:VTOKEN",
      await TOKEN.VTOKEN()
    );
    console.log("- VTOKEN Initialized");

    //initialize VTOKENRewarder
    rewarder = await ethers.getContractAt(
      "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
      await VTOKEN.rewarder()
    );
    console.log("- VTOKENRewarder Initialized");

    // initialize GaugeFactory
    const gaugeFactoryArtifact = await ethers.getContractFactory(
      "GaugeFactory"
    );
    const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(
      owner.address
    );
    gaugeFactory = await ethers.getContractAt(
      "GaugeFactory",
      gaugeFactoryContract.address
    );
    console.log("- GaugeFactory Initialized");

    //initialize BribeFactory
    const bribeFactoryArtifact = await ethers.getContractFactory(
      "BribeFactory"
    );
    const bribeFactoryContract = await bribeFactoryArtifact.deploy(
      owner.address
    );
    bribeFactory = await ethers.getContractAt(
      "BribeFactory",
      bribeFactoryContract.address
    );
    console.log("- BribeFactory Initialized");

    // initialize Voter
    const voterArtifact = await ethers.getContractFactory("Voter");
    const voterContract = await voterArtifact.deploy(
      VTOKEN.address,
      gaugeFactory.address,
      bribeFactory.address
    );
    voter = await ethers.getContractAt("Voter", voterContract.address);
    console.log("- Voter Initialized");

    // initialize Minter
    const minterArtifact = await ethers.getContractFactory("Minter");
    const minterContract = await minterArtifact.deploy(
      voter.address,
      TOKEN.address,
      VTOKEN.address,
      OTOKEN.address
    );
    minter = await ethers.getContractAt("Minter", minterContract.address);
    console.log("- Minter Initialized");

    // initialize governanor
    const governanceArtifact = await ethers.getContractFactory("TOKENGovernor");
    const governanceContract = await governanceArtifact.deploy(VTOKEN.address);
    governance = await ethers.getContractAt(
      "TOKENGovernor",
      governanceContract.address
    );
    console.log("- TOKENGovernor Initialized");

    // initialize Multicall
    const multicallArtifact = await ethers.getContractFactory("Multicall");
    const multicallContract = await multicallArtifact.deploy(
      voter.address,
      BASE.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address
    );
    multicall = await ethers.getContractAt(
      "Multicall",
      multicallContract.address
    );
    console.log("- Multicall Initialized");

    // initialize Controller
    const controllerArtifact = await ethers.getContractFactory("Controller");
    const controllerContract = await controllerArtifact.deploy(
      voter.address,
      fees.address
    );
    controller = await ethers.getContractAt(
      "Controller",
      controllerContract.address
    );
    console.log("- Controller Initialized");

    // System set-up
    await gaugeFactory.setVoter(voter.address);
    await bribeFactory.setVoter(voter.address);
    await VTOKEN.connect(owner).addReward(TOKEN.address);
    await VTOKEN.connect(owner).addReward(OTOKEN.address);
    await VTOKEN.connect(owner).addReward(BASE.address);
    await VTOKEN.connect(owner).setVoter(voter.address);
    await OTOKEN.connect(owner).setMinter(minter.address);
    await voter.initialize(minter.address);
    await minter.initialize();
    console.log("- System set up");

    const PluginFactoryArtifact = await ethers.getContractFactory(
      "MockPluginFactory"
    );
    const PluginFactoryContract = await PluginFactoryArtifact.deploy(
      voter.address,
      vaultFactory.address
    );
    pluginFactory = await ethers.getContractAt(
      "MockPluginFactory",
      PluginFactoryContract.address
    );
    console.log("- PluginFactory Initialized");

    await pluginFactory.createSingleStakePlugin("xTEST0", "TEST0");
    plugin0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin0 Initialized");

    await pluginFactory.createSingleStakePlugin("xTEST1", "TEST1");
    plugin1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin1 Initialized");

    await pluginFactory.createLPMockPlugin("LP0", "TEST2", "BASE");
    plugin2 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin2 Initialized");

    await pluginFactory.createLPMockPlugin("LP1", "TEST3", "BASE");
    plugin3 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin3 Initialized");

    // Initialize Mock Tokens
    xTEST0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin0.getToken()
    );
    TEST0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin0.getBribeTokens()
      )[0]
    );
    xTEST1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin1.getToken()
    );
    TEST1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin1.getBribeTokens()
      )[0]
    );
    LP0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin2.getToken()
    );
    TEST2 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin2.getBribeTokens()
      )[0]
    );
    LP1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin3.getToken()
    );
    TEST3 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin3.getBribeTokens()
      )[0]
    );
    console.log("- Mock Tokens Initialized");

    // add Plugin0 to Voter
    await voter.addPlugin(plugin0.address);
    let Gauge0Address = await voter.gauges(plugin0.address);
    let Bribe0Address = await voter.bribes(plugin0.address);
    gauge0 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge0Address
    );
    bribe0 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe0Address
    );
    console.log("- Plugin0 Added in Voter");

    // add Plugin1 to Voter
    await voter.addPlugin(plugin1.address);
    let Gauge1Address = await voter.gauges(plugin1.address);
    let Bribe1Address = await voter.bribes(plugin1.address);
    gauge1 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge1Address
    );
    bribe1 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe1Address
    );
    console.log("- Plugin1 Added in Voter");

    // add Plugin2 to Voter
    await voter.addPlugin(plugin2.address);
    let Gauge2Address = await voter.gauges(plugin2.address);
    let Bribe2Address = await voter.bribes(plugin2.address);
    gauge2 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge2Address
    );
    bribe2 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe2Address
    );
    console.log("- Plugin2 Added in Voter");

    // add Plugin3 to Voter
    await voter.addPlugin(plugin3.address);
    let Gauge3Address = await voter.gauges(plugin3.address);
    let Bribe3Address = await voter.bribes(plugin3.address);
    gauge3 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge3Address
    );
    bribe3 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe3Address
    );
    console.log("- Plugin3 Added in Voter");

    console.log("Initialization Complete");
    console.log();
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await xTEST0.mint(user0.address, 100);
    await xTEST0.mint(user1.address, 100);
    await xTEST0.mint(user2.address, 100);
  });

  it("User0 deposits in Plugin0 for user1", async function () {
    console.log("******************************************************");
    await xTEST0.connect(user0).approve(plugin0.address, ten);
    await plugin0.connect(user0).depositFor(user1.address, ten);
  });

  it("User1 withdraws from Plugin0 to user0", async function () {
    console.log("******************************************************");
    await plugin0.connect(user1).withdrawTo(user0.address, ten);
  });

  it("Get Plugin0 Card", async function () {
    console.log("******************************************************");
    const pluginCard = await controller.getPlugin(plugin0.address);
    console.log(pluginCard);
  });

  it("Get Plugin0 Card", async function () {
    console.log("******************************************************");
    const pluginCard = await controller.getPluginInfo(0);
    console.log(pluginCard);
  });

  it("User0 deposits in Plugin0 for user1", async function () {
    console.log("******************************************************");
    await xTEST0.connect(user0).approve(plugin0.address, ten);
    await plugin0.connect(user0).depositFor(user0.address, ten);
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.token);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.assetTokens.length; i++) {
      console.log(" - ", res.assetTokens[i]);
    }
    console.log("Underlying Decimals: ", res.tokenDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.name);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountTokenBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("Owner kills Plugin0", async function () {
    console.log("******************************************************");
    await voter.killGauge(gauge0.address);
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
    console.log(res);
  });

  it("User1 withdraws from Plugin0 to user0", async function () {
    console.log("******************************************************");
    await plugin0.connect(user0).withdrawTo(user0.address, ten);
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
    console.log(res);
  });
});
