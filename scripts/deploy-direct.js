/**
 * Deploy VeriddReputation directly to 0G Galileo Testnet
 * using ethers.js (no Hardhat dependency needed)
 *
 * Usage: node scripts/deploy-direct.js
 * Env:   PRIVATE_KEY (required)
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract ABI + bytecode
const artifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'contracts', 'artifacts', 'contracts', 'VeriddReputation.sol', 'VeriddReputation.json'))
);

const RPC = 'https://evmrpc-testnet.0g.ai';
const CONTRACT_ABI = artifact.abi;
const BYTECODE = artifact.bytecode;

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ PRIVATE_KEY env variable required');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(privateKey, provider);
  const balance = await provider.getBalance(wallet.address);

  console.log('🚀 Deploying VeriddReputation to 0G Galileo Testnet');
  console.log('👤 Deployer:', wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), '0G');
  console.log('⛓️  Chain ID: 16602');
  console.log('');

  if (balance === 0n) {
    console.error('❌ No 0G tokens! Get testnet tokens at https://faucet.0g.ai');
    process.exit(1);
  }

  // Deploy
  const factory = new ethers.ContractFactory(CONTRACT_ABI, BYTECODE, wallet);
  console.log('📄 Deploying...');
  const contract = await factory.deploy();
  const receipt = await contract.deploymentTransaction().wait();

  const address = await contract.getAddress();
  console.log('');
  console.log('✅ Deployed successfully!');
  console.log('📄 Address:', address);
  console.log('⛽ Gas used:', receipt.gasUsed.toString());
  console.log('🔗 Explorer: https://chainscan-galileo.0g.ai/address/' + address);
  console.log('');
  console.log('⚡ Update frontend/.env:');
  console.log(`   VITE_CONTRACT_ADDRESS=${address}`);
  console.log('');
  console.log('⚡ Update runner/.env:');
  console.log(`   CONTRACT=${address}`);

  // Verify contract name
  const deployed = new ethers.Contract(address, CONTRACT_ABI, provider);
  try {
    const name = await deployed.name();
    const symbol = await deployed.symbol();
    console.log(`📛 ${name} (${symbol})`);
  } catch {}
}

main().catch((err) => {
  console.error('💥 Deploy failed:', err);
  process.exit(1);
});
