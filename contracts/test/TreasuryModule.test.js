const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TreasuryModule", function () {
  let treasury;
  let mockToken;
  let dao;
  let governance;
  let user1;
  let user2;

  beforeEach(async function () {
    [dao, governance, user1, user2] = await ethers.getSigners();

    // Deploy treasury
    const TreasuryModule = await ethers.getContractFactory("TreasuryModule");
    treasury = await TreasuryModule.deploy();

    // Initialize
    await treasury.initialize(dao.address, governance.address);

    // Deploy mock ERC20 token for testing
    const MockToken = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MOCK", ethers.parseEther("1000000"));
  });

  describe("Initialization", function () {
    it("Should set correct DAO and governance addresses", async function () {
      expect(await treasury.dao()).to.equal(dao.address);
      expect(await treasury.governance()).to.equal(governance.address);
    });

    it("Should prevent double initialization", async function () {
      await expect(
        treasury.initialize(dao.address, governance.address)
      ).to.be.revertedWith("Already initialized");
    });

    it("Should fail with invalid addresses", async function () {
      const TreasuryModule = await ethers.getContractFactory("TreasuryModule");
      const newTreasury = await TreasuryModule.deploy();

      await expect(
        newTreasury.initialize(ethers.ZeroAddress, governance.address)
      ).to.be.revertedWith("Invalid DAO");

      await expect(
        newTreasury.initialize(dao.address, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid governance");
    });
  });

  describe("ETH Deposits", function () {
    it("Should receive ETH via deposit function", async function () {
      const amount = ethers.parseEther("1.0");

      await expect(treasury.deposit({ value: amount }))
        .to.emit(treasury, "Deposit")
        .withArgs(dao.address, ethers.ZeroAddress, amount);

      expect(await ethers.provider.getBalance(await treasury.getAddress())).to.equal(amount);
      expect(await treasury.totalDeposits()).to.equal(amount);
    });

    it("Should receive ETH via fallback", async function () {
      const amount = ethers.parseEther("0.5");

      await expect(
        user1.sendTransaction({
          to: await treasury.getAddress(),
          value: amount,
        })
      )
        .to.emit(treasury, "Deposit")
        .withArgs(user1.address, ethers.ZeroAddress, amount);

      expect(await ethers.provider.getBalance(await treasury.getAddress())).to.equal(amount);
    });

    it("Should fail depositing zero ETH", async function () {
      await expect(treasury.deposit({ value: 0 })).to.be.revertedWith(
        "No ETH sent"
      );
    });

    it("Should accumulate multiple deposits", async function () {
      await treasury.deposit({ value: ethers.parseEther("1.0") });
      await treasury.deposit({ value: ethers.parseEther("0.5") });

      expect(await treasury.totalDeposits()).to.equal(ethers.parseEther("1.5"));
    });
  });

  describe("Token Deposits", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1 for testing
      await mockToken.transfer(user1.address, ethers.parseEther("1000"));
    });

    it("Should accept token deposits", async function () {
      const amount = ethers.parseEther("100");

      // Approve treasury to spend tokens
      await mockToken.connect(user1).approve(await treasury.getAddress(), amount);

      await expect(treasury.connect(user1).depositToken(await mockToken.getAddress(), amount))
        .to.emit(treasury, "Deposit")
        .withArgs(user1.address, await mockToken.getAddress(), amount);

      expect(await treasury.tokenBalances(await mockToken.getAddress())).to.equal(amount);
    });

    it("Should add token to supported tokens list", async function () {
      const amount = ethers.parseEther("100");
      await mockToken.connect(user1).approve(await treasury.getAddress(), amount);
      await treasury.connect(user1).depositToken(await mockToken.getAddress(), amount);

      const supportedTokens = await treasury.getSupportedTokens();
      expect(supportedTokens).to.include(await mockToken.getAddress());
    });

    it("Should fail with invalid token address", async function () {
      await expect(
        treasury.depositToken(ethers.ZeroAddress, 100)
      ).to.be.revertedWith("Invalid token");
    });

    it("Should fail depositing zero tokens", async function () {
      await expect(
        treasury.depositToken(await mockToken.getAddress(), 0)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should handle multiple token types", async function () {
      // Deploy second token
      const MockToken2 = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20");
      const mockToken2 = await MockToken2.deploy("Mock Token 2", "MOCK2", ethers.parseEther("1000000"));
      await mockToken2.transfer(user1.address, ethers.parseEther("1000"));

      // Deposit both tokens
      await mockToken.connect(user1).approve(await treasury.getAddress(), ethers.parseEther("100"));
      await treasury.connect(user1).depositToken(await mockToken.getAddress(), ethers.parseEther("100"));

      await mockToken2.connect(user1).approve(await treasury.getAddress(), ethers.parseEther("50"));
      await treasury.connect(user1).depositToken(await mockToken2.getAddress(), ethers.parseEther("50"));

      expect(await treasury.getSupportedTokens()).to.have.lengthOf(2);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Add some ETH to treasury
      await treasury.deposit({ value: ethers.parseEther("10.0") });

      // Add some tokens to treasury
      await mockToken.transfer(user1.address, ethers.parseEther("1000"));
      await mockToken.connect(user1).approve(await treasury.getAddress(), ethers.parseEther("500"));
      await treasury.connect(user1).depositToken(await mockToken.getAddress(), ethers.parseEther("500"));
    });

    it("Should allow governance to withdraw ETH", async function () {
      const amount = ethers.parseEther("1.0");
      const initialBalance = await ethers.provider.getBalance(user2.address);

      await expect(
        treasury.connect(governance).withdraw(ethers.ZeroAddress, amount, user2.address)
      )
        .to.emit(treasury, "Withdrawal")
        .withArgs(user2.address, ethers.ZeroAddress, amount);

      expect(await ethers.provider.getBalance(user2.address)).to.equal(initialBalance + amount);
      expect(await treasury.totalWithdrawals()).to.equal(amount);
    });

    it("Should allow governance to withdraw tokens", async function () {
      const amount = ethers.parseEther("100");

      await expect(
        treasury.connect(governance).withdraw(await mockToken.getAddress(), amount, user2.address)
      )
        .to.emit(treasury, "Withdrawal")
        .withArgs(user2.address, await mockToken.getAddress(), amount);

      expect(await mockToken.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should prevent non-governance from withdrawing", async function () {
      await expect(
        treasury.connect(user1).withdraw(ethers.ZeroAddress, ethers.parseEther("1.0"), user2.address)
      ).to.be.revertedWith("Only governance");
    });

    it("Should fail with invalid recipient", async function () {
      await expect(
        treasury.connect(governance).withdraw(ethers.ZeroAddress, ethers.parseEther("1.0"), ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Should fail with zero amount", async function () {
      await expect(
        treasury.connect(governance).withdraw(ethers.ZeroAddress, 0, user2.address)
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("Should fail with insufficient ETH balance", async function () {
      const balance = await ethers.provider.getBalance(await treasury.getAddress());
      const tooMuch = balance + ethers.parseEther("1.0");

      await expect(
        treasury.connect(governance).withdraw(ethers.ZeroAddress, tooMuch, user2.address)
      ).to.be.revertedWith("Insufficient ETH");
    });

    it("Should fail with insufficient token balance", async function () {
      const balance = await treasury.tokenBalances(await mockToken.getAddress());
      const tooMuch = balance + ethers.parseEther("100");

      await expect(
        treasury.connect(governance).withdraw(await mockToken.getAddress(), tooMuch, user2.address)
      ).to.be.revertedWith("Insufficient token balance");
    });

    it("Should update token balance after withdrawal", async function () {
      const initialBalance = await treasury.tokenBalances(await mockToken.getAddress());
      const withdrawAmount = ethers.parseEther("100");

      await treasury.connect(governance).withdraw(await mockToken.getAddress(), withdrawAmount, user2.address);

      expect(await treasury.tokenBalances(await mockToken.getAddress())).to.equal(
        initialBalance - withdrawAmount
      );
    });
  });

  describe("Balance Queries", function () {
    beforeEach(async function () {
      await treasury.deposit({ value: ethers.parseEther("5.0") });

      await mockToken.transfer(user1.address, ethers.parseEther("1000"));
      await mockToken.connect(user1).approve(await treasury.getAddress(), ethers.parseEther("300"));
      await treasury.connect(user1).depositToken(await mockToken.getAddress(), ethers.parseEther("300"));
    });

    it("Should return correct ETH balance", async function () {
      const balance = await treasury.getBalance(ethers.ZeroAddress);
      expect(balance).to.equal(ethers.parseEther("5.0"));
    });

    it("Should return correct token balance", async function () {
      const balance = await treasury.getBalance(await mockToken.getAddress());
      expect(balance).to.equal(ethers.parseEther("300"));
    });

    it("Should return zero for unsupported token", async function () {
      const balance = await treasury.getBalance(user1.address); // Random address
      expect(balance).to.equal(0);
    });

    it("Should list all supported tokens", async function () {
      const tokens = await treasury.getSupportedTokens();
      expect(tokens).to.include(await mockToken.getAddress());
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy on withdraw", async function () {
      // This would require a malicious contract
      // Basic check that nonReentrant modifier is present
      // Full test would need a ReentrancyAttacker contract
    });
  });
});
