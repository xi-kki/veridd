import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying VeriddReputation to 0G Galileo Testnet...");
  console.log("⛓️  Chain ID: 16602");
  console.log("🔗 RPC: https://evmrpc-testnet.0g.ai\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} 0G\n`);

  if (balance === 0n) {
    console.error("❌ Deployer has no 0G tokens! Get testnet tokens at:");
    console.error("   https://faucet.0g.ai");
    process.exit(1);
  }

  const Veridd = await ethers.getContractFactory("VeriddReputation");
  const contract = await Veridd.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const receipt = await contract.deploymentTransaction()?.wait();
  
  console.log(`\n✅ Veridd deployed successfully!`);
  console.log(`📄 Contract: ${address}`);
  console.log(`⛽ Gas used: ${receipt?.gasUsed.toString() || "N/A"}`);
  console.log(`🔗 Explorer: https://chainscan-galileo.0g.ai/address/${address}`);

  const name = await contract.name();
  const symbol = await contract.symbol();
  console.log(`📛 ${name} (${symbol})`);
  
  console.log(`\n⚡ Next steps:`);
  console.log(`   1. Copy address into frontend/src/App.tsx`);
  console.log(`   2. cd frontend && npm run dev`);
  console.log(`   3. Connect wallet and register agents!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
