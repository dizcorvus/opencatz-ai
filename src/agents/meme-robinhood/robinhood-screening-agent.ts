import { GMGNAdapter, GMGNRawToken, SolChain } from '../../adapters/gmgn-adapter.js';
import { globalPriceFeedService } from '../../services/price-feed-service.js';
import { StrategyEngine } from '../../orchestrator/strategy-engine.js';
import type { ScreeningAgent, AgentReport, CallCardPayload } from '../shared/agent-contract.js';
import { createDedupe, preFilterToken, detectMemeSignal, volume24hOf, buildSignalBoostMap, applySignalBoost, toStrategyGmgn, buildMemeThesis, isGraduatedToken, validateMemeConfigUpdate, securityAuditGate, buildTrackAccumulation, trackAccumulationLabel } from '../shared/gmgn-meme-helpers.js';
import type { SignalBoostMap, TrackAccumulation } from '../shared/gmgn-meme-helpers.js';

export interface RobinhoodSignal {
  token: GMGNRawToken;
  signalType: 'CTO' | 'REVIVAL' | 'MOMENTUM' | 'NONE';
  confidence: number;
  reasons: string[];
}

export interface RobinhoodScreeningConfig {
  chains: SolChain[];        // ['robinhood', 'base', 'eth', 'bsc'] — EVM Meme Multi-Chain screening
  minVolume1hUsd: number;    // 50000 — real 1-HOUR volume (token must be active RIGHT NOW)
  minLiquidityUsd: number;   // 10000
  minMarketCapUsd: number;   // 100000 — required to be above $100k (MC 0/unknown = reject)
  minAgeHours: number;       // 0 — degen early: new tokens pass immediately (smart money/CTO/KOL decide)
  maxRugRatio: number;       // 0.3
  maxRatTraderRate: number;  // 0.3
  maxTop10HolderRate: number;// 0.4
  minTotalFeeUsd: number;    // 500 — active fee gate: tokens without organic activity (unrecorded fee) rejected
  passThreshold: number;     // 80
  signalTypes: number[];     // smart-money/KOL/CTO/price events (overlay boost)
  rankLimit: number;         // 100 (trending, 1h)
  trenchesLimit: number;     // 80 (completed only)
  hotSearchesLimit: number;  // 100 (hot searches, migrated)
  trackFeedEnabled: boolean; // true — smart-money trade feed = additional candidates (booster, not replacement)
  minTrackWallets: number;   // 2 — minimum smart-money wallets buying the same token
  minTrackBuyUsd: number;    // 10000 — minimum total buy USD
  trackFreshMinutes: number; // 30 — fresh accumulation window
}

const DEFAULT_CONFIG: RobinhoodScreeningConfig = {
  chains: ['robinhood', 'base', 'eth', 'bsc'],
  minVolume1hUsd: 50000,
  minLiquidityUsd: 10000,
  minMarketCapUsd: 100000,
  minAgeHours: 0,
  maxRugRatio: 0.3,
  maxRatTraderRate: 0.3,
  maxTop10HolderRate: 0.4,
  minTotalFeeUsd: 500,
  passThreshold: 80,
  // 6 PriceUp, 7 PriceATH, 8 McpKeyLevel, 11 Cto, 12 SmartDegenBuy, 13/19 PlatformCall, 20 KOLBuy
  signalTypes: [6, 7, 8, 11, 12, 13, 19, 20],
  rankLimit: 100,
  trenchesLimit: 80,
  hotSearchesLimit: 100,
  trackFeedEnabled: true,
  minTrackWallets: 2,
  minTrackBuyUsd: 10000,
  trackFreshMinutes: 30,
};

export class RobinhoodScreeningAgent implements ScreeningAgent<RobinhoodSignal> {
  readonly domain = 'meme-robinhood';
  private gmgn: GMGNAdapter;
  private priceFeed = globalPriceFeedService;
  private strategyEngine: StrategyEngine;
  private config: RobinhoodScreeningConfig;
  private dedupeTokens = createDedupe();

