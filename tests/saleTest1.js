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
const tenThousand = convert("10000", 18);

let owner, multisig, treasury, user0, user1, user2, user3;
let token, sale;

describe("sale test 1", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // initialize users
    [owner, multisig, treasury, user0, user1, user2, user3] =
      await ethers.getSigners();

    // initialize token
    const ERC20MockArtifact = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20MockArtifact.deploy("TOKEN", "TOKEN");
    console.log("- token initialized");

    // initialize sale
    const SaleArtifact = await ethers.getContractFactory("Sale");
    sale = await SaleArtifact.deploy();
    console.log("- sale initialized");

    console.log("Initialization Complete");
    console.log();
  });

  it("Sale State", async function () {
    console.log("******************************************************");
    console.log("Sale State");
    console.log("Token: ", await sale.token());
    console.log("Total Amount: ", await sale.totalAmount());
    console.log("Total Claim: ", await sale.totalClaim());
    console.log("Total Refund: ", await sale.totalRefund());
    console.log("Sale State: ", await sale.state());
    console.log(
      "ETH Balance: ",
      divDec(await ethers.provider.getBalance(sale.address))
    );
    console.log("Token Balance: ", divDec(await token.balanceOf(sale.address)));
  });

  it("User0 tries to purchase with 10 ETH", async function () {
    console.log("******************************************************");
    console.log(
      "User0 ETH balance: ",
      divDec(await ethers.provider.getBalance(user0.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
    console.log("User0 purchases with 10 ETH");
    await expect(
      sale.purchaseFor(user0.address, { value: ten })
    ).to.be.revertedWith("Sale__NotOpen");
    console.log(
      "User0 ETH balance: ",
      divDec(await ethers.provider.getBalance(user0.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
  });

  it("whitelist user1 and user2", async function () {
    console.log("******************************************************");
    console.log(
      "user1 whitelisted: ",
      await sale.account_Whitelist(user1.address)
    );
    console.log(
      "user2 whitelisted: ",
      await sale.account_Whitelist(user2.address)
    );
    await sale.whitelist([user1.address, user2.address], true);
    console.log("user1 and user2 whitelisted");
    console.log(
      "user1 whitelisted: ",
      await sale.account_Whitelist(user1.address)
    );
    console.log(
      "user2 whitelisted: ",
      await sale.account_Whitelist(user2.address)
    );
  });

  it("User1 tries to purchase with 10 ETH", async function () {
    console.log("******************************************************");
    console.log(
      "User1 ETH balance: ",
      divDec(await ethers.provider.getBalance(user0.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
    console.log("User0 purchases with 10 ETH");
    await expect(
      sale.purchaseFor(user1.address, { value: ten })
    ).to.be.revertedWith("Sale__NotOpen");
    console.log(
      "User0 ETH balance: ",
      divDec(await ethers.provider.getBalance(user0.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
  });

  it("State moved forward to whitelist", async function () {
    console.log("******************************************************");
    console.log("Sale State: ", await sale.state());
    await expect(sale.connect(user1).updateState()).to.be.reverted;
    await sale.updateState();
    console.log("Sale State: ", await sale.state());
  });

  it("User0 tries to purchase with 10 ETH", async function () {
    console.log("******************************************************");
    console.log(
      "User0 ETH balance: ",
      divDec(await ethers.provider.getBalance(user0.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
    console.log("User0 purchases with 10 ETH");
    await expect(
      sale.purchaseFor(user0.address, { value: ten })
    ).to.be.revertedWith("Sale__NotWhitelisted");
    console.log(
      "User0 ETH balance: ",
      divDec(await ethers.provider.getBalance(user0.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
  });

  it("User1 tries to purchase with 10 ETH", async function () {
    console.log("******************************************************");
    console.log(
      "User1 ETH balance: ",
      divDec(await ethers.provider.getBalance(user1.address))
    );
    console.log(
      "User1 sale amount: ",
      divDec(await sale.account_Amount(user1.address))
    );
    console.log("User1 purchases with 10 ETH");
    await sale
      .connect(user1)
      .purchaseFor(user1.address, { value: oneThousand });
    console.log(
      "User1 ETH balance: ",
      divDec(await ethers.provider.getBalance(user1.address))
    );
    console.log(
      "User1 sale amount: ",
      divDec(await sale.account_Amount(user1.address))
    );
  });

  it("User2 tries to purchase with 10 ETH", async function () {
    console.log("******************************************************");
    console.log(
      "User2 ETH balance: ",
      divDec(await ethers.provider.getBalance(user2.address))
    );
    console.log(
      "User2 sale amount: ",
      divDec(await sale.account_Amount(user2.address))
    );
    console.log("User2 purchases with 10 ETH");
    await sale
      .connect(user2)
      .purchaseFor(user2.address, { value: oneThousand });
    console.log(
      "User2 ETH balance: ",
      divDec(await ethers.provider.getBalance(user2.address))
    );
    console.log(
      "User2 sale amount: ",
      divDec(await sale.account_Amount(user2.address))
    );
  });

  it("User1 tries to purchase with 10 ETH for user0", async function () {
    console.log("******************************************************");
    console.log(
      "User1 ETH balance: ",
      divDec(await ethers.provider.getBalance(user1.address))
    );
    console.log(
      "User1 sale amount: ",
      divDec(await sale.account_Amount(user1.address))
    );
    console.log("User1 purchases with 10 ETH for user0");
    await expect(
      sale.connect(user1).purchaseFor(user0.address, { value: oneThousand })
    ).to.be.revertedWith("Sale__NotWhitelisted");
    console.log(
      "User0 ETH balance: ",
      divDec(await ethers.provider.getBalance(user0.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
  });

  it("State moved forward to whitelist", async function () {
    console.log("******************************************************");
    console.log("Sale State: ", await sale.state());
    await sale.updateState();
    console.log("Sale State: ", await sale.state());
  });

  it("Sale State", async function () {
    console.log("******************************************************");
    console.log("Sale State");
    console.log("Token: ", await sale.token());
    console.log("Total Amount: ", await sale.totalAmount());
    console.log("Total Claim: ", await sale.totalClaim());
    console.log("Total Refund: ", await sale.totalRefund());
    console.log("Sale State: ", await sale.state());
    console.log(
      "ETH Balance: ",
      divDec(await ethers.provider.getBalance(sale.address))
    );
    console.log("Token Balance: ", divDec(await token.balanceOf(sale.address)));
  });

  it("User1 tries to purchase with 1000 ETH for user0", async function () {
    console.log("******************************************************");
    console.log(
      "User1 ETH balance: ",
      divDec(await ethers.provider.getBalance(user1.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
    console.log("User1 purchases with 1000 ETH for user0");
    await sale
      .connect(user1)
      .purchaseFor(user0.address, { value: oneThousand });
    console.log(
      "User1 ETH balance: ",
      divDec(await ethers.provider.getBalance(user1.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
  });

  it("Owner tries to withdraw", async function () {
    console.log("******************************************************");
    await expect(sale.withdraw(owner.address)).to.be.revertedWith(
      "Sale__MinCapNotReached"
    );
  });

  it("User3 tries to purchase with 2000 ETH", async function () {
    console.log("******************************************************");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user1.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log("User3 purchases with 2000 ETH");
    await sale
      .connect(user3)
      .purchaseFor(user3.address, { value: twoThousand });
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
  });

  it("Sale State", async function () {
    console.log("******************************************************");
    console.log("Sale State");
    console.log("Token: ", await sale.token());
    console.log("Total Amount: ", await sale.totalAmount());
    console.log("Total Claim: ", await sale.totalClaim());
    console.log("Total Refund: ", await sale.totalRefund());
    console.log("Sale State: ", await sale.state());
    console.log(
      "ETH Balance: ",
      divDec(await ethers.provider.getBalance(sale.address))
    );
    console.log("Token Balance: ", divDec(await token.balanceOf(sale.address)));
  });

  it("State moved forward to claim", async function () {
    console.log("******************************************************");
    console.log("Sale State: ", await sale.state());
    await expect(sale.updateState()).to.be.revertedWith("Sale__TokenNotSet");
    await sale.setToken(token.address);
    console.log(
      "Total Token Purchased: ",
      divDec(await sale.getTotalTokenPurchased())
    );
    await token.mint(owner.address, tenThousand);
    await token.approve(sale.address, tenThousand);
    await sale.updateState();
    console.log("Sale State: ", await sale.state());
  });

  it("Sale State", async function () {
    console.log("******************************************************");
    console.log("Sale State");
    console.log("Token: ", await sale.token());
    console.log("Total Amount: ", await sale.totalAmount());
    console.log("Total Claim: ", await sale.totalClaim());
    console.log("Total Refund: ", await sale.totalRefund());
    console.log("Sale State: ", await sale.state());
    console.log(
      "ETH Balance: ",
      divDec(await ethers.provider.getBalance(sale.address))
    );
    console.log("Token Balance: ", divDec(await token.balanceOf(sale.address)));
  });

  it("User3 tries to purchase with 1000 ETH", async function () {
    console.log("******************************************************");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log("User3 purchases with 1000 ETH");
    await expect(
      sale.connect(user3).purchaseFor(user3.address, { value: oneThousand })
    ).to.be.revertedWith("Sale__NotOpen");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
  });

  it("User3 claims", async function () {
    console.log("******************************************************");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log(
      "User3 token balance: ",
      divDec(await token.balanceOf(user3.address))
    );
    console.log(
      "User3 claim: ",
      divDec(await sale.account_Claim(user3.address))
    );
    console.log("User3 claims");
    await sale.connect(user3).claimFor(user3.address);
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log(
      "User3 token balance: ",
      divDec(await token.balanceOf(user3.address))
    );
    console.log(
      "User3 claim: ",
      divDec(await sale.account_Claim(user3.address))
    );
  });

  it("User3 tries to claim again", async function () {
    console.log("******************************************************");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log(
      "User3 token balance: ",
      divDec(await token.balanceOf(user3.address))
    );
    console.log(
      "User3 claim: ",
      divDec(await sale.account_Claim(user3.address))
    );
    console.log("User3 tries to claim again");
    await expect(
      sale.connect(user3).claimFor(user3.address)
    ).to.be.revertedWith("Sale__InvalidClaim");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log(
      "User3 token balance: ",
      divDec(await token.balanceOf(user3.address))
    );
    console.log(
      "User3 claim: ",
      divDec(await sale.account_Claim(user3.address))
    );
  });

  it("User3 tries to get refund", async function () {
    console.log("******************************************************");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log(
      "User3 refund amount: ",
      divDec(await sale.account_Refund(user3.address))
    );
    console.log("User3 gets refund");
    await expect(
      sale.connect(user3).refundFor(user3.address)
    ).to.be.revertedWith("Sale__NotRefund");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log(
      "User3 refund amount: ",
      divDec(await sale.account_Refund(user3.address))
    );
  });

  it("User3 tries to get refund", async function () {
    console.log("******************************************************");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log(
      "User3 refund amount: ",
      divDec(await sale.account_Refund(user3.address))
    );
    console.log("User3 tries to get refund");
    await expect(
      sale.connect(user3).refundFor(user3.address)
    ).to.be.revertedWith("Sale__NotRefund");
    console.log(
      "User3 ETH balance: ",
      divDec(await ethers.provider.getBalance(user3.address))
    );
    console.log(
      "User3 sale amount: ",
      divDec(await sale.account_Amount(user3.address))
    );
    console.log(
      "User3 refund amount: ",
      divDec(await sale.account_Refund(user3.address))
    );
  });

  it("Everyone else refunds", async function () {
    console.log("******************************************************");
    await expect(sale.refundFor(user0.address)).to.be.revertedWith(
      "Sale__NotRefund"
    );
    await expect(
      sale.connect(user1).refundFor(user1.address)
    ).to.be.revertedWith("Sale__NotRefund");
    await expect(
      sale.connect(user2).refundFor(user2.address)
    ).to.be.revertedWith("Sale__NotRefund");
    await expect(
      sale.connect(user3).refundFor(user3.address)
    ).to.be.revertedWith("Sale__NotRefund");
  });

  it("Sale State", async function () {
    console.log("******************************************************");
    console.log("Sale State");
    console.log("Token: ", await sale.token());
    console.log("Total Amount: ", await sale.totalAmount());
    console.log("Total Claim: ", await sale.totalClaim());
    console.log("Total Refund: ", await sale.totalRefund());
    console.log("Sale State: ", await sale.state());
    console.log(
      "ETH Balance: ",
      divDec(await ethers.provider.getBalance(sale.address))
    );
    console.log("Token Balance: ", divDec(await token.balanceOf(sale.address)));
  });

  it("Everyone else claims", async function () {
    console.log("******************************************************");
    await sale.connect(user0).claimFor(user0.address);
    await sale.connect(user1).claimFor(user1.address);
    await sale.connect(user1).claimFor(user2.address);
    await expect(
      sale.connect(user3).claimFor(user3.address)
    ).to.be.revertedWith("Sale__InvalidClaim");
  });

  it("Sale State", async function () {
    console.log("******************************************************");
    console.log("Sale State");
    console.log("Token: ", await sale.token());
    console.log("Total Amount: ", await sale.totalAmount());
    console.log("Total Claim: ", await sale.totalClaim());
    console.log("Total Refund: ", await sale.totalRefund());
    console.log("Sale State: ", await sale.state());
    console.log(
      "ETH Balance: ",
      divDec(await ethers.provider.getBalance(sale.address))
    );
    console.log("Token Balance: ", divDec(await token.balanceOf(sale.address)));
  });

  it("Owner withdraws", async function () {
    console.log("******************************************************");
    console.log(
      "Owner ETH balance: ",
      divDec(await ethers.provider.getBalance(owner.address))
    );
    console.log(
      "Sale ETH balance: ",
      divDec(await ethers.provider.getBalance(sale.address))
    );
    console.log("Owner withdraws");
    await sale.withdraw(owner.address);
    console.log(
      "Owner ETH balance: ",
      divDec(await ethers.provider.getBalance(owner.address))
    );
    console.log(
      "Sale ETH balance: ",
      divDec(await ethers.provider.getBalance(sale.address))
    );
  });
});
