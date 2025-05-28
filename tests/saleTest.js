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
let token, sale;

describe.only("sale test", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
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

  it("User0 purchases with 10 ETH", async function () {
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
    await sale.purchaseFor(user0.address, { value: ten });
    console.log(
      "User0 ETH balance: ",
      divDec(await ethers.provider.getBalance(user0.address))
    );
    console.log(
      "User0 sale amount: ",
      divDec(await sale.account_Amount(user0.address))
    );
  });
});
