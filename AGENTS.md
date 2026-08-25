# AGENTS.md - Opencatz AI Project Guidelines & Agent Instructions

Welcome to the **Opencatz AI** codebase! This document outlines project conventions, tech stack, directory layout, and architectural rules for AI agents and developers working on this repository.

---

## 1. Project Overview

**Opencatz AI** is an autonomous, multi-agent crypto intelligence and trading ecosystem operated through a **Discord Command Center**, **Terminal TUI**, and **Telegram Notification Bridge**.

- **Core Hub Agent (`#opencatz-control-room`):** Handles user chat, configuration, portfolio tracking, 9-Lives risk management, custom price alerts (`/alert`), trade execution, and natural language trade audits.
- **Swarm Consensus Engine:** Evaluates candidate signals through a 3-Layer Filter (Quant & Liquidity, Catalyst & Sentiment, Security Audit) requiring a **>= 80% Confidence Score** before delivering call cards.
- **Specialist Screening Sub-Agents (15 Sub-Agents across 5 Categories):**
  - **🚀 Meme Hunters (5 Sub-Agents):**
    - `#call-meme-solana` (Solana DEX tokens / Pump.fun / Raydium / Meteora DLMM)
    - `#call-meme-robinhood` (Robinhood Chain DEX tokens)
    - `#call-meme-base` (Base L2 DEX tokens & Smart Money Flow)
    - `#call-meme-eth` (Ethereum Mainnet DEX tokens & Whale Buys)
    - `#call-meme-ink` (Ink Chain / Kraken L2 DEX tokens)
  - **💧 Liquidity & Yield (2 Sub-Agents):**
    - `#call-lp-solana` (Solana Meteora DLMM Concentrated Liquidity Pools)
    - `#call-lp-robinhood` (Robinhood Chain Uniswap V3 Concentrated Liquidity Pools)
  - **🔮 NFT Sniping & Radar (5 Sub-Agents — OpenSea EVM/L2 Stack):**
    - `#call-nft-eth` (💎 Ethereum Bluechip & Floor Surge Sniper)
    - `#call-nft-base` (🔵 Base L2 Creator Drops & Trending Mints)
    - `#call-nft-ink` (🐙 Ink Chain / Kraken L2 NFT Radar)
    - `#call-nft-robinhood` (👑 Robinhood Chain NFT Radar)
    - `#call-nft-hyperevm` (⚡ Hyperliquid HyperEVM L1 NFT Radar)
  - **🎯 Oracles & Derivatives (3 Sub-Agents):**
    - `#call-whale-tracking` (Hyperliquid L1 institutional positioning & spot flow)
    - `#call-prediction-markets` (Polymarket prediction market arbitrage & whale bets)
    - `#call-ct-alpha` (Twitter / X smart CT alpha & sentiment scraper)
- **Position Manager:** Handles post-execution auto-sell targets (Take Profit 2x/3x, Stop Loss -20%, Dynamic Trailing Stops).
- **Universal Multi-Key Pool (`ApiKeyPool`):** Unlimited primary & backup key stacking with automatic failover rotation on HTTP 429/401/403 for OpenSea, GMGN, Krystal Cloud, and GoPlus.

---

## 2. Technology Stack & Environment

- **Runtime:** Node.js (>=22.12) / TypeScript
- **Discord Bot SDK:** `discord.js` (v14+)
- **Blockchain & Crypto Web3 SDKs:**
  - `@solana/web3.js` & `@jup-ag/api` (Solana)
  - `viem` / `ethers.js` (EVM & Robinhood Chain)
  - `ccxt` (Perpetuals & CEX)
  - Polymarket Gamma API & CLOB SDK (Polygon L2)
  - OpenSea Stream & REST API v2 (EVM NFTs)
- **Security Audit APIs:** RugCheck API (Solana), GoPlus Security API (EVM), GMGN API
- **AI Engine:** OpenRouter / OpenAI / Anthropic / Gemini Node SDK
- **Database & State:** Atomic JSON State Store (`database/opencatz_state.json`)

---

## 3. Directory Layout

