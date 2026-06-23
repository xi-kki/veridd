# 🛡️ VERIDD — Onchain Reputation for AI Agents

> **Built for the 0G Zero Cup 2026**
>
> *Trustpilot for AI agents — with cryptographic proof, powered by 0G.*

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://veridd.netlify.app)
[![Contract](https://img.shields.io/badge/contract-deployed-purple?style=flat-square)](https://chainscan-galileo.0g.ai/address/0xC2c5C3589Db264620524CE7E370D8f7E6c11fc0c)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

---

## The One-Line Pitch

**Trustpilot for AI agents — with cryptographic proof, powered by 0G.**

---

## Problem & Solution

### The Problem
AI agents are exploding — trading, analyzing, auditing, executing. But there's **no way to know if an agent is reliable** before trusting it with access or payment. Reputation is either non-existent or centralized.

### What VERIDD Does
VERIDD gives every AI agent a **verifiable, onchain credit score** that they earn through actual work — not claims. Agents register via Agentic ID, log verifiable actions to 0G Storage, receive peer reviews scored by 0G Compute, and display their score onchain. Anyone can check an agent's reputation before interacting.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VERIDD                                │
├─────────────┬──────────────┬──────────────┬─────────────────┤
│   0G Chain   │  0G Storage  │  0G Compute  │   Agentic ID    │
│  (ERC-721 +  │  (Merkle-    │  (Peer       │  (ERC-7857      │
│   Score)     │   verified   │   Review)    │   Identity)     │
│              │   proofs)    │              │                 │
├─────────────┴──────────────┴──────────────┴─────────────────┤
│                    Floating Card UI (React + Tailwind)       │
└─────────────────────────────────────────────────────────────┘
```

### Flow
```
1️⃣ Register Agent  →  Agentic ID minted on 0G Chain
2️⃣ Agent Works     →  Action proofs stored on 0G Storage
3️⃣ Peer Reviews    →  0G Compute scores action 1-5
4️⃣ Score Updates   →  Onchain reputation recalculated
5️⃣ Verify Before   →  Anyone checks score before trusting
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Smart Contracts** | Solidity ^0.8.20 + Hardhat |
| **Network** | 0G Galileo Testnet (Chain ID: 16602) |
| **Contract Address** | [`0xC2c5C3589Db264620524CE7E370D8f7E6c11fc0c`](https://chainscan-galileo.0g.ai/address/0xC2c5C3589Db264620524CE7E370D8f7E6c11fc0c) |
| **Storage** | 0G Storage (simulation fallback for browser demo) |
| **Compute** | 0G Compute Router (simulation fallback for browser demo) |
| **Identity** | Agentic ID (ERC-7857) via our VeriddReputation contract |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Wallet** | MetaMask / OKX Wallet |
| **Deployed** | Netlify (`https://veridd.netlify.app`) |

---

## 0G Products Used

| Product | What We Use It For |
|---------|-------------------|
| **0G Chain** | Agentic ID NFTs + immutable reputation state |
| **0G Storage** | Action proofs stored with Merkle tree integrity |
| **0G Compute** | Decentralized AI peer review scoring |
| **Agentic ID** | Portable onchain identity for every registered agent |

---

## Features

- **🎮 Floating Medal Card** — Superhero tilt physics, rocket cursor with exhaust fumes
- **🔄 8-Hover Mechanic** — 5 dodges → 3 follows → surrenders to center
- **🎉 Celebration Burst** — 60 particles + trust ticker counting to 12,847 agents
- **🔵 Rocket Cursor** — Purple rocket with white outline, tilts with movement, emits fumes
- **🌌 Space Objects** — Asteroids, planets with rings, comets drifting in background
- **📊 VERIDD Score Badge** — Elite / Trusted / Reliable / Caution / Risky tiers
- **🔗 Full Contract Integration** — Register agents, submit reviews, query scores on 0G Galileo testnet

---

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or OKX Wallet with 0G Galileo testnet added
- 0G testnet tokens from [faucet.0g.ai](https://faucet.0g.ai)

### 1. Deploy Contract (if not using ours)
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
npm run dev
```
Open `http://localhost:5173` — the card will appear.

### Or just use the live demo
👉 **https://veridd.netlify.app**

---

## VERIDD Score Tiers

| Score | Tier | Meaning |
|-------|------|---------|
| 4.5–5.0 | 🏆 Elite | Exceptional, beyond expectations |
| 4.0–4.4 | ✅ Trusted | Reliable, above average |
| 3.0–3.9 | 📊 Reliable | Met expectations |
| 2.0–2.9 | ⚠️ Caution | Below average |
| 1.0–1.9 | 🚫 Risky | Poor track record |

---

## Demo Video

🎥 *[Demo video link — record a 2-min walkthrough and paste here]*

Walkthrough:
1. Landing page with floating card + rocket cursor
2. Hover 8 times — dodge, follow, surrender
3. Connect wallet
4. Register an agent
5. Submit a review with simulated action
6. See score badge update

---

## Zero Cup Submission

| Field | Value |
|-------|-------|
| **Title** | VERIDD — Onchain Reputation for AI Agents |
| **One-Line Pitch** | Trustpilot for AI agents — with cryptographic proof, powered by 0G |
| **Tags** | `AI`, `DeFi`, `Infra`, `Reputation`, `Identity`, `0G`, `Agentic ID` |
| **Products Used** | 0G Chain + 0G Storage + 0G Compute + Agentic ID |
| **Contract** | `0xC2c5C3589Db264620524CE7E370D8f7E6c11fc0c` |
| **Network** | 0G Galileo Testnet (16602) |
| **Demo URL** | https://veridd.netlify.app |
| **Source** | https://github.com/xi-kki/veridd |
| **License** | MIT |

---

## Resources

| Resource | URL |
|----------|-----|
| 0G Docs | https://docs.0g.ai |
| Galileo Explorer | https://chainscan-galileo.0g.ai |
| Faucet | https://faucet.0g.ai |
| Zero Cup | https://0g.ai/arena/zero-cup |
| Our Contract | [0xC2c5C...](https://chainscan-galileo.0g.ai/address/0xC2c5C3589Db264620524CE7E370D8f7E6c11fc0c) |

---

*Built for the 0G Zero Cup 2026 — Global Vibe Coding Tournament*
