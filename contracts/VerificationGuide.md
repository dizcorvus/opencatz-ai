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
3. Pilih metode: **"Solidity (Single file)"**.
4. Masukkan parameter di atas:
   - Compiler: `v0.8.24+commit.e11b9ed9`
   - Optimization: `200`
5. Masukkan **Constructor Arguments** (ABI-Encoded):
   - **Untuk `OpenCatzNFT.flat.sol`:**
     - Parameter: `string _name`, `string _symbol`, `string baseURI_`, `address _royaltyReceiver`
   - **Untuk `OpenCatzVault.flat.sol`:**
     - Parameter: `address _nftAddress`, `address _tokenAddress`, `address _treasury`

---

## 🎯 3. Constructor Arguments Generator (Cheat Sheet)

### Contoh untuk `OpenCatzNFT.flat.sol`:
- `_name`: `"OpenCatz"`
- `_symbol`: `"CATZ"`
- `baseURI_`: `"https://api.opencatz.xyz/metadata/"`
- `_royaltyReceiver`: `<ALAMAT_WALLET_DEV>` (Menerima 5% Royalti OpenSea)

### Contoh untuk `OpenCatzVault.flat.sol`:
- `_nftAddress`: `<ALAMAT_CONTRACT_OPENCATZ_NFT>`
- `_tokenAddress`: `0x0000000000000000000000000000000000000000` (disetel nanti saat token rilis)
- `_treasury`: `<ALAMAT_WALLET_DEV>` (Menerima 0.0004444 ETH swap fee)

---

## 💎 4. Fitur On-Chain yang Aktif:
- **OpenSea 5% Creator Royalty:** Otomatis masuk ke wallet `_royaltyReceiver`.
- **Vault Swap Protocol Fee:** Flat `0.0004444 ETH` (simbol 4.444 koleksi) otomatis diteruskan ke `_treasury`.
- **Two-Phase Token Binding:** Token `$CATZ` bisa di-bind kapan saja setelah diluncurkan di `letscash.fun` lewat fungsi `setTokenAddress()`.
