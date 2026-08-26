import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { CallCardPayload as CallSignalPayload } from '../../agents/shared/agent-contract.js';

/**
 * Sanitize attacker-controlled token/tweet fields before rendering into Discord
 * embeds. Token names/symbols come from chain data (GMGN/DexScreener) and can
 * contain markdown link syntax, code blocks, or newlines — a crafted symbol
 * could otherwise inject a clickable phishing link or break the embed layout.
 * Removes markdown-significant characters; keeps alphanumerics and common punctuation.
 */
export function sanitizeEmbedField(value: string | undefined | null, maxLen = 200): string {
  if (!value) return '';
  const cleaned = String(value)
    .replace(/[\r\n\t]+/g, ' ')            // collapse newlines/tabs first
    .replace(/https?:\/\/\S+/gi, ' [LINK] ') // strip raw URLs (prevent link injection)
    .replace(/[\[\](){}<>*_`|~\\]/g, '')   // then remove markdown link/code/bold/italic syntax
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}…` : cleaned;
}

/** Encode a symbol safely into a URL query component. */
export function encodeSymbolForUrl(symbol: string | undefined | null): string {
  const clean = sanitizeEmbedField(symbol, 32);
  return encodeURIComponent(clean || 'TOKEN');
}

/** Helper to ensure non-empty string for Discord Embed field value (min 1 char, max 1024 chars) */
function safeFieldValue(val: string | undefined | null, fallback = 'N/A', maxLen = 1000): string {
  const sanitized = val ? String(val).trim() : '';
  const result = sanitized || fallback;
  return result.length > maxLen ? `${result.slice(0, maxLen)}…` : result;
}

export function buildCallEmbed(payload: CallSignalPayload) {
  // OpenCatz Master Color Tokens
  const colorMap: Record<CallSignalPayload['domain'], number> = {
    MEME_SOLANA: 0x00e676, // Jade Spirit Green (Solana)
    MEME_EVM: 0xffb7b2,    // Pastel Pink (Meme EVM / Robinhood)
    PERPS: 0x0277bd,       // Denim Blue (Whale / Hyperliquid)
    NFT: 0xd6c7ff,         // Lavender Purple (Catz NFT / OpenSea)
    LP_METEORA: 0x80deea,  // Retro Cyan (Meteora DLMM)
    LP_ROBINHOOD: 0x80deea,// Retro Cyan (Uniswap V3 LP)
    PREDICTION: 0x00e5ff,  // Prediction Cyan (Polymarket)
    CT_ALPHA: 0xfff59d,    // Pastel Yellow (Twitter / X Alpha)
    WHALE: 0x0277bd,       // Denim Blue (Whale Watch)
  };

  const confidenceStr = payload.confidenceScore ? `${payload.confidenceScore}% CONFIDENCE` : 'HIGH CONFIDENCE';

  const embed = new EmbedBuilder()
    .setColor(colorMap[payload.domain] || 0xccff00)
    .setTimestamp()
    .setFooter({ text: '🐾 OpenCatz AI Multi-Chain Intelligence • DRY_RUN MODE ACTIVE' });

  const buttonsRow = new ActionRowBuilder<ButtonBuilder>();

  // ==========================================
  // DOMAIN 1: CT ALPHA (X / TWITTER)
  // ==========================================
  if (payload.domain === 'CT_ALPHA') {
    embed.setTitle(`☀️ SMART CT ALPHA: ${safeFieldValue(sanitizeEmbedField(payload.title, 150), 'Market Update')}`);
    
    if (payload.contractAddress && payload.contractAddress !== 'N/A') {
      embed.addFields({ name: '📍 Contract Mentioned', value: `\`${safeFieldValue(payload.contractAddress)}\``, inline: false });
    }

    embed.addFields(
      { name: '🐦 Source & Network', value: safeFieldValue(sanitizeEmbedField(payload.network, 40), 'X (Twitter)'), inline: true },
      { name: '🧠 AI Sentiment Score', value: `${confidenceStr}`, inline: true },
      { name: '💡 Actionable Takeaway', value: safeFieldValue(sanitizeEmbedField(payload.aiThesis, 500), 'Signal detected from verified Smart CT momentum activity.'), inline: false }
    );

    const tweetUrl = payload.dexScreenerUrl || 'https://x.com';
    buttonsRow.addComponents(
      new ButtonBuilder()
        .setLabel('🐦 View Tweet on X')
        .setURL(tweetUrl.startsWith('http') ? tweetUrl : 'https://x.com')
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setCustomId('start_channel_ct-alpha')
        .setLabel('⚡ Start CT Alpha')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('pause_channel_ct-alpha')
        .setLabel('⏸️ Pause CT Alpha')
        .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [buttonsRow] };
  }

  // ==========================================
  // DOMAIN 2: WHALE TRACKING (HYPERLIQUID SMART MONEY)
  // ==========================================
  if (payload.domain === 'WHALE') {
    embed.setTitle(`🐋 OPENCATZ WHALE WATCH: ${safeFieldValue(sanitizeEmbedField(payload.symbol, 20), 'MARKET')}`);

    const report = payload.whaleReport;
    const fmtM = (v: number) => (v >= 1_000_000 ? `$${(v / 1e6).toFixed(2)}M` : `$${(v / 1000).toFixed(0)}k`);
    const netStr = report ? `${report.netUsd >= 0 ? '🟢 +' : '🔴 '}${fmtM(Math.abs(report.netUsd))}` : 'N/A';

    if (report) {
      embed.addFields(
        { name: '⚖️ Net Positioning', value: `${netStr} (${report.longCount} long vs ${report.shortCount} short trader)`, inline: true },
        { name: '📊 Long / Short', value: `Long **${fmtM(report.totalLongUsd)}**\nShort **${fmtM(report.totalShortUsd)}**`, inline: true },
        { name: '🔗 Source', value: 'Hyperliquid PvP Leaderboard (30d)', inline: true }
      );

      const traderLines = (entries: Array<{ address: string; sizeUsd: number; returnPct: number }>, dir: string) =>
        entries.map((t) => {
          const short = `${t.address.slice(0, 6)}…${t.address.slice(-4)}`;
          const pct = t.returnPct ? ` (PvP ${t.returnPct.toFixed(1)}%)` : '';
          return `${dir} **${fmtM(t.sizeUsd)}** — [${short}](https://app.hyperliquid.xyz/explorer/address/${t.address})${pct}`;
        });

      const longLines = traderLines(report.longTraders, '🟢');
      const shortLines = traderLines(report.shortTraders, '🔴');

      if (longLines.length > 0) {
        embed.addFields({ name: `🧭 Long Positions (≥ $1M)`, value: safeFieldValue(longLines.slice(0, 5).join('\n')), inline: false });
      }
      if (shortLines.length > 0) {
        embed.addFields({ name: `🧭 Short Positions (≥ $1M)`, value: safeFieldValue(shortLines.slice(0, 5).join('\n')), inline: false });
      }
      if (report.spotFlow.length > 0) {
        embed.addFields({
          name: '📈 Spot Flow (5m, ≥ $100k)',
          value: safeFieldValue(report.spotFlow
            .slice(0, 4)
            .map((f) => `**${sanitizeEmbedField(f.market, 24)}**: Buy ${fmtM(f.buyUsd)} | Sell ${fmtM(f.sellUsd)} (${f.fillCount} fill)`)
            .join('\n')),
          inline: false,
        });
      }
    }

    if (payload.cexRadar && payload.cexRadar.length > 0) {
      const fmtUsd = (v: number) => (v >= 1_000_000_000 ? `$${(v / 1e9).toFixed(2)}B` : v >= 1_000_000 ? `$${(v / 1e6).toFixed(2)}M` : `$${(v / 1000).toFixed(0)}k`);
      const fmtOi = (v: number) => (v >= 1_000_000_000 ? `$${(v / 1e9).toFixed(1)}B` : `$${(v / 1e6).toFixed(1)}M`);
      const radarLines = payload.cexRadar.slice(0, 3).map((e) => {
        const parts: string[] = [];
        parts.push(`OI ${fmtOi(e.oiUsd)}${e.oiChange24hPct !== null ? ` (${e.oiChange24hPct >= 0 ? '+' : ''}${e.oiChange24hPct.toFixed(1)}%)` : ''}`);
        if (e.fundingRatePct !== null) parts.push(`Funding ${e.fundingRatePct.toFixed(3)}%`);
        if (e.topTraderLongRatio !== null && e.topTraderLongRatio !== undefined) parts.push(`TopTrader L/S ${e.topTraderLongRatio.toFixed(1)}x`);
        if (e.accountLongShortRatio !== null && e.accountLongShortRatio !== undefined) parts.push(`Akun L/S ${e.accountLongShortRatio.toFixed(1)}x`);
        if (e.prints.count > 0) {
          const net = e.prints.netBuyUsd - e.prints.netSellUsd;
          parts.push(`Prints ${e.prints.count}×≥$1M (net ${net >= 0 ? '+' : '-'}${fmtUsd(Math.abs(net))})`);
        } else {
          parts.push('Prints 0');
        }
        if (e.liq24hUsd !== null && e.liq24hUsd !== undefined) parts.push(`Liq 24h ${fmtUsd(e.liq24hUsd)}`);
        return `**${e.exchange === 'binance' ? 'Binance' : e.exchange === 'bybit' ? 'Bybit' : 'OKX'}**: ${parts.join(' | ')}`;
      });
      embed.addFields({ name: '🌐 CEX Radar (OI · Funding · L/S · Whale Prints)', value: safeFieldValue(radarLines.join('\n')), inline: false });
    }

    embed.addFields({ name: '💡 Ringkasan', value: safeFieldValue(sanitizeEmbedField(payload.aiThesis, 500), 'Arus likuiditas & akumulasi posisi institusional terdeteksi.'), inline: false });

    const hyperliquidUrl = payload.dexScreenerUrl || `https://app.hyperliquid.xyz/trade/${payload.symbol}`;
    buttonsRow.addComponents(
      new ButtonBuilder()
        .setLabel('🚀 Trade on Hyperliquid')
        .setURL(hyperliquidUrl.startsWith('http') ? hyperliquidUrl : 'https://app.hyperliquid.xyz')
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setCustomId('pause_channel_perps')
        .setLabel('⏸️ Pause Whale Tracking')
        .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [buttonsRow] };
  }

  // ==========================================
  // DOMAIN 3 & 4: CONCENTRATED LIQUIDITY (LP)
  // ==========================================
  if (payload.domain === 'LP_METEORA' || payload.domain === 'LP_ROBINHOOD') {
    const isMeteora = payload.domain === 'LP_METEORA';
    embed.setTitle(`🌊 OPENCATZ LP OPPORTUNITY: ${safeFieldValue(payload.title, 'Concentrated Pool')}`);

    if (payload.contractAddress) {
      embed.addFields({ name: '📍 Pool Address', value: `\`${safeFieldValue(payload.contractAddress)}\``, inline: false });
    }

    embed.addFields(
      { name: 'Network', value: safeFieldValue(payload.network, isMeteora ? 'Solana' : 'Robinhood Chain'), inline: true },
      { name: 'Pool TVL', value: safeFieldValue(payload.marketCap || payload.liquidity, 'N/A'), inline: true },
      { name: 'Est. 24h Fee APR', value: safeFieldValue(payload.feeApr, 'N/A'), inline: true }
    );

    // CA masing-masing token + chart link
    const token0Line = payload.token0Address
      ? `\`${payload.token0Address}\`\n🔗 [Chart DexScreener](${payload.token0ChartUrl ?? '#'})${payload.gmgnUrl ? ` • [GMGN](${payload.gmgnUrl})` : ''}`
      : 'N/A';
    const token1Line = payload.token1Address
      ? `\`${payload.token1Address}\`\n🔗 [Chart DexScreener](${payload.token1ChartUrl ?? '#'})`
      : 'N/A';
    embed.addFields(
      { name: `🪙 ${safeFieldValue(payload.token0Symbol, 'Token X')} (CA)`, value: token0Line, inline: false },
      { name: `🪙 ${safeFieldValue(payload.token1Symbol, 'Token Y')} (CA)`, value: token1Line, inline: false }
    );

    // Meme token details
    const token0Detail: string[] = [];
    if (payload.token0PriceUsd !== undefined) token0Detail.push(`💰 Price **$${payload.token0PriceUsd.toFixed(8)}**`);
    if (payload.token0MarketCapUsd !== undefined) token0Detail.push(`📈 MC **$${(payload.token0MarketCapUsd / 1000).toFixed(1)}k**`);
    if (payload.token0Volume24hUsd !== undefined) token0Detail.push(`💦 24h Vol **$${(payload.token0Volume24hUsd / 1000).toFixed(1)}k**`);
    if (payload.token0Holders !== undefined) token0Detail.push(`👥 Holders **${payload.token0Holders.toLocaleString()}**`);
    if (payload.token0AgeHours !== undefined) token0Detail.push(`🎂 Age **${payload.token0AgeHours.toFixed(1)}h**`);
    if (payload.token0SmartDegenCount !== undefined && payload.token0SmartDegenCount > 0) token0Detail.push(`🧠 Smart+KOL **${payload.token0SmartDegenCount}**`);
    if (token0Detail.length > 0) {
      embed.addFields({ name: `📊 Detail ${safeFieldValue(payload.token0Symbol, 'Token X')}`, value: safeFieldValue(token0Detail.join(' • ')), inline: false });
    }

    if (payload.tokenVerified !== undefined) {
      embed.addFields({
        name: '🛡️ Token Verification',
        value: payload.tokenVerified ? '✅ Verified (Meteora blue check)' : '⚠️ **Unverified** — likuiditas komunitas, DYOR',
        inline: true,
      });
    }

    if (payload.securityScore) {
      embed.addFields({ name: '🛡️ Token Security (GMGN)', value: safeFieldValue(sanitizeEmbedField(payload.securityScore, 250)), inline: false });
    }

    if (payload.lpStrategy) {
      embed.addFields({ name: '🎯 Recommended LP Range & Strategy', value: safeFieldValue(payload.lpStrategy), inline: false });
    }

    embed.addFields({ name: '💡 LP Yield AI Thesis', value: safeFieldValue(payload.aiThesis, 'Analisis yield velocity & fee capture optimal.'), inline: false });

    buttonsRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`pause_channel_${isMeteora ? 'lp-solana' : 'lp-robinhood'}`)
        .setLabel('⏸️ Pause LP Screening')
        .setStyle(ButtonStyle.Secondary)
    );

    if (payload.poolUrl && payload.poolUrl.startsWith('http')) {
      buttonsRow.addComponents(
        new ButtonBuilder()
          .setLabel(isMeteora ? '🌐 View on Meteora' : '🌐 View on Uniswap')
          .setURL(payload.poolUrl)
          .setStyle(ButtonStyle.Link)
      );
    }

    if (payload.token0ChartUrl && payload.token0ChartUrl.startsWith('http')) {
      buttonsRow.addComponents(
        new ButtonBuilder()
          .setLabel(`📊 Chart ${payload.token0Symbol || 'Token'}`)
          .setURL(payload.token0ChartUrl)
          .setStyle(ButtonStyle.Link)
      );
    }

    return { embeds: [embed], components: [buttonsRow] };
  }

  // ==========================================
  // DOMAIN 5: PREDICTION MARKETS (POLYMARKET)
  // ==========================================
  if (payload.domain === 'PREDICTION') {
    embed.setTitle(`🎯 OPENCATZ POLYMARKET ARBITRAGE: ${safeFieldValue(sanitizeEmbedField(payload.title, 150), 'Market Opportunity')}`);
    
    embed.addFields(
      { name: '🌐 Platform', value: safeFieldValue(sanitizeEmbedField(payload.network, 40), 'Polygon (Polymarket)'), inline: true },
      { name: '🎯 Recommended Outcome', value: `**${safeFieldValue(sanitizeEmbedField(payload.symbol, 20), 'YES/NO')}**`, inline: true },
      { name: '🟢 Swarm Confidence', value: confidenceStr, inline: true },
      { name: '💡 Polymarket AI Thesis', value: safeFieldValue(sanitizeEmbedField(payload.aiThesis, 500), 'Peluang odds mispricing dan probabilitas whale bet terdeteksi.'), inline: false }
    );

    const polyUrl = (payload.dexScreenerUrl && payload.dexScreenerUrl.startsWith('http')) ? payload.dexScreenerUrl : 'https://polymarket.com';
    buttonsRow.addComponents(
      new ButtonBuilder()
        .setCustomId('pause_channel_prediction')
        .setLabel('⏸️ Pause Polymarket Screening')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('📊 View Market on Polymarket')
        .setURL(polyUrl)
        .setStyle(ButtonStyle.Link)
    );

    return { embeds: [embed], components: [buttonsRow] };
  }

  // ==========================================
  // DOMAIN 6: NFT SNIPING (OPENSEA & CATZ NFT)
  // ==========================================
  if (payload.domain === 'NFT') {
    embed.setTitle(`🔮 OPENCATZ NFT SNIPE: ${safeFieldValue(sanitizeEmbedField(payload.title, 150), 'NFT Collection')} • [${confidenceStr}]`);

    const safeNftSymbol = sanitizeEmbedField(payload.symbol, 40);
    const safeNetwork = sanitizeEmbedField(payload.network, 20) || 'Robinhood Chain / EVM';
    embed.addFields(
      { name: 'Collection', value: safeFieldValue(safeNftSymbol, 'Catz NFT'), inline: true },
      { name: '⛓️ Chain', value: safeFieldValue(safeNetwork, 'EVM'), inline: true },
      { name: 'Price & Floor', value: safeFieldValue(sanitizeEmbedField(payload.priceUsd, 40), 'N/A'), inline: true },
      { name: 'Market Info', value: safeFieldValue(sanitizeEmbedField(payload.marketCap, 80), 'N/A'), inline: true },
      { name: '💡 NFT Rarity & Floor AI Thesis', value: safeFieldValue(sanitizeEmbedField(payload.aiThesis, 500), 'Momentum floor price surge dan whale sweep terdeteksi.'), inline: false }
    );

    if (payload.tokenVerified !== undefined) {
      embed.addFields({
        name: '✅ Verification Status',
        value: payload.tokenVerified ? '✅ **Verified** (Official collection)' : '⚠️ **Unverified** — DYOR, risiko lebih tinggi',
        inline: true,
      });
    }

    const openseaUrl = (payload.dexScreenerUrl && payload.dexScreenerUrl.startsWith('http')) ? payload.dexScreenerUrl : 'https://opensea.io';
    buttonsRow.addComponents(
      new ButtonBuilder()
        .setCustomId('pause_channel_nft')
        .setLabel('⏸️ Pause NFT Screening')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('📊 View Collection on OpenSea')
        .setURL(openseaUrl)
        .setStyle(ButtonStyle.Link)
    );

    return { embeds: [embed], components: [buttonsRow] };
  }

  // ==========================================
  // DOMAIN 7 & 8: MEME DEX TOKENS (SOLANA & EVM MULTICHAIN)
  // ==========================================
  const isSolana = payload.domain === 'MEME_SOLANA';
  const safeTitle = sanitizeEmbedField(payload.title) || 'Token';
  const safeSymbol = sanitizeEmbedField(payload.symbol, 32) || 'TOKEN';
  const networkName = payload.network || (isSolana ? 'Solana' : 'EVM');
  embed.setTitle(
    isSolana
      ? `🚀 OPENCATZ SOLANA MEME CALL: ${safeTitle} ($${safeSymbol}) • [${confidenceStr}]`
      : `🌸 OPENCATZ ${networkName.toUpperCase()} MEME CALL: ${safeTitle} ($${safeSymbol}) • [${confidenceStr}]`
  );

  if (payload.contractAddress) {
    const ageStr = payload.tokenAge ? ` • ⏱️ **Age:** ${payload.tokenAge}` : '';
    embed.addFields({
      name: '📍 Contract Address (CA)',
      value: `\`${payload.contractAddress}\`${ageStr}`,
      inline: false,
    });
  }

  const priceStr = payload.priceUsd ? ` | 💵 **Price:** ${payload.priceUsd}` : '';
  const volStr = (payload.volume5m || payload.volume1h)
    ? `\n📈 **Vol (5m / 1h):** ${payload.volume5m || 'N/A'} / ${payload.volume1h || 'N/A'}`
    : '';
  const txStr = payload.txRatio ? ` | ⚖️ **Tx:** ${payload.txRatio}` : '';

  embed.addFields({
    name: '📊 Market Metrics',
    value: `💰 **MC:** ${payload.marketCap || 'N/A'}${priceStr}\n💧 **Liquidity:** ${payload.liquidity || 'N/A'}${volStr}${txStr}`,
    inline: false,
  });

  const securityParts: string[] = [];
  if (payload.top10Pct) securityParts.push(`👥 **Top 10:** ${payload.top10Pct}`);
  if (payload.devHoldingPct) securityParts.push(`👨‍💻 **Dev:** ${payload.devHoldingPct}`);
  if (payload.sniperPct) securityParts.push(`🐋 **Snipers:** ${payload.sniperPct}`);
  if (payload.bundlerPct) securityParts.push(`🤖 **Bundler:** ${payload.bundlerPct}`);
  if (payload.dexPaidStatus) securityParts.push(`💳 **DEX Paid:** ${payload.dexPaidStatus}`);

  if (securityParts.length > 0) {
    embed.addFields({
      name: '🛡️ Security & Holder Audit',
      value: safeFieldValue(securityParts.join(' | ')),
      inline: false,
    });
  }

  if (payload.smartMoneyInfo) {
    embed.addFields({
      name: '🧠 Smart Money Tracking & AI Consensus',
      value: `${payload.smartMoneyInfo}\n🟢 **Swarm Consensus Score:** **${confidenceStr} (PASSED)**`,
      inline: false,
    });
  }

  if (payload.contractAddress) {
    const ca = payload.contractAddress;
    const gmgnLink = payload.gmgnUrl || `https://gmgn.ai/${isSolana ? 'sol' : 'base'}/token/${ca}`;
    const dexscreenerLink = payload.dexScreenerUrl || `https://dexscreener.com/${isSolana ? 'solana' : 'base'}/${ca}`;
    const rugcheckLink = payload.rugcheckUrl || `https://rugcheck.xyz/tokens/${ca}`;

    embed.addFields({
      name: '🔗 Independent Verification Links',
      value: `📊 [DexScreener](${dexscreenerLink}) | 📈 [GMGN Chart](${gmgnLink}) | 🛡️ [RugCheck](${rugcheckLink}) | 🐦 [X (Twitter) Search](https://x.com/search?q=%24${encodeSymbolForUrl(payload.symbol)}&src=typed_query)`,
      inline: false,
    });
  }

  embed.addFields({ name: '💡 AI Thesis & Signal Reasoning', value: safeFieldValue(sanitizeEmbedField(payload.aiThesis, 500), 'Analisis teknikal, likuiditas, dan audit on-chain valid.'), inline: false });

  // Call cards carry LINKS to the trading platform
  if (isSolana) {
    const jupiterUrl = payload.contractAddress
      ? `https://jup.ag/swap/SOL-${encodeSymbolForUrl(payload.contractAddress)}`
      : 'https://jup.ag';
    buttonsRow.addComponents(
      new ButtonBuilder()
        .setLabel('🚀 Trade on Jupiter')
        .setURL(jupiterUrl)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setCustomId('pause_channel_meme-solana')
        .setLabel('⏸️ Pause Solana Screening')
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    const uniswapUrl = payload.contractAddress
      ? `https://app.uniswap.org/explore/pools/robinhood/${payload.contractAddress}`
      : 'https://app.uniswap.org/explore/pools/robinhood';
    buttonsRow.addComponents(
      new ButtonBuilder()
        .setLabel('🌸 Trade on Uniswap')
        .setURL(uniswapUrl)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setCustomId('pause_channel_meme-robinhood')
        .setLabel('⏸️ Pause Robinhood Screening')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  if (payload.dexScreenerUrl || payload.contractAddress) {
    const url = payload.dexScreenerUrl || `https://dexscreener.com/${isSolana ? 'solana' : 'base'}/${payload.contractAddress}`;
    if (url.startsWith('http')) {
      buttonsRow.addComponents(
        new ButtonBuilder()
          .setLabel('📊 Chart on DexScreener')
          .setURL(url)
          .setStyle(ButtonStyle.Link)
      );
    }
  }

  return { embeds: [embed], components: [buttonsRow] };
}
