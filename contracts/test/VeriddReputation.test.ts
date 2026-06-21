import { expect } from "chai";
import { ethers } from "hardhat";

describe("VeriddReputation", function () {
  async function deploy() {
    const factory = await ethers.getContractFactory("VeriddReputation");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  it("Should create an agent with Agentic ID", async () => {
    const veridd = await deploy();
    await veridd.createAgent("Alpha", "Trading agent", "veridd://profile/alpha");
    const agent = await veridd.getAgent(0);
    expect(agent.name).to.equal("Alpha");
    expect(agent.exists).to.be.true;
  });

  it("Should reject empty name", async () => {
    const veridd = await deploy();
    await expect(veridd.createAgent("", "desc", "uri")).to.be.revertedWith("Name required");
  });

  it("Should reject name > 64 chars", async () => {
    const veridd = await deploy();
    const long = "A".repeat(65);
    await expect(veridd.createAgent(long, "desc", "uri")).to.be.revertedWith("Name too long (max 64)");
  });

  it("Should reject desc > 500 chars", async () => {
    const veridd = await deploy();
    const long = "A".repeat(501);
    await expect(veridd.createAgent("Alpha", long, "uri")).to.be.revertedWith("Description too long (max 500)");
  });

  it("Should allow self-review (Zero Cup demo: judges can test full flow)", async () => {
    const veridd = await deploy();
    await veridd.createAgent("Alpha", "Trading agent", "veridd://profile/alpha");
    // Self-review is allowed for Zero Cup demo so judges can test the full flow
    await expect(veridd.submitReview(0, 5, "0xroot", "0xroot", "self"))
      .to.not.be.reverted;
    const [avg, total] = await veridd.getReputation(0);
    expect(avg).to.equal(5n);
    expect(total).to.equal(1n);
  });

  it("Should submit review and update credit score", async () => {
    const veridd = await deploy();
    await veridd.createAgent("Alpha", "Trading agent", "veridd://profile/alpha");
    const [, addr] = await ethers.getSigners();
    await veridd.connect(addr).submitReview(0, 4, "0xaction-root", "0xreview-root", "Solid work");
    const [avg, total] = await veridd.getReputation(0);
    expect(avg).to.equal(4n);
    expect(total).to.equal(1n);
  });

  it("Should reject invalid scores", async () => {
    const veridd = await deploy();
    await veridd.createAgent("Alpha", "Trading agent", "veridd://profile/alpha");
    const [, addr] = await ethers.getSigners();
    await expect(veridd.connect(addr).submitReview(0, 6, "0xroot", "0xroot", "bad"))
      .to.be.revertedWith("Score must be 1-5");
  });

  it("Should average multiple reviews", async () => {
    const veridd = await deploy();
    await veridd.createAgent("Alpha", "Trading agent", "veridd://profile/alpha");
    const [, alice, bob, carol] = await ethers.getSigners();
    await veridd.connect(alice).submitReview(0, 5, "0xA", "0xrA", "Perfect");
    await veridd.connect(bob).submitReview(0, 3, "0xB", "0xrB", "OK");
    await veridd.connect(carol).submitReview(0, 4, "0xC", "0xrC", "Good");
    const [avg] = await veridd.getReputation(0);
    expect(avg).to.equal(4n);
  });

  it("Should verify action proofs", async () => {
    const veridd = await deploy();
    await veridd.createAgent("Alpha", "Trading agent", "veridd://profile/alpha");
    const [, addr] = await ethers.getSigners();
    await veridd.connect(addr).submitReview(0, 5, "0xreal-root", "0xreview-root", "Great");
    expect(await veridd.verifyActionProof(0, 0, "0xreal-root")).to.be.true;
    expect(await veridd.verifyActionProof(0, 0, "0xfake-root")).to.be.false;
  });

  it("Should mint Agentic ID as ERC-721 owned by creator", async () => {
    const veridd = await deploy();
    const [owner] = await ethers.getSigners();
    await veridd.createAgent("Beta", "Second agent", "veridd://profile/beta");
    expect(await veridd.ownerOf(0)).to.equal(owner.address);
    expect(await veridd.balanceOf(owner.address)).to.equal(1n);
  });

  it("Should handle non-existent agent gracefully", async () => {
    const veridd = await deploy();
    await expect(veridd.getAgent(99)).to.be.revertedWith("Agent does not exist");
  });

  it("Should return zero reputation for new agent", async () => {
    const veridd = await deploy();
    await veridd.createAgent("Gamma", "New agent", "uri");
    const [avg, total] = await veridd.getReputation(0);
    expect(avg).to.equal(0n);
    expect(total).to.equal(0n);
  });
});
