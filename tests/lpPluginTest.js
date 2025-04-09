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
let TEST0, TEST1, LP0, plugin0, gauge0, bribe0, auction0;

let router;

describe("lpPluginTest", function () {
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
    TEST1 = await ERC20MockArtifact.deploy("TEST1", "TEST1");
    console.log("- TEST1 Initialized");

    const LPMockArtifact = await ethers.getContractFactory("LPMock");
    LP0 = await LPMockArtifact.deploy(
      "LP0",
      "LP0",
      TEST0.address,
      TEST1.address
    );
    console.log("- LP0 Initialized");

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
    const LPPluginFactoryArtifact = await ethers.getContractFactory(
      "LPPluginFactory"
    );
    pluginFactory = await LPPluginFactoryArtifact.deploy(
      multisig.address,
      treasury.address,
      rewardAuction.address,
      auctionFactory.address
    );
    console.log("- LPPluginFactory Initialized");

    // initialize plugin0
    await pluginFactory.createPlugin(
      "Protocol0 LP0",
      voter.address,
      LP0.address,
      [TEST0.address, TEST1.address],
      oneHundred,
      24 * 3600,
      two,
      ten
    );
    plugin0 = await ethers.getContractAt(
      "LPPlugin",
      await pluginFactory.lastPlugin()
    );
    console.log("- LPPlugin Initialized");
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
    await TOKEN.connect(user0).buy(baseAmount, 1, 1792282187, user0.address);
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
    const pluginCard = await multicall.pluginCardData(plugin0.address);
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

  it("Initialize plugin0", async function () {
    console.log("******************************************************");
    console.log("Initializing plugin0");
    console.log();

    // Get auction0 address from plugin
    auction0 = await ethers.getContractAt(
      "Auction",
      await plugin0.getAssetAuction()
    );
    console.log("- Asset Auction:", auction0.address);

    // Initialize plugin
    await plugin0.connect(multisig).initialize();
    console.log("- Plugin initialized");

    // Verify initialization
    expect(await plugin0.getInitialized()).to.be.true;
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await controller.distribute();
  });

  it("Forward time to start new epoch", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]); // 7 days
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await controller.distribute();
  });

  it("Test LP plugin deposit and fee claiming", async function () {
    console.log("******************************************************");
    console.log("Testing LP plugin deposits and fee claiming");
    console.log();

    // Mint LP tokens to plugin for fees to accumulate
    const depositAmount = oneHundred;
    await LP0.mint(plugin0.address, depositAmount);
    console.log(
      "Minted",
      ethers.utils.formatUnits(depositAmount, 18),
      "LP0 to plugin"
    );

    // Mint reward tokens to LP contract
    await TEST0.mint(LP0.address, oneThousand);
    await TEST1.mint(LP0.address, oneThousand);
    console.log("\nMinted rewards to LP contract:");
    console.log("- TEST0:", ethers.utils.formatUnits(oneThousand, 18));
    console.log("- TEST1:", ethers.utils.formatUnits(oneThousand, 18));

    // Check initial states
    const preClaim0 = await TEST0.balanceOf(plugin0.address);
    const preClaim1 = await TEST1.balanceOf(plugin0.address);

    console.log("\nPre-claim balances:");
    console.log("- TEST0:", ethers.utils.formatUnits(preClaim0, 18));
    console.log("- TEST1:", ethers.utils.formatUnits(preClaim1, 18));

    // Claim fees
    await plugin0.connect(multisig).claim();

    // Check post-claim balances
    const postClaim0 = await TEST0.balanceOf(plugin0.address);
    const postClaim1 = await TEST1.balanceOf(plugin0.address);

    console.log("\nPost-claim balances:");
    console.log("- TEST0:", ethers.utils.formatUnits(postClaim0, 18));
    console.log("- TEST1:", ethers.utils.formatUnits(postClaim1, 18));

    // Verify received correct amounts (5 TEST0 and 2 TEST1 as per LPMock)
    expect(postClaim0.sub(preClaim0)).to.equal(convert("5", 18));
    expect(postClaim1.sub(preClaim1)).to.equal(convert("2", 18));
  });

  it("Test reward distribution to auctions", async function () {
    console.log("******************************************************");
    console.log("Testing reward distribution to auctions");
    console.log();

    // Get initial auction balances
    const preDistribute0 = await TEST0.balanceOf(rewardAuction.address);
    const preDistribute1 = await TEST1.balanceOf(rewardAuction.address);

    console.log("Pre-distribution auction balances:");
    console.log("- TEST0:", ethers.utils.formatUnits(preDistribute0, 18));
    console.log("- TEST1:", ethers.utils.formatUnits(preDistribute1, 18));

    // Distribute rewards
    await plugin0.connect(multisig).distribute([TEST0.address, TEST1.address]);

    // Check post-distribution balances
    const postDistribute0 = await TEST0.balanceOf(rewardAuction.address);
    const postDistribute1 = await TEST1.balanceOf(rewardAuction.address);

    console.log("\nPost-distribution auction balances:");
    console.log("- TEST0:", ethers.utils.formatUnits(postDistribute0, 18));
    console.log("- TEST1:", ethers.utils.formatUnits(postDistribute1, 18));

    // Verify rewards were sent to auction
    expect(postDistribute0).to.be.gt(preDistribute0);
    expect(postDistribute1).to.be.gt(preDistribute1);
  });

  it("Test owner withdrawal", async function () {
    console.log("******************************************************");
    console.log("Testing owner withdrawal functionality");
    console.log();

    // Try withdraw from non-owner (should fail)
    await expect(plugin0.connect(user1).withdraw()).to.be.reverted;
    console.log("Non-owner withdrawal correctly reverted");

    // Get initial states
    const initialBalance = await LP0.balanceOf(treasury.address);
    const initialPluginBalance = await LP0.balanceOf(plugin0.address);

    console.log("\nInitial State:");
    console.log(
      "- Treasury LP0 Balance:",
      ethers.utils.formatUnits(initialBalance, 18)
    );
    console.log(
      "- Plugin LP0 Balance:",
      ethers.utils.formatUnits(initialPluginBalance, 18)
    );

    // Owner withdraws
    await plugin0.connect(multisig).withdraw();

    // Check final states
    const finalBalance = await LP0.balanceOf(treasury.address);
    const finalPluginBalance = await LP0.balanceOf(plugin0.address);

    console.log("\nPost-Withdrawal State:");
    console.log(
      "- Treasury LP0 Balance:",
      ethers.utils.formatUnits(finalBalance, 18)
    );
    console.log(
      "- Plugin LP0 Balance:",
      ethers.utils.formatUnits(finalPluginBalance, 18)
    );

    // Verify states
    expect(finalBalance).to.be.gt(initialBalance);
    expect(finalPluginBalance).to.equal(0);
    expect(await plugin0.getTvl()).to.equal(0);
  });

  it("Test multiple fee claims and distributions", async function () {
    console.log("******************************************************");
    console.log("Testing multiple fee claims and distributions");
    console.log();

    // Mint more LP tokens to plugin
    await LP0.mint(plugin0.address, oneHundred);

    // Mint more rewards to LP contract
    await TEST0.mint(LP0.address, oneThousand);
    await TEST1.mint(LP0.address, oneThousand);

    // First claim
    console.log("First claim cycle:");
    const preClaim0 = await TEST0.balanceOf(plugin0.address);
    const preClaim1 = await TEST1.balanceOf(plugin0.address);

    await plugin0.connect(multisig).claim();

    const postClaim0 = await TEST0.balanceOf(plugin0.address);
    const postClaim1 = await TEST1.balanceOf(plugin0.address);

    console.log(
      "- TEST0 claimed:",
      ethers.utils.formatUnits(postClaim0.sub(preClaim0), 18)
    );
    console.log(
      "- TEST1 claimed:",
      ethers.utils.formatUnits(postClaim1.sub(preClaim1), 18)
    );

    // Forward time
    await network.provider.send("evm_increaseTime", [3600]); // 1 hour
    await network.provider.send("evm_mine");

    // Second claim
    console.log("\nSecond claim cycle:");
    const preClaim2_0 = await TEST0.balanceOf(plugin0.address);
    const preClaim2_1 = await TEST1.balanceOf(plugin0.address);

    await plugin0.connect(multisig).claim();

    const postClaim2_0 = await TEST0.balanceOf(plugin0.address);
    const postClaim2_1 = await TEST1.balanceOf(plugin0.address);

    console.log(
      "- TEST0 claimed:",
      ethers.utils.formatUnits(postClaim2_0.sub(preClaim2_0), 18)
    );
    console.log(
      "- TEST1 claimed:",
      ethers.utils.formatUnits(postClaim2_1.sub(preClaim2_1), 18)
    );

    // Distribute all accumulated rewards
    console.log("\nDistributing accumulated rewards...");
    await plugin0.connect(multisig).distribute([TEST0.address, TEST1.address]);

    // Verify reward auction received both sets of rewards
    const auctionBalance0 = await TEST0.balanceOf(rewardAuction.address);
    const auctionBalance1 = await TEST1.balanceOf(rewardAuction.address);
    console.log("Reward Auction balances:");
    console.log("- TEST0:", ethers.utils.formatUnits(auctionBalance0, 18));
    console.log("- TEST1:", ethers.utils.formatUnits(auctionBalance1, 18));

    expect(auctionBalance0).to.be.gt(0);
    expect(auctionBalance1).to.be.gt(0);
  });

  it("Test OTOKEN distribution to asset auction", async function () {
    console.log("******************************************************");
    console.log("Testing OTOKEN distribution to asset auction");
    console.log();

    // Forward time to accumulate OTOKEN
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]); // 7 days
    await network.provider.send("evm_mine");

    // Call distribute to get OTOKEN from gauge
    const preDistribute = await OTOKEN.balanceOf(auction0.address);
    await plugin0.connect(multisig).distribute([OTOKEN.address]);
    const postDistribute = await OTOKEN.balanceOf(auction0.address);

    console.log("OTOKEN distribution:");
    console.log(
      "- Pre-distribute:",
      ethers.utils.formatUnits(preDistribute, 18)
    );
    console.log(
      "- Post-distribute:",
      ethers.utils.formatUnits(postDistribute, 18)
    );
    console.log(
      "- Amount distributed:",
      ethers.utils.formatUnits(postDistribute.sub(preDistribute), 18)
    );

    expect(postDistribute).to.be.gt(preDistribute);
  });

  it("Test distribution restrictions", async function () {
    console.log("******************************************************");
    console.log("Testing distribution restrictions");
    console.log();

    // Try to distribute LP token (should fail)
    await expect(
      plugin0.connect(multisig).distribute([LP0.address])
    ).to.be.revertedWith("Plugin__CannotDistributeAsset");
    console.log("LP token distribution correctly reverted");

    // Try to distribute non-reward token (should succeed but no effect)
    const randomToken = await (
      await ethers.getContractFactory("ERC20Mock")
    ).deploy("RANDOM", "RANDOM");
    await plugin0.connect(multisig).distribute([randomToken.address]);
    console.log("Non-reward token distribution handled correctly");
  });

  it("Test plugin parameters via multicall", async function () {
    console.log("******************************************************");
    console.log("Testing plugin parameters via multicall");
    console.log();

    const pluginCard = await multicall.pluginCardData(plugin0.address);

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

    // Verify key parameters
    expect(pluginCard.asset).to.equal(LP0.address);
    expect(pluginCard.assetAuction).to.equal(auction0.address);
    expect(pluginCard.rewardAuction).to.equal(rewardAuction.address);
    expect(pluginCard.treasury).to.equal(treasury.address);
  });

  it("Test reward auction purchases", async function () {
    console.log("******************************************************");
    console.log("Testing reward auction purchases");
    console.log();

    // First buy at zero price to reset auction
    const initialPrice = await rewardAuction.getPrice();
    const initialEpoch = (await rewardAuction.getSlot0()).epochId;
    console.log("Initial auction state:");
    console.log("- Price:", ethers.utils.formatUnits(initialPrice, 18));
    console.log("- Epoch:", initialEpoch.toString());

    // Buy at zero price
    await rewardAuction
      .connect(user1)
      .buy(
        [TEST0.address, TEST1.address],
        user1.address,
        initialEpoch,
        1792282187,
        initialPrice
      );

    // Now add new rewards to the auction
    await LP0.mint(plugin0.address, oneHundred);
    await TEST0.mint(LP0.address, oneThousand);
    await TEST1.mint(LP0.address, oneThousand);
    await plugin0.connect(multisig).claim();
    await plugin0.connect(multisig).distribute([TEST0.address, TEST1.address]);

    // Get new auction states
    const currentPrice = await rewardAuction.getPrice();
    const currentEpoch = (await rewardAuction.getSlot0()).epochId;

    console.log("\nNew auction state after rewards added:");
    console.log("- Current Price:", ethers.utils.formatUnits(currentPrice, 18));
    console.log("- Current Epoch:", currentEpoch.toString());
    console.log(
      "- TEST0 Available:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- TEST1 Available:",
      ethers.utils.formatUnits(await TEST1.balanceOf(rewardAuction.address), 18)
    );

    // Get BASE and buy TOKEN for auction payment
    const baseAmount = oneThousand;
    await BASE.mint(user2.address, baseAmount);
    await BASE.connect(user2).approve(TOKEN.address, baseAmount);
    await TOKEN.connect(user2).buy(baseAmount, 1, 1792282187, user2.address);
    await TOKEN.connect(user2).approve(rewardAuction.address, currentPrice);

    // Buy from reward auction at new price
    await rewardAuction
      .connect(user2)
      .buy(
        [TEST0.address, TEST1.address],
        user2.address,
        currentEpoch,
        1792282187,
        currentPrice
      );

    console.log("\nPost-Purchase State:");
    console.log(
      "- User2 TEST0 Balance:",
      ethers.utils.formatUnits(await TEST0.balanceOf(user2.address), 18)
    );
    console.log(
      "- User2 TEST1 Balance:",
      ethers.utils.formatUnits(await TEST1.balanceOf(user2.address), 18)
    );
    console.log(
      "- Auction TEST0 Remaining:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- Auction TEST1 Remaining:",
      ethers.utils.formatUnits(await TEST1.balanceOf(rewardAuction.address), 18)
    );

    expect(await TEST0.balanceOf(user2.address)).to.be.gt(0);
    expect(await TEST1.balanceOf(user2.address)).to.be.gt(0);
  });

  it("Test multiple reward distributions and purchases", async function () {
    console.log("******************************************************");
    console.log("Testing multiple distributions and purchases");
    console.log();

    // First distribution
    await LP0.mint(plugin0.address, oneHundred);
    await TEST0.mint(LP0.address, oneThousand);
    await TEST1.mint(LP0.address, oneThousand);
    await plugin0.connect(multisig).claim();
    await plugin0.connect(multisig).distribute([TEST0.address, TEST1.address]);

    const firstPrice = await rewardAuction.getPrice();
    const firstEpoch = (await rewardAuction.getSlot0()).epochId;

    console.log("First distribution state:");
    console.log("- Price:", ethers.utils.formatUnits(firstPrice, 18));
    console.log(
      "- TEST0 Available:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- TEST1 Available:",
      ethers.utils.formatUnits(await TEST1.balanceOf(rewardAuction.address), 18)
    );

    // First buyer
    const baseAmount = oneThousand;
    await BASE.mint(user1.address, baseAmount);
    await BASE.connect(user1).approve(TOKEN.address, baseAmount);
    await TOKEN.connect(user1).buy(baseAmount, 1, 1792282187, user1.address);
    await TOKEN.connect(user1).approve(rewardAuction.address, firstPrice);

    await rewardAuction
      .connect(user1)
      .buy(
        [TEST0.address, TEST1.address],
        user1.address,
        firstEpoch,
        1792282187,
        firstPrice
      );

    // Second distribution
    await LP0.mint(plugin0.address, oneHundred);
    await TEST0.mint(LP0.address, oneThousand);
    await TEST1.mint(LP0.address, oneThousand);
    await plugin0.connect(multisig).claim();
    await plugin0.connect(multisig).distribute([TEST0.address, TEST1.address]);

    const secondPrice = await rewardAuction.getPrice();
    const secondEpoch = (await rewardAuction.getSlot0()).epochId;

    console.log("\nSecond distribution state:");
    console.log("- Price:", ethers.utils.formatUnits(secondPrice, 18));
    console.log(
      "- TEST0 Available:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- TEST1 Available:",
      ethers.utils.formatUnits(await TEST1.balanceOf(rewardAuction.address), 18)
    );

    // Second buyer
    await BASE.mint(user2.address, baseAmount);
    await BASE.connect(user2).approve(TOKEN.address, baseAmount);
    await TOKEN.connect(user2).buy(baseAmount, 1, 1792282187, user2.address);
    await TOKEN.connect(user2).approve(rewardAuction.address, secondPrice);

    await rewardAuction
      .connect(user2)
      .buy(
        [TEST0.address, TEST1.address],
        user2.address,
        secondEpoch,
        1792282187,
        secondPrice
      );

    console.log("\nFinal balances:");
    console.log(
      "- User1 TEST0:",
      ethers.utils.formatUnits(await TEST0.balanceOf(user1.address), 18)
    );
    console.log(
      "- User1 TEST1:",
      ethers.utils.formatUnits(await TEST1.balanceOf(user1.address), 18)
    );
    console.log(
      "- User2 TEST0:",
      ethers.utils.formatUnits(await TEST0.balanceOf(user2.address), 18)
    );
    console.log(
      "- User2 TEST1:",
      ethers.utils.formatUnits(await TEST1.balanceOf(user2.address), 18)
    );

    expect(await TEST0.balanceOf(user1.address)).to.be.gt(0);
    expect(await TEST1.balanceOf(user1.address)).to.be.gt(0);
    expect(await TEST0.balanceOf(user2.address)).to.be.gt(0);
    expect(await TEST1.balanceOf(user2.address)).to.be.gt(0);
  });

  it("Deploy and setup Router", async function () {
    console.log("******************************************************");
    console.log("Deploying Router");

    const RouterArtifact = await ethers.getContractFactory("Router");
    router = await RouterArtifact.deploy(
      voter.address,
      TOKEN.address,
      OTOKEN.address,
      multicall.address,
      rewardAuction.address
    );
    console.log("Router deployed to:", router.address);
  });

  it("Test buyFromAssetAuction through Router", async function () {
    console.log("******************************************************");
    console.log("Testing asset auction purchase through router");
    console.log();

    // First get OTOKEN into the auction
    await controller.distribute();

    // Get auction states
    const assetAuction = await ethers.getContractAt(
      "Auction",
      await plugin0.getAssetAuction()
    );
    const currentPrice = await assetAuction.getPrice();
    const currentEpoch = (await assetAuction.getSlot0()).epochId;

    console.log("Pre-Purchase State:");
    console.log("- Current Price:", ethers.utils.formatUnits(currentPrice, 18));
    console.log("- Current Epoch:", currentEpoch.toString());
    console.log(
      "- OTOKEN in Auction:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(assetAuction.address), 18)
    );

    // Get LP0 for auction payment
    await LP0.mint(user1.address, currentPrice.mul(2));
    await LP0.connect(user1).approve(assetAuction.address, currentPrice.mul(2));

    // Buy through router
    await router
      .connect(user1)
      .buyFromAssetAuction(
        plugin0.address,
        currentEpoch,
        1792282187,
        currentPrice
      );

    console.log("\nPost-Purchase State:");
    console.log(
      "- User1 OTOKEN:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(user1.address), 18)
    );
    console.log(
      "- OTOKEN in Auction:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(assetAuction.address), 18)
    );

    expect(await OTOKEN.balanceOf(user1.address)).to.be.gt(0);
  });

  it("Test buyFromRewardAuction through Router - corrected", async function () {
    console.log("******************************************************");
    console.log(
      "Testing reward auction purchase through router - with correct approvals"
    );
    console.log();

    // First generate some rewards
    await LP0.mint(plugin0.address, oneHundred);
    await TEST0.mint(LP0.address, oneThousand);
    await TEST1.mint(LP0.address, oneThousand);
    await plugin0.connect(multisig).claim();
    await plugin0.connect(multisig).distribute([TEST0.address, TEST1.address]);

    // Get auction states
    const currentPrice = await rewardAuction.getPrice();
    const currentEpoch = (await rewardAuction.getSlot0()).epochId;

    console.log("Pre-Purchase State:");
    console.log("- Current Price:", ethers.utils.formatUnits(currentPrice, 18));
    console.log("- Current Epoch:", currentEpoch.toString());
    console.log(
      "- TEST0 in Auction:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- TEST1 in Auction:",
      ethers.utils.formatUnits(await TEST1.balanceOf(rewardAuction.address), 18)
    );

    // Get TOKEN for auction payment
    const baseAmount = oneThousand.mul(100);
    await BASE.mint(user2.address, baseAmount);
    await BASE.connect(user2).approve(TOKEN.address, baseAmount);
    await TOKEN.connect(user2).buy(baseAmount, 1, 1792282187, user2.address);

    // Approve router (not rewardAuction)
    const tokenBalance = await TOKEN.balanceOf(user2.address);
    console.log(
      "\nTOKEN balance before purchase:",
      ethers.utils.formatUnits(tokenBalance, 18)
    );
    await TOKEN.connect(user2).approve(router.address, tokenBalance);

    // Buy through router
    await router
      .connect(user2)
      .buyFromRewardAuction(currentEpoch, 1792282187, currentPrice);

    console.log("\nPost-Purchase State:");
    console.log(
      "- User2 TEST0:",
      ethers.utils.formatUnits(await TEST0.balanceOf(user2.address), 18)
    );
    console.log(
      "- User2 TEST1:",
      ethers.utils.formatUnits(await TEST1.balanceOf(user2.address), 18)
    );
    console.log(
      "- TEST0 in Auction:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- TEST1 in Auction:",
      ethers.utils.formatUnits(await TEST1.balanceOf(rewardAuction.address), 18)
    );

    expect(await TEST0.balanceOf(user2.address)).to.be.gt(0);
    expect(await TEST1.balanceOf(user2.address)).to.be.gt(0);
  });

  it("Test buyFromAssetAuction through Router - spending LP for OTOKEN", async function () {
    console.log("******************************************************");
    console.log(
      "Testing asset auction purchase through router - LP for OTOKEN"
    );
    console.log();

    await controller.distribute();

    // Get auction states
    const assetAuction = await ethers.getContractAt(
      "Auction",
      await plugin0.getAssetAuction()
    );
    const currentPrice = await assetAuction.getPrice();
    const currentEpoch = (await assetAuction.getSlot0()).epochId;

    console.log("Pre-Purchase State:");
    console.log(
      "- Current Price (in LP):",
      ethers.utils.formatUnits(currentPrice, 18)
    );
    console.log("- Current Epoch:", currentEpoch.toString());
    console.log(
      "- OTOKEN in Auction:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(assetAuction.address), 18)
    );

    // Mint LP tokens to user and approve router
    await LP0.mint(user1.address, currentPrice.mul(2));
    await LP0.connect(user1).approve(router.address, currentPrice.mul(2));

    // Record initial balances
    const initialOTOKENBalance = await OTOKEN.balanceOf(user1.address);
    const initialLPBalance = await LP0.balanceOf(user1.address);

    // Buy through router
    await router
      .connect(user1)
      .buyFromAssetAuction(
        plugin0.address,
        currentEpoch,
        1792282187,
        currentPrice
      );

    // Get final balances
    const finalOTOKENBalance = await OTOKEN.balanceOf(user1.address);
    const finalLPBalance = await LP0.balanceOf(user1.address);

    console.log("\nPost-Purchase State:");
    console.log(
      "- LP tokens spent:",
      ethers.utils.formatUnits(initialLPBalance.sub(finalLPBalance), 18)
    );
    console.log(
      "- OTOKEN received:",
      ethers.utils.formatUnits(finalOTOKENBalance.sub(initialOTOKENBalance), 18)
    );
    console.log(
      "- OTOKEN remaining in Auction:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(assetAuction.address), 18)
    );

    expect(finalOTOKENBalance).to.be.gt(initialOTOKENBalance);
  });

  it("Test second buyFromAssetAuction through Router - with non-zero price", async function () {
    console.log("******************************************************");
    console.log(
      "Testing second asset auction purchase through router - with price of 10"
    );
    console.log();

    await controller.distribute();

    // Get auction states
    const assetAuction = await ethers.getContractAt(
      "Auction",
      await plugin0.getAssetAuction()
    );
    const currentPrice = await assetAuction.getPrice();
    const currentEpoch = (await assetAuction.getSlot0()).epochId;

    console.log("Pre-Purchase State:");
    console.log(
      "- Current Price (in LP):",
      ethers.utils.formatUnits(currentPrice, 18)
    );
    console.log("- Current Epoch:", currentEpoch.toString());
    console.log(
      "- OTOKEN in Auction:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(assetAuction.address), 18)
    );

    // Mint LP tokens to user and approve router
    await LP0.mint(user2.address, currentPrice.mul(2));
    await LP0.connect(user2).approve(router.address, currentPrice.mul(2));

    // Record initial balances
    const initialOTOKENBalance = await OTOKEN.balanceOf(user2.address);
    const initialLPBalance = await LP0.balanceOf(user2.address);

    // Buy through router
    await router
      .connect(user2)
      .buyFromAssetAuction(
        plugin0.address,
        currentEpoch,
        1792282187,
        currentPrice
      );

    // Get final balances
    const finalOTOKENBalance = await OTOKEN.balanceOf(user2.address);
    const finalLPBalance = await LP0.balanceOf(user2.address);

    console.log("\nPost-Purchase State:");
    console.log(
      "- LP tokens spent:",
      ethers.utils.formatUnits(initialLPBalance.sub(finalLPBalance), 18)
    );
    console.log(
      "- OTOKEN received:",
      ethers.utils.formatUnits(finalOTOKENBalance.sub(initialOTOKENBalance), 18)
    );
    console.log(
      "- OTOKEN remaining in Auction:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(assetAuction.address), 18)
    );

    // Verify non-zero amounts were transferred
    expect(finalOTOKENBalance).to.be.gt(initialOTOKENBalance);
    expect(finalLPBalance).to.be.lt(initialLPBalance);
  });

  it("Forward time 20 hours", async function () {
    console.log("******************************************************");
    console.log("Forwarding time 20 hours");
    console.log();
    await ethers.provider.send("evm_increaseTime", [20 * 3600]);
    await ethers.provider.send("evm_mine");
  });

  it("Test multiple plugins through reward auction Router", async function () {
    console.log("******************************************************");
    console.log("Testing reward auction with multiple plugins");
    console.log();

    // Add another plugin to voter
    await pluginFactory.createPlugin(
      "Protocol1 LP1",
      voter.address,
      LP0.address,
      [TEST0.address, TEST1.address],
      oneHundred,
      24 * 3600,
      two,
      ten
    );
    const plugin1 = await ethers.getContractAt(
      "LPPlugin",
      await pluginFactory.lastPlugin()
    );
    await voter.connect(owner).addPlugin(plugin1.address);
    await plugin1.connect(multisig).initialize();

    // Generate rewards for both plugins
    await LP0.mint(plugin0.address, oneHundred);
    await LP0.mint(plugin1.address, oneHundred);
    await TEST0.mint(LP0.address, oneThousand.mul(2));
    await TEST1.mint(LP0.address, oneThousand.mul(2));

    // Get auction states
    const currentPrice = await rewardAuction.getPrice();
    const currentEpoch = (await rewardAuction.getSlot0()).epochId;

    // Get TOKEN for auction payment - use much larger amount for multiple plugins
    const baseAmount = oneThousand.mul(200); // Increased amount further
    await BASE.mint(user1.address, baseAmount);
    await BASE.connect(user1).approve(TOKEN.address, baseAmount);
    await TOKEN.connect(user1).buy(baseAmount, 1, 1792282187, user1.address);

    // Check TOKEN balance and approve
    const tokenBalance = await TOKEN.balanceOf(user1.address);
    console.log(
      "\nTOKEN balance before purchase:",
      ethers.utils.formatUnits(tokenBalance, 18)
    );
    await TOKEN.connect(user1).approve(router.address, tokenBalance);

    console.log("Pre-Purchase Balances:");
    console.log(
      "- TEST0 in Auction:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- TEST1 in Auction:",
      ethers.utils.formatUnits(await TEST1.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "Current Price (TOKEN): ",
      ethers.utils.formatUnits(currentPrice, 18)
    );
    // Buy through router
    await router
      .connect(user1)
      .buyFromRewardAuction(currentEpoch, 1792282187, currentPrice);

    console.log("\nPost-Purchase Balances:");
    console.log(
      "- User1 TEST0:",
      ethers.utils.formatUnits(await TEST0.balanceOf(user1.address), 18)
    );
    console.log(
      "- User1 TEST1:",
      ethers.utils.formatUnits(await TEST1.balanceOf(user1.address), 18)
    );
    console.log(
      "- TEST0 in Auction:",
      ethers.utils.formatUnits(await TEST0.balanceOf(rewardAuction.address), 18)
    );
    console.log(
      "- TEST1 in Auction:",
      ethers.utils.formatUnits(await TEST1.balanceOf(rewardAuction.address), 18)
    );

    expect(await TEST0.balanceOf(user1.address)).to.be.gt(0);
    expect(await TEST1.balanceOf(user1.address)).to.be.gt(0);
  });
});
