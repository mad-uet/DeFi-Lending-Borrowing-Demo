import { expect } from "chai";
import { ethers } from "hardhat";
import { MockERC20 } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockERC20", function () {
  let mockToken: MockERC20;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20Factory.deploy("Mock Token", "MTK", 18);
    await mockToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name", async function () {
      expect(await mockToken.name()).to.equal("Mock Token");
    });

    it("Should set the correct symbol", async function () {
      expect(await mockToken.symbol()).to.equal("MTK");
    });

    it("Should set the correct decimals", async function () {
      expect(await mockToken.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      expect(await mockToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow anyone to mint tokens", async function () {
      const mintAmount = ethers.parseEther("100");
      await mockToken.connect(addr1).mint(addr1.address, mintAmount);
      expect(await mockToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should increase total supply when minting", async function () {
      const mintAmount = ethers.parseEther("100");
      await mockToken.mint(owner.address, mintAmount);
      expect(await mockToken.totalSupply()).to.equal(mintAmount);
    });

    it("Should emit Transfer event on mint", async function () {
      const mintAmount = ethers.parseEther("100");
      await expect(mockToken.mint(addr1.address, mintAmount))
        .to.emit(mockToken, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);
    });

    it("Should allow minting to multiple addresses", async function () {
      const amount1 = ethers.parseEther("50");
      const amount2 = ethers.parseEther("75");
      
      await mockToken.mint(addr1.address, amount1);
      await mockToken.mint(addr2.address, amount2);
      
      expect(await mockToken.balanceOf(addr1.address)).to.equal(amount1);
      expect(await mockToken.balanceOf(addr2.address)).to.equal(amount2);
      expect(await mockToken.totalSupply()).to.equal(amount1 + amount2);
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await mockToken.mint(owner.address, ethers.parseEther("1000"));
    });

    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("50");
      await mockToken.transfer(addr1.address, transferAmount);
      expect(await mockToken.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await mockToken.balanceOf(owner.address);
      await expect(
        mockToken.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.reverted;
      expect(await mockToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await mockToken.balanceOf(owner.address);
      const transferAmount = ethers.parseEther("100");
      
      await mockToken.transfer(addr1.address, transferAmount);
      await mockToken.transfer(addr2.address, transferAmount);
      
      expect(await mockToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance - (transferAmount * 2n)
      );
      expect(await mockToken.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await mockToken.balanceOf(addr2.address)).to.equal(transferAmount);
    });
  });

  describe("Approvals", function () {
    it("Should approve tokens for delegated transfer", async function () {
      const approveAmount = ethers.parseEther("100");
      await mockToken.approve(addr1.address, approveAmount);
      expect(await mockToken.allowance(owner.address, addr1.address)).to.equal(approveAmount);
    });

    it("Should allow transferFrom with sufficient allowance", async function () {
      await mockToken.mint(owner.address, ethers.parseEther("1000"));
      const transferAmount = ethers.parseEther("50");
      
      await mockToken.approve(addr1.address, transferAmount);
      await mockToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);
      
      expect(await mockToken.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should fail transferFrom with insufficient allowance", async function () {
      await mockToken.mint(owner.address, ethers.parseEther("1000"));
      await expect(
        mockToken.connect(addr1).transferFrom(owner.address, addr2.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });
  });

  describe("Custom Decimals", function () {
    it("Should deploy USDC-like token with 6 decimals", async function () {
      const MockERC20Factory = await ethers.getContractFactory("MockERC20");
      const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
      await usdc.waitForDeployment();
      
      expect(await usdc.decimals()).to.equal(6);
      
      const mintAmount = 1000000n; // 1 USDC with 6 decimals
      await usdc.mint(owner.address, mintAmount);
      expect(await usdc.balanceOf(owner.address)).to.equal(mintAmount);
    });
  });
});
