import { expect } from "chai";
import { ethers } from "hardhat";
import { LARToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LARToken", function () {
  let larToken: LARToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const LARTokenFactory = await ethers.getContractFactory("LARToken");
    larToken = await LARTokenFactory.deploy();
  });

  describe("Deployment", function () {
    it("should deploy with correct initial supply", async function () {
      const totalSupply = await larToken.totalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
    });

    it("should assign initial supply to deployer", async function () {
      const ownerBalance = await larToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("should have correct name and symbol", async function () {
      expect(await larToken.name()).to.equal("Lending And Reward");
      expect(await larToken.symbol()).to.equal("LAR");
    });

    it("should have 18 decimals", async function () {
      expect(await larToken.decimals()).to.equal(18);
    });
  });

  describe("Transfers", function () {
    it("should allow transfers between accounts", async function () {
      const transferAmount = ethers.parseEther("100");
      
      await larToken.transfer(addr1.address, transferAmount);
      expect(await larToken.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await larToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - transferAmount
      );
    });

    it("should fail when sender has insufficient balance", async function () {
      const larTokenAddr1 = larToken.connect(addr1);
      await expect(
        larTokenAddr1.transfer(owner.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it("should emit Transfer event", async function () {
      const transferAmount = ethers.parseEther("100");
      await expect(larToken.transfer(addr1.address, transferAmount))
        .to.emit(larToken, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });
  });

  describe("Allowances", function () {
    it("should allow approval and transferFrom", async function () {
      const amount = ethers.parseEther("100");
      
      await larToken.approve(addr1.address, amount);
      expect(await larToken.allowance(owner.address, addr1.address)).to.equal(amount);
      
      const larTokenAddr1 = larToken.connect(addr1);
      await larTokenAddr1.transferFrom(owner.address, addr2.address, amount);
      
      expect(await larToken.balanceOf(addr2.address)).to.equal(amount);
    });

    it("should emit Approval event", async function () {
      const amount = ethers.parseEther("100");
      await expect(larToken.approve(addr1.address, amount))
        .to.emit(larToken, "Approval")
        .withArgs(owner.address, addr1.address, amount);
    });

    it("should fail transferFrom with insufficient allowance", async function () {
      const larTokenAddr1 = larToken.connect(addr1);
      await expect(
        larTokenAddr1.transferFrom(owner.address, addr2.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });
  });

  describe("Burn", function () {
    it("should allow owner to burn tokens from any address", async function () {
      const burnAmount = ethers.parseEther("100");
      const initialSupply = await larToken.totalSupply();
      
      await larToken.burn(owner.address, burnAmount);
      
      expect(await larToken.totalSupply()).to.equal(initialSupply - burnAmount);
      expect(await larToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY - burnAmount
      );
    });

    it("should fail when non-owner tries to burn", async function () {
      const larTokenAddr1 = larToken.connect(addr1);
      await expect(
        larTokenAddr1.burn(addr1.address, ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it("should fail when burning more than balance", async function () {
      await expect(
        larToken.burn(owner.address, INITIAL_SUPPLY + 1n)
      ).to.be.reverted;
    });

    it("should emit Transfer event on burn", async function () {
      const burnAmount = ethers.parseEther("100");
      await expect(larToken.burn(owner.address, burnAmount))
        .to.emit(larToken, "Transfer")
        .withArgs(owner.address, ethers.ZeroAddress, burnAmount);
    });
  });

  describe("Gas Optimization", function () {
    it("should have reasonable deployment gas cost", async function () {
      const LARTokenFactory = await ethers.getContractFactory("LARToken");
      const deployTx = await LARTokenFactory.getDeployTransaction();
      const estimatedGas = await ethers.provider.estimateGas(deployTx);
      
      // Should be under 1.3M gas (includes coverage instrumentation overhead)
      expect(estimatedGas).to.be.lessThan(1_300_000);
    });

    it("should have reasonable transfer gas cost", async function () {
      const transferAmount = ethers.parseEther("100");
      const tx = await larToken.transfer(addr1.address, transferAmount);
      const receipt = await tx.wait();
      
      // Should be under 60k gas for transfer
      expect(receipt!.gasUsed).to.be.lessThan(60_000);
    });

    it("should have reasonable burn gas cost", async function () {
      const burnAmount = ethers.parseEther("100");
      const tx = await larToken.burn(owner.address, burnAmount);
      const receipt = await tx.wait();
      
      // Should be under 40k gas for burn
      expect(receipt!.gasUsed).to.be.lessThan(40_000);
    });
  });
});
