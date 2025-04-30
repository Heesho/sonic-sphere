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
let minter, voter, fees, rewarder, governance, multicall, controller;
let TOKEN, VTOKEN, OTOKEN, BASE;

let auctionFactory, rewardAuction;

let pluginFactory;
let TEST0, XTEST0, plugin0, gauge0, bribe0, auction0;

describe("erc4626PluginTest", function () {
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

    // initialize Multicall
    const multicallArtifact = await ethers.getContractFactory("Multicall");
    const multicallContract = await multicallArtifact.deploy(
      voter.address,
      BASE.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      rewardAuction.address
    );
    multicall = await ethers.getContractAt(
      "Multicall",
      multicallContract.address
    );
    console.log("- Multicall Initialized");

    const controllerArtifact = await ethers.getContractFactory("Controller");
    controller = await controllerArtifact.deploy(voter.address, fees.address);
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
    await BASE.mint(user0.address, oneThousand);
    await BASE.mint(user1.address, oneThousand);
    await BASE.mint(user2.address, oneThousand);
  });

  it("Setup emissions for plugin0", async function () {
    console.log("******************************************************");
    console.log("Setting up emissions for plugin0");
    console.log();

    // Add plugin to voter which will create and set gauge and bribe
    await voter.connect(owner).addPlugin(plugin0.address);

    // First get some BASE to purchase TOKEN
    const baseAmount = oneThousand;
    await BASE.mint(user0.address, baseAmount);
    await BASE.connect(user0).approve(TOKEN.address, baseAmount);

    // Purchase TOKEN
    console.log("Purchasing TOKEN...");
    await TOKEN.connect(user0).buy(
      baseAmount,
      1,
      1792282187,
      user0.address,
      AddressZero
    );
    const tokenBalance = await TOKEN.balanceOf(user0.address);
    console.log("TOKEN purchased:", ethers.utils.formatUnits(tokenBalance, 18));

    // Stake TOKEN for vTOKEN
    console.log("\nStaking TOKEN for vTOKEN...");
    await TOKEN.connect(user0).approve(VTOKEN.address, tokenBalance);
    await VTOKEN.connect(user0).deposit(tokenBalance);
    const vTokenBalance = await VTOKEN.balanceOf(user0.address);
    console.log(
      "vTOKEN received:",
      ethers.utils.formatUnits(vTokenBalance, 18)
    );

    // Vote for plugin0
    console.log("\nVoting for plugin0...");
    await voter.connect(user0).vote([plugin0.address], [vTokenBalance]);

    // Verify the vote
    const weight = await voter.weights(plugin0.address);
    console.log("Voting weight:", ethers.utils.formatUnits(weight, 18));

    // Get updated plugin data
    const pluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );
    console.log("\nUpdated Plugin Details:");
    console.log(
      "- Voting Weight:",
      ethers.utils.formatUnits(pluginCard.votingWeight, 18),
      "%"
    );
    console.log(
      "- Offered OTOKEN:",
      ethers.utils.formatUnits(pluginCard.offeredOTOKEN, 18)
    );

    expect(weight).to.equal(vTokenBalance);
    console.log("\nEmissions setup complete!");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
    await fees.distribute();
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

    expect(await plugin0.getGauge()).to.not.equal(AddressZero);
    expect(await plugin0.getBribe()).to.not.equal(AddressZero);

    gauge0 = await ethers.getContractAt("Gauge", await plugin0.getGauge());

    bribe0 = await ethers.getContractAt("Bribe", await plugin0.getBribe());

    // Initialize plugin
    await plugin0.initialize();
    expect(await plugin0.getInitialized()).to.equal(true);

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

    // Approve plugin for XTEST0 shares
    await XTEST0.connect(user1).approve(plugin0.address, user1Shares);
    await XTEST0.connect(user2).approve(plugin0.address, user2Shares);

    // Test 1: Multiple users depositing
    console.log("Testing multiple user deposits...");
    await plugin0.connect(user1).deposit(user1Shares);
    await plugin0.connect(user2).deposit(user2Shares);

    // Check TVL in terms of underlying asset value
    const totalShares = await plugin0.getTvl();
    expect(totalShares).to.equal(user1Shares.add(user2Shares));

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
  });

  it("Test plugin0 withdraw access control inheritance", async function () {
    console.log("******************************************************");
    console.log("Testing plugin0 withdraw access control inheritance");
    console.log();

    // First deposit some tokens to have something to withdraw
    const depositAmount = oneHundred;
    await TEST0.mint(user1.address, depositAmount);
    await TEST0.connect(user1).approve(XTEST0.address, depositAmount);
    await XTEST0.connect(user1).deposit(depositAmount, user1.address);
    const shares = await XTEST0.balanceOf(user1.address);
    await XTEST0.connect(user1).approve(plugin0.address, shares);
    await plugin0.connect(user1).deposit(shares);

    // Test that non-owner cannot withdraw
    console.log("Testing withdraw from non-owner account...");
    await expect(plugin0.connect(user0).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(plugin0.connect(user1).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // Test that owner (multisig) can withdraw
    console.log("Testing withdraw from owner account...");
    await plugin0.connect(multisig).withdraw();
    expect(await plugin0.getTvl()).to.equal(0);
    expect(await plugin0.amountReference()).to.equal(0);

    console.log("All withdraw access control tests passed!");
    console.log();
  });

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
    await expect(plugin0.connect(user0).setGauge(TEST0.address)).to.be.reverted;

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

  it("Clear plugin0 tvl for asset auction testing", async function () {
    console.log("******************************************************");
    console.log("Clear plugin0 tvl for asset auction testing");
    console.log();

    await plugin0.connect(multisig).withdraw();
    expect(await plugin0.getTvl()).to.equal(0);
  });

  it("Test plugin0 parameters via multicall", async function () {
    console.log("******************************************************");
    console.log("Testing plugin0 parameters via multicall");
    console.log();

    const pluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );

    console.log("Plugin Details:");
    console.log("- Name:", pluginCard.name);
    console.log("- Asset:", pluginCard.asset);
    console.log("- Gauge:", pluginCard.gauge);
    console.log("- Bribe:", pluginCard.bribe);
    console.log("- Asset Auction:", pluginCard.assetAuction);
    console.log("- Reward Auction:", pluginCard.rewardAuction);
    console.log("- Treasury:", pluginCard.treasury);
    console.log("- TVL:", ethers.utils.formatUnits(pluginCard.tvl, 18));
    console.log(
      "- Voting Weight:",
      ethers.utils.formatUnits(pluginCard.votingWeight, 18),
      "%"
    );

    console.log("\nAuction Parameters:");
    console.log(
      "- Epoch Duration:",
      pluginCard.auctionEpochDuration.toString(),
      "seconds"
    );
    console.log(
      "- Price Multiplier:",
      ethers.utils.formatUnits(pluginCard.auctionPriceMultiplier, 18)
    );
    console.log(
      "- Min Init Price:",
      ethers.utils.formatUnits(pluginCard.auctionMinInitPrice, 18)
    );
    console.log("- Current Epoch:", pluginCard.auctionEpoch.toString());
    console.log(
      "- Current Init Price:",
      ethers.utils.formatUnits(pluginCard.auctionInitPrice, 18)
    );
    console.log(
      "- Start Time:",
      new Date(pluginCard.auctionStartTime * 1000).toLocaleString()
    );
    console.log(
      "- Current Price:",
      ethers.utils.formatUnits(pluginCard.auctionPrice, 18)
    );
    console.log(
      "- Offered OTOKEN:",
      ethers.utils.formatUnits(pluginCard.offeredOTOKEN, 18)
    );

    console.log("\nStatus:");
    console.log("- Is Alive:", pluginCard.isAlive);
    console.log("- Is Initialized:", pluginCard.isInitialized);
  });

  it("Forward time by 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
    await fees.distribute();
  });

  it("Test plugin0 parameters via multicall", async function () {
    console.log("******************************************************");
    console.log("Testing plugin0 parameters via multicall");
    console.log();

    const pluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );

    console.log("Plugin Details:");
    console.log("- Name:", pluginCard.name);
    console.log("- Asset:", pluginCard.asset);
    console.log("- Gauge:", pluginCard.gauge);
    console.log("- Bribe:", pluginCard.bribe);
    console.log("- Asset Auction:", pluginCard.assetAuction);
    console.log("- Reward Auction:", pluginCard.rewardAuction);
    console.log("- Treasury:", pluginCard.treasury);
    console.log("- TVL:", ethers.utils.formatUnits(pluginCard.tvl, 18));
    console.log(
      "- Voting Weight:",
      ethers.utils.formatUnits(pluginCard.votingWeight, 18),
      "%"
    );

    console.log("\nAuction Parameters:");
    console.log(
      "- Epoch Duration:",
      pluginCard.auctionEpochDuration.toString(),
      "seconds"
    );
    console.log(
      "- Price Multiplier:",
      ethers.utils.formatUnits(pluginCard.auctionPriceMultiplier, 18)
    );
    console.log(
      "- Min Init Price:",
      ethers.utils.formatUnits(pluginCard.auctionMinInitPrice, 18)
    );
    console.log("- Current Epoch:", pluginCard.auctionEpoch.toString());
    console.log(
      "- Current Init Price:",
      ethers.utils.formatUnits(pluginCard.auctionInitPrice, 18)
    );
    console.log(
      "- Start Time:",
      new Date(pluginCard.auctionStartTime * 1000).toLocaleString()
    );
    console.log(
      "- Current Price:",
      ethers.utils.formatUnits(pluginCard.auctionPrice, 18)
    );
    console.log(
      "- Offered OTOKEN:",
      ethers.utils.formatUnits(pluginCard.offeredOTOKEN, 18)
    );

    console.log("\nStatus:");
    console.log("- Is Alive:", pluginCard.isAlive);
    console.log("- Is Initialized:", pluginCard.isInitialized);
  });

  it("Buy from plugin0's asset auction", async function () {
    console.log("******************************************************");
    console.log("Testing buying from plugin0's asset auction");
    console.log();

    // First claim OTOKEN from gauge to plugin
    console.log("Claiming OTOKEN from gauge to plugin...");
    await gauge0.getReward(plugin0.address);

    // Get auction details before purchase
    const pluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );
    auction0 = await ethers.getContractAt("Auction", pluginCard.assetAuction);
    const currentPrice = await auction0.getPrice();
    const currentEpoch = (await auction0.getSlot0()).epochId;

    console.log("Pre-Purchase Auction State:");
    console.log("- Current Price:", ethers.utils.formatUnits(currentPrice, 18));
    console.log(
      "- OTOKEN Available:",
      ethers.utils.formatUnits(pluginCard.offeredOTOKEN, 18)
    );

    // Get enough TEST0 to cover auction price
    await TEST0.mint(user1.address, currentPrice.mul(2)); // Extra for buffer
    await TEST0.connect(user1).approve(XTEST0.address, currentPrice.mul(2));
    await XTEST0.connect(user1).deposit(currentPrice.mul(2), user1.address);

    // Approve auction to spend XTEST0
    await XTEST0.connect(user1).approve(auction0.address, currentPrice);

    // Buy from auction with proper parameters
    console.log("\nPurchasing from auction...");
    const deadline = 1792282187;
    await plugin0.connect(user1).distribute([OTOKEN.address]);
    await auction0.connect(user1).buy(
      [OTOKEN.address], // assets to buy
      user1.address, // assets receiver
      currentEpoch, // current epoch id
      deadline, // deadline
      currentPrice // max payment amount
    );

    // Get post-purchase state
    const postPluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );
    console.log("\nPost-Purchase Auction State:");
    console.log(
      "- Current Price:",
      ethers.utils.formatUnits(postPluginCard.auctionPrice, 18)
    );
    console.log(
      "- OTOKEN Remaining:",
      ethers.utils.formatUnits(postPluginCard.offeredOTOKEN, 18)
    );

    // Verify user received OTOKEN
    const userOtokenBalance = await OTOKEN.balanceOf(user1.address);
    console.log(
      "\nUser's OTOKEN balance:",
      ethers.utils.formatUnits(userOtokenBalance, 18)
    );

    expect(postPluginCard.offeredOTOKEN).to.be.lt(pluginCard.offeredOTOKEN);
    expect(userOtokenBalance).to.be.gt(0);

    console.log("\nAuction purchase complete!");
  });

  it("Forward time and buy from auction again", async function () {
    console.log("******************************************************");
    console.log("Testing second auction purchase after time delay");
    console.log();

    // Forward time by 1 hours to see price change
    await network.provider.send("evm_increaseTime", [3600]);
    await network.provider.send("evm_mine");

    // Claim new OTOKEN rewards from gauge to plugin
    console.log("Claiming OTOKEN from gauge to plugin...");
    await plugin0.connect(user2).distribute([OTOKEN.address]);

    // Get auction details before purchase
    const pluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );
    const currentPrice = await auction0.getPrice();
    const currentEpoch = (await auction0.getSlot0()).epochId;

    console.log("Pre-Purchase Auction State:");
    console.log("- Current Price:", ethers.utils.formatUnits(currentPrice, 18));
    console.log(
      "- OTOKEN Available:",
      ethers.utils.formatUnits(pluginCard.offeredOTOKEN, 18)
    );

    console.log(
      "User2 TEST0 Balance: ",
      divDec(await TEST0.balanceOf(user2.address))
    );
    // Get enough TEST0 to cover auction price for user2 this time
    await TEST0.mint(user2.address, currentPrice.mul(3)); // Extra for buffer
    console.log(
      "User2 TEST0 Balance: ",
      divDec(await TEST0.balanceOf(user2.address))
    );
    await TEST0.connect(user2).approve(XTEST0.address, currentPrice.mul(3));
    await XTEST0.connect(user2).deposit(currentPrice.mul(3), user2.address);

    // Approve auction to spend XTEST0
    console.log(
      "User2 XTEST0 Balance: ",
      divDec(await XTEST0.balanceOf(user2.address))
    );
    await XTEST0.connect(user2).approve(auction0.address, currentPrice);

    // Buy from auction with proper parameters
    console.log("\nPurchasing from auction...");
    const deadline = 1792282187; // 1 hour from now
    await plugin0.connect(user2).distribute([OTOKEN.address]);
    await auction0
      .connect(user2)
      .buy(
        [OTOKEN.address],
        user2.address,
        currentEpoch,
        deadline,
        currentPrice
      );

    // Get post-purchase state
    const postPluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );
    console.log("\nPost-Purchase Auction State:");
    console.log(
      "- Current Price:",
      ethers.utils.formatUnits(postPluginCard.auctionPrice, 18)
    );
    console.log(
      "- OTOKEN Remaining:",
      ethers.utils.formatUnits(postPluginCard.offeredOTOKEN, 18)
    );

    // Verify user received OTOKEN
    const userOtokenBalance = await OTOKEN.balanceOf(user2.address);
    console.log(
      "\nUser2's OTOKEN balance:",
      ethers.utils.formatUnits(userOtokenBalance, 18)
    );

    expect(postPluginCard.offeredOTOKEN).to.be.lt(pluginCard.offeredOTOKEN);
    expect(userOtokenBalance).to.be.gt(0);

    console.log("\nSecond auction purchase complete!");
  });

  it("Add more yield and distribute via Controller", async function () {
    console.log("******************************************************");
    console.log("Testing yield and distribution via Controller");
    console.log();

    // First check current state
    const beforeYieldTVL = await plugin0.getTvl();
    const beforeYieldRef = await plugin0.amountReference();
    console.log("Initial State:");
    console.log("- TVL:", ethers.utils.formatUnits(beforeYieldTVL, 18));
    console.log(
      "- Reference Amount:",
      ethers.utils.formatUnits(beforeYieldRef, 18)
    );
    console.log(
      "- Plugin XTEST0 Balance:",
      ethers.utils.formatUnits(await XTEST0.balanceOf(plugin0.address), 18)
    );
    console.log(
      "- Plugin TEST0 Balance:",
      ethers.utils.formatUnits(await TEST0.balanceOf(plugin0.address), 18)
    );
    console.log(
      "- RewardAuction TEST0 Balance:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- Asset Auction OTOKEN Balance:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(auction0.address), 18)
    );

    // Add yield by minting more TEST0 to XTEST0
    console.log("\nAdding yield...");
    const yieldAmount = oneHundred;
    await TEST0.mint(XTEST0.address, yieldAmount);

    // Check state after yield but before claim
    console.log("\nState after yield (before claim):");
    console.log("- TVL:", ethers.utils.formatUnits(await plugin0.getTvl(), 18));
    console.log(
      "- Reference Amount:",
      ethers.utils.formatUnits(await plugin0.amountReference(), 18)
    );
    console.log(
      "- Plugin XTEST0 Balance:",
      ethers.utils.formatUnits(await XTEST0.balanceOf(plugin0.address), 18)
    );
    console.log(
      "- Plugin TEST0 Balance:",
      ethers.utils.formatUnits(await TEST0.balanceOf(plugin0.address), 18)
    );
    console.log(
      "- XTEST0 Total Assets:",
      ethers.utils.formatUnits(await XTEST0.totalAssets(), 18)
    );

    // Distribute via Controller
    console.log("\nCklaiming and Distributing via Controller...");
    await controller.distributeToAuctions();
    // await plugin0.claim();
    // await plugin0.distribute([OTOKEN.address, TEST0.address]);
    // console.log("TEST0 address: ", TEST0.address);
    // console.log("Plugin Reward Tokens: ", await plugin0.getRewardTokens());

    // Check final state
    const afterYieldTVL = await plugin0.getTvl();
    const afterYieldRef = await plugin0.amountReference();
    console.log("\nFinal State:");
    console.log("- TVL:", ethers.utils.formatUnits(afterYieldTVL, 18));
    console.log(
      "- Reference Amount:",
      ethers.utils.formatUnits(afterYieldRef, 18)
    );
    console.log(
      "- Plugin XTEST0 Balance:",
      ethers.utils.formatUnits(await XTEST0.balanceOf(plugin0.address), 18)
    );
    console.log(
      "- Plugin TEST0 Balance:",
      ethers.utils.formatUnits(await TEST0.balanceOf(plugin0.address), 18)
    );
    console.log(
      "- RewardAuction TEST0 Balance:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- Asset Auction OTOKEN Balance:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(auction0.address), 18)
    );

    // Verify the distribution worked correctly
    expect(afterYieldRef).to.equal(beforeYieldRef); // Reference amount should stay the same
    expect(await TEST0.balanceOf(rewardAuction.address)).to.be.gt(0); // RewardAuction should have received yield in TEST0
    expect(await OTOKEN.balanceOf(auction0.address)).to.be.gt(0); // Asset Auction should have received OTOKEN

    console.log("\nYield claim and distribution complete!");
  });

  it("Buy from auction after 2 hour delay", async function () {
    console.log("******************************************************");
    console.log("Testing auction purchase after 2 hour delay");
    console.log();

    // Forward time by 2 hours
    await network.provider.send("evm_increaseTime", [2 * 3600]);
    await network.provider.send("evm_mine");

    // Get auction details before purchase
    const pluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );
    const currentPrice = await auction0.getPrice();
    const currentEpoch = (await auction0.getSlot0()).epochId;

    console.log("Pre-Purchase Auction State:");
    console.log("- Current Price:", ethers.utils.formatUnits(currentPrice, 18));
    console.log(
      "- OTOKEN Available:",
      ethers.utils.formatUnits(pluginCard.offeredOTOKEN, 18)
    );
    console.log("- Current Epoch:", currentEpoch.toString());

    // Get enough TEST0 to cover auction price for user1
    await TEST0.mint(user1.address, currentPrice.mul(2)); // Extra for buffer
    await TEST0.connect(user1).approve(XTEST0.address, currentPrice.mul(2));
    await XTEST0.connect(user1).deposit(currentPrice.mul(2), user1.address);

    // Approve auction to spend XTEST0
    await XTEST0.connect(user1).approve(auction0.address, currentPrice);

    // Buy from auction with proper parameters
    console.log("\nPurchasing from auction...");
    const deadline = 1792282187;
    await controller.distribute();
    await auction0
      .connect(user1)
      .buy(
        [OTOKEN.address],
        user1.address,
        currentEpoch,
        deadline,
        currentPrice
      );

    // Get post-purchase state
    const postPluginCard = await multicall.pluginCardData(
      plugin0.address,
      user0.address
    );
    console.log("\nPost-Purchase Auction State:");
    console.log(
      "- New Price:",
      ethers.utils.formatUnits(postPluginCard.auctionPrice, 18)
    );
    console.log(
      "- OTOKEN Remaining:",
      ethers.utils.formatUnits(postPluginCard.offeredOTOKEN, 18)
    );
    console.log(
      "- User1 OTOKEN Balance:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(user1.address), 18)
    );
    console.log("- New Epoch:", (await auction0.getSlot0()).epochId.toString());

    expect(postPluginCard.offeredOTOKEN).to.be.lt(pluginCard.offeredOTOKEN);
    expect(await OTOKEN.balanceOf(user1.address)).to.be.gt(0);

    console.log("\nAuction purchase complete!");
  });
});
