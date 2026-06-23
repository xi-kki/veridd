/**
 * Deploys VeriddReputation to an in-process Hardhat node,
 * then prints the contract address to stdout.
 *
 * Run: npx hardhat run scripts/deploy-inline.ts
 */
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const Veridd = await ethers.getContractFactory('VeriddReputation');
  const contract = await Veridd.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`CONTRACT_ADDRESS=${address}`);

  // Quick test
  const tx = await contract.createAgent('LocalTest', 'Testing local deploy', 'ipfs://test');
  await tx.wait();
  const agent = await contract.getAgent(0);
  console.log(`Agent#0: ${agent.name} — ${agent.description}`);
  console.log(`DONE`);
}

main().catch(console.error);
