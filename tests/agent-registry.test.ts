import { describe, it, expect } from 'vitest';
import { getAgentDomain, normalizeDomainKey, AGENT_DOMAINS } from '../src/orchestrator/agent-registry.js';

describe('agent registry', () => {
  it('contains all 11 agent domains with dedicated channels', () => {
    expect(AGENT_DOMAINS.map((d) => d.id).sort()).toEqual(
      [
        'ct-alpha',
        'lp-robinhood',
        'lp-solana',
        'meme-base',
        'meme-bsc',
        'meme-eth',
        'meme-robinhood',
        'meme-solana',
        'nft',
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
    expect(getAgentDomain('meme-bsc')?.channel).toBe('call-meme-bnb');
    expect(getAgentDomain('solana-meme')?.id).toBe('meme-solana');
    expect(getAgentDomain('call-whale-tracking')?.id).toBe('perps');
    expect(getAgentDomain('unknown-agent')).toBeUndefined();
  });

  it('normalizeDomainKey strips prefixes consistently', () => {
    expect(normalizeDomainKey('MEME_SOLANA')).toBe('meme-solana');
    expect(normalizeDomainKey('call-meme-robinhood')).toBe('meme-robinhood');
    expect(normalizeDomainKey('call-meme-base')).toBe('meme-base');
    expect(normalizeDomainKey('call-meme-eth')).toBe('meme-eth');
    expect(normalizeDomainKey('call-meme-bnb')).toBe('meme-bsc');
    expect(normalizeDomainKey('solana-meme')).toBe('meme-solana');
  });
});
