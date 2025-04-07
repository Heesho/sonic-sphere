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
let LP0, TEST0, farm0, plugin0, gauge0, bribe0, auction0;

describe("farmPluginTest", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
      await ethers.getSigners();

    // initialize BASE
    const ERC20MockArtifact = await ethers.getContractFactory("ERC20Mock");
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
    console.log("- BASE Initialized");
    LP0 = await ERC20MockArtifact.deploy("LP0", "LP0");
    console.log("- LP0 Initialized");
    TEST0 = await ERC20MockArtifact.deploy("TEST0", "TEST0");
    console.log("- TEST0 Initialized");

    const FarmMockArtifact = await ethers.getContractFactory("FarmMock");
    farm0 = await FarmMockArtifact.deploy(LP0.address, TEST0.address);
    console.log("- farm0 Initialized");

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
    const FarmPluginFactoryArtifact = await ethers.getContractFactory(
      "FarmPluginFactory"
    );
    pluginFactory = await FarmPluginFactoryArtifact.deploy(
      multisig.address,
      treasury.address,
      rewardAuction.address,
      auctionFactory.address
    );
    console.log("- FarmPluginFactory Initialized");

    // initialize plugin0
    await pluginFactory.createPlugin(
      "Protocol0 LP0",
      voter.address,
      LP0.address,
      [TEST0.address],
      farm0.address,
      oneHundred,
      24 * 3600,
      two,
      ten
    );
    plugin0 = await ethers.getContractAt(
      "FarmPlugin",
      await pluginFactory.lastPlugin()
    );
    console.log("- FarmPlugin Initialized");

    auction0 = await ethers.getContractAt(
      "Auction",
      await auctionFactory.last_auction()
    );
    console.log("- Auction0 Initialized");

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

    // Initialize plugin
    await plugin0.connect(user2).initialize();
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

  it("Test plugin0 parameters via multicall", async function () {
    console.log("******************************************************");
    console.log("Testing plugin0 parameters via multicall");
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

  it("Forward time to start new epoch", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]); // 7 days
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await controller.distribute();
  });

  it("Test farm plugin deposit and rewards", async function () {
    console.log("******************************************************");
    console.log("Testing farm plugin deposits and rewards");
    console.log();

    // Get initial states
    const initialTotalSupply = await farm0.totalSupply();
    console.log("Initial Farm State:");
    console.log(
      "- Total Supply:",
      ethers.utils.formatUnits(initialTotalSupply, 18)
    );

    // Mint some LP0 tokens to user1
    const depositAmount = oneHundred;
    await LP0.mint(user1.address, depositAmount);
    console.log(
      "\nMinted",
      ethers.utils.formatUnits(depositAmount, 18),
      "LP0 to user1"
    );

    // Approve and deposit LP tokens
    await LP0.connect(user1).approve(plugin0.address, depositAmount);
    await plugin0.connect(user1).deposit(depositAmount);

    console.log("\nPost-Deposit State:");
    console.log(
      "- Farm Total Supply:",
      ethers.utils.formatUnits(await farm0.totalSupply(), 18)
    );
    console.log(
      "- Plugin's Farm Balance:",
      ethers.utils.formatUnits(await farm0.balanceOf(plugin0.address), 18)
    );

    // Generate some farm rewards
    console.log("\nGenerating farm rewards...");
    await TEST0.mint(farm0.address, oneHundred);

    // Forward time to accumulate rewards
    await network.provider.send("evm_increaseTime", [86400]); // 24 hours
    await network.provider.send("evm_mine");

    // Claim rewards from farm to plugin
    console.log("\nClaiming farm rewards to plugin...");
    const preClaim = await TEST0.balanceOf(plugin0.address);
    await plugin0.connect(multisig).claim();
    const postClaim = await TEST0.balanceOf(plugin0.address);

    console.log(
      "Rewards claimed:",
      ethers.utils.formatUnits(postClaim.sub(preClaim), 18),
      "TEST0"
    );

    // Distribute rewards to auction
    console.log("\nDistributing rewards to auction...");
    const preAuctionBalance = await TEST0.balanceOf(rewardAuction.address);
    await plugin0.connect(user2).distribute([TEST0.address]);
    const postAuctionBalance = await TEST0.balanceOf(rewardAuction.address);

    console.log(
      "Rewards sent to auction:",
      ethers.utils.formatUnits(postAuctionBalance.sub(preAuctionBalance), 18),
      "TEST0"
    );

    // Forward time to start new epoch
    await network.provider.send("evm_increaseTime", [86400]); // 24 hours
    await network.provider.send("evm_mine");

    // Buy from auction
    console.log("\nPurchasing from auction...");
    const currentPrice = await auction0.getPrice();
    const currentEpoch = (await auction0.getSlot0()).epochId;

    // Get LP0 for auction payment
    await LP0.mint(user2.address, currentPrice.mul(2)); // Extra buffer
    await LP0.connect(user2).approve(auction0.address, currentPrice.mul(2));

    // Execute auction purchase
    await auction0.connect(user2).buy(
      [OTOKEN.address],
      user2.address,
      currentEpoch,
      1792282187, // deadline
      currentPrice
    );

    console.log("\nPost-Purchase State:");
    console.log(
      "- Auction Price:",
      ethers.utils.formatUnits(await auction0.getPrice(), 18)
    );
    console.log(
      "- User2 OTOKEN Balance:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(user2.address), 18)
    );

    // Verify states
    expect(await farm0.balanceOf(plugin0.address)).to.equal(depositAmount);
    expect(postClaim).to.be.gt(preClaim);
    expect(postAuctionBalance).to.be.gt(preAuctionBalance);
    expect(await OTOKEN.balanceOf(user2.address)).to.be.gt(0);
  });

  it("Test farm plugin withdrawal", async function () {
    console.log("******************************************************");
    console.log("Testing farm plugin withdrawal");
    console.log();

    // Get initial states
    const initialBalance = await LP0.balanceOf(treasury.address);
    const initialFarmBalance = await farm0.balanceOf(plugin0.address);
    const initialTotalSupply = await farm0.totalSupply();

    console.log("Initial State:");
    console.log(
      "- Treasury LP0 Balance:",
      ethers.utils.formatUnits(initialBalance, 18)
    );
    console.log(
      "- Plugin's Farm Balance:",
      ethers.utils.formatUnits(initialFarmBalance, 18)
    );
    console.log(
      "- Farm Total Supply:",
      ethers.utils.formatUnits(initialTotalSupply, 18)
    );

    // Withdraw LP tokens
    await expect(plugin0.connect(user1).withdraw()).to.be.reverted;
    await plugin0.connect(multisig).withdraw();

    // Check final states
    const finalBalance = await LP0.balanceOf(treasury.address);
    const finalFarmBalance = await farm0.balanceOf(plugin0.address);
    const finalTotalSupply = await farm0.totalSupply();

    console.log("\nPost-Withdrawal State:");
    console.log(
      "- Treasury LP0 Balance:",
      ethers.utils.formatUnits(finalBalance, 18)
    );
    console.log(
      "- Plugin's Farm Balance:",
      ethers.utils.formatUnits(finalFarmBalance, 18)
    );
    console.log(
      "- Farm Total Supply:",
      ethers.utils.formatUnits(finalTotalSupply, 18)
    );

    // Verify states
    expect(finalBalance).to.be.gt(initialBalance);
    expect(finalFarmBalance).to.equal(0);
    expect(finalTotalSupply).to.equal(0);
  });

  it("Test multiple users depositing to farm plugin", async function () {
    console.log("******************************************************");
    console.log("Testing multiple users depositing");
    console.log();

    // Mint LP0 tokens to both users
    const deposit1 = oneHundred;
    const deposit2 = twoHundred;
    await LP0.mint(user1.address, deposit1);
    await LP0.mint(user2.address, deposit2);

    // User1 deposits
    await LP0.connect(user1).approve(plugin0.address, deposit1);
    await plugin0.connect(user1).deposit(deposit1);
    console.log(
      "User1 deposited:",
      ethers.utils.formatUnits(deposit1, 18),
      "LP0"
    );

    // User2 deposits
    await LP0.connect(user2).approve(plugin0.address, deposit2);
    await plugin0.connect(user2).deposit(deposit2);
    console.log(
      "User2 deposited:",
      ethers.utils.formatUnits(deposit2, 18),
      "LP0"
    );

    // Check farm state
    console.log("\nFarm State:");
    console.log(
      "- Total Supply:",
      ethers.utils.formatUnits(await farm0.totalSupply(), 18)
    );
    console.log(
      "- Plugin's Farm Balance:",
      ethers.utils.formatUnits(await farm0.balanceOf(plugin0.address), 18)
    );

    expect(await farm0.balanceOf(plugin0.address)).to.equal(
      deposit1.add(deposit2)
    );
  });

  it("Test reward accumulation and claiming", async function () {
    console.log("******************************************************");
    console.log("Testing reward accumulation and claiming");
    console.log();

    // Generate TEST0 rewards
    await TEST0.mint(farm0.address, oneHundred);

    // Forward time
    await network.provider.send("evm_increaseTime", [86400]);
    await network.provider.send("evm_mine");

    // Claim rewards
    const preClaim = await TEST0.balanceOf(plugin0.address);
    await plugin0.connect(multisig).claim();
    const postClaim = await TEST0.balanceOf(plugin0.address);

    console.log("Rewards claimed:");
    console.log(
      "- TEST0:",
      ethers.utils.formatUnits(postClaim.sub(preClaim), 18)
    );

    // Distribute rewards
    await plugin0.connect(multisig).distribute([TEST0.address]);

    expect(postClaim).to.be.gt(preClaim);
  });

  it("Test owner-only withdrawal", async function () {
    console.log("******************************************************");
    console.log("Testing owner-only withdrawal functionality");
    console.log();

    // Try withdraw from non-owner (should fail)
    await expect(plugin0.connect(user1).withdraw()).to.be.reverted;
    console.log("Non-owner withdrawal correctly reverted");

    // Get initial states
    const initialBalance = await LP0.balanceOf(treasury.address);
    const initialFarmBalance = await farm0.balanceOf(plugin0.address);

    console.log("\nInitial State:");
    console.log(
      "- Treasury LP0 Balance:",
      ethers.utils.formatUnits(initialBalance, 18)
    );
    console.log(
      "- Plugin's Farm Balance:",
      ethers.utils.formatUnits(initialFarmBalance, 18)
    );

    // Owner withdraws
    await plugin0.connect(multisig).withdraw();

    // Check final states
    const finalBalance = await LP0.balanceOf(treasury.address);
    const finalFarmBalance = await farm0.balanceOf(plugin0.address);

    console.log("\nPost-Withdrawal State:");
    console.log(
      "- Treasury LP0 Balance:",
      ethers.utils.formatUnits(finalBalance, 18)
    );
    console.log(
      "- Plugin's Farm Balance:",
      ethers.utils.formatUnits(finalFarmBalance, 18)
    );

    // Verify states
    expect(finalBalance).to.be.gt(initialBalance);
    expect(finalFarmBalance).to.equal(0);
  });

  it("Test auction interactions", async function () {
    console.log("******************************************************");
    console.log("Testing auction interactions");
    console.log();

    // Get current auction state
    const currentPrice = await auction0.getPrice();
    const currentEpoch = (await auction0.getSlot0()).epochId;

    console.log("Current auction state:");
    console.log("- Price:", ethers.utils.formatUnits(currentPrice, 18));
    console.log("- Epoch:", currentEpoch.toString());

    // Mint and approve sufficient LP0 for purchase
    await LP0.mint(user1.address, currentPrice);
    await LP0.connect(user1).approve(auction0.address, currentPrice);

    // Execute purchase
    await controller.distribute();
    await auction0
      .connect(user1)
      .buy(
        [OTOKEN.address],
        user1.address,
        currentEpoch,
        1792282187,
        currentPrice
      );

    console.log("\nPost-purchase state:");
    console.log(
      "- User1 OTOKEN Balance:",
      ethers.utils.formatUnits(await OTOKEN.balanceOf(user1.address), 18)
    );

    expect(await OTOKEN.balanceOf(user1.address)).to.be.gt(0);
  });

  it("Test emergency withdrawal", async function () {
    console.log("******************************************************");
    console.log("Testing emergency withdrawal");
    console.log();

    await LP0.mint(user1.address, oneHundred);
    await LP0.connect(user1).approve(plugin0.address, oneHundred);
    await plugin0.connect(user1).deposit(oneHundred);

    // Try emergency withdraw from non-owner (should fail)
    await expect(plugin0.connect(user1).withdraw()).to.be.reverted;

    // Emergency withdraw from owner
    const preBal = await LP0.balanceOf(treasury.address);
    await plugin0.connect(multisig).withdraw();
    const postBal = await LP0.balanceOf(treasury.address);

    console.log("Emergency withdrawal results:");
    console.log(
      "- LP0 withdrawn:",
      ethers.utils.formatUnits(postBal.sub(preBal), 18)
    );

    // Verify farm is empty
    expect(await farm0.balanceOf(plugin0.address)).to.equal(0);
  });

  it("Test auction edge cases", async function () {
    console.log("******************************************************");
    console.log("Testing auction edge cases");
    console.log();

    // Try to buy with insufficient payment
    const currentPrice = await auction0.getPrice();
    const currentEpoch = (await auction0.getSlot0()).epochId;

    await LP0.mint(user1.address, currentPrice.div(2));
    await LP0.connect(user1).approve(auction0.address, currentPrice.div(2));

    await expect(
      auction0
        .connect(user1)
        .buy(
          [OTOKEN.address],
          user1.address,
          currentEpoch,
          1792282187,
          currentPrice.div(2)
        )
    ).to.be.reverted;

    // Try to buy with expired deadline
    await LP0.mint(user1.address, currentPrice);
    await LP0.connect(user1).approve(auction0.address, currentPrice);

    await expect(
      auction0.connect(user1).buy(
        [OTOKEN.address],
        user1.address,
        currentEpoch,
        0, // expired deadline
        currentPrice
      )
    ).to.be.reverted;
  });
});
