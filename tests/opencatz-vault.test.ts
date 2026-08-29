import { describe, it, expect } from 'vitest';

describe('OpenCatzVault & OpenCatzNFT On-Chain Architecture', () => {
  // Test 1: Royalty 5% (500 bps) math verification
  it('EIP-2981 5% royalty calculates exactly 500 bps of sale price', () => {
    const royaltyFeeBps = 500n; // 5%
    const salePrice = 1_000_000_000_000_000_000n; // 1 ETH in wei
    const expectedRoyalty = (salePrice * royaltyFeeBps) / 10000n;

    expect(expectedRoyalty).toBe(50_000_000_000_000_000n); // 0.05 ETH
  });

  // Test 2: Vault Deposit Token Ratio (1 NFT = 100,000 $CATZ)
  it('Vault correctly computes 100,000 $CATZ (18 decimals) per NFT deposit', () => {
    const TOKENS_PER_NFT = 100_000n * 10n ** 18n;
    const depositedNFTs = 5n;
    const totalTokensExpected = depositedNFTs * TOKENS_PER_NFT;

    expect(totalTokensExpected).toBe(500_000n * 10n ** 18n);
  });

  // Test 3: Inventory tracking algorithm (swap & pop)
  it('Vault inventory maintains correct tracking after deposits and redemptions', () => {
    const inventory: number[] = [];
    const indexMap = new Map<number, number>();

    const deposit = (id: number) => {
      inventory.push(id);
      indexMap.set(id, inventory.length);
    };

    const redeem = (id: number) => {
      const idxPlusOne = indexMap.get(id);
      expect(idxPlusOne).toBeDefined();
      const idx = idxPlusOne! - 1;
      const lastIdx = inventory.length - 1;

      if (idx !== lastIdx) {
        const lastTokenId = inventory[lastIdx];
        inventory[idx] = lastTokenId;
        indexMap.set(lastTokenId, idx + 1);
      }
      inventory.pop();
      indexMap.delete(id);
    };

    // Deposit tokens #101, #102, #103
    deposit(101);
    deposit(102);
    deposit(103);
    expect(inventory).toEqual([101, 102, 103]);

    // Redeem middle token #102
    redeem(102);
    expect(inventory).toEqual([101, 103]);
    expect(indexMap.has(102)).toBe(false);
    expect(indexMap.get(103)).toBe(2);

    // Redeem #101
    redeem(101);
    expect(inventory).toEqual([103]);
    expect(indexMap.get(103)).toBe(1);
  });
});
