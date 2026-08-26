# AGENTS.md - OpenCatz Autonomous Agentic AI Architecture & Development Guidelines

Welcome to the **OpenCatz AI (Multichain Edition)** codebase! This document outlines project conventions, tech stack, directory layout, and architectural rules for AI agents and developers working on this repository.

---

## 1. Project Overview & Agentic Concept

**OpenCatz AI** is an autonomous **Agentic AI Multi-Agent System** that monitors 7 major blockchains 24/7 to discover vetted opportunities, filter scams, and execute risk-managed trades through a **Discord Command Center**, **Terminal TUI**, and **Telegram Bridge**.

- **Core Hub & Orchestrator (`#opencatz-control-room`):** Autonomous AI Commander that handles natural language interaction, portfolio tracking, 9-Lives risk limits, custom price alerts (`/alert`), trade execution, and on-demand 12-point token audits.
- **Collaborative Consensus Protocol:** Evaluates candidate signals through a 3-Layer Filter (Quant & Liquidity 40%, Catalyst & Sentiment 30%, Security Audit 30%) requiring a **≥ 80% Confidence Score** before delivering signal cards.
- **15 Specialist AI Agents (Scouts across 5 Divisions):**
  - **🐱 Meme Scouts (5 Agents):**
    - `#call-meme-solana` (Solana DEX tokens / Pump.fun / Raydium / Meteora DLMM)
    - `#call-meme-robinhood` (Robinhood Chain EVM #4663 DEX tokens)
    - `#call-meme-base` (Base L2 DEX tokens & Smart Money Flow)
    - `#call-meme-eth` (Ethereum Mainnet DEX tokens & Whale Buys)
    - `#call-meme-ink` (Ink Chain / Kraken L2 Superchain DEX tokens)
  - **💧 LP Yield Scouts (2 Agents):**
    - `#call-lp-solana` (Solana Meteora DLMM Concentrated Liquidity Pools)
    - `#call-lp-robinhood` (Robinhood Chain Uniswap V3 Concentrated Liquidity Pools)
  - **🖼️ NFT Floor Scouts (5 Agents — OpenSea EVM/L2 Stack):**
    - `#call-nft-eth` (💎 Ethereum Bluechip & Floor Surge >= +20% Sniper)
    - `#call-nft-base` (🔵 Base L2 Creator Drops & Trending Mints)
    - `#call-nft-ink` (🐙 Ink Chain / Kraken L2 NFT Radar)
    - `#call-nft-robinhood` (👑 Robinhood Chain NFT Radar)
    - `#call-nft-hyperevm` (⚡ Hyperliquid HyperEVM L1 Native Collections)
  - **🐋 Whale & Perps Scout (1 Agent):**
    - `#call-whale-tracking` (Hyperliquid L1 institutional positioning & spot flow)
  - **🔮 Alpha & Prediction Scouts (2 Agents):**
    - `#call-prediction-markets` (Polymarket prediction market arbitrage & whale bets)
    - `#call-ct-alpha` (Twitter / X smart CT alpha & sentiment scraper)
- **9-Lives Position Manager:** Enforces automated risk management (Stop-Loss -20%, Take-Profit 2x/3x milestones, Dynamic Trailing Stops).
- **Universal Multi-Key Pool (`ApiKeyPool`):** Unlimited primary & backup key stacking with automatic failover rotation on HTTP 429/401/403 for OpenSea, GMGN, Krystal Cloud, and GoPlus.

---

## 2. Technology Stack & Environment

- **Runtime:** Node.js (>=22.12) / TypeScript (Strict Mode)
- **Discord SDK:** `discord.js` (v14+)
- **Blockchain Web3 SDKs:**
  - `@solana/web3.js` & `@jup-ag/api` (Solana)
  - `viem` / `ethers.js` (EVM L2, Robinhood Chain #4663, Base, ETH, Ink)
  - `ccxt` (Perpetuals & CEX)
  - Polymarket Gamma API (Polygon L2)
  - OpenSea Stream & REST API v2 (EVM NFTs)
- **Security Audit APIs:** RugCheck API (Solana), GoPlus Security API (EVM), GMGN API
- **AI Engine:** OpenRouter / OpenAI / Anthropic / Gemini Node SDK
- **Database & State:** Atomic JSON State Store (`database/opencatz_state.json`)

---

## 3. Coding Standards for Collaborators

1. **Fail-Closed Security**: External API failures must resolve gracefully to `null` or `[]` — an API timeout must never crash background processes or falsely trigger trading signals.
2. **Token & Cost Efficiency**: Reserve LLM reasoning calls strictly for high-value tasks. Use deterministic code for screening, security checks, and indicator calculations.
3. **English UI Copy**: All user-facing logs, Discord embeds, TUI text, and slash command responses MUST be in clean, professional, degen-friendly English.
