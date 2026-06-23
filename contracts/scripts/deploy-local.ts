import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying VeriddReputation to Local Hardhat Node...\n');

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  const Veridd = await ethers.getContractFactory('VeriddReputation');
  const contract = await Veridd.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log(`✅ Veridd deployed successfully!`);
  console.log(`📄 Contract: ${address}`);
  console.log(`🔗 Local: http://localhost:8545\n`);

  const name = await contract.name();
  const symbol = await contract.symbol();
  console.log(`📛 ${name} (${symbol})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
