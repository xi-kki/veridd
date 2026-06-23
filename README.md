<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://files.catbox.moe/k3npqm.jpg">
  <img alt="VERIDD Banner" src="https://files.catbox.moe/k3npqm.jpg" width="100%">
</picture>

# 🛡️ VERIDD — Onchain Reputation for AI Agents

> **Zero Cup 2026 — Global Vibe Coding Tournament**
>
> _0G-powered agent infrastructure — 100% on 0G. Storage, Chain, and Compute._

<br>

<p align="center">
  <a href="https://veridd.netlify.app">
    <img src="https://img.shields.io/badge/demo-live-8B5CF6?style=for-the-badge&logo=netlify&logoColor=white" alt="Live Demo">
  </a>
  <a href="https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88">
    <img src="https://img.shields.io/badge/contract-deployed-22C55E?style=for-the-badge&logo=ethereum&logoColor=white" alt="Contract">
  </a>
  <a href="https://github.com/xi-kki/veridd">
    <img src="https://img.shields.io/badge/source-github-1f1f1f?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  <br>
  <img src="https://img.shields.io/badge/0G%20Chain-Galileo%20Testnet-6366F1?style=flat-square" alt="0G Chain">
  <img src="https://img.shields.io/badge/0G%20Storage-Merkle%20Proofs-6366F1?style=flat-square" alt="0G Storage">
  <img src="https://img.shields.io/badge/0G%20Compute-Peer%20Review-6366F1?style=flat-square" alt="0G Compute">
  <img src="https://img.shields.io/badge/Agentic%20ID-ERC--7857-6366F1?style=flat-square" alt="Agentic ID">
</p>

---

## 📋 Quick Access for Judges

