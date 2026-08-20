# 🐾 DESIGN.md — Opencatz AI Design System (Multichain Edition)

> **Official Visual & Identity Design System for Opencatz AI**
> *Unified Design System for Discord Embeds, Terminal TUI, and Multi-Platform Clients*
> *Exclusive Edition for Catz NFT Holders across Solana, EVM / Robinhood Chain, Perps, and NFTs*

---

## 1. 🎨 Executive Brand Overview

**Opencatz AI** is an autonomous, multi-agent crypto intelligence and trading ecosystem operating across **Solana, Robinhood Chain (EVM L2), Base, Ethereum, BNB Chain (BSC), Hyperliquid, and Polymarket**:

- **Art Direction:** Retro 8-bit / 24×24 pixel art aesthetic, crisp outlines (`#0B0E14`), casual pixel personality traits, and witty feline charm.
- **Hero Palette:** High-energy **Robinhood Green (`#CCFF00`)** anchored against deep **Solid Obsidian Black (`#0B0E14`)** and harmonized pastel & neon counter-tones.
- **Mascot Persona:** **OpenCatz** — The chillest, most laid-back yet mathematically razor-sharp DeFi cat oracle in the crypto space with sunglasses and 9 lives.
- **NFT Gating:** Token-gated utility for **Catz NFT** (`CATZ` 4,444 collection on Robinhood Chain / OpenSea SeaDrop).

### 🐾 The 3 Feline Pillars & Philosophy:
1. **The Prowl (Intelligence & Night Vision):** DEX pools and on-chain liquidity are dark, noisy, and hazardous. OpenCatz's 3-Layer Swarm Consensus acts as feline night vision — stalking candidates 24/7 with patient stealth and only pouncing when Swarm Confidence purrs at $\ge 80\%$.
2. **The Cat Den (Command Center & Scratching Post):** Multi-channel central hub (`#opencatz-control-room`, `#opencatz-audit`, Terminal TUI, Telegram bridge) for natural language chat, instant 12-point token audits, and wallet controls.
3. **The Nine Lives Engine (Resilience & Risk):** Capital preservation is sacred. OpenCatz protects traders with a 9-Lives safety net: automated Stop-Loss (-20%), Take-Profit milestone scaling (2x/3x), dynamic trailing stops, and an instant 9-Lives Circuit Breaker kill-switch.

---

## 2. 🌈 Master Color Token Architecture

