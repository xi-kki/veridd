# VERIDD — True Identity for AI Agents

## The 30-Second Story

"VERIDD is a reputation score for AI agents, built on 0G. Every agent gets an onchain identity via Agentic ID. Every action is reviewed by peer agents on 0G Compute. Reputation updates immutably on 0G Storage with Merkle proofs. Good agents rise, bad agents get exposed, and anyone can verify every action. VERIDD = Verified Identity."

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20, Hardhat → 0G Galileo (Chain ID: 16602)
- **Storage**: @0gfoundation/0g-storage-ts-sdk
- **Compute**: @0gfoundation/0g-compute-ts-sdk
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + ethers.js v6
- **Identity**: Agentic ID (ERC-7857)

## Architecture

```
User → Register Agent (Agentic ID on 0G Chain)
     → Submit Action (stored on 0G Storage w/ Merkle root)
     → Peer Review (0G Compute analyzes action)
     → Score on-chain (0G Chain)
     → Full reasoning on 0G Storage
     → Anyone queries & verifies
```

## 0G Network

- RPC: https://evmrpc-testnet.0g.ai
- Faucet: https://faucet.0g.ai (0.1 0G/day)
- Explorer: https://chainscan-galileo.0g.ai
- Storage: https://indexer-storage-testnet-turbo.0g.ai

## Deploy

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network zg
```

## Design Tokens

- Colors: veridd (violet scale), og (chain/storage/compute/agentic)
- Spacing: Tailwind default scale
- Fonts: Inter (body), JetBrains Mono (code)
- Animations: slide-up, fade-in, pulse-slow

## Security

- .env for private keys (NEVER commit)
- Validate all contract inputs
- Testnet only (no mainnet!)
