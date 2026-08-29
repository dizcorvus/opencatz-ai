# 🔍 Robinhood Chain Blockscout Exact Match Verification Guide

Panduan resmi untuk melakukan **Verify & Publish** smart contract OpenCatz di **Robinhood Chain Blockscout** (`https://robinhoodchain.blockscout.com/`) dengan status **100% Exact Match**.

---

## ⚙️ 1. Parameter Kompilasi Standar (Standard Compiler Config)

Gunakan parameter berikut di Remix, Hardhat, atau Foundry saat melakukan compile:

| Parameter | Nilai Wajib |
| :--- | :--- |
| **Compiler Version** | `v0.8.24+commit.e11b9ed9` (Solidity 0.8.24) |
| **Open Source License** | `MIT License (MIT)` |
| **Optimization** | **`Yes` (Enabled)** |
| **Optimization Runs** | **`200`** |
| **EVM Version** | `cancun` (atau `default`) |

---

## 📝 2. Langkah-Langkah Verifikasi di Blockscout:

1. Buka explorer Robinhood Chain: `https://robinhoodchain.blockscout.com/address/<ALAMAT_KONTRAK>`
2. Buka tab **Contract** ➔ Klik tombol **"Verify and Publish"**.
3. Pilih metode: **"Solidity (Standard JSON input)"** atau **"Solidity (Single file / Flat file)"**.
4. Masukkan parameter di atas:
   - Compiler: `v0.8.24`
   - Optimization: `200`
5. Masukkan **Constructor Arguments** (ABI-Encoded):
   - **Untuk `OpenCatzNFT.sol`:**
     - Parameter: `string _name`, `string _symbol`, `string baseURI_`, `address _royaltyReceiver`
   - **Untuk `OpenCatzVault.sol`:**
     - Parameter: `address _nftAddress`, `address _tokenAddress`

---

## 🎯 3. Constructor Arguments Generator (Cheat Sheet)

### Contoh untuk `OpenCatzNFT.sol`:
- `_name`: `"OpenCatz"`
- `_symbol`: `"CATZ"`
- `baseURI_`: `"https://api.opencatz.xyz/metadata/"`
- `_royaltyReceiver`: `<ALAMAT_WALLET_DEV>` (Menerima 5% Royalti OpenSea)

### Contoh untuk `OpenCatzVault.sol`:
- `_nftAddress`: `<ALAMAT_CONTRACT_OPENCATZ_NFT>`
- `_tokenAddress`: `<ALAMAT_TOKEN_CATZ_LETSCASH>`

---

## ✅ 4. Hasil yang Diharapkan:
- Badge **Contract Verified [🟢 Exact Match]** di Blockscout.
- GMGN, GoPlus, dan DexScreener otomatis mengenali alamat sebagai `Contract: OpenCatzVault` dan `Contract: OpenCatzNFT`.
