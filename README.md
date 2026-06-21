# 🤖 VERID — True Identity for AI Agents

> **Built for the 0G Zero Cup 2026**
>
> VERID = Veri (Verify / Veritas = Truth) + ID (Identity)
> *"Verified Identity" | "True Identity" | "The Real One"*

---

## The 30-Second Pitch

**VERID is a credit score for AI agents, built on 0G.** Every agent gets an onchain identity via **Agentic ID**. Every action they take is reviewed by peer agents running on **0G Compute**. Their reputation updates immutably on **0G Storage** with full Merkle-proof verification.

Good agents rise. Bad agents get exposed. **Anyone can verify every action.**

---

## Why This Can't Exist Anywhere Else

| 0G Product | What VERID Uses It For | Why Unique |
|-----------|----------------------|------------|
| **Agentic ID (ERC-7857)** | Onchain identity for each agent — the VERID score IS the agent's identity token | No other chain has native agent identity NFTs |
| **0G Storage** | Full action logs + review reasoning with Merkle tree proofs | Centralized AI can't offer cryptographic proof of actions |
| **0G Compute** | Decentralized peer review agents analyze and score actions | Not one company judging agents — truly decentralized |
| **0G Chain** | Immutable score storage + Agentic ID minting | 600ms block times for real-time agent operations |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                      VERID                            │
├──────────┬──────────┬──────────┬─────────────────────┤
│ 0G Chain │0G Storage│0G Compute│    Agentic ID       │
│(Identity │(Merkle-  │(Peer     │   (ERC-7857         │
│ & Score) │verified  │ Review)  │    Identity)        │
│          │ proofs)  │          │                     │
└──────────┴──────────┴──────────┴─────────────────────┘
```

### Flow
1. **Register Agent** → Mints Agentic ID (ERC-721) on 0G Chain
2. **Submit Action** → Stored on 0G Storage with Merkle tree
3. **Peer Review** → 0G Compute agent analyzes and scores 1-5
4. **Store Proof** → Full action + review on 0G Storage
5. **Update VERID** → Score written on-chain, reputation recalculated
6. **Verify** → Anyone queries reputation + verifies via Merkle root

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contracts | Solidity ^0.8.20 + Hardhat |
| Network | 0G Galileo Testnet (Chain ID: 16602) |
| Storage | @0gfoundation/0g-storage-ts-sdk |
| Compute | @0gfoundation/0g-compute-ts-sdk |
| Identity | Agentic ID (ERC-7857) |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Wallet | MetaMask / OKX Wallet |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or OKX Wallet
- 0G testnet tokens from [faucet.0g.ai](https://faucet.0g.ai)

### 1. Deploy Contract
```bash
cd contracts
npm install
cp ../.env.example .env
# Add your PRIVATE_KEY to .env
npx hardhat compile
npx hardhat run scripts/deploy.ts --network zg
```

### 2. Run Frontend
```bash
cd frontend
npm install
# Update CONTRACT_ADDRESS in src/App.tsx
npm run dev
```

### 3. Run Review Agent (optional)
```bash
npx ts-node scripts/review-agent.ts --agent-id=1
```

---

## 📊 VERID Score Tiers

| Score | Tier | Label | Meaning |
|-------|------|-------|---------|
| 4.5–5.0 | 🏆 Elite | Top-tier | Exceptional agent, beyond expectations |
| 4.0–4.4 | ✅ Trusted | Reliable | Above average, thorough work |
| 3.0–3.9 | 📊 Reliable | Average | Met expectations |
| 2.0–2.9 | ⚠️ Caution | Below avg | Needs improvement |
| 1.0–1.9 | 🚫 Risky | Poor | Harmful or incorrect actions |

---

## 🔗 0G Network Resources

| Resource | URL |
|----------|-----|
| RPC | https://evmrpc-testnet.0g.ai |
| Explorer | https://chainscan-galileo.0g.ai |
| Faucet | https://faucet.0g.ai |
| Storage Indexer | https://indexer-storage-testnet-turbo.0g.ai |
| Docs | https://docs.0g.ai |
| Zero Cup | https://0g.ai/arena/zero-cup |

---

## 🏆 Zero Cup Submission

| Detail | Info |
|--------|------|
| **Project** | VERID — True Identity for AI Agents |
| **Products Used** | 0G Chain + 0G Storage + 0G Compute + Agentic ID |
| **Team** | [Your Name] |
| **Demo** | [Link to 2-min video] |
| **GitHub** | [Link to repo] |
| **Contract** | [Address on Galileo testnet] |

---

*Built for the 0G Zero Cup — Global Vibe Coding Tournament 2026*
