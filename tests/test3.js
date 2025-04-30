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
const twoThousand = convert("2000", 18);
const threeThousand = convert("3000", 18);
const twentyThousand = convert("20000", 18);
const twentyMillion = convert("20000000", 18);

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, priceOracle, router;
let TOKEN, VTOKEN, OTOKEN, BASE;
let voter1, gaugeFactory1, bribeFactory1, multicall1;

describe("test3", function () {
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
      AddressZero
    );
    console.log("- Router Initialized");

    // System set-up
    await gaugeFactory.setVoter(voter.address);
    await bribeFactory.setVoter(voter.address);
    await VTOKEN.connect(owner).addReward(TOKEN.address);
    await VTOKEN.connect(owner).addReward(OTOKEN.address);
    await VTOKEN.connect(owner).addReward(BASE.address);
    await VTOKEN.connect(owner).setVoter(voter.address);
    await OTOKEN.connect(owner).setMinter(minter.address);
    await voter.initialize(minter.address);
    console.log("- System set up");

    console.log("Initialization Complete");
    console.log();
  });

  it("BondingCurveData, owner", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(owner.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("BondingCurveData, AddressZero", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(AddressZero);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
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
  });

  it("User0 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).buy(
      ten,
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
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

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
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

    await BASE.connect(user0).approve(TOKEN.address, res.output);
    await TOKEN.connect(user0).buy(
      res.output,
      res.minOutput,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 TOKEN for 5 BASE", async function () {
    console.log("******************************************************");
    let res = await router.connect(owner).quoteSellOut(five, 9950);
    console.log("BASE out", divDec(five));
    console.log("Slippage Tolerance", "0.5%");
    console.log();
    console.log("TOKEN in", divDec(res.output));
    console.log("slippage", divDec(res.slippage));
    console.log("min BASE out", divDec(res.minOutput));

    await TOKEN.connect(user0).approve(TOKEN.address, res.output);
    await TOKEN.connect(user0).sell(
      res.output,
      res.minOutput,
      1892282187,
      user0.address,
      treasury.address
    );
  });

  it("User1 stakes 0 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, one);
    await VTOKEN.connect(user0).deposit(one);
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User1 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).sell(
      await TOKEN.balanceOf(user0.address),
      1,
      1892282187,
      user0.address,
      treasury.address
    );
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 tries to withdraws staked position", async function () {
    console.log("******************************************************");
    await expect(
      VTOKEN.connect(user0).withdraw(
        await VTOKEN.connect(owner).balanceOf(user0.address)
      )
    ).to.be.revertedWith("VTOKEN__CollateralActive");
    await expect(VTOKEN.connect(user0).withdraw(0)).to.be.revertedWith(
      "VTOKEN__InvalidZeroInput"
    );
  });

  it("User0 tries to repay more than what they owe", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, one);
    await expect(TOKEN.connect(user0).repay(two)).to.be.reverted;
  });

  it("User0 Buys TOKEN with 20 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, twenty);
    await TOKEN.connect(user0).buy(
      twenty,
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 stakes 9 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, ten.sub(one));
    await VTOKEN.connect(user0).deposit(ten.sub(one));
  });

  it("User0 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).sell(
      await TOKEN.balanceOf(user0.address),
      1,
      1892282187,
      user0.address,
      treasury.address
    );
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 tries to borrow more than they can", async function () {
    console.log("******************************************************");
    await expect(TOKEN.connect(user0).borrow(twenty)).to.be.revertedWith(
      "TOKEN__ExceedsBorrowCreditLimit"
    );
    await expect(TOKEN.connect(user0).borrow(0)).to.be.revertedWith(
      "TOKEN__InvalidZeroInput"
    );
  });

  it("User0 borrows some against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(one);
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 repays 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, one);
    await TOKEN.connect(user0).repay(one);
  });

  it("User0 repays max BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(
      TOKEN.address,
      await TOKEN.debts(user0.address)
    );
    await TOKEN.connect(user0).repay(await TOKEN.debts(user0.address));
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("User1 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, ten);
    await TOKEN.connect(user1).buy(
      ten,
      1,
      1892282187,
      user1.address,
      treasury.address
    );
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User1 stakes 5 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(VTOKEN.address, five);
    await VTOKEN.connect(user1).deposit(five);
  });

  it("User1 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user1.address)
    );
    await TOKEN.connect(user1).sell(
      await TOKEN.balanceOf(user1.address),
      1,
      1892282187,
      user1.address,
      treasury.address
    );
  });

  it("User0 exercises 10 OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, ten);
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).exercise(ten, user0.address);
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 exercises 10 OTOKEN without any OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await expect(TOKEN.connect(user0).exercise(ten, user0.address)).to.be
      .reverted;
  });

  it("User0 exercises 10 OTOKEN without any BASE", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user1.address, ten);
    await BASE.connect(user0).transfer(
      treasury.address,
      await BASE.balanceOf(user0.address)
    );
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await expect(TOKEN.connect(user0).exercise(ten, user0.address)).to.be
      .reverted;
    await BASE.connect(treasury).transfer(
      user0.address,
      await BASE.balanceOf(treasury.address)
    );
  });

  it("User0 exercises 10 OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, ten);
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).exercise(ten, user0.address);
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("User0 tries to sell more TOKEN than whats available in bonding curve", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, twenty);
    await expect(
      TOKEN.connect(user0).sell(
        twenty,
        1,
        1792282187,
        user0.address,
        treasury.address
      )
    ).to.be.revertedWith("TOKEN__ExceedsSwapMarketReserves");
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      treasury.address
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      treasury.address
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      treasury.address
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("User0 exercises 10 OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, ten);
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).exercise(ten, user0.address);
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      treasury.address
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      treasury.address
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 redeems all TOKENS for BASE", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).redeem(
      await TOKEN.balanceOf(user0.address),
      user0.address
    );
  });

  it("User1 redeems all TOKENS for BASE", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user1.address)
    );
    await TOKEN.connect(user1).redeem(
      await TOKEN.balanceOf(user1.address),
      user1.address
    );
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("User0 repays max BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(
      TOKEN.address,
      await TOKEN.debts(user0.address)
    );
    await TOKEN.connect(user0).repay(await TOKEN.debts(user0.address));
  });

  it("User0 unstakes all TOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user0).withdraw(await VTOKEN.balanceOf(user0.address));
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User1 unstakes all TOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user1).withdraw(await VTOKEN.balanceOf(user1.address));
  });

  it("User0 redeems all TOKENS for BASE", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).redeem(
      await TOKEN.balanceOf(user0.address),
      user0.address
    );
  });

  it("User1 redeems all TOKENS for BASE", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user1.address)
    );
    await TOKEN.connect(user1).redeem(
      await TOKEN.balanceOf(user1.address),
      user1.address
    );
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 Buys TOKEN with 20 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, twenty);
    await TOKEN.connect(user0).buy(
      twenty,
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("User0 stakes 10 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, ten);
    await VTOKEN.connect(user0).deposit(ten);
  });

  it("User1 Buys TOKEN with 20 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, twenty);
    await TOKEN.connect(user1).buy(
      twenty,
      1,
      1792282187,
      user1.address,
      treasury.address
    );
  });

  it("User1 stakes 5 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(VTOKEN.address, five);
    await VTOKEN.connect(user1).deposit(five);
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("User1 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).borrow(
      await TOKEN.getAccountCredit(user1.address)
    );
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distributeBASE();
    await fees.distributeTOKEN();
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    await rewarder.connect(user2).getReward(user1.address);
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
  });

  it("Owner mints OTOKEN and sends to fee contract", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(fees.address, ten);
  });

  it("User2 Buys TOKEN with 20 ETH", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(
      twenty,
      1,
      1892282187,
      user2.address,
      treasury.address
    );
  });

  it("User2 sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await TOKEN.connect(user2).sell(
      await TOKEN.balanceOf(user2.address),
      1,
      1792282187,
      user2.address,
      treasury.address
    );
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User2 Buys TOKEN with 20 ETH", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(
      twenty,
      1,
      1892282187,
      user2.address,
      treasury.address
    );
  });

  it("User2 sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await TOKEN.connect(user2).sell(
      await TOKEN.balanceOf(user2.address),
      1,
      1792282187,
      user2.address,
      treasury.address
    );
  });

  it("Owner mints OTOKEN and sends to fee contract", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(fees.address, ten);
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("User0 repays max BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(
      TOKEN.address,
      await TOKEN.debts(user0.address)
    );
    await TOKEN.connect(user0).repay(await TOKEN.debts(user0.address));
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 unstakes all TOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user0).withdraw(await VTOKEN.balanceOf(user0.address));
  });

  it("User0 burns 10 OTOKEN for voting power", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, ten);
    await OTOKEN.connect(user0).approve(
      VTOKEN.address,
      await OTOKEN.balanceOf(user0.address)
    );
    await VTOKEN.connect(user0).burnFor(
      user0.address,
      await OTOKEN.balanceOf(user0.address)
    );
    await OTOKEN.connect(user0).approve(
      VTOKEN.address,
      await OTOKEN.balanceOf(user0.address)
    );
    await expect(
      VTOKEN.connect(user0).burnFor(
        user0.address,
        await OTOKEN.balanceOf(user0.address)
      )
    ).to.be.reverted;
  });

  it("User2 Buys TOKEN with 20 ETH", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(
      twenty,
      1,
      1892282187,
      user2.address,
      treasury.address
    );
  });

  it("User2 sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await TOKEN.connect(user2).sell(
      await TOKEN.balanceOf(user2.address),
      1,
      1792282187,
      user2.address,
      treasury.address
    );
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
  });

  it("User0 burns 10 OTOKEN for voting power", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(
      VTOKEN.address,
      await OTOKEN.balanceOf(user0.address)
    );
    await VTOKEN.connect(user0).burnFor(
      user0.address,
      await OTOKEN.balanceOf(user0.address)
    );
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User2 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, ten);
    await TOKEN.connect(user2).buy(
      ten,
      1,
      1792282187,
      user2.address,
      treasury.address
    );
  });

  it("User2 stakes all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      VTOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await VTOKEN.connect(user2).deposit(await TOKEN.balanceOf(user2.address));
  });

  it("BondingCurveData, user2", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user2.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BondingCurveData, user2", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user2.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("users call get Reward on VTOKEN", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
    await rewarder.connect(user1).getReward(user1.address);
    await rewarder.connect(user2).getReward(user2.address);
  });

  it("User2 Buys TOKEN with 20 ETH", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(
      twenty,
      1,
      1892282187,
      user2.address,
      treasury.address
    );
  });

  it("User2 sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await TOKEN.connect(user2).sell(
      await TOKEN.balanceOf(user2.address),
      1,
      1792282187,
      user2.address,
      treasury.address
    );
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BondingCurveData, user2", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user2.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("Forward time by 7 day", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("users call get Reward on VTOKEN", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
    await rewarder.connect(user1).getReward(user1.address);
    await rewarder.connect(user2).getReward(user2.address);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("User1 resets vote", async function () {
    console.log("******************************************************");
    await voter.connect(user1).reset();
  });

  it("User1 repays 2 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, two);
    await TOKEN.connect(user1).repay(two);
  });

  it("User1 unstakes max available VTOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user1).withdraw(
      await VTOKEN.withdrawAvailable(user1.address)
    );
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User1 repays all BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(
      TOKEN.address,
      await TOKEN.debts(user1.address)
    );
    await TOKEN.connect(user1).repay(await TOKEN.debts(user1.address));
  });

  it("User1 unstakes max available VTOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user1).withdraw(
      await VTOKEN.withdrawAvailable(user1.address)
    );
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User1 burns 100 OTOKEN for voting power", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user1.address, oneHundred);
    await OTOKEN.connect(user1).approve(
      VTOKEN.address,
      await OTOKEN.balanceOf(user1.address)
    );
    await VTOKEN.connect(user1).burnFor(
      user1.address,
      await OTOKEN.balanceOf(user1.address)
    );
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("Forward 1 hour", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("Forward 1 hour", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("Forward 1 hour", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("Forward 1 hour", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User1 tries to borrow 1 BASE", async function () {
    console.log("******************************************************");
    await expect(TOKEN.connect(user1).borrow(one)).to.be.revertedWith(
      "TOKEN__ExceedsBorrowCreditLimit"
    );
  });

  it("TOKEN coverage testing", async function () {
    console.log("******************************************************");
    await TOKEN.getMarketPrice();
    await TOKEN.getFloorPrice();
    await expect(
      TOKEN.connect(user1).buy(ten, 1, 10, user1.address, treasury.address)
    ).to.be.revertedWith("TOKEN__SwapExpired");
    await expect(
      TOKEN.connect(user1).sell(ten, 1, 10, user1.address, treasury.address)
    ).to.be.revertedWith("TOKEN__SwapExpired");
    await expect(
      TOKEN.connect(user1).buy(
        ten,
        ten,
        1792282187,
        user1.address,
        treasury.address
      )
    ).to.be.revertedWith("TOKEN__ExceedsSwapSlippageTolerance");
    await BASE.connect(user1).approve(TOKEN.address, ten);
    await TOKEN.connect(user1).buy(
      ten,
      0,
      1792282187,
      user1.address,
      treasury.address
    );
    await expect(
      TOKEN.connect(user1).sell(
        oneThousand,
        0,
        1792282187,
        user1.address,
        treasury.address
      )
    ).to.be.revertedWith("TOKEN__ExceedsSwapMarketReserves");
    await expect(
      TOKEN.connect(user1).sell(
        five,
        ten,
        1792282187,
        user1.address,
        treasury.address
      )
    ).to.be.revertedWith("TOKEN__ExceedsSwapSlippageTolerance");
    await expect(
      TOKEN.connect(user1).buy(0, 0, 0, user1.address, treasury.address)
    ).to.be.revertedWith("TOKEN__InvalidZeroInput");
    await expect(
      TOKEN.connect(user1).sell(0, 0, 0, user1.address, treasury.address)
    ).to.be.revertedWith("TOKEN__InvalidZeroInput");
    await expect(
      TOKEN.connect(user1).exercise(0, user1.address)
    ).to.be.revertedWith("TOKEN__InvalidZeroInput");
    await expect(TOKEN.connect(user1).borrow(0)).to.be.revertedWith(
      "TOKEN__InvalidZeroInput"
    );
    await expect(TOKEN.connect(user1).repay(0)).to.be.revertedWith(
      "TOKEN__InvalidZeroInput"
    );
  });

  it("OTOKEN coverage testing", async function () {
    console.log("******************************************************");
    await expect(
      OTOKEN.connect(user1).mint(user1.address, ten)
    ).to.be.revertedWith("OTOKEN__UnauthorisedMinter");
    await expect(
      OTOKEN.connect(user1).setMinter(user1.address)
    ).to.be.revertedWith("OTOKEN__UnauthorisedMinter");
  });

  it("VTOKEN coverage testing", async function () {
    console.log("******************************************************");
    await expect(
      VTOKEN.connect(owner).addReward(BASE.address)
    ).to.be.revertedWith("VTOKENRewarder__RewardTokenAlreadyAdded");
    await expect(VTOKEN.connect(owner).deposit(0)).to.be.revertedWith(
      "VTOKEN__InvalidZeroInput"
    );
    await expect(VTOKEN.connect(owner).withdraw(0)).to.be.revertedWith(
      "VTOKEN__InvalidZeroInput"
    );
    await expect(
      rewarder.connect(owner).notifyRewardAmount(BASE.address, 1)
    ).to.be.revertedWith("VTOKENRewarder__RewardSmallerThanDuration");
    await VTOKEN.connect(user1).totalSupplyOTOKEN();
    await VTOKEN.connect(user1).balanceOfOTOKEN(user1.address);
  });

  it("Minter Coverage Testing", async function () {
    console.log("******************************************************");
    await expect(minter.connect(user1).setTeam(user1.address)).to.be.reverted;
    await minter.connect(owner).setTeam(user1.address);
    await expect(minter.connect(user1).setTeamRate(40)).to.be.reverted;
    await minter.connect(owner).setTeamRate(40);
    await expect(minter.connect(user1).setTeamRate(60)).to.be.reverted;
  });

  it("SwapCardData", async function () {
    console.log("******************************************************");
    let res = await multicall.swapCardData();
    console.log("Floor Reserve BASE: ", divDec(res.frBASE));
    console.log("Market Reserve Virtual BASE: ", divDec(res.mrvBASE));
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE));
    console.log("Market Reserve Real TOKEN: ", divDec(res.mrrTOKEN));
    console.log("Market Reserve Max TOKEN: ", divDec(res.marketMaxTOKEN));
    console.log();
    console.log("Market Reserve Real BASE: ", divDec(res.mrrBASE), res.mrrBASE);
    console.log(
      "Market Reserve Actual BASE: ",
      divDec(await BASE.balanceOf(TOKEN.address)),
      await BASE.balanceOf(TOKEN.address)
    );
    console.log(
      "Market Reserve Real TOKEN: ",
      divDec(res.mrrTOKEN),
      res.mrrTOKEN
    );
    console.log(
      "Market Reserve Actual TOKEN: ",
      divDec(await TOKEN.balanceOf(TOKEN.address)),
      await TOKEN.balanceOf(TOKEN.address)
    );
    console.log();
    console.log(
      "TOKEN supply",
      divDec(await TOKEN.totalSupply()),
      await TOKEN.totalSupply()
    );
  });

  it("User0 Buys TOKEN with 20 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, twenty);
    await TOKEN.connect(user0).buy(
      twenty,
      1,
      1792282187,
      user0.address,
      treasury.address
    );
  });

  it("User0 stakes all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      VTOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await VTOKEN.connect(user0).deposit(await TOKEN.balanceOf(user0.address));
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("Deploy new Voter contract and swap out for old one coverage", async function () {
    console.log("******************************************************");
    // initialize GaugeFactory
    const gaugeFactoryArtifact = await ethers.getContractFactory(
      "GaugeFactory"
    );
    const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(
      owner.address
    );
    gaugeFactory1 = await ethers.getContractAt(
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
    bribeFactory1 = await ethers.getContractAt(
      "BribeFactory",
      bribeFactoryContract.address
    );
    console.log("- BribeFactory Initialized");

    // initialize Voter
    const voterArtifact = await ethers.getContractFactory("Voter");
    const voterContract = await voterArtifact.deploy(
      VTOKEN.address,
      gaugeFactory1.address,
      bribeFactory1.address
    );
    voter1 = await ethers.getContractAt("Voter", voterContract.address);
    console.log("- Voter Initialized");

    // initialize Multicall
    const multicallArtifact = await ethers.getContractFactory("Multicall");
    const multicallContract = await multicallArtifact.deploy(
      voter1.address,
      BASE.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      AddressZero
    );
    multicall1 = await ethers.getContractAt(
      "Multicall",
      multicallContract.address
    );
    console.log("- Multicall Initialized");

    await gaugeFactory1.setVoter(voter1.address);
    await bribeFactory1.setVoter(voter1.address);
    await voter1.initialize(minter.address);
    await VTOKEN.setVoter(voter1.address);
    await minter.setVoter(voter1.address);
    console.log("- Voter and Multicall Initialized");
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall1.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 repays max BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(
      TOKEN.address,
      await TOKEN.debts(user0.address)
    );
    await TOKEN.connect(user0).repay(await TOKEN.debts(user0.address));
  });

  it("User0 unstakes all TOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user0).withdraw(
      await VTOKEN.balanceOfTOKEN(user0.address)
    );
  });

  it("BondingCurveData, user0", async function () {
    console.log("******************************************************");
    let res = await multicall1.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("User0 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).sell(
      await TOKEN.balanceOf(user0.address),
      1,
      1892282187,
      user0.address,
      treasury.address
    );
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter1.connect(owner).distro();
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Minter Coverage Testing", async function () {
    console.log("******************************************************");
    await minter.setGrowthRate(0);
    await minter.setTeamRate(0);
    await minter.setWeeklyRate(twoThousand);
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter1.connect(owner).distro();
    console.log(divDec(await minter.weekly()));
  });

  it("Minter Coverage Testing", async function () {
    console.log("******************************************************");
    await minter.setTailRate(twoThousand);
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter1.connect(owner).distro();
    console.log(divDec(await minter.weekly()));
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter1.connect(owner).distro();
    console.log(divDec(await minter.weekly()));
  });

  it("Minter Coverage Testing", async function () {
    console.log("******************************************************");
    await expect(minter.setWeeklyRate(twentyMillion)).to.be.revertedWith(
      "Minter__WeeklyRateTooHigh"
    );
    await expect(minter.setTailRate(0)).to.be.revertedWith(
      "Minter__TailRateTooLow"
    );
    await minter.setWeeklyRate(oneThousand);
    await minter.setTailRate(oneHundred);
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter1.connect(owner).distro();
    console.log(divDec(await minter.weekly()));
  });
});
