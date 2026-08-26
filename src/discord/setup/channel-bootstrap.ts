import { Guild, ChannelType, CategoryChannel } from 'discord.js';

export interface ChannelSetupResult {
  controlRoomId: string;
  auditOnDemandId: string;
  logsId?: string;
  journalId?: string;
  memeSolanaId: string;
  memeRobinhoodId: string;
  memeBaseId: string;
  memeEthId: string;
  memeInkId: string;
  lpSolanaId: string;
  lpRobinhoodId: string;
  nftEthId: string;
  nftBaseId: string;
  nftInkId: string;
  nftRobinhoodId: string;
  nftHyperEVMId: string;
  perpsId: string;
  predictionId: string;
  ctAlphaId: string;
}

export async function bootstrapDiscordChannels(guild: Guild): Promise<ChannelSetupResult> {
  console.log(`[DISCORD BOOTSTRAP] Checking & auto-creating OpenCatz categorized channels in guild: "${guild.name}"...`);

  // Helper to get or create a category
  const getOrCreateCategory = async (name: string, searchTerms: string[]): Promise<CategoryChannel> => {
    let category = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && searchTerms.some(t => c.name.toLowerCase().includes(t.toLowerCase()))
    ) as CategoryChannel | undefined;

    if (!category) {
      category = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
      });
      console.log(`[DISCORD BOOTSTRAP] Created Category: "${name}"`);
    }
    return category;
  };

  // 1. Categories
  const catCommand = await getOrCreateCategory('🐾 OPENCATZ COMMAND CENTER', ['command center', 'opencatz']);
  const catMeme = await getOrCreateCategory('🚀 MEME COIN CALLS', ['meme coin', 'meme calls']);
  const catLp = await getOrCreateCategory('💧 LIQUIDITY & YIELD', ['liquidity', 'yield', 'lp']);
  const catNft = await getOrCreateCategory('🔮 NFT SNIPING & RADAR', ['nft sniping', 'nft radar', 'nft']);
  const catOracles = await getOrCreateCategory('🎯 ORACLES & DERIVATIVES', ['oracles', 'derivatives', 'prediction']);

  // Helper to get or create channel under category
  const getOrCreateChannel = async (categoryId: string, name: string, topic: string, legacyNames?: string[]) => {
    let channel = guild.channels.cache.find(
      c => c.type === ChannelType.GuildText && (c.name === name || (legacyNames && legacyNames.includes(c.name)))
    );

    if (!channel) {
      channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: categoryId,
        topic,
      });
      console.log(`[DISCORD BOOTSTRAP] Auto-created Channel: #${name}`);
    } else if (channel.parentId !== categoryId) {
      try {
        if ('setParent' in channel && typeof (channel as any).setParent === 'function') {
          await (channel as any).setParent(categoryId);
        }
      } catch (e: any) {
        console.warn(`[DISCORD BOOTSTRAP] Could not move #${name} to category: ${e.message}`);
      }
    }
    return channel.id;
  };

  // Category 1: Command Center
  const controlRoomId = await getOrCreateChannel(
    catCommand.id,
    'opencatz-control-room',
    '⚙️ OpenCatz Core Command Hub - Chat with AI, wallet management, & 9-Lives risk configuration.'
  );

  const auditOnDemandId = await getOrCreateChannel(
    catCommand.id,
    'opencatz-audit',
    '🔎 On-Demand Token Audit Channel - Paste any Solana or EVM Contract Address (CA) here for instant 12-point audit!',
    ['audit-on-demand']
  );

  const logsId = await getOrCreateChannel(
    catCommand.id,
    'opencatz-logs',
    '📜 Real-Time System Event Logs, Rate Limit Notices & Health Telemetry',
    ['logs', 'opencat-logs']
  );

  const journalId = await getOrCreateChannel(
    catCommand.id,
    'opencatz-journal',
    '📓 Trade Journal & PnL History - Automated Win-rate logs, entries, and exits',
    ['journal', 'opencat-journal']
  );

  // Category 2: Meme Coin Calls
  const memeSolanaId = await getOrCreateChannel(
    catMeme.id,
    'call-meme-solana',
    '🚀 High-Confidence Solana DEX Signal Calls (Pump.fun, Raydium, Meteora)'
  );

  const memeRobinhoodId = await getOrCreateChannel(
    catMeme.id,
    'call-meme-robinhood',
    '🌸 High-Confidence Robinhood Chain Meme Signal Calls (GMGN + GoPlus)'
  );

  const memeBaseId = await getOrCreateChannel(
    catMeme.id,
    'call-meme-base',
    '🔵 High-Confidence Base L2 Meme Signal Calls (GMGN + GoPlus Security)'
  );

  const memeEthId = await getOrCreateChannel(
    catMeme.id,
    'call-meme-eth',
    '💎 High-Confidence Ethereum Mainnet Meme Signal Calls (Uniswap + GoPlus)'
  );

  const memeInkId = await getOrCreateChannel(
    catMeme.id,
    'call-meme-ink',
    '🐙 High-Confidence Ink Chain (Kraken L2) Meme Signal Calls (DexScreener + GoPlus)'
  );

  // Category 3: Liquidity & Yield
  const lpSolanaId = await getOrCreateChannel(
    catLp.id,
    'call-lp-solana',
    '🌊 High-Yield Solana Concentrated Liquidity Calls (Meteora DLMM)'
  );

  const lpRobinhoodId = await getOrCreateChannel(
    catLp.id,
    'call-lp-robinhood',
    '🌊 High-Yield Robinhood Chain Concentrated Liquidity Calls (Uniswap V3)'
  );

  // Category 4: NFT Sniping & Radar (OpenSea Multichain EVM)
  const nftEthId = await getOrCreateChannel(
    catNft.id,
    'call-nft-eth',
    '💎 Ethereum Bluechip NFT Floor Surges & Whale Sweeping Alerts (OpenSea)',
    ['call-nft-sniping']
  );

  const nftBaseId = await getOrCreateChannel(
    catNft.id,
    'call-nft-base',
    '🔵 Base L2 Creator Drops, Trending Mints, & Zora/OpenSea NFT Signals'
  );

  const nftInkId = await getOrCreateChannel(
    catNft.id,
    'call-nft-ink',
    '🐙 Ink Chain (Kraken L2) NFT Radar & Trending Mints (OpenSea)'
  );

  const nftRobinhoodId = await getOrCreateChannel(
    catNft.id,
    'call-nft-robinhood',
    '👑 Robinhood Chain NFT Momentum & Floor Radar (OpenSea)'
  );

  const nftHyperEVMId = await getOrCreateChannel(
    catNft.id,
    'call-nft-hyperevm',
    '⚡ Hyperliquid HyperEVM L1 Native NFT Collections & Floor Radar (OpenSea)'
  );

  // Category 5: Oracles & Derivatives
  const perpsId = await getOrCreateChannel(
    catOracles.id,
    'call-whale-tracking',
    '🐋 Smart Trader & Whale Positioning Tracking (Hyperliquid: BTC, ETH, SOL)'
  );

  const predictionId = await getOrCreateChannel(
    catOracles.id,
    'call-prediction-markets',
    '🎯 Polymarket Prediction Market Arbitrage, Odds Mispricing, & Whale Bet Signals'
  );

  const ctAlphaId = await getOrCreateChannel(
    catOracles.id,
    'call-ct-alpha',
    '☀️ Smart Crypto Twitter (CT) & AI Alpha - Airdrop threads, AI Agent launches, & Smart Money Calls'
  );

  console.log('[DISCORD BOOTSTRAP] All OpenCatz 5 categories & 19 channels are ready!');

  return {
    controlRoomId,
    auditOnDemandId,
    logsId,
    journalId,
    memeSolanaId,
    memeRobinhoodId,
    memeBaseId,
    memeEthId,
    memeInkId,
    lpSolanaId,
    lpRobinhoodId,
    nftEthId,
    nftBaseId,
    nftInkId,
    nftRobinhoodId,
    nftHyperEVMId,
    perpsId,
    predictionId,
    ctAlphaId,
  };
}
