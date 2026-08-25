import { describe, it, expect } from 'vitest';
import { getAgentDomain, normalizeDomainKey, AGENT_DOMAINS } from '../src/orchestrator/agent-registry.js';

describe('agent registry', () => {
  it('contains all 15 agent domains with dedicated channels', () => {
    expect(AGENT_DOMAINS.map((d) => d.id).sort()).toEqual(
      [
        'ct-alpha',
        'lp-robinhood',
        'lp-solana',
        'meme-base',
        'meme-eth',
        'meme-ink',
        'meme-robinhood',
        'meme-solana',
        'nft-base',
        'nft-eth',
        'nft-hyperevm',
        'nft-ink',
        'nft-robinhood',
        'perps',
        'prediction',
      ].sort()
    );
  });

  it('getAgentDomain resolves canonical id, aliases, and dedicated channel names', () => {
    expect(getAgentDomain('meme-solana')?.channel).toBe('call-meme-solana');
    expect(getAgentDomain('meme-robinhood')?.channel).toBe('call-meme-robinhood');
    expect(getAgentDomain('meme-base')?.channel).toBe('call-meme-base');
    expect(getAgentDomain('meme-eth')?.channel).toBe('call-meme-eth');
    expect(getAgentDomain('meme-ink')?.channel).toBe('call-meme-ink');
    expect(getAgentDomain('lp-solana')?.channel).toBe('call-lp-solana');
    expect(getAgentDomain('lp-robinhood')?.channel).toBe('call-lp-robinhood');
    expect(getAgentDomain('nft-eth')?.channel).toBe('call-nft-eth');
    expect(getAgentDomain('nft-base')?.channel).toBe('call-nft-base');
    expect(getAgentDomain('nft-ink')?.channel).toBe('call-nft-ink');
    expect(getAgentDomain('nft-robinhood')?.channel).toBe('call-nft-robinhood');
    expect(getAgentDomain('nft-hyperevm')?.channel).toBe('call-nft-hyperevm');
    expect(getAgentDomain('solana-meme')?.id).toBe('meme-solana');
    expect(getAgentDomain('rh-nft')?.id).toBe('nft-robinhood');
    expect(getAgentDomain('unknown-agent')).toBeUndefined();
  });

  it('normalizeDomainKey strips prefixes consistently', () => {
    expect(normalizeDomainKey('MEME_SOLANA')).toBe('meme-solana');
    expect(normalizeDomainKey('call-meme-robinhood')).toBe('meme-robinhood');
    expect(normalizeDomainKey('call-meme-base')).toBe('meme-base');
    expect(normalizeDomainKey('call-meme-eth')).toBe('meme-eth');
    expect(normalizeDomainKey('call-meme-ink')).toBe('meme-ink');
    expect(normalizeDomainKey('call-nft-eth')).toBe('nft-eth');
    expect(normalizeDomainKey('call-nft-base')).toBe('nft-base');
    expect(normalizeDomainKey('call-nft-ink')).toBe('nft-ink');
    expect(normalizeDomainKey('call-nft-robinhood')).toBe('nft-robinhood');
    expect(normalizeDomainKey('call-nft-hyperevm')).toBe('nft-hyperevm');
    expect(normalizeDomainKey('solana-meme')).toBe('meme-solana');
  });
});
