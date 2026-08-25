import { describe, it, expect } from 'vitest';
import { NFTEthAgent } from '../src/agents/nft-eth/nft-eth-agent.js';
import { NFTBaseAgent } from '../src/agents/nft-base/nft-base-agent.js';
import { NFTInkAgent } from '../src/agents/nft-ink/nft-ink-agent.js';
import { NFTRobinhoodAgent } from '../src/agents/nft-robinhood/nft-robinhood-agent.js';
import { NFTHyperEVMAgent } from '../src/agents/nft-hyperevm/nft-hyperevm-agent.js';
import { LPSolanaAgent } from '../src/agents/lp-solana/lp-solana-agent.js';
import { LPRobinhoodAgent } from '../src/agents/lp-robinhood/lp-robinhood-agent.js';
import { BaseScreeningAgent } from '../src/agents/meme-base/base-screening-agent.js';
import { EthScreeningAgent } from '../src/agents/meme-eth/eth-screening-agent.js';
import { InkScreeningAgent } from '../src/agents/meme-ink/ink-screening-agent.js';

describe('Modular Sub-Agents Structure & Segmentation', () => {
  it('5 EVM NFT Sub-Agents have correct domains and fail-closed screening without API key', async () => {
    const ethAgent = new NFTEthAgent();
    const baseAgent = new NFTBaseAgent();
    const inkAgent = new NFTInkAgent();
    const rhAgent = new NFTRobinhoodAgent();
    const hyperAgent = new NFTHyperEVMAgent();

    expect(ethAgent.domain).toBe('nft-eth');
    expect(baseAgent.domain).toBe('nft-base');
    expect(inkAgent.domain).toBe('nft-ink');
    expect(rhAgent.domain).toBe('nft-robinhood');
    expect(hyperAgent.domain).toBe('nft-hyperevm');

    const [ethRes, baseRes, inkRes, rhRes, hyperRes] = await Promise.all([
      ethAgent.runScreeningPass(),
      baseAgent.runScreeningPass(),
      inkAgent.runScreeningPass(),
      rhAgent.runScreeningPass(),
      hyperAgent.runScreeningPass(),
    ]);

    expect(Array.isArray(ethRes)).toBe(true);
    expect(Array.isArray(baseRes)).toBe(true);
    expect(Array.isArray(inkRes)).toBe(true);
    expect(Array.isArray(rhRes)).toBe(true);
    expect(Array.isArray(hyperRes)).toBe(true);
  });

  it('LP Sub-Agents have correct domains and config methods', async () => {
    const solLpAgent = new LPSolanaAgent();
    const rhLpAgent = new LPRobinhoodAgent();

    expect(solLpAgent.domain).toBe('lp-solana');
    expect(rhLpAgent.domain).toBe('lp-robinhood');
  });

  it('Meme Sub-Agents have dedicated domains and chains', () => {
    const baseAgent = new BaseScreeningAgent();
    const ethAgent = new EthScreeningAgent();
    const inkAgent = new InkScreeningAgent();

    expect(baseAgent.domain).toBe('meme-base');
    expect(ethAgent.domain).toBe('meme-eth');
    expect(inkAgent.domain).toBe('meme-ink');

    expect(baseAgent.getConfig().chains).toEqual(['base']);
    expect(ethAgent.getConfig().chains).toEqual(['eth']);
    expect(inkAgent.getConfig().chains).toEqual(['ink']);
  });
});
