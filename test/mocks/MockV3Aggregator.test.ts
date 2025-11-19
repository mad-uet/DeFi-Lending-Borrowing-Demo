import { expect } from "chai";
import { ethers } from "hardhat";
import { MockV3Aggregator } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockV3Aggregator", function () {
  let aggregator: MockV3Aggregator;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
    // Deploy with 8 decimals (standard for USD price feeds) and initial price of $2000
    aggregator = await MockV3AggregatorFactory.deploy(8, 2000_00000000);
    await aggregator.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct decimals", async function () {
      expect(await aggregator.decimals()).to.equal(8);
    });

    it("Should set the initial answer", async function () {
      const roundData = await aggregator.latestRoundData();
      expect(roundData.answer).to.equal(2000_00000000);
    });

    it("Should start with round 1", async function () {
      const roundData = await aggregator.latestRoundData();
      expect(roundData.roundId).to.equal(1);
    });

    it("Should have matching roundId and answeredInRound", async function () {
      const roundData = await aggregator.latestRoundData();
      expect(roundData.answeredInRound).to.equal(roundData.roundId);
    });
  });

  describe("Price Updates", function () {
    it("Should allow updating the price", async function () {
      const newPrice = 2500_00000000; // $2500
      await aggregator.updateAnswer(newPrice);
      
      const roundData = await aggregator.latestRoundData();
      expect(roundData.answer).to.equal(newPrice);
    });

    it("Should increment round ID on update", async function () {
      await aggregator.updateAnswer(2100_00000000);
      const round1 = await aggregator.latestRoundData();
      expect(round1.roundId).to.equal(2);

      await aggregator.updateAnswer(2200_00000000);
      const round2 = await aggregator.latestRoundData();
      expect(round2.roundId).to.equal(3);
    });

    it("Should update timestamp on price update", async function () {
      const roundDataBefore = await aggregator.latestRoundData();
      
      // Wait a bit and update
      await ethers.provider.send("evm_increaseTime", [2]);
      await ethers.provider.send("evm_mine", []);
      
      await aggregator.updateAnswer(2100_00000000);
      const roundDataAfter = await aggregator.latestRoundData();
      
      expect(roundDataAfter.updatedAt).to.be.greaterThan(roundDataBefore.updatedAt);
    });

    it("Should allow anyone to update price", async function () {
      const newPrice = 1800_00000000; // $1800
      await aggregator.connect(addr1).updateAnswer(newPrice);
      
      const roundData = await aggregator.latestRoundData();
      expect(roundData.answer).to.equal(newPrice);
    });

    it("Should handle negative prices (for certain assets)", async function () {
      const negativePrice = -100_00000000;
      await aggregator.updateAnswer(negativePrice);
      
      const roundData = await aggregator.latestRoundData();
      expect(roundData.answer).to.equal(negativePrice);
    });

    it("Should handle zero price", async function () {
      await aggregator.updateAnswer(0);
      
      const roundData = await aggregator.latestRoundData();
      expect(roundData.answer).to.equal(0);
    });
  });

  describe("Round Data", function () {
    it("Should return all round data fields", async function () {
      const roundData = await aggregator.latestRoundData();
      
      expect(roundData.roundId).to.be.greaterThan(0);
      expect(roundData.answer).to.equal(2000_00000000);
      expect(roundData.startedAt).to.be.greaterThan(0);
      expect(roundData.updatedAt).to.be.greaterThan(0);
      expect(roundData.answeredInRound).to.equal(roundData.roundId);
    });

    it("Should have startedAt equal to updatedAt for initial deployment", async function () {
      const roundData = await aggregator.latestRoundData();
      expect(roundData.startedAt).to.equal(roundData.updatedAt);
    });
  });

  describe("Different Decimal Configurations", function () {
    it("Should support 18 decimals for non-USD pairs", async function () {
      const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
      const ethBtcFeed = await MockV3AggregatorFactory.deploy(18, ethers.parseEther("0.05"));
      await ethBtcFeed.waitForDeployment();
      
      expect(await ethBtcFeed.decimals()).to.equal(18);
    });

    it("Should support 0 decimals", async function () {
      const MockV3AggregatorFactory = await ethers.getContractFactory("MockV3Aggregator");
      const simpleFeed = await MockV3AggregatorFactory.deploy(0, 100);
      await simpleFeed.waitForDeployment();
      
      expect(await simpleFeed.decimals()).to.equal(0);
      const roundData = await simpleFeed.latestRoundData();
      expect(roundData.answer).to.equal(100);
    });
  });

  describe("Version", function () {
    it("Should return version 0", async function () {
      expect(await aggregator.version()).to.equal(0);
    });
  });

  describe("Description", function () {
    it("Should return a description", async function () {
      const description = await aggregator.description();
      expect(description).to.be.a("string");
      expect(description.length).to.be.greaterThan(0);
    });
  });
});
