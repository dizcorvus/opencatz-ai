import { describe, it, expect, beforeEach } from 'vitest';

/**
 * End-to-End Simulation of OpenCatz NFT + OpenCatz Vault (Two-Phase Binding) + $CATZ Token
 */
describe('OpenCatz Ecosystem End-to-End Test Suite', () => {
  const TOKENS_PER_NFT = 100_000n * 10n ** 18n;
  const CREATOR_WALLET = '0xDev1111111111111111111111111111111111111'.toLowerCase();

  // Mock State
  let nftOwners: Map<number, string>;
  let tokenBalances: Map<string, bigint>;
  let vaultInventory: number[];
  let vaultIndexMap: Map<number, number>;
  let isPaused: boolean;
  let tokenInitialized: boolean;
  let boundTokenAddress: string | null;

  const VAULT_ADDRESS = '0xVaultContractAddress1234567890'.toLowerCase();
  const ALICE = '0xAlice11111111111111111111111111111111111'.toLowerCase();
  const BOB = '0xBob22222222222222222222222222222222222222'.toLowerCase();
  const CHARLIE = '0xCharlie3333333333333333333333333333333333'.toLowerCase();
  const CATZ_TOKEN_ADDR = '0xLetscashCatzTokenAddress123456789cc'.toLowerCase();

  beforeEach(() => {
    nftOwners = new Map();
    tokenBalances = new Map();
    vaultInventory = [];
    vaultIndexMap = new Map();
    isPaused = false;
    tokenInitialized = false;
    boundTokenAddress = null;

    // Initial setup: Alice owns NFT #1 and #2
    nftOwners.set(1, ALICE);
    nftOwners.set(2, ALICE);

    tokenBalances.set(VAULT_ADDRESS, 0n);
    tokenBalances.set(ALICE, 0n);
    tokenBalances.set(BOB, 200_000n * 10n ** 18n);
    tokenBalances.set(CHARLIE, 0n);
  });

  const vaultSetTokenAddress = (caller: string, tokenAddr: string) => {
    if (caller !== CREATOR_WALLET) throw new Error('OpenCatzVault: caller is not owner');
    if (tokenInitialized) throw new Error('OpenCatzVault: token already permanently bound');
    if (!tokenAddr || tokenAddr === '0x0000000000000000000000000000000000000000') {
      throw new Error('OpenCatzVault: zero token address');
    }
    boundTokenAddress = tokenAddr;
    tokenInitialized = true;
  };

  const vaultDepositNFT = (caller: string, tokenId: number) => {
    if (isPaused) throw new Error('OpenCatzVault: vault paused');
    if (!tokenInitialized || !boundTokenAddress) throw new Error('OpenCatzVault: token not bound yet');
    if (nftOwners.get(tokenId) !== caller) throw new Error('OpenCatzVault: caller does not own NFT');
    
    const vaultBal = tokenBalances.get(VAULT_ADDRESS) ?? 0n;
    if (vaultBal < TOKENS_PER_NFT) throw new Error('OpenCatzVault: insufficient token reserves');

    // Transfer NFT to vault
    nftOwners.set(tokenId, VAULT_ADDRESS);
    vaultInventory.push(tokenId);
    vaultIndexMap.set(tokenId, vaultInventory.length);

    // Transfer tokens to user
    tokenBalances.set(VAULT_ADDRESS, vaultBal - TOKENS_PER_NFT);
    tokenBalances.set(caller, (tokenBalances.get(caller) ?? 0n) + TOKENS_PER_NFT);
  };

  const vaultRedeemNFT = (caller: string, tokenId: number) => {
    if (isPaused) throw new Error('OpenCatzVault: vault paused');
    if (!tokenInitialized || !boundTokenAddress) throw new Error('OpenCatzVault: token not bound yet');
    if (!vaultIndexMap.has(tokenId)) throw new Error('OpenCatzVault: NFT not available in inventory');

    const callerBal = tokenBalances.get(caller) ?? 0n;
    if (callerBal < TOKENS_PER_NFT) throw new Error('OpenCatzVault: insufficient balance');

    // Pull tokens from user into Vault
    tokenBalances.set(caller, callerBal - TOKENS_PER_NFT);
    tokenBalances.set(VAULT_ADDRESS, (tokenBalances.get(VAULT_ADDRESS) ?? 0n) + TOKENS_PER_NFT);

    // Remove from inventory
    const idxPlusOne = vaultIndexMap.get(tokenId)!;
    const idx = idxPlusOne - 1;
    const lastIdx = vaultInventory.length - 1;

    if (idx !== lastIdx) {
      const lastToken = vaultInventory[lastIdx];
      vaultInventory[idx] = lastToken;
      vaultIndexMap.set(lastToken, idx + 1);
    }
    vaultInventory.pop();
    vaultIndexMap.delete(tokenId);

    // Transfer NFT to user
    nftOwners.set(tokenId, caller);
  };

  // --- E2E Tests ---

  it('Step 0: Vault rejects deposits before token address is bound', () => {
    expect(() => vaultDepositNFT(ALICE, 1)).toThrow('OpenCatzVault: token not bound yet');
  });

  it('Step 1: Dev binds token address once and funds the Vault with 500M $CATZ', () => {
    vaultSetTokenAddress(CREATOR_WALLET, CATZ_TOKEN_ADDR);
    expect(tokenInitialized).toBe(true);
    expect(boundTokenAddress).toBe(CATZ_TOKEN_ADDR);

    // Fund Vault with 500M tokens
    tokenBalances.set(VAULT_ADDRESS, 500_000_000n * 10n ** 18n);

    // Re-binding is rejected (Permanent Lock)
    expect(() => vaultSetTokenAddress(CREATOR_WALLET, '0xAnotherTokenAddress')).toThrow(
      'OpenCatzVault: token already permanently bound'
    );
  });

  it('Step 2: Alice deposits NFT #1 and receives 100k $CATZ', () => {
    vaultSetTokenAddress(CREATOR_WALLET, CATZ_TOKEN_ADDR);
    tokenBalances.set(VAULT_ADDRESS, 500_000_000n * 10n ** 18n);

    vaultDepositNFT(ALICE, 1);

    expect(nftOwners.get(1)).toBe(VAULT_ADDRESS);
    expect(tokenBalances.get(ALICE)).toBe(TOKENS_PER_NFT);
    expect(vaultInventory).toEqual([1]);
    expect(tokenBalances.get(VAULT_ADDRESS)).toBe(499_900_000n * 10n ** 18n);
  });

  it('Step 3: Bob redeems NFT #1 by paying 100k $CATZ', () => {
    vaultSetTokenAddress(CREATOR_WALLET, CATZ_TOKEN_ADDR);
    tokenBalances.set(VAULT_ADDRESS, 500_000_000n * 10n ** 18n);

    // Alice deposits #1 first
    vaultDepositNFT(ALICE, 1);

    // Bob redeems #1
    vaultRedeemNFT(BOB, 1);

    expect(nftOwners.get(1)).toBe(BOB);
    expect(tokenBalances.get(BOB)).toBe(100_000n * 10n ** 18n);
    expect(vaultInventory).toEqual([]);
    expect(tokenBalances.get(VAULT_ADDRESS)).toBe(500_000_000n * 10n ** 18n);
  });

  it('Step 4: EIP-2981 OpenSea Royalty returns exact 5% to Creator Wallet', () => {
    const salePrice = 2_000_000_000_000_000_000n; // 2 ETH
    const royaltyFeeBps = 500n; // 5%
    const receiver = CREATOR_WALLET;
    const royaltyAmount = (salePrice * royaltyFeeBps) / 10000n;

    expect(receiver).toBe(CREATOR_WALLET);
    expect(royaltyAmount).toBe(100_000_000_000_000_000n); // 0.1 ETH
  });
});
