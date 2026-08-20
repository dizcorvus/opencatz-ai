import { describe, it, expect } from 'vitest';
import { NFTGatingService, DEFAULT_CATZ_NFT_CONTRACT, ROBINHOOD_CHAIN_ID } from '../src/services/nft-gating-service.js';

describe('NFTGatingService (Catz NFT Exclusive Holder Gating)', () => {
  it('initializes with default Catz NFT parameters', () => {
    const service = new NFTGatingService();
    const info = service.getCollectionInfo();

    expect(info.name).toBe('Catz NFT');
    expect(info.symbol).toBe('CATZ');
    expect(info.totalSupply).toBe(4444);
    expect(info.chainId).toBe(ROBINHOOD_CHAIN_ID);
    expect(info.standard).toContain('ERC721');
    expect(service.getContractAddress()).toBe(DEFAULT_CATZ_NFT_CONTRACT);
  });

  it('rejects invalid wallet format gracefully', async () => {
    const service = new NFTGatingService();
    const result = await service.verifyHolder('not-a-valid-address');

    expect(result.isHolder).toBe(false);
    expect(result.balance).toBe(0);
    expect(result.holderTier).toBe('NONE');
  });

  it('supports simulated holder verification for testing and offline modes', async () => {
    const service = new NFTGatingService();
    const mockWallet = '0x123456789012345678901234567890123456ca72';
    const result = await service.verifyHolder(mockWallet);

    expect(result.isHolder).toBe(true);
    expect(result.balance).toBe(2);
    expect(result.holderTier).toBe('CATZ_HOLDER');
    expect(result.tokenIds).toContain('42');
  });

  it('correctly reports VIP access status', async () => {
    const service = new NFTGatingService();
    const mockVipWallet = '0x123456789012345678901234567890123456c472';
    const isVip = await service.isVipAccessGranted(mockVipWallet);

    expect(isVip).toBe(true);
  });
});
