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
- Run `npm run secrets:scan` before committing
- Check `SECURITY.md` for full policy

## ═══════════════════════════════════════════════
## 🛡️ Code Quality Standards (MANDATORY)
## ═══════════════════════════════════════════════

### Every file must have:
- JSDoc/TSDoc comments explaining purpose, params, returns
- TypeScript types (never `any` unless absolutely necessary)
- Edge case handling (null checks, empty arrays, timeouts)
- No hardcoded secrets (use env vars)

### Before committing:
- `npm run lint` — ESLint must pass (0 errors, warnings reviewed)
- `npm run format:check` — Prettier formatting
- `npm run typecheck` — TypeScript strict mode
- `npx gitleaks detect --source=. -v` — No secrets leaked

### Commit messages:
- Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`
- Example: `feat(agent): add peer review scoring logic`

### Branch naming:
- `feature/xxx`, `fix/xxx`, `hotfix/xxx`, `chore/xxx`, `docs/xxx`, `refactor/xxx`

### Pull Requests:
- Must pass all CI checks (lint, typecheck, test, build)
- Must include tests for new functionality
- Must address edge cases documented in the code

## ═══════════════════════════════════════════════
## 🔧 Available Quality Commands
## ═══════════════════════════════════════════════

```bash
npm run lint              # ESLint check
npm run lint:fix          # ESLint auto-fix
npm run format            # Prettier format all files
npm run format:check      # Prettier check (CI)
npm run typecheck         # TypeScript strict check
npm run test              # Hardhat contract tests
npm run build             # Frontend build
npm run secrets:scan      # Gitleaks secret scan
npm run check-all         # Lint + format + typecheck + test + build
npm run quality:full      # Fix + format + typecheck + test + build
```

## ═══════════════════════════════════════════════
## 📁 Config Files
## ═══════════════════════════════════════════════

| File | Purpose |
|------|---------|
| `.github/dependabot.yml` | Auto dependency updates |
| `.github/workflows/ci.yml` | Legacy CI |
| `.github/workflows/code-quality.yml` | Full quality pipeline |
| `.github/workflows/deploy-pages.yml` | GitHub Pages deploy |
| `.pre-commit-config.yaml` | Pre-commit hooks (install: `pip install pre-commit && pre-commit install`) |
| `.gitleaks.toml` | Secret scanning config |
| `SECURITY.md` | Security policy |
| `commitlint.config.js` | Commit message lint rules |
| `.eslintrc.json` | ESLint with TS + React rules |
| `.prettierrc` | Prettier formatting config |
| `frontend/tsconfig.json` | TypeScript strict config |

