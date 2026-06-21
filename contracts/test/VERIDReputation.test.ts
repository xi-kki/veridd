import { expect } from "chai";
import { ethers } from "hardhat";

describe("VERIDReputation", function () {
  async function deploy() {
    const factory = await ethers.getContractFactory("VERIDReputation");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  it("Should create an agent with Agentic ID", async () => {
    const verid = await deploy();
    await verid.createAgent("Alpha", "Trading agent", "verid://profile/alpha");
    const agent = await verid.getAgent(0);
    expect(agent.name).to.equal("Alpha");
    expect(agent.exists).to.be.true;
  });

  it("Should reject empty name", async () => {
    const verid = await deploy();
    await expect(verid.createAgent("", "desc", "uri")).to.be.revertedWith("Name required");
  });

  it("Should reject name > 64 chars", async () => {
    const verid = await deploy();
    const long = "A".repeat(65);
    await expect(verid.createAgent(long, "desc", "uri")).to.be.revertedWith("Name too long (max 64)");
  });

  it("Should reject desc > 500 chars", async () => {
    const verid = await deploy();
    const long = "A".repeat(501);
    await expect(verid.createAgent("Alpha", long, "uri")).to.be.revertedWith("Description too long (max 500)");
  });

  it("Should reject self-review", async () => {
    const verid = await deploy();
    await verid.createAgent("Alpha", "Trading agent", "verid://profile/alpha");
    await expect(verid.submitReview(0, 5, "0xroot", "0xroot", "self"))
      .to.be.revertedWith("Cannot self-review");
  });

  it("Should submit review and update credit score", async () => {
    const verid = await deploy();
    await verid.createAgent("Alpha", "Trading agent", "verid://profile/alpha");
    const [, addr] = await ethers.getSigners();
    await verid.connect(addr).submitReview(0, 4, "0xaction-root", "0xreview-root", "Solid work");
    const [avg, total] = await verid.getReputation(0);
    expect(avg).to.equal(4n);
    expect(total).to.equal(1n);
  });

  it("Should reject invalid scores", async () => {
    const verid = await deploy();
    await verid.createAgent("Alpha", "Trading agent", "verid://profile/alpha");
    const [, addr] = await ethers.getSigners();
    await expect(verid.connect(addr).submitReview(0, 6, "0xroot", "0xroot", "bad"))
      .to.be.revertedWith("Score must be 1-5");
  });

  it("Should average multiple reviews", async () => {
    const verid = await deploy();
    await verid.createAgent("Alpha", "Trading agent", "verid://profile/alpha");
    const [, alice, bob, carol] = await ethers.getSigners();
    await verid.connect(alice).submitReview(0, 5, "0xA", "0xrA", "Perfect");
    await verid.connect(bob).submitReview(0, 3, "0xB", "0xrB", "OK");
    await verid.connect(carol).submitReview(0, 4, "0xC", "0xrC", "Good");
    const [avg] = await verid.getReputation(0);
    expect(avg).to.equal(4n);
  });

  it("Should verify action proofs", async () => {
    const verid = await deploy();
    await verid.createAgent("Alpha", "Trading agent", "verid://profile/alpha");
    const [, addr] = await ethers.getSigners();
    await verid.connect(addr).submitReview(0, 5, "0xreal-root", "0xreview-root", "Great");
    expect(await verid.verifyActionProof(0, 0, "0xreal-root")).to.be.true;
    expect(await verid.verifyActionProof(0, 0, "0xfake-root")).to.be.false;
  });

  it("Should mint Agentic ID as ERC-721 owned by creator", async () => {
    const verid = await deploy();
    const [owner] = await ethers.getSigners();
    await verid.createAgent("Beta", "Second agent", "verid://profile/beta");
    expect(await verid.ownerOf(0)).to.equal(owner.address);
    expect(await verid.balanceOf(owner.address)).to.equal(1n);
  });

  it("Should handle non-existent agent gracefully", async () => {
    const verid = await deploy();
    await expect(verid.getAgent(99)).to.be.revertedWith("Agent does not exist");
  });

  it("Should return zero reputation for new agent", async () => {
    const verid = await deploy();
    await verid.createAgent("Gamma", "New agent", "uri");
    const [avg, total] = await verid.getReputation(0);
    expect(avg).to.equal(0n);
    expect(total).to.equal(0n);
  });
});