  constructor(config?: Partial<RobinhoodScreeningConfig>) {
    this.gmgn = new GMGNAdapter();
    this.strategyEngine = new StrategyEngine();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Runtime config update (chat tool `set_screening_config`). Whitelisted keys
   * only; invalid values are rejected, never silently clamped.
   */
  public updateConfig(partial: Record<string, unknown>): { applied: Record<string, unknown>; rejected: string[] } {
    const { applied, rejected } = validateMemeConfigUpdate(partial);
    if (Array.isArray(partial.chains)) {
      const validChains = partial.chains.filter((c): c is SolChain => ['robinhood', 'base', 'eth', 'bsc', 'sol'].includes(c as any));
      if (validChains.length > 0) {
        applied.chains = validChains;
      } else {
        rejected.push('chains: must be an array of valid chains (e.g. ["robinhood", "base", "eth", "bsc"])');
      }
    }
    this.config = { ...this.config, ...applied };
    if (Object.keys(applied).length > 0) {
      console.log(`[EVM MEME AGENT] Config updated: ${JSON.stringify(applied)}`);
    }
    return { applied, rejected };
  }

  public getConfig(): RobinhoodScreeningConfig {
    return { ...this.config };
  }

  /**
   * Collect candidates across all configured EVM chains (Robinhood, Base, ETH, BSC):
   * 1. Trending rank (interval 1h, is_out_market filter) — tokens currently rising
   * 2. Trenches completed — just finished bonding curve -> DEX
   * 3. Hot searches (migrated) — most-searched tokens
   */
  public async collectCandidates(): Promise<GMGNRawToken[]> {
    const allChainCandidates = await Promise.all(
      this.config.chains.map(async (chain) => {
        try {
          const [rank, trenches, hotSearches] = await Promise.all([
            this.gmgn.fetchRank(chain, {
              interval: '1h',
              limit: Math.min(this.config.rankLimit, 60),
              filters: ['not_honeypot', 'verified', 'renounced', 'is_out_market'],
            }),
            this.gmgn.fetchTrenches(chain, {
              types: ['completed'],
              limit: Math.min(this.config.trenchesLimit, 50),
              filters: { max_rug_ratio: 0.3, max_insider_ratio: 0.3 },
            }),
            this.gmgn.fetchHotSearches({
              chain,
              interval: '1h',
              limit: Math.min(this.config.hotSearchesLimit, 60),
              filters: ['migrated', 'not_honeypot', 'verified', 'renounced'],
            }),
          ]);

          return [...rank, ...trenches.completed, ...hotSearches];
        } catch (err: any) {
          console.warn(`[EVM MEME AGENT] Failed to fetch candidates for chain ${chain}: ${err.message}`);
          return [];
        }
      })
    );

    const candidates = allChainCandidates.flat();
    return this.dedupeTokens.dedupe(candidates);
  }

  /**
   * Signal booster map across all configured chains (analytical overlay):
   * Fail-open: any error -> empty map, screening proceeds unchanged.
   */
  public async collectSignalBoostMap(): Promise<SignalBoostMap> {
    try {
      const allEvents = await Promise.all(
        this.config.chains.map(async (chain) => {
          try {
            return await this.gmgn.fetchTokenSignals(chain, this.config.signalTypes);
          } catch {
            return [];
          }
        })
      );
      return buildSignalBoostMap(allEvents.flat());
    } catch (err: any) {
      console.warn(`[EVM MEME AGENT] Signal booster failed (skipped): ${err.message}`);
      return new Map();
    }
  }

  /**
   * Smart-money/KOL trade feed per token (accumulation) across all chains:
   * Fail-open: error → empty map, screening proceeds as usual.
   */
  public async collectTrackAccumulation(): Promise<Map<string, TrackAccumulation>> {
    if (!this.config.trackFeedEnabled) return new Map();
    try {
      const allTrades = await Promise.all(
        this.config.chains.map(async (chain) => {
          try {
            const [sm, kol] = await Promise.all([
              this.gmgn.fetchTrackTrades(chain, 'smartmoney').catch(() => []),
              this.gmgn.fetchTrackTrades(chain, 'kol').catch(() => []),
            ]);
            return [...sm, ...kol];
          } catch {
            return [];
          }
        })
      );
      const acc = buildTrackAccumulation(allTrades.flat());
      if (acc.size > 0) {
        console.log(`[EVM MEME AGENT] Track feed: ${acc.size} tokens with smart-money/KOL activity across [${this.config.chains.join(', ')}].`);
      }
      return acc;
    } catch (err: any) {
      console.warn(`[EVM MEME AGENT] Track feed failed (skipped): ${err.message}`);
      return new Map();
    }
  }

  /**
   * Additional candidates from the track feed across chains:
   */
  public async collectTrackCandidates(acc: Map<string, TrackAccumulation>): Promise<GMGNRawToken[]> {
    if (!this.config.trackFeedEnabled || acc.size === 0) return [];
    const nowSec = Date.now() / 1000;
    const out: GMGNRawToken[] = [];
    for (const a of acc.values()) {
      if (a.buyWalletCount < this.config.minTrackWallets) continue;
      if (a.totalBuyUsd < this.config.minTrackBuyUsd) continue;
      if (nowSec - a.lastBuyAt > this.config.trackFreshMinutes * 60) continue;
      for (const chain of this.config.chains) {
        try {
          const info = await this.gmgn.fetchTokenInfo(chain, a.address);
          if (info) {
            out.push(info);
            break;
          }
        } catch { /* try next chain */ }
      }
    }
    if (out.length > 0) {
      console.log(`[EVM MEME AGENT] New track candidates: ${out.length} tokens (smart-money accumulation, passed threshold).`);
    }
    return out;
  }

  /** Fail-closed pre-filter (pure math; native price fetched once per pass) */
  public preFilter(t: GMGNRawToken, nativePriceUsd: number | null = null): { ok: boolean; reason: string } {
    return preFilterToken(t, this.config, nativePriceUsd);
  }

  /** Detect signal type + deterministic confidence (0-100) */
  public detectSignal(t: GMGNRawToken): { type: 'CTO'|'REVIVAL'|'MOMENTUM'|'NONE'; confidence: number; reasons: string[] } {
    return detectMemeSignal(t);
  }

  /** Build call-card payload with exact chain parameters and verification links */
  public buildPayload(t: GMGNRawToken, confidence: number, thesis: string, trackLabel?: string): CallCardPayload {
    const ageHours = t.creationTimestamp !== null ? (Date.now()/1000 - t.creationTimestamp)/3600 : null;
    const total = t.buys + t.sells;
    const txRatio = total > 0 ? `Buy ${((t.buys/total)*100).toFixed(0)}% / Sell ${((t.sells/total)*100).toFixed(0)}%` : 'N/A';
    const devStr = t.devTeamHoldRate !== null ? `${(t.devTeamHoldRate*100).toFixed(1)}%${t.creatorClose ? ' (CLOSED)' : ''}` : (t.creatorClose ? 'CLOSED' : 'N/A');
    const rugStr = t.rugRatio !== null ? `${(t.rugRatio*100).toFixed(1)}%` : 'N/A';
    const bundlerStr = t.bundlerRate !== null ? `${(t.bundlerRate*100).toFixed(1)}%` : 'N/A';
    const top10Str = t.top10HolderRate !== null ? `${(t.top10HolderRate*100).toFixed(1)}%` : 'N/A';
    const smStr = trackLabel
      ? `🧠 **Smart Money:** ${trackLabel}`
      : `🧠 **Smart Traders:** ${t.smartDegenCount} wallets (+${t.creatorClose ? 'dev closed' : 'monitoring'})`;

    const chainNameMap: Record<string, { label: string; chainId: number; dexscreenerChain: string }> = {
      robinhood: { label: 'Robinhood Chain', chainId: 4663, dexscreenerChain: 'robinhood' },
      base: { label: 'Base L2', chainId: 8453, dexscreenerChain: 'base' },
      eth: { label: 'Ethereum Mainnet', chainId: 1, dexscreenerChain: 'ethereum' },
      bsc: { label: 'BNB Chain (BSC)', chainId: 56, dexscreenerChain: 'bsc' },
      sol: { label: 'Solana', chainId: 0, dexscreenerChain: 'solana' },
    };
    const cMeta = chainNameMap[t.chain] || { label: t.chain.toUpperCase(), chainId: 1, dexscreenerChain: t.chain };

    return {
      domain: 'MEME_EVM',
      title: `${t.name} (${t.symbol})`,
      symbol: t.symbol,
      contractAddress: t.address,
      network: cMeta.label,
      tokenAge: ageHours !== null ? `${ageHours.toFixed(1)}h` : 'N/A',
      priceUsd: t.priceUsd > 0 ? `$${t.priceUsd}` : 'N/A',
      marketCap: t.marketCapUsd > 0 ? `$${(t.marketCapUsd/1000).toFixed(1)}k` : 'N/A',
      liquidity: t.liquidityUsd > 0 ? `$${(t.liquidityUsd/1000).toFixed(1)}k` : 'N/A',
      volume5m: 'N/A',
      volume1h: 'N/A',
      volume24h: (() => { const v = volume24hOf(t); return v > 0 ? `$${(v/1000).toFixed(1)}k` : 'N/A'; })(),
      txRatio,
      top10Pct: top10Str,
      devHoldingPct: devStr,
      sniperPct: 'N/A',
      bundlerPct: bundlerStr,
      dexPaidStatus: t.dexscrBoostFee > 0 ? `✅ $${t.dexscrBoostFee} boost` : (t.dexscrAd ? '✅ DexScreener ad' : 'None'),
      smartMoneyInfo: smStr,
      confidenceScore: confidence,
      securityScore: rugStr,
      aiThesis: thesis,
      gmgnUrl: `https://gmgn.ai/${t.chain}/token/${t.address}`,
      dexScreenerUrl: `https://dexscreener.com/${cMeta.dexscreenerChain}/${t.address}`,
      rugcheckUrl: `https://gopluslabs.io/token-security/${cMeta.chainId}/${t.address}`,
      securityAuditPassed: true,
      socialHypeScore: confidence,
      liquidityUsd: t.liquidityUsd,
      volume1hUsd: t.volume1hUsd > 0 ? t.volume1hUsd : volume24hOf(t) / 24,
    };
  }

  /** Full pass: collect across all chains -> prefilter -> audit -> detect -> report */
  public async runScreeningPass(): Promise<AgentReport<RobinhoodSignal>[]> {
    console.log(`[EVM MEME AGENT] Multi-chain screening pass started for [${this.config.chains.join(', ')}] (GMGN OpenAPI)...`);
    const reports: AgentReport<RobinhoodSignal>[] = [];

    // 0. Fetch live native prices (ETH, BNB) for accurate multi-chain fee conversions
    let ethPrice: number | null = null;
    let bnbPrice: number | null = null;
    try {
      [ethPrice, bnbPrice] = await Promise.all([
        this.priceFeed.getPrice('ETH').catch(() => null),
        this.priceFeed.getPrice('BNB').catch(() => null),
      ]);
      console.log(`[EVM MEME AGENT] Native prices: ETH = ${ethPrice ? '$' + ethPrice.toFixed(2) : 'N/A'} | BNB = ${bnbPrice ? '$' + bnbPrice.toFixed(2) : 'N/A'}`);
    } catch (err: any) {
      console.warn(`[EVM MEME AGENT] Failed to fetch native prices: ${err.message}`);
    }

    // 1. Collect candidates across all chains + signal booster + track feed
    const [candidates, signalBoostMap, trackAcc] = await Promise.all([
      this.collectCandidates(),
      this.collectSignalBoostMap(),
      this.collectTrackAccumulation(),
    ]);
    const trackCandidates = await this.collectTrackCandidates(trackAcc);

    // Merge by address
    const merged = new Map<string, GMGNRawToken>();
    for (const t of [...candidates, ...trackCandidates]) merged.set(t.address.toLowerCase(), t);
    const allCandidates = [...merged.values()];
    if (signalBoostMap.size > 0) {
      console.log(`[EVM MEME AGENT] Signal overlay: ${signalBoostMap.size} tokens with smart-money/KOL/CTO events.`);
    }

    // 2. Pre-filter & detect
    for (const t of allCandidates) {
      // Graduated-only: reject tokens still on bonding curves
      if (!isGraduatedToken(t)) {
        console.log(`[EVM MEME AGENT] ⛔ [${t.chain.toUpperCase()}] ${t.symbol}: not yet graduated (bonding curve).`);
        continue;
      }

      const nativePriceUsd = t.chain === 'bsc' ? bnbPrice : ethPrice;
      const filter = this.preFilter(t, nativePriceUsd);
      if (!filter.ok) {
        console.log(`[EVM MEME AGENT] [${t.chain.toUpperCase()}] ${filter.reason}`);
        continue;
      }

      // Security audit per chain (fail-closed)
      const audit = await this.gmgn.fetchTokenSecurity(t.chain, t.address);
      const sec = securityAuditGate(audit);
      if (!sec.ok) {
        console.log(`[EVM MEME AGENT] ⛔ [${t.chain.toUpperCase()}] ${t.symbol}: AUDIT FAIL — ${sec.reasons.join(' ')}`);
        continue;
      }

      let det = applySignalBoost(this.detectSignal(t), signalBoostMap, t.address);
      const trackEntry = trackAcc.get(t.address.toLowerCase());
      const trackLabel = trackEntry ? trackAccumulationLabel(trackEntry) : undefined;
      if (trackEntry && trackEntry.buyWalletCount >= 3 && det.type !== 'NONE') {
        det = {
          ...det,
          confidence: Math.min(100, det.confidence + 20),
          reasons: [...det.reasons, `⚡ Cluster of ${trackEntry.buyWalletCount} smart-money wallets bought $${(trackEntry.totalBuyUsd / 1000).toFixed(0)}k (+20)`],
        };
      }
      if (det.type === 'NONE' || det.confidence < this.config.passThreshold) {
        console.log(`[EVM MEME AGENT] ⚪ [${t.chain.toUpperCase()}] ${t.symbol}: ${det.type} ${det.confidence}% < ${this.config.passThreshold}% (${det.reasons.join(' | ')})`);
        continue;
      }

      // Strategy extension layer
      let confidence = det.confidence;
      let strategyReason = '';
      try {
        const strat = this.strategyEngine.getActiveStrategy('meme-robinhood');
        if (strat?.evaluate) {
          const ev = this.strategyEngine.runStrategySafely(strat, 'evaluate', {
            domain: 'MEME_EVM', symbol: t.symbol, contractAddress: t.address,
            priceUsd: t.priceUsd, liquidityUsd: t.liquidityUsd,
            volume24hUsd: volume24hOf(t), volume1hUsd: t.volume1hUsd > 0 ? t.volume1hUsd : volume24hOf(t)/24,
            smartMoneyCount: t.smartDegenCount, securityAuditPassed: true,
            socialHypeScore: confidence,
            gmgn: { ...toStrategyGmgn(t), native_price_usd: nativePriceUsd },
          });
          if (ev?.recommendedAction === 'SKIP') {
            console.log(`[EVM MEME AGENT] ⛔ [${t.chain.toUpperCase()}] ${t.symbol}: strategy rejected (${ev.reason})`);
            continue;
          }
          if (ev && typeof ev.confidence === 'number') {
            confidence = Math.round(confidence * 0.7 + Math.max(0, Math.min(100, ev.confidence)) * 0.3);
            strategyReason = ev.reason || '';
          }
        }
      } catch (err: any) { console.warn(`[EVM MEME AGENT] Strategy failed: ${err.message}`); }

      // Fail-closed: require >= passThreshold
      if (confidence < this.config.passThreshold) {
        console.log(`[EVM MEME AGENT] ⚪ [${t.chain.toUpperCase()}] ${t.symbol}: ${det.type} ${confidence}% < ${this.config.passThreshold}% (post-strategy)`);
        continue;
      }

      const thesis = buildMemeThesis(t, det.type, confidence, det.reasons, strategyReason);
      const payload = this.buildPayload(t, confidence, thesis, trackLabel);
      const signal: RobinhoodSignal = { token: t, signalType: det.type, confidence, reasons: det.reasons };
      reports.push({ passed: true, signal, reason: thesis, confidence, payload });
      console.log(`[EVM MEME AGENT] 🎯 [${t.chain.toUpperCase()}] ${det.type} ${t.symbol} ${confidence}%`);
    }

    console.log(`[EVM MEME AGENT] Pass complete. ${reports.length} signals passed across [${this.config.chains.join(', ')}].`);
    return reports;
  }

  public toStrategyGmgn(t: GMGNRawToken): Record<string, unknown> {
    return toStrategyGmgn(t);
  }
}
