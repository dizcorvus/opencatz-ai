# 🐾 OpenCatz AI & Catz NFT — Master Design System (Multichain Edition)

> **Official Visual & Technical Master Design Specification for OpenCatz AI & Catz NFT Ecosystem**  
> *Unified Design System for Discord Embeds, Web Applications, Terminal TUI, and Multi-Platform Clients*  
> **Author / Creator:** `@itsdizcorvus` · **Version:** `4.0.0 (Production Master)`

---

## 📑 Table of Contents

1. [Executive Brand Overview](#1--executive-brand-overview)
2. [Part 1: 24×24 Retro Flat Pixel Art Bible](#2--part-1-2424-retro-flat-pixel-art-bible)
   - [1.1 Style Definition & Inking Barrier](#11-style-definition--inking-barrier)
   - [1.2 Canvas Coordinate Anatomy (24×24 Grid)](#12-canvas-coordinate-anatomy-2424-grid)
   - [1.3 Official 6 Multichain Backgrounds (Layer 0)](#13-official-6-multichain-backgrounds-layer-0)
   - [1.4 Feline Pillars & Philosophy](#14-feline-pillars--philosophy)
3. [Part 2: Master Color Palette & Token Architecture](#3--part-2-master-color-palette--token-architecture)
   - [2.1 Three-Layer Token Architecture](#21-three-layer-token-architecture)
   - [2.2 Complete Color Matrix & Hex Tokens](#22-complete-color-matrix--hex-tokens)
   - [2.3 Google RGB Telemetry Spectrum](#23-google-rgb-telemetry-spectrum)
   - [2.4 Obsidian Dark Surface Tokens](#24-obsidian-dark-surface-tokens)
   - [2.5 Functional Semantic Mapping (15 Sub-Agents)](#25-functional-semantic-mapping-15-sub-agents)
4. [Part 3: OpenCatz Web & Terminal TUI System](#4--part-3-opencatz-web--terminal-tui-system)
   - [3.1 Typography Hierarchy](#31-typography-hierarchy)
   - [3.2 Spatial Grid & Layout Tokens](#32-spatial-grid--layout-tokens)
   - [3.3 Web UI Component Library & Action Buttons](#33-web-ui-component-library--action-buttons)
   - [3.4 Terminal ANSI 24-bit TrueColor Tokens](#34-terminal-ansi-24-bit-truecolor-tokens)
5. [Part 4: Discord Command Center Channel Hierarchy](#5--part-4-discord-command-center-channel-hierarchy)
6. [Part 5: Copywriting & Brand Voice Directives](#6--part-5-copywriting--brand-voice-directives)

---

## 1. 🏛 Executive Brand Overview

| Parameter | Specification | Enforcement Standard |
| :--- | :--- | :--- |
| **Ecosystem Name** | `OpenCatz AI` | Autonomous multi-agent crypto intelligence swarm |
| **PFP Art Direction** | `24×24 Retro Flat Pixel Art` | CryptoPunks-style casual feline PFP with crisp outlines |
| **Inking Barrier** | `1-Pixel Solid Black (#0B0E14)` | 100% crisp, zero blur, zero anti-aliasing |
| **Hero Color** | `Robinhood Green (#CCFF00)` | High-energy electric neon pop anchored against obsidian |
| **Mascot Persona** | `OpenCatz` | Laid-back DeFi oracle cat with swag shades, 9 lives, & sharp claws |
| **Scaling Standard** | `Nearest-Neighbor Integer Scaling` | Scaled to 512×512 HD (`21.333×`), 1024×1024, and SVG |
| **Supported Chains** | `Solana • Robinhood • Base • ETH • Ink • Hyperliquid • Polymarket` | Full multichain DEX, LP, Perps, and OpenSea EVM stack |

---

## 2. 🐱 Part 1: 24×24 Retro Flat Pixel Art Bible

### 1.1 Style Definition & Inking Barrier

* **Official Style Name**: **24×24 Retro Flat Pixel Art (CryptoPunks-Style Casual Feline PFP)**.
* **Shading Engine**: **Flat & Cell-Shaded 8-Bit Rendering** using rich solid color blocks with minimal dual-tone accents.
* **1-Pixel Solid Black Inking Barrier (`#0B0E14` / `#000000`)**: Every outline, facial silhouette, eye, ear, and accessory is strictly bounded by a 1-pixel solid black boundary.
* **Nearest-Neighbor Integer Scaling**: Native 24×24 pixel assets are rendered crisp without smoothing artifacts across all web and Discord embeds.

---

### 1.2 Canvas Coordinate Anatomy (24×24 Grid)

```text
┌────────────────────────────────────────────────────────┐ Y: 0 - 5 (Headroom: 6 Rows)
│   HEADROOM (Beanies, Caps, Fedora, Halo, Crown, Horns) │
├────────────────────────────────────────────────────────┤
│   MAIN FOOTPRINT: 3/4 CATZ PROFILE & LEFT-CURLED TAIL  │ Y: 6 - 21 (16 Rows)
│   • Facial Silhouette: Dynamic 3/4 Profile             │ (1-Pixel Solid Black Outline)
│   • Cheeks: 2 to 3 Tufted Whisker Spikes               │
│   • Signature Left-Curled Tail: Bottom-Left (X:0..4)   │
├────────────────────────────────────────────────────────┤
│   FOOTROOM: CHEST & NECK ACCESSORIES                   │ Y: 22 - 23 (2 Rows)
│   • Gold Chains, Bowties, Tied Bandana Anchors         │
└────────────────────────────────────────────────────────┘
```

#### Key Anatomical Rules:
1. **3/4 Side-Profile Half-Body**: Face and body face rightwards at a 3/4 angle, creating isometric depth without heavy perspective distortion.
2. **Signature Left-Curled Tail**: The tail curves upwards on the lower left of the canvas (`x: 0..4, y: 18..23`), serving as the visual anchor.
3. **Tufted Whisker Cheeks**: 2 to 3 distinct stepped pixel spikes on the cheeks for iconic feline characterization.

---

### 1.3 Official 6 Multichain Backgrounds (Layer 0)

Calibrated for silk-matte semi-muted contrast, high visibility across all fur breeds, and blockchain ecosystem lore:

| Trait Name | Hex Code | RGB | Tier | Ecosystem Lore |
| :--- | :--- | :--- | :--- | :--- |
| **Ethereum Slate** | `#8895A7` | `136, 149, 167` | Common | 💠 Cool Silver Cashmere Gray — Ethereum Ecosystem Neutral |
| **Base Indigo** | `#436FC7` | `67, 111, 199` | Common | 🔵 French Denim Royal Blue — Base Onchain Pop |
| **Hyper Seafoam** | `#3CBFA2` | `60, 191, 162` | Common | ⚡ Celadon Seafoam Mint Green — Hyperliquid L1/L2 Pop |
| **Ink Velvet** | `#7E54BF` | `126, 84, 191` | Common | 🐙 Royal Amethyst Velvet Purple — Ink Chain Ecosystem |
| **Robinhood Lime** | `#B4DC35` | `180, 220, 53` | Common | 🏹 Matcha Lime Accent — Robinhood Signature Ecosystem |
| **Pastel Rainbow RGB** | `Gradient` | Multi-Stop | **Legendary** | 👑 Clean 4-Stop Pastel Blend (`#80DEEA` ➔ `#D6C7FF` ➔ `#FFB7B2` ➔ `#FFF59D`) |

---

### 1.4 Feline Pillars & Philosophy

1. **The Prowl (Intelligence & Night Vision):** DEX pools and on-chain liquidity are dark, noisy, and hazardous. OpenCatz's 3-Layer Swarm Consensus acts as feline night vision — stalking candidates 24/7 with patient stealth and only pouncing when Swarm Confidence purrs at $\ge 80\%$.
2. **The Command Center (Control Room & Audits):** Central hub (`#opencatz-control-room`, `#opencatz-audit`, Terminal TUI, Telegram bridge) for natural language chat, instant 12-point token audits, and wallet controls.
3. **The Nine Lives Engine (Resilience & Risk):** Capital preservation is sacred. OpenCatz protects traders with a 9-Lives safety net: automated Stop-Loss (-20%), Take-Profit milestone scaling (2x/3x), dynamic trailing stops, and an instant 9-Lives Circuit Breaker emergency kill-switch.

---

## 3. 🎨 Part 2: Master Color Palette & Token Architecture

### 2.1 Three-Layer Token Architecture

```text
Layer 1: Primitive Tokens (Raw Immutable HEX/RGB)
       ↓
Layer 2: Semantic Tokens (Purpose-Driven Functional Aliases)
       ↓
Layer 3: Component Tokens (Scoped Widget Variables)
```

---

### 2.2 Complete Color Matrix & Hex Tokens

```css
:root {
  /* --- 1. BRAND & INKING INKS --- */
  --color-brand-lime: #ccff00;         /* Electric Pop / Primary Web CTA (Hero) */
  --color-brand-cyan: #80deea;         /* Secondary Electric Pop */
  --color-ink-barrier: #0b0e14;        /* 1-px Solid Black Outline */
  --color-pure-white: #ffffff;         /* Catchlight & Text Pure */

  /* --- 2. OBSIDIAN DARK SURFACES --- */
  --bg-pitch: #05070a;                 /* Canvas Viewport (95%) */
  --bg-obsidian: #080b10;              /* Base Surface Container */
  --bg-surface: #111723;               /* Card & Widget Surface */
  --bg-card: #0d121b;                  /* Deep Sub-card Container */
  --border-subtle: #1e293b;            /* 1px Structural Divider */
  --border-glass: #2a374a;             /* Elevated Widget Border */

  /* --- 3. GOOGLE RGB TELEMETRY --- */
  --rgb-cyan: #80deea;                 /* RPC Latency & DEX Liquidity */
  --rgb-lime: #ccff00;                 /* Consensus Conviction & Audits */
  --rgb-gold: #ffd700;                 /* APY, Fee Velocity & Profitability */
  --rgb-coral: #ffb7b2;                /* Market Momentum & Sentiment Pulse */
  --rgb-lavender: #d6c7ff;             /* Multi-Agent Intelligence Quorum */

  /* --- 4. MULTICHAIN BACKGROUND TOKENS --- */
  --bg-eth-slate: #8895a7;             /* Ethereum Ecosystem Neutral */
  --bg-base-indigo: #436fc7;           /* Base Onchain Royal Blue */
  --bg-hyper-seafoam: #3cbfa2;         /* Hyperliquid Mint Green */
  --bg-ink-velvet: #7e54bf;            /* Ink Chain Royal Purple */
  --bg-robinhood-lime: #b4dc35;        /* Robinhood Signature Matcha */
  --bg-pastel-cyan: #80deea;           /* Gradient Stop 1 */
  --bg-pastel-lavender: #d6c7ff;       /* Gradient Stop 2 */
  --bg-pastel-coral: #ffb7b2;          /* Gradient Stop 3 */
  --bg-pastel-yellow: #fff59d;         /* Gradient Stop 4 */
}
```

---

### 2.3 Google RGB Telemetry Spectrum

| Semantic Token | Hex Code | Discord Int | UI Telemetry & System Mapping |
| :--- | :--- | :--- | :--- |
| `--rgb-cyan` | `#80DEEA` | `0x80DEEA` | On-Chain Feeds, RPC Block Latency (<500ms), DEX Liquidity Pools |
| `--rgb-lime` | `#CCFF00` | `0xCCFF00` | Quorum Consensus Conviction ($\ge 80\%$), Verified 12-Point Audits |
| `--rgb-gold` | `#FFD700` | `0xFFD700` | Dynamic LP Yield APY, Transaction Fee Velocity, Realized PnL Gains |
| `--rgb-coral` | `#FFB7B2` | `0xFFB7B2` | Social Sentiment Catalyst, Meme Inflows, Trading Volume Surges |
| `--rgb-lavender` | `#D6C7FF` | `0xD6C7FF` | Multi-Agent Neural Consensus & OpenSea NFT Radar |

---

### 2.4 Obsidian Dark Surface Tokens

| Token Name | Hex Code | Role |
| :--- | :--- | :--- |
| `--bg-pitch` | `#05070A` | Primary viewport canvas (covers 95% of background) |
| `--bg-obsidian` | `#080B10` | App shell, side navigation, and table containers |
| `--bg-surface` | `#111723` | Bento grid cards, modal dialogs, and interactive modules |
| `--bg-card` | `#0D121B` | Embedded inner sub-cards and metric blocks |
| `--border-subtle`| `#1E293B` | Clean 1px high-contrast structural separator |

---

### 2.5 Functional Semantic Mapping (15 Sub-Agents)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   OPENCATZ MULTICHAIN COLOR MATRIX MAPPING                  │
├───────────────────────┬──────────────┬──────────────────┬───────────────────┤
│ Sub-Agent / Channel   │ Hex Code     │ RGB              │ Discord Color     │
├───────────────────────┼──────────────┼──────────────────┼───────────────────┤
│ 🍀 #call-meme-solana  │ #00E676      │ rgb(0, 230, 118) │ 0x00E676 (Jade)   │
│ 🌸 #call-meme-robinhood│ #FFB7B2     │ rgb(255, 183, 178│ 0xFFB7B2 (Pink)   │
│ 🔵 #call-meme-base    │ #436FC7      │ rgb(67, 111, 199)│ 0x436FC7 (Indigo) │
│ 🔮 #call-meme-eth     │ #D6C7FF      │ rgb(214, 199, 255│ 0xD6C7FF (Lavender│
│ 🐙 #call-meme-ink     │ #7E54BF      │ rgb(126, 84, 191)│ 0x7E54BF (Velvet) │
│ 🌊 #call-lp-solana    │ #80DEEA      │ rgb(128, 222, 234│ 0x80DEEA (Cyan)   │
│ 🌊 #call-lp-robinhood │ #80DEEA      │ rgb(128, 222, 234│ 0x80DEEA (Cyan)   │
│ 💎 #call-nft-eth      │ #8895A7      │ rgb(136, 149, 167│ 0x8895A7 (Slate)  │
│ 🔵 #call-nft-base     │ #436FC7      │ rgb(67, 111, 199)│ 0x436FC7 (Indigo) │
│ 🐙 #call-nft-ink      │ #7E54BF      │ rgb(126, 84, 191)│ 0x7E54BF (Velvet) │
│ 👑 #call-nft-robinhood│ #B4DC35      │ rgb(180, 220, 53)│ 0xB4DC35 (Lime)   │
│ ⚡ #call-nft-hyperevm │ #3CBFA2      │ rgb(60, 191, 162)│ 0x3CBFA2 (Seafoam)│
│ 🐋 #call-whale-track  │ #0277BD      │ rgb(2, 119, 189) │ 0x0277BD (Denim)  │
│ 🎯 #call-prediction   │ #00E5FF      │ rgb(0, 229, 255) │ 0x00E5FF (Poly)   │
│ ☀️ #call-ct-alpha     │ #FFF59D      │ rgb(255, 245, 157│ 0xFFF59D (Yellow) │
│ 🚨 9-Lives Circuit    │ #E53935      │ rgb(229, 57, 53) │ 0xE53935 (Red)    │
│ 🏆 Realized PnL / TP  │ #FFD700      │ rgb(255, 215, 0) │ 0xFFD700 (Gold)   │
└───────────────────────┴──────────────┴──────────────────┴───────────────────┘
```

---

## 4. 🌐 Part 3: OpenCatz Web & Terminal TUI System

### 3.1 Typography Hierarchy

| Level | Font Family | Size | Weight | Line-Height | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `JetBrains Mono` | `3.35rem (54px)` | 900 | 1.10 | Main ecosystem headline |
| **Section H1** | `JetBrains Mono` | `2.10rem (34px)` | 800 | 1.15 | Major page section title |
| **Card Title H2** | `JetBrains Mono` | `1.35rem (22px)` | 700 | 1.25 | Bento card & modal header |
| **Body Text** | `JetBrains Mono` | `0.875rem (14px)`| 400 / 500 | 1.60 | High-readability copy |
| **Telemetry & Code**| `Space Mono` | `0.75rem (12px)` | 700 | 1.50 | Logs, hashes, and bytecode |

---

### 3.2 Spatial Grid & Layout Tokens

```css
:root {
  --grid-cell-size: 56px;
  --max-width-container: 1180px;
  --max-width-docs: 1320px;
  --radius-sm: 3px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-full: 9999px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
}
```

---

### 3.3 Web UI Component Library & Action Buttons

* **Primary Pop Button (`.btn-lime`)**: Background: `#CCFF00`, Text: `#05070A`, Font-Weight: `800`, Border-Radius: `3px`.
* **Ghost Outline Button (`.btn-ghost`)**: Background: `transparent`, Border: `1px solid #334155`, Text: `#FFFFFF`, Hover: `border-color: #CCFF00`.
* **Telemetry Status Pills**:
  - Live Agent Counter: `background: #0D121B; border: 1px solid #CCFF00; color: #CCFF00;`
  - RPC Latency Indicator: `background: #0C1C28; border: 1px solid #80DEEA; color: #80DEEA;`

---

### 3.4 Terminal ANSI 24-bit TrueColor Tokens

For CLI tools (`bin/opencatz.js`, `src/cli/tui.ts`, `src/cli/doctor.ts`, `scripts/wizard.js`):

```typescript
export const THEME = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  heroLime: '\x1b[38;2;204;255;0m',      // #CCFF00 Robinhood Green (Hero)
  lime: '\x1b[38;2;204;255;0m',
  pastelPink: '\x1b[38;2;255;183;178m',  // #FFB7B2 Pastel Pink
  pink: '\x1b[38;2;255;183;178m',
  lavender: '\x1b[38;2;214;199;255m',    // #D6C7FF Lavender Purple
  retroCyan: '\x1b[38;2;128;222;234m',   // #80DEEA Retro Cyan
  cyan: '\x1b[38;2;128;222;234m',
  pastelYellow: '\x1b[38;2;255;245;157m',// #FFF59D Pastel Yellow
  yellow: '\x1b[38;2;255;245;157m',
  gold: '\x1b[38;2;255;215;0m',          // #FFD700 Golden Fortune 24K
  jadeGreen: '\x1b[38;2;0;230;118m',     // #00E676 Jade Spirit Green
  green: '\x1b[38;2;0;230;118m',
  manekiRed: '\x1b[38;2;229;57;53m',     // #E53935 Maneki-Neko Red
  red: '\x1b[38;2;229;57;53m',
  denimBlue: '\x1b[38;2;2;119;189m',     // #0277BD Denim Blue
  blue: '\x1b[38;2;2;119;189m',
  polyCyan: '\x1b[38;2;0;229;255m',      // #00E5FF Prediction Cyan
  royalViolet: '\x1b[38;2;123;31;162m',  // #7B1FA2 Royal Violet
  white: '\x1b[38;2;240;244;248m',       // #F0F4F8 Soft Crisp White
  gray: '\x1b[38;2;120;144;156m',        // #78909C Slate Gray
  darkGray: '\x1b[38;2;60;72;88m',       // #3C4858 Dark Border Gray
  obsidian: '\x1b[38;2;11;14;20m',       // #0B0E14 Obsidian Base
};
```

---

## 5. 🤖 Part 4: Discord Command Center Channel Hierarchy

The 17 Discord channels are structured across 5 organized Bento categories:

1. **🐾 OPENCATZ COMMAND CENTER (2 Channels)**
   - `#opencatz-control-room` — Main natural language chat, wallet balances, risk settings, and execution intents.
   - `#opencatz-audit` — Instant 12-point token audit upon pasting contract address (CA).

2. **🚀 MEME COIN CALLS (5 Channels)**
   - `#call-meme-solana` — Solana DEX tokens (Pump.fun, Raydium, Meteora DLMM).
   - `#call-meme-robinhood` — Robinhood Chain DEX tokens (GMGN + GoPlus).
   - `#call-meme-base` — Base L2 DEX tokens & Smart Money Flow (GMGN + GoPlus).
   - `#call-meme-eth` — Ethereum Mainnet DEX tokens & Whale Buys.
   - `#call-meme-ink` — Ink Chain / Kraken L2 DEX tokens.

3. **💧 LIQUIDITY & YIELD (2 Channels)**
   - `#call-lp-solana` — Solana Meteora DLMM Concentrated Liquidity pools.
   - `#call-lp-robinhood` — Robinhood Chain Uniswap V3 concentrated pools (Krystal Cloud).

4. **🔮 NFT SNIPING & RADAR (5 Channels — OpenSea EVM Stack)**
   - `#call-nft-eth` — Ethereum Mainnet Bluechips & Floor Surges >= 20%.
   - `#call-nft-base` — Base L2 Creator Drops & Trending Mints.
   - `#call-nft-ink` — Ink Chain / Kraken L2 NFT Radar.
   - `#call-nft-robinhood` — Robinhood Chain NFT momentum radar.
   - `#call-nft-hyperevm` — Hyperliquid HyperEVM L1 Native Collections.

5. **🎯 ORACLES & DERIVATIVES (3 Channels)**
   - `#call-whale-tracking` — Hyperliquid L1 institutional positioning & spot flows.
   - `#call-prediction-markets` — Polymarket prediction market arbitrage & whale bets.
   - `#call-ct-alpha` — Crypto Twitter (X) smart money & sentiment scraper.

---

## 6. 📝 Part 5: Copywriting & Brand Voice Directives

| Status | Approved Terminology | Banned / Deprecated Terms |
| :--- | :--- | :--- |
| **Agents** | "AI Agent", "15 Autonomous Screening Agents", "Agent Quorum" | "Bot", "Script", "Old Bot", "Random Crawler" |
| **Execution** | "3-Layer Swarm Consensus", "Sub-Second Execution", "Deterministic Filter" | "Random Trade", "Crypto Magic", "Auto-Clicker" |
| **Risk** | "9-Lives Risk Engine", "Dynamic Circuit Breaker", "Stop Loss -20%" | "Guaranteed 1000x", "No Risk", "Gambling" |
| **Branding** | "OpenCatz AI", "Catz NFT", "@itsdizcorvus" | "Athena", "Athena AI", "Chill Cats" |
