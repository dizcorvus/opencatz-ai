# 🐾 OpenCatz Ecosystem Whitepaper (Robinhood Chain Edition)

> **Autonomous AI Intelligence · Deflationary Meme Flywheel · NFT Liquidity Peg**  
> *Robinhood Chain (Chain ID: 4663) · Arbitrum Orbit L2 · Uniswap v4*

---

## 1. Executive Summary

**OpenCatz** is an integrated crypto ecosystem on **Robinhood Chain (Chain ID: 4663)** bringing together three core pillars:
1. **OpenCatz AI Agent:** An autonomous multi-agent intelligence command center (15 specialized AI scouts) delivering high-conviction screening across Solana, Robinhood Chain, Base, Ethereum, Ink, Hyperliquid, and Polymarket.
2. **OpenCatz NFT Collection:** A finite collection of pixel cat scouts acting as a **Lifetime VIP Access Pass** to Discord/Telegram AI trading signals, generating **5% OpenSea Creator Royalties** for ongoing ecosystem development.
3. **$CATZ Token (via `letscash.fun`):** A community meme token launched with **1% Auto Self-Burn on Uniswap v4**, where 50% of the initial supply is permanently vaulted to guarantee a 1:1 liquid floor peg for OpenCatz NFTs.

---

## 2. The Dual-Sided Supply Squeeze (Economic Model)

```
        ┌─────────────────────────────────────────────────────────────┐
        │             DUAL-SIDED SUPPLY SHOCK FLYWHEEL                │
        └──────────────────────────────┬──────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│       SISI TOKEN ($CATZ)             │  │        SISI NFT (OPENCATZ)           │
│ • 1% Self-Burn di letscash.fun       │  │ • NFT ditukar token masuk ke Vault   │
│ • Setiap swap otomatis market-buy    │  │ • Stok NFT di OpenSea makin tipis   │
│   lalu token DI-BURN permanen        │  │ • Floor price OpenSea terdorong naik │
│ • Suplai $CATZ makin hari makin tipis│  │ • Dev dapet 5% Royalti OpenSea       │
└──────────────────┬───────────────────┘  └──────────────────┬───────────────────┘
                   │                                         │
                   └───────────────────►◄────────────────────┘
                              SALING MENGUNCI 
                    (Arbitrage Peg & Saling Angkat Harga)
```

### A. Sisi Token ($CATZ):
- Diluncurkan di `letscash.fun` dengan mode **Self-Burn (1% tax)**.
- Setiap transaksi buy/sell di Uniswap v4 Hook otomatis mengambil tax 1%, menggunakan 0.7% untuk *market-buy* token `$CATZ` di poolnya sendiri, dan **menghancurkannya (*burn*) ke dead address**.
- Total suplai beredar terus menyusut secara konsisten (*deflationary pressure*).

### B. Sisi NFT (OpenCatz NFT):
- Saat trader menukarkan NFT mereka ke Vault untuk mendapatkan token `$CATZ`, NFT tersebut tersimpan di dalam brankas Vault.
- Ini mengurangi suplai NFT yang beredar dan diperdagangkan di OpenSea.
- Semakin tipis suplai NFT di OpenSea, semakin tinggi dorongan harga dasar (*Floor Price*).

### C. Arbitrase Otomatis (Market Pegging):
- **Jika Token `$CATZ` Naik di DEX:** Trader memborong NFT murah di OpenSea ➔ deposit ke Vault ➔ jual `$CATZ` di DEX untuk mengambil profit arbitrase ➔ Floor price NFT otomatis terdorong naik!
- **Jika NFT Floor Naik di OpenSea:** Trader membeli `$CATZ` di DEX ➔ redeem NFT dari Vault ➔ jual NFT di OpenSea ➔ Harga token `$CATZ` otomatis terdorong naik!

---

## 3. Smart Contract Architecture

### 1. `OpenCatzNFT.sol` (ERC-721 + EIP-2981)
- **Standard:** ERC-721 Enumerable + EIP-2981 Royalty Standard.
- **Royalty:** 500 basis points (5%) otomatis disalurkan ke dompet Creator pada setiap transaksi di OpenSea, Blur, atau marketplace sekunder lainnya.
- **Access Control:** Membuka role eksklusif di Discord Command Center OpenCatz.

### 2. `OpenCatzVault.sol` (The Liquidity Peg & Burn Hub)
- **Fungsi Utama:**
  - `depositNFT(uint256 tokenId)`: Menerima NFT dari user dan mentransfer 100.000 `$CATZ` ke user.
  - `redeemNFT(uint256 tokenId)`: Menerima 100.000 `$CATZ` dari user dan mengeluarkan NFT pilihan dari inventaris.
  - `activateTier(uint256 tokenId, uint8 targetTier)`: Menarik biaya `$CATZ` untuk aktivasi payroll NFT, **50% dari biaya langsung di-BURN ke `0x000...dead`**, dan 50% sisanya disimpan di Reward Pot.
- **Keamanan:**
  - `ReentrancyGuard` untuk mencegah eksploitasi transfer ganda.
  - `Pausable` (hanya untuk keadaan darurat / circuit breaker oleh owner).
  - **Zero Drain Backdoor:** Tidak ada fungsi penarikan sepihak untuk dev. 50% cadangan token terjamin hanya bisa keluar jika ada NFT yang masuk.

---

## 4. Distribution & Deployment Plan on Robinhood Chain

1. **Deploy Token di `letscash.fun`:**
   - Platform: `letscash.fun` (Uniswap v4 Hook on Robinhood Chain #4663).
   - Mode: Self-Burn (1% fee rate).
   - Quote: ETH / USDG.
   - First Buy: 50% token suplai dibeli dan dialirkan langsung ke smart contract `OpenCatzVault`.
2. **Deploy `OpenCatzNFT.sol` & `OpenCatzVault.sol`:**
   - Di-deploy ke Robinhood Chain Mainnet.
   - Diverifikasi di Blockscout (`robinhoodchain.blockscout.com`) dengan status *Exact Match*.
3. **Discord Token-Gating Integration:**
   - Integrasi bot Discord untuk mendeteksi kepemilikan NFT OpenCatz dan memberikan role VIP sinyal alpha 24/7.
