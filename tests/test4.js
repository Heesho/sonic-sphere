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
let minter, voter, fees, rewarder, governance, multicall, priceOracle;
let TOKEN, VTOKEN, OTOKEN, BASE;

describe("test4", function () {
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
      rewarder.address
    );
    multicall = await ethers.getContractAt(
      "Multicall",
      multicallContract.address
    );
    console.log("- Multicall Initialized");

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
    await BASE.mint(user0.address, 1000);
    await BASE.mint(user1.address, 1000);
    await BASE.mint(user2.address, 1000);
  });

  it("Quote Buy In", async function () {
    console.log("******************************************************");
    let res = await multicall.connect(owner).quoteBuyIn(ten, 9800);
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
    await TOKEN.connect(user0).buy(ten, 1, 1792282187, user0.address);
  });

  it("Quote Sell In", async function () {
    console.log("******************************************************");
    let res = await multicall.quoteSellIn(
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
      user0.address
    );
  });

  it("User0 Buys 10 TOKEN", async function () {
    console.log("******************************************************");
    let res = await multicall.connect(owner).quoteBuyOut(ten, 9700);
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
      1792282187,
      user0.address
    );
  });

  it("User0 sells TOKEN for 5 BASE", async function () {
    console.log("******************************************************");
    let res = await multicall.connect(owner).quoteSellOut(five, 9950);
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
      user0.address
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

  it("User0 stakes 1 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, one);
    await VTOKEN.connect(user0).deposit(one);
  });

  it("User0 stakes 0 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, 0);
    await expect(VTOKEN.connect(user0).deposit(0)).to.be.revertedWith(
      "VTOKEN__InvalidZeroInput"
    );
  });

  it("User0 withdraws 0 TOKEN", async function () {
    console.log("******************************************************");
    await expect(VTOKEN.connect(user0).withdraw(0)).to.be.revertedWith(
      "VTOKEN__InvalidZeroInput"
    );
  });

  it("User0 emergency exits", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user0).withdraw(
      await VTOKEN.balanceOfTOKEN(user0.address)
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

  it("User0 stakes all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      VTOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await VTOKEN.connect(user0).deposit(await TOKEN.balanceOf(user0.address));
  });

  it("User0 borrows some against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(one);
  });

  it("User0 emergency exits", async function () {
    console.log("******************************************************");
    await expect(
      VTOKEN.connect(user0).withdraw(await VTOKEN.balanceOfTOKEN(user0.address))
    ).to.be.revertedWith("VTOKEN__CollateralActive");
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

  it("Forward time by 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User0 emergency exits", async function () {
    console.log("******************************************************");
    await voter.connect(user0).reset();
    await expect(
      VTOKEN.connect(user0).withdraw(await VTOKEN.balanceOfTOKEN(user0.address))
    ).to.be.revertedWith("VTOKEN__CollateralActive");
  });

  it("User0 repays max BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(
      TOKEN.address,
      await TOKEN.debts(user0.address)
    );
    await TOKEN.connect(user0).repay(await TOKEN.debts(user0.address));
  });

  it("User0 emergency exits", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user0).withdraw(
      await VTOKEN.balanceOfTOKEN(user0.address)
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

  it("User0 stakes all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      VTOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await VTOKEN.connect(user0).deposit(await TOKEN.balanceOf(user0.address));
  });

  it("Forward time by 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(fees.address, ten);
    await voter.connect(owner).distro();
    await fees.distribute();
  });

  it("Minter Coverage", async function () {
    console.log("******************************************************");
    await expect(minter.setVoter(AddressZero)).to.be.revertedWith(
      "Minter__InvalidZeroAddress"
    );
    await expect(minter.connect(user2).setVoter(owner.address)).to.be.reverted;
    await minter.setVoter(owner.address);
    await minter.setVoter(voter.address);
    await expect(minter.connect(user2).setGrowthRate(10)).to.be.reverted;
    await expect(minter.setGrowthRate(1000000)).to.be.revertedWith(
      "Minter__GrowthRateTooHigh"
    );
    await minter.setGrowthRate(50);
  });

  it("User1 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, ten);
    await TOKEN.connect(user1).buy(ten, 1, 1792282187, user1.address);
  });

  it("User1 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, ten);
    await TOKEN.connect(user1).buy(ten, 1, 1792282187, user1.address);
  });

  it("User1 Sells 5 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(TOKEN.address, five);
    await TOKEN.connect(user1).sell(five, 1, 1792282187, user1.address);
  });

  it("User1 Sells 1 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).sell(one, 1, 1792282187, user1.address);
  });

  it("TOKEN Coverage", async function () {
    console.log("******************************************************");
  });

  it("VTOKEN Coverage", async function () {
    console.log("******************************************************");
    await expect(
      VTOKEN.connect(owner).burnFor(AddressZero, ten)
    ).to.be.revertedWith("VTOKEN__InvalidZeroAddress");
    await VTOKEN.withdrawAvailable(user0.address);
    await expect(VTOKEN.connect(user0).transfer(user1.address, one)).to.be
      .reverted;
    await VTOKEN.totalSupplyTOKEN();
    await OTOKEN.connect(owner).approve(VTOKEN.address, ten);
    await VTOKEN.connect(owner).burnFor(user1.address, ten);
  });

  it("User2 Buys TOKEN with 20 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(twenty, 1, 1792282187, user2.address);
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
      user2.address
    );
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await rewarder.left(TOKEN.address);
    await voter.connect(owner).distro();
    await fees.distribute();
  });

  it("Rewarder Coverage", async function () {
    console.log("******************************************************");
    await expect(
      rewarder.connect(user0)._deposit(ten, user0.address)
    ).to.be.revertedWith("VTOKENRewarder__NotAuthorizedVTOKEN");
    await expect(
      rewarder.connect(user0)._withdraw(one, user0.address)
    ).to.be.revertedWith("VTOKENRewarder__NotAuthorizedVTOKEN");
    await rewarder.left(TOKEN.address);
    await rewarder.totalSupply();
    await rewarder.getRewardTokens();
    await rewarder.getRewardForDuration(TOKEN.address);
    await expect(
      rewarder.connect(user1).addReward(BASE.address)
    ).to.be.revertedWith("VTOKENRewarder__NotAuthorizedVTOKEN");
  });

  it("Voter Coverage", async function () {
    console.log("******************************************************");
    await voter.getPlugins();
  });

  it("Governor Coverage", async function () {
    console.log("******************************************************");
    await governance.votingDelay();
    await governance.votingPeriod();
    await governance.quorum(10);
    await governance.proposalThreshold();
  });
});
