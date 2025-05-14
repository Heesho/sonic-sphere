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
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, priceOracle, router;
let TOKEN, VTOKEN, OTOKEN, BASE;

describe("test2", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
      await ethers.getSigners();

    // initialize ERC20Mocks
    const ERC20MockArtifact = await ethers.getContractFactory("ERC20Mock");
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
    console.log("- ERC20Mocks Initialized");

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
      feesFactory.address
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
      rewarder.address,
      AddressZero
    );
    multicall = await ethers.getContractAt(
      "Multicall",
      multicallContract.address
    );
    console.log("- Multicall Initialized");

    // initialize Router
    const RouterArtifact = await ethers.getContractFactory("Router");
    router = await RouterArtifact.deploy(
      voter.address,
      TOKEN.address,
      OTOKEN.address,
      multicall.address,
      AddressZero,
      AddressZero
    );
    console.log("- Router Initialized");

    // System set-up
    await expect(
      gaugeFactory.connect(user2).setVoter(voter.address)
    ).to.be.revertedWith("GaugeFactory__UnathorizedVoter");
    await expect(gaugeFactory.setVoter(AddressZero)).to.be.revertedWith(
      "GaugeFactory__InvalidZeroAddress"
    );
    await gaugeFactory.setVoter(voter.address);
    await expect(
      bribeFactory.connect(user2).setVoter(voter.address)
    ).to.be.revertedWith("BribeFactory__UnathorizedVoter");
    await expect(bribeFactory.setVoter(AddressZero)).to.be.revertedWith(
      "BribeFactory__InvalidZeroAddress"
    );
    await bribeFactory.setVoter(voter.address);
    await VTOKEN.connect(owner).addReward(TOKEN.address);
    await VTOKEN.connect(owner).addReward(OTOKEN.address);
    await VTOKEN.connect(owner).addReward(BASE.address);
    await VTOKEN.connect(owner).setVoter(voter.address);
    await OTOKEN.connect(owner).setMinter(minter.address);
    await expect(
      voter.connect(user2).initialize(minter.address)
    ).to.be.revertedWith("Voter__NotMinter");
    await voter.initialize(minter.address);
    await expect(minter.connect(user2).initialize()).to.be.revertedWith(
      "Minter__UnathorizedInitializer"
    );
    await minter.initialize();
    console.log("- System set up");

    console.log("Initialization Complete");
    console.log();
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, oneThousand);
    await BASE.mint(user1.address, oneThousand);
    await BASE.mint(user2.address, oneThousand);
  });

  it("Quote Buy In", async function () {
    console.log("******************************************************");
    let res = await router.connect(owner).quoteBuyIn(ten, 9800);
    console.log("BASE in", divDec(ten));
    console.log("Slippage Tolerance", "2%");
    console.log();
    console.log("TOKEN out", divDec(res.output));
    console.log("slippage", divDec(res.slippage));
    console.log("min TOKEN out", divDec(res.minOutput));
    console.log("auto min TOKEN out", divDec(res.autoMinOutput));
  });

  it("User0 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).buy(
      ten,
      1,
      1892282187,
      user0.address,
      treasury.address
    );
  });

  it("Quote Sell In", async function () {
    console.log("******************************************************");
    let res = await router.quoteSellIn(
      await TOKEN.balanceOf(user0.address),
      9700
    );
    console.log("TOKEN in", divDec(await TOKEN.balanceOf(user0.address)));
    console.log("Slippage Tolerance", "3%");
    console.log();
    console.log("BASE out", divDec(res.output));
    console.log("slippage", divDec(res.slippage));
    console.log("min BASE out", divDec(res.minOutput));
    console.log("auto min BASE out", divDec(res.autoMinOutput));
  });

  it("User0 exercises 1 OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, one);
    await OTOKEN.connect(user0).approve(TOKEN.address, one);
    await BASE.connect(user0).approve(TOKEN.address, one);
    await TOKEN.connect(user0).exercise(one, user0.address);
  });

  it("User0 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1892282187,
      user0.address,
      treasury.address
    );
  });

  it("User0 Buys 10 TOKEN", async function () {
    console.log("******************************************************");
    let res = await router.connect(owner).quoteBuyOut(ten, 9700);
    console.log("TOKEN out", divDec(ten));
    console.log("Slippage Tolerance", "3%");
    console.log();
    console.log("BASE in", divDec(res.output));
    console.log("slippage", divDec(res.slippage));
    console.log("min TOKEN out", divDec(res.minOutput));
    console.log("auto min TOKEN out", divDec(res.autoMinOutput));

    await BASE.connect(user0).approve(TOKEN.address, res.output);
    await TOKEN.connect(user0).buy(
      res.output,
      res.autoMinOutput,
      1892282187,
      user0.address,
      treasury.address
    );
  });

  it("User0 sells TOKEN for 5 BASE", async function () {
    console.log("******************************************************");
    let res = await router.connect(owner).quoteSellOut(five, 9950);
    console.log("BASE out", divDec(five));
    console.log("Slippage Tolerance", "0.5%");
    console.log();
    console.log("TOKEN in", divDec(res.output));
    console.log("slippage", divDec(res.slippage));
    console.log("min BASE out", divDec(res.minOutput));
    console.log("auto min BASE out", divDec(res.autoMinOutput));

    await TOKEN.connect(user0).approve(TOKEN.address, res.output);
    await TOKEN.connect(user0).sell(
      res.output,
      res.autoMinOutput,
      1892282187,
      user0.address,
      treasury.address
    );
  });
});