```
Opencatz AI/
├── .agents/
│   ├── AGENTS.md                  # Project rules & coding guidelines
│   └── skills/                    # Specialized trading skills
├── bin/
│   └── opencatz.js                # Master OpenCatz CLI binary
├── src/
│   ├── index.ts                   # Bot initialization & client launcher
│   ├── orchestrator/              # OpenCatz Core Hub & 9-Lives Risk Engine
│   │   ├── hub.ts                 # OpenCatzHub: agent states, risk gate, on-demand passes
│   │   ├── risk-manager.ts        # Drawdown / position-size / correlation guards
│   │   ├── risk-engine-v2.ts      # 9-Lives Kill-switch circuit breaker (singleton)
│   │   ├── swarm-consensus.ts     # 3-Layer Signal Quality Filter Engine
│   │   ├── swarm-learning.ts      # Outcome-driven agent weight recalibration
│   │   ├── strategy-engine.ts     # Sandboxed .mjs strategy loader
│   │   ├── agent-registry.ts      # Single source of truth for all 15 agent domains
│   │   ├── agent-runner.ts        # LLM tool-call loop for chat/TUI/Telegram
│   │   ├── dispatch.ts            # Per-domain dispatch + LP payload builder
│   │   └── tool-registry.ts       # LLM function-calling tools
│   ├── agents/                    # Specialized screening agents (isolated per domain)
│   │   ├── shared/                # Agent contracts, GMGN helpers, NFT helpers
│   │   ├── meme-solana/           # Solana DEX screening (GMGN + RugCheck)
│   │   ├── meme-robinhood/        # Robinhood DEX screening (GMGN + GoPlus)
│   │   ├── meme-base/             # Base L2 DEX screening (GMGN + GoPlus)
│   │   ├── meme-eth/              # Ethereum Mainnet DEX screening (GMGN + GoPlus)
│   │   ├── meme-ink/              # Ink Chain / Kraken L2 DEX screening
│   │   ├── lp-solana/             # Solana Meteora DLMM LP screening
│   │   ├── lp-robinhood/          # Robinhood Uniswap V3 LP screening
│   │   ├── nft-eth/               # Ethereum OpenSea NFT sniper
│   │   ├── nft-base/              # Base L2 OpenSea NFT sniper
│   │   ├── nft-ink/               # Ink Chain OpenSea NFT radar
│   │   ├── nft-robinhood/         # Robinhood Chain OpenSea NFT radar
│   │   ├── nft-hyperevm/          # HyperEVM L1 OpenSea NFT radar
│   │   ├── perps/                 # Hyperliquid whale tracking
│   │   ├── prediction/            # Polymarket prediction screening
│   │   └── ct-alpha/              # Twitter / X smart-CT screening
│   ├── adapters/                  # Web3 & Exchange execution adapters
│   │   ├── solana-adapter.ts      # Jupiter swaps + MEV guard
│   │   ├── evm-adapter.ts         # EVM & Robinhood Chain swaps
│   │   ├── relay-adapter.ts       # Relay.link cross-chain swaps & bridges
│   │   ├── gmgn-adapter.ts        # GMGN OpenAPI + Multi-key rotation
│   │   ├── hyperliquid-adapter.ts # Perps market data & order flow
│   │   ├── meteora-dlmm-adapter.ts# Solana Meteora DLMM pools
│   │   ├── opensea-adapter.ts     # OpenSea NFT signals + Multi-key rotation
│   │   ├── krystal-cloud-adapter.ts# Krystal Cloud DEX LP + Multi-key rotation
│   │   └── polymarket-adapter.ts  # Polymarket Gamma & CLOB bets
│   ├── position/                  # Auto TP/SL & Trailing Stop Position Manager
│   ├── discord/                   # Discord handlers, slash commands & embeds
│   ├── services/                  # Shared security, feeds, alerts, & LLM
│   │   ├── api-key-pool.ts        # Universal multi-key pool with failover rotation
│   │   ├── opencatz-system-prompt.ts # OpenCatz multichain system persona
│   │   ├── state-store.ts         # Persistent JSON state (database/)
│   │   ├── price-feed-service.ts  # CoinGecko price feeds
│   │   ├── wallet-service.ts      # Wallet keys & balances
│   │   └── ...                    # security, alerts, ai-service, cron
│   ├── cli/                       # Terminal TUI + diagnostic doctor + theme
│   ├── telegram/                  # Telegram notification bridge
│   └── api/                       # REST server (health & telemetry)
├── DESIGN.md                      # OpenCatz unified design system
├── setup.sh / setup.bat           # One-shot installation scripts
├── deploy.sh                      # PM2 production deployment script
├── package.json
└── tsconfig.json
```

---

## 4. Coding Conventions & Best Practices

1. **Modular Multi-Agent Isolation:**
   - Keep screening decoupled from execution. Screening agents MUST pass candidate signals to the `Swarm Consensus Engine` before emitting cards.
2. **Safety & Dry-Run First:**
   - Every trading adapter MUST support `DRY_RUN=true`. Never send live transactions unless explicitly configured.
3. **Swarm Consensus Validation:**
   - Require >= 80% confidence score across Quant, Catalyst, and Security audits before delivering signal cards.
4. **Discord Embed Field Resilience:**
   - Never pass empty strings `""`, `null`, or `undefined` to `EmbedBuilder.addFields()`. Always provide safe fallbacks (`|| 'N/A'`) and cap strings at 1000 characters to prevent `@sapphire/shapeshift` validation errors.
5. **Token & API Cost Optimization:**
   - Use deterministic local math and rules for screening. Use `ApiKeyPool` for zero-downtime key rotation. Reserve LLM API calls strictly for high-value reasoning and chat queries.