Opencatz AI UI components utilize a standardized retro palette across Discord embeds, Web API, and CLI terminal:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OPENCATZ AI COLOR PALETTE MATRIX                       │
├───────────────────────┬──────────────┬──────────────────┬───────────────────┤
│ Role / Name           │ Hex Code     │ RGB              │ Discord Embed Int │
├───────────────────────┼──────────────┼──────────────────┼───────────────────┤
│ 👑 Robinhood Green    │ #CCFF00      │ rgb(204, 255, 0) │ 0xCCFF00 (Hero)   │
│ ⬛ Obsidian Black     │ #0B0E14      │ rgb(11, 14, 20)  │ 0x0B0E14 (Frame)  │
│ 🌸 Pastel Pink        │ #FFB7B2      │ rgb(255, 183, 178│ 0xFFB7B2 (Meme)   │
│ 🔮 Lavender Purple    │ #D6C7FF      │ rgb(214, 199, 255│ 0xD6C7FF (NFT)    │
│ 🌊 Retro Cyan         │ #80DEEA      │ rgb(128, 222, 234│ 0x80DEEA (LP)     │
│ ☀️ Pastel Yellow      │ #FFF59D      │ rgb(255, 245, 157│ 0xFFF59D (Alpha)  │
│ 🏆 Golden Fortune 24K │ #FFD700      │ rgb(255, 215, 0) │ 0xFFD700 (VIP/PnL)│
│ 🍀 Jade Spirit Green  │ #00E676      │ rgb(0, 230, 118) │ 0x00E676 (Solana) │
│ 🚨 Maneki-Neko Red    │ #E53935      │ rgb(229, 57, 53) │ 0xE53935 (Alert)  │
│ 🐋 Denim Blue         │ #0277BD      │ rgb(2, 119, 189) │ 0x0277BD (Whale)  │
│ 🎯 Prediction Cyan    │ #00E5FF      │ rgb(0, 229, 255) │ 0x00E5FF (Poly)   │
│ 🟣 Royal Violet       │ #7B1FA2      │ rgb(123, 31, 162)│ 0x7B1FA2 (Strat)  │
└───────────────────────┴──────────────┴──────────────────┴───────────────────┘
```

### Functional Color Semantics:
1. **High Confidence Signals & TP Wins ($\ge 80\%$ Swarm):** `Robinhood Green (#CCFF00)` & `Jade Spirit (#00E676)`
2. **Solana Meme Calls (`#call-meme-solana`):** `Jade Spirit (#00E676)`
3. **Robinhood Chain Meme Calls (`#call-meme-robinhood`):** `Pastel Pink (#FFB7B2)`
4. **Base L2 Meme Calls (`#call-meme-base`):** `Denim Blue (#0277BD)`
5. **Ethereum Mainnet Meme Calls (`#call-meme-eth`):** `Lavender Purple (#D6C7FF)`
6. **BNB Chain (BSC) Meme Calls (`#call-meme-bnb`):** `Golden Fortune (#FFD700)`
7. **Concentrated LP Velocity (`#call-lp-solana` / `#call-lp-robinhood`):** `Retro Cyan (#80DEEA)`
8. **NFT Floor & Rarity Sniping (`#call-nft-sniping`):** `Royal Violet (#7B1FA2)`
9. **Smart CT & Twitter/X Sentiment (`#call-ct-alpha`):** `Pastel Yellow (#FFF59D)`
10. **Whale Tracker & Perps Flows (`#call-whale-tracking`):** `Denim Blue (#0277BD)`
11. **Polymarket Prediction Arbitrage (`#call-prediction-markets`):** `Prediction Cyan (#00E5FF)`
12. **9-Lives Circuit Breaker, Honeypot Warnings, Stop Loss:** `Maneki-Neko Lucky Red (#E53935)`
13. **Realized Gains & Catz NFT VIP Holders:** `Golden Fortune (#FFD700)`

---

## 3. 🐱 Pixel Mascot & Terminal ASCII Art

### Swag Sunglasses OpenCatz (Command Center & Oracle)

```text
       /\_____/\
      /  ■   ■  \      🕶️ OPENCATZ AI · MULTICHAIN COMMAND CENTER 🕶️
     ( ==  ^  == )     3-Layer Swarm Consensus & Precision Execution
      )    ~    (      Solana • Robinhood Chain • EVM • Perps • NFTs
     (   _____   )     Cat Den 24/7 Agent Daemon Active
    ( (  )   (  ) )
   (__(__)___(__)__)
```

---

## 4. 💻 Terminal ANSI Color System

For CLI tools (`bin/opencatz.js`, `src/cli/tui.ts`, `scripts/wizard.js`):

```typescript
export const OPENCATZ_COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  lime: '\x1b[38;2;204;255;0m',      // #CCFF00 Robinhood Green (Hero)
  pink: '\x1b[38;2;255;183;178m',    // #FFB7B2 Pastel Pink
  lavender: '\x1b[38;2;214;199;255m',// #D6C7FF Lavender Purple
  cyan: '\x1b[38;2;128;222;234m',    // #80DEEA Retro Cyan
  yellow: '\x1b[38;2;255;245;157m',  // #FFF59D Pastel Yellow
  gold: '\x1b[38;2;255;215;0m',      // #FFD700 Golden Fortune
  red: '\x1b[38;2;229;57;53m',       // #E53935 Maneki-Neko Red
  green: '\x1b[38;2;0;230;118m',     // #00E676 Jade Spirit
  blue: '\x1b[38;2;2;119;189m',      // #0277BD Denim Blue
  obsidian: '\x1b[38;2;11;14;20m',   // #0B0E14 Obsidian
};
```

---

## 5. 🤖 Discord Command Center Channel Layout

- **Category:** `🐾 OPENCATZ MULTICHAIN COMMAND CENTER`
- **Core Channels:**
  - `#opencatz-control-room` — Main natural language chat, wallet balances, risk settings, and execution intents.
  - `#opencatz-audit` / `#audit-on-demand` — Instant 12-point token audit upon pasting contract address (CA).
  - `#call-meme-solana` — High-velocity Solana DEX tokens (Pump.fun, Raydium, Meteora).
  - `#call-meme-robinhood` — High-velocity Robinhood Chain & EVM meme tokens (GMGN + GoPlus).
  - `#call-lp-solana` — Solana Meteora DLMM Concentrated Liquidity pools.
  - `#call-lp-robinhood` — EVM Robinhood Chain Concentrated Liquidity pools (Uniswap V3 / Krystal).
  - `#call-whale-tracking` — Hyperliquid L1 institutional positioning & spot flows.
  - `#call-nft-sniping` — OpenSea floor drops and rare trait snipes for Catz NFT & EVM collections.
  - `#call-prediction-markets` — Polymarket prediction market arbitrage & whale bets.
  - `#call-ct-alpha` — Crypto Twitter (X) smart money & sentiment scraper.
