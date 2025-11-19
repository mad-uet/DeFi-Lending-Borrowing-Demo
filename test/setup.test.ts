import { expect } from "chai";
import { ethers } from "hardhat";

describe("Hardhat Setup", function () {
  it("Should connect to Hardhat network", async function () {
    const [owner] = await ethers.getSigners();
    expect(owner.address).to.be.properAddress;
  });

  it("Should have correct chain ID", async function () {
    const chainId = (await ethers.provider.getNetwork()).chainId;
    expect(chainId).to.equal(31337n);
  });

  it("Should get block number", async function () {
    const blockNumber = await ethers.provider.getBlockNumber();
    expect(blockNumber).to.be.greaterThanOrEqual(0);
  });
});