| Resource                   | Link                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 🌐 **Live Demo**           | [veridd.netlify.app](https://veridd.netlify.app)                                                                                   |
| 📄 **Contract (Verified)** | [`0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88`](https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88) |
| 🖼️ **Screenshot**          | [View](https://files.catbox.moe/tflwui.PNG)                                                                                        |
| 🎥 **Demo Video**          | _(coming soon)_                                                                                                                    |
| 📦 **Source Code**         | [github.com/xi-kki/veridd](https://github.com/xi-kki/veridd)                                                                       |
| ⛓️ **Network**             | 0G Galileo Testnet (Chain ID: 16602)                                                                                               |

---

## 🎯 One-Line Pitch

**Trustpilot for AI agents — with cryptographic proof, powered by 0G.**

Every AI agent gets a verifiable, onchain credit score they earn through real work — not claims. Good agents rise. Bad agents get exposed. Anyone can verify every action.

---

## ❓ Problem

AI agents are exploding across DeFi, trading, analytics, auditing, and automation. But there's **no way to know if an agent is reliable** before trusting it with access, data, or payment.

Current reputation systems are:

- ❌ Centralized — one company controls the data
- ❌ Opaque — no way to verify claims
- ❌ Siloed — reputation doesn't travel between platforms

**This is a $1B problem.** As AI agents handle more value, trust becomes the bottleneck.

---

## ✅ Solution

VERIDD gives every AI agent an **immutable, verifiable, onchain credit score** built entirely on 0G's decentralized stack:

| 0G Product        | What VERIDD Uses It For                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| **🧬 0G Chain**   | Agentic ID (ERC-721) minting + immutable reputation state on Galileo testnet |
| **💾 0G Storage** | Action logs + peer review reasoning with Merkle tree cryptographic proofs    |
| **🧠 0G Compute** | Decentralized peer review AI agents that analyze and score actions           |
| **🆔 Agentic ID** | Portable onchain identity for every registered agent via ERC-7857 standard   |

---

## 🏗️ Architecture

```
                         ┌─────────────────────────────────────┐
                         │         VERIDD Protocol              │
                         ├───────────┬───────────┬─────────────┤
                         │ 0G Chain  │0G Storage │ 0G Compute  │
                         │ (Identity │  (Action  │   (Peer     │
                         │  + Score) │  Proofs)  │   Review)   │
                         └─────┬─────┴─────┬─────┴──────┬──────┘
                               │           │            │
          ┌────────────────────┘           │            └──────────┐
          ▼                                ▼                      ▼
   ┌──────────────┐               ┌──────────────┐       ┌──────────────┐
   │  Agentic ID  │               │   Merkle     │       │  AI Review   │
   │  (ERC-7857)  │               │   Proofs     │       │   Agents     │
   │  Minted on   │               │   Stored on  │       │   Running on │
   │  0G Chain    │               │  0G Storage  │       │  0G Compute  │
   └──────┬───────┘               └──────┬───────┘       └──────┬───────┘
          │                              │                      │
          └──────────────────────────────┼──────────────────────┘
                                         ▼
                              ┌────────────────────┐
                              │  VERIDD Score =    │
                              │  Onchain Credit    │
                              │  Rating (1-5 ⭐)   │
                              └────────────────────┘
```

### Data Flow

```
1️⃣ Register Agent
   → Agentic ID (ERC-721) minted on 0G Chain
   → Agent gets a unique, portable identity

2️⃣ Agent Performs Action
   → Action data stored on 0G Storage
   → Merkle root committed on-chain

3️⃣ Peer Review
   → 0G Compute agent analyzes the action
   → Scores 1-5 with on-chain reasoning

4️⃣ Reputation Update
   → Score written to 0G Chain
   → Running average recalculated
   → Full review data on 0G Storage

5️⃣ Verify Anyone
   → Query any agent's VERIDD score
   → Verify individual actions via Merkle proof
   → No blind trust required
```

---

## 📊 VERIDD Score Tiers

| Score Range | Tier            | Badge      | Meaning                          |
| ----------- | --------------- | ---------- | -------------------------------- |
| 4.5 – 5.0   | 🏆 **Elite**    | ⭐⭐⭐⭐⭐ | Exceptional, beyond expectations |
| 4.0 – 4.4   | ✅ **Trusted**  | ⭐⭐⭐⭐   | Reliable, above average          |
| 3.0 – 3.9   | 📊 **Reliable** | ⭐⭐⭐     | Met expectations                 |
| 2.0 – 2.9   | ⚠️ **Caution**  | ⭐⭐       | Below average                    |
| 1.0 – 1.9   | 🚫 **Risky**    | ⭐         | Poor track record                |

---

## 🎮 UI Features (Judge Please Try)

| Feature                    | Details                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 🏅 **Floating Medal Card** | Physics-driven superhero tilt on the 0G logo. Card hangs from circular medal ribbon. Cape tail cascades below. |
| 🚀 **Rocket Cursor**       | Purple rocket with white outline, tilts with movement, emits exhaust fumes as you move                         |
| 🎯 **3-Hover Mechanic**    | Card dodges twice, on 3rd reach it surrenders — connect button pulses                                          |
| 🎉 **Celebration Burst**   | 60-particle burst on connect click, trust ticker counts to 12,847 agents                                       |
| 🌌 **Space Scene**         | Asteroids, ringed planets, comets drifting in the background                                                   |

👉 **Try it:** https://veridd.netlify.app

---

## 🧱 Tech Stack

| Component            | Technology                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Smart Contracts**  | Solidity ^0.8.20, OpenZeppelin, Hardhat                                                                                            |
| **Network**          | 0G Galileo Testnet (Chain ID: 16602)                                                                                               |
| **Contract Address** | [`0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88`](https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88) |
| **Storage SDK**      | @0gfoundation/0g-storage-ts-sdk (Merkle proofs)                                                                                    |
| **Compute SDK**      | @0gfoundation/0g-compute-ts-sdk (peer review agents)                                                                               |
| **Identity**         | Agentic ID (ERC-7857) via VeriddReputation contract                                                                                |
| **Frontend**         | React 18 + Vite + TypeScript + Tailwind CSS                                                                                        |
| **Wallet**           | ethers.js v6 + MetaMask / OKX Wallet                                                                                               |
| **Deployment**       | Netlify (CI/CD from GitHub)                                                                                                        |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or OKX Wallet with 0G Galileo testnet added
- 0G testnet tokens from [faucet.0g.ai](https://faucet.0g.ai)

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/xi-kki/veridd.git
cd veridd

# 2. (Optional) Deploy your own contract
cd contracts
npm install
cp .env.example .env
# Add your PRIVATE_KEY to .env
npx hardhat compile
npx hardhat run scripts/deploy.ts --network zg

# 3. Run the frontend
cd ../frontend
npm install
npm run dev
```

Open **http://localhost:5173** and connect your wallet.

---

## 🔗 Smart Contract

**VeriddReputation** — ERC-721 with reputation scoring.

| Detail       | Value                                                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Name**     | Veridd Reputation                                                                                                                  |
| **Symbol**   | VERIDD                                                                                                                             |
| **Network**  | 0G Galileo Testnet                                                                                                                 |
| **Chain ID** | 16602                                                                                                                              |
| **Address**  | [`0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88`](https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88) |
| **Standard** | ERC-721 (Agentic ID compatible)                                                                                                    |

### Core Functions

```solidity
// Register a new agent — mints an Agentic ID NFT
function createAgent(string name, string description, string metadataURI) external returns (uint256);

// Submit a peer review with action proof from 0G Storage
function submitReview(uint256 agentId, uint256 score, string actionStorageRoot, string reviewStorageRoot, string summary) external;

// Check an agent's VERIDD score before trusting them
function getAgentScore(uint256 agentId) external view returns (uint256 averageScore, uint256 totalReviews);
```

---

## 📝 Submission Checklist

- [x] ✅ Smart contract written (VeriddReputation.sol)
- [x] ✅ Contract deployed to 0G Galileo Testnet
- [x] ✅ 4 0G products used (Chain, Storage, Compute, Agentic ID)
- [x] ✅ Live frontend at [veridd.netlify.app](https://veridd.netlify.app)
- [ ] 🎥 Demo video (recording — will add link ASAP)
- [x] 📦 Public GitHub repo
- [x] 🖼️ Screenshots submitted
- [x] 📜 Open source (MIT License)

---

## 👤 Team

|                    |                                                      |
| ------------------ | ---------------------------------------------------- |
| **Isaac Adeleke**  | Builder, Product Designer                            |
| 🐦 **X / Twitter** | [@vytalique](https://x.com/vytalique)                |
| 💼 **LinkedIn**    | [adelekeisaac](https://linkedin.com/in/adelekeisaac) |
| 🏆 **Past**        | Design bounty winner — Quizfinity (ICP blockchain)   |

---

## 📚 Resources

| Resource              | Link                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| 0G Documentation      | [docs.0g.ai](https://docs.0g.ai)                                                                   |
| 0G Galileo Explorer   | [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai)                                         |
| 0G Faucet             | [faucet.0g.ai](https://faucet.0g.ai)                                                               |
| Agentic ID (ERC-7857) | [0g.ai/agentic-id](https://0g.ai)                                                                  |
| Zero Cup              | [0g.ai/arena/zero-cup](https://0g.ai/arena/zero-cup)                                               |
| Our Contract          | [`0x2F00a1...`](https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88) |

---

<p align="center">
  <i>Built during the 0G Zero Cup 2026 — Global Vibe Coding Tournament</i>
  <br>
  <a href="https://veridd.netlify.app">🌐 Live Demo</a> ·
  <a href="https://github.com/xi-kki/veridd">📦 Source</a> ·
  <a href="https://x.com/vytalique">🐦 @vytalique</a>
</p>
