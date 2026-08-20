export type AgentDomainId =
  | 'meme-solana'
  | 'meme-robinhood'
  | 'meme-base'
  | 'meme-eth'
  | 'meme-bsc'
  | 'perps'
  | 'nft'
  | 'prediction'
  | 'ct-alpha'
  | 'lp-solana'
  | 'lp-robinhood';

export type AgentCategory = 'MEME' | 'LP' | 'PERPS' | 'NFT' | 'PREDICTION' | 'CT_ALPHA';

export interface AgentDomainInfo {
  id: AgentDomainId;
  displayName: string;
  name: string;
  channel: string;
  aliases: string[];
  requiredKeys: string[];
  category: AgentCategory;
}

export const AGENT_DOMAINS: AgentDomainInfo[] = [
  {
    id: 'meme-solana',
    displayName: 'MEME-SOLANA',
    name: 'Solana DEX Meme Screening',
    channel: 'call-meme-solana',
    aliases: ['solana', 'solana-meme', 'sol'],
    requiredKeys: ['AI_API_KEY'],
    category: 'MEME',
  },
  {
    id: 'meme-robinhood',
    displayName: 'MEME-ROBINHOOD',
    name: 'Robinhood Chain Meme Screening',
    channel: 'call-meme-robinhood',
    aliases: ['robinhood', 'rh', 'rh-meme'],
    requiredKeys: ['AI_API_KEY'],
    category: 'MEME',
  },
  {
    id: 'meme-base',
    displayName: 'MEME-BASE',
    name: 'Base L2 Meme Screening',
    channel: 'call-meme-base',
    aliases: ['base', 'base-meme'],
    requiredKeys: ['AI_API_KEY'],
    category: 'MEME',
  },
  {
    id: 'meme-eth',
    displayName: 'MEME-ETH',
    name: 'Ethereum Mainnet Meme Screening',
    channel: 'call-meme-eth',
    aliases: ['eth', 'ethereum', 'eth-meme', 'call-meme-ethereum'],
    requiredKeys: ['AI_API_KEY'],
    category: 'MEME',
  },
  {
    id: 'meme-bsc',
    displayName: 'MEME-BNB',
    name: 'BNB Chain (BSC) Meme Screening',
    channel: 'call-meme-bnb',
    aliases: ['bsc', 'bnb', 'bnb-meme', 'bsc-meme', 'call-meme-bsc'],
    requiredKeys: ['AI_API_KEY'],
    category: 'MEME',
  },
  {
    id: 'perps',
    displayName: 'WHALE-TRACKING',
    name: 'Smart Trader & Whale Positioning Tracking (Hyperliquid)',
    channel: 'call-whale-tracking',
    aliases: ['perpetual', 'hyperliquid', 'perps-futures', 'futures', 'whale', 'smartmoney', 'smart-money'],
    requiredKeys: ['AI_API_KEY'],
    category: 'PERPS',
  },
  {
    id: 'nft',
    displayName: 'NFT-SNIPING',
    name: 'EVM NFT Floor & Rarity Sniping (OpenSea)',
    channel: 'call-nft-sniping',
    aliases: ['opensea', 'nft-sniper'],
    requiredKeys: ['OPENSEA_API_KEY', 'AI_API_KEY'],
    category: 'NFT',
  },
  {
    id: 'prediction',
    displayName: 'PREDICTION-MARKETS',
    name: 'Polymarket Prediction Market Arbitrage',
    channel: 'call-prediction-markets',
    aliases: ['polymarket', 'poly', 'prediction-market'],
    requiredKeys: ['AI_API_KEY'],
    category: 'PREDICTION',
  },
  {
    id: 'ct-alpha',
    displayName: 'CT-ALPHA',
    name: 'Smart CT & AI Narrative Intelligence',
    channel: 'call-ct-alpha',
    aliases: ['twitter', 'ct', 'ctalpha'],
    requiredKeys: ['TWEX_API_KEY', 'AI_API_KEY'],
    category: 'CT_ALPHA',
  },
  {
    id: 'lp-solana',
    displayName: 'LP-SOLANA',
    name: 'Solana Concentrated Liquidity Velocity (Meteora)',
    channel: 'call-lp-solana',
    aliases: ['meteora', 'solana-lp'],
    requiredKeys: ['AI_API_KEY'],
    category: 'LP',
  },
  {
    id: 'lp-robinhood',
    displayName: 'LP-ROBINHOOD',
    name: 'Robinhood Chain Concentrated Liquidity Velocity (Uniswap)',
    channel: 'call-lp-robinhood',
    aliases: ['uniswap', 'evm-lp', 'lp-evm'],
    requiredKeys: ['AI_API_KEY'],
    category: 'LP',
  },
];

function canonicalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/^call-/, '')
    .replace(/-token$/, '');
}

export function getAgentDomain(idOrAlias: string): AgentDomainInfo | undefined {
  const key = canonicalize(idOrAlias);
  return AGENT_DOMAINS.find(
    (d) => d.id === key || d.aliases.some((a) => a === key) || d.channel === idOrAlias.toLowerCase()
  );
}

export function normalizeDomainKey(idOrAlias: string): string {
  return getAgentDomain(idOrAlias)?.id ?? canonicalize(idOrAlias);
}
