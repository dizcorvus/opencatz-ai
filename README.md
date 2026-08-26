# 🐾 OPENCATZ AI — Multichain Edition

```
      /\_____/\
     /  ■   ■  \       🐾 OPENCATZ AI (MULTICHAIN EDITION) 🐾
    ( ==  ^  == )      Autonomous Multi-Agent Crypto Intelligence Swarm
     )    ~    (       Solana • Robinhood • Base • ETH • Ink • Hyperliquid • Polymarket
    (   _____   )      "Chill trades, 9 lives, razor-sharp on-chain instincts."
   ( (  )   (  ) )
  (__(__)___(__)__)
```

[![Web Portal](https://img.shields.io/badge/Web_Portal-opencatz.xyz-brightgreen.svg?style=flat-square)](https://opencatz.xyz)
[![Chains](https://img.shields.io/badge/Chains-Solana%20%7C%20Robinhood%20%7C%20Base%20%7C%20ETH%20%7C%20Ink%20%7C%20Hyperliquid%20%7C%20Polymarket-7b5cff.svg?style=flat-square)](https://opencatz.xyz)
[![Discord](https://img.shields.io/badge/Discord-Community-5865F2.svg?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/5HMy95ZHuY)
[![X (Twitter)](https://img.shields.io/badge/X-%40pxidentities-black.svg?style=flat-square&logo=x&logoColor=white)](https://x.com/pxidentities/)
[![Node Version](https://img.shields.io/badge/Node.js-%3E%3D22.12-green.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-43%20Passed%20(359%20tests)-brightgreen.svg?style=flat-square)](https://vitest.dev/)

> **OpenCatz AI** is an open-source autonomous multi-agent crypto intelligence and trading swarm. It coordinates **15 specialist screening sub-agents** across **7 major blockchains** (Solana, Robinhood Chain, Base, Ethereum Mainnet, Ink Chain, Hyperliquid L1, and Polymarket). Signals pass through a **3-Layer Consensus Engine** requiring a **≥ 80% Confidence Score** before broadcasting to Discord, Terminal TUI, or Telegram.

⚠️ **Disclaimer (NFA & DYOR):** OpenCatz AI is an open-source research and trading intelligence tool. Cryptocurrency markets carry inherent financial risks. Past performance does not guarantee future results. Not financial advice. Always do your own research.

---

## 🌐 Official Links

- 🌐 **Web Portal:** [opencatz.xyz](https://opencatz.xyz)
- 🏹 **Robinhood Chain Portal:** [opencatz.xyz/robinhood-chain](https://opencatz.xyz/robinhood-chain)
- 💬 **Discord Community:** [discord.gg/5HMy95ZHuY](https://discord.gg/5HMy95ZHuY)
- 🐦 **Official X (Twitter):** [@pxidentities](https://x.com/pxidentities/)
- 📖 **Interactive Docs:** [opencatz.xyz/docs](https://opencatz.xyz/docs)

---

## ⚡ Core Architecture

```
                          USER INTERFACES
              (Discord Server · Terminal TUI · Telegram Bridge)
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │          OPENCATZ CORE HUB           │
                 │   #opencatz-control-room · Chat      │
                 │   9-Lives Risk Engine · Wallet       │
                 │   Strategy Compiler · Key Pool       │
                 └──────────────────┬───────────────────┘
                                    │
    ┌──────────┬──────────┬─────────┼──────────┬──────────┬──────────┐
    ▼          ▼          ▼         ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│SOLANA  │ │ROBIN-  │ │BASE L2│ │ETHEREUM│ │INK L2  │ │HYPER-  │ │POLY-   │
│MEME/LP │ │HOOD #4663│ │MEME/NFT│ │MEME/NFT│ │MEME/NFT│ │LIQUID  │ │MARKET/ │
│Pump/DLMM│ │Uniswap│ │Aerodrome│ │Uniswap │ │Superchain│ │Perps/Spot│ │CT-Alpha│
└───┬────┘ └───┬────┘ └───┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    └──────────┴──────────┼─────────┴──────────┴──────────┴──────────┘
                          │ Candidate Signal Cards
                          ▼
        ┌────────────────────────────────────────────────┐
        │        3-LAYER SWARM CONSENSUS ENGINE          │
        │  Layer 1: Quant & Liquidity Metrics (40%)      │
        │  Layer 2: Social Volume & Catalysts (30%)      │
        │  Layer 3: Security & HoneyPot Audit (30%)     │
        │  ─── HARD GATE: ≥ 80% Confidence Required ───  │
        └─────────────────┬──────────────────────────────┘
                          │ Approved High-Conviction Signals
                          ▼
            MULTI-CHANNEL DISPATCH & POSITION MANAGER
      (Automated Stop-Loss -20% · Take-Profit 2x/3x · Trailing)
```

---

## 🤖 15 Specialist Screening Sub-Agents

| # | Agent Domain | Channel | Target Network & Protocol | Primary Intelligence Sources |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **Solana Memes** | `#call-meme-solana` | Solana (Pump.fun, Raydium, Meteora) | GMGN OpenAPI + RugCheck Security |
| 2 | **Robinhood Memes** | `#call-meme-robinhood` | Robinhood Chain (EVM #4663) | GMGN + GoPlus Security Audit |
| 3 | **Base L2 Memes** | `#call-meme-base` | Base L2 (Aerodrome, Uniswap V3) | GMGN + GoPlus Security Audit |
| 4 | **Ethereum Memes** | `#call-meme-eth` | Ethereum Mainnet (Uniswap V2/V3) | Uniswap Subgraphs + GoPlus Audit |
| 5 | **Ink Chain Memes** | `#call-meme-ink` | Ink Chain / Kraken L2 (Superchain) | DexScreener + GoPlus Security |
| 6 | **Solana LP Velocity** | `#call-lp-solana` | Meteora DLMM Concentrated Pools | Meteora API + Fee/TVL Ratio |
| 7 | **Robinhood LP Velocity** | `#call-lp-robinhood` | Robinhood Chain (Uniswap V3) | Krystal Cloud DeFi Data API |
| 8 | **ETH NFT Sniper** | `#call-nft-eth` | Ethereum Mainnet Bluechips | OpenSea Stream API + Floor Surge |
| 9 | **Base NFT Drops** | `#call-nft-base` | Base L2 Creator Mints | OpenSea API + Mint Volume |
| 10 | **Ink NFT Radar** | `#call-nft-ink` | Ink Chain Collections | OpenSea API + Floor Tracker |
| 11 | **Robinhood NFT Radar**| `#call-nft-robinhood`| Robinhood Chain NFT Collections | OpenSea API + Momentum Engine |
| 12 | **HyperEVM NFT Radar** | `#call-nft-hyperevm` | Hyperliquid L1 Native NFTs | OpenSea API + Volume Spikes |
| 13 | **Whale & Perps Radar**| `#call-whale-tracking`| Hyperliquid L1 Perps & Spot Flow | Hyperliquid Info API + CCXT |
| 14 | **Prediction Markets** | `#call-prediction-markets`| Polymarket Mispricing Radar | Polymarket Gamma Markets API |
| 15 | **Smart CT Alpha** | `#call-ct-alpha` | Twitter/X Smart Money KOL Calls | Twex / OpenTwitter Sentiment |

---

## 🛡️ 9-Lives Risk Engine

Every approved trade candidate is governed by the automated **9-Lives Risk Engine**:

- **Hard Stop-Loss (`-20%`)**: Automatic capital protection cutoff to prevent catastrophic drawdowns.
- **Tiered Take-Profit Scaling**: Automated partial profit locking at **`+100% (2x)`** and **`+200% (3x)`**.
- **Dynamic Trailing Stop**: Activates once a position reaches `+50%` profit to protect unrealized gains.
- **Fail-Closed Security**: If security checks (GoPlus/RugCheck) return errors or API timeouts, candidate tokens are automatically discarded.
- **Universal Multi-Key Pool**: Stacks unlimited backup API keys (`KEY_1`..`KEY_20`) with instant automatic rotation on HTTP 429 (Rate Limit) or 401/403 errors.

---

## 🚀 Installation & Quickstart

### Prerequisites
- **Node.js:** `>= 22.12` (Check with `node -v`)
- **npm:** `>= 10.0`
- **Git**

---

### Method 1: Interactive Onboarding Wizard (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/dizcorvus/opencatz-ai.git
cd opencatz-ai

# 2. Run automated setup (Linux / macOS)
bash setup.sh

# Or on Windows (PowerShell / Command Prompt):
.\setup.bat
```

The interactive wizard will guide you through:
1. Configuring your **Discord Bot Token** and **Client ID**.
2. Selecting your **AI LLM Provider** (OpenRouter, Claude, GPT-4, Z.ai, DeepSeek, etc.).
3. Entering optional Web3 API keys (GMGN, OpenSea, Krystal Cloud, Twex).
4. Verifying your RPC endpoints with automated diagnostics.

---

### Method 2: Manual Setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/dizcorvus/opencatz-ai.git
cd opencatz-ai
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your favorite editor (e.g. nano .env or code .env)

# 3. Compile TypeScript
npm run build

# 4. Start the bot in development mode
npm run dev
```

---

### Method 3: 24/7 VPS Background Daemon (PM2)

To keep OpenCatz running continuously on a Linux/macOS server or VPS:

```bash
# Build, start, and register as PM2 background process
npm run deploy

# View live daemon logs
npx pm2 logs opencatz-agent

# Monitor process status & memory
npx pm2 status
```

---

## 🎮 CLI & Terminal Commands Cheatsheet

| Command | Action |
| :--- | :--- |
| `npm run dev` | 🚀 Start OpenCatz in development watch mode (`tsx watch`) |
| `npm run wizard` / `npm run onboard` | 🧙‍♂️ Launch interactive configuration wizard (`.env` setup) |
| `npm run terminal` / `npm run tui` | 🐾 Open standalone Terminal TUI dashboard |
| `npm run build` | ⚙️ Compile TypeScript to production `/dist` directory |
| `npm test` | 🧪 Run full automated test suite (Vitest, 43 test files) |
| `npm run deploy` | 🌐 Build and start 24/7 background process via PM2 |
| `npm run update` | 🔄 Git pull, rebuild, and hot-restart daemon |
| `npm run clean` / `npm run uninstall` | 🧹 Cleanly remove PM2 process, build artifacts, & DB |

---

## 💬 Discord Slash Commands

| Command | Subcommands | Description |
| :--- | :--- | :--- |
| `/menu` or `/dashboard` | Direct | Opens the interactive Master Control Center with action buttons |
| `/analyze` | `contract:<address>` | Forces an instant 12-point security & liquidity audit for any token |
| `/screening` | `start` / `stop` / `trigger` | Controls background sub-agents across all 15 screening domains |
| `/journal` | `summary` / `history` / `export` | View Win-Rate %, PnL metrics, and export trade journal CSV |
| `/alert` | `set` / `list` / `cancel` | Manage real-time price alerts |
| `/wallet` | `setup` / `balance` / `withdraw` | Manage burner wallets, check balances, or withdraw funds |

---

## 🧪 Testing

OpenCatz AI includes a comprehensive test suite covering all sub-agents, adapters, risk managers, and consensus logic:

```bash
npm test
```

```
Test Files  43 passed (43)
     Tests  359 passed (359)
  Duration  ~11s
```

---

## 🧹 Clean Uninstallation

To cleanly stop background PM2 processes, reset local database caches, and clean build artifacts:

```bash
# Interactive mode (prompts before deleting each component)
npm run uninstall

# Or silent one-shot cleanup:
node scripts/uninstall.mjs -y

# Keep .env and database while removing daemon and build caches:
node scripts/uninstall.mjs --keep-env --keep-data
```

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!
Please review our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-agent`)
3. Commit your changes (`git commit -m 'feat: add amazing agent'`)
4. Push to the branch (`git push origin feat/amazing-agent`)
5. Open a Pull Request

---

## ⚖️ License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🛡️ Security

For vulnerability reporting guidelines and our security model, please see [SECURITY.md](SECURITY.md).
Do not report security vulnerabilities through public GitHub issues. Contact `dizcorvus@gmail.com` directly.
