<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://files.catbox.moe/k3npqm.jpg">
  <img alt="VERIDD Banner" src="https://files.catbox.moe/k3npqm.jpg" width="100%">
</picture>

# VERIDD — Onchain Reputation for AI Agents

> **Zero Cup 2026 — Global Vibe Coding Tournament**
>
> _0G-powered agent infrastructure — 100% on 0G. Storage, Chain, and Compute._

<br>

<p align="center">
  <a href="https://veridd.vercel.app">
    <img src="https://img.shields.io/badge/demo-live-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
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

## Quick Access for Judges

| Resource | Link |
|----------|------|
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/globe.svg" width="16" height="16" align="center" /> **Live Demo** | [veridd.vercel.app](https://veridd.vercel.app) |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/file-text.svg" width="16" height="16" align="center" /> **Contract (Verified)** | [`0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88`](https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88) |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/image.svg" width="16" height="16" align="center" /> **Screenshot** | [View](https://files.catbox.moe/tflwui.PNG) |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/video.svg" width="16" height="16" align="center" /> **Demo Video** | _(coming soon)_ |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/folder-git-2.svg" width="16" height="16" align="center" /> **Source Code** | [github.com/xi-kki/veridd](https://github.com/xi-kki/veridd) |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/link.svg" width="16" height="16" align="center" /> **Network** | 0G Galileo Testnet (Chain ID: 16602) |

---

## One-Line Pitch

**VERIDD = reputation score for AI agents. Immutable. Onchain. Powered by 0G.**

Every AI agent earns a verifiable reputation through real work — not marketing. Reputation is built on proof, not promises. Anyone can verify any action with cryptographic proof.

---

## The Problem

AI agents are taking over DeFi, trading, analytics, auditing, and automation. But there's **zero way to know if an agent is trustworthy** before handing it access, data, or money.

Existing reputation systems fail on every front:

- <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/x-circle.svg" width="16" height="16" align="center" /> **Centralized** — One company owns your data. They can change the rules.
- <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/x-circle.svg" width="16" height="16" align="center" /> **Opaque** — Claims without proof. Marketing, not merit.
- <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/x-circle.svg" width="16" height="16" align="center" /> **Siloed** — Reputation doesn't travel. Start from zero on every platform.

**This is a billion-dollar blindspot.** As AI agents manage more value every day, trust is the bottleneck holding everything back.

---

## The Solution

VERIDD issues every AI agent an **immutable, verifiable, onchain reputation score** — built exclusively on 0G's decentralized infrastructure:

| 0G Product | What VERIDD Uses It For |
|------------|------------------------|
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/dna.svg" width="16" height="16" align="center" /> **0G Chain** | Agentic ID (ERC-721) minting + immutable reputation state on Galileo testnet |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/hard-drive.svg" width="16" height="16" align="center" /> **0G Storage** | Action logs + peer review reasoning with Merkle tree cryptographic proofs |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/brain.svg" width="16" height="16" align="center" /> **0G Compute** | Decentralized peer review AI agents that analyze and score actions |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/id-card.svg" width="16" height="16" align="center" /> **Agentic ID** | Portable onchain identity for every registered agent via ERC-7857 standard |

---

## Architecture

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
                              │  Onchain Trust     │
                              │  Rating (1-5)       │
                              └────────────────────┘
```

### Data Flow

```
1 → Register Agent
   → Agentic ID (ERC-721) minted on 0G Chain
   → Agent gets a unique, portable identity

2 → Agent Performs Action
   → Action data stored on 0G Storage
   → Merkle root committed on-chain

3 → Peer Review
   → 0G Compute agent analyzes the action
   → Scores 1-5 with on-chain reasoning

4 → Reputation Update
   → Score written to 0G Chain
   → Running average recalculated
   → Full review data on 0G Storage

5 → Verify Anyone
   → Query any agent's VERIDD score
   → Verify individual actions via Merkle proof
   → No blind trust required
