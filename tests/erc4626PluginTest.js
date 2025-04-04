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
let minter, voter, fees, rewarder, governance, multicall;
let TOKEN, VTOKEN, OTOKEN, BASE;

let auctionFactory, rewardAuction;

let pluginFactory;
let TEST0, XTEST0, plugin0, gauge0, bribe0;

describe.only("erc4626PluginTest", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
      await ethers.getSigners();

    // initialize BASE
    const ERC20MockArtifact = await ethers.getContractFactory("ERC20Mock");
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
    console.log("- BASE Initialized");
    TEST0 = await ERC20MockArtifact.deploy("TEST0", "TEST0");
    console.log("- TEST0 Initialized");

    const ERC4626MockArtifact = await ethers.getContractFactory("ERC4626Mock");
    XTEST0 = await ERC4626MockArtifact.deploy(
      TEST0.address,
      "XTEST0",
      "XTEST0"
    );
    console.log("- XTEST0 Initialized");

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

    // initialize AuctionFactory
    const AuctionFactoryArtifact = await ethers.getContractFactory(
      "AuctionFactory"
    );
    auctionFactory = await AuctionFactoryArtifact.deploy();
    console.log("- AuctionFactory Initialized");

    // initialize RewardAuction
    await auctionFactory.createAuction(
      oneHundred,
      false,
      TOKEN.address,
      fees.address,
      24 * 3600,
      two,
      ten
    );
    rewardAuction = await ethers.getContractAt(
      "Auction",
      await auctionFactory.last_auction()
    );
    console.log("- RewardAuction Initialized");

    // initialize pluginFactory
    const ERC4626PluginFactoryArtifact = await ethers.getContractFactory(
      "ERC4626PluginFactory"
    );
    pluginFactory = await ERC4626PluginFactoryArtifact.deploy(
      multisig.address,
      treasury.address,
      rewardAuction.address,
      auctionFactory.address
    );
    console.log("- ERC4626PluginFactory Initialized");

    // initialize plugin0
    await pluginFactory.createPlugin(
      "Protocol0 XTEST0",
      voter.address,
      XTEST0.address,
      [TEST0.address],
      oneHundred,
      24 * 3600,
      two,
      ten
    );
    plugin0 = await ethers.getContractAt(
      "ERC4626Plugin",
      await pluginFactory.lastPlugin()
    );
    console.log("- ERC4626Plugin Initialized");
    console.log("Initialization Complete");
    console.log();
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, 1000);
    await BASE.mint(user1.address, 1000);
    await BASE.mint(user2.address, 1000);
  });

  it("Test plugin0", async function () {
    console.log("******************************************************");
    console.log("Test plugin0");
    console.log();

    // Test initial state
    console.log("Testing initial state...");
    expect(await plugin0.asset()).to.equal(XTEST0.address);
    expect(await plugin0.getTvl()).to.equal(0);
    expect(await plugin0.amountReference()).to.equal(0);

    // Setup: Mint some TEST0 tokens to user0 and approve plugin0
    const depositAmount = oneHundred;
    await TEST0.mint(user0.address, depositAmount);
    await TEST0.connect(user0).approve(XTEST0.address, depositAmount);
    await XTEST0.connect(user0).deposit(depositAmount, user0.address);
    await XTEST0.connect(user0).approve(plugin0.address, depositAmount);

    // Test deposit
    console.log("Testing deposit...");
    await plugin0.connect(user0).deposit(depositAmount);
    expect(await plugin0.getTvl()).to.equal(depositAmount);
    expect(await plugin0.amountReference()).to.equal(depositAmount);
    expect(await XTEST0.balanceOf(plugin0.address)).to.equal(depositAmount);

    // Simulate yield by minting more TEST0 to XTEST0
    console.log("Testing yield generation and claim...");
    const yieldAmount = ten;
    await TEST0.mint(XTEST0.address, yieldAmount);

    // Test claim
    const beforeClaimBalance = await XTEST0.balanceOf(plugin0.address);
    await plugin0.claim();
    const afterClaimBalance = await XTEST0.balanceOf(plugin0.address);
    expect(afterClaimBalance).to.be.lt(beforeClaimBalance); // Balance should decrease as yield is withdrawn as underlying

    // Test withdraw (as owner)
    console.log("Testing withdraw...");
    const treasuryBalanceBefore = await TEST0.balanceOf(treasury.address);
    await plugin0.connect(multisig).withdraw(); // multisig is the owner
    expect(await plugin0.getTvl()).to.equal(0);
    expect(await plugin0.amountReference()).to.equal(0);
    expect(await XTEST0.balanceOf(treasury.address)).to.be.gt(
      treasuryBalanceBefore
    );

    console.log("All plugin0 tests passed!");
    console.log();
  });

  it("Test plugin0 with multiple users and initialization", async function () {
    console.log("******************************************************");
    console.log("Testing plugin0 with multiple users and initialization");
    console.log();

    // First make sure plugin is initialized
    if (!(await plugin0.getInitialized())) {
      // Add plugin to voter which will create and set gauge and bribe
      await voter.connect(owner).addPlugin(plugin0.address);

      expect(await plugin0.getGauge()).to.not.equal(AddressZero);
      expect(await plugin0.getBribe()).to.not.equal(AddressZero);

      // Initialize plugin
      await plugin0.initialize();
      expect(await plugin0.getInitialized()).to.equal(true);
    }

    // Setup initial tokens for users
    const depositAmount = oneHundred;

    // Clear any previous state
    const currentTvl = await plugin0.getTvl();
    if (currentTvl.gt(0)) {
      await plugin0.connect(multisig).withdraw();
    }

    // Setup fresh tokens and approvals for users
    await TEST0.mint(user1.address, depositAmount.mul(3)); // Extra for multiple deposits
    await TEST0.mint(user2.address, depositAmount);

    // Setup approvals for both users
    await TEST0.connect(user1).approve(XTEST0.address, depositAmount.mul(3));
    await TEST0.connect(user2).approve(XTEST0.address, depositAmount);

    // Users deposit into XTEST0 and get shares
    await XTEST0.connect(user1).deposit(depositAmount.mul(2), user1.address);
    const user1Shares = await XTEST0.balanceOf(user1.address);
    await XTEST0.connect(user2).deposit(depositAmount, user2.address);
    const user2Shares = await XTEST0.balanceOf(user2.address);
    /*
    // Approve plugin for XTEST0 shares
    await XTEST0.connect(user1).approve(plugin0.address, user1Shares);
    await XTEST0.connect(user2).approve(plugin0.address, user2Shares);

    // Test 1: Multiple users depositing
    console.log("Testing multiple user deposits...");
    const user1DepositShares = await XTEST0.convertToShares(depositAmount);
    await plugin0.connect(user1).deposit(user1DepositShares);
    const user2DepositShares = await XTEST0.convertToShares(depositAmount);
    await plugin0.connect(user2).deposit(user2DepositShares);

    // Check TVL in terms of underlying asset value
    const totalShares = await plugin0.getTvl();
    const expectedUnderlyingValue = await XTEST0.convertToAssets(totalShares);
    expect(expectedUnderlyingValue).to.equal(depositAmount.mul(2));

    // Test 2: Simulate yield generation
    console.log("Testing yield generation...");
    const yieldAmount = oneHundred;
    await TEST0.mint(XTEST0.address, yieldAmount);

    // Test 3: Claim yield
    console.log("Testing yield claim...");
    const beforeClaimShares = await XTEST0.balanceOf(plugin0.address);
    const beforeClaimUnderlying = await XTEST0.convertToAssets(
      beforeClaimShares
    );
    await plugin0.claim();
    const afterClaimShares = await XTEST0.balanceOf(plugin0.address);
    const afterClaimUnderlying = await XTEST0.convertToAssets(afterClaimShares);
    expect(afterClaimUnderlying).to.be.lt(beforeClaimUnderlying);

    // Test 4: Additional deposit after yield
    console.log("Testing deposit after yield...");
    await XTEST0.connect(user1).deposit(depositAmount, user1.address);
    const additionalShares = await XTEST0.convertToShares(depositAmount);
    await XTEST0.connect(user1).approve(plugin0.address, additionalShares);
    await plugin0.connect(user1).deposit(additionalShares);

    console.log("All additional plugin0 tests passed!");
    console.log();
    */
  });
  /*
  it("Test plugin0 security and limits", async function () {
    console.log("******************************************************");
    console.log("Testing plugin0 security and limits");
    console.log();

    // Test 1: Only owner can withdraw
    console.log("Testing unauthorized withdrawal...");
    await expect(plugin0.connect(user0).withdraw()).to.be.reverted;

    // Test 2: Cannot distribute asset token
    console.log("Testing asset distribution restriction...");
    await expect(plugin0.distribute([XTEST0.address])).to.be.reverted;

    // Test 3: Only voter can set gauge
    console.log("Testing gauge setting restrictions...");
    await gaugeFactory.createGauge(plugin0.address, false); // Add the required second parameter
    const newGaugeAddress = await gaugeFactory.last_gauge();
    await expect(plugin0.connect(user0).setGauge(newGaugeAddress)).to.be
      .reverted;

    // Test 4: Verify core parameters
    console.log("Testing core parameters...");
    expect(await plugin0.asset()).to.equal(XTEST0.address);
    expect(await plugin0.voter()).to.equal(voter.address);
    expect(await plugin0.owner()).to.equal(multisig.address);
    expect(await plugin0.getTreasury()).to.equal(treasury.address);
    expect(await plugin0.GAUGE_DEPOSIT_AMOUNT()).to.equal(one);

    // Test 5: Verify auction settings
    console.log("Testing auction settings...");
    expect(await plugin0.getAssetAuction()).to.not.equal(AddressZero);
    expect(await plugin0.getRewardAuction()).to.not.equal(AddressZero);

    console.log("All security and limit tests passed!");
    console.log();
  });
  */
});