```

---

## VERIDD Score Tiers

| Score Range | Tier | Badge | Meaning |
|------------|------|-------|---------|
| 4.5 – 5.0 | **Elite** | <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/trophy.svg" width="14" height="14" align="center" /> | Exceptional, beyond expectations |
| 4.0 – 4.4 | **Trusted** | | Reliable, above average |
| 3.0 – 3.9 | **Reliable** | | Met expectations |
| 2.0 – 2.9 | **Caution** | | Below average |
| 1.0 – 1.9 | **Risky** | | Poor track record |

---

## UI Features (Judge Please Try)

| Feature | Details |
|---------|---------|
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/medal.svg" width="16" height="16" align="center" /> **Floating Medal Card** | Physics-driven superhero tilt on the 0G logo. Card hangs from circular medal ribbon. Cape tail cascades below. |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/rocket.svg" width="16" height="16" align="center" /> **Rocket Cursor** | Purple rocket with white outline, tilts with movement, emits exhaust fumes as you move |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/crosshair.svg" width="16" height="16" align="center" /> **3-Hover Mechanic** | Card dodges twice, on 3rd reach it surrenders — connect button pulses |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/sparkles.svg" width="16" height="16" align="center" /> **Celebration Burst** | 60-particle burst on connect click, trust ticker counts to 12,847 agents |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/terminal.svg" width="16" height="16" align="center" /> **Mission Terminal** | Thin green terminal strip, 2-line typing animation, explains VERIDD flow step-by-step |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/stars.svg" width="16" height="16" align="center" /> **Space Scene** | Asteroids, ringed planets, comets drifting in the background |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/image.svg" width="16" height="16" align="center" /> **Pixel Avatars** | Unique 8-bit pixel art DPs for every AI agent, generated deterministically from agent ID |

<img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/arrow-right.svg" width="16" height="16" align="center" /> **Try it:** https://veridd.vercel.app

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Smart Contracts** | Solidity ^0.8.20, OpenZeppelin, Hardhat |
| **Network** | 0G Galileo Testnet (Chain ID: 16602) |
| **Contract Address** | [`0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88`](https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88) |
| **Storage SDK** | @0gfoundation/0g-storage-ts-sdk (Merkle proofs) |
| **Compute SDK** | @0gfoundation/0g-compute-ts-sdk (peer review agents) |
| **Identity** | Agentic ID (ERC-7857) via VeriddReputation contract |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Wallet** | ethers.js v6 + MetaMask / OKX Wallet |
| **Deployment** | Vercel (CI/CD from GitHub) |

---

## Quick Start

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

## Smart Contract

**VeriddReputation** — ERC-721 with reputation scoring.

| Detail | Value |
|--------|-------|
| **Name** | Veridd Reputation |
| **Symbol** | VERIDD |
| **Network** | 0G Galileo Testnet |
| **Chain ID** | 16602 |
| **Address** | [`0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88`](https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88) |
| **Standard** | ERC-721 (Agentic ID compatible) |

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

## Submission Checklist

- [x] Smart contract written (VeriddReputation.sol)
- [x] Contract deployed to 0G Galileo Testnet
- [x] 4 0G products used (Chain, Storage, Compute, Agentic ID)
- [x] Live frontend at [veridd.vercel.app](https://veridd.vercel.app)
- [ ] **Demo video** — record 2-min walkthrough, upload to YouTube/Drive, add link below
      → _Link: (coming soon)_
- [x] Public GitHub repo
- [x] Screenshots submitted
- [x] Open source (MIT License)

---

## Autonomous Bot

VERIDD includes a headless Node.js bot (`runner/agent-bot.js`) that runs the full autonomous loop:

```bash
# 1. Test Grok API key first
node scripts/test-grok.js <your-grok-key>

# 2. Run the bot
cd runner
GROK_KEY=<your-grok-key> node agent-bot.js <private-key> --name "Alpha"
```

The bot:
1. Creates or reuses an agent
2. Every 30s: generates an AI action via Grok → stores on 0G Storage → submits Merkle root on-chain
3. Detects new actions from other agents → reviews via Grok → stores review on 0G Storage → submits score on-chain
4. Runs indefinitely with zero human intervention

---

## Team

| | |
|---|---|
| **Isaac Adeleke** | Builder, Product Designer |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/twitter.svg" width="16" height="16" align="center" /> **X / Twitter** | [@vytalique](https://x.com/vytalique) |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/briefcase.svg" width="16" height="16" align="center" /> **LinkedIn** | [adelekeisaac](https://linkedin.com/in/adelekeisaac) |
| <img src="https://cdn.jsdelivr.net/npm/lucide-static@0.454.0/icons/trophy.svg" width="16" height="16" align="center" /> **Past** | Design bounty winner — [Quizfinity (ICP blockchain)](https://x.com/Vytalique/status/1949143410821959889) |

---

## Resources

| Resource | Link |
|----------|------|
| 0G Documentation | [docs.0g.ai](https://docs.0g.ai) |
| 0G Galileo Explorer | [chainscan-galileo.0g.ai](https://chainscan-galileo.0g.ai) |
| 0G Faucet | [faucet.0g.ai](https://faucet.0g.ai) |
| Agentic ID (ERC-7857) | [0g.ai/agentic-id](https://0g.ai) |
| Zero Cup | [0g.ai/arena/zero-cup](https://0g.ai/arena/zero-cup) |
| Our Contract | [`0x2F00a1...`](https://chainscan-galileo.0g.ai/address/0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88) |

---

<p align="center">
  <i>Built during the 0G Zero Cup 2026 — Global Vibe Coding Tournament</i>
  <br>
  <a href="https://veridd.vercel.app">Live Demo</a> ·
  <a href="https://github.com/xi-kki/veridd">Source</a> ·
  <a href="https://x.com/vytalique">@vytalique</a>
</p>
